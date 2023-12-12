// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import {
  quantile,
  equal,
  jenks,
  q6,
} from 'statsbreaks';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';
import { computeDiscontinuity } from '../../../helpers/geo';
import { generateIdLayer } from '../../../helpers/layers';

// Stores
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';

// Subcomponents
import InputFieldSelect from '../../Inputs/InputSelect.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { DataType, Variable, VariableType } from '../../../helpers/typeDetection';
import {
  DiscontinuityParameters,
  LayerDescription,
  LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  discontinuityType: 'absolute' | 'relative',
  newLayerName: string,
): void {
  const newData = computeDiscontinuity(
    referenceLayerId,
    targetVariable,
    discontinuityType,
  );

  const values = newData.features.map((f) => f.properties.value as number);

  const breaks = quantile(values, { nb: 4 });

  const fields = [
    {
      name: 'value', hasMissingValues: false, type: VariableType.ratio, dataType: DataType.number,
    },
    {
      name: 'feature1', hasMissingValues: false, type: VariableType.categorical, dataType: DataType.string,
    },
    {
      name: 'feature2', hasMissingValues: false, type: VariableType.categorical, dataType: DataType.string,
    },
  ] as Variable[];

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(250, 110);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    data: newData,
    type: 'linestring',
    fields,
    renderer: 'discontinuity' as RepresentationType,
    visible: true,
    strokeColor: '#960e47',
    // strokeWidth: 2,
    strokeOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      type: discontinuityType,
      classificationMethod: 'manual',
      classes: 4,
      breaks,
      sizes: [2, 5, 9, 15],
    } as DiscontinuityParameters,
    legend: {
      title: {
        text: targetVariable,
        ...applicationSettingsStore.defaultLegendSettings.title,
      } as LegendTextElement,
      subtitle: {
        text: 'This is a subtitle',
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
      } as LegendTextElement,
      note: {
        text: 'This is a bottom note',
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
    },
  } as LayerDescription;

  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function DiscontinuitySettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === 'stock' || variable.type === 'ratio'));

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Discontinuity_${layerDescription().name}`);
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal(targetFields()[0].name);
  const [
    discontinuityType,
    setDiscontinuityType,
  ] = createSignal<'absolute' | 'relative'>('absolute');

  const makePortrayal = () => {
    onClickValidate(
      layerDescription().id,
      targetVariable(),
      discontinuityType(),
      newLayerName(),
    );
  };

  return <div class="portrayal-section__portrayal-options-discontinuity">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
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
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
