import { For, JSX } from 'solid-js';
import { overlayDropStore } from './store/OverlayDropStore';
import './styles/OverlayDrop.css';
import { useI18nContext } from './i18n/i18n-solid';
import { isAuthorizedFile } from './helpers/fileUpload';

const displayFiles = (files: CustomFileList): JSX.Element => {
  const { LL } = useI18nContext();

  if (files.length === 0) return <p>{ LL().DropFilesHere() }</p>;
  console.log(window.Gdal, window.Gdal.drivers.raster);

  return <>
    <p>
      { LL().FilesDetected(files.length) }
    </p>
    <ul>
      <For each={files}>
        {
          (file) => {
            const authorized = isAuthorizedFile(file);
            const prop = authorized ? {} : { 'data-tooltip': LL().UnsupportedFormat() };
            return <li classList={{ authorized }} {...prop}>{file.name}</li>;
          }
        }
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
