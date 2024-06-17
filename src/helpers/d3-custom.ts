import { selection, select, selectAll } from 'd3-selection';
import {
  csvFormat,
  csvParse,
  dsvFormat,
  tsvParse,
  type DSVRowArray,
} from 'd3-dsv';
import { drag } from 'd3-drag';
import { curveBasis, line } from 'd3-shape';
import {
  transition,
  interrupt,
} from 'd3-transition';
import {
  zoom,
  zoomIdentity,
  zoomTransform,
} from 'd3-zoom';
import {
  bin,
  nice,
  extent,
  ticks,
  sum,
  mean,
  median,
  quantile,
  min,
  max,
  deviation,
  variance,
  thresholdFreedmanDiaconis,
  thresholdScott,
  thresholdSturges,
} from 'd3-array';
import {
  // Some functions for spherical math
  geoArea,
  geoBounds,
  geoCentroid,
  geoContains,
  geoDistance,
  geoLength,
  geoGraticule,
  geoPath,
  geoProjection,
  geoIdentity,
  geoStream,
  geoTransform,
  // Projections that will be available in the application
  geoEquirectangular,
  geoNaturalEarth1,
  geoMercator,
  geoEqualEarth,
} from 'd3-geo';
import {
  geoStitch,
  // Other projections that will be available in the application
  geoAiry,
  geoAitoff,
  geoArmadillo,
  geoAugust,
  geoBaker,
  geoBerghaus,
  geoBertin1953,
  geoBoggs,
  geoBonne,
  geoBottomley,
  geoBromley,
  // geoChamberlin,
  geoChamberlinAfrica,
  geoCollignon,
  geoCraig,
  geoCraster,
  geoCylindricalEqualArea,
  geoCylindricalStereographic,
  geoEckert1,
  geoEckert2,
  geoEckert3,
  geoEckert4,
  geoEckert5,
  geoEckert6,
  geoEisenlohr,
  geoFahey,
  geoFoucaut,
  geoFoucautSinusoidal,
  geoGilbert,
  geoGingery,
  geoGinzburg4,
  geoGinzburg5,
  geoGinzburg6,
  geoGinzburg8,
  geoGinzburg9,
  geoGringorten,
  geoGuyou,
  geoHammer,
  geoHammerRetroazimuthal,
  geoHealpix,
  geoHill,
  geoHomolosine,
  geoHufnagel,
  geoHyperelliptical,
  geoInterruptedBoggs,
  geoInterruptedHomolosine,
  geoInterruptedMollweide,
  geoInterruptedMollweideHemispheres,
  geoInterruptedSinuMollweide,
  geoInterruptedSinusoidal,
  geoKavrayskiy7,
  geoLagrange,
  geoLarrivee,
  geoLaskowski,
  // geoLittrow,
  geoLoximuthal,
  geoMiller,
  geoModifiedStereographicLee,
  geoModifiedStereographicMiller,
  geoMollweide,
  geoNaturalEarth2,
  geoNellHammer,
  geoInterruptedQuarticAuthalic,
  geoNicolosi,
  geoPatterson,
  geoPolyconic,
  // geoPolyhedral,
  geoPolyhedralButterfly,
  geoPolyhedralCollignon,
  geoPolyhedralWaterman,
  geoGringortenQuincuncial,
  geoPeirceQuincuncial,
  geoRectangularPolyconic,
  geoRobinson,
  geoSatellite,
  geoSinuMollweide,
  geoSinusoidal,
  geoTimes,
  geoVanDerGrinten,
  geoVanDerGrinten2,
  geoVanDerGrinten3,
  geoVanDerGrinten4,
  geoWagner,
  geoWagner4,
  geoWagner6,
  geoWiechel,
  geoWinkel3,
} from 'd3-geo-projection';
import { geoClipPolygon } from 'd3-geo-polygon';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';
import { quadtree } from 'd3-quadtree';
import type { D3ZoomEvent } from 'd3-zoom';
import type { GeoProjection, GeoRawProjection } from 'd3-geo';
import type { D3DragEvent } from 'd3-drag';
import {
  easeCubicOut,
  easeSinOut,
} from 'd3-ease';
import {
  interpolateString,
} from 'd3-interpolate';
import {
  brush,
  brushX,
  brushY,
  type BrushBehavior,
} from 'd3-brush';
import { tile } from 'd3-tile';

