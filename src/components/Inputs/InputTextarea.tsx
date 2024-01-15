import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldTextareaProps {
  label: LocalizedString | string;
  value?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  onKeyUp?: (text: string) => void;
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;
}

export default function InputFieldTextarea(props: InputFieldTextareaProps): JSX.Element {
  return <div class="field-block">
    <label class="label">{ props.label }</label>
    <div class="control">
      <textarea
        class="textarea"
        onChange={(e) => { if (props.onChange) props.onChange(e.currentTarget.value); }}
        onKeyUp={(e) => { if (props.onKeyUp) props.onKeyUp(e.currentTarget.value); }}
        placeholder={ props.placeholder }
        style={{
          width: props.width ? `${props.width}px` : 'unset',
          height: props.height ? `${props.height}px` : 'unset',
        }}
        rows={ props.rows }
        cols={ props.cols }
      >
        { props.value || '' }
      </textarea>
    </div>
  </div>;
}
