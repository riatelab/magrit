// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Types
import type { PortrayalSettingsProps } from './common';

function onClickValidate(
  referenceLayerId: string,
  targetVariables: [string, string, string],
) {

}

export default function TrivariateChoroSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  return <div></div>;
}
