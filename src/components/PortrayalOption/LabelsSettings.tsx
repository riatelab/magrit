// Import from solid-js
import {
  Accessor, createEffect, createMemo,
  createSignal, For,
  type JSX, Match, on, Show, Switch,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import type { LocalizedString } from 'typesafe-i18n';
import { yieldOrContinue } from 'main-thread-scheduling';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { findSuitableName } from '../../helpers/common';
import { makeCentroidLayer } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import FormulaInput, { filterData, formatValidSampleOutput, SampleOutputFormat } from '../FormulaInput.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputResultName from './InputResultName.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums
import {
  GeoJSONFeature,
  type LabelsLegend,
  type LabelsParameters,
  type LayerDescriptionLabels,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../global.d';
import type { PortrayalSettingsProps } from './common';

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

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
  filterFormula?: string,
): void {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  let newData;
  if (!filterFormula) {
    // Convert the layer to a point layer (if it is not already a point layer)
    // in order to be able to position and display labels
    newData = makeCentroidLayer(
      referenceLayerDescription.data,
      referenceLayerDescription.type as 'point' | 'linestring' | 'polygon',
    );
  } else {
    const fts = filterData(referenceLayerDescription, filterFormula);
    newData = makeCentroidLayer(
      { type: 'FeatureCollection', features: fts },
      referenceLayerDescription.type as 'point' | 'linestring' | 'polygon',
    );
  }

  // Store the original position of the features (we will need it
  // later if the user wants to change the position of the
  // labels manually)
  newData.features.forEach((feature) => {
    // eslint-disable-next-line no-param-reassign
    feature.geometry.originalCoordinates = feature.geometry.coordinates;
  });

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(100, 100);

  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newLayerName,
    data: newData,
    type: 'point',
    fields: referenceLayerDescription.fields,
    renderer: 'labels' as RepresentationType,
    visible: true,
    // strokeColor: '#000000',
    // strokeWidth: 1,
    // strokeOpacity: 1,
    // fillColor: '#000000',
    // fillOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      fontSize: 12,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
      textAnchor: 'middle',
      textAlignment: 'middle',
      textOffset: [0, 0],
      textBuffer: {
        size: 0,
        color: '#fefefe',
      },
      movable: false,
    } as LabelsParameters,
  } as LayerDescriptionLabels;

  // By default the legend for labels is not visible
  // (but it is created so that the user can change its visibility)
  const legend = {
    // Part common to all legends
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: targetVariable,
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      text: 'This is a subtitle',
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    },
    note: {
      text: 'This is a bottom note',
      ...applicationSettingsStore.defaultLegendSettings.note,
    },
    position: legendPosition,
    visible: false,
    backgroundRect: {
      visible: false,
    },
    type: LegendType.labels,
    labels: {
      text: `${referenceLayerDescription.name} (${targetVariable})`,
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
  } as LabelsLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function LabelsSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // Number of features in the layer (before filtering)
  const nFeaturesLayer = layerDescription.data.features.length;

  // The fields of the layer that can be used as a target variable for this portrayal
  // (i.e. all the fields).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription.fields;

  // The variable that contains the label to display
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields[0].name);

  // Name of the resulting layer
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.LabelsOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  // Do we want to filter the data before displaying it?
  const [
    filter,
    setFilter,
  ] = createSignal<boolean>(false);

  // Options for filtering
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
    // Find a suitable name for the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );

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
        formula(),
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
          setFilteredData(filterData(layerDescription, formula()));
        } else {
          setFilteredData(null);
        }
      },
    ),
  );

  const isConfirmationEnabled = createMemo(() => {
    if (filter()) {
      return sampleOutput() !== undefined
        && sampleOutput()?.type === 'Valid'
        && allValuesAreBoolean(Object.values(sampleOutput()!.value))
        && (filteredData() !== null && filteredData()!.length > 0);
    }
    return true;
  });

  return <div class="portrayal-section__portrayal-options-labels">
    <InputFieldSelect
      label={LL().FunctionalitiesSection.CommonOptions.Variable()}
      onChange={(v) => setTargetVariable(v)}
      value={targetVariable()}
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldCheckbox
      label={LL().FunctionalitiesSection.LabelsOptions.Filter()}
      checked={filter()}
      onChange={(v) => {
        setFilter(v);
        // Also reset the formula and the sample output
        setFormula('');
        setSampleOutput(undefined);
        setFilteredData(null);
      }}
    />
    <Show when={filter()}>
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
      <br/>
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
                LL().FunctionalitiesSection.SelectionOptions.NFeaturesSelected(
                  filteredData()!.length,
                )
              }</p>
            </MessageBlock>
          </Match>
        </Switch>
      </Show>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={!isConfirmationEnabled()}
      label={LL().FunctionalitiesSection.CreateLayer()}
      onClick={makePortrayal}
    />
  </div>;
}
