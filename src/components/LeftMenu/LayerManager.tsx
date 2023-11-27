// Imports from solid-js
import { JSX } from 'solid-js';

// Imports from other packages
import Sortable from 'solid-sortablejs';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components
import LayerManagerItem from './LayerManagerItem.tsx';

// Styles
import '../../styles/LayerManager.css';

const setLayersDescriptionStoreWrapper = (newLayersDescriptionStore: []) => {
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore.toReversed(),
  });
};

const LayerManager = (): JSX.Element => <div class="layer-manager">
  <Sortable
    idField="id"
    items={layersDescriptionStore.layers.toReversed()}
    setItems={setLayersDescriptionStoreWrapper}
  >
    {
      (item) => <LayerManagerItem
        layer={item}
      />
    }
  </Sortable>
</div>;

export default LayerManager;
