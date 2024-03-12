// Imports from solid-js
import {
  createSignal,
  type JSX,
  onMount,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Stores
import {
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import Simplification from '../Simplification.tsx';

// Types / Interfaces / Enums
import type { GeoJSONFeature } from '../../global';

export default function SimplificationModal(
  props: {
    ids: string[], // The ids of the layers to simplify
  },
): JSX.Element {
  let refParentNode: HTMLDivElement;

  const [
    simplifiedLayers,
    setSimplifiedLayers,
  ] = createSignal<GeoJSONFeature[][]>([]);

  onMount(() => {
    // Set the behavior for when the user clicks on "Confirm"
    setModalStore({
      confirmCallback: () => {
        // Update the layers
        // with the simplified topology
        setLayersDescriptionStore(
          produce((draft: LayersDescriptionStoreType) => {
            props.ids.forEach((id, i) => {
              // The target layer
              const targetLayer = draft.layers
                .find((layer) => layer.id === id)!;
              // Set the new data
              targetLayer.data.features = simplifiedLayers()[i];
              // and remount the layer on the map
              targetLayer.visible = true;
            });
          }),
        );
      },
      cancelCallback: () => {
        // If the user clicks on "Cancel", we just remount the layers on the map
        setLayersDescriptionStore(
          produce((draft: LayersDescriptionStoreType) => {
            props.ids.forEach((id) => {
              // The target layer
              const targetLayer = draft.layers
                .find((layer) => layer.id === id)!;
              // and remount the layer on the map
              targetLayer.visible = true;
            });
          }),
        );
      },
    });

    setLayersDescriptionStore(
      produce((draft: LayersDescriptionStoreType) => {
        props.ids.forEach((id) => {
          // The target layer
          const targetLayer = draft.layers
            .find((layer) => layer.id === id)!;
          // unmount the layer from the map while we simplify it
          targetLayer.visible = false;
        });
      }),
    );
  });

  return <div class="simplification-modal" ref={refParentNode!}>
    <Simplification ids={props.ids} setSimplifiedLayers={setSimplifiedLayers} />
  </div>;
}
