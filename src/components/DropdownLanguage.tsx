// Imports from solid-js
import { onMount, type JSX } from 'solid-js';

// Imports from other packages
import { FaSolidAngleDown } from 'solid-icons/fa';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { loadLocale } from '../i18n/i18n-util.sync';
import { Locales } from '../i18n/i18n-types';

function handleDropdownMenu(dropdown: HTMLDivElement | undefined): void {
  if (!dropdown) return;
  dropdown.addEventListener('click', () => {
    const isOpen = dropdown.querySelector('.dropdown-menu')!.classList.toggle('is-block');
    if (isOpen) {
      (dropdown.querySelector('.dropdown-item')! as HTMLDivElement).focus();
    }
  });
}

function loadAndSetLocal(locale: Locales, setter: (locale: Locales) => void): void {
  loadLocale(locale);
  setter(locale);
}
export default function DropdownLanguage(): JSX.Element {
  const { locale, setLocale, LL } = useI18nContext();
  let refParentNode: HTMLDivElement;
  onMount(() => {
    handleDropdownMenu(refParentNode);
  });
  return <div class="dropdown is-right" title={ LL().HeaderApp.Language() } tabindex={1} ref={refParentNode!}>
    <div class="dropdown-trigger">
      <button class="button is-primary" aria-haspopup="true" aria-controls="dropdown-menu">
        <span>{ locale() }</span>
        <span class="icon is-small">
          <FaSolidAngleDown />
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div
        class="dropdown-content"
        style={{
          'background-color': 'var(--bulma-primary)',
          color: 'white !important',
          padding: 0,
        }}
      >
        <a
          tabIndex={1}
          classList={{ 'dropdown-item is-primary button is-focusable': true, 'is-active': locale() === 'en' }}
          onClick={() => loadAndSetLocal('en' as Locales, setLocale)}>en</a>
        <a
          tabIndex={2}
          classList={{ 'dropdown-item is-primary button is-focusable': true, 'is-active': locale() === 'fr' }}
          onClick={() => loadAndSetLocal('fr' as Locales, setLocale)}>fr</a>
      </div>
    </div>
  </div>;
}
