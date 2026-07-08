// Import from solid-js
import {
  Accessor,
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
import { bivariateClass, getClassifier } from '../../helpers/classification';
import { findSuitableName, getMinimumPrecision, isFiniteNumber } from '../../helpers/common';
import { bivariatePalettes } from '../../helpers/color';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import { BivariateDistributionPlot } from './BivariateChoroComponents.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type BivariateChoroplethLegend,
  type BivariateChoroplethParameters,
  type BivariateVariableDescription,
  type LayerDescriptionBivariateChoropleth,
  type LegendTextElement,
  ClassificationMethod,
  LegendType,
  RepresentationType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  params: BivariateChoroplethParameters,
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const values1 = referenceLayerDescription
    .data
    .features.map((f) => f.properties![params.variable1.variable] as number);
  const values2 = referenceLayerDescription
    .data
    .features.map((f) => f.properties![params.variable2.variable] as number);

  const hasNoData = (values1.concat(values2)).some((v) => !isFiniteNumber(v));

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(300, 300);

  // How many decimals to display in the legend
  const minPrecision = getMinimumPrecision(params.variable1.breaks.concat(params.variable2.breaks));

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

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the symbolSize and the symbolType parameters
    newLayerDescription.symbolSize = referenceLayerDescription.symbolSize || 5;
    newLayerDescription.symbolType = referenceLayerDescription.symbolType || 'circle';
  }

  const legend = {
    // Part common to all legends
    id: generateIdLegend(),
    layerId: newId,
    title: {
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
    variable1Label: params.variable1.variable,
    variable2Label: params.variable2.variable,
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

  const proposedClassifications = [
    {
      name: LL().ClassificationPanel.classificationMethods.quantiles(),
      value: ClassificationMethod.quantiles,
    },
    {
      name: LL().ClassificationPanel.classificationMethods.equalIntervals(),
      value: ClassificationMethod.equalIntervals,
    },
    {
      name: LL().ClassificationPanel.classificationMethods.ckmeans(),
      value: ClassificationMethod.ckmeans,
    },
  ];

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

  // - whether the classification is reversed for each ot the variables
  const [
    reversedVar1,
    setReversedVar1,
  ] = createSignal<boolean>(false);
  const [
    reversedVar2,
    setReversedVar2,
  ] = createSignal<boolean>(false);

  // - the filtered series, needed for classifier and plot
  const filteredSeriesVar1 = createMemo(() => {
    const s = layerDescription.data.features
      .map((f) => f.properties![targetVariable1()] as number);
    return s.filter((v) => isFiniteNumber(v)).map((d) => +d);
  });

  const filteredSeriesVar2 = createMemo(() => {
    const s = layerDescription.data.features
      .map((f) => f.properties![targetVariable2()] as number);
    return s.filter((v) => isFiniteNumber(v)).map((d) => +d);
  });

  const classifierVar1 = createMemo(() => new (
    getClassifier(classificationVar1() as ClassificationMethod)
  )(filteredSeriesVar1(), null, applicationSettingsStore.intervalClosure));

  const classifierVar2 = createMemo(() => new (
    getClassifier(classificationVar2() as ClassificationMethod)
  )(filteredSeriesVar2(), null, applicationSettingsStore.intervalClosure));

  const parameters: Accessor<BivariateChoroplethParameters> = createMemo(() => {
    const breaks1 = classifierVar1().classify(3);
    const breaks2 = classifierVar2().classify(3);

    return {
      variable1: {
        variable: targetVariable1(),
        method: classificationVar1(),
        classification: classificationVar1() as ClassificationMethod,
        classes: 3,
        breaks: breaks1,
        entitiesByClass: classifierVar1().countByClass(),
        reversed: reversedVar1(),
      } as BivariateVariableDescription,
      variable2: {
        variable: targetVariable2(),
        method: classificationVar2(),
        classification: classificationVar2() as ClassificationMethod,
        classes: 3,
        breaks: breaks2,
        entitiesByClass: classifierVar2().countByClass(),
        reversed: reversedVar2(),
      } as BivariateVariableDescription,
      noDataColor: '#ffffff',
      palette: bivariatePalettes[1],
    };
  });

  const bivariateClasses = (d: Record<string, any>) => {
    const classVar1 = !reversedVar1()
      ? classifierVar1().getClass(d[parameters().variable1.variable])
      : 2 - classifierVar1().getClass(d[parameters().variable1.variable]);
    const classVar2 = !reversedVar2()
      ? classifierVar2().getClass(d[parameters().variable2.variable])
      : 2 - classifierVar2().getClass(d[parameters().variable2.variable]);
    return [classVar1, classVar2];
  };

  const bc = (d: Record<string, any>) => bivariateClass(
    d[parameters().variable1.variable],
    d[parameters().variable2.variable],
    classifierVar1(),
    classifierVar2(),
    reversedVar1(),
    reversedVar2(),
  );

  const makeDs = () => layerDescription
    .data.features
    .map((f) => ({
      [parameters().variable1.variable]: isFiniteNumber(
        f.properties![parameters().variable1.variable],
      ) ? f.properties![parameters().variable1.variable]
        : undefined,
      [parameters().variable2.variable]: isFiniteNumber(
        f.properties![parameters().variable2.variable],
      ) ? f.properties![parameters().variable2.variable]
        : undefined,
    }));

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
        parameters(),
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-bivariatechoropleth">
    <div class={'is-flex is-justify-content-space-around'}>
      <InputFieldSelect
        label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 1` }
        onChange={(value) => {
          setTargetVariable1(value);
        }}
        value={ targetVariable1() }
        layout={'vertical'}
      >
        <For each={targetFields}>
          { (variable) => <option value={ variable.name }>{ variable.name }</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.BivariateChoroplethOptions.ClassificationVariable1()}
        onChange={(value) => {
          setClassificationVar1(value);
        }}
        value={classificationVar1()}
        layout={'vertical'}
      >
        <For each={proposedClassifications}>
          {
            (method) => <option value={ method.value }>
              { method.name }
            </option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldCheckbox
        label={LL().FunctionalitiesSection.BivariateChoroplethOptions.Reversed()}
        checked={reversedVar1()}
        onChange={(value) => setReversedVar1(value)}
      />
    </div>
    <div class={'is-flex is-justify-content-space-around'}>
      <InputFieldSelect
        label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 2` }
        onChange={(value) => {
          setTargetVariable2(value);
        }}
        value={ targetVariable2() }
        layout={'vertical'}
      >
        <For each={targetFields}>
          { (variable) => <option value={ variable.name }>{ variable.name }</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.BivariateChoroplethOptions.ClassificationVariable2()}
        onChange={(value) => {
          setClassificationVar2(value);
        }}
        value={classificationVar2()}
        layout={'vertical'}
      >
        <For each={proposedClassifications}>
          {
            (method) => <option value={ method.value }>
              { method.name }
            </option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldCheckbox
        label={LL().FunctionalitiesSection.BivariateChoroplethOptions.Reversed()}
        checked={reversedVar2()}
        onChange={(value) => { setReversedVar2(value); }}
      />
    </div>
    <BivariateDistributionPlot
      ds={makeDs()}
      currentClassifInfo={parameters}
      bivariateClasses={bivariateClasses}
      classifierVar1={classifierVar1}
      classifierVar2={classifierVar2}
      bc={bc}
    />
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
