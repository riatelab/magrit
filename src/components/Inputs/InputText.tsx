import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldTextProps {
  label: LocalizedString | string;
  value?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  onKeyUp?: (text: string) => void;
  width?: number;
  layout?: 'horizontal' | 'vertical';
}

export default function InputFieldText(props: InputFieldTextProps): JSX.Element {
  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'}>
    <label class="label">{ props.label }</label>
    <div class="control">
      <input
        class="input"
        type="text"
        onChange={(e) => { if (props.onChange) props.onChange(e.currentTarget.value); }}
        onKeyUp={(e) => { if (props.onKeyUp) props.onKeyUp(e.currentTarget.value); }}
        value={ props.value || '' }
        placeholder={ props.placeholder }
        style={{ width: props.width ? `${props.width}px` : 'unset' }}
      />
    </div>
  </div>;
}
