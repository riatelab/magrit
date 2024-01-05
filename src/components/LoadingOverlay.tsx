import type { JSX } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';
import '../styles/LoadingOverlay.css';

// FIXME: the position of the text is sometimes wrong
export default function LoadingOverlay(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="loading-overlay">
    <div class="loading-overlay__spinner" />
    <div class="loading-overlay__text">{ LL().LoadingMessage() }</div>
  </div>;
}
