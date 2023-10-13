// Import from solid-js
import {
  type JSX,
  Match,
  onMount,
  Switch,
} from 'solid-js';

// Helpers
import { bindDragBehavior, triggerContextMenuLayoutFeature } from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import { type ScaleBar, ScaleBarStyle, } from '../../global.d';

export default function ScaleBarRenderer(props: ScaleBar): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindDragBehavior(refElement, props);
  });

  return <g
    ref={refElement}
    class="layout-feature scale-bar"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    >
    <Switch>
      <Match when={props.style === ScaleBarStyle.simpleLine}>
      </Match>
      <Match when={props.style === ScaleBarStyle.lineWithTicksOnBottom}>
      </Match>
      <Match when={props.style === ScaleBarStyle.lineWithTicksOnTop}>
      </Match>
      <Match when={props.style === ScaleBarStyle.blackAndWhiteBar}>
      </Match>
    </Switch>
  </g>;
}
