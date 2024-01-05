// Imports from solid-js
import { For, JSX, Show } from 'solid-js';

// Imports from other packages
import Sortable from 'solid-sortablejs';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components
import { LayerManagerLayerItem, LayerManagerTableItem } from './LayerManagerItems.tsx';

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
    setItems={setLayersDescriptionStoreWrapper as any}
  >
    {
      (item) => <LayerManagerLayerItem
        layer={item}
      />
    }
  </Sortable>
  <Show when={layersDescriptionStore.tables.length > 0 && layersDescriptionStore.layers.length > 0}>
    <hr style={{ background: 'lightgray', height: '0.1em', margin: '0.8em' }} />
  </Show>
  <div>
    <For each={layersDescriptionStore.tables}>
      {
        (table) => <LayerManagerTableItem
          table={table}
        />
      }
    </For>
  </div>
</div>;

export default LayerManager;
