import { FaSolidAngleDown } from 'solid-icons/fa';
import { onMount } from 'solid-js';
import { useI18nContext } from './i18n/i18n-solid';
import { loadLocale } from './i18n/i18n-util.sync';
import { Locales } from './i18n/i18n-types';

function handleDropdownMenu(): void {
  const dropdown: Element | null = document.querySelector('.dropdown');
  if (!dropdown) return;
  dropdown.addEventListener('click', () => {
    dropdown.classList.toggle('is-active');
  });
}

function loadAndSetLocal(locale: Locales, setter: (locale: Locales) => void): void {
  loadLocale(locale);
  setter(locale);
}
export default function DropdownLanguage() {
  const { locale, setLocale } = useI18nContext();
  onMount(handleDropdownMenu);
  return <div class="dropdown is-right">
    <div class="dropdown-trigger">
      <button class="button is-primary" aria-haspopup="true" aria-controls="dropdown-menu">
        <span>{ locale() }</span>
        <span class="icon is-small">
          <FaSolidAngleDown />
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content" style={{ 'background-color': '#00d1b2' }}>
        <a
          classList={{ 'dropdown-item is-primary button': true, 'is-active': locale() === 'en' }} onClick={() => loadAndSetLocal('en' as Locales, setLocale)}>en</a>
        <a
          classList={{ 'dropdown-item is-primary button': true, 'is-active': locale() === 'fr' }} onClick={() => loadAndSetLocal('fr' as Locales, setLocale)}>fr</a>
      </div>
    </div>
  </div>;
}
