// Import from solid-js
import {
  createMemo, For, JSX, Show,
} from 'solid-js';

// Stores
import { overlayDropStore } from '../store/OverlayDropStore';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { CustomFileList } from '../helpers/fileUpload';
import { convertAndAddFiles, isAuthorizedFile } from '../helpers/fileUpload';

// Styles
import '../styles/OverlayDrop.css';

const FileListDisplay = (props: { files: CustomFileList }): JSX.Element => {
  const { LL } = useI18nContext();
  const length = createMemo(() => props.files.length);

  return <>
    <Show when={length() === 0}>
      <p>{ LL().DropFilesHere() }</p>
    </Show>
    <Show when={length() > 0}>
      <p>
        { LL().FilesDetected(length()) }
      </p>
      <ul>
        <For each={props.files}>
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
        <FileListDisplay files={overlayDropStore.files} />
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
