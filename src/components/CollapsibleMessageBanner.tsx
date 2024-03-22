// Import from solid-js
import {
  children,
  createMemo, createSignal,
  type JSX,
  Match,
  ParentProps,
  Show,
  Switch,
} from 'solid-js';

import {
  FaSolidChevronDown, FaSolidChevronUp,
  FaSolidCircleInfo,
  FaSolidTriangleExclamation,
} from 'solid-icons/fa';

import type { LocalizedString } from 'typesafe-i18n';

import { useI18nContext } from '../i18n/i18n-solid';

type CollapsibleMessageBannerProps = {
  // Type of the banner
  type: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger',
  // Whether to use an icon in the title of the banner
  useIcon?: boolean,
  // The title of the banner.
  title: string | LocalizedString,
  // When used in a modal, we may want to expand the banner to the full width of the modal.
  expanded?: boolean,
  // Additional styles to apply to the banner parent element.
  style?: { [key: string]: string },
};

export default function CollapsibleMessageBanner(
  props: ParentProps<CollapsibleMessageBannerProps>,
): JSX.Element {
  const { LL } = useI18nContext();
  const c = children(() => props.children);
  const expanded = createMemo(() => props.expanded ?? false);
  const type = createMemo(() => props.type);
  const [
    showContent,
    setShowContent,
  ] = createSignal(true);

  return <article
    class={`message is-${type()}`}
    style={{
      'margin-left': expanded() ? '-2em' : '0',
      'margin-right': expanded() ? '-2em' : '0',
      'margin-bottom': '0',
      ...props.style,
    }}
  >
    <div
      class="message-header is-flex"
      style={{
        'border-start-start-radius': '0',
        'border-start-end-radius': '0',
      }}
    >
      <div class="is-flex is-align-items-center is-gap-1">
        <Show when={props.useIcon}>
          <div>
            <Switch>
              <Match when={props.type === 'warning' || props.type === 'danger'}>
                <FaSolidTriangleExclamation class="icon" />
              </Match>
              <Match
                when={props.type === 'info' || props.type === 'success' || props.type === 'link' || props.type === 'primary'}
              >
                <FaSolidCircleInfo class="icon" />
              </Match>
            </Switch>
          </div>
        </Show>
        <p>{ props.title }</p>
      </div>
      <button
        onClick={() => setShowContent(!showContent())}
        title={LL().Messages.ChevronTitle()}
        aria-label={LL().Messages.ChevronTitle()}
      >
        <Switch>
          <Match when={showContent()}>
            <FaSolidChevronUp
              height={'2em'}
              width={'2em'}
            />
          </Match>
          <Match when={!showContent()}>
            <FaSolidChevronDown
              height={'2em'}
              width={'2em'}
            />
          </Match>
        </Switch>
      </button>
    </div>
    <Show when={showContent()}>
      <div
        class="message-body"
        style={{
          'border-end-start-radius': '0',
          'border-end-end-radius': '0',
        }}
      >
        <div>
          {c()}
        </div>
      </div>
    </Show>
  </article>;
}
