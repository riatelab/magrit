// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { bbox } from '@turf/turf';
// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';

// Helper
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';
import { Variable, VariableType } from '../../../helpers/typeDetection';
import { computeStewart } from '../../../helpers/smoothing';
import { Mpow } from '../../../helpers/math';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  GridParameters,
  type LayerDescriptionSmoothedLayer,
  RepresentationType,
  SmoothedLayerParameters,
  SmoothingMethod,
  StewartParameters,
} from '../../../global.d';

async function onClickValidate(
  referenceLayerId: string,
  newName: string,
  targetVariable: string,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const bboxLayer = bbox(referenceLayerDescription.data);

  const stewartParams = {
    beta: 2,
    alpha: 0.6931471805 / Mpow(2, 2),
    span: 2,
  } as StewartParameters;

  const gridParams = {
    xMin: bboxLayer[0],
    yMin: bboxLayer[1],
    xMax: bboxLayer[2],
    yMax: bboxLayer[3],
    resolution: 1,
  } as GridParameters;

  const newData = await computeStewart(
    referenceLayerDescription.data,
    referenceLayerDescription.type as 'point' | 'polygon',
    targetVariable,
    gridParams,
    stewartParams,
  );

  console.log(newData);

  const rendererParameters = {
    variable: targetVariable,
    method: SmoothingMethod.Stewart,
    smoothingParameters: stewartParams,
    gridParameters: gridParams,
  } as SmoothedLayerParameters;

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    type: 'polygon',
    renderer: 'default' as RepresentationType,
    data: newData,
    fields: [
      {
        name: 'min_v',
        type: VariableType.stock,
        hasMissingValues: false,
        dataType: 'number',
      } as Variable,
      {
        name: 'max_v',
        type: VariableType.stock,
        hasMissingValues: false,
        dataType: 'number',
      } as Variable,
    ],
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    fillColor: '#abcdef',
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'crispEdges',
    legend: undefined,
    rendererParameters,
  } as LayerDescriptionSmoothedLayer;

  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function SmoothingSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer to be smoothed
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => (
      variable.type === VariableType.ratio || variable.type === VariableType.stock)));

  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()[0].name);
  const [
    targetSmoothingMethod,
    setTargetSmoothingMethod,
  ] = createSignal<SmoothingMethod>(SmoothingMethod.Kde);
  const [
    targetKernelType,
    setTargetKernelType,
  ] = createSignal<'gaussian' | 'epanechnikov' | 'quartic' | 'triangular' | 'uniform' | 'pareto'>('gaussian');
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal(`Smoothed_${layerDescription().name}`);

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );
    await onClickValidate(
      props.layerId,
      layerName,
      targetVariable(),
    );
  };

  return <div class="portrayal-section__portrayal-options-smoothed">
    <div class="field">
      <label class="label">
        { LL().PortrayalSection.CommonOptions.Variable() }
      </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select
          onChange={(e) => setTargetVariable(e.currentTarget.value)}
        >
          <For each={targetFields()}>
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <div class="field">
      <label class="label">
        { LL().PortrayalSection.SmoothingOptions.Type() }
      </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select
          value={targetSmoothingMethod()}
          onChange={(e) => setTargetSmoothingMethod(e.currentTarget.value)}
        >
          <option value="Kde">{ LL().PortrayalSection.SmoothingOptions.KDE() }</option>
          <option value="Stewart">{ LL().PortrayalSection.SmoothingOptions.Stewart() }</option>
        </select>
      </div>
    </div>
    <Show when={targetSmoothingMethod() === SmoothingMethod.Kde}>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.KernelType() }
        </label>
        <div class="select" style={{ 'max-width': '60%' }}>
          <select
            value={targetKernelType()}
            onChange={(e) => setTargetKernelType(e.currentTarget.value)}
          >
            <option value="gaussian">{ LL().PortrayalSection.SmoothingOptions.Gaussian() }</option>
            <option value="epanechnikov">{ LL().PortrayalSection.SmoothingOptions.Epanechnikov() }</option>
            <option value="triangular">{ LL().PortrayalSection.SmoothingOptions.Triangular() }</option>
            <option value="uniform">{ LL().PortrayalSection.SmoothingOptions.Uniform() }</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.Bandwidth() }
        </label>
        <div class="control">
          <input
            type="number"
            class="input"
            value={5}
            step={1}
          />
        </div>
      </div>
    </Show>
    <Show when={targetSmoothingMethod() === SmoothingMethod.Stewart}>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.KernelType() }
        </label>
        <div class="select" style={{ 'max-width': '60%' }}>
          <select
            value={targetKernelType()}
            onChange={(e) => setTargetKernelType(e.currentTarget.value)}
          >
            <option value="gaussian">{ LL().PortrayalSection.SmoothingOptions.Gaussian() }</option>
            <option value="pareto">{ LL().PortrayalSection.SmoothingOptions.Pareto() }</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.Span() }
        </label>
        <div class="control">
          <input
            type="number"
            class="input"
            value={5}
            step={1}
          />
        </div>
      </div>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.Beta() }
        </label>
        <div class="control">
          <input
            type="number"
            class="input"
            value={2}
            step={1}
          />
        </div>
      </div>
    </Show>
    <InputResultName
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
