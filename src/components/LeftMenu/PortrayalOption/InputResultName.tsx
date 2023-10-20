import { JSX } from 'solid-js';
import { useI18nContext } from '../../../i18n/i18n-solid';

interface ResultNameInputProps {
  // The value of the input, as a string, may be empty
  value?: string;
  // The callback to call when the value of the input changes
  onChange?: (value: string) => void;
  // The callback to call when the user presses the Enter key
  // (note that that if onKeyUp is defined, it will be called first)
  onEnter?: () => void;
  // The callback to call when the user releases a key
  onKeyUp?: (value: string) => void;
}

export default function InputResultName(props: ResultNameInputProps): JSX.Element {
  const { LL } = useI18nContext();
  return <div class="field-block">
    <label class="label">{ LL().PortrayalSection.ResultName() }</label>
    <div class="control">
      <input
        class="input"
        type="text"
        placeholder={ LL().PortrayalSection.ResultNamePlaceholder() }
        value={ props.value || '' }
        onChange={(e) => {
          if (props.onChange) props.onChange(e.target.value);
        }}
        onKeyUp={(e) => {
          if (props.onKeyUp) props.onKeyUp(e.target.value);
          if (e.key === 'Enter' && props.onEnter) props.onEnter();
        }}
      />
    </div>
  </div>;
}
