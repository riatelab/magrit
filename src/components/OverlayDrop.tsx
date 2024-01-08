// Import from solid-js
import { For, JSX, Show } from 'solid-js';

// Stores
import { overlayDropStore } from '../store/OverlayDropStore';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { CustomFileList } from '../helpers/fileUpload';
import { convertAndAddFiles, isAuthorizedFile } from '../helpers/fileUpload';

// Styles
import '../styles/OverlayDrop.css';

/*
TODO: most of the logic in the file should be moved to a helper (because in the future it
  will be used in other places than the overlay drop - notably the view dedicated to
  handling files / user data)
*/

const displayFiles = (files: CustomFileList): JSX.Element => {
  const { LL } = useI18nContext();

  return <>
    <Show when={files.length === 0}>
      <p>{ LL().DropFilesHere() }</p>
    </Show>
    <Show when={files.length > 0}>
      <p>
        { LL().FilesDetected(files.length) }
      </p>
      <ul>
        <For each={files}>
          {
            (file) => {
              const authorized = isAuthorizedFile(file);
              const prop = authorized ? {} : { 'data-tooltip': LL().UnsupportedFormat() };
              return <li classList={{ authorized }} {...prop}>
                {file.name} ({file.file.size / 1000} kb)
              </li>;
            }
          }
        </For>
      </ul>
    </Show>
  </>;
};

export default function OverlayDrop(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="overlay-drop" classList={{ visible: overlayDropStore.show }}>
    <div class="overlay-drop__content">
      <div class="overlay-drop__content__title">
        { displayFiles(overlayDropStore.files) }
      </div>
      <div class="columns is-centered has-text-centered">
        <div class="column is-half">
          <button class="button is-success" onClick={async () => { await convertAndAddFiles(overlayDropStore.files); }}>
            { LL().ImportFiles() }
          </button>
        </div>
      </div>
    </div>
  </div>;
}
