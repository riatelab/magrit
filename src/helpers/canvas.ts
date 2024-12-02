// Imports from other packages
import d3 from './d3-custom';

// Stores
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { globalStore } from '../store/GlobalStore';

// Helpers
import { getClassifier } from './classification';
import { makeHexColorWithAlpha } from './color';
import { isFiniteNumber } from './common';
import { PropSizer } from './geo';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type LayerDescription,
  type LayerDescriptionCategoricalChoropleth,
  type LayerDescriptionChoropleth,
  LayerDescriptionDiscontinuity, LayerDescriptionLabels,
  LayerDescriptionLinks,
  type LayerDescriptionProportionalSymbols,
} from '../global.d';

const useDefaultRenderer = new Set([
  'default',
  'cartogram',
  'graticule',
]);

const useChoroplethRenderer = new Set([
  'choropleth',
  'grid',
  'smoothed',
]);

const sphereRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescription,
) => {
  ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
  ctx.lineWidth = layer.strokeWidth;
  ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
  ctx.beginPath();
  path({ type: 'Sphere' });
  ctx.fill();
  ctx.stroke();
};

const defaultRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescription,
) => {
  ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
  ctx.lineWidth = layer.strokeWidth;

  switch (layer.type) {
    case 'point':
      path.pointRadius(layer.symbolSize!);
    case 'polygon': // eslint-disable-line no-fallthrough
      ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        ctx.beginPath();
        path(layer.data.features[i]);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'linestring':
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        ctx.beginPath();
        path(layer.data.features[i]);
        ctx.stroke();
      }
      break;
    default:
      break;
  }
};

const choroplethRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionChoropleth,
) => {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, layer.rendererParameters.breaks);
  const pal = layer.rendererParameters.palette.colors;

  switch (layer.type) {
    case 'point':
      path.pointRadius(layer.symbolSize!);
    case 'polygon': // eslint-disable-line no-fallthrough
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        ctx.fillStyle = makeHexColorWithAlpha(
          pal[classifier.getClass(+ft.properties[layer.rendererParameters.variable])],
          layer.fillOpacity,
        );
        ctx.beginPath();
        path(ft);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'linestring':
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        ctx.beginPath();
        ctx.strokeStyle = makeHexColorWithAlpha(
          pal[classifier.getClass(+ft.properties[layer.rendererParameters.variable])],
          layer.fillOpacity,
        );
        ctx.lineWidth = layer.strokeWidth;
        path(layer.data.features[i]);
        ctx.stroke();
      }
      break;
    default:
      break;
  }
};

const categoricalChoroplethRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionCategoricalChoropleth,
) => {
  const colorsMap = new Map<string | number | null | undefined, string>(
    layer.rendererParameters.mapping.map(({ value, color }) => [value, color]),
  );
  colorsMap.set('', layer.rendererParameters.noDataColor);
  colorsMap.set(null, layer.rendererParameters.noDataColor);
  colorsMap.set(undefined, layer.rendererParameters.noDataColor);

  switch (layer.type) {
    case 'point':
      path.pointRadius(layer.symbolSize!);
    case 'polygon': // eslint-disable-line no-fallthrough
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        ctx.fillStyle = makeHexColorWithAlpha(
          colorsMap.get(ft.properties[layer.rendererParameters.variable]),
          layer.fillOpacity,
        );
        ctx.beginPath();
        path(ft);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'linestring':
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        ctx.beginPath();
        ctx.strokeStyle = makeHexColorWithAlpha(
          colorsMap.get(ft.properties[layer.rendererParameters.variable]),
          layer.fillOpacity,
        );
        ctx.lineWidth = layer.strokeWidth;
        path(layer.data.features[i]);
        ctx.stroke();
      }
      break;
    default:
      break;
  }
};

const proportionalSymbolsRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionProportionalSymbols,
) => {
  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  // eslint-disable-next-line no-nested-ternary
  const getColor = layer.rendererParameters.colorMode === 'singleColor'
    ? () => layer.rendererParameters.color
    // eslint-disable-next-line no-nested-ternary
    : layer.rendererParameters.colorMode === 'positiveNegative'
      ? (properties: Record<string, any>) => {
        const value = +properties[layer.rendererParameters.variable];
        return value >= 0
          ? layer.rendererParameters.color[0]
          : layer.rendererParameters.color[1];
      }
      : layer.rendererParameters.colorMode === 'ratioVariable'
        ? (() => {
          const Cls = getClassifier(ClassificationMethod.manual);
          const classifier = new Cls(null, null, layer.rendererParameters.color.breaks);

          return (properties: Record<string, any>) => {
            const value = properties[layer.rendererParameters.color.variable];
            return isFiniteNumber(value)
              ? layer.rendererParameters.color.palette.colors[classifier.getClass(+value)]
              : layer.rendererParameters.color.noDataColor;
          };
        })()
        : (() => {
          const map = new Map<string | number | null | undefined, string>(
            layer.rendererParameters.color.mapping.map(({ value, color }) => [value, color]),
          );
          map.set('', layer.rendererParameters.color.noDataColor);
          map.set(null, layer.rendererParameters.color.noDataColor);
          map.set(undefined, layer.rendererParameters.color.noDataColor);

          return (properties: Record<string, any>) => map
            .get(properties[layer.rendererParameters.color.variable]);
        })();

  switch (layer.rendererParameters.symbolType) {
    case 'circle':
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        console.log(getColor(ft.properties));
        ctx.fillStyle = makeHexColorWithAlpha(
          getColor(ft.properties),
          layer.fillOpacity,
        );
        ctx.beginPath();
        path.pointRadius(propSize.scale(+ft.properties[layer.rendererParameters.variable]));
        path(ft);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'square':
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
        const ft = layer.data.features[i];
        const centroid = path.centroid(ft);
        const size = propSize.scale(+ft.properties[layer.rendererParameters.variable]);
        console.log(getColor(ft.properties));
        ctx.fillStyle = makeHexColorWithAlpha(
          getColor(ft.properties),
          layer.fillOpacity,
        );
        ctx.beginPath();
        ctx.rect(centroid[0] - size / 2, centroid[1] - size / 2, size, size);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'line':
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      break;
    default:
      break;
  }
};

const discontinuityRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionDiscontinuity,
) => {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, layer.rendererParameters.breaks);

  // Same color for all the features
  ctx.strokeStyle = makeHexColorWithAlpha(
    layer.strokeColor,
    layer.strokeOpacity,
  );

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
    const ft = layer.data.features[i];
    const classIx = classifier.getClass(+ft.properties.value);
    ctx.lineWidth = layer.rendererParameters.sizes[classIx];
    ctx.beginPath();
    path(ft);
    ctx.stroke();
  }
};

const linksRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionLinks,
) => {
  ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
  if (layer.rendererParameters.sizeType === 'fixed') {
    const size = layerDescription.strokeWidth;
    for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
      const ft = layer.data.features[i];
      ctx.lineWidth = size;
      ctx.beginPath();
      path(ft);
      ctx.stroke();
    }
  } else if (layer.rendererParameters.sizeType === 'proportional') {
    const propSize = new PropSizer(
      layer.rendererParameters.proportional.referenceValue,
      layer.rendererParameters.proportional.referenceRadius,
      'line',
    );
    for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
      const ft = layer.data.features[i];
      ctx.lineWidth = propSize.scale(+ft.properties.Intensity) + 0.35;
      ctx.beginPath();
      path(ft);
      ctx.stroke();
    }
  } else if (layer.rendererParameters.sizeType === 'graduated') {
    const Cls = getClassifier(ClassificationMethod.manual);
    const classifier = new Cls(null, null, layer.rendererParameters.classification.breaks);
    for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
      const ft = layer.data.features[i];
      ctx.lineWidth = layer.rendererParameters
        .classification.sizes[classifier.getClass(+ft.properties.Intensity)];
      ctx.beginPath();
      path(ft);
      ctx.stroke();
    }
  }
};

const labelsRenderer = (
  ctx: CanvasRenderingContext2D,
  path: ReturnType<typeof d3.geoPath>,
  layer: LayerDescriptionLabels,
) => {
  ctx.lineWidth = layer.strokeWidth;

  for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
    const ft = layer.data.features[i];
    const centroid = path.centroid(ft);
    const fontSize = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].fontSize
      : layer.rendererParameters.default.fontSize;
    const fontFamily = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].fontFamily
      : layer.rendererParameters.default.fontFamily;
    const fontColor = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].fontColor
      : layer.rendererParameters.default.fontColor;
    const fontStyle = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].fontStyle
      : layer.rendererParameters.default.fontStyle;
    const fontWeight = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].fontWeight
      : layer.rendererParameters.default.fontWeight;
    const offsetX = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].textOffset[0]
      : layer.rendererParameters.default.textOffset[0];
    const offsetY = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].textOffset[1]
      : layer.rendererParameters.default.textOffset[1];
    const textAnchor = layer.rendererParameters.specific[i]
      ? layer.rendererParameters.specific[i].textAnchor
      : layer.rendererParameters.default.textAnchor;

    ctx.textAlign = textAnchor;
    ctx.textBaseline = 'middle';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = makeHexColorWithAlpha(fontColor, 1);
    // ctx.strokeStyle = makeHexColorWithAlpha('#ff0000', layer.fillOpacity);
    ctx.fillText(
      ft.properties[layer.rendererParameters.variable],
      centroid[0] + offsetX,
      centroid[1] + offsetY,
    );
    // ctx.strokeText(
    //   ft.properties[layer.rendererParameters.variable],
    //   centroid[0] + offsetX,
    //   centroid[1] + offsetY,
    // );
  }
};

const draw = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) => {
  const ctx = canvas.getContext('2d')!;
  const path = d3.geoPath()
    .projection(globalStore.projection)
    .digits(0)
    .context(ctx);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // ctx.translate(translate[0], translate[1]);
  // ctx.scale(scale, scale);

  layersDescriptionStore.layers
    .filter((layer) => layer.visible)
    .forEach((layer) => {
      if (layer.data.type === 'Sphere') {
        sphereRenderer(ctx, path, layer);
      } else if (useDefaultRenderer.has(layer.representationType)) {
        defaultRenderer(ctx, path, layer);
      } else if (useChoroplethRenderer.has(layer.representationType)) {
        choroplethRenderer(ctx, path, layer as LayerDescriptionChoropleth);
      } else if (layer.representationType === 'categoricalChoropleth') {
        categoricalChoroplethRenderer(ctx, path, layer as LayerDescriptionCategoricalChoropleth);
      } else if (layer.representationType === 'proportionalSymbols') {
        proportionalSymbolsRenderer(ctx, path, layer as LayerDescriptionProportionalSymbols);
      } else if (layer.representationType === 'discontinuity') {
        discontinuityRenderer(ctx, path, layer as LayerDescriptionDiscontinuity);
      } else if (layer.representationType === 'links') {
        linksRenderer(ctx, path, layer as LayerDescriptionLinks);
      } else if (layer.representationType === 'labels') {
        labelsRenderer(ctx, path, layer as LayerDescriptionLabels);
      }
    });

  ctx.restore();
};

export default draw;
