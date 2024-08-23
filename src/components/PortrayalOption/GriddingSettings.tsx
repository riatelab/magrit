// Import from solid-js
import type { JSX } from 'solid-js';
import {
  createSignal,
  For,
  Show,
} from 'solid-js';
import { produce, unwrap } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';
import { CkmeansClassifier } from 'statsbreaks';
import { bbox } from '@turf/turf';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';
import { showErrorMessage } from '../../store/NiceAlertStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Helper
import { useI18nContext } from '../../i18n/i18n-solid';
import { getPaletteWrapper } from '../../helpers/color';
import { findSuitableName, getMinimumPrecision, getUniqueValues } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { computeAppropriateResolution } from '../../helpers/geo';
import { computeGriddedLayer } from '../../helpers/gridding';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { Mmin } from '../../helpers/math';
import { getProjectionUnit } from '../../helpers/projection';
import { VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type ChoroplethLegend,
  type ClassificationParameters,
  GeoJSONFeatureCollection,
  GridCellShape,
  type GriddedLayerParameters,
  type GridParameters,
  LayerDescription,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

async function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
  gridParameters: GridParameters,
  cellType: GridCellShape,
): Promise<void> {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const layerCreationOptions = {
    variable: targetVariable,
    cellType,
    gridParameters,
    gridCreation: 'projection',
  } as GriddedLayerParameters;

  const newData = await computeGriddedLayer(
    unwrap(referenceLayerDescription.data as never) as GeoJSONFeatureCollection,
    layerCreationOptions,
  );

  // Compute breaks based on the computed values
  const values = newData.features
    .map((ft) => ft.properties[`density-${targetVariable}`] as number);

  const numberOfClasses = Mmin(d3.thresholdSturges(getUniqueValues(values)), 7);

  const classifier = new CkmeansClassifier(values, null);

  const rendererParameters = {
    noDataColor: applicationSettingsStore.defaultNoDataColor,
    breaks: classifier.classify(numberOfClasses),
    palette: getPaletteWrapper('Carrots', numberOfClasses, true),
    entitiesByClass: classifier.countByClass(),
    variable: `density-${targetVariable}`,
  } as ClassificationParameters;

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newLayerName,
    type: 'polygon',
    representationType: RepresentationType.grid,
    data: newData,
    fields: [
      {
        name: 'id',
        hasMissingValues: false,
        type: VariableType.identifier,
        dataType: 'number',
      },
      {
        name: `density-${targetVariable}`,
        hasMissingValues: false,
        type: VariableType.ratio,
        dataType: 'number',
      },
      {
        name: 'sum',
        hasMissingValues: false,
        type: VariableType.stock,
        dataType: 'number',
      },
    ],
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    // fillColor: '#a12f2f',
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters,
    layerCreationOptions,
  } as LayerDescription;

  // How many decimals to display in the legend
  const minPrecision = getMinimumPrecision(rendererParameters.breaks);

  const legend = {
    // Part common to all legends
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: targetVariable,
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
      text: '(unit / km²)',
    } as LegendTextElement,
    note: {
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: legendPosition,
    visible: true,
    roundDecimals: minPrecision < 0 ? 0 : minPrecision,
    backgroundRect: {
      visible: false,
    },
    // Part specific to choropleth
    type: LegendType.choropleth,
    orientation: Orientation.vertical,
    boxWidth: 50,
    boxHeight: 30,
    boxSpacing: 0,
    boxSpacingNoData: 10,
    boxCornerRadius: 0,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    noDataLabel: 'No data',
    noDataBox: true,
    stroke: false,
    tick: false,
  } as ChoroplethLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function GriddingSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer of which we want to create a gridded representation
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The bbox of the layer
  const bboxLayer = bbox(layerDescription.data);

  // The fields of interest on the selected layer
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.stock);

  // The description of the current projection
  const currentProjection = unwrap(mapStore.projection);
  const {
    isGeo,
    unit: distanceUnit,
    toMeter,
  } = getProjectionUnit(currentProjection);

  // Appropriate resolution for the grid
  const appropriateResolution = (
    1000 * +(
      computeAppropriateResolution(bboxLayer, 0.1).toPrecision(2))
  ) * toMeter;

  // Signals for options
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields[0].name);
  const [
    cellType,
    setCellType,
  ] = createSignal<GridCellShape>(GridCellShape.square);
  const [
    targetResolution,
    setTargetResolution,
  ] = createSignal<number>(appropriateResolution);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal(
    LL().FunctionalitiesSection.GridOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );

    const gridParams = {
      xMin: bboxLayer[0],
      yMin: bboxLayer[1],
      xMax: bboxLayer[2],
      yMax: bboxLayer[3],
      resolution: targetResolution(),
    } as GridParameters;

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        layerName,
        gridParams,
        cellType(),
      ).then(() => {
        // Hide loading overlay
        setLoading(false);
        // Open the LayerManager to show the new layer
        openLayerManager();
      })
        .catch((e) => {
          setLoading(false);
          showErrorMessage(e.message ? e.message : `${e}`, LL);
          console.warn('Original error:', e);
        });
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-gridded">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.GridOptions.CellShape()}
      onChange={(v) => { setCellType(v as GridCellShape); }}
      value={cellType()}
    >
      <option value="square">{LL().FunctionalitiesSection.GridOptions.CellSquare()}</option>
      <option value="hexagon">{LL().FunctionalitiesSection.GridOptions.CellHexagon()}</option>
      <option value="diamond">{LL().FunctionalitiesSection.GridOptions.CellDiamond()}</option>
      <option value="triangle">{LL().FunctionalitiesSection.GridOptions.CellTriangle()}</option>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().FunctionalitiesSection.GridOptions.ResolutionWithUnit({ unit: distanceUnit })}
      value={targetResolution()}
      onChange={(value) => setTargetResolution(value)}
      min={0}
      max={500}
      step={0.1}
    />
    <Show when={isGeo}>
      <MessageBlock type={'warning'} useIcon={true}>
        { LL().FunctionalitiesSection.GridOptions.WarningGeo() }
      </MessageBlock>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().FunctionalitiesSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={targetResolution() <= 0}
    />
  </div>;
}
