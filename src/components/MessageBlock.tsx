// Import from solid-js
import {
  children,
  createMemo,
  type JSX,
  ParentProps,
  Show,
} from 'solid-js';

type MessageBlockProps = {
  type: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger',
  title?: string,
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
    <div class="message-body">
      { c() }
    </div>
  </article>;
}
