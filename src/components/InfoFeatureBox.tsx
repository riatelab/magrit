// Imports from solid-js
import {
  createEffect, For, type JSX,
  on, onMount, Show,
} from 'solid-js';

import { FiInfo } from 'solid-icons/fi';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// Stores
import { globalStore } from '../store/GlobalStore';

// Styles
import '../styles/InfoFeatureBox.css';

export default function InfoFeatureBox(): JSX.Element {
  let refElement: HTMLDivElement;
  const { LL } = useI18nContext();

  const setStyle = () => {
    const { height } = refElement!.getBoundingClientRect();
    refElement!.style.top = `calc(50% - ${height / 2}px + var(--header-height) / 2)`;
  };

  onMount(() => {
    setStyle();
  });

  createEffect(
    on(
      () => [globalStore.infoTargetFeature, globalStore.isInfo],
      () => {
        setTimeout(() => {
          setStyle();
        }, 5);
      },
    ),
  );
  return <div class="info-feature-box" ref={refElement!}>
    <div class="info-feature-box__instruction">
      <FiInfo size={'1.4em'} style={{ 'margin-right': '0.5em', 'vertical-align': 'middle' }}/>
      { LL().MapZone.Controls.InfoInstruction() }
    </div>
    <Show when={globalStore.infoTargetFeature}>
      <hr style={{ margin: '0.5em 0', color: 'var(--bulma-border)' }} />
      <div class="info-feature-box__content">
        <div class="mb-1 mt-2">
          <i>{
            LL().MapZone.Controls.InfoLayerName({
              layerName: globalStore.infoTargetFeature!.layer,
            })
          }</i>
        </div>
        <For each={Object.keys(globalStore.infoTargetFeature!.properties)}>
          {(key) => <div>
            <b>{ key }</b>: { globalStore.infoTargetFeature!.properties[key] }
          </div>}
        </For>
      </div>
    </Show>
  </div>;
}
