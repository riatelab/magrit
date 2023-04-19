import { render } from 'solid-js/web';
import {
  Route, Router, Routes,
} from '@solidjs/router';
import { JSX } from 'solid-js';
import TypesafeI18n from './i18n/i18n-solid';
import { loadLocale } from './i18n/i18n-util.sync';

import 'bulma/css/bulma.min.css';

import WelcomePage from './WelcomePage.tsx';
import AppPage from './AppPage.tsx';

const root: HTMLElement = document.getElementById('root');
root.classList.add('content');

console.log('app root', 'root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?',
  );
}

loadLocale('en');

render(
  () => (
  <TypesafeI18n>
    <Router>
      <Routes>
        <Route path="/" end element={ <WelcomePage /> } />
        <Route path="/app" element={ <AppPage /> } />
      </Routes>
    </Router>
  </TypesafeI18n>
  ) as JSX.Element,
  root,
);
