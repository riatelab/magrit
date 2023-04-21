import { JSX } from 'solid-js';
import { overlayDropStore } from './store/OverlayDropStore';
import './styles/OverlayDrop.css';

export default function OverlayDrop(): JSX.Element {
  return <div class="overlay-drop" classList={{ visible: overlayDropStore.show }}>
    <div class="overlay-drop__content">
      <div class="overlay-drop__content__title">Drop your file here</div>
    </div>
  </div>;
}
