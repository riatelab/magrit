import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { globalStore } from '../store/GlobalStore';

import { makeHexColorWithAlpha } from './color';

import d3 from './d3-custom';

const draw = (
  canvas: HTMLCanvasElement,
  translate: [number, number],
  scale: number,
  width: number,
  height: number,
) => {
  const ctx = canvas.getContext('2d')!;
  const transform = {
    x: translate[0],
    y: translate[1],
    k: scale,
  };
  const path = d3.geoPath()
    .projection(globalStore.projection)
    .digits(0)
    .context(ctx);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // ctx.translate(transform.x, transform.y);
  // ctx.scale(transform.k, transform.k);

  layersDescriptionStore.layers
    .filter((layer) => layer.visible)
    .forEach((layer) => {
      ctx.strokeStyle = makeHexColorWithAlpha(layer.strokeColor, layer.strokeOpacity);
      ctx.lineWidth = layer.strokeWidth;
      if (layer.data.type === 'Sphere') {
        ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
        ctx.beginPath();
        path({ type: 'Sphere' });
        ctx.fill();
        ctx.stroke();
      } else if (layer.type === 'polygon' || layer.type === 'point') {
        if (layer.type === 'point') {
          path.pointRadius(layer.symbolSize!);
        }
        for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
          const feature = layer.data.features[i];
          ctx.fillStyle = makeHexColorWithAlpha(layer.fillColor, layer.fillOpacity);
          ctx.beginPath();
          path(feature);
          ctx.fill();
          ctx.stroke();
        }
      } else if (layer.type === 'linestring') {
        for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
          const feature = layer.data.features[i];
          ctx.beginPath();
          path(feature);
          ctx.stroke();
        }
      }
      // } else if (layer.type === 'point') {
      // TODO
      // }
    });

  ctx.restore();
};

export default draw;
