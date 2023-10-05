// Imports from solid-js
import { JSX, onMount } from 'solid-js';
import { NavLink } from '@solidjs/router';

// Imports from other packages
import { CgDarkMode } from 'solid-icons/cg';
import {
  FaSolidCircleQuestion,
  FaSolidFloppyDisk,
  FaSolidFolderOpen,
  FaSolidFile,
} from 'solid-icons/fa';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// Sub-components
import DropdownLanguage from './DropdownLanguage.tsx';

// Assets
import img from '../assets/magrit.svg';

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
  return <nav class="navbar is-black" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#">
        <img src={img} style={{ 'background-color': 'black', width: '100%' }} alt="magrit-logo"/>
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
          <DropdownLanguage />
          <div class="buttons">
            <NavLink href="/app" class="button is-primary">{ LL().StartApplication() }</NavLink>
          </div>
        </div>
      </div>
    </div>
  </nav>;
}

export function HeaderBarApp(): JSX.Element {
  const { LL } = useI18nContext();
  onMount(handleBurgerClick);
  return <nav class="navbar is-black" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#">
        <img src={img} style={{ 'background-color': 'black', width: '100%' }} alt="magrit-logo"/>
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
            id="button-night-day"
            title={ LL().HeaderApp.NightDayMode() }
          >
            <CgDarkMode />
          </button>
          <button
            class="button button-header-bar"
            id="button-new-project"
            title={ LL().HeaderApp.NewProject() }
          >
            <FaSolidFile />
          </button>
          <button
            class="button button-header-bar"
            id="button-import-project"
            title={ LL().HeaderApp.ImportProjet() }
          >
            <FaSolidFolderOpen />
          </button>
          <button
            class="button button-header-bar"
            id="button-export-project"
            title={ LL().HeaderApp.SaveProject() }
          >
            <FaSolidFloppyDisk />
          </button>
          <button
            class="button button-header-bar"
            id="button-about-magrit"
            title={ LL().HeaderApp.About() }
          >
            <FaSolidCircleQuestion />
          </button>
          <DropdownLanguage title={ LL().HeaderApp.Language() }/>
          <div class="buttons" />
        </div>
      </div>
    </div>
  </nav>;
}
