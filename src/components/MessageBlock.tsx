// Import from solid-js
import {
  children,
  createMemo,
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
  const type = createMemo(() => props.type);

  return <article class={`message is-${type()}`}>
    <Show when={props.title}>
      <div class="message-header">
        <p>{ props.title }</p>
      </div>
    </Show>
    <div class="message-body is-flex is-gap-2">
      <Show when={props.useIcon}>
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
