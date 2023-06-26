import { JSX, For } from 'solid-js';
import { FaSolidAngleDown } from 'solid-icons/fa';

interface DropdownMenuEntry {
  name: string;
  value: string;
}

interface DropdownMenuPlaceholder {
  name: string;
}

interface DropdownMenuProps {
  entries: DropdownMenuEntry[];
  defaultEntry: DropdownMenuEntry | DropdownMenuPlaceholder;
  onChange: (value: string) => void;
}

function setDropdownItemTarget(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const dropdownItemTarget = target
    .parentElement
    .parentElement
    .parentElement
    .querySelector('.dropdown-item-target');
  dropdownItemTarget.textContent = target.textContent;
  dropdownItemTarget.value = target.value;
}

export default function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  return <div class="dropdown is-hoverable dropdown__layer" style={{ width: '100%' }}>
    <div class="dropdown-trigger" style={{ width: '100%' }}>
      <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-file" style={{ width: '100%' }}>
        <span
          class="dropdown-item-target"
          style={{
            width: '100%',
            'text-overflow': 'ellipsis',
            overflow: 'hidden',
            'text-align': 'left',
          }}
        >
          { props.defaultEntry.name }
        </span>
        <span class="icon is-small">
          <FaSolidAngleDown />
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu-export-geo-file" role="menu">
      <div class="dropdown-content">
        <For each={props.entries}>
          {(entry) => (
            <a href="#" class="dropdown-item" value={entry.value} onClick={ (ev) => {
              setDropdownItemTarget(ev);
              props.onChange(entry.value);
            } }>
              {entry.name}
            </a>
          )}
        </For>
      </div>
    </div>
  </div>;
}
