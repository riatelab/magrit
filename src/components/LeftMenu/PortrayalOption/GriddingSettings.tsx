// Import from solid-js
import type { JSX } from 'solid-js';
import {
  createMemo,
  createSignal,
  For,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { getPalette } from 'dicopal';
import { yieldOrContinue } from 'main-thread-scheduling';
import { jenks } from 'statsbreaks';
import { bbox } from '@turf/turf';

// Stores
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';
import { setLoading } from '../../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../../store/PortrayalSelectionStore';

// Helper
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName, unproxify } from '../../../helpers/common';
import { computeAppropriateResolution } from '../../../helpers/geo';
import { computeGriddedLayer } from '../../../helpers/gridding';
import { generateIdLayer } from '../../../helpers/layers';
import { VariableType } from '../../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../../Inputs/InputNumber.tsx';
import InputFieldSelect from '../../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type ChoroplethLegendParameters,
  CustomPalette,
  GeoJSONFeatureCollection,
  GridCellShape,
  type GriddedLayerParameters,
  type GridParameters,
  LayerDescription,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../../global.d';
import { openLayerManager } from '../LeftMenu.tsx';

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

  const params = {
    variable: targetVariable,
    cellType,
    gridParameters,
    noDataColor: '#cecece', // FIXME: use default setting no data color
    palette: getPalette('Carrots', 7) as CustomPalette,
    breaks: [],
    reversePalette: true,
  } as GriddedLayerParameters;

  const newData = await computeGriddedLayer(
    unproxify(referenceLayerDescription.data as never) as GeoJSONFeatureCollection,
    params,
  );

  // Compute breaks based on the computed values
  const values = newData.features
    .map((ft) => ft.properties[`density-${targetVariable}`] as number);
  params.breaks = jenks(values, { nb: 7, precision: null });
  params.variable = `density-${targetVariable}`;

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    type: 'polygon',
    renderer: RepresentationType.grid,
    data: newData,
    fields: [
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
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'auto',
    rendererParameters: params,
    legend: {
      // Part common to all legends
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
      roundDecimals: 1,
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
      stroke: false,
      tick: false,
    } as ChoroplethLegendParameters,
  } as LayerDescription;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function GriddingSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer of which we want to create a gridded representation
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The bbox of the layer
  const bboxLayer = createMemo(() => bbox(layerDescription().data));

  // The fields of interest on the selected layer
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.stock));

  // Appropriate resolution for the grid
  // FIXME: this is a temporary solution
  const appropriateResolution = +(
    computeAppropriateResolution(bboxLayer(), 0.1).toPrecision(2));

  // Signals for options
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()![0].name);
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
  ] = createSignal(`Gridded_${layerDescription().name}`);

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );

    const gridParams = {
      xMin: bboxLayer()[0],
      yMin: bboxLayer()[1],
      xMax: bboxLayer()[2],
      yMax: bboxLayer()[3],
      resolution: targetResolution(),
    } as GridParameters;

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription().id,
        targetVariable(),
        layerName,
        gridParams,
        cellType(),
      ).then(() => {
        // Hide loading overlay
        setLoading(false);

        // Open the LayerManager to show the new layer
        openLayerManager();
      });
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-gridded">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
      width={200}
    >
      <For each={targetFields()}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().PortrayalSection.GridOptions.CellShape()}
      onChange={(v) => { setCellType(v as GridCellShape); }}
      value={cellType()}
      width={200}
    >
      <option value="square">{LL().PortrayalSection.GridOptions.CellSquare()}</option>
      <option value="hexagon">{LL().PortrayalSection.GridOptions.CellHexagon()}</option>
      <option value="diamond">{LL().PortrayalSection.GridOptions.CellDiamond()}</option>
      <option value="triangle">{LL().PortrayalSection.GridOptions.CellTriangle()}</option>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().PortrayalSection.GridOptions.Resolution()}
      value={targetResolution()}
      onChange={(value) => setTargetResolution(value)}
      min={0}
      max={500}
      step={0.1}
    />
    <InputResultName
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().PortrayalSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={targetResolution() <= 0}
    />
  </div>;
}
