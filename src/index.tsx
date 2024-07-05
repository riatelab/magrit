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

const firstRender = () => {
  render(
    () => (
      <TypesafeI18n locale={'en'}>
        <AppPage />
      </TypesafeI18n>
    ) as JSX.Element,
    root,
  );
};

const s = document.querySelector('#stylesheet');

if (s instanceof HTMLLinkElement) {
  // In production, we only want to render the app after the stylesheet has loaded
  // (to avoid the flash of unstyled content)
  if (s.sheet) firstRender();
  else {
    s.addEventListener('load', () => {
      firstRender();
    });
  }
} else {
  // In dev we can just render the app right away
  firstRender();
}
