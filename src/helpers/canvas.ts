import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { globalStore } from '../store/GlobalStore';

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
  console.log(transform);
  const path = d3.geoPath()
    .projection(globalStore.projection)
    .context(ctx);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  layersDescriptionStore.layers
    .filter((layer) => layer.visible)
    .forEach((layer) => {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth / transform.k;
      if (layer.data.type === 'Sphere') {
        ctx.fillStyle = layer.fillColor;
        ctx.beginPath();
        path({ type: 'Sphere' });
        ctx.fill();
        ctx.stroke();
      } else if (layer.type === 'polygon' || layer.type === 'point') {
        for (let i = 0, n = layer.data.features.length; i < n; i += 1) {
          const feature = layer.data.features[i];
          ctx.fillStyle = layer.fillColor;
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
