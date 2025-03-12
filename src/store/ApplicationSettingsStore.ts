import { createStore } from 'solid-js/store';
import type { LegendTextElement } from '../global';

export enum RenderVisibility {
  RenderAsHidden,
  // RenderAsDisplayNone,
  DoNotRender,
}

export enum ZoomBehavior {
  Redraw,
  Transform,
}

export enum ResizeBehavior {
  ShrinkGrow,
  KeepMapSize,
}

const getUserLocale = () => {
  let l = (navigator.languages && navigator.languages.length
    ? navigator.languages[0]
    : navigator.language || 'en-US');
  if (!l.includes('-')) {
    // In some cases, the locale is not in the format xx-YY
    // but only xx (e.g. 'fr' instead of 'fr-FR', 'en' instead of 'en-US', etc.)
    // we need to fix this as possible... (before we find a better solution
    // we just handle manually the most common cases...)
    if (l === 'fr') {
      l = 'fr-FR';
    } else if (l === 'en') {
      l = 'en-US';
    } else if (l === 'es') {
      l = 'es-ES';
    } else if (l === 'de') {
      l = 'de-DE';
    } else if (l === 'pt') {
      l = 'pt-PT';
    }
  }
  return l;
};

// A bunch of (global) settings for the application
// (this is not the same as GlobalStore, which contains the state of the application)
export type ApplicationSettingsStoreType = {
  // The default color scheme for the Choropleth representation
  defaultColorScheme: string,
  // The default "no data" color for the Choropleth representation
  defaultNoDataColor: string,
  // The default behavior when zooming
  // (either redraw the paths or apply a transform to the SVG)
  zoomBehavior: ZoomBehavior,
  // The default behavior when the user resizes the window
  // (either shrink / grow the map or keep the same size and add scrollbars if necessary)
  resizeBehavior: ResizeBehavior,
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
  // Whether to use a clip extent when rendering the map.
  // This is useful when the user zooms a lot, and some of the map
  // is rendered outside the SVG viewport (which is not visible
  // but can be computationally expensive to render).
  useClipExtent: boolean,
  // Whether to apply a clipping polygon to the projection when possible
  // (i.e. when using a proj4 projection that defines an extent)
  useProjectionPreclip: boolean,
  // Default font size for legends
  defaultLegendSettings: {
    spacing: number,
    title: Partial<LegendTextElement>,
    subtitle: Partial<LegendTextElement>,
    labels: Partial<LegendTextElement>,
    note: Partial<LegendTextElement>,
  },
  // The locale of the browser (used for formatting numbers and dates)
  userLocale: string,
  // The color of the snapping grid that the user can display
  // to align layout features / legends on the map
  snappingGridColor: string,
  // The custom palettes defined by the user
  // customPalettes: CustomPalette[],
  // Whether to activate the undo/redo feature
  useUndoRedo: boolean,
  // Are class intervals closed on the left or right?
  intervalClosure: 'left' | 'right',
};

const [
  applicationSettingsStore,
  setApplicationSettingsStore,
] = createStore({
  defaultColorScheme: 'YlOrRd',
  defaultNoDataColor: '#ffffff',
  zoomBehavior: ZoomBehavior.Redraw,
  resizeBehavior: ResizeBehavior.ShrinkGrow,
  renderVisibility: RenderVisibility.DoNotRender,
  useClipExtent: false,
  useProjectionPreclip: true,
  snappingGridColor: '#808080',
  defaultLegendSettings: {
    spacing: 5,
    title: {
      fontSize: 13,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 12,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'italic',
      fontWeight: 'normal',
    },
    labels: {
      fontSize: 11,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    note: {
      fontSize: 11,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
  },
  userLocale: getUserLocale(),
  useUndoRedo: false,
  intervalClosure: 'right',
} as ApplicationSettingsStoreType);

export {
  applicationSettingsStore,
  setApplicationSettingsStore,
};
