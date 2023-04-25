import Sortable from 'solid-sortablejs';
import { JSX } from 'solid-js';
import { layersDescriptionStore, setLayersDescriptionStore } from './store/LayersDescriptionStore';
import LayerManagerItem from './LayerManagerItem.tsx';
import './styles/LayerManager.css';

const setLayersDescriptionStoreWrapper = (newLayersDescriptionStore: []) => {
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore,
  });
};

const LayerManager = (): JSX.Element => <div class="layer-manager">
  <Sortable
    idField="id"
    items={layersDescriptionStore.layers}
    setItems={setLayersDescriptionStoreWrapper}
  >
    {(item) => <LayerManagerItem type={item.type} name={item.name} id={item.id} />}
  </Sortable>
</div>;
export default LayerManager;
