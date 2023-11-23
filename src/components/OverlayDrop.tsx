// Import from solid-js
import { For, JSX, Show } from 'solid-js';
import { produce } from 'solid-js/store';

// Import from other packages
import { getPalette } from 'dicopal';

// Stores
import { setFieldTypingModalStore } from '../store/FieldTypingModalStore';
import { globalStore, setGlobalStore } from '../store/GlobalStore';
import { setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { fitExtent } from '../store/MapStore';
import { overlayDropStore, setOverlayDropStore } from '../store/OverlayDropStore';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { isAuthorizedFile } from '../helpers/fileUpload';
import { convertToGeoJSON, getGeometryType } from '../helpers/formatConversion';
import { generateIdLayer } from '../helpers/layers';

// Types / Interfaces / Enums
import type { CustomFileList } from '../helpers/fileUpload';
import { GeoJSONFeatureCollection } from '../global';

// Styles
import '../styles/OverlayDrop.css';

/*
TODO: most of the logic in the file should be moved to a helper (because in the future it
  will be used in other places than the overlay drop - notably the view dedicated to
  handling files / user data)
*/

const getDefaultRenderingParams = (geomType: string) => {
  const pal = getPalette('Vivid', 10)!.colors;
  const color = pal[Math.floor(Math.random() * pal.length)];

  if (geomType === 'point') {
    return {
      renderer: 'default',
      strokeColor: '#9d9d9d',
      strokeWidth: 1,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 1,
      pointRadius: 5,
      dropShadow: false,
      blurFilter: false,
    };
  }
  if (geomType === 'linestring') {
    return {
      renderer: 'default',
      strokeColor: color,
      strokeWidth: 1.5,
      strokeOpacity: 1,
      dropShadow: false,
      blurFilter: false,
    };
  }
  if (geomType === 'polygon') {
    return {
      renderer: 'default',
      strokeColor: '#9d9d9d',
      strokeWidth: 0.4,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: 0.85,
      dropShadow: false,
      blurFilter: false,
    };
  }
  return {};
};

function addLayer(geojson: GeoJSONFeatureCollection, name: string) {
  const geomType = getGeometryType(geojson);
  const layerId = generateIdLayer();

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

  let firstLayer = false;

  // TODO: ideally, we should push the state *after* having
  //   asking field types to the user so that it is only
  //   one entry in the undo/redo stack...
  //   (however this is not doable with the current architecture
  //   because we need to know the layerId, and to have it in the LayersDescriptionStore,
  //   to be able to ask the user for the field types...)
  setLayersDescriptionStore(
    produce(
      (draft) => {
        if (!globalStore.userHasAddedLayer) {
          // eslint-disable-next-line no-param-reassign
          draft.layers = [];
          setGlobalStore({ userHasAddedLayer: true });
          firstLayer = true;
        }
        draft.layers.push(newLayerDescription);
      },
    ),
  );

  // If this is the first layer, zoom on it:
  if (firstLayer) {
    fitExtent(layerId);
  }

  // Open modal for field typing
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
