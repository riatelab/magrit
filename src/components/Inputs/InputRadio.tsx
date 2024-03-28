import { For, type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import { v4 as uuidv4 } from 'uuid';

interface InputFieldRadioProps {
  label: LocalizedString | string;
  value: string;
  values: Array<string>;
  onChange: (value: string) => void;
}

export default function InputFieldRadio(props: InputFieldRadioProps): JSX.Element {
  const id = `radio-${uuidv4()}`;

  return <div class="field">
    <label class="label">{ props.label }</label>
    <div class="control">
      <For each={props.values}>{(v) => (<label class="radio">
          <input
            type="radio"
            name={id}
            checked={props.value === v}
            onChange={() => props.onChange(v)}
          />
          { v }
        </label>)}
      </For>
    </div>
  </div>;
}
