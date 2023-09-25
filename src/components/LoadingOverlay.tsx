import { JSX } from 'solid-js';
import '../styles/LoadingOverlay.css';

export default function LoadingOverlay(): JSX.Element {
  return <div class="loading-overlay">
    <div class="loading-overlay__spinner" />
    <div class="loading-overlay__text">Loading...</div>
  </div>;
}