import hatanoRaw from './projection-hatano';
import winkel1Raw from './projection-winkel1';

// // We want the features that were offered by 'd3-selection-multi'
// // (deprecated and incompatible with new 'd3-selection' versions)
// // to be available on the 'd3-selection' module.
// function attrsFunctionSelection(_selection, map) {
//   return _selection.each(function (...args) {
//     const x = map.apply(this, args);
//     const s = select(this);
//     Object.entries(x).forEach(([k, v]) => {
//       s.attr(k, v);
//     });
//   });
// }
//
// function attrsObjectSelection(_selection, map) {
//   Object.entries(map).forEach(([k, v]) => {
//     _selection.attr(k, v);
//   });
//   return _selection;
// }
//
// const attrsSelection = function (map) {
//   return (typeof map === 'function' ? attrsFunctionSelection : attrsObjectSelection)(this, map);
// };
//
// function propertiesFunctionSelection(_selection, map) {
//   return _selection.each(function onEachPropertiesFunctionSelection(...args) {
//     const x = map.apply(this, args);
//     const s = select(this);
//     Object.entries(x).forEach(([k, v]) => {
//       s.property(k, v);
//     });
//   });
// }
//
// function propertiesObjectSelection(_selection, map) {
//   Object.entries(map).forEach(([k, v]) => {
//     _selection.property(k, v);
//   });
//   return _selection;
// }
//
// function propertiesSelection(map) {
//   return (
//     typeof map === 'function'
//       ? propertiesFunctionSelection
//       : propertiesObjectSelection
//   )(this, map);
// }
//
// function stylesFunctionSelection(_selection, map, priority) {
//   return _selection.each(function onEachStylesFunctionSelection(...args) {
//     const x = map.apply(this, args);
//     const s = select(this);
//     Object.entries(x).forEach(([k, v]) => {
//       s.style(k, v, priority);
//     });
//   });
// }
//
// function stylesObjectSelection(_selection, map, priority) {
//   Object.entries(map).forEach(([k, v]) => {
//     _selection.style(k, v, priority);
//   });
//   return _selection;
// }
//
// function stylesSelection(map, priority) {
//   return (
//     typeof map === 'function'
//       ? stylesFunctionSelection
//       : stylesObjectSelection
//   )(this, map, priority == null ? '' : priority);
// }
//
// selection.prototype.attrs = attrsSelection;
// selection.prototype.styles = stylesSelection;
// selection.prototype.properties = propertiesSelection;
//
// function attrsFunctionTransition(_transition, map) {
//   return _transition.each(function onEachAttrsFunctionTransition(...args) {
//     const x = map.apply(this, args);
//     const t = select(this).transition(_transition);
//     Object.entries(x).forEach(([k, v]) => {
//       t.attr(k, v);
//     });
//   });
// }
//
// function attrsObjectTransition(_transition, map) {
//   Object.entries(map).forEach(([k, v]) => {
//     _transition.attr(k, v);
//   });
//   return _transition;
// }
//
// function attrsTransition(map) {
//   return (
//     typeof map === 'function'
//       ? attrsFunctionTransition
//       : attrsObjectTransition
//   )(this, map);
// }
//
// function stylesFunctionTransition(_transition, map, priority) {
//   return _transition.each(function onEachStylesFunctionTransition(...args) {
//     const x = map.apply(this, args);
//     const t = select(this).transition(_transition);
//     Object.entries(x).forEach(([k, v]) => {
//       t.style(k, v, priority);
//     });
//   });
// }
//
// function stylesObjectTransition(_transition, map, priority) {
//   Object.entries(map).forEach(([k, v]) => {
//     _transition.style(k, v, priority);
//   });
//   return _transition;
// }
//
// function stylesTransition(map, priority) {
//   return (
//     typeof map === 'function'
//       ? stylesFunctionTransition
//       : stylesObjectTransition
//   )(this, map, priority == null ? '' : priority);
// }
//
// transition.prototype.attrs = attrsTransition;
// transition.prototype.styles = stylesTransition;

const geoWinkel1 = () => geoProjection(winkel1Raw(45)).scale(160);
const geoHatano = (() => geoProjection(hatanoRaw).scale(160));

