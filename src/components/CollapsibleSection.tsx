import {
  children,
  createSignal,
  type JSX,
  Match,
  ParentProps,
  Show,
  Switch,
} from 'solid-js';

import {
  FaSolidChevronDown,
  FaSolidChevronUp,
} from 'solid-icons/fa';

interface CollapsibleSectionProps {
  id?: string,
  title: string,
}

export default function CollapsibleSection(
  props: ParentProps<CollapsibleSectionProps>,
): JSX.Element {
  const [collapsed, setCollapsed] = createSignal(true);
  const c = children(() => props.children);
  const id = props.id || `collapsible-section-${Math.random().toString(36).substring(7)}`;
  const idInner = `${id}-inner`;
  return <div
    id={id}
    class="collapsible-section"
    style={{
      margin: '1em 0',
    }}
  >
    <button
      class="collapsible-section-trigger"
      aria-expanded={!collapsed()}
      aria-controls={idInner}
      onClick={() => setCollapsed(!collapsed())}
      style={{
        display: 'flex',
        'align-items': 'center',
        width: '100%',
        'text-align': 'left',
        padding: '0.5em',
        background: 'none',
        color: 'currentColor',
        border: 'solid 1px currentColor',
        ...collapsed() ? {} : { 'border-bottom': 'none' },
      }}
    >
      <span>{ props.title }</span>
      <Switch>
        <Match when={collapsed()}>
          <FaSolidChevronDown
            style={{ 'margin-left': '1em' }}
          />
        </Match>
        <Match when={!collapsed()}>
          <FaSolidChevronUp
            style={{ 'margin-left': '1em' }}
          />
        </Match>
      </Switch>
    </button>
    <Show when={!collapsed()}>
      <section
        id={idInner}
        style={{
          border: 'solid 1px currentColor',
          padding: '0.5em',
        }}
      >
        { c() }
      </section>
    </Show>
  </div>;
}
