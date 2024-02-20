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
import { setPortrayalSelectionStore } from '../../../store/PortrayalSelectionStore';

// Helper
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';
import { Variable, VariableType } from '../../../helpers/typeDetection';
import { computeKde, computeStewart } from '../../../helpers/smoothing';
import { Mpow } from '../../../helpers/math';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';
import { computeAppropriateResolution } from '../../../helpers/geo';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type ChoroplethLegendParameters,
  CustomPalette,
  type GridParameters,
  type KdeParameters,
  type LayerDescriptionSmoothedLayer,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
  type SmoothedLayerParameters,
  SmoothingMethod,
  type StewartParameters,
} from '../../../global.d';
import { openLayerManager } from '../LeftMenu.tsx';

async function onClickValidate(
  referenceLayerId: string,
  newName: string,
  targetVariable: string,
  gridParams: GridParameters,
  smoothingMethod: SmoothingMethod,
  parameters: Partial<StewartParameters> | KdeParameters,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  let newData;
  if (smoothingMethod === SmoothingMethod.Kde) {
    const kdeParams = {
      kernel: (parameters as KdeParameters).kernel,
      bandwidth: (parameters as KdeParameters).bandwidth,
    } as KdeParameters;

    newData = await computeKde(
      referenceLayerDescription.data,
      referenceLayerDescription.type as 'point' | 'polygon',
      targetVariable,
      gridParams,
      kdeParams,
    );
  } else { // smoothingMethod === SmoothingMethod.Stewart
    const fn = (parameters as StewartParameters).function;

    const alpha = fn === 'gaussian'
      ? (
        0.6931471805
        / Mpow(
          (parameters as StewartParameters).span,
          (parameters as StewartParameters).beta,
        )
      ) : (
        (Mpow(
          2.0,
          (1.0 / (parameters as StewartParameters).beta),
        ) - 1.0) / (parameters as StewartParameters).span
      );

    const stewartParams = {
      beta: (parameters as StewartParameters).beta,
      span: (parameters as StewartParameters).span,
      function: fn,
      alpha,
    } as StewartParameters;

    newData = await computeStewart(
      referenceLayerDescription.data,
      referenceLayerDescription.type as 'point' | 'polygon',
      targetVariable,
      gridParams,
      stewartParams,
    );
  }

  const thresholds = newData.features.map((f) => f.properties.min_v)
    .concat([newData.features[newData.features.length - 1].properties.max_v]);

  const rendererParameters = {
    variable: targetVariable,
    method: smoothingMethod,
    smoothingParameters: parameters,
    gridParameters: gridParams,
    breaks: thresholds,
    // TODO: wrap 'getPalette' in a function that returns a CustomPalette
    palette: getPalette('Carrots', thresholds.length - 1) as CustomPalette,
    reversePalette: true,
  } as SmoothedLayerParameters;

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    type: 'polygon',
    renderer: 'smoothed' as RepresentationType,
    data: newData,
    fields: [
      {
        name: 'min_v',
        type: VariableType.stock,
        hasMissingValues: false,
        dataType: 'number',
      } as Variable,
      {
        name: 'center_v',
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
      {
        name: targetVariable,
        type: VariableType.stock,
        hasMissingValues: false,
        dataType: 'number',
      },
    ],
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    fillColor: '#abcdef',
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'auto',
    legend: {
      // Part common to all legends
      title: {
        text: targetVariable,
        ...applicationSettingsStore.defaultLegendSettings.title,
      } as LegendTextElement,
      subtitle: {
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
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
    rendererParameters,
  } as LayerDescriptionSmoothedLayer;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
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

  // The bbox of the layer to be smoothed
  const bboxLayer = createMemo(() => bbox(layerDescription().data));

  // The fields of the layer to be smoothed.
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => (
      variable.type === VariableType.ratio || variable.type === VariableType.stock)));

  // Appropriate resolution for the grid
  const appropriateResolution = +(computeAppropriateResolution(bboxLayer(), 1).toPrecision(2));

  // Signals for common options
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()![0].name);
  const [
    targetSmoothingMethod,
    setTargetSmoothingMethod,
  ] = createSignal<SmoothingMethod>(SmoothingMethod.Stewart);
  const [
    targetResolution,
    setTargetResolution,
  ] = createSignal<number>(appropriateResolution);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal(`Smoothed_${layerDescription().name}`);

  // Signals for KDE options
  const [
    targetKdeKernelType,
    setTargetKdeKernelType,
  ] = createSignal<'gaussian' | 'epanechnikov' | 'quartic' | 'triangular' | 'uniform' | 'biweight'>('gaussian');
  const [
    targetBandwidth,
    setTargetBandwidth,
  ] = createSignal<number>(+(appropriateResolution * 2.25).toPrecision(2));

  // Signals for Stewart options
  const [
    targetStewartKernelType,
    setTargetStewartKernelType,
  ] = createSignal<'gaussian' | 'pareto'>('gaussian');
  const [
    targetSpan,
    setTargetSpan,
  ] = createSignal<number>(+(appropriateResolution * 2.25).toPrecision(2));
  const [
    targetBeta,
    setTargetBeta,
  ] = createSignal<number>(2);

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );
    const params = targetSmoothingMethod() === SmoothingMethod.Kde
      ? {
        kernel: targetKdeKernelType(),
        bandwidth: targetBandwidth(),
      } as KdeParameters
      : {
        function: targetStewartKernelType(),
        span: targetSpan(),
        beta: targetBeta(),
      } as Partial<StewartParameters>;

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

    // Actually make the new layer
    setTimeout(() => {
      onClickValidate(
        layerDescription().id,
        layerName,
        targetVariable(),
        gridParams,
        targetSmoothingMethod(),
        params,
      ).then(() => {
        // Hide loading overlay
        setLoading(false);

        // Open the LayerManager to show the new layer
        openLayerManager();
      });
    }, 0);
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
          onChange={(e) => setTargetSmoothingMethod(e.currentTarget.value as SmoothingMethod)}
        >
          <option value="Stewart">{LL().PortrayalSection.SmoothingOptions.Stewart()}</option>
          <option value="Kde">{LL().PortrayalSection.SmoothingOptions.KDE()}</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label class="label">
        {LL().PortrayalSection.SmoothingOptions.Resolution() }
      </label>
      <div class="control">
        <input
          type="number"
          class="input"
          value={targetResolution()}
          min={0}
          step={0.1}
          onChange={(e) => setTargetResolution(+e.currentTarget.value)}
        />
      </div>
    </div>
    <Show when={targetSmoothingMethod() === SmoothingMethod.Kde}>
      <div class="field">
        <label class="label">
          { LL().PortrayalSection.SmoothingOptions.KernelType() }
        </label>
        <div class="select" style={{ 'max-width': '60%' }}>
          <select
            value={targetKdeKernelType()}
            onChange={(e) => setTargetKdeKernelType(
              e.currentTarget.value as 'gaussian' | 'epanechnikov' | 'quartic' | 'triangular' | 'uniform' | 'biweight',
            )}
          >
            <option value="gaussian">{LL().PortrayalSection.SmoothingOptions.Gaussian()}</option>
            <option value="epanechnikov">{LL().PortrayalSection.SmoothingOptions.Epanechnikov()}</option>
            <option value="quartic">{LL().PortrayalSection.SmoothingOptions.Quartic()}</option>
            <option value="triangular">{LL().PortrayalSection.SmoothingOptions.Triangular()}</option>
            <option value="uniform">{LL().PortrayalSection.SmoothingOptions.Uniform()}</option>
            <option value="biweight">{LL().PortrayalSection.SmoothingOptions.Biweight()}</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="label">
          {LL().PortrayalSection.SmoothingOptions.Bandwidth() }
        </label>
        <div class="control">
          <input
            type="number"
            class="input"
            value={targetBandwidth()}
            step={1}
            min={0}
            onChange={(e) => setTargetBandwidth(+e.currentTarget.value)}
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
            value={targetStewartKernelType()}
            onChange={(e) => setTargetStewartKernelType(e.currentTarget.value as 'gaussian' | 'pareto')}
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
            value={targetSpan()}
            min={0}
            step={1}
            onChange={(e) => setTargetSpan(+e.currentTarget.value)}
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
            value={targetBeta()}
            step={1}
            onChange={(e) => setTargetBeta(+e.currentTarget.value)}
          />
        </div>
      </div>
    </Show>
    <InputResultName
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().PortrayalSection.CreateLayer() }
      onClick={ makePortrayal }
      disabled={
        targetResolution() <= 0
        || (targetSmoothingMethod() === SmoothingMethod.Kde && targetBandwidth() <= 0)
        || (targetSmoothingMethod() === SmoothingMethod.Stewart && targetSpan() <= 0)
      }
    />
  </div>;
}
