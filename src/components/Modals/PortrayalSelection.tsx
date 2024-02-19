// Imports from solid-js
import {
  createSignal,
  type JSX,
  Match,
  onMount,
  Show,
  Switch,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

interface PortrayalDescription {
  id: string;
  name: string;
  description: string;
}

function CardPortrayal(portrayalDescription: PortrayalDescription): JSX.Element {
  return <div class="card" style={{ margin: '1em' }}>
    <header>
      <p></p>
    </header>
    <section class="card-content">
      <div class="content">
      </div>
    </section>
  </div>;
}

export default function PortrayalSelection(): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  return <div class="modal-window modal portrayal-selection" style={{ display: 'flex' }} ref={refParentNode!}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().PortrayalSelection.Title() }</p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex"></div>
      </section>
    </div>
  </div>;
}
