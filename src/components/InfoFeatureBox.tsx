import {
  createEffect, type JSX, on, onMount,
  Show,
} from 'solid-js';

import { FiInfo } from 'solid-icons/fi';

import { useI18nContext } from '../i18n/i18n-solid';

import { globalStore } from '../store/GlobalStore';

import '../styles/InfoFeatureBox.css';

export default function InfoFeatureBox(): JSX.Element {
  let refElement: HTMLDivElement;
  const { LL } = useI18nContext();
  onMount(() => {
    const { height } = refElement.getBoundingClientRect();
    refElement.style.top = `calc(50% - ${height / 2}px)`;
  });
  createEffect(
    on(
      () => globalStore.infoTargetFeature,
      () => {
        setTimeout(() => {
          const { height } = refElement.getBoundingClientRect();
          refElement.style.top = `calc(50% - ${height / 2}px)`;
        }, 5);
      },
    ),
  );
  return <div class="info-feature-box" ref={refElement!}>
    <div class="info-feature-box__instruction">
      <FiInfo size={'1.4em'} style={{ 'margin-right': '0.5em', 'vertical-align': 'middle' }}/>
      { LL().MapZone.Controls.InfoInstruction() }
    </div>
    <Show when={Object.keys(globalStore.infoTargetFeature).length > 0}>
      <hr style={{ margin: '0.5em 0', color: 'var(--bulma-border)' }} />
    </Show>
    <div class="info-feature-box__content">
    { globalStore.isInfo && Object.keys(globalStore.infoTargetFeature).map((key) => <div>
        <b>{ key }</b>: { globalStore.infoTargetFeature[key] }
      </div>) }
    </div>
  </div>;
}
