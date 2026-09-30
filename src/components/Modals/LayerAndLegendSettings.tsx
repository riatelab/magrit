// Imports from solid-js
import {
  Accessor,
  createMemo,
  For,
  type JSX,
} from 'solid-js';

// Helpers
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { makeOnClickTabButton } from '../../helpers/tabs';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import LayerSettings from './LayerSettings.tsx';
import LegendSettings from './LegendSettings.tsx';

// Types / Interfaces / Enums
import type { Legend } from '../../global';

const onClickTabButton = makeOnClickTabButton('layer-legend-settings');

export default function LayerAndLegendSettings(
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
    caller: string,
  },
): JSX.Element {
  const legendsId = createMemo(() => layersDescriptionStore.layoutFeaturesAndLegends
    .filter((el) => (el as Legend).layerId === props.id)
    .map((el) => el.id) as string[]);

  return <>
    <div class="layer-legend-settings__tabs tabs is-centered is-boxed is-fullwidth">
      <ul
        class="ml-0"
        role="tablist"
        aria-label={props.LL().LayerAndLegendSettings.Description()}
      >
        <li
          classList={{ 'is-active': props.caller === props.id }}
          role="presentation"
        >
          <a
            id="layer-legend-settings__content__layer-tab"
            role="tab"
            aria-controls="layer-legend-settings__content__layer"
            aria-selected={props.caller === props.id ? 'true' : 'false'}
            onClick={(ev) => { onClickTabButton(ev, 'layer'); }}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') onClickTabButton(ev, 'layer');
            }}
          >
            { props.LL().LayerAndLegendSettings.Layer() }
          </a>
        </li>
        <For each={legendsId()}>
          {
            (legendId, i) => (
              <li
                classList={{ 'is-active': props.caller === legendId }}
                role="presentation"
              >
                <a
                  id={`layer-legend-settings__content__legend-${legendId}-tab`}
                  role="tab"
                  aria-controls={`layer-legend-settings__content__legend-${legendId}`}
                  aria-selected={props.caller === legendId}
                  onClick={(ev) => { onClickTabButton(ev, `legend-${legendId}`); }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') onClickTabButton(ev, `legend-${legendId}`);
                  }}
                >
                  {
                    i() === 0
                      ? props.LL().LayerAndLegendSettings.Legend()
                      : props.LL().LayerAndLegendSettings.Chart()
                  }
                </a>
              </li>
            )
          }
        </For>
      </ul>
    </div>
    <div class="layer-legend-settings__content">
      <div
        id="layer-legend-settings__content__layer"
        aria-labelledby="layer-legend-settings__content__layer-tab"
        classList={{ 'is-hidden': props.caller !== props.id }}
        role="tabpanel"
      >
        <LayerSettings id={props.id} LL={props.LL} />
      </div>
      <For each={legendsId()}>
        {
          (legendId) => <div
            id={`layer-legend-settings__content__legend-${legendId}`}
            aria-labelledby={`layer-legend-settings__content__legend-${legendId}-tab`}
            classList={{ 'is-hidden': props.caller !== legendId }}
            role="tabpanel"
          >
            <LegendSettings legendId={legendId} LL={props.LL} />
          </div>
        }
      </For>
    </div>
  </>;
}
