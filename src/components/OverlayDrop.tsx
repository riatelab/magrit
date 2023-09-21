import { For, JSX, Show } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { overlayDropStore, setOverlayDropStore } from '../store/OverlayDropStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { setGlobalStore } from '../store/GlobalStore';
import '../styles/OverlayDrop.css';
import { useI18nContext } from '../i18n/i18n-solid';
import { isAuthorizedFile } from '../helpers/fileUpload';
import { convertToGeoJSON, getGeometryType } from '../helpers/formatConversion';
import { setFieldTypingModalStore } from '../store/FieldTypingModalStore';
import { CustomFileList } from '../global';

const getDefaultRenderingParams = (geomType: string) => {
  if (geomType === 'point') {
    return {
      renderer: 'default',
      strokeColor: '#000000',
      strokeWidth: '1px',
      strokeOpacity: 1,
      fillColor: '#fedeab',
      fillOpacity: 1,
      pointRadius: 5,
    };
  }
  if (geomType === 'linestring') {
    return {
      renderer: 'default',
      strokeColor: '#000000',
      strokeWidth: '1.5px',
      strokeOpacity: 1,
    };
  }
  if (geomType === 'polygon') {
    return {
      renderer: 'default',
      strokeColor: '#000000',
      strokeWidth: '0.5px',
      strokeOpacity: 1,
      fillColor: '#000000',
      fillOpacity: 0.5,
    };
  }
  return {};
};

function addLayer(geojson: GeoJSON.FeatureCollection | object, name: string) {
  const geomType = getGeometryType(geojson);
  const layerId = uuidv4();

  // Add the new layer to the LayerManager by adding it
  // to the layersDescriptionStore
  console.log(getDefaultRenderingParams(geomType));
  const newLayersDescriptionStore = [
    {
      id: layerId,
      name,
      type: geomType,
      data: geojson,
      visible: true,
      ...getDefaultRenderingParams(geomType),
    },
    ...layersDescriptionStore.layers,
  ];
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore,
  });

  setFieldTypingModalStore({
    show: true,
    layerId,
  });
}

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
  try {
    res = await convertToGeoJSON(files.map((f) => f.file));
    console.log('res', res);
  } catch (e) {
    console.error(e);
  }
  setGlobalStore({ isLoading: false });

  addLayer(res, files[0].name);
};

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
          <button class="button is-success" onClick={async () => { await convertDroppedFiles(overlayDropStore.files); }}>
            { LL().ImportFiles() }
          </button>
        </div>
      </div>

    </div>
  </div>;
}
