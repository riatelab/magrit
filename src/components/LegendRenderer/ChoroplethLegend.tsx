import { For, JSX } from 'solid-js';
import { getColors } from 'dicopal';

import { makeLegendSubtitle, makeLegendTitle, makeLegendNote } from './common.tsx';

// Import some type descriptions
import { LayerDescription } from '../../global';

function choroplethVerticalLegend(layer: LayerDescription): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure that the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.classification) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  if (!layer.classification.palette) {
    throw new Error('Classification.palette attribute is not defined - this should not happen');
  }
  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  const colors = getColors(
    layer.classification.palette.name,
    layer.classification.classes,
    layer.classification.palette.reversed,
  );

  if (!colors) {
    throw new Error(`Could not get colors for scheme ${layer.classification.palette.name}`);
  }

  const distanceToTop = layer.legend.title && layer.legend.subtitle ? 40 : 20;

  return <g
    class="legend choropleth"
    transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
  >
    { makeLegendTitle(layer.legend.title) }
    { makeLegendSubtitle(layer.legend.subtitle) }
    { makeLegendNote(layer.legend.note) }
    <g class="legend-content">
      <For each={colors.toReversed()}>
        {
          (color, i) => <rect
            fill={color}
            x={0}
            y={distanceToTop + i() * (layer.legend.boxHeight + layer.legend.boxSpacing)}
            width={layer.legend.boxWidth}
            height={layer.legend.boxHeight}
          />
        }
      </For>
      <For each={layer.classification.breaks}>
        {
          (value, i) => <text
            x={layer.legend.boxWidth + layer.legend.boxSpacing}
            y={distanceToTop + i() * (layer.legend.boxHeight + layer.legend.boxSpacing)}
            font-size={layer.legend.title.fontSize}
            font-family={layer.legend.title.fontFamily}
            font-color={layer.legend.title.fontColor}
            font-style={layer.legend.title.fontStyle}
            font-weight={layer.legend.title.fontWeight}
            text-anchor="start"
            alignment-baseline="middle"
          >{ value }</text>
        }
      </For>
    </g>
  </g>;
}

function choroplethHorizontalLegend(layer: LayerDescription): JSX.Element {
  // Check that the layer has all the required attributes
  // Since this is done during layer creation, this should not happen in practice
  // and the following checks are here:
  // - to make Typescript happy
  // - to make sure that the layer is correctly defined.
  // In the future, we might want to remove these checks.
  if (!layer.classification) {
    throw new Error('Classification attribute is not defined - this should not happen');
  }
  if (!layer.classification.palette) {
    throw new Error('Classification.palette attribute is not defined - this should not happen');
  }
  if (!layer.legend) {
    throw new Error('Legend attribute is not defined - this should not happen');
  }

  const colors = getColors(
    layer.classification.palette.name,
    layer.classification.classes,
    layer.classification.palette.reversed,
  );

  if (!colors) {
    throw new Error(`Could not get colors for scheme ${layer.classification.palette.name}`);
  }

  return <g
    class="legend choropleth"
    transform={`translate(${layer.legend.position[0]}, ${layer.legend.position[1]})`}
    visibility={layer.visible && layer.legend.visible ? undefined : 'hidden'}
  >
    { makeLegendTitle(layer.legend.title) }
    { makeLegendSubtitle(layer.legend.subtitle) }
    { makeLegendNote(layer.legend.note) }
    <g class="legend-content">
      <For each={colors}>
        {
          (color, i) => <rect
            fill={color}
            x={i() * (layer.legend.boxWidth + layer.legend.boxSpacing)}
            y={0}
            width={layer.legend.boxWidth}
            height={layer.legend.boxHeight}
          />
        }
      </For>
      <For each={layer.classification.breaks}>
        {
          (value, i) => <text
            x={(i() * (layer.legend.boxWidth + layer.legend.boxSpacing)) - 10}
            y={layer.legend.boxHeight + layer.legend.boxSpacing}
            font-size={layer.legend.title.fontSize}
            font-family={layer.legend.title.fontFamily}
            font-color={layer.legend.title.fontColor}
            font-style={layer.legend.title.fontStyle}
            font-weight={layer.legend.title.fontWeight}
            text-anchor="start"
            alignment-baseline="middle"
          >{ value }</text>
        }
      </For>
    </g>
  </g>;
}

export default function legendChoropleth(layer: LayerDescription): JSX.Element {
  if (layer.legend.orientation === 'vertical') {
    return choroplethVerticalLegend(layer);
  }
  return choroplethHorizontalLegend(layer);
}
