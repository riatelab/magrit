import { createEffect, createSignal, JSX } from 'solid-js';

import '../../styles/RangeSlider.css';

interface InputFieldRangeNumberProps {
  label: string;
  // formater?: (value: number) => string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
}

export default function InputFieldRangeNumber(props: InputFieldRangeNumberProps): JSX.Element {
  const [value, setValue] = createSignal(props.value);

  createEffect(() => {
    setValue(props.value);
  });

  return <div class="field">
    <label class="label">{props.label}</label>
    <div class="control">
      <input
        class="range"
        type="range"
        onChange={(e) => {
          props.onChange(+e.currentTarget.value);
          setValue(+e.currentTarget.value);
        }}
        value={value()}
        min={props.min}
        max={props.max}
        step={props.step}
      />
      <input
        class="input"
        type="number"
        value={value()}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={(e) => {
          props.onChange(+e.currentTarget.value);
          setValue(+e.currentTarget.value);
        }}
      />
    </div>
  </div>;
}
