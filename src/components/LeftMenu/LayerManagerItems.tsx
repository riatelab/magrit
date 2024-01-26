// Imports from solid-js
import { Accessor, JSX, Show } from 'solid-js';

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
import { FiType, FiLink } from 'solid-icons/fi';
import toast from 'solid-toast';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore } from '../../store/TableWindowStore';
import { fitExtent, mapStore } from '../../store/MapStore';
import { setFieldTypingModalStore } from '../../store/FieldTypingModalStore';

// Other components / subcomponents
import LayerSettings from '../Modals/LayerSettings.tsx';
import JoinPanel from '../Modals/JoinModal.tsx';

// Types / Interfaces / Enums
import type { LayerDescription, TableDescription } from '../../global';

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

const onClickTrashLayer = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click trash on item ', id);

  const ld = layersDescriptionStore.layers.find((l) => l.id === id)!;

  const innerElement = () => <>
    <p>{ LL().Alerts.DeleteLayer() } <i><b>{ ld.name }</b></i> ?</p>
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

const onClickTyping = (id: string, type: 'table' | 'layer') => {
  console.log('click typing on item ', id);
  setFieldTypingModalStore({
    show: true,
    targetId: id,
    targetType: type,
  });
};

const onClickLegend = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click legend on item ', id);
  // TODO: we want to handle various cases, mostly as in Magrit v1:
  //  - no legend for this kind of layer (the legend icon should not be displayed at all so
  //    we shouldn't reach the present code in this case)
  //  - legend available but not visible (we should toggle the visibility of the legend)
  //  - legend available and visible (we should toggle the visibility of the legend)
  //  - no legend for now, but we can create one for the layer, such as for layer
  //    that use 'default' renderer (in this cas we should create it and add it
  //    to the LayerDescription / to the map)
  const ld = layersDescriptionStore.layers.find((l) => l.id === id)!;
  if (ld.legend === undefined || ld.legend === null) {
    setNiceAlertStore({
      show: true,
      type: 'warning',
      content: () => <p>Legend not available for this layer</p>,
      confirmCallback: (): void => undefined,
      cancelCallback: (): void => undefined,
      focusOn: 'cancel',
    });
  } else {
    // Toggle the visibility of the legend
    setLayersDescriptionStore(
      'layers',
      (l: LayerDescription) => l.id === id,
      'legend',
      'visible',
      (v: boolean) => !v,
    );
    // We check that the legend is still within the visibility zone.
    // If it is no longer in the visibility zone (because the user has shrunk the map area),
    // we replace it a the closer position within the visibility zone.
    if (
      ld.legend.visible
      && (ld.legend.position[0] > mapStore.mapDimensions.width
        || ld.legend.position[1] > mapStore.mapDimensions.height)
    ) {
      const legendNode = document.querySelector(`g.legend[for="${id}"]`) as SVGGElement;
      const { width, height } = legendNode.getBBox();
      const newPosition = [ld.legend.position[0], ld.legend.position[1]];
      if (ld.legend.position[0] > mapStore.mapDimensions.width) {
        newPosition[0] = mapStore.mapDimensions.width - width;
      }
      if (ld.legend.position[1] > mapStore.mapDimensions.height) {
        newPosition[1] = mapStore.mapDimensions.height - height;
      }
      setLayersDescriptionStore(
        'layers',
        (l: LayerDescription) => l.id === id,
        'legend',
        'position',
        newPosition,
      );
      toast.success(LL().LayerManager.LegendDisplacement(), {
        duration: 5000,
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
        },
        iconTheme: {
          primary: '#38bdf8',
          secondary: '#1f2937',
        },
      });
    }
  }
};

export function LayerManagerLayerItem(props: { 'layer': LayerDescription }): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item" onDblClick={() => { onClickSettings(props.layer.id, LL); }}>
    <div class="layer-manager-item__name" title={ props.layer.name }>
      <span>{ props.layer.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <div title={ LL().LayerManager[props.layer.type]() } style={{ cursor: 'help' }}>
          <i
            class={ typeIcons[props.layer.type as ('point' | 'linestring' | 'polygon' | 'raster')] }
          />
        </div>
        <Show when={props.layer.legend !== undefined}>
          <div title={ LL().LayerManager.Legend() } style={{ cursor: 'pointer' }}>
            <i
              class="fg-map-legend"
              style={{
                color: props.layer.legend?.visible ? 'black' : 'grey',
                transform: props.layer.legend?.visible ? '' : 'rotate(3deg)',
              }}
              onClick={() => { onClickLegend(props.layer.id, LL); }}
            />
          </div>
        </Show>
      </div>
      <div class="layer-manager-item__icons-right">
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
        <Show when={props.layer.fields && props.layer.fields.length > 0}>
          <div title={ LL().LayerManager.AttributeTable() }>
            <FaSolidTable onClick={() => { onClickTable(props.layer.id); }} />
          </div>
          <div title={ LL().LayerManager.Typing() }>
            <FiType onClick={() => { onClickTyping(props.layer.id, 'layer'); }}/>
          </div>
        </Show>
        <div title={ LL().LayerManager.Delete() }>
          <FaSolidTrash onClick={() => { onClickTrashLayer(props.layer.id, LL); }} />
        </div>
      </div>
    </div>
  </div>;
}

const onClickJoin = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click join on item ', id);

  // const td = layersDescriptionStore.tables.find((l) => l.id === id)!;

  setModalStore({
    show: true,
    content: () => <JoinPanel id={ id } LL={ LL } />,
    title: LL().JoinModal.Title(),
    confirmCallback: (): void => {
      // ...
    },
    cancelCallback: (): void => {
      // ...
    },
    escapeKey: 'cancel',
  });
};

const onClickTrashTable = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click trash on item ', id);

  const td = layersDescriptionStore.tables.find((l) => l.id === id)!;

  const innerElement = () => <>
    <p>{ LL().Alerts.DeleteTable() } <i><b>{ td.name }</b></i> ?</p>
  </>;

  const onDeleteConfirmed = (): void => {
    const tables = layersDescriptionStore.tables
      .filter((tableDescription) => tableDescription.id !== id);
    setLayersDescriptionStore({ tables });
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

export function LayerManagerTableItem(props: { 'table': TableDescription }): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item" onDblClick={() => { onClickSettings(props.table.id, LL); }}>
    <div class="layer-manager-item__name" title={ props.table.name }>
      <span>{ props.table.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <div title={LL().LayerManager.table()} style={{ cursor: 'help' }}>
          <FaSolidTableCells/>
        </div>
      </div>
      <div class="layer-manager-item__icons-right">
        <Show when={props.table.fields && props.table.fields.length > 0}>
          <div title={LL().LayerManager.Join()}>
            <FiLink onClick={() => onClickJoin(props.table.id, LL)}/>
          </div>
          <div title={LL().LayerManager.AttributeTable()}>
            <FaSolidTable onClick={() => {
              onClickTable(props.table.id);
            }}/>
          </div>
          <div title={LL().LayerManager.Typing()}>
            <FiType onClick={() => {
              onClickTyping(props.table.id, 'table');
            }}/>
          </div>
        </Show>
        <div title={LL().LayerManager.Delete()}>
          <FaSolidTrash onClick={() => { onClickTrashTable(props.table.id, LL); }} />
        </div>
      </div>
    </div>
  </div>;
}
