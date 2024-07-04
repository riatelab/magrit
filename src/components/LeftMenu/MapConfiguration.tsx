// Imports from solid-js
import { JSX, Show } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { mapStore, setMapStore } from '../../store/MapStore';

// Sub-components
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';

export default function MapConfiguration(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="map-configuration">
    <div class="is-flex is-justify-content-space-around has-text-centered">
      <InputFieldNumber
        label={LL().MapConfiguration.Width()}
        value={mapStore.mapDimensions.width}
        onChange={(v) => {
          const maxSize = globalStore.windowDimensions.width - globalStore.leftMenuWidth;
          const width = v <= maxSize
            ? v
            : globalStore.windowDimensions.width - globalStore.leftMenuWidth - 10;
          // Note that clip extent (if used) is automatically updated (in MapStore)
          // and that the path are automatically updated (triggered from MapStore too)
          setMapStore({
            mapDimensions: {
              width,
              height: mapStore.mapDimensions.height,
            },
          });
        }}
        min={10}
        max={globalStore.windowDimensions.width - globalStore.leftMenuWidth - 10}
        step={1}
        width={100}
        layout={'vertical'}
      />
      <InputFieldNumber
        label={LL().MapConfiguration.Height()}
        value={mapStore.mapDimensions.height}
        onChange={(v) => {
          const maxSize = globalStore.windowDimensions.height - globalStore.headerHeight;
          const height = v <= maxSize
            ? v
            : globalStore.windowDimensions.height - globalStore.headerHeight - 10;
          // Note that clip extent (if used) is automatically updated (in MapStore)
          // and that the path are automatically updated (triggered from MapStore too)
          setMapStore({
            mapDimensions: {
              width: mapStore.mapDimensions.width,
              height,
            },
          });
        }}
        min={10}
        max={globalStore.windowDimensions.height - globalStore.headerHeight - 10}
        step={1}
        width={100}
        layout={'vertical'}
      />
    </div>
    <InputFieldCheckbox
      label={LL().MapConfiguration.LockZoom()}
      checked={mapStore.lockZoomPan}
      onChange={(v) => {
        setMapStore({
          lockZoomPan: v,
        });
      }}
    />
    <div>
      <label class="label">{LL().LayoutFeatures.MapMargins()}</label>
      <div>
        <div class="is-flex is-justify-content-space-around">
          <input
            type="number"
            class="input"
            style={{ width: '80px', height: '1.8em' }}
            value={mapStore.mapMargins.top}
            onChange={(e) => {
              setMapStore('mapMargins', 'top', Number(e.currentTarget.value));
            }}
          />
        </div>
        <div class="is-flex is-justify-content-space-around">
          <input
            type="number"
            class="input"
            style={{ width: '80px', height: '1.8em' }}
            value={mapStore.mapMargins.left}
            onChange={(e) => {
              setMapStore('mapMargins', 'left', Number(e.currentTarget.value));
            }}
          />
          <input
            type="number"
            class="input"
            style={{ width: '80px', height: '1.8em' }}
            value={mapStore.mapMargins.right}
            onChange={(e) => {
              setMapStore('mapMargins', 'right', Number(e.currentTarget.value));
            }}
          />
        </div>
        <div class="is-flex is-justify-content-space-around">
          <input
            type="number"
            class="input"
            style={{ width: '80px', height: '1.8em' }}
            value={mapStore.mapMargins.bottom}
            onChange={(e) => {
              setMapStore('mapMargins', 'bottom', Number(e.currentTarget.value));
            }}
          />
        </div>
        <Show
          when={
            mapStore.mapMargins.top
            || mapStore.mapMargins.left
            || mapStore.mapMargins.right
            || mapStore.mapMargins.bottom
          }
        >
          <div
            class="is-flex is-justify-content-space-around has-text-centered"
            style={{ 'margin-bottom': '-0.6em' }}
          >
            <InputFieldColor
              label={LL().LayoutFeatures.Color()}
              value={mapStore.mapMargins.color}
              onChange={(v) => {
                setMapStore('mapMargins', 'color', v);
              }}
              layout={'vertical'}
              width={80}
            />
            <InputFieldNumber
              label={LL().LayoutFeatures.Opacity()}
              value={mapStore.mapMargins.opacity}
              onChange={(v) => {
                setMapStore('mapMargins', 'opacity', v);
              }}
              min={0}
              max={1}
              step={0.1}
              width={80}
              layout={'vertical'}
            />
          </div>
        </Show>
      </div>
    </div>
  </div>;
}
