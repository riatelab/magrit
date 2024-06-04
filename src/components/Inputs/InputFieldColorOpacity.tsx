import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldColorOpacityProps {
  label: LocalizedString | string;
  valueColor: string;
  valueOpacity: number;
  onChangeColor: (color: string) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export default function InputFieldColorOpacity(props: InputFieldColorOpacityProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div class="control is-flex">
      <input
        type="color"
        class="input"
        onChange={(e) => {
          mergedProps.onChangeColor(e.currentTarget.value);
        }}
        value={mergedProps.valueColor}
        style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
        }}
        disabled={mergedProps.disabled}
      />
      <div style={{ width: `${mergedProps.gap}px` }}></div>
      <input
        class="input"
        type="number"
        onChange={(e) => {
          if (+e.currentTarget.value < +e.currentTarget.min) {
            e.currentTarget.value = e.currentTarget.min;
          }
          if (+e.currentTarget.value > +e.currentTarget.max) {
            e.currentTarget.value = e.currentTarget.max;
          }
          mergedProps.onChangeOpacity(+e.currentTarget.value);
        }}
        value={mergedProps.valueOpacity}
        min={0}
        max={1}
        step={0.1}
        style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
        }}
        disabled={mergedProps.disabled}
      />
    </div>
  </div>;
}
