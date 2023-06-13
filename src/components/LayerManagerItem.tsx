import { JSX, Show } from 'solid-js';
import {
  FaSolidTable,
  FaSolidEye,
  FaSolidEyeSlash,
  FaSolidMagnifyingGlass,
  FaSolidTrash,
  FaSolidTableCells,
} from 'solid-icons/fa';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import '../styles/LayerManagerItem.css';
import 'font-gis/css/font-gis.css';
import { setNiceAlertStore } from '../store/NiceAlertStore';
import { useI18nContext } from '../i18n/i18n-solid';

const typeIcons: { polygon: string; linestring: string; raster: string; point: string } = {
  point: 'fg-point',
  linestring: 'fg-polyline',
  polygon: 'fg-polygon-o',
  raster: 'fg-finish',
};

const onClickEye = (id: number) => {
  console.log('click eye on item ', id);
  const visibilityState = layersDescriptionStore.layers.find((l) => l.id === id)?.visible;
  setLayersDescriptionStore(
    'layers',
    (l) => l.id === id,
    { visible: !visibilityState },
  );
};

const onCLickMagnifyingGlass = (id: number) => {
  console.log('click magnifying glass on item ', id);
};

const onClickTable = (id: number) => {
  console.log('click table on item ', id);
};

const onClickTrash = (id: number) => {
  console.log('click trash on item ', id);
  const SomeElement = (): JSX.Element => <>
    <div class="f-modal-icon f-modal-warning scaleWarning">
      <span class="f-modal-body pulseWarningIns"></span>
      <span class="f-modal-dot pulseWarningIns"></span>
    </div>
    <p>Delete { id } ?</p>
  </>;

  const onDeleteConfirmed = (): void => {
    const layers = layersDescriptionStore.layers
      .filter((layerDescription) => layerDescription.id !== id);
    setLayersDescriptionStore({ layers });
  };

  setNiceAlertStore({
    show: true,
    content: SomeElement(),
    confirmCallback: onDeleteConfirmed,
    cancelCallback: (): void => null,
  });
};

export default function LayerManagerItem(props: LayerDescription): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item">
    <div class="layer-manager-item__name">
      <span>{ props.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <Show
          when={props.type === 'table'}
          fallback={
            <div title={ LL().LayerManager[props.type]() }>
              <i
                class={ typeIcons[props.type as ('point' | 'linestring' | 'polygon' | 'raster')] }
              />
            </div>
          }
        >
          <div title={ LL().LayerManager.table() }>
            <FaSolidTableCells />
          </div>
        </Show>

    </div>
    <div class="layer-manager-item__icons-right">
      <Show when={props.type !== 'table'}>
        <Show when={props.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEye onClick={() => { onClickEye(props.id); }} />
          </div>
        </Show>
        <Show when={!props.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEyeSlash onClick={() => { onClickEye(props.id); }} />
          </div>
        </Show>
        <div title={ LL().LayerManager.FitZoom() }>
          <FaSolidMagnifyingGlass onClick={() => { onCLickMagnifyingGlass(props.id); }} />
        </div>
      </Show>
      <div title={ LL().LayerManager.AttributeTable() }>
        <FaSolidTable onClick={() => { onClickTable(props.id); }} />
      </div>
      <div title={ LL().LayerManager.Delete() }>
        <FaSolidTrash onClick={() => { onClickTrash(props.id); }} />
      </div>
    </div>
  </div>
  </div>;
}
