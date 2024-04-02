import {
  Accessor, createEffect,
  createMemo, createSignal,
  type JSX, Match, on, Show, Switch,
} from 'solid-js';
import { produce, unwrap } from 'solid-js/store';

// Imports from other packages
import alasql from 'alasql';
import { yieldOrContinue } from 'main-thread-scheduling';
import { area } from '@turf/turf';
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { findSuitableName } from '../../helpers/common';
import { generateIdLayer, getDefaultRenderingParams } from '../../helpers/layers';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';

// Subcomponents
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import { PortrayalSettingsProps } from './common';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';
import FormulaInput, {
  formatValidSampleOutput, hasSpecialFieldArea,
  hasSpecialFieldId,
  replaceSpecialFields,
  SampleOutputFormat,
} from '../FormulaInput.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums
import { GeoJSONFeature, LayerDescription } from '../../global';

function filterData(
  referenceLayerId: string,
  formula: string,
): GeoJSONFeature[] {
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === referenceLayerId)! as LayerDescription;
  const data = layerDescription.data.features
    .map((d) => unwrap(d.properties) as Record<string, any>);
  const lengthDataset = data.length;
  const formulaClean = replaceSpecialFields(formula, lengthDataset);
  const query = `SELECT ${formulaClean} as newValue FROM ?`;

  // Add special fields if needed
  if (hasSpecialFieldId(formulaClean)) {
    data.forEach((d, i) => {
      d['@@uuid'] = i; // eslint-disable-line no-param-reassign
    });
  }
  if (hasSpecialFieldArea(formulaClean)) {
    data.forEach((d, i) => {
      d['@@area'] = area(layerDescription.data.features[i].geometry as never); // eslint-disable-line no-param-reassign
    });
  }

  // Compute new column
  const newColumn = alasql(query, [data]);
  const predicateArray = newColumn.map((d: any) => d.newValue);

  // Select the data based on the predicate array
  return layerDescription.data.features.filter((_, i) => predicateArray[i]);
}

async function onClickValidate(
  referenceLayerId: string,
  formula: string,
  newLayerName: string,
) {
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === referenceLayerId)! as LayerDescription;

  // Select the data based on the predicate array
  const features = filterData(referenceLayerId, formula);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    data: { type: 'FeatureCollection', features },
    type: layerDescription.type,
    fields: unwrap(layerDescription.fields),
    visible: true,
    renderer: 'default',
    ...getDefaultRenderingParams(layerDescription.type),
    shapeRendering: 'auto',
  } as LayerDescription;

  setLayersDescriptionStore(
    produce((draft: LayersDescriptionStoreType) => {
      draft.layers.push(newLayerDescription);
    }),
  );
}

const allValuesAreBoolean = (
  values: any[],
) => Object.values(values).every((v) => v === true || v === false);

function formatSampleOutput(
  s: SampleOutputFormat | undefined,
  LL: Accessor<TranslationFunctions>,
): string | LocalizedString {
  if (!s) return '';
  if (s.type === 'Error') {
    return LL().FormulaInput[`Error${s.value as 'ParsingFormula' | 'EmptyResult'}`]();
  }
  // In this component we want all the returned values to be boolean
  const values = Object.values(s.value);
  if (values.length === 0) {
    return LL().FormulaInput.ErrorEmptyResult();
  }
  if (!allValuesAreBoolean(values)) {
    return LL().FunctionalitiesSection.SelectionOptions.InvalidFormula();
  }
  return formatValidSampleOutput(s.value);
}

export default function SelectionSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === props.layerId)!;

  const nFeaturesLayer = layerDescription.data.features.length;

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.SelectionOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  const [
    formula,
    setFormula,
  ] = createSignal<string>('');

  const [
    sampleOutput,
    setSampleOutput,
  ] = createSignal<SampleOutputFormat | undefined>(undefined);

  const [
    filteredData,
    setFilteredData,
  ] = createSignal<GeoJSONFeature[] | null>(null);

  const makePortrayal = async () => {
    // Check name of the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(async () => {
      await onClickValidate(
        layerDescription.id,
        formula(),
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  createEffect(
    on(
      () => sampleOutput(),
      () => {
        if (
          sampleOutput()
          && sampleOutput()?.type === 'Valid'
          && allValuesAreBoolean(Object.values(sampleOutput()!.value))
        ) {
          setFilteredData(filterData(props.layerId, formula()));
        } else {
          setFilteredData(null);
        }
      },
    ),
  );

  const isConfirmationEnabled = createMemo(() => formula() !== ''
    && sampleOutput()
    && sampleOutput()!.type !== 'Error'
    && allValuesAreBoolean(Object.values(sampleOutput()!.value))
    && (filteredData() !== null && filteredData()!.length > 0));

  return <div class="portrayal-section__portrayal-options-selection">
    <MessageBlock type={'primary'}>
      <p>{LL().FunctionalitiesSection.SelectionOptions.Information()}</p>
      <p>{LL().FunctionalitiesSection.SelectionOptions.InformationSyntax()}</p>
    </MessageBlock>
    <br />
    <FormulaInput
      typeDataset={'layer'}
      dsDescription={layerDescription}
      currentFormula={formula}
      setCurrentFormula={setFormula}
      sampleOutput={sampleOutput}
      setSampleOutput={setSampleOutput}
    />
    <div class="control" style={{ display: 'flex', height: '7em' }}>
      <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
        <label class="label">{LL().FormulaInput.sampleOutput()}</label>
      </div>
      <pre
        style={{ display: 'flex', 'align-items': 'center', width: '120%' }}
        classList={{ 'has-text-danger': sampleOutput() && sampleOutput()!.type === 'Error' }}
        id="sample-output"
      >
        {formatSampleOutput(sampleOutput(), LL)}
      </pre>
    </div>
    <br />
    <div class="field-block">
    </div>
    <br />
    <Show when={filteredData() !== null}>
      <Switch>
        <Match when={filteredData()!.length === 0}>
          <MessageBlock type={'danger'} useIcon={true}>
            <p>{ LL().FunctionalitiesSection.SelectionOptions.NoSelectedData() }</p>
          </MessageBlock>
        </Match>
        <Match when={filteredData()!.length === nFeaturesLayer}>
          <MessageBlock type={'success'} useIcon={true}>
            <p>{
              LL().FunctionalitiesSection.SelectionOptions.AllDataSelected()
            }</p>
          </MessageBlock>
        </Match>
        <Match when={filteredData()!.length > 0 && filteredData()!.length !== nFeaturesLayer}>
          <MessageBlock type={'success'} useIcon={true}>
            <p>{
              LL().FunctionalitiesSection.SelectionOptions.NFeaturesSelected(filteredData()!.length)
            }</p>
          </MessageBlock>
        </Match>
      </Switch>
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
      disabled={!isConfirmationEnabled()}
    />
  </div>;
}
