import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldButtonProps {
  label: LocalizedString | string;
  onClick: () => void;
}

export default function InputFieldButton(props: InputFieldButtonProps): JSX.Element {
  return <div class="field is-justify-content-center">
    <div class="control">
      <button class="button" onClick={props.onClick}>
        { props.label }
      </button>
    </div>
  </div>;
}
