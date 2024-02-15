// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  Show,
} from 'solid-js';
import type { JSX } from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { getPalette } from 'dicopal';
import { yieldOrContinue } from 'main-thread-scheduling';
import { bbox } from '@turf/turf';

// Stores
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';
import { setLoading } from '../../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../../store/LayersDescriptionStore';

// Helper
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName, unproxify } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';
import { Variable, VariableType } from '../../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';
import { computeAppropriateResolution } from '../../../helpers/geo';
import { computeGriddedLayer } from '../../../helpers/gridding';

// Subcomponents
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../../Inputs/InputNumber.tsx';
import InputFieldSelect from '../../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type ChoroplethLegendParameters,
  type GridParameters,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
  type GriddedLayerParameters,
  GridCellShape,
  type LayerDescriptionGriddedLayer,
  CustomPalette,
  GeoJSONFeatureCollection, LayerDescription,
} from '../../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
  gridParameters: GridParameters,
  cellType: GridCellShape,
): void {
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
    palette: getPalette('Carrots', 6) as CustomPalette,
    breaks: [], // FIXME: ...
    reversePalette: true,
  } as GriddedLayerParameters;

  const newData = computeGriddedLayer(
    unproxify(referenceLayerDescription.data as never) as GeoJSONFeatureCollection,
    params,
  );

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    type: 'polygon',
    renderer: 'default',
    data: newData,
    fields: [],
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    fillColor: '#a12f2f',
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: referenceLayerDescription.shapeRendering,
    // rendererParameters: params,
    legend: {} as never,
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
  const appropriateResolution = +(computeAppropriateResolution(bboxLayer(), 1).toPrecision(2));

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
      );
      // Hide loading overlay
      setLoading(false);
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-gridded">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <div class="field">
      <label class="label">
        {LL().PortrayalSection.GridOptions.CellShape()}
      </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select
          value={cellType()}
          onChange={(e) => setCellType(e.currentTarget.value as GridCellShape)}
        >
          <option value="square">{LL().PortrayalSection.GridOptions.CellSquare()}</option>
          <option value="diamond">{LL().PortrayalSection.GridOptions.CellHexagon()}</option>
          <option value="hexagon">{LL().PortrayalSection.GridOptions.CellDiamond()}</option>
          <option value="triangle">{LL().PortrayalSection.GridOptions.CellTriangle()}</option>
        </select>
      </div>
    </div>
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
