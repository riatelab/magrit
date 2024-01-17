import { createMemo, JSX } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';
import { globalStore } from '../store/GlobalStore';
import '../styles/LoadingOverlay.css';

export default function LoadingOverlay(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="loading-overlay">
    <div class="loading-overlay__spinner" />
    <div class="loading-overlay__text">{ globalStore.loadingMessage === ''
      ? LL().LoadingMessages.Default()
      : LL().LoadingMessages[globalStore.loadingMessage]() }</div>
  </div>;
}
