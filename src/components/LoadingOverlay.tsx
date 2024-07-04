import { createMemo, JSX } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';
import { globalStore } from '../store/GlobalStore';
import '../styles/LoadingOverlay.css';

export default function LoadingOverlay(): JSX.Element {
  const { LL } = useI18nContext();
  const message = createMemo(() => (globalStore.loadingMessage === ''
    ? LL().LoadingMessages.Default()
    : LL().LoadingMessages[globalStore.loadingMessage]()));

  // Accessibility attributes are notably based on https://stackoverflow.com/a/59566339
  return <div
    class="loading-overlay"
    role="progressbar"
    aria-live="assertive"
    aria-busy="true"
    aria-valuetext={ message() }
  >
    <div class="loading-overlay__spinner" />
    <div class="loading-overlay__text" aria-hidden="true">{ message() }</div>
  </div>;
}
