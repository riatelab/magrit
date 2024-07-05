import { render } from 'solid-js/web';
import { JSX } from 'solid-js';

import TypesafeI18n from './i18n/i18n-solid';
import { loadLocale } from './i18n/i18n-util.sync';
import { resetContextMenuStore } from './store/ContextMenuStore';
import { initializeLightDarkMode } from './helpers/darkmode';
import './helpers/array.extension';

import 'bulma/css/bulma.min.css';
import './styles/Main.css';
import './styles/fonts.css';

import AppPage from './AppPage.tsx';

const root = document.getElementById('root') as HTMLElement;
// Remove loading message
root.innerHTML = '';
root.classList.add('content');
root.addEventListener('click', resetContextMenuStore);
root.addEventListener('contextmenu', resetContextMenuStore);

loadLocale('en');

// Handle the light / dark mode according to user preference
// (internally it uses the prefers-color-scheme media query,
// and we also subscribe to changes in the user preference
// to update the mode accordingly)
initializeLightDarkMode();

render(
  () => (
    <TypesafeI18n locale={'en'}>
      <AppPage />
    </TypesafeI18n>
  ) as JSX.Element,
  root,
);
