// Imports from solid-js
import {
  createEffect,
  createSignal,
  For,
  JSX,
  on,
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
import { showErrorMessage } from '../../store/NiceAlertStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Subcomponents
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { DataType, type Variable, VariableType } from '../../helpers/typeDetection';
import {
  ClassificationMethod,
  type DiscontinuityParameters,
  type GraduatedLineLegend,
  type LayerDescription,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../global.d';

const subsetClassificationMethodsForDiscontinuity = [
  // We propose all the methods, except q6 and head-tail for which the number of classes
  // is fixed (q6) or determined by the data (head-tail)
  'quantiles',
  'equalIntervals',
  'jenks',
  'ckmeans',
  'nestedMeans',
  // 'q6',
  // 'headTail',
  'geometricProgression',
];

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  discontinuityType: 'absolute' | 'relative',
  color: string,
  classificationMethod: ClassificationMethod,
  newLayerName: string,
): void {
  const newData = computeDiscontinuity(
    referenceLayerId,
    targetVariable,
    discontinuityType,
  );

  const values = newData.features.map((f) => f.properties.value as number);
  const uniqueValues = new Set(values);
  const nbUniqueValues = uniqueValues.size;

  // Some classification methods may fail if the number of unique values
  // is inferior to the number of requested classes,
  // so we adjust the number of classes, and possibly the classification method
  // once the discontinuity layer is computed.
  let nbClasses;
  let sizes = [2, 5, 9, 14];
  if (nbUniqueValues <= 1) {
    // eslint-disable-next-line no-param-reassign
    classificationMethod = ClassificationMethod.quantiles;
    nbClasses = 2;
    sizes = sizes.slice(0, 2);
  } else if (nbUniqueValues < 4) {
    nbClasses = nbUniqueValues;
    sizes = sizes.slice(0, nbUniqueValues);
  } else {
    nbClasses = 4;
  }

  const breaks = getClassificationFunction(classificationMethod)(values, { nb: nbClasses });

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
    representationType: 'discontinuity' as RepresentationType,
    visible: true,
    strokeColor: color,
    // strokeWidth: 2,
    strokeOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      type: discontinuityType,
      classificationMethod,
      classes: nbClasses,
      breaks,
      sizes,
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
    type: LegendType.graduatedLine,
    orientation: 'horizontal',
    lineLength: 50,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
  } as GraduatedLineLegend;

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
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>('quantiles' as ClassificationMethod);

  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal(targetFields[0].name);

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.DiscontinuityOptions.NewLayerName({
      variable: targetVariable(),
      layerName: layerDescription.name,
    }) as string,
  );

  const [
    discontinuityType,
    setDiscontinuityType,
  ] = createSignal<'absolute' | 'relative'>('relative');

  const [
    selectedColor,
    setSelectedColor,
  ] = createSignal<string>('#960e47');

  createEffect(
    on(
      () => targetVariable(),
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.DiscontinuityOptions.NewLayerName({
            variable: targetVariable(),
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

    // Create the portrayal
    setTimeout(() => {
      try {
        onClickValidate(
          layerDescription.id,
          targetVariable(),
          discontinuityType(),
          selectedColor(),
          classificationMethod(),
          layerName,
        );
      } catch (e) {
        // @ts-expect-error No problem with 'e' here
        showErrorMessage(e.message ? e.message : `${e}`, LL);
        console.warn('Original error:', e);
      } finally {
        // Hide loading overlay
        setLoading(false);
        // Open the LayerManager to show the new layer
        openLayerManager();
      }
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-discontinuity">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.DiscontinuityOptions.DiscontinuityType() }
      onChange={(value) => setDiscontinuityType(value as 'absolute' | 'relative')}
      value={discontinuityType()}
    >
      <option value="relative">
        {LL().FunctionalitiesSection.DiscontinuityOptions.Relative()}
      </option>
      <option value="absolute">
        {LL().FunctionalitiesSection.DiscontinuityOptions.Absolute()}
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.DiscontinuityOptions.Classification()}
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
    <InputFieldColor
      label={LL().FunctionalitiesSection.CommonOptions.Color()}
      value={selectedColor()}
      onChange={(v) => { setSelectedColor(v); }}
    />
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
