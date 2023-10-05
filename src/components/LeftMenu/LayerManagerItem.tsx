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
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { LayerDescription } from '../../global';
// import { unproxify } from '../../helpers/common';
import { redrawPaths } from '../../helpers/geo';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore } from '../../store/TableWindowStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setFieldTypingModalStore } from '../../store/FieldTypingModalStore';

// Other components / sub-components
import LayerSettings from '../Modals/LayerSettings.tsx';

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
    (l) => l.id === id,
    { visible: !visibilityState },
  );
};

const onCLickMagnifyingGlass = (id: string) => {
  console.log('click magnifying glass on item ', id);
  // Get a reference to the SVG element
  const svgElem = document.querySelector('.map-zone__inner svg') as SVGSVGElement;

  // Margin so that the extent of the layer is not on the border of the map
  const marginX = mapStore.mapDimensions.width * 0.03;
  const marginY = mapStore.mapDimensions.height * 0.03;

  // Fit the extent of the projection to the extent of the layer, with margins
  globalStore.projection.fitExtent(
    [
      [marginX, marginY],
      [mapStore.mapDimensions.width - marginX, mapStore.mapDimensions.height - marginY],
    ],
    layersDescriptionStore.layers.find((l) => l.id === id)?.data,
  );

  // Update the global store with the new scale and translate
  setMapStore({
    scale: globalStore.projection.scale(),
    translate: globalStore.projection.translate(),
  });

  // Reset the __zoom property of the svg element by using the zoomIdentity
  svgElem.__zoom = d3.zoomIdentity; // eslint-disable-line no-underscore-dangle

  // Redraw the paths
  redrawPaths(svgElem);
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
    escapeKey: 'cancel',
  });
  render(() => <LayerSettings id={ id } LL={ LL } />, document.querySelector('.modal-card-body')!);
};

const onClickTyping = (id: string) => {
  setFieldTypingModalStore({
    show: true,
    layerId: id,
  });
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
        <div title={ LL().LayerManager.Typing() }>
          <FiType onClick={() => { onClickTyping(props.props.id); }}/>
        </div>
      </Show>
      <div title={ LL().LayerManager.Delete() }>
        <FaSolidTrash onClick={() => { onClickTrash(props.props.id, LL); }} />
      </div>
    </div>
  </div>
  </div>;
}
