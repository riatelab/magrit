import {
  createSignal, JSX, Show,
} from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid.ts';

export default function LayoutFeatures(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layout-features-section">
  </div>;
}
