// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { getClassificationFunction } from '../../helpers/classification';
import { findSuitableName } from '../../helpers/common';
import computeDiscontinuity from '../../helpers/discontinuity';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Subcomponents
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { DataType, type Variable, VariableType } from '../../helpers/typeDetection';
import {
  ClassificationMethod,
  type DiscontinuityLegend,
  type DiscontinuityParameters,
  type LayerDescription,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../global.d';

const subsetClassificationMethodsForDiscontinuity = [
  'quantiles',
  'equalIntervals',
  // 'q6',
  'jenks',
  'geometricProgression',
];

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  discontinuityType: 'absolute' | 'relative',
  classificationMethod: ClassificationMethod,
  newLayerName: string,
): void {
  const newData = computeDiscontinuity(
    referenceLayerId,
    targetVariable,
    discontinuityType,
  );

  const values = newData.features.map((f) => f.properties.value as number);

  const breaks = getClassificationFunction(classificationMethod)(values, { nb: 4 });

  const fields = [
    {
      name: 'value', hasMissingValues: false, type: VariableType.ratio, dataType: DataType.number,
    },
    {
      name: 'ID-feature1', hasMissingValues: false, type: VariableType.categorical, dataType: DataType.string,
    },
    {
      name: 'ID-feature2', hasMissingValues: false, type: VariableType.categorical, dataType: DataType.string,
    },
  ] as Variable[];

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(250, 110);

  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newLayerName,
    data: newData,
    type: 'linestring',
    fields,
    renderer: 'discontinuity' as RepresentationType,
    visible: true,
    strokeColor: '#960e47',
    // strokeWidth: 2,
    strokeOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      type: discontinuityType,
      classificationMethod,
      classes: 4,
      breaks,
      sizes: [2, 5, 9, 14],
    } as DiscontinuityParameters,
  } as LayerDescription;

  const legend = {
    id: generateIdLegend(),
    layerId: newId,
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
    roundDecimals: 2,
    backgroundRect: {
      visible: false,
    },
    type: LegendType.discontinuity,
    orientation: 'horizontal',
    lineLength: 45,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
  } as DiscontinuityLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function DiscontinuitySettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields that can be used for computing the discontinuity.
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'stock' || variable.type === 'ratio');

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Discontinuity_${layerDescription.name}`);
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>('quantiles' as ClassificationMethod);
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal(targetFields![0].name);
  const [
    discontinuityType,
    setDiscontinuityType,
  ] = createSignal<'absolute' | 'relative'>('absolute');

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        discontinuityType(),
        classificationMethod(),
        layerName,
      );
      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-discontinuity">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().PortrayalSection.DiscontinuityOptions.DiscontinuityType() }
      onChange={(value) => setDiscontinuityType(value as 'absolute' | 'relative')}
      value={discontinuityType()}
    >
      <option value="absolute">
        { LL().PortrayalSection.DiscontinuityOptions.Absolute() }
      </option>
      <option value="relative">
        { LL().PortrayalSection.DiscontinuityOptions.Relative() }
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().PortrayalSection.DiscontinuityOptions.Classification()}
      onChange={(value) => setClassificationMethod(value as ClassificationMethod)}
      value={classificationMethod()}
    >
      <For each={subsetClassificationMethodsForDiscontinuity}>
        {
          (method) => <option value={method}>
            { LL().ClassificationPanel.classificationMethods[method]() }
          </option>
        }
      </For>
    </InputFieldSelect>
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
