import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldTextProps {
  label: LocalizedString | string;
  value?: string;
  placeholder?: string;
  onChange: (text: string) => void;
}

export default function InputFieldText(props: InputFieldTextProps): JSX.Element {
  return <div class="field">
    <label class="label">{ props.label }</label>
    <div class="control">
      <input
        class="text"
        type="text"
        onChange={(e) => { props.onChange(e.currentTarget.value); }}
        value={ props.value }
        placeholder={ props.placeholder }
      />
    </div>
  </div>;
}
