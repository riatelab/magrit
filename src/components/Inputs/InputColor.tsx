import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldColorProps {
  label: LocalizedString | string;
  value: string;
  onChange: (color: string) => void;
  width?: number;
}
export default function InputFieldColor(props: InputFieldColorProps): JSX.Element {
  const mergedProps = mergeProps({ width: 133 }, props);
  return <div class="field">
    <label class="label">{ mergedProps.label }</label>
    <div class="control">
      <input
        class="color"
        type="color"
        onChange={(e) => {
          mergedProps.onChange(e.currentTarget.value);
        }}
        value={mergedProps.value}
        style={{
          width: `${mergedProps.width}px`,
        }}
      />
    </div>
  </div>;
}
