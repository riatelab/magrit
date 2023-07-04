import { Accessor, JSX, Show } from 'solid-js';
import { render } from 'solid-js/web';
import {
  FaSolidTable,
  FaSolidEye,
  FaSolidEyeSlash,
  FaSolidGears,
  FaSolidMagnifyingGlass,
  FaSolidTrash,
  FaSolidTableCells,
} from 'solid-icons/fa';
import d3 from '../../helpers/d3-custom';

import { globalStore } from '../../store/GlobalStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore } from '../../store/TableWindowStore';

import LayerSettings from '../Modals/LayerSettings.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';
import 'font-gis/css/font-gis.css';
import '../../styles/LayerManagerItem.css';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { unproxify } from '../../helpers/common';
import { LayerDescription } from '../../global';

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
  const { projection, pathGenerator } = globalStore;
  console.log(projection.scale(), projection.translate(), d3);
  console.log(unproxify(layersDescriptionStore.layers.find((l) => l.id === id)?.data));
  const a = globalStore.projection.fitExtent(
    [[0, 0], [globalStore.width, globalStore.height]],
    unproxify(layersDescriptionStore.layers.find((l) => l.id === id)?.data),
  );
  console.log('a', a);
  // console.log(projection.scale(), projection.translate());
  // d3.select('.map-zone__inner svg')
  //   .selectAll('g').attr('transform', null);
  // d3.select('.map-zone__inner svg')
  //   .selectAll('path').attr('d', pathGenerator);
  document.querySelectorAll('.map-zone__inner svg g').forEach((g) => {
    g.setAttribute('transform', null); // eslint-disable-line no-underscore-dangle
  });
  document.querySelectorAll('.map-zone__inner svg path').forEach((p) => {
    p.setAttribute('d', pathGenerator); // eslint-disable-line no-underscore-dangle
  });
};

const onClickTable = (id: number) => {
  console.log('click table on item ', id);
  setTableWindowStore({
    editable: true, // TODO: only allow edition on some layers
    layerId: id,
    show: true,
  });
};

const onClickTrash = (id: number, LL: Accessor<TranslationFunctions>) => {
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
    cancelCallback: (): void => null,
  });
};

const onClickSettings = (id: number, LL: Accessor<TranslationFunctions>) => {
  console.log('click settings on item ', id);
  // Create a new modal window with the settings of the layer
  const layerDescription = layersDescriptionStore.layers.find((l) => l.id === id);
  const initialLayerDescription = { ...layerDescription };
  console.log('layerDescription', layerDescription);
  setModalStore({
    show: true,
    content: null,
    title: LL().LayerSettings.LayerSettings(),
    confirmCallback: (): void => {
      console.log('Changes confirmed for layer ', id);
    },
    cancelCallback: (): void => {
      console.log('Changes cancelled for layer ', id);
      // Reset the layerDescription for this layer
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === id,
        initialLayerDescription,
      );
    },
  });
  render(() => <LayerSettings id={ id } LL={ LL } />, document.querySelector('.modal-card-body')!);
};

export default function LayerManagerItem(props: { 'props': LayerDescription }): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item">
    <div class="layer-manager-item__name" title={ props.props.name }>
      <span>{ props.props.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <Show
          when={props.props.type === 'table'}
          fallback={
            <div title={ LL().LayerManager[props.props.type]() }>
              <i
                class={ typeIcons[props.props.type as ('point' | 'linestring' | 'polygon' | 'raster')] }
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
      <Show when={props.props.type !== 'table'}>
        <div title={ LL().LayerManager.Settings() }>
          <FaSolidGears onClick={() => { onClickSettings(props.props.id, LL); }} />
        </div>
        <Show when={props.props.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEye onClick={() => { onClickEye(props.props.id); }} />
          </div>
        </Show>
        <Show when={!props.props.visible}>
          <div title={ LL().LayerManager.ToggleVisibility() }>
            <FaSolidEyeSlash onClick={() => { onClickEye(props.props.id); }} />
          </div>
        </Show>
        <div title={ LL().LayerManager.FitZoom() }>
          <FaSolidMagnifyingGlass onClick={() => { onCLickMagnifyingGlass(props.props.id); }} />
        </div>
      </Show>
      <Show when={props.props.fields}>
        <div title={ LL().LayerManager.AttributeTable() }>
          <FaSolidTable onClick={() => { onClickTable(props.props.id); }} />
        </div>
      </Show>
      <div title={ LL().LayerManager.Delete() }>
        <FaSolidTrash onClick={() => { onClickTrash(props.props.id, LL); }} />
      </div>
    </div>
  </div>
  </div>;
}
