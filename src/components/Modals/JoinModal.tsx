// Imports from solid-js
import {
  Accessor,
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';

// Imports from other packages
import { FaSolidCircleInfo } from 'solid-icons/fa';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldButton from '../Inputs/InputButton.tsx';

// Types / Interfaces / Enums
import type { LayerDescription, TableDescription } from '../../global';

export default function JoinPanel(
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { id, LL } = props; // eslint-disable-line solid/reactivity
  const tableDescription = layersDescriptionStore.tables
    .find((l) => l.id === id) as TableDescription;

  return <div class="join-panel">
    <section
      class="has-text-centered"
      style={{
        padding: '20px',
        margin: '0 -20px 20px',
        background: '#cafbe5',
        'border-top': '1px solid #dbdbdb',
      }}
    >
      <FaSolidCircleInfo
        fill="darkgreen"
        style={{ height: '1.5em', width: '1.5em' }}
      />
      <p>{LL().JoinModal.Information()}</p>
    </section>
    <InputFieldSelect
      label={LL().JoinModal.TargetLayer()}
      onChange={() => {
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinModal.TargetLayerPlaceholder()}
      </option>
      <For each={layersDescriptionStore.layers}>
        {(layer) => <option value={layer.id}>{layer.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().JoinModal.JoinFieldTable()}
      onChange={() => {
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinModal.JoinFieldPlaceholder()}
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().JoinModal.JoinFieldLayer()}
      onChange={() => {
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinModal.JoinFieldPlaceholder()}
      </option>
    </InputFieldSelect>
  </div>;
}
