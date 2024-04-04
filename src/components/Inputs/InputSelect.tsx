import {
  children,
  type JSX,
  mergeProps,
  type ParentProps,
} from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldSelectProps {
  label: LocalizedString | string;
  onChange: (value: string) => void;
  value: string;
  width?: number;
  disabled?: boolean;
}

export default function InputFieldSelect(props: ParentProps<InputFieldSelectProps>): JSX.Element {
  const mergedProps = mergeProps({ width: 200 }, props);
  const c = children(() => mergedProps.children);
  return <div class="field">
    <label class="label">{ mergedProps.label }</label>
    <div class="select" style={{ width: `${mergedProps.width}px` }}>
      <select
        disabled={mergedProps.disabled}
        onChange={(e) => { mergedProps.onChange(e.currentTarget.value); }}
        style={{ width: `${mergedProps.width}px` }}
        value={ mergedProps.value }
      >
        { c() }
      </select>
    </div>
  </div>;
}
