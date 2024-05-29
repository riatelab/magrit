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
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  strictMinMax?: boolean;
  strictMin?: boolean;
  strictMax?: boolean;
}

export default function InputFieldNumber(props: InputFieldNumberProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200 }, props);
  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'}>
    <label class="label">{mergedProps.label}</label>
    <div class="control">
      <input
        class={ mergedProps.rounded ? 'number' : 'input' }
        type="number"
        onChange={(e) => {
          if (
            (mergedProps.strictMinMax || mergedProps.strictMin)
            && +e.currentTarget.value < mergedProps.min
          ) {
            e.currentTarget.value = `${mergedProps.min}`;
          }
          if (
            (mergedProps.strictMinMax || mergedProps.strictMax)
            && +e.currentTarget.value > mergedProps.max
          ) {
            e.currentTarget.value = `${mergedProps.max}`;
          }
          mergedProps.onChange(+e.currentTarget.value);
        }}
        value={mergedProps.value}
        min={mergedProps.min}
        max={mergedProps.max}
        step={mergedProps.step}
        style={{
          width: `${mergedProps.width}px`,
        }}
        disabled={mergedProps.disabled}
      />
    </div>
  </div>;
}
