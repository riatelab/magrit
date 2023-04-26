import { selection, select } from 'd3-selection';
import { transition } from 'd3-transition';
import { zoom } from 'd3-zoom';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { geoNaturalEarth2 } from 'd3-geo-projection';

// We want the features that were offered by 'd3-selection-multi'
// (deprecated and incompatible with new 'd3-selection' versions)
// to be available on the 'd3-selection' module.
function attrsFunctionSelection(_selection, map) {
  return _selection.each(function () {
    const x = map.apply(this, arguments);
    const s = select(this);
    for (const name in x) {
      s.attr(name, x[name]);
    }
  });
}

function attrsObjectSelection(_selection, map) {
  for (const name in map) {
    _selection.attr(name, map[name]);
  }
  return _selection;
}

const attrsSelection = function (map) {
  return (typeof map === 'function' ? attrsFunctionSelection : attrsObjectSelection)(this, map);
};

function propertiesFunctionSelection(_selection, map) {
  return _selection.each(function () {
    const x = map.apply(this, arguments);
    const s = select(this);
    for (const name in x) {
      s.property(name, x[name]);
    }
  });
}

function propertiesObjectSelection(_selection, map) {
  for (const name in map) {
    _selection.property(name, map[name]);
  }
  return _selection;
}

const propertiesSelection = function (map) {
  return (
    typeof map === 'function'
      ? propertiesFunctionSelection
      : propertiesObjectSelectio
  )(this, map);
};

function stylesFunctionSelection(_selection, map, priority) {
  return _selection.each(function () {
    const x = map.apply(this, arguments);
    const s = select(this);
    for (const name in x) s.style(name, x[name], priority);
  });
}

function stylesObjectSelection(_selection, map, priority) {
  for (const name in map) _selection.style(name, map[name], priority);
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
  return _transition.each(function () {
    const x = map.apply(this, arguments);
    const t = select(this).transition(_transition);
    for (const name in x) t.attr(name, x[name]);
  });
}

function attrsObjectTransition(_transition, map) {
  for (const name in map) _transition.attr(name, map[name]);
  return _transition;
}

const attrsTransition = function (map) {
  return (typeof map === 'function' ? attrsFunctionTransition : attrsObjectTransition)(this, map);
};

function stylesFunctionTransition(_transition, map, priority) {
  return _transition.each(function () {
    const x = map.apply(this, arguments);
    const t = select(this).transition(_transition);
    for (const name in x) {
      t.style(name, x[name], priority);
    }
  });
}

function stylesObjectTransition(_transition, map, priority) {
  for (const name in map) {
    _transition.style(name, map[name], priority);
  }
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
  geoNaturalEarth2,
  selection,
  select,
  transition,
  zoom,
};
