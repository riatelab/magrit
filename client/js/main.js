import i18next from 'i18next';
import i18nextXHRBackend from 'i18next-xhr-backend';
import locI18next from 'loc-i18next';
import './../css/style.css';
import './../css/discretization.css';
import './../node_modules/alertifyjs/build/css/alertify.min.css';
import './../node_modules/alertifyjs/build/css/themes/semantic.min.css';
import { setUpInterface } from './interface';
import { xhrequest } from './helpers';
import { Mround } from './helpers_math';
import { makeSvgMap } from './map_ctrl';
import { bindTooltips } from './tooltips';

Promise.config({
  warnings: true,
  longStackTraces: true,
});

// /*
// * Memoization functions (naive LRU implementation)
// *
// */
// global.Function.prototype.memoized = function (max_size = 25) {
//   this._memo = this._memo || { values: new Map(), stack: [], max_size: max_size };
//   const key = JSON.stringify(Array.prototype.slice.call(arguments));
//   let cache_value = this._memo.values.get(key);
//   if (cache_value !== undefined) {
//     return JSON.parse(cache_value);
//   }
//   cache_value = this.apply(this, arguments);
//   this._memo.values.set(key, JSON.stringify(cache_value));
//   this._memo.stack.push(key);
//   if (this._memo.stack.length >= this._memo.max_size) {
//     const old_key = this._memo.stack.shift();
//     this._memo.values.delete(old_key);
//   }
//   return cache_value;
// };
//
// global.Function.prototype.memoize = function () {
//   const fn = this;
//   return function () {
//     return fn.memoized.apply(fn, arguments);
//   };
// };
global.i18next = i18next;
global._tr = (...args) => i18next.t(...args);
global.encodeId = layer_name => ((layer_name !== '')
  ? `L_${layer_name.replace(/[^a-zA-Z0-9_-]/g, match => `_${match[0].charCodeAt(0).toString(16)}_`)}`
  : 'L_');

global._app = {
  current_functionnality: undefined,
  current_proj_name: 'NaturalEarth2',
  custom_palettes: new Map(),
  default_symbols: [],
  existing_lang: ['en', 'es', 'fr'],
  layer_to_id: new Map([['World', encodeId('World')], ['Graticule', encodeId('Graticule')]]),
  legendRedrawTimeout: null,
  id_to_layer: new Map([[encodeId('World'), 'World'], [encodeId('Graticule'), 'Graticule']]),
  targeted_layer_added: false,
  to_cancel: undefined,
  version: MAGRIT_VERSION, // eslint-disable-line no-undef
};

global.w = Mround(window.innerWidth - 361);
global.h = window.innerHeight - 55;
global.proj = d3.geoNaturalEarth2().scale(1).translate([0, 0]);
global.path = d3.geoPath().projection(proj).pointRadius(4);
global.t = proj.translate();
global.s = proj.scale();

/*
A bunch of global variable, storing oftently reused informations :
    - data_manager.user_data[layer_name] : will be an Array of Objects containing data for each features of the targeted layer
            (+ the joined features if a join is done)
    - data_manager.result_data[layer_name] : the same but for any eventual result layers (like Stewart, gridded, etc.)
    - data_manager.joined_dataset : the joined dataset (read with d3.csv then pushed in the first slot of this array)
    - data_manager.field_join_map : an array containg mapping between index of geom layer and index of ext. dataset
    - data_manager.current_layers : the main object describing **all** the layers on the map (incunding detailed (ie. by features) styling properties if needed)
*/
global.data_manager = {
  current_layers: {},
  dataset_name: null,
  joined_dataset: [],
  field_join_map: [],
  result_data: {},
  user_data: {},
};

