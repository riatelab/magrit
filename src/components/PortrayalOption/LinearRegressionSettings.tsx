// Imports from solid-js
import { createSignal, For, Show } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { PortrayalSettingsProps } from './common';
import { findSuitableName, unproxify } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { computeLinearRegression, LinearRegressionResult, makeCorrelationMatrix } from '../../helpers/statistics';

// Stores
import { setLoading } from '../../store/GlobalStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import {
  CorrelationMatrix, DiagnosticPlots,
  LmSummary, RepresentationOptions, ScatterPlot,
} from './LinearRegressionComponents.tsx';
import CollapsibleSection from '../CollapsibleSection.tsx';
import InputFieldRadio from '../Inputs/InputRadio.tsx';
import MessageBlock from '../MessageBlock.tsx';

function onClickValidate(
  layerId: string,
  portrayalType: 'choropleth' | 'proportionalSymbols',
  linearRegressionResult: LinearRegressionResult,
  layerName: string,
) {
  console.log('Layer ID:', layerId);
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // Copy the dataset and enrich it with the linear regression result
  const newDataset = unproxify(referenceLayerDescription.data);
  newDataset.features.forEach((f) => {
    // eslint-disable-next-line no-param-reassign
    f.properties.fitted = linearRegressionResult.fittedValues[i];
    // eslint-disable-next-line no-param-reassign
    f.properties.residual = linearRegressionResult.residuals[i];
    // eslint-disable-next-line no-param-reassign
    f.properties.standardizedResidual = linearRegressionResult.standardisedResiduals[i];
  });

  // Generate ID of new layer
  const newId = generateIdLayer();

  if (portrayalType === 'choropleth') {
    // Prepare the classification parameters
  } else {
    // Prepare the proportional symbols parameters
  }
}

export default function LinearRegressionSettings(props: PortrayalSettingsProps) {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields that are of type stock or ratio
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'stock' || variable.type === 'ratio');

  // Extract properties from the layer description
  const dataset = layerDescription.data.features.map((f) => f.properties) as Record<string, any>[];

  // Identifier variable (usefull for tooltip
  // on the various chart that are displayed in this component)
  // TODO: In the future we might ask the user to select the identifier variable...
  const identifierVariable = layerDescription.fields.find((f) => f.type === 'identifier')?.name;
  const identifiers = identifierVariable
    ? dataset.map((d) => d[identifierVariable])
    : undefined;

  // The pearson correlation matrix between the variables
  const pearsonMatrix = makeCorrelationMatrix(
    dataset,
    targetFields.map((f) => f.name),
    'pearson',
  );

  // The spearman correlation matrix between the variables
  const spearmanMatrix = makeCorrelationMatrix(
    dataset,
    targetFields.map((f) => f.name),
    'spearman',
  );

  // Signals for the current component:
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.LinearRegressionOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  // Explained (response) variable
  const [
    explainedVariable,
    setExplainedVariable,
  ] = createSignal<string>('');

  // Explanatory variable
  const [
    explanatoryVariable,
    setExplanatoryVariable,
  ] = createSignal<string>('');

  const [
    selectedMatrix,
    setSelectedMatrix,
  ] = createSignal<'pearson' | 'spearman'>('pearson');

  const [
    drawRegressionLine,
    setDrawRegressionLine,
  ] = createSignal<boolean>(false);

  const [
    linearRegressionResult,
    setLinearRegressionResult,
  ] = createSignal<LinearRegressionResult | null>(null);

  const [
    portrayalType,
    setPortrayalType,
  ] = createSignal<'choropleth' | 'proportionalSymbols'>('choropleth');

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        portrayalType(),
        linearRegressionResult() as LinearRegressionResult,
        layerName,
      );

      setLoading(false);

      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-linear-regression">
    <CollapsibleSection
      title={LL().FunctionalitiesSection.LinearRegressionOptions.DisplayCorrelationMatrix()}
    >
      <InputFieldRadio
        label={''}
        value={selectedMatrix()}
        values={
          [
            { value: 'pearson', label: LL().FunctionalitiesSection.LinearRegressionOptions.PearsonCorrelation() },
            { value: 'spearman', label: LL().FunctionalitiesSection.LinearRegressionOptions.SpearmanCorrelation() },
          ]
        }
        onChange={(v) => { setSelectedMatrix(v as 'pearson' | 'spearman'); }}
      />
      <Show when={selectedMatrix() === 'pearson'}>
        <CorrelationMatrix matrix={pearsonMatrix} />
      </Show>
      <Show when={selectedMatrix() === 'spearman'}>
        <CorrelationMatrix matrix={spearmanMatrix} />
      </Show>
    </CollapsibleSection>

    <InputFieldSelect
      label={LL().FunctionalitiesSection.LinearRegressionOptions.ExplainedVariable()}
      onChange={(value) => {
        setDrawRegressionLine(false);
        setLinearRegressionResult(null);
        setExplainedVariable(value);
      }}
      value={explainedVariable()}
    >
      <option value="" disabled={true}>
        {LL().FunctionalitiesSection.LinearRegressionOptions.ExplainedVariable()}
      </option>
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.LinearRegressionOptions.ExplanatoryVariable()}
      onChange={(value) => {
        setDrawRegressionLine(false);
        setLinearRegressionResult(null);
        setExplanatoryVariable(value);
      }}
      value={explanatoryVariable()}
    >
      <option value="" disabled={true}>
        {LL().FunctionalitiesSection.LinearRegressionOptions.ExplanatoryVariable()}
      </option>
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <Show when={
      explainedVariable() && explanatoryVariable()
      && explanatoryVariable() === explainedVariable()
    }>
      <MessageBlock type={'danger'}>
        <p>{LL().FunctionalitiesSection.LinearRegressionOptions.MessageSameVariable()}</p>
      </MessageBlock>
    </Show>
    <Show when={
      explainedVariable() && explanatoryVariable()
      && explanatoryVariable() !== explainedVariable()}
    >
      <ScatterPlot
        dataset={dataset}
        explainedVariable={explainedVariable()}
        explanatoryVariable={explanatoryVariable()}
        drawLine={drawRegressionLine()}
      />
      <Show when={linearRegressionResult() === null}>
        <div class="has-text-centered m-4">
          <button
            class="button"
            onClick={() => {
              setDrawRegressionLine(!drawRegressionLine());
              setLinearRegressionResult(
                computeLinearRegression(
                  dataset,
                  {
                    x: explanatoryVariable(),
                    y: explainedVariable(),
                    logX: false,
                    logY: false,
                  },
                ),
              );
              console.log(linearRegressionResult());
            }}
          >
            {LL().FunctionalitiesSection.LinearRegressionOptions.Compute()}
          </button>
        </div>
      </Show>
    </Show>
    <Show when={linearRegressionResult() !== null}>
      <LmSummary {...(linearRegressionResult() as LinearRegressionResult)} />
      <DiagnosticPlots {...(linearRegressionResult() as LinearRegressionResult)} />
      <RepresentationOptions
        summary={linearRegressionResult() as LinearRegressionResult}
        dataset={dataset}
        idVariable={identifierVariable}
      />
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={true}
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
