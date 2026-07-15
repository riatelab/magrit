// Imports from solid-js
import { createMemo, For, JSX } from 'solid-js';

// GeoJSON Types
import type { Point } from 'geojson';

// Import from other libs
import { CompositionUtils, tricolore, tricoloreSextant } from 'tricolore';

// Helpers
import { isFiniteNumber } from '../../helpers/common';
import { getSymbolPath } from '../../helpers/svg';
import { mergeFilterIds } from './common.tsx';
import d3 from '../../helpers/d3-custom';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  type LayerDescriptionTrivariateChoropleth,
  TriChoroContinuousOpts,
  TriChoroDiscreteOpts,
  TriChoroSextantOpts,
  TricoloreScaleType,
  type TrivariateChoroplethParameters,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function trivariateChoroplethPolygonRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  const values = createMemo(() => {
    const seriesVar1 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable1] as number);

    const seriesVar2 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable2] as number);

    const seriesVar3 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable3] as number);

    return seriesVar1.map((pt, i) => {
      if (
        isFiniteNumber(pt)
        && isFiniteNumber(seriesVar2[i])
        && isFiniteNumber(seriesVar3[i])
      ) {
        return [+pt, +seriesVar2[i], +seriesVar3[i]];
      }
      return null;
    });
  });

  const center = createMemo(() => (rendererParameters().meanCentered
    ? CompositionUtils.centre(values().filter((d) => d !== null) as [number, number, number][])
    : [1 / 3, 1 / 3, 1 / 3]));

  const colors = createMemo(() => {
    if (rendererParameters().colorScaleType === TricoloreScaleType.Sextant) {
      return tricoloreSextant(values(), {
        center: center(),
        values: (rendererParameters().colorScaleOptions as TriChoroSextantOpts).colors,
      });
    }
    return tricolore(values(), {
      center: center(),
      breaks: rendererParameters().colorScaleType === TricoloreScaleType.Discrete
        ? (rendererParameters().colorScaleOptions as TriChoroDiscreteOpts).classes
        : 100,
      hue: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).hue,
      chroma: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).chroma,
      lightness: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).lightness,
      contrast: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).contrast,
      spread: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).spread,
    });
  });

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    shape-rendering={
      (layerDescription.strokeWidth === 0 || layerDescription.strokeOpacity === 0)
        ? 'crispEdges'
        : layerDescription.shapeRendering
    }
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={d3.geoStitch(layerDescription.data).features}>
      {
        (feature, i) => <path
          fill={colors()[i()] ?? rendererParameters().noDataColor}
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function trivariateChoroplethLineRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  const values = createMemo(() => {
    const seriesVar1 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable1] as number);

    const seriesVar2 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable2] as number);

    const seriesVar3 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable3] as number);

    return seriesVar1.map((pt, i) => {
      if (
        isFiniteNumber(pt)
        && isFiniteNumber(seriesVar2[i])
        && isFiniteNumber(seriesVar3[i])
      ) {
        return [+pt, +seriesVar2[i], +seriesVar3[i]];
      }
      return null;
    });
  });

  const center = createMemo(() => (rendererParameters().meanCentered
    ? CompositionUtils.centre(values())
    : [1 / 3, 1 / 3, 1 / 3]));

  const colors = createMemo(() => {
    if (rendererParameters().colorScaleType === TricoloreScaleType.Sextant) {
      return tricoloreSextant(
        values(),
        center(),
        (rendererParameters().colorScaleOptions as TriChoroSextantOpts).colors,
      );
    }
    return tricolore(values(), {
      center: center(),
      breaks: rendererParameters().colorScaleType === TricoloreScaleType.Discrete
        ? (rendererParameters().colorScaleOptions as TriChoroDiscreteOpts).classes
        : 100,
      hue: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).hue,
      chroma: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).chroma,
      lightness: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).lightness,
      contrast: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).contrast,
      spread: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).spread,
    });
  });

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature, i) => <path
          stroke={'grey'}
          fill={colors()[i()] ?? rendererParameters().noDataColor}
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function trivariateChoroplethPointRenderer(
  layerDescription: LayerDescriptionTrivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as TrivariateChoroplethParameters,
  );

  const values = createMemo(() => {
    const seriesVar1 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable1] as number);

    const seriesVar2 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable2] as number);

    const seriesVar3 = layerDescription.data.features
      .map((f) => f.properties![rendererParameters().variable3] as number);

    return seriesVar1.map((pt, i) => {
      if (
        isFiniteNumber(pt)
        && isFiniteNumber(seriesVar2[i])
        && isFiniteNumber(seriesVar3[i])
      ) {
        return [+pt, +seriesVar2[i], +seriesVar3[i]];
      }
      return null;
    });
  });

  const center = createMemo(() => (rendererParameters().meanCentered
    ? CompositionUtils.centre(values())
    : [1 / 3, 1 / 3, 1 / 3]));

  const colors = createMemo(() => {
    if (rendererParameters().colorScaleType === TricoloreScaleType.Sextant) {
      return tricoloreSextant(
        values(),
        center(),
        (rendererParameters().colorScaleOptions as TriChoroSextantOpts).colors,
      );
    }
    return tricolore(values(), {
      center: center(),
      breaks: rendererParameters().colorScaleType === TricoloreScaleType.Discrete
        ? (rendererParameters().colorScaleOptions as TriChoroDiscreteOpts).classes
        : 100,
      hue: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).hue,
      chroma: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).chroma,
      lightness: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).lightness,
      contrast: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).contrast,
      spread: (
        rendererParameters().colorScaleOptions as TriChoroDiscreteOpts | TriChoroContinuousOpts
      ).spread,
    });
  });

  return <g
    id={layerDescription.id}
    class="layer trivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    // clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
    mgt:symbol-size={layerDescription.symbolSize}
    mgt:symbol-type={layerDescription.symbolType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature, i) => <path
          fill={colors()[i()] ?? rendererParameters().noDataColor}
          d={
            getSymbolPath(
              layerDescription.symbolType!,
              globalStore.projection((feature.geometry as Point).coordinates),
              layerDescription.symbolSize!,
            )
          }
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
