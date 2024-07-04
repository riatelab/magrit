import { JSX } from 'solid-js';

import { FaSolidMoon, FaSolidSun } from 'solid-icons/fa';

import { useI18nContext } from '../i18n/i18n-solid';

import '../styles/SwitchTheme.css';

export default function SwitchTheme(
  props: {
    class?: string,
    id?: string,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  return <button
    aria-label={LL().HeaderApp.NightDayMode()}
    class={props.class ? `switch-theme ${props.class}` : 'switch-theme'}
    id={props.id}
    type="button"
    role="switch"
  >
    <span class="check">
      <span class="icon">
        <span class="switch-icon sun"><FaSolidSun size={'0.9em'} /></span>
        <span class="switch-icon moon"><FaSolidMoon size={'0.9em'} /></span>
      </span>
    </span>
  </button>;
}
