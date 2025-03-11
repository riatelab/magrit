// Imports from solid-js
import {
  Accessor,
  createMemo,
  type JSX,
  Show,
} from 'solid-js';

// Imports from other packages
import {
  FaSolidEye,
  FaSolidEyeSlash,
  FaSolidGears,
  FaSolidLink,
  FaSolidMagnifyingGlass,
  FaSolidTable,
  FaSolidTableCells,
  FaSolidTrash,
} from 'solid-icons/fa';
import { FiType } from 'solid-icons/fi';
import { OcGoal2 } from 'solid-icons/oc';
import toast from 'solid-toast';
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { capitalizeFirstLetter, unproxify } from '../../helpers/common';

// Stores
import {
  layersDescriptionStore,
  setLayersDescriptionStore,
  setLayersDescriptionStoreBase,
} from '../../store/LayersDescriptionStore';
import { fitExtent, mapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { pushUndoStackStore } from '../../store/stateStackStore';
import { setTableWindowStore } from '../../store/TableWindowStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Other components / subcomponents
import LayerSettings from '../Modals/LayerSettings.tsx';
import JoinPanel from '../Modals/JoinModal.tsx';
import FieldTypingModal from '../Modals/FieldTypingModal.tsx';

// Types / Interfaces / Enums
import {
  type CategoricalChoroplethParameters,
  type ClassificationParameters,
  type DiscontinuityParameters,
  type LabelsParameters,
  type LayerDescription,
  type LayoutFeature,
  type Legend,
  type ProportionalSymbolsParameters,
  type GriddedLayerParameters,
  RepresentationType,
  type TableDescription,
} from '../../global.d';

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

const onClickTable = (id: string, type: 'layer' | 'table') => {
  console.log('click table on item ', id);
  setTableWindowStore({
    // TODO: only allow edition on some layers
    //  (not layer that have renderer != 'default' for example)
    editable: true,
    show: true,
    identifier: {
      type,
      id,
    },
  });
};

const onClickTrashLayer = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click trash on item ', id);

  const ld = layersDescriptionStore.layers.find((l) => l.id === id)!;

  const innerElement = () => <>
    <p>{LL().Alerts.DeleteLayer()}
      <i>
        <b style={{ 'overflow-wrap': 'break-word' }}> {ld.name}</b>
      </i> ?
    </p>
  </>;

  const onDeleteConfirmed = (): void => {
    // Remove the layer from layersDescriptionStore.layers
    const layers = layersDescriptionStore.layers
      .filter((layerDescription) => layerDescription.id !== id);
    // Remove the corresponding legend from layersDescriptionStore.layoutFeaturesAndLegends
    const layoutFeaturesAndLegends = layersDescriptionStore.layoutFeaturesAndLegends
      .filter((layoutFeatureOrLegend) => layoutFeatureOrLegend.layerId !== id);
    // Update the store
    setLayersDescriptionStore({ layers, layoutFeaturesAndLegends });
  };

  setNiceAlertStore({
    show: true,
    type: 'warning',
    content: innerElement,
    confirmCallback: onDeleteConfirmed,
    cancelCallback: (): void => undefined,
    focusOn: 'confirm',
  });
};

const onClickSettings = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click settings on item ', id);
  // Create a new modal window with the settings of the layer
  const layerDescription = layersDescriptionStore.layers.find((l) => l.id === id)!;
  const initialLayerDescription = JSON.parse(JSON.stringify(layerDescription));

  setModalStore({
    show: true,
    content: () => <LayerSettings id={ id } LL={ LL } />,
    title: LL().LayerSettings.LayerSettings(),
    confirmCallback: (): void => {
      // First, we check that the user didn't set an empty layer name
      if (layerDescription.name === '') {
        // Restore previous name
        setLayersDescriptionStoreBase(
          'layers',
          (l: LayerDescription) => l.id === id,
          'name',
          initialLayerDescription.name,
        );
      }
      // The properties of the layer was updated directly in the panel,
      // skipping the undo/redo stack. So on confirm we
      // push the whole previous state to the undo stack
      // (in case the user wants to cancel the all the changes
      // made in the panel after closing it)
      // 0. Unproxify the whole layersDescriptionStore
      const lds = unproxify(layersDescriptionStore);
      // 1. Find the layer in the layersDescriptionStore
      //    and replace its properties by the old one
      lds.layers.forEach((l: LayerDescription) => {
        if (l.id === id) {
          Object.assign(l, initialLayerDescription);
        }
      });
      // 2. Push the whole layersDescriptionStore to the undo stack
      if (applicationSettingsStore.useUndoRedo) {
        pushUndoStackStore('layersDescription', lds);
      }
    },
    cancelCallback: (): void => {
      // Reset the layerDescription for this layer
      setLayersDescriptionStoreBase(
        'layers',
        (l: LayerDescription) => l.id === id,
        initialLayerDescription,
      );
    },
    escapeKey: 'cancel',
    width: 'min(95vw, 720px)',
  });
};