export default {
  geoPath,
  geoProjection,
  geoClipPolygon,
  geoWinkel1, // Custom projection, from projection-winkel1 file
  geoHatano, // Custom projection, from projection-hatano file
  geoNaturalEarth1,
  geoEqualEarth,
  geoAiry,
  geoAitoff,
  geoArmadillo,
  geoAugust,
  geoBaker,
  geoBerghaus,
  geoBertin1953,
  geoBoggs,
  geoBonne,
  geoBottomley,
  geoBromley,
  // geoChamberlin,
  geoChamberlinAfrica,
  geoCollignon,
  geoCraig,
  geoCraster,
  geoCylindricalEqualArea,
  geoCylindricalStereographic,
  geoEckert1,
  geoEckert2,
  geoEckert3,
  geoEckert4,
  geoEckert5,
  geoEckert6,
  geoEisenlohr,
  geoEquirectangular,
  geoFahey,
  geoFoucaut,
  geoFoucautSinusoidal,
  geoGilbert,
  geoGingery,
  geoGinzburg4,
  geoGinzburg5,
  geoGinzburg6,
  geoGinzburg8,
  geoGinzburg9,
  geoGringorten,
  geoGuyou,
  geoHammer,
  geoHammerRetroazimuthal,
  geoHealpix,
  geoHill,
  geoHomolosine,
  geoHufnagel,
  geoHyperelliptical,
  geoInterruptedBoggs,
  geoInterruptedHomolosine,
  geoInterruptedMollweide,
  geoInterruptedMollweideHemispheres,
  geoInterruptedSinuMollweide,
  geoInterruptedSinusoidal,
  geoKavrayskiy7,
  geoLagrange,
  geoLarrivee,
  geoLaskowski,
  // geoLittrow,
  geoLoximuthal,
  geoMercator,
  geoMiller,
  geoModifiedStereographicLee,
  geoModifiedStereographicMiller,
  geoMollweide,
  geoNaturalEarth2,
  geoNellHammer,
  geoInterruptedQuarticAuthalic,
  geoNicolosi,
  geoPatterson,
  geoPolyconic,
  // geoPolyhedral,
  geoPolyhedralButterfly,
  geoPolyhedralCollignon,
  geoPolyhedralWaterman,
  geoGringortenQuincuncial,
  geoPeirceQuincuncial,
  geoRectangularPolyconic,
  geoRobinson,
  geoSatellite,
  geoSinuMollweide,
  geoSinusoidal,
  geoStitch,
  geoTimes,
  geoVanDerGrinten,
  geoVanDerGrinten2,
  geoVanDerGrinten3,
  geoVanDerGrinten4,
  geoWagner,
  geoWagner4,
  geoWagner6,
  geoWiechel,
  geoWinkel3,
  geoArea,
  geoBounds,
  geoCentroid,
  geoContains,
  geoDistance,
  geoLength,
  geoGraticule,
  geoIdentity,
  geoStream,
  geoTransform,
  selection,
  select,
  selectAll,
  transition,
  interrupt,
  zoom,
  zoomIdentity,
  zoomTransform,
  csvFormat,
  dsvFormat,
  csvParse,
  tsvParse,
  bin,
  nice,
  extent,
  ticks,
  sum,
  mean,
  median,
  quantile,
  min,
  max,
  deviation,
  variance,
  thresholdFreedmanDiaconis,
  thresholdScott,
  thresholdSturges,
  // Stuff from d3-force
  forceCenter,
  forceCollide,
  forceLink,
  forceSimulation,
  forceX,
  forceY,
  // Stuff from d3-quadtree
  quadtree,
  // Stuff from d3-ease
  easeCubicOut,
  easeSinOut,
  // Stuff from d3-interpolate
  interpolateString,
  // Stuff from d3-brush
  brush,
  brushX,
  brushY,
  // Stuff from d3-tile
  tile,
  // Stuff from d3-drag
  drag,
  // Stuff from d3-shape
  curveBasis,
  line,
};

export type {
  D3ZoomEvent,
  D3DragEvent,
  GeoProjection,
  GeoRawProjection,
  BrushBehavior,
  DSVRowArray,
};
