// Imports from solid-js
import {
  createSignal, JSX, For,
  Match, onCleanup, onMount,
  Show, Switch,
} from 'solid-js';
import { BivariateChoroplethParameters, ClassificationMethod } from '../../global.d';
import { useI18nContext } from '../../i18n/i18n-solid';
import { classificationMultivariatePanelStore } from '../../store/ClassificationMultivariatePanelStore';

export default function ClassificationBivariatePanel(): JSX.Element {
  const { LL } = useI18nContext();

  const parameters = classificationMultivariatePanelStore
    .classificationParameters as BivariateChoroplethParameters;

  // Signals for the current component:
  // - the classification for the variable 1
  const [
    classificationMethod,
    setClassificationMethod,
  ] = createSignal<ClassificationMethod>(
    ClassificationMethod.quantiles,
  );
  // - the classification for the variable 2
  // - the color scheme
  // - the color chosen by the user for the no data values
  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(
    parameters.noDataColor,
  );
  let refParentNode: HTMLDivElement;

  return <div
    class="modal-window classification-bivariate-panel"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  ></div>;
}
