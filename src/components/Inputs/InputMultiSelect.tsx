import {
  children, type JSX, type ParentProps, createMemo,
} from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import MultipleSelect from '../MultipleSelect.tsx';

interface InputFieldMultiSelectProps {
  label: LocalizedString | string;
  onChange: (value: string[]) => void;
  values: string[];
  width?: number;
  size?: number;
  layout?: 'horizontal' | 'vertical';
  styles?: { [key: string]: string };
}

export default function InputFieldMultiSelect(
  props: ParentProps<InputFieldMultiSelectProps>,
): JSX.Element {
  const c = children(() => props.children);
  const styles = createMemo(() => {
    const s = { ...props.styles };
    if (!s.height) {
      s.height = '100%';
    }
    return s;
  });
  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'} style={styles()}>
    <label class="label">{props.label}</label>
    <MultipleSelect
      onChange={(e) => {
        const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
        props.onChange(selected);
      }}
      size={props.size}
      values={props.values}
      width={props.width}
    >
      { c() }
    </MultipleSelect>
  </div>;
}
