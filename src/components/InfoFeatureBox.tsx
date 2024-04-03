import {
  createEffect, type JSX, on, onMount,
  Show,
} from 'solid-js';

import { FiInfo } from 'solid-icons/fi';

import { useI18nContext } from '../i18n/i18n-solid';

import { infoFeatureStore } from '../store/InfoFeatureStore';

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
      () => infoFeatureStore.featureProperties,
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
    <Show when={Object.keys(infoFeatureStore.featureProperties).length > 0}>
      <hr style={{ margin: '0.5em 0', color: 'var(--bulma-border)' }} />
    </Show>
    <div class="info-feature-box__content">
    { infoFeatureStore.show && Object.keys(infoFeatureStore.featureProperties).map((key) => <div>
        <b>{ key }</b>: { infoFeatureStore.featureProperties[key] }
      </div>) }
    </div>
  </div>;
}
