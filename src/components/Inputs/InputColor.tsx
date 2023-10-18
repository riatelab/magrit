import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldColorProps {
  label: LocalizedString | string;
  value: string;
  onChange: (color: string) => void;
}
export default function InputFieldColor(props: InputFieldColorProps): JSX.Element {
  return <div class="field">
    <label class="label">{ props.label }</label>
    <div class="control">
      <input
        class="color"
        type="color"
        onChange={(e) => {
          props.onChange(e.currentTarget.value);
        }}
        value={props.value}
      />
    </div>
  </div>;
}
