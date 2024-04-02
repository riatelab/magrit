// Imports from solid-js
import { type JSX } from 'solid-js';

// Sub-components
import DropdownMenu from './DropdownMenu.tsx';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { loadLocale } from '../i18n/i18n-util.sync';
import { Locales } from '../i18n/i18n-types';

function loadAndSetLocal(locale: Locales, setter: (locale: Locales) => void): void {
  loadLocale(locale);
  setter(locale);
}

export default function DropdownLanguage(): JSX.Element {
  const { locale, setLocale, LL } = useI18nContext();
  const entries = [
    { name: 'en', value: 'en' },
    { name: 'fr', value: 'fr' },
  ];

  return <DropdownMenu
    id={'button-change-language'}
    classList={{ 'is-right': true }}
    entries={entries}
    defaultEntry={
      entries
        .find((entry) => entry.value === locale())
      || { name: 'en' }
    }
    onChange={(value) => loadAndSetLocal(value as Locales, setLocale)}
    triggerTitle={LL().HeaderApp.Language()}
    style={{ width: 'unset' }}
  />;
}
