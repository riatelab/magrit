import { selection, select, selectAll } from 'd3-selection';
import { transition } from 'd3-transition';
import { zoom } from 'd3-zoom';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import {
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
  geoChamberlin,
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
  geoGringorten,
  geoGuyou,
  geoHammer,
  geoHammerRetroazimuthal,
  geoHealpix,
  geoHill,
  geoHomolosine,
  geoHufnagel,
  geoHyperelliptical,
  geoNaturalEarth2,
} from 'd3-geo-projection';

// We want the features that were offered by 'd3-selection-multi'
// (deprecated and incompatible with new 'd3-selection' versions)
// to be available on the 'd3-selection' module.
function attrsFunctionSelection(_selection, map) {
  return _selection.each(function (...args) {
    const x = map.apply(this, args);
    const s = select(this);
    Object.entries(x).forEach(([k, v]) => {
      s.attr(k, v);
    });
  });
}

function attrsObjectSelection(_selection, map) {
  Object.entries(map).forEach(([k, v]) => {
    _selection.attr(k, v);
  });
  return _selection;
}

const attrsSelection = function (map) {
  return (typeof map === 'function' ? attrsFunctionSelection : attrsObjectSelection)(this, map);
};

function propertiesFunctionSelection(_selection, map) {
  return _selection.each(function (...args) {
    const x = map.apply(this, args);
    const s = select(this);
    Object.entries(x).forEach(([k, v]) => {
      s.property(k, v);
    });
  });
}

function propertiesObjectSelection(_selection, map) {
  Object.entries(map).forEach(([k, v]) => {
    _selection.property(k, v);
  });
  return _selection;
}

const propertiesSelection = function (map) {
  return (
    typeof map === 'function'
      ? propertiesFunctionSelection
      : propertiesObjectSelection
  )(this, map);
};

function stylesFunctionSelection(_selection, map, priority) {
  return _selection.each(function (...args) {
    const x = map.apply(this, args);
    const s = select(this);
    Object.entries(x).forEach(([k, v]) => {
      s.style(k, v, priority);
    });
  });
}

function stylesObjectSelection(_selection, map, priority) {
  Object.entries(map).forEach(([k, v]) => {
    _selection.style(k, v, priority);
  });
  return _selection;
}

const stylesSelection = function (map, priority) {
  return (
    typeof map === 'function'
      ? stylesFunctionSelection
      : stylesObjectSelection
  )(this, map, priority == null ? '' : priority);
};

selection.prototype.attrs = attrsSelection;
selection.prototype.styles = stylesSelection;
selection.prototype.properties = propertiesSelection;

function attrsFunctionTransition(_transition, map) {
  return _transition.each(function (...args) {
    const x = map.apply(this, args);
    const t = select(this).transition(_transition);
    Object.entries(x).forEach(([k, v]) => {
      t.attr(k, v);
    });
  });
}

function attrsObjectTransition(_transition, map) {
  Object.entries(map).forEach(([k, v]) => {
    _transition.attr(k, v);
  });
  return _transition;
}

const attrsTransition = function (map) {
  return (typeof map === 'function' ? attrsFunctionTransition : attrsObjectTransition)(this, map);
};

function stylesFunctionTransition(_transition, map, priority) {
  return _transition.each(function (...args) {
    const x = map.apply(this, args);
    const t = select(this).transition(_transition);
    Object.entries(x).forEach(([k, v]) => {
      t.style(k, v, priority);
    });
  });
}

function stylesObjectTransition(_transition, map, priority) {
  Object.entries(map).forEach(([k, v]) => {
    _transition.style(k, v, priority);
  });
  return _transition;
}

const stylesTransition = function (map, priority) {
  return (
    typeof map === 'function'
      ? stylesFunctionTransition
      : stylesObjectTransition
  )(this, map, priority == null ? '' : priority);
};

transition.prototype.attrs = attrsTransition;
transition.prototype.styles = stylesTransition;

export default {
  geoPath,
  geoNaturalEarth1,
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
  geoChamberlin,
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
  geoGringorten,
  geoGuyou,
  geoHammer,
  geoHammerRetroazimuthal,
  geoHealpix,
  geoHill,
  geoHomolosine,
  geoHufnagel,
  geoHyperelliptical,
  geoNaturalEarth2,
  selection,
  select,
  selectAll,
  transition,
  zoom,
};
