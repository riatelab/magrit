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
  scaleLinear,
} from 'd3-scale';
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
  range,
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
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEquirectangular,
  geoGnomonic,
  geoNaturalEarth1,
  geoMercator,
  geoOrthographic,
  geoEqualEarth,
  geoTransverseMercator,
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
  geoLittrow,
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
  // geoWagner,
  geoWagner4,
  geoWagner6,
  geoWagner7,
  geoWiechel,
  geoWinkel3,
  geoProject,
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
  quantize,
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

const geoWinkel1 = () => geoProjection(winkel1Raw(45)).scale(160);
const geoHatano = (() => geoProjection(hatanoRaw).scale(160));

export default {
  geoPath,
  geoProjection,
  geoClipPolygon,
  geoWinkel1, // Custom projection, from projection-winkel1 file
  geoHatano, // Custom projection, from projection-hatano file
  geoNaturalEarth1,
  geoOrthographic,
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
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
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
  geoGnomonic,
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
  geoLittrow,
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
  geoTransverseMercator,
  geoVanDerGrinten,
  geoVanDerGrinten2,
  geoVanDerGrinten3,
  geoVanDerGrinten4,
  geoWagner4,
  geoWagner6,
  geoWagner7,
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
  geoProject,
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
  range,
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
  quantize,
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
  // Stuff from d3-scale
  scaleLinear,
};

export type {
  D3ZoomEvent,
  D3DragEvent,
  GeoProjection,
  GeoRawProjection,
  BrushBehavior,
  DSVRowArray,
};
