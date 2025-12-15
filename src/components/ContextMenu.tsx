import {
  createSignal,
  JSX,
  For,
  onMount,
} from 'solid-js';
import { Portal } from 'solid-js/web';

import { contextMenuStore } from '../store/ContextMenuStore';

export default function ContextMenu(): JSX.Element {
  let refMenuNode: HTMLDivElement;

  const [left, setLeft] = createSignal(contextMenuStore.position[0]);
  const [top, setTop] = createSignal(contextMenuStore.position[1]);
  // We want to ensure that the context menu doesn't overflow
  // the window, so we position it at the position of the mouse
  // but we also need to know the dimensions of the window
  // and reposition the context menu after it has been rendered
  // if it overflows the window
  onMount(() => {
    // const contextMenu = refParentNode.querySelector('.dropdown-menu') as HTMLElement;
    const contextMenuRect = refMenuNode!.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    if (contextMenuRect.right > windowWidth) {
      setLeft(windowWidth - contextMenuRect.width);
    }
    if (contextMenuRect.bottom > windowHeight) {
      setTop(windowHeight - contextMenuRect.height);
    }
  });

  return <Portal
    mount={document.getElementById('root') as HTMLElement}
  >
    <div
      class="dropdown is-active"
      style={{
        'z-index': 1000,
        position: 'fixed',
        left: 0,
        top: 0,
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        class="dropdown-menu"
        id="dropdown-menu"
        role="menu"
        ref={refMenuNode!}
        style={{
          position: 'absolute',
          left: `${left()}px`,
          top: `${top()}px`,
        }}
      >
        <div class="dropdown-content">
          <For each={contextMenuStore.entries}>
            {
              (entry) => (
                entry.type === 'divider'
                  ? <hr class="dropdown-divider" />
                  : <a class="dropdown-item" onClick={entry.callback}>
                    {entry.label}
                  </a>
              )
            }
          </For>
        </div>
      </div>
    </div>
  </Portal>;
}
