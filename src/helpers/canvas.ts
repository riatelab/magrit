import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { globalStore } from '../store/GlobalStore';

import { makeHexColorWithAlpha } from './color';

import d3 from './d3-custom';

const useDefaultRenderer = new Set([
  'default',
  'cartogram',
  'graticule',
]);

const draw = (
  canvas: HTMLCanvasElement,
  translate: [number, number],
  scale: number,
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
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      // Layer of type 'Sphere'
      if (layer.data.type === 'Sphere') {
        ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
        ctx.beginPath();
        path({ type: 'Sphere' });
        ctx.fill();
        ctx.stroke();
      } else if (
        useDefaultRenderer.has(layer.representationType)
        && (layer.type === 'polygon' || layer.type === 'point')
      ) {
        if (layer.type === 'point') {
          path.pointRadius(layer.symbolSize!);
        }
        ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
        for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
          ctx.beginPath();
          path(layer.data.features[i]);
          ctx.fill();
          ctx.stroke();
        }
      } else if (
        useDefaultRenderer.has(layer.representationType)
        && layer.type === 'linestring'
      ) {
        for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
          ctx.beginPath();
          path(layer.data.features[i]);
          ctx.stroke();
        }
      }
    });

  ctx.restore();
};

export default draw;
