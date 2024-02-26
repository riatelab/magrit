import { type JSX, For, onMount } from 'solid-js';
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
  prefix?: string;
  style?: { [key: string]: string };
}

function onClickOutsideDropdown(): void {
  // Close all dropdown menus
  const dropdowns = document.querySelectorAll('.dropdown-menu.is-block');
  for (let i = 0; i < dropdowns.length; i++) { // eslint-disable-line no-plusplus
    dropdowns[i].classList.remove('is-block');
  }
  document.removeEventListener('click', onClickOutsideDropdown);
}

function setDropdownItemTarget(event: Event, props: DropdownMenuProps): void {
  const target = event.currentTarget as HTMLElement;

  // Reference to the root of the dropdown component
  const dropdownRoot = target
    .parentElement!
    .parentElement!
    .parentElement!;

  // Set the dropdown item target
  const dropdownItemTarget = dropdownRoot
    .querySelector('.dropdown-item-target')!;
  dropdownItemTarget.textContent = `${props.prefix ? props.prefix : ''}${target.textContent}`;

  // Close the dropdown (collapse the dropdown menu)
  dropdownRoot.querySelector('.dropdown-menu')!.classList.toggle('is-block');
}

function onKeyDownDropdown(e: KeyboardEvent): void {
  const trigger = e.currentTarget as HTMLElement;
  const dropdown = trigger.parentElement!;
  const menu = dropdown.querySelector('.dropdown-menu')!;

  if (e.key === 'Enter' || e.key === 'Space') {
    e.preventDefault();
    menu.classList.toggle('is-block');
    const isOpen = menu.classList.contains('is-block');
    trigger.setAttribute('aria-expanded', `${isOpen}`);

    if (isOpen) {
      (menu.querySelector('.dropdown-item')! as HTMLAnchorElement).focus();
    }
  }

  if (e.key === 'Escape') {
    dropdown.classList.remove('is-active');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }
}

function onClickDropdown(event: Event): void {
  // Collapse all other dropdown menus
  const dropdowns = document.querySelectorAll('.dropdown');
  for (let i = 0; i < dropdowns.length; i++) { // eslint-disable-line no-plusplus
    dropdowns[i].querySelector('.dropdown-menu')!.classList.remove('is-block');
    dropdowns[i].querySelector('.dropdown-trigger button')!.setAttribute('aria-expanded', 'false');
  }
  // Toggle state of this dropdown menu
  const trigger = event.currentTarget as HTMLElement;
  const dropdown = trigger.parentElement!;
  const isOpen = dropdown.querySelector('.dropdown-menu')!.classList.toggle('is-block');
  trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

  if (isOpen) {
    // Add an event listener to close the dropdown menu when clicking outside
    document.addEventListener('click', onClickOutsideDropdown);
  } else {
    // Remove the event listener to close the dropdown menu when clicking outside
    document.removeEventListener('click', onClickOutsideDropdown);
  }
}

const defaultStyleDropdown = {
  width: '100%',
};

export default function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  let refParentNode: HTMLDivElement;

  onMount(() => {
    const items: NodeListOf<HTMLAnchorElement> = refParentNode.querySelectorAll('.dropdown-item');
    items
      .forEach((item) => {
        item.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextElement = (
              (e.target as HTMLAnchorElement)?.nextElementSibling as HTMLAnchorElement) || items[0];
            nextElement.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevElement = ((e.target as HTMLAnchorElement)
              ?.previousElementSibling as HTMLAnchorElement) || items[items.length - 1];
            prevElement.focus();
          }
        });
      });
  });
  return <div
    class="dropdown"
    style={{ ...defaultStyleDropdown, ...props.style }}
    id={props.id}
    ref={refParentNode!}
  >
    <div
      class="dropdown-trigger"
      style={{ width: '100%' }}
      onClick={ onClickDropdown }
      onKeyDown={ onKeyDownDropdown }
    >
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
    <div class="dropdown-menu" id={ props.id } role="menu" style={{ width: '100%' }}>
      <div class="dropdown-content" style={{ 'z-index': 1001 }}>
        <For each={props.entries}>
          {(entry) => (
            <a href="#" class="dropdown-item" onClick={ (ev) => {
              setDropdownItemTarget(ev, props);
              props.onChange(entry.value);
            }}>
              {entry.name}
            </a>
          )}
        </For>
      </div>
    </div>
  </div>;
}
