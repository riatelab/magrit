import { createStore } from 'solid-js/store';
import { RenderVisibility, ResizeBehavior, ZoomBehavior } from '../global.d';

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
  // Whether to render layers that are not visible (selected
  // by the user in the Layer Manager) with
  // visibility: hidden (RenderVisibility.RenderAsHidden)
  // or don't render them at all (RenderVisibility.DoNotRender).
  // Not rendering layer that are not visible is faster but
  // when exporting the map to SVG, the user may want to export
  // all the layers, even the ones that are not visible
  // (in the future we may never render the layers that are not visible
  // but add them with visibility:hidden only in the SVG export).
  renderVisibility: RenderVisibility,
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
  renderVisibility: RenderVisibility.DoNotRender,
} as ApplicationSettingsStoreType);

export {
  applicationSettingsStore,
  setApplicationSettingsStore,
};
