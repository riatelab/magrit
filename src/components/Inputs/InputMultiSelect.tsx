import { children, type JSX, type ParentProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import MultipleSelect from '../MultipleSelect.tsx';

interface InputFieldMultiSelectProps {
  label: LocalizedString | string;
  onChange: (value: string[]) => void;
  values: string[];
  width?: number;
  size?: number;
  layout?: 'horizontal' | 'vertical';
}

export default function InputFieldMultiSelect(
  props: ParentProps<InputFieldMultiSelectProps>,
): JSX.Element {
  const c = children(() => props.children);

  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'} style={{ height: '100%' }}>
    <label class="label">{props.label}</label>
    <MultipleSelect
      onChange={(e) => {
        const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
        props.onChange(selected);
      }}
      size={props.size}
      values={props.values}
    >
      { c() }
    </MultipleSelect>
  </div>;
}
