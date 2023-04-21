import Sortable from 'solid-sortablejs';
import { JSX } from 'solid-js';
import { layersDescriptionStore, setLayersDescriptionStore } from './store/LayersDescriptionStore';
import LayerManagerItem from './LayerManagerItem.tsx';

const setLayersDescriptionStoreWrapper = (newLayersDescriptionStore) => {
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore,
  });
};

const LayerManager = (): JSX.Element => {
  const style = {
    display: 'inline-block',
    background: 'gray',
    padding: '10px',
    'border-radius': '4px',
    width: '100%',
  };
  return (
    <div style={style}>
    <Sortable idField="id" items={layersDescriptionStore.layers} setItems={setLayersDescriptionStoreWrapper}>
      {(item) => <LayerManagerItem type={item.type} name={item.name} />}
    </Sortable>
  </div>
  );
};
export default LayerManager;
