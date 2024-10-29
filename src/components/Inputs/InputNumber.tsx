import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldNumberProps {
  label: LocalizedString | string;
  value: number;
  onChange: (number: number) => void;
  onKeyUp?: (text: number) => void;
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
  bindKeyUpAsChange?: boolean;
}

function applyStrictMinMax(
  mergedProps: InputFieldNumberProps,
  event: Event & { currentTarget: HTMLInputElement },
) {
  if (
    (mergedProps.strictMinMax || mergedProps.strictMin)
    && +event.currentTarget.value < mergedProps.min
  ) {
    // eslint-disable-next-line no-param-reassign
    event.currentTarget.value = `${mergedProps.min}`;
  }
  if (
    (mergedProps.strictMinMax || mergedProps.strictMax)
    && +event.currentTarget.value > mergedProps.max
  ) {
    // eslint-disable-next-line no-param-reassign
    event.currentTarget.value = `${mergedProps.max}`;
  }
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
          applyStrictMinMax(mergedProps, e);
          mergedProps.onChange(+e.currentTarget.value);
        }}
        onKeyUp={(e) => {
          if (props.onKeyUp) {
            applyStrictMinMax(mergedProps, e);
            props.onKeyUp(+e.currentTarget.value);
          } else if (props.bindKeyUpAsChange && props.onChange) {
            applyStrictMinMax(mergedProps, e);
            props.onChange(+e.currentTarget.value);
          }
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
