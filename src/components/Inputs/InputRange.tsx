import { createMemo, JSX } from 'solid-js';

interface InputFieldRangeProps {
  label: string;
  formater?: (value: number) => string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
}

export default function InputFieldRange(props: InputFieldRangeProps): JSX.Element {
  const formater = createMemo(
    () => props.formater || ((value) => value.toString()),
  );

  return <div class="field">
    <label class="label">{props.label}</label>
    <div class="control">
      <output style={{ 'vertical-align': 'text-bottom' }}>
        {formater()(props.value)}
      </output>
      <input
        class="range"
        type="range"
        onChange={(e) => { props.onChange(+e.currentTarget.value); }}
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
      />
    </div>
  </div>;
}
