import { createEffect, For, JSX } from 'solid-js';
import { getColors } from 'dicopal';
import { LayerDescription } from '../../global';

export default function legendChoropleth(layer: LayerDescription): JSX.Element {
  const colors = getColors(
    layer.classification.palette.name,
    layer.classification.classes,
    layer.classification.palette.reversed,
  );

  return <g
    class="legend choropleth"
    transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
  >
    <g>
      <For each={colors.toReversed()}>
        {
          (color, i) => <rect
            fill={color}
            x={0}
            y={i() * 40}
            width={70}
            height={30}
          />
        }
      </For>
    </g>
  </g>;
}
