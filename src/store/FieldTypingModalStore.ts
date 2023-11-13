import { createStore } from 'solid-js/store';

type FieldTypingModalStoreType = {
  show: boolean,
  layerId: string,
};

const [
  fieldTypingModalStore,
  setFieldTypingModalStore,
] = createStore({
  show: false,
  layerId: '',
} as FieldTypingModalStoreType);

// TODO (see also in OverlayDrop.tsx) - we should pass a GeoJSON FeatureCollection
//  OR the ID of a LayerDescription (in store) so that we can use it for layer
//  that are not yet added and for existing layers.
//  We should also pass a callback instead of having the confirm/cancel behavior
//  in the modal itself....

export {
  fieldTypingModalStore,
  setFieldTypingModalStore,
};
