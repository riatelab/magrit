// Import from solid-js
import {
  children,
  type JSX,
  Match,
  ParentProps,
  Show,
  Switch,
} from 'solid-js';

import {
  FaSolidCircleInfo,
  FaSolidTriangleExclamation,
} from 'solid-icons/fa';

import type { LocalizedString } from 'typesafe-i18n';

type MessageBlockProps = {
  type: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger',
  useIcon?: boolean,
  title?: string | LocalizedString,
};

export default function MessageBlock(props: ParentProps<MessageBlockProps>): JSX.Element {
  const c = children(() => props.children);

  return <article class={`message is-${props.type}`}>
    <Show when={props.title}>
      <div class="message-header" style={{ 'justify-content': 'start', gap: '1em' }}>
        <Show when={props.title && props.useIcon}>
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
    </Show>
    <div class="message-body is-flex is-gap-2">
      <Show when={!props.title && props.useIcon}>
        <div class="is-flex is-align-items-center">
          <Switch>
            <Match when={props.type === 'warning' || props.type === 'danger'}>
              <FaSolidTriangleExclamation class="icon" />
            </Match>
            <Match when={props.type === 'info' || props.type === 'success'}>
              <FaSolidCircleInfo class="icon" />
            </Match>
          </Switch>
        </div>
      </Show>
      <div>
        { c() }
      </div>
    </div>
  </article>;
}
