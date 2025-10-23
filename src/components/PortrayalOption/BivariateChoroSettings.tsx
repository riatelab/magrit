// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { getClassifier } from '../../helpers/classification';
import { findSuitableName, getMinimumPrecision, isFiniteNumber } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type BivariateChoroplethLegend, ClassificationMethod, CustomPalette,
  type LayerDescriptionBivariateChoropleth,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariables: [string, string],
  targetClassifications: [string, string],
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(300, 300);

  // Prepare the parameters of the bivariate choropleth
  const values1 = referenceLayerDescription
    .data
    .features.map((f) => f.properties[targetVariables[0]] as number);
  const values2 = referenceLayerDescription
    .data
    .features.map((f) => f.properties[targetVariables[1]] as number);

  const hasNoData = (values1.concat(values2)).some((v) => !isFiniteNumber(v));

  const classifier1 = new (getClassifier(targetClassifications[0]))(values1, null);
  const classifier2 = new (getClassifier(targetClassifications[1]))(values2, null);
  const breaks1 = classifier1.classify(3);
  const breaks2 = classifier2.classify(3);

  const params = {
    variable1: {
      variable: targetVariables[0],
      method: targetClassifications[0],
      classification: targetClassifications[0] as ClassificationMethod,
      classes: 3,
      breaks: breaks1,
      entitiesByClass: classifier1.countByClass(),
    },
    variable2: {
      variable: targetVariables[1],
      method: targetClassifications[1],
      classification: targetClassifications[1] as ClassificationMethod,
      classes: 3,
      breaks: breaks2,
      entitiesByClass: classifier2.countByClass(),
    },
    noDataColor: '#ffffff',
    palette: {
      id: 'bupu-bivariate',
      name: 'BuPu bivariate',
      number: 9,
      type: 'custom',
      colors: [
        '#e8e8e8', '#ace4e4', '#5ac8c8',
        '#dfb0d6', '#a5add3', '#5698b9',
        '#be64ac', '#8c62aa', '#3b4994',
      ],
      provenance: 'user',
      reversed: false,
    } as CustomPalette,
  };

  // How many decimals to display in the legend
  const minPrecision = getMinimumPrecision(breaks1.concat(breaks2));

  // Generate ID of new layer
  const newId = generateIdLayer();

  // Prepare the layer description for the new layer
  const newLayerDescription = {
    id: newId,
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    representationType: 'bivariateChoropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: params,
  } as LayerDescriptionBivariateChoropleth;

  const legend = {
    // Part common to all legends
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: 'targetVariable',
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    } as LegendTextElement,
    note: {
      text: 'noteContent',
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: legendPosition,
    visible: true,
    roundDecimals: minPrecision < 0 ? 0 : minPrecision,
    backgroundRect: {
      visible: false,
    },
    // Part specific to bivariate choropleth
    type: LegendType.bivariateChoropleth,
    displayLabels: true,
    displayBreakValues: true,
    boxSpacing: 0,
    boxWidth: 40,
    boxHeight: 40,
    boxCornerRadius: 0,
    boxStrokeWidth: 0,
    noDataBox: hasNoData,
    rotate: true,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    breakValues: {
      fontSize: 11,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
    } as LegendTextElement,
    variable1Label: targetVariables[0],
    variable2Label: targetVariables[1],
    noDataLabel: 'No data',
  } as BivariateChoroplethLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function BivariateChoroSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.ratio);

  // Signals for the current component:
  // - the target variables,
  const [targetVariable1, setTargetVariable1] = createSignal<string>(targetFields[0].name);
  const [targetVariable2, setTargetVariable2] = createSignal<string>(targetFields[1].name);

  // - the classification method for each of the variables
  const [
    classificationVar1,
    setClassificationVar1,
  ] = createSignal<string>('quantiles');
  const [
    classificationVar2,
    setClassificationVar2,
  ] = createSignal<string>('quantiles');

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.BivariateChoroplethOptions.NewLayerName({
      variable1: targetVariable1(),
      variable2: targetVariable2(),
      layerName: layerDescription.name,
    }) as string,
  );

  createEffect(
    on(
      () => [targetVariable1(), targetVariable2()],
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.BivariateChoroplethOptions.NewLayerName({
            variable1: targetVariable1(),
            variable2: targetVariable2(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        [targetVariable1(), targetVariable2()],
        [classificationVar1(), classificationVar2()],
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-bivariatechoropleth">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => {
        setTargetVariable1(value);
      }}
      value={ targetVariable1() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => {
        setTargetVariable2(value);
      }}
      value={ targetVariable2() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={'Classification variable 1'}
      onChange={(value) => {
        setClassificationVar1(value);
      }}
      value={'quantiles'}
    >
     <For each={['quantiles', 'ckmeans']}>
       { (method) => <option value={ method }>{ method }</option> }
     </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={'Classification variable 2'}
      onChange={(value) => {
        setClassificationVar2(value);
      }}
      value={'quantiles'}
    >
      <For each={['quantiles', 'ckmeans']}>
        { (method) => <option value={ method }>{ method }</option> }
      </For>
    </InputFieldSelect>
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={
        targetVariable1() === targetVariable2()
        || classificationVar1() === undefined
        || classificationVar2() === undefined
      }
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
