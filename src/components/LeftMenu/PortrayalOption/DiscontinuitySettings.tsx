// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';

// Subcomponents
import InputFieldSelect from '../../Inputs/InputSelect.tsx';

// Types / Interfaces / Enums
import { PortrayalSettingsProps } from './common';
import { computeDiscontinuity } from '../../../helpers/geo';
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import { generateIdLayer } from '../../../helpers/layers';
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
  console.log(newLayerName);
  const newData = computeDiscontinuity(
    referenceLayerId,
    targetVariable,
    discontinuityType,
  );

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

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    data: newData,
    type: 'line',
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

    } as DiscontinuityParameters,
    legend: {
      title: {
        text: targetVariable,
        fontSize: '13px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'bold',
      } as LegendTextElement,
      subtitle: {
        text: 'This is a subtitle',
        fontSize: '12px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      } as LegendTextElement,
      note: {
        text: 'This is a bottom note',
        fontSize: '11px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      } as LegendTextElement,
      position: [100, 100],
      visible: true,
      roundDecimals: 2,
      backgroundRect: {
        visible: false,
        fill: '#fefefe',
        fillOpacity: 1,
        stroke: '#000000',
      },
      type: LegendType.discontinuity,
      labels: {
        fontSize: '11px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
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
  ] = createSignal<string>(`Discontonuity_${layerDescription().name}`);
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
      label={'Discontinuity type'}
      onChange={(value) => setDiscontinuityType(value as 'absolute' | 'relative')}
      value={discontinuityType()}
    >
      <option value="absolute">Absolute</option>
      <option value="relative">Relative</option>
    </InputFieldSelect>
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
