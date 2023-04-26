import { JSX, onMount } from 'solid-js';
import { NavLink } from '@solidjs/router';
import { useI18nContext } from '../i18n/i18n-solid';
import DropdownLanguage from './DropdownLanguage.tsx';
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
        <img src="https://magrit.cnrs.fr/static/img/logo_magrit.png" style={{ 'background-color': 'black' }} alt="magrit-logo"/>
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
  // const { LL } = useI18nContext();
  onMount(handleBurgerClick);
  return <nav class="navbar is-black" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#">
        <img src="https://magrit.cnrs.fr/static/img/logo_magrit.png" style={{ 'background-color': 'black' }} alt="magrit-logo"/>
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
          <div class="buttons" />
        </div>
      </div>
    </div>
  </nav>;
}
