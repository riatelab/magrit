import { JSX, For } from 'solid-js';

import { contextMenuStore } from '../store/ContextMenuStore';

export default function ContextMenu(): JSX.Element {
  return <div
      class="dropdown is-active"
      style={{
        position: 'absolute',
        left: `${contextMenuStore.position[0]}px`,
        top: `${contextMenuStore.position[1]}px`,
        'z-index': 1000,
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
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
  </div>;
}
