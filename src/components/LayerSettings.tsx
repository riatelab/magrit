import { Accessor, JSX } from 'solid-js';
import { TranslationFunctions } from '../i18n/i18n-types';

export default function LayerSettings(props: any, LL: Accessor<TranslationFunctions>): JSX.Element {
  console.log(LL);
  return <div class="layer-settings">
    <h2>{ }</h2>
    <div class="layer-settings__title">
      { props.name }
    </div>
    <div class="layer-settings__content">
      { props.children }
    </div>
  </div>;
}
