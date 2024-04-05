// Imports from solid-js
import { For, type JSX } from 'solid-js';

// Imports from other packages
import { FaSolidAngleDown } from 'solid-icons/fa';
import { HiSolidLanguage } from 'solid-icons/hi';

// Helpers from the generic Dropdown Menu component
import { onClickDropdown, onKeyDownDropdown } from './DropdownMenu.tsx';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { loadLocale } from '../i18n/i18n-util.sync';
import { Locales } from '../i18n/i18n-types';

function loadAndSetLocal(locale: Locales, setter: (locale: Locales) => void): void {
  loadLocale(locale);
  setter(locale);
}

function sortEntries(
  entries: { name: string; value: string }[],
  currentValue: string,
): { name: string; value: string }[] {
  // Sort entries so that the current value is the first of the array and the others are
  // ordered alphabetically.
  const t = entries.slice();
  return t.sort((a, b) => {
    if (a.value === currentValue) return -1;
    if (b.value === currentValue) return 1;
    return a.name.localeCompare(b.name);
  });
}

export default function DropdownLanguage(): JSX.Element {
  let refParentNode: HTMLDivElement;
  const { locale, setLocale, LL } = useI18nContext();
  const entries = [
    { name: 'English', value: 'en' },
    { name: 'Français', value: 'fr' },
  ];

  return <div
    classList={{ dropdown: true, 'is-right': true }}
    style={{ width: 'unset' }}
    id={'button-change-language'}
    ref={refParentNode!}
  >
    <div
      class="dropdown-trigger"
      style={{ width: '100%' }}
      onClick={onClickDropdown}
      onKeyDown={onKeyDownDropdown}
    >
      <button
        class="button"
        aria-haspopup="true"
        aria-controls={'dropdown-menu-change-language'}
        style={{ width: '100%' }}
        title={LL().HeaderApp.Language()}
        aria-label={LL().HeaderApp.Language()}
      >
        <HiSolidLanguage size={'1.4em'} />
        <span class="icon is-small">
          <FaSolidAngleDown size={'0.75em'} />
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id={'dropdown-menu-change-language'} role="menu" style={{ width: '100%' }}>
      <div class="dropdown-content" style={{ 'z-index': 1001 }}>
        <For each={sortEntries(entries, locale())}>
          {(entry) => (
            <a
              href="#"
              class="dropdown-item"
              classList={{
                'dropdown-item': true,
                'has-text-weight-semibold': entry.value === locale(),
              }}
              onClick={() => {
                loadAndSetLocal(entry.value as Locales, setLocale);
              }}
            >
              {entry.name}
            </a>
          )}
        </For>
      </div>
    </div>
  </div>;
}
