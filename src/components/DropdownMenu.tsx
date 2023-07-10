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
  id: string,
  entries: DropdownMenuEntry[];
  defaultEntry: DropdownMenuEntry | DropdownMenuPlaceholder;
  onChange: (value: string) => void;
}

function onClickOutsideDropdown(): void {
  // Close all dropdown menus
  const dropdowns = document.querySelectorAll('.dropdown-menu.is-block');
  for (let i = 0; i < dropdowns.length; i++) { // eslint-disable-line no-plusplus
    dropdowns[i].classList.remove('is-block');
  }
  document.removeEventListener('click', onClickOutsideDropdown);
}

function setDropdownItemTarget(event: Event): void {
  const target = event.currentTarget as HTMLElement;

  // Reference to the root of the dropdown component
  const dropdownRoot = target
    .parentElement
    .parentElement
    .parentElement;

  // Set the dropdown item target
  const dropdownItemTarget = dropdownRoot
    .querySelector('.dropdown-item-target');
  dropdownItemTarget.textContent = target.textContent;
  dropdownItemTarget.value = target.value;

  // Close the dropdown (collapse the dropdown menu)
  dropdownRoot.querySelector('.dropdown-menu').classList.toggle('is-block');
}

function onClickDropdown(event: Event): void {
  // Collapse all other dropdown menus
  const dropdowns = document.querySelectorAll('.dropdown-menu.is-block');
  for (let i = 0; i < dropdowns.length; i++) { // eslint-disable-line no-plusplus
    dropdowns[i].classList.remove('is-block');
  }
  // Expand the dropdown menu
  const target = event.currentTarget as HTMLElement;
  target.parentElement.querySelector('.dropdown-menu').classList.toggle('is-block');

  // Add an event listener to close the dropdown menu when clicking outside
  document.addEventListener('click', onClickOutsideDropdown);
}

export default function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  return <div class="dropdown dropdown__layer" style={{ width: '100%' }}>
    <div class="dropdown-trigger" style={{ width: '100%' }} onclick={ onClickDropdown }>
      <button class="button" aria-haspopup="true" aria-controls={ props.id } style={{ width: '100%' }}>
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
    <div class="dropdown-menu" id={ props.id } role="menu">
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
