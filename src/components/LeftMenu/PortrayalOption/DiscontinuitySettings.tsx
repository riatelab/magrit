// Imports from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { layersDescriptionStore } from '../../../store/LayersDescriptionStore';

// Subcomponents
import InputFieldSelect from '../../Inputs/InputSelect.tsx';

// Types / Interfaces / Enums
import { PortrayalSettingsProps } from './common';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
): void {

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
  ] = createSignal<string>(`ProportionalSymbols_${layerDescription().name}`);
  const [targetVariable, setTargetVariable] = createSignal('');


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
  </div>;
}