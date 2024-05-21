// Import from solid-js
import {
  Accessor,
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// Helpers
import { bindDragBehavior, mergeFilterIds } from './common.tsx';
import { unproxify } from '../../helpers/common';
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { setModalStore } from '../../store/ModalStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { pushUndoStackStore } from '../../store/stateStackStore';

// Other components
import SingleLabelEdition from '../Modals/SingleLabelEdition.tsx';

// Types / Interfaces / Enums
import {
  type LabelsParameters,
  type LayerDescription,
  type LayerDescriptionLabels,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

const bindContextMenu = (
  element: SVGElement,
  layer: LayerDescriptionLabels,
  i: number,
  LL: Accessor<TranslationFunctions>,
) => {
  element.addEventListener('contextmenu', (e) => {
    console.log('context menu', i, layer.data.features[i].properties);
    e.preventDefault();
    e.stopPropagation();
    const currentRendererParameters = unproxify(layer.rendererParameters);
    setContextMenuStore({
      show: true,
      position: [e.clientX, e.clientY],
      entries: [
        {
          label: 'Edit label',
          callback: () => {
            setModalStore({
              show: true,
              content: () => <SingleLabelEdition layerId={layer.id} featureIx={i} LL={LL} />,
              title: 'Edit label',
              confirmCallback: () => {
                // The settings were updated directly in the panel,
                // skipping the undo/redo stack. So on confirm we
                // push the whole previous state to the undo stack
                // (in case the user wants to cancel the all the changes
                // made in the panel after closing it)
                // 0. Unproxify the whole layersDescriptionStore
                const lds = unproxify(layersDescriptionStore);
                // 1. Find the layer in the layersDescriptionStore
                //    and replace the new legend with the previous one
                lds.layers
                  .forEach((elem: LayerDescription) => {
                    if (elem.id === layer.id) {
                      // eslint-disable-next-line no-param-reassign
                      elem.rendererParameters = currentRendererParameters;
                    }
                  });
                // 2. Push the whole layersDescriptionStore to the undo stack
                pushUndoStackStore('layersDescription', lds);
              },
              cancelCallback: () => {
                // Reset the layer description
                setLayersDescriptionStore(
                  'layers',
                  (l: LayerDescription) => l.id === layer.id,
                  'rendererParameters',
                  currentRendererParameters,
                );
              },
            });
          },
        },
      ],
    });
  });
};

// eslint-disable-next-line import/prefer-default-export
export function defaultLabelsRenderer(
  layerDescription: LayerDescriptionLabels,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;
  const rendererParameters = layerDescription.rendererParameters as LabelsParameters;

  onMount(() => {
    refElement.querySelectorAll('text')
      .forEach((textElement, i) => {
        bindDragBehavior(textElement, layerDescription, i);
        bindContextMenu(textElement, layerDescription, i, LL);
      });
  });

  return <g
    ref={refElement!}
    id={layerDescription.id}
    classList={{
      layer: true,
      labels: true,
      movable: layerDescription.rendererParameters.movable,
    }}
    visibility={layerDescription.visible ? undefined : 'hidden'}
    filter={mergeFilterIds(layerDescription)}
    style={{ 'user-select': 'none', 'stroke-linejoin': 'round', 'paint-order': 'stroke' }}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.renderer}
  >
    <For each={layerDescription.data.features}>
      {
        (feature, i) => {
          // TODO: we could propose to link the label position to a symbol position
          //  (so that if the symbol is moved, the label is moved too, if
          //   it's hidden, the label is hidden too, etc.)
          const projectedCoords = createMemo(
            () => globalStore.projection(feature.geometry.coordinates),
          );
          const params = createMemo(() => {
            if (rendererParameters.specific[i()]) return rendererParameters.specific[i()];
            return rendererParameters.default;
          });
          return <text
            x={projectedCoords()[0] + params().textOffset[0]}
            y={projectedCoords()[1] + params().textOffset[1]}
            alignment-baseline={params().textAlignment}
            text-anchor={params().textAnchor}
            font-style={params().fontStyle}
            font-family={params().fontFamily}
            font-size={params().fontSize}
            font-weight={params().fontWeight}
            fill={params().fontColor}
            {...(
              params().halo
                ? { stroke: params()!.halo.color, 'stroke-width': params()!.halo.width }
                : {}
            )}
            use:bindData={feature}
          >{ feature.properties[rendererParameters.variable] }</text>;
        }
      }
    </For>
  </g>;
}

// export function graticuleLabelsRenderer(
//   layerDescription: LayerDescriptionLabels,
// ): JSX.Element {
//   const rendererParameters = layerDescription.rendererParameters as LabelsParameters;
//   return <g
//     mgt:geometry-type={layerDescription.type}
//     mgt:portrayal-type={layerDescription.renderer}
//   >
//     <For each={layerDescription.data.features}>
//       {
//         (feature) => <text
//           // @ts-expect-error because use:bind-data isn't a property of this element
//           use:bindData={feature}
//           alignment-baseline={rendererParameters.textAlignment}
//           text-anchor={rendererParameters.textAnchor}
//           font-style={rendererParameters.fontStyle}
//           font-family={rendererParameters.fontFamily}
//           font-size={rendererParameters.fontSize}
//           font-weight={rendererParameters.fontWeight}
//           fill={rendererParameters.fontColor}
//         ></text>
//       }
//     </For>
//   </g>;
// }
