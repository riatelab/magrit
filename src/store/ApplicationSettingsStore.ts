import { createStore } from 'solid-js/store';
import { ResizeBehavior, ZoomBehavior } from '../global.d';

// A bunch of (global) settings for the application
// (this is not the same as GlobalStore, which contains the state of the application)
type ApplicationSettingsStoreType = {
  // The default color scheme for the Choropleth representation
  defaultColorScheme: string,
  // The default behavior when zooming
  // (either redraw the paths or apply a transform to the SVG)
  zoomBehavior: ZoomBehavior,
  // The default behavior when the user resizes the window
  // (either shrink / grow the map or keep the same size and add scrollbars if necessary)
  resizeBehavior: ResizeBehavior,
  // Size of the header (note that this is computed from the CSS)
  headerHeight: number,
  // Size of the left menu (note that this is computed from the CSS)
  leftMenuWidth: number,
};

const computedStyle = getComputedStyle(document.documentElement);

const [
  applicationSettingsStore,
  setApplicationSettingsStore,
] = createStore({
  defaultColorScheme: 'YlOrRd',
  zoomBehavior: ZoomBehavior.Redraw,
  resizeBehavior: ResizeBehavior.ShrinkGrow,
  headerHeight: +computedStyle.getPropertyValue('--header-height').replace('px', ''),
  leftMenuWidth: +computedStyle.getPropertyValue('--left-menu-width').replace('px', ''),
} as ApplicationSettingsStoreType);

export {
  applicationSettingsStore,
  setApplicationSettingsStore,
};
