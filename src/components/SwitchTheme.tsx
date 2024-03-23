import { JSX } from 'solid-js';

import { FaSolidMoon, FaSolidSun } from 'solid-icons/fa';

import '../styles/SwitchTheme.css';

export default function SwitchTheme(
  props: {
    class?: string,
    id?: string,
  },
): JSX.Element {
  return <button
    class={props.class ? `switch-theme ${props.class}` : 'switch-theme'}
    id={props.id}
    type="button"
    role="switch"
  >
    <span class="check">
      <span class="icon">
        <span class="switch-icon sun"><FaSolidSun width={'12px'} height={'12px'} /></span>
        <span class="switch-icon moon"><FaSolidMoon width={'12px'} height={'12px'} /></span>
      </span>
    </span>
  </button>;
}
