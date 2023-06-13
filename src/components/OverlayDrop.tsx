import { For, JSX } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { overlayDropStore, setOverlayDropStore } from '../store/OverlayDropStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { setGlobalStore } from '../store/GlobalStore';
import '../styles/OverlayDrop.css';
import { useI18nContext } from '../i18n/i18n-solid';
import { isAuthorizedFile } from '../helpers/fileUpload';
import { convertToGeoJSON, getGeometryType } from '../helpers/formatConversion';

const convertDroppedFiles = async (files: CustomFileList) => {
  console.log('convertDroppedFiles', files);
  const authorizedFiles = files.filter(isAuthorizedFile);
  console.log('authorizedFiles', authorizedFiles);
  setOverlayDropStore({
    show: false,
    files: [],
  });
  setGlobalStore({ isLoading: true });
  let res;
  let geomType;
  try {
    res = await convertToGeoJSON(files.map((f) => f.file));
    geomType = getGeometryType(res);
    console.log('res', res);
  } catch (e) {
    console.error(e);
  }
  setGlobalStore({ isLoading: false });
  // Add the new layer to the LayerManager by adding it
  // to the layersDescriptionStore
  const newLayersDescriptionStore = [
    ...layersDescriptionStore.layers,
    {
      id: uuidv4(),
      name: files[0].name,
      type: geomType,
      data: res,
      visible: true,
    },
  ];
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore,
  });
};

const displayFiles = (files: CustomFileList): JSX.Element => {
  const { LL } = useI18nContext();

  if (files.length === 0) return <p>{ LL().DropFilesHere() }</p>;

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
            return <li classList={{ authorized }} {...prop}>
              {file.name} ({file.file.size / 1000} kb)
            </li>;
          }
        }
      </For>
    </ul>
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
          <button class="button is-success" onClick={async () => { await convertDroppedFiles(overlayDropStore.files); }}>
            { LL().ImportFiles() }
          </button>
        </div>
      </div>

    </div>
  </div>;
}
