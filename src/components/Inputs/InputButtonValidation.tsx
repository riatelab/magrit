import { type JSX } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface ButtonValidationProps {
  label: LocalizedString | string;
  onClick: () => void;
  disabled?: boolean;
}
export default function ButtonValidation(props: ButtonValidationProps): JSX.Element {
  return <div class="has-text-centered">
    <button
      class="button is-success portrayal-section__button-validation"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      { props.label }
    </button>
  </div>;
}