function parseQuery(search) {
  const args = search.substring(1).split('&');
  const argsParsed = {};
  let arg,
    kvp,
    key,
    value;
  for (let i = 0; i < args.length; i++) {
    arg = args[i];
    if (arg.indexOf('=') === -1) {
      argsParsed[decodeURIComponent(arg).trim()] = true;
    } else {
      kvp = arg.split('=');
      key = decodeURIComponent(kvp[0]).trim();
      value = decodeURIComponent(kvp[1]).trim();
      argsParsed[key] = decodeURIComponent(kvp[1]).trim();
    }
  }
  return argsParsed;
}

function loadI18next(lang) {
  return new Promise((resolve, reject) => {
    i18next.use(i18nextXHRBackend)
      .init({
        debug: true,
        lng: lang,
        fallbackLng: _app.existing_lang[0],
        backend: {
          loadPath: 'static/locales/{{lng}}/translation.json',
        },
      }, (err, tr) => {
        if (err) reject(err);
        resolve(tr);
      });
  });
}

(() => {
  const getEpsgProjection = () => xhrequest('GET', 'static/json/epsg.json', undefined, false);
  const getSampleLayers = () => xhrequest('GET', 'static/json/sample_layers.json', undefined, false);
  const params = {};
  Object.assign(global, makeSvgMap());

  document.querySelector('noscript').remove();
  window.isIE = (() => (/MSIE/i.test(navigator.userAgent)
    || /Trident\/\d./i.test(navigator.userAgent)
    || /Edge\/\d./i.test(navigator.userAgent))
  )();
  // window.isOldMS_Firefox = (() => (/Firefox/i.test(navigator.userAgent)
  //   && (/Windows NT 6.0/i.test(navigator.userAgent)
  //       || /Windows NT 6.1/i.test(navigator.userAgent))) ? true : false
  // )();
  if (window.location.search) {
    const parsed_querystring = parseQuery(window.location.search);
    params.reload = parsed_querystring.reload;
    if (typeof (history.replaceState) !== 'undefined') {
      // replaceState should avoid creating a new entry on the history
      const obj = { Page: window.location.search, Url: window.location.pathname };
      history.replaceState(obj, obj.Page, obj.Url);
    }
  }
  let lang = docCookies.getItem('user_lang') || window.navigator.language.split('-')[0];
  lang = _app.existing_lang.indexOf(lang) > -1 ? lang : 'en';

  Promise.all([
    loadI18next(lang),
    getEpsgProjection(),
    getSampleLayers(),
  ]).then((results) => {
    const [tr, epsg_proj, sample_layers] = results;

    global.localize = locI18next.init(i18next);
    _app.epsg_projections = JSON.parse(epsg_proj);
    _app.sample_layers = JSON.parse(sample_layers);

    setUpInterface(params.reload);
    localize('.i18n');
    bindTooltips();
  }).catch((e) => {
    // TODO: ...
    swal({
      title: 'Erreur de chargement de la page',
      text: 'Erreur de chargement de la page',
      type: 'error',
      customClass: 'swal2_custom',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  });
})();

/**
* Return the x and y position where the svg element is located
* in the browser window.
*
* @return {Object} - An object with x and y properties.
*/
global.get_map_xy0 = () => {
  const bbox = svg_map.getBoundingClientRect();
  return { x: bbox.left, y: bbox.top };
};

global.get_bounding_rect = (elem) => {
  const { x, y } = get_map_xy0();
  const bbox = elem.getBoundingClientRect();
  const a = {
    x: bbox.left - x,
    y: bbox.top - y,
    width: bbox.width ? bbox.width : bbox.right - bbox.left,
    height: bbox.height ? bbox.height : bbox.bottom - bbox.top,
  };
  a.left = a.x;
  a.top = a.y;
  return a;
};

global.helper_esc_key_twbs_cb = function helper_esc_key_twbs_cb(_event, callback) {
  const evt = _event || window.event;
  const isEscape = ('key' in evt) ? (evt.key === 'Escape' || evt.key === 'Esc') : (evt.keyCode === 27);
  if (isEscape) {
    evt.stopPropagation();
    if (callback) {
      callback();
    }
  }
};
