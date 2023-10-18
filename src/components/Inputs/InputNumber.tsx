import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldNumberProps {
  label: LocalizedString | string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
}
export default function InputFieldNumber(props: InputFieldNumberProps): JSX.Element {
  return <div class="field">
    <label class="label">{props.label}</label>
    <div class="control">
      <input
        class="number"
        type="number"
        onChange={(e) => { props.onChange(+e.currentTarget.value); }}
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
      />
    </div>
  </div>;
}
