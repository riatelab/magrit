import { createStore } from 'solid-js/store';
import { ZoomBehavior } from '../global.d';

// A bunch of (global) settings for the application
// (this is not the same as GlobalStore, which contains the state of the application)
type ApplicationSettingsStoreType = {
  // The default color scheme for the Choropleth representation
  defaultColorScheme: string,
  // The default behavior when zooming
  // (either redraw the paths or apply a transform to the SVG)
  zoomBehavior: ZoomBehavior,
};

const [
  applicationSettingsStore,
  setApplicationSettingsStore,
] = createStore({
  defaultColorScheme: 'YlOrRd',
  zoomBehavior: ZoomBehavior.Redraw,
} as ApplicationSettingsStoreType);

export {
  applicationSettingsStore,
  setApplicationSettingsStore,
};
