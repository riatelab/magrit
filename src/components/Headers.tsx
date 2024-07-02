// Imports from solid-js
import { JSX, onMount } from 'solid-js';
import { A } from '@solidjs/router';

// Imports from other packages
import {
  FaSolidCircleQuestion,
  FaSolidFloppyDisk,
  FaSolidFolderOpen,
  FaSolidFile,
  FaSolidGear,
} from 'solid-icons/fa';
import { ImUndo, ImRedo } from 'solid-icons/im';

// Stores
import { stateStackStore } from '../store/stateStackStore';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// Sub-components
import DropdownLanguage from './DropdownLanguage.tsx';
import SwitchTheme from './SwitchTheme.tsx';

// Assets
import img from '../assets/logo_typo_picto_green.svg?url';

// Styles
import '../styles/Headers.css';

const handleBurgerClick = () => {
  // Get all "navbar-burger" elements
  const $navbarBurgers: Array<HTMLElement> = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Add a click event on each of them
  $navbarBurgers.forEach((el) => {
    el.addEventListener('click', () => {
      // Get the target from the "data-target" attribute
      const target: string = el.dataset.target!;
      const $target: HTMLElement | null = document.getElementById(target);

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      el.classList.toggle('is-active');
      if ($target !== null) $target.classList.toggle('is-active');
    });
  });
};

export function HeaderBarWelcome(): JSX.Element {
  onMount(handleBurgerClick);
  const { LL } = useI18nContext();
  return <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#" style={{ 'background-color': 'transparent' }}>
        <img class="magrit-logo" src={img} style={{ width: '100%' }} alt="magrit-logo"/>
      </a>

      <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navBarHome">
        <span aria-hidden="true"/>
        <span aria-hidden="true"/>
        <span aria-hidden="true"/>
      </a>
    </div>

    <div id="navBarHome" class="navbar-menu">
      <div class="navbar-start">
        {/* <a class="navbar-item" to="/">Home</a> */}
        {/* <a class="navbar-item" to="/about">About</a> */}
        {/* <a class="navbar-item" to="/documentation">Documentation</a> */}
      </div>
      <div class="navbar-end">
        <div class="navbar-item">
          <DropdownLanguage/>
          &nbsp;&nbsp;
          <SwitchTheme class="button-header-bar" id="toggle-night-day" />
          &nbsp;&nbsp;
          <div class="buttons">
            <A href="/app" class="button is-primary">{LL().StartApplication()}</A>
          </div>
        </div>
      </div>
    </div>
  </nav>;
}

export function HeaderBarApp(): JSX.Element {
  const { LL } = useI18nContext();
  onMount(handleBurgerClick);
  return <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#" style={{ 'background-color': 'transparent' }}>
        <img class="magrit-logo" src={img} style={{ width: '100%' }} alt="magrit-logo"/>
      </a>

      <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navBarHome">
        <span aria-hidden="true"/>
        <span aria-hidden="true"/>
        <span aria-hidden="true"/>
      </a>
    </div>

    <div id="navBarHome" class="navbar-menu">
      <div class="navbar-start">
      </div>
      <div class="navbar-end">
        <div class="navbar-item">
          <button
            class="button button-header-bar"
            id="button-undo"
            aria-label={LL().HeaderApp.Undo()}
            title={LL().HeaderApp.Undo()}
            disabled={stateStackStore.undoStack.length === 0}
          >
            <ImUndo size={'1.5em'}/>
          </button>
          <button
            class="button button-header-bar"
            id="button-redo"
            aria-label={LL().HeaderApp.Redo()}
            title={LL().HeaderApp.Redo()}
            disabled={stateStackStore.redoStack.length === 0}
          >
            <ImRedo size={'1.5em'}/>
          </button>
          <p style={{ margin: '1em' }}></p>
          <button
            class="button button-header-bar"
            id="button-new-project"
            aria-label={LL().HeaderApp.NewProject()}
            title={LL().HeaderApp.NewProject()}
          >
            <FaSolidFile size={'1.5em'}/>
          </button>
          <button
            class="button button-header-bar"
            id="button-import-project"
            aria-label={LL().HeaderApp.ImportProjet()}
            title={LL().HeaderApp.ImportProjet()}
          >
            <FaSolidFolderOpen size={'1.5em'}/>
          </button>
          <button
            class="button button-header-bar"
            id="button-export-project"
            aria-label={LL().HeaderApp.SaveProject()}
            title={LL().HeaderApp.SaveProject()}
          >
            <FaSolidFloppyDisk size={'1.5em'}/>
          </button>
          <button
            class="button button-header-bar"
            id="button-about-magrit"
            aria-label={LL().HeaderApp.About()}
            title={LL().HeaderApp.About()}
          >
            <FaSolidCircleQuestion size={'1.5em'}/>
          </button>
          <div
            class="vertical-divider"
            style={{
              width: '1px',
              height: '2.4em',
              background: 'var(--bulma-border)',
            }}
          ></div>
          <DropdownLanguage/>
          <SwitchTheme class="button-header-bar" id="toggle-night-day"/>
        </div>
      </div>
    </div>
  </nav>;
}
