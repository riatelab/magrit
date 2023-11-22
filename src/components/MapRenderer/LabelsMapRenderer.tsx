// Import from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
  Show,
} from 'solid-js';

// Helpers
import { bindDragBehavior, mergeFilterIds } from './common.tsx';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { applicationSettingsStore, RenderVisibility } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  LabelsParameters,
  type LayerDescriptionLabels,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function defaultLabelsRenderer(
  layerDescription: LayerDescriptionLabels,
): JSX.Element {
  let refElement: SVGGElement;
  const rendererParameters = layerDescription.rendererParameters as LabelsParameters;

  onMount(() => {
    refElement.querySelectorAll('text')
      .forEach((textElement, i) => {
        bindDragBehavior(textElement, layerDescription, i);
      });
  });

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      ref={refElement}
      id={layerDescription.id}
      class={'layer labels'}
      visibility={layerDescription.visible ? undefined : 'hidden'}
      filter={mergeFilterIds(layerDescription)}
      style={{ 'user-select': 'none', 'stroke-linejoin': 'round', 'paint-order': 'stroke' }}
    >
      <For each={layerDescription.data.features}>
        {
          (feature, i) => {
            const projectedCoords = createMemo(
              () => globalStore.projection(feature.geometry.coordinates),
            );
            return <text
              use:bindData={feature}
              x={projectedCoords()[0] + rendererParameters.textOffset[0]}
              y={projectedCoords()[1] + rendererParameters.textOffset[1]}
              alignment-baseline={rendererParameters.textAlignment}
              text-anchor={rendererParameters.textAnchor}
              font-style={rendererParameters.fontStyle}
              font-family={rendererParameters.fontFamily}
              font-size={rendererParameters.fontSize}
              font-weight={rendererParameters.fontWeight}
              fill={rendererParameters.fontColor}
              {...(
                rendererParameters.halo
                  ? { stroke: rendererParameters.halo.color, 'stroke-width': rendererParameters.halo.width }
                  : {}
              )}
            >{ feature.properties[rendererParameters.variable] }</text>;
          }
        }
      </For>
    </g>
  </Show>;
}

export function graticuleLabelsRenderer(
  layerDescription: LayerDescriptionLabels,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as LabelsParameters;
  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g>
      <For each={layerDescription.data.features}>
        {
          (feature) => <text
            use:bindData={feature}
            alignment-baseline={rendererParameters.textAlignment}
            text-anchor={rendererParameters.textAnchor}
            font-style={rendererParameters.fontStyle}
            font-family={rendererParameters.fontFamily}
            font-size={rendererParameters.fontSize}
            font-weight={rendererParameters.fontWeight}
            fill={rendererParameters.fontColor}
          ></text>
        }
      </For>
    </g>
  </Show>;
}
