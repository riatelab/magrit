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
import { findSuitableName } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';
import { Variable, VariableType } from '../../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';
import { computeAppropriateResolution } from '../../../helpers/geo';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';

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
} from '../../../global.d';

export default function GriddingSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer of which we want to create a gridded representation
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId));

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

    // TODO: prepare the other parameters for the gridded layer

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    setTimeout(() => {

    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-gridded">
    <div class="field">
      <label class="label">
        {LL().PortrayalSection.CommonOptions.Variable()}
      </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select
          onChange={(e) => setTargetVariable(e.currentTarget.value)}
        >
          <For each={targetFields()}>
            {(variable) => <option value={variable.name}>{variable.name}</option>}
          </For>
        </select>
      </div>
    </div>
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
    <InputResultName
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().PortrayalSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={true}
    />
  </div>;
}
