import { FaSolidAngleDown } from 'solid-icons/fa';
import { onMount } from 'solid-js';
import { useI18nContext } from './i18n/i18n-solid';
import { loadLocale } from './i18n/i18n-util.sync';
import { Locales } from './i18n/i18n-types';

function handleDropdownMenu(): void {
  const dropdown = document.querySelector('.dropdown');
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
  return <div class="dropdown">
    <div class="dropdown-trigger">
      <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
        <span>{ locale }</span>
        <span class="icon is-small">
          <FaSolidAngleDown />
        </span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <a class={ locale() === 'en' ? 'dropdown-item is-active' : 'dropdown-item'} onClick={() => loadAndSetLocal('en' as Locales, setLocale)}>en</a>
        <a class={ locale() === 'fr' ? 'dropdown-item is-active' : 'dropdown-item'} onClick={() => loadAndSetLocal('fr' as Locales, setLocale)}>fr</a>
      </div>
    </div>
  </div>;
}
