import {
  children,
  createSignal,
  type JSX,
  Match,
  ParentProps,
  Switch,
} from 'solid-js';

import { VsTriangleDown, VsTriangleUp } from 'solid-icons/vs';

interface CollapsibleSectionProps {
  summaryContent: string,
}

export default function DetailsSummary(
  props: ParentProps<CollapsibleSectionProps>,
): JSX.Element {
  const c = children(() => props.children);
  const [
    collapsed,
    setCollapsed,
  ] = createSignal(true);

  return <>
    <details>
      <summary
        class={'label is-flex is-align-items-center is-justify-content-space-between mb-4'}
        onClick={() => { setCollapsed(!collapsed()); }}
      >
        { props.summaryContent }
        <Switch>
          <Match when={!collapsed()}>
            <VsTriangleUp style={{ 'margin-right': '0.5em' }} />
          </Match>
          <Match when={collapsed()}>
            <VsTriangleDown style={{ 'margin-right': '0.5em' }} />
          </Match>
        </Switch>
      </summary>
      <div>
        { c() }
      </div>
    </details>
  </>;
}
