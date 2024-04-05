import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import { v4 as uuidv4 } from 'uuid';

interface InputFieldCheckboxProps {
  label: LocalizedString | string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function InputFieldCheckbox(props: InputFieldCheckboxProps): JSX.Element {
  const id = `checkbox-${uuidv4()}`;

  return <div class="field">
    <label for={id} class="label">{ props.label }</label>
    <input
      id={id}
      class="checkbox"
      type="checkbox"
      checked={ props.checked }
      onChange={(e) => { props.onChange(e.currentTarget.checked); }}
      disabled={ props.disabled }
    />
  </div>;
}
