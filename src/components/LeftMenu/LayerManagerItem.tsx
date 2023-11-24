// Imports from solid-js
import { Accessor, JSX, Show } from 'solid-js';
import { render } from 'solid-js/web';

// Imports from other packages
import {
  FaSolidTable,
  FaSolidEye,
  FaSolidEyeSlash,
  FaSolidGears,
  FaSolidMagnifyingGlass,
  FaSolidTrash,
  FaSolidTableCells,
} from 'solid-icons/fa';
import { FiType } from 'solid-icons/fi';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore } from '../../store/TableWindowStore';
import { fitExtent } from '../../store/MapStore';
import { setFieldTypingModalStore } from '../../store/FieldTypingModalStore';

// Other components / subcomponents
import LayerSettings from '../Modals/LayerSettings.tsx';

// Types / Interfaces / Enums
import type { LayerDescription } from '../../global';

// Styles
import 'font-gis/css/font-gis.css';
import '../../styles/LayerManagerItem.css';

const typeIcons: { polygon: string; linestring: string; raster: string; point: string } = {
  point: 'fg-point',
  linestring: 'fg-polyline',
  polygon: 'fg-polygon-o',
  raster: 'fg-finish',
};

const onClickEye = (id: string) => {
  console.log('click eye on item ', id);
  const visibilityState = layersDescriptionStore.layers.find((l) => l.id === id)?.visible;
  setLayersDescriptionStore(
    'layers',
    (l: LayerDescription) => l.id === id,
    { visible: !visibilityState },
  );
};

const onClickFitExtent = (id: string) => {
  console.log('click fit extent on item ', id);
  fitExtent(id);
};

const onClickTable = (id: string) => {
  console.log('click table on item ', id);
  setTableWindowStore({
    // TODO: only allow edition on some layers
    //  (not layer that have renderer != 'default' for example)
    editable: true,
    layerId: id,
    show: true,
  });
};

const onClickTrash = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click trash on item ', id);
  const innerElement = () => <>
    <p>{ LL().Alerts.DeleteLayer() } { id } ?</p>
  </>;

  const onDeleteConfirmed = (): void => {
    const layers = layersDescriptionStore.layers
      .filter((layerDescription) => layerDescription.id !== id);
    setLayersDescriptionStore({ layers });
  };

  setNiceAlertStore({
    show: true,
    type: 'warning',
    content: innerElement,
    confirmCallback: onDeleteConfirmed,
    cancelCallback: (): void => undefined,
    focusOn: 'cancel',
  });
};

const onClickSettings = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click settings on item ', id);
  // Create a new modal window with the settings of the layer
  const layerDescription = layersDescriptionStore.layers.find((l) => l.id === id);
  const initialLayerDescription = { ...layerDescription };
  setModalStore({
    show: true,
    content: () => <LayerSettings id={ id } LL={ LL } />,
    title: LL().LayerSettings.LayerSettings(),
    confirmCallback: (): void => {
      // Do nothing for now (because the layerDescription is updated directly in the modal)
    },
    cancelCallback: (): void => {
      // Reset the layerDescription for this layer
      setLayersDescriptionStore(
        'layers',
        (l: LayerDescription) => l.id === id,
        initialLayerDescription,
      );
    },
    escapeKey: 'cancel',
  });
};

const onClickTyping = (id: string) => {
  setFieldTypingModalStore({
    show: true,
    layerId: id,
  });
};

export default function LayerManagerItem(props: { 'layer': LayerDescription }): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item" onDblClick={() => { onClickSettings(props.layer.id, LL); }}>
    <div class="layer-manager-item__name" title={ props.layer.name }>
      <span>{ props.layer.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <Show
          when={props.layer.type !== 'table'}
          fallback={
            <div title={ LL().LayerManager.table() }>
              <FaSolidTableCells />
            </div>
          }
        >
          <div title={ LL().LayerManager[props.layer.type]() } style={{ cursor: 'help' }}>
            <i
              class={ typeIcons[props.layer.type as ('point' | 'linestring' | 'polygon' | 'raster')] }
            />
          </div>
          <Show when={props.layer.legend !== undefined}>
            <div title={ LL().LayerManager.Legend() } style={{ cursor: 'pointer' }}>
              <i class="fg-map-legend" />
            </div>
          </Show>
        </Show>
    </div>
    <div class="layer-manager-item__icons-right">
      <Show when={props.layer.type !== 'table'}>
        <div title={ LL().LayerManager.Settings() }>
          <FaSolidGears
            onClick={(e) => { onClickSettings(props.layer.id, LL); }}
          />
        </div>
        <Show when={props.layer.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEye onClick={() => { onClickEye(props.layer.id); }} />
          </div>
        </Show>
        <Show when={!props.layer.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEyeSlash onClick={() => { onClickEye(props.layer.id); }} />
          </div>
        </Show>
        <div title={ LL().LayerManager.FitZoom() }>
          {/* <i class="fg-extent" onClick={() => { onClickFitExtent(props.layer.id); }} /> */}
          <FaSolidMagnifyingGlass onClick={() => { onClickFitExtent(props.layer.id); }} />
        </div>
      </Show>
      <Show when={props.layer.fields && props.layer.fields.length > 0}>
        <div title={ LL().LayerManager.AttributeTable() }>
          <FaSolidTable onClick={() => { onClickTable(props.layer.id); }} />
        </div>
        <div title={ LL().LayerManager.Typing() }>
          <FiType onClick={() => { onClickTyping(props.layer.id); }}/>
        </div>
      </Show>
      <div title={ LL().LayerManager.Delete() }>
        <FaSolidTrash onClick={() => { onClickTrash(props.layer.id, LL); }} />
      </div>
    </div>
  </div>
  </div>;
}
