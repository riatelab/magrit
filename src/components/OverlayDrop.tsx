// Import from solid-js
import { For, JSX, Show } from 'solid-js';
import { produce } from 'solid-js/store';

// Import from other packages
import { v4 as uuidv4 } from 'uuid';
import { getPalette } from 'dicopal';

// Stores
import { overlayDropStore, setOverlayDropStore } from '../store/OverlayDropStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { setFieldTypingModalStore } from '../store/FieldTypingModalStore';
import { setGlobalStore } from '../store/GlobalStore';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { isAuthorizedFile } from '../helpers/fileUpload';
import { convertToGeoJSON, getGeometryType } from '../helpers/formatConversion';

// Types / Interfaces / Enums
import { type CustomFileList } from '../global';

// Styles
import '../styles/OverlayDrop.css';

const getDefaultRenderingParams = (geomType: string) => {
  const pal = getPalette('Vivid', 10)!.colors;
  const color = pal[Math.floor(Math.random() * pal.length)];

  if (geomType === 'point') {
    return {
      renderer: 'default',
      strokeColor: '#9d9d9d',
      strokeWidth: '1px',
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 1,
      pointRadius: 5,
      dropShadow: false,
    };
  }
  if (geomType === 'linestring') {
    return {
      renderer: 'default',
      strokeColor: color,
      strokeWidth: '1.5px',
      strokeOpacity: 1,
      dropShadow: false,
    };
  }
  if (geomType === 'polygon') {
    return {
      renderer: 'default',
      strokeColor: '#9d9d9d',
      strokeWidth: '0.4px',
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 0.85,
      dropShadow: false,
    };
  }
  return {};
};

function addLayer(geojson: GeoJSON.FeatureCollection, name: string) {
  const geomType = getGeometryType(geojson);
  const layerId = uuidv4();

  // Add the new layer to the LayerManager by adding it
  // to the layersDescriptionStore
  const newLayerDescription = {
    id: layerId,
    name,
    type: geomType,
    data: geojson,
    visible: true,
    ...getDefaultRenderingParams(geomType),
    shapeRendering: geomType === 'polygon' && geojson.features.length > 10000 ? 'optimizeSpeed' : 'auto',
  };

  // TODO: ideally, we should push the state *after* having
  //   asking field types to the user so that it is only
  //   one entry in the undo/redo stack
  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );

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
