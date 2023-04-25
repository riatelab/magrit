import { For, JSX } from 'solid-js';
import { overlayDropStore } from './store/OverlayDropStore';
import './styles/OverlayDrop.css';

const displayFiles = (files: CustomFileList): JSX.Element => {
  if (files.length === 0) return <p>Drop your file(s) here !</p>;
  return <>
    <p>
      { files.length } file{ files.length > 1 ? 's' : '' } detected:
    </p>
    <ul>
      <For each={files}>
        {(file) => <li>{ file.name }</li>}
      </For>
    </ul>
  </>;
};

export default function OverlayDrop(): JSX.Element {
  return <div class="overlay-drop" classList={{ visible: overlayDropStore.show }}>
    <div class="overlay-drop__content">
      <div class="overlay-drop__content__title">
        { displayFiles(overlayDropStore.files) }
      </div>
    </div>
  </div>;
}