const onClickTyping = (id: string, type: 'table' | 'layer', LL: Accessor<TranslationFunctions>) => {
  console.log('click typing on item ', id);
  setModalStore({
    show: true,
    content: () => <FieldTypingModal type={type} id={id} />,
    title: LL().FieldsTyping.ModalTitle(),
    escapeKey: 'cancel',
  });
};

const updateLegendPosition = (legend: Legend, infoMessage: LocalizedString) => {
  // The legend node (after it is visible again) is used to compute the size of the legend
  const legendNode = document.querySelector(`g.legend#${legend.id}`) as SVGGElement;
  const { width, height } = legendNode.getBBox();
  // Compute the new position of the legend so it is
  // within the visibility zone
  const newPosition = [legend.position[0], legend.position[1]];
  if (legend.position[0] > mapStore.mapDimensions.width) {
    newPosition[0] = mapStore.mapDimensions.width - width;
  }
  if (legend.position[1] > mapStore.mapDimensions.height) {
    newPosition[1] = mapStore.mapDimensions.height - height;
  }
  // Update position so that legend is within the visibility zone
  setLayersDescriptionStore(
    'layoutFeaturesAndLegends',
    (l: LayoutFeature | Legend) => l.id === legend.id,
    'position',
    newPosition,
  );
  // Inform the user that the legend has been displaced
  toast.success(infoMessage, {
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
};

const onClickLegend = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click legend on item ', id);
  // We want to handle various cases, mostly as in Magrit v1:
  //  - no legend for this kind of layer (the legend icon should not be displayed at all so
  //    we shouldn't reach the present code in this case) - OK
  //  - legend available but not visible (we should toggle the visibility of the legend) - OK
  //  - legend available and visible (we should toggle the visibility of the legend) - OK
  //  - legend available but not visible because it is out of the visibility zone (after
  //    the map was resized for example), so we should move it to the closest position within
  //    the visibility zone - OK
  //  - no legend for now, but we can create one for the layer, such as for layer
  //    that use 'default' renderer (in this cas we should create it and add it
  //    to the LayerDescription / to the map) - TODO
  const legends = layersDescriptionStore.layoutFeaturesAndLegends
    .filter((layoutFeatureOrLegend) => layoutFeatureOrLegend.layerId === id) as Legend[];

  if (legends.length === 0) {
    setNiceAlertStore({
      show: true,
      type: 'warning',
      content: () => <p>Legend not available for this layer</p>,
      confirmCallback: (): void => undefined,
      cancelCallback: (): void => undefined,
      focusOn: 'confirm',
    });
  } else if (legends.length === 1) {
    const legend = legends[0];

    // Toggle the visibility of the unique legend element
    setLayersDescriptionStore(
      'layoutFeaturesAndLegends',
      (l: LayoutFeature | Legend) => l.id === legend.id,
      'visible',
      (v: boolean) => !v,
    );
    // We also check that the legend is still within the visibility zone.
    // If it is no longer in the visibility zone (because the user has shrunk the map area),
    // we replace it a the closer position within the visibility zone.
    if (
      legend.visible
      && (legend.position[0] > mapStore.mapDimensions.width
        || legend.position[1] > mapStore.mapDimensions.height)
    ) {
      updateLegendPosition(legend, LL().LayerManager.LegendDisplacement());
    }
  } else if (legends.length > 1) {
    const someVisible = legends.some((l) => l.visible);
    const allVisible = legends.every((l) => l.visible);
    if (someVisible && allVisible) {
      // All the legends are visible, we hide them all
      legends.forEach((legend) => {
        setLayersDescriptionStore(
          'layoutFeaturesAndLegends',
          (l: LayoutFeature | Legend) => l.id === legend.id,
          'visible',
          false,
        );
      });
    } else {
      // At least one legend is not visible, we show them all
      legends.forEach((legend) => {
        setLayersDescriptionStore(
          'layoutFeaturesAndLegends',
          (l: LayoutFeature | Legend) => l.id === legend.id,
          'visible',
          true,
        );
        // We also check that the legend is still within the visibility zone.
        // If it is no longer in the visibility zone (because the user has shrunk the map area),
        // we replace it a the closer position within the visibility zone.
        if (
          legend.position[0] > mapStore.mapDimensions.width
          || legend.position[1] > mapStore.mapDimensions.height
        ) {
          updateLegendPosition(legend, LL().LayerManager.LegendDisplacement());
        }
      });
    }
  }
};

const formatTitleInfoLayer = (
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): string => {
  const l1 = LL().LayerManager[props.type]({
    nFt: props.data.features?.length || 1,
    nCol: props.fields.length,
  });
  if (props.representationType === RepresentationType.default) {
    return `${l1}`;
  }
  if (props.representationType === RepresentationType.choropleth) {
    const rp = props.rendererParameters as ClassificationParameters;
    const l2 = LL().LayerManager.Info.Choropleth({
      variable: rp.variable,
      nClasses: rp.classes,
      method: LL().ClassificationPanel.classificationMethods[rp.method](),
      palette: rp.palette.name,
    });
    const lco = props.layerCreationOptions;
    return lco ? `${l1}${l2}` : `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.proportionalSymbols) {
    const rp = props.rendererParameters as ProportionalSymbolsParameters;
    const l2 = LL().LayerManager.Info.ProportionalSymbols({
      variable: rp.variable,
      referenceSize: rp.referenceRadius,
      referenceValue: rp.referenceValue.toLocaleString(),
      symbolType: LL().FunctionalitiesSection
        .ProportionalSymbolsOptions.SymbolTypes[rp.symbolType](),
      colorMode: LL().FunctionalitiesSection
        .ProportionalSymbolsOptions.ColorModes[rp.colorMode](),
    });
    const lco = props.layerCreationOptions;
    return lco ? `${l1}${l2}` : `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.discontinuity) {
    const rp = props.rendererParameters as DiscontinuityParameters;
    const l2 = LL().LayerManager.Info.Discontinuity({
      variable: rp.variable,
      type: LL().FunctionalitiesSection.DiscontinuityOptions[capitalizeFirstLetter(rp.type)](),
      method: rp.classificationMethod,
      nClasses: rp.classes,
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.labels) {
    const rp = props.rendererParameters as LabelsParameters;
    const l2 = LL().LayerManager.Info.Labels({
      variable: rp.variable,
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.mushrooms) {
    const rp = props.rendererParameters as MushroomsParameters;
    const l2 = LL().LayerManager.Info.Mushrooms({
      topVar: rp.top.variable,
      topRefSize: rp.top.referenceSize,
      topRefValue: rp.top.referenceValue.toLocaleString(),
      bottomVar: rp.bottom.variable,
      bottomRefSize: rp.bottom.referenceSize,
      bottomRefValue: rp.bottom.referenceValue.toLocaleString(),
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.categoricalChoropleth) {
    const rp = props.rendererParameters as CategoricalChoroplethParameters;
    const l2 = LL().LayerManager.Info.CategoricalChoropleth({
      variable: rp.variable,
      nbCat: rp.mapping.length,
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.waffle) {
    const rp = props.rendererParameters as WaffleParameters;
    const l2 = LL().LayerManager.Info.Waffle({
      variables: rp.variables.map((d) => d.name).join(', '),
      symbolType: LL().FunctionalitiesSection
        .ProportionalSymbolsOptions.SymbolTypes[rp.symbolType](),
      symbolValue: rp.symbolValue.toLocaleString(),
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.cartogram) {
    const lco = props.layerCreationOptions;
    const l2 = LL().LayerManager.Info.Cartogram({
      variable: lco.variable,
      method: LL().FunctionalitiesSection.CartogramOptions[lco.method](),
    });
    return `${l1}${l2}`;
  }
  if (props.representationType === RepresentationType.grid) {
    console.log('foo foo fooo');
    const rp = props.rendererParameters as ClassificationParameters;
    const l2 = LL().LayerManager.Info.Choropleth({
      variable: rp.variable,
      nClasses: rp.classes,
      method: LL().ClassificationPanel.classificationMethods[rp.method](),
      palette: rp.palette.name,
    });
    const lco = props.layerCreationOptions as GridParameters;
    const l3 = LL().LayerManager.Info.Grid({
      variable: lco.variable,
      cellType: LL().FunctionalitiesSection.GridOptions[`Cell${capitalizeFirstLetter(lco.cellType)}`](),
    });
    return `${l1}${l2}${l3}`;
  }
  return `${l1}`;
};

export function LayerManagerLayerItem(props: LayerDescription): JSX.Element {
  const { LL } = useI18nContext();

  const legends = createMemo(() => layersDescriptionStore.layoutFeaturesAndLegends
    .filter(
      (layoutFeatureOrLegend) => layoutFeatureOrLegend.layerId === props.id,
    ) as Legend[]);

  const isPortrayed = props.representationType !== 'default';
  const hasNoFunctionality = props.representationType === 'sphere'
    || props.representationType === 'graticule'
    || props.id.startsWith('Layer-default-world-');

  return <div class="layer-manager-item is-flex" onDblClick={() => {
    onClickSettings(props.id, LL);
  }}>
    <div class="layer-manager-item__container">
      <div
        class="layer-manager-item__name mb-2"
        title={props.name}
        style={{
          'font-style': props.visible ? 'normal' : 'italic',
          'font-weight': props.visible ? 'bold' : 'normal',
        }}
      >
        <span>{props.name}</span>
      </div>
      <div class="layer-manager-item__icons">
        <div class="layer-manager-item__icons-left">
          <div
            title={formatTitleInfoLayer(props, LL)}
            style={{ cursor: 'help', 'font-size': '1.1em' }}
          >
            <i
              class={typeIcons[props.type as ('point' | 'linestring' | 'polygon' | 'raster')]}
            />
          </div>
          <Show when={legends().length > 0}>
            <button
              class="unstyled"
              onClick={() => {
                onClickLegend(props.id, LL);
              }}
              title={LL().LayerManager.Legend()}
              style={{ cursor: 'pointer', 'font-size': '1.1em' }}
            >
              <i
                class="fg-map-legend"
                style={{
                  color: legends().every((l) => l.visible) ? 'currentColor' : 'grey',
                  transform: legends().every((l) => l.visible) ? '' : 'rotate(3deg)',
                }}
              />
            </button>
          </Show>
        </div>
        <div class="layer-manager-item__icons-right">
          <Show when={props.visible}>
            <button
              aria-label={LL().LayerManager.ToggleVisibility()}
              class="unstyled"
              onClick={() => {
                onClickEye(props.id);
              }}
              title={LL().LayerManager.ToggleVisibility()}
            >
              <FaSolidEye size={'1.1em'}/>
            </button>
          </Show>
          <Show when={!props.visible}>
            <button
              aria-label={LL().LayerManager.ToggleVisibility()}
              class="unstyled"
              onClick={() => {
                onClickEye(props.id);
              }}
              title={LL().LayerManager.ToggleVisibility()}
            >
              <FaSolidEyeSlash size={'1.1em'}/>
            </button>
          </Show>
          <button
            aria-label={LL().LayerManager.FitZoom()}
            class="unstyled"
            onClick={() => {
              onClickFitExtent(props.id);
            }}
            title={LL().LayerManager.FitZoom()}
          >
            <FaSolidMagnifyingGlass size={'1.1em'}/>
          </button>
          <Show when={props.representationType !== 'sphere'}>
            <button
              aria-label={LL().LayerManager.AttributeTable()}
              class="unstyled"
              onClick={() => {
                onClickTable(props.id, 'layer');
              }}
              title={LL().LayerManager.AttributeTable()}
            >
              <FaSolidTable size={'1.1em'}/>
            </button>
            <button
              aria-label={LL().LayerManager.Typing()}
              class="unstyled"
              onClick={() => {
                onClickTyping(props.id, 'layer', LL);
              }}
              title={LL().LayerManager.Typing()}
            >
              <FiType size={'1.1em'}/>
            </button>
          </Show>
          <button
            aria-label={LL().LayerManager.Delete()}
            class="unstyled"
            onClick={() => {
              onClickTrashLayer(props.id, LL);
            }}
            title={LL().LayerManager.Delete()}
          >
            <FaSolidTrash size={'1.1em'}/>
          </button>
        </div>
      </div>
    </div>
    <div class="layer-manager-item__action">
      <button
        aria-label={LL().LayerManager.Settings()}
        class="unstyled"
        onClick={() => {
          onClickSettings(props.id, LL);
        }}
        title={LL().LayerManager.Settings()}
      >
        <FaSolidGears size={'1.1em'}/>
      </button>
    </div>
    <div class="layer-manager-item__action">
      <button
        aria-label={LL().LeftMenu.FunctionalityChoice()}
        onClick={() => {
          setFunctionalitySelectionStore({
            show: true,
            id: props.id,
            type: 'layer',
          });
        }}
        title={LL().LeftMenu.FunctionalityChoice()}
        disabled={hasNoFunctionality}
      >
        <OcGoal2 style={isPortrayed && !hasNoFunctionality ? { opacity: 0.55 } : undefined} />
      </button>
    </div>
  </div>;
}

const onClickJoin = (id: string, LL: Accessor<TranslationFunctions>) => {
  console.log('click join on item ', id);

  setModalStore({
    show: true,
    content: () => <JoinPanel id={id} LL={LL}/>,
    width: 'min(96vw, 700px)',
    title: LL().JoinPanel.Title(),
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
    focusOn: 'confirm',
  });
};

export function LayerManagerTableItem(props: TableDescription): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layer-manager-item is-flex" onDblClick={() => {
    onClickSettings(props.id, LL);
  }}>
    <div class="layer-manager-item__container">
      <div
        class="layer-manager-item__name mb-2"
        title={props.name}
        style={{
          'font-weight': 'normal',
          'font-style': 'italic',
        }}
      >
        <span>{props.name}</span>
      </div>
      <div class="layer-manager-item__icons">
        <div class="layer-manager-item__icons-left">
          <div title={LL().LayerManager.table()} style={{ cursor: 'help' }}>
            <FaSolidTableCells size={'1.1em'}/>
          </div>
        </div>
        <div class="layer-manager-item__icons-right">
          <Show when={props.fields && props.fields.length > 0}>
            <button
              aria-label={LL().LayerManager.AttributeTable()}
              class="unstyled"
              onClick={() => {
                onClickTable(props.id, 'table');
              }}
              title={LL().LayerManager.AttributeTable()}
            >
              <FaSolidTable size={'1.1em'}/>
            </button>
            <button
              aria-label={LL().LayerManager.Typing()}
              class="unstyled"
              onClick={() => {
                onClickTyping(props.id, 'table', LL);
              }}
              title={LL().LayerManager.Typing()}
            >
              <FiType size={'1.1em'}/>
            </button>
          </Show>
          <button
            aria-label={LL().LayerManager.Delete()}
            class="unstyled"
            onClick={() => {
              onClickTrashTable(props.id, LL);
            }}
            title={LL().LayerManager.Delete()}>
            <FaSolidTrash size={'1.1em'}/>
          </button>
        </div>
      </div>
    </div>
    <div class="layer-manager-item__action">
      <button
        aria-label={LL().LayerManager.Join()}
        class="unstyled"
        onClick={() => onClickJoin(props.id, LL)}
        title={LL().LayerManager.Join()}
      >
        <FaSolidLink />
      </button>
    </div>
    <div class="layer-manager-item__action">
      <button
        aria-label={LL().LeftMenu.FunctionalityChoice()}
        onClick={() => {
          setFunctionalitySelectionStore({
            show: true,
            id: props.id,
            type: 'table',
          });
        }}
        title={LL().LeftMenu.FunctionalityChoice()}
      >
        <OcGoal2/>
      </button>
    </div>
  </div>;
}
