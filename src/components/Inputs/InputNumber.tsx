import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldNumberProps {
  label: LocalizedString | string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
  rounded?: boolean;
  width?: number;
}

export default function InputFieldNumber(props: InputFieldNumberProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div class="control">
      <input
        class={ mergedProps.rounded ? 'number' : 'input' }
        type="number"
        onChange={(e) => { mergedProps.onChange(+e.currentTarget.value); }}
        value={mergedProps.value}
        min={mergedProps.min}
        max={mergedProps.max}
        step={mergedProps.step}
        style={{
          width: `${mergedProps.width}px`,
        }}
      />
    </div>
  </div>;
}
