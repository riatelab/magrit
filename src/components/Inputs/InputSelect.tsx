import {
  children,
  type JSX,
  mergeProps,
  type ParentProps,
} from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputSelectProps {
  onChange: (value: string) => void;
  value: string;
  width?: string;
  disabled?: boolean;
}

interface InputFieldSelectProps extends InputSelectProps {
  label: LocalizedString | string;
  layout?: 'horizontal' | 'vertical';
}

export function InputSelect(props: ParentProps<InputSelectProps>): JSX.Element {
  const mergedProps = mergeProps({ width: '200px' }, props);
  const c = children(() => mergedProps.children);
  return <div class="select" style={{ width: mergedProps.width }}>
    <select
      disabled={mergedProps.disabled}
      onChange={(e) => { mergedProps.onChange(e.currentTarget.value); }}
      style={{ width: mergedProps.width }}
      value={ mergedProps.value }
    >
      { c() }
    </select>
  </div>;
}

export default function InputFieldSelect(props: ParentProps<InputFieldSelectProps>): JSX.Element {
  const mergedProps = mergeProps({ width: '200px' }, props);
  const c = children(() => mergedProps.children);
  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'}>
    <label class="label">{ mergedProps.label }</label>
    <InputSelect
      onChange={mergedProps.onChange}
      value={mergedProps.value}
      width={mergedProps.width}
      disabled={mergedProps.disabled}
    >
      { c() }
    </InputSelect>
  </div>;
}
