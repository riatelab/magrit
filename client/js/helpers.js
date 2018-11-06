import { make_dialog_container, overlay_under_modal } from './dialogs';
import { round_value } from './helpers_calc';
import { binds_layers_buttons, handle_click_hand } from './interface';
import {
  button_legend, button_replace, button_result_type,
  button_table, button_trash, button_type,
  button_zoom_fit, eye_open0, sys_run_button_t2,
} from './ui/buttons';


export const isNumber = (value) => {
 return value != null && value !== '' && isFinite(value) && !Number.isNaN(+value);
};

export const createWaitingOverlay = () => {
  const bg = document.createElement('div');
  bg.id = 'overlay';
  bg.style.display = 'none';
  bg.innerHTML = `
<img src="static/img/logo_magrit.png" alt="Magrit" style="left: 15px;position: absolute;" width="auto" height="26">
<span class="i18n" style="z-index: 2; margin-top:85px; display: inline-block;" data-i18n="[html]app_page.common.loading_results"></span>
<span style="z-index: 2;">...<br></span>
<div class="spinner">
  <div class="rect1"></div>
  <div class="rect2"></div>
  <div class="rect3"></div>
  <div class="rect4"></div>
  <div class="rect5"></div>
</div>
<span class="i18n" style="z-index: 2;display: inline-block; margin-bottom: 20px;" data-i18n="[html]app_page.common.long_computation"></span><br>
<button
  data-i18n="[html]app_page.common.cancel"
  style="font-size:13px;background:#4b9cdb;border:1px solid #298cda;font-weight:bold;"
  class="button_st3 i18n">
</button>`;

  document.body.appendChild(bg);
  const btn = bg.querySelector('button.button_st3');
  btn.onclick = () => {
    if (global._app.xhr_to_cancel) {
      global._app.xhr_to_cancel.abort();
      global._app.xhr_to_cancel = undefined;
    }
    if (global._app.webworker_to_cancel) {
      global._app.webworker_to_cancel.onmessage = null;
      global._app.webworker_to_cancel.terminate();
      global._app.webworker_to_cancel = undefined;
    }
    bg.style.display = 'none';
  };
  return {
    display(opts = {}) {
      bg.style.display = '';
      if (opts.cancel_button && opts.cancel_button === false) {
        btn.style.display = 'none';
      }
      if (opts.zIndex) {
        bg.style.zIndex = opts.zIndex;
      }
    },
    hide() {
      bg.style.display = 'none';
      bg.style.zIndex = '';
      btn.style.display = '';
    },
  };
};

export const drag_elem_geo = d3.drag()
  .subject(function () {
    const t = d3.select(this);
    return {
      x: t.attr('x'),
      y: t.attr('y'),
      map_locked: !!map_div.select('#hand_button').classed('locked'),
    };
  })
  .on('start', () => {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    handle_click_hand('lock');
  })
  .on('end', () => {
    if (d3.event.subject && !d3.event.subject.map_locked) { handle_click_hand('unlock'); }
  })
  .on('drag', function () {
    d3.select(this).attr('x', d3.event.x).attr('y', d3.event.y);
  });

export const drag_elem_geo2 = d3.drag()
  .filter(function () {
    return data_manager.current_layers[_app.id_to_layer.get(this.parentElement.id)].draggable;
  })
  .subject(function () {
    // const layer_name = global._app.id_to_layer.get(this.parentElement.id);
    const symbol = data_manager.current_layers[_app.id_to_layer.get(this.parentElement.id)].symbol;
    const t = d3.select(this);
    if (symbol === 'rect') {
      return {
        x: t.attr('x'),
        y: t.attr('y'),
        symbol: symbol,
        map_locked: !!map_div.select('#hand_button').classed('locked'),
      };
    } else if (symbol === 'circle') {
      return {
        x: t.attr('cx'),
        y: t.attr('cy'),
        symbol: symbol,
        map_locked: !!map_div.select('#hand_button').classed('locked'),
      };
    }
  })
  .on('start', function () {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    handle_click_hand('lock');
    const zoom = svg_map.__zoom;
    const centroid = path.centroid(this.__data__.geometry);
    centroid[0] = centroid[0] * zoom.k + zoom.x;
    centroid[1] = centroid[1] * zoom.k + zoom.y;
    map.append('rect')
      .attrs({
        x: centroid[0] - 2,
        y: centroid[1] - 2,
        height: 4,
        width: 4,
        id: 'ref_symbol_location',
      })
      .style('fill', 'red');
  })
  .on('end', () => {
    if (d3.event.subject && !d3.event.subject.map_locked) {
      handle_click_hand('unlock');
    }
    map.selectAll('#ref_symbol_location').remove();
  })
  .on('drag', function () {
    if (d3.event.subject.symbol === 'rect') {
      d3.select(this).attr('x', d3.event.x).attr('y', d3.event.y);
    } else if (d3.event.subject.symbol === 'circle') {
      d3.select(this).attr('cx', d3.event.x).attr('cy', d3.event.y);
    }
  });

export const drag_waffle = d3.drag()
  .filter(function () {
    return data_manager.current_layers[_app.id_to_layer.get(this.parentElement.id)].draggable;
  })
  .subject(function () {
    const t = d3.select(this);
    let prev_translate = t.attr('transform');
    prev_translate = prev_translate ? prev_translate.slice(10, -1).split(/[ ,]+/).map(f => +f) : [0, 0];
    return {
      x: t.attr('x') + prev_translate[0],
      y: t.attr('y') + prev_translate[1],
      map_locked: !!map_div.select('#hand_button').classed('locked'),
    };
  })
  .on('start', () => {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    handle_click_hand('lock');
  })
  .on('end', function () {
    if (d3.event.subject && !d3.event.subject.map_locked) {
      handle_click_hand('unlock');
    }
    d3.select(this).style('cursor', 'grab');
  })
  .on('drag', function () {
    d3.select(this)
      .attr('transform', `translate(${[d3.event.x, d3.event.y]})`)
      .style('cursor', 'grabbing');
  });

export function setSelected(selectNode, value) {
  selectNode.value = value; // eslint-disable-line no-param-reassign
  selectNode.dispatchEvent(new Event('change'));
}

function path_to_geojson(layerName) {
  const id_layer = ['#', global._app.layer_to_id.get(layerName)].join('');
  const result_geojson = [];
  d3.select(id_layer)
    .selectAll('path')
    .each((d, i) => {
      result_geojson.push({
        type: 'Feature',
        id: i,
        properties: d.properties,
        geometry: { type: d.type, coordinates: d.coordinates },
      });
    });
  return JSON.stringify({
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: result_geojson,
  });
}

export function path_to_geojson2(layerName) {
  const id_layer = ['#', global._app.layer_to_id.get(layerName)].join('');
  const result_geojson = [];
  d3.select(id_layer)
    .selectAll('path')
    .each((d, i) => {
      result_geojson.push({
        type: 'Feature',
        id: i,
        properties: d.properties,
        geometry: d.geometry,
      });
    });
  return JSON.stringify({
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: result_geojson,
  });
}

export function display_error_during_computation(msg) {
  // FIXME :
  const message = message ? `<br><i>${_tr('app_page.common.details')}:</i> ${msg}` : '';
  swal({
    title: `${_tr('app_page.common.error')}!`,
    text: `${_tr('app_page.common.error_message')}${msg}`,
    customClass: 'swal2_custom',
    type: 'error',
    allowOutsideClick: false,
  });
}

/**
* Perform an asynchronous request
*
* @param {String} method - the method like "GET" or "POST"
* @param {String} url - the targeted url
* @param {FormData} data - Optionnal, the data to be send
* @return {Promise} response
*/
export function request_data(method, url, data) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url, true);
    request.onload = resolve;
    request.onerror = reject;
    request.send(data);
  });
}

/**
* Perform an asynchronous request
*
* @param {String} method - the method like "GET" or "POST"
* @param {String} url - the targeted url
* @param {FormData} data - Optionnal, the data to be send
* @param {Boolean} waitingMessage - Optionnal, whether to display or not
* a waiting message while the request is proceeded
* @return {Promise} response
*/
export function xhrequest(method, url, data, waitingMessage) {
  if (waitingMessage) {
    global._app.waitingOverlay.display();
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    global._app.xhr_to_cancel = request;
    request.open(method, url, true);
    request.onload = (resp) => {
      resolve(resp.target.responseText);
      global._app.xhr_to_cancel = undefined;
      if (waitingMessage) {
        global._app.waitingOverlay.hide();
      }
    };
    request.onerror = (err) => {
      reject(err);
      global._app.xhr_to_cancel = undefined;
      if (waitingMessage) {
        global._app.waitingOverlay.hide();
      }
    };
    request.send(data);
  });
}

export function getImgDataUrl(url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => { resolve(reader.result); };
      reader.readAsDataURL(request.response);
    };
    request.onerror = (err) => { reject(err); };
    request.open('GET', url, true);
    request.responseType = 'blob';
    request.send();
  });
}

export function make_content_summary(serie, precision = 6) {
  return [
    _tr('app_page.stat_summary.population'), ' : ', round_value(serie.pop(), precision), '<br>',
    _tr('app_page.stat_summary.min'), ' : ', round_value(serie.min(), precision), ' | ',
    _tr('app_page.stat_summary.max'), ' : ', round_value(serie.max(), precision), '<br>',
    _tr('app_page.stat_summary.mean'), ' : ', round_value(serie.mean(), precision), '<br>',
    _tr('app_page.stat_summary.median'), ' : ', round_value(serie.median(), precision), '<br>',
    _tr('app_page.stat_summary.variance'), ' : ', round_value(serie.variance(), precision), '<br>',
    _tr('app_page.stat_summary.stddev'), ' : ', round_value(serie.stddev(), precision), '<br>',
    _tr('app_page.stat_summary.cov'), ' : ', round_value(serie.cov(), precision),
  ].join('');
}

export function copy_layer(ref_layer, new_name, type_result, fields_to_copy) {
  const id_new_layer = encodeId(new_name);
  const id_ref_layer = global._app.layer_to_id.get(ref_layer);
  const node_ref_layer = svg_map.querySelector(`#${id_ref_layer}`);
  const { current_layers } = global.data_manager;
  global._app.layer_to_id.set(new_name, id_new_layer);
  global._app.id_to_layer.set(id_new_layer, new_name);
  svg_map.appendChild(node_ref_layer.cloneNode(true));
  svg_map.lastChild.setAttribute('id', id_new_layer);
  const node_new_layer = document.getElementById(id_new_layer);
  svg_map.insertBefore(node_new_layer, svg_map.querySelector('.legend'));
  data_manager.result_data[new_name] = [];
  current_layers[new_name] = {
    n_features: current_layers[ref_layer].n_features,
    type: current_layers[ref_layer].type,
    ref_layer_name: ref_layer,
  };
  if (current_layers[ref_layer].pointRadius) {
    current_layers[new_name].pointRadius = current_layers[ref_layer].pointRadius;
  }
  const selec_src = node_ref_layer.getElementsByTagName('path'),
    selec_dest = node_new_layer.getElementsByTagName('path');
  if (!fields_to_copy) {
    for (let i = 0; i < selec_src.length; i++) {
      selec_dest[i].__data__ = selec_src[i].__data__;
      data_manager.result_data[new_name].push(selec_dest[i].__data__.properties);
    }
  } else {
    for (let i = 0; i < selec_src.length; i++) {
      selec_dest[i].__data__ = {
        type: 'Feature',
        properties: {},
        geometry: cloneObj(selec_src[i].__data__.geometry),
      };
      const nb_field_to_copy = fields_to_copy.length;
      for (let j = 0; j < nb_field_to_copy; j++) {
        const f = fields_to_copy[j];
        selec_dest[i].__data__.properties[f] = selec_src[i].__data__.properties[f];
      }
      data_manager.result_data[new_name].push(selec_dest[i].__data__.properties);
    }
  }
  // Set the desired class name :
  node_new_layer.className.baseVal = 'layer';
  // Reset visibility and filter attributes to default values:
  node_new_layer.style.visibility = '';
  node_new_layer.removeAttribute('filter');
  // Create an entry in the layer manager:
  create_li_layer_elem(
    new_name,
    current_layers[new_name].n_features,
    [current_layers[new_name].type, type_result],
    'result',
  );
}

/**
* Send a geo result layer computed client-side (currently only discontinuities)
* to the server in order to use it as other result layers computed server side
* @param {string} layerName - The name of the layer to send
* @param {string} url - The url to use
* @return {undefined}
*/
export function send_layer_server(layerName, url) {
  const JSON_layer = path_to_geojson(layerName);
  const formToSend = new FormData();
  formToSend.append('geojson', JSON_layer);
  formToSend.append('layer_name', layerName);
  xhrequest('POST', url, formToSend, false).then((e) => {
    data_manager.current_layers[layerName].key_name = JSON.parse(e).key;
  }).catch((err) => {
    display_error_during_computation();
    console.log(err);
  });
}

/**
* Function returning the name of all current layers (excepted the sample layers used as layout)
*
* @return {Array} - The name of the other layers in an Array
*/
export function get_other_layer_names() {
  const otherLayers = Object.getOwnPropertyNames(data_manager.current_layers);
  let tmpIdx = null;

  tmpIdx = otherLayers.indexOf('Graticule');
  if (tmpIdx > -1) otherLayers.splice(tmpIdx, 1);

  tmpIdx = otherLayers.indexOf('World');
  if (tmpIdx > -1) otherLayers.splice(tmpIdx, 1);

  tmpIdx = otherLayers.indexOf('Sphere');
  if (tmpIdx > -1) otherLayers.splice(tmpIdx, 1);

  return otherLayers;
}

export function get_display_name_on_layer_list(layer_name_to_add) {
  return +layer_name_to_add.length > 40
    ? [layer_name_to_add.substring(0, 37), '(...)'].join('')
    : layer_name_to_add;
}

/**
* Function triggered in order to add a new layer
* in the "layer manager" (with appropriates icons regarding to its type, etc.)
* @param {string} layerName - The name of the new layer
* @param {integer} nbFt - The number of feature in this layer
* @param {string} typeGeom - The geometry type
* @param {string} typeLayer - Whether it is a result layer or not
* @return {undefined}
*/
export function create_li_layer_elem(layerName, nbFt, typeGeom, typeLayer) {
  const listDisplayName = get_display_name_on_layer_list(layerName);
  const layerId = encodeId(layerName);
  const layersListed = document.querySelector('#sortable.layer_list');
  const li = document.createElement('li');
  li.setAttribute('layer_name', layerName);
  if (typeLayer === 'result') {
    li.setAttribute('class', ['sortable_result ', layerId].join(''));
    const promotable = ['flow', 'grid', 'discont', 'cartogram', 'smooth'];
    const legend_but = typeGeom[1] !== 'cartogram'
      ? button_legend : undefined;
    const replace_but = promotable.indexOf(typeGeom[1]) > -1
      ? button_replace : undefined;
    li.innerHTML = [
      listDisplayName,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      legend_but,
      button_result_type.get(typeGeom[1]),
      replace_but,
      '</div> ',
    ].join('');
  } else if (typeLayer === 'target') {
    li.setAttribute('class', ['sortable_target ', layerId].join(''));
    li.innerHTML = [
      listDisplayName,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      button_type.get(typeGeom),
      button_replace,
      '</div>',
    ].join('');
  } else {
    const replace_but = !data_manager.current_layers[layerName].graticule &&
      !data_manager.current_layers[layerName].sphere ? button_replace : undefined;
    li.setAttribute('class', ['sortable ', layerId].join(''));
    li.innerHTML = [
      listDisplayName,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      button_type.get(typeGeom),
      replace_but,
      '</div> ',
    ].join('');
  }
  layersListed.insertBefore(li, layersListed.childNodes[0]);
  binds_layers_buttons(layerName);
}

/**
* Function returning an object describing the type of field
* @param {string} layerName - The name of the new layer
* @param {string} target - The geometry type
* @return {object|array} - An object containing the type of each field if
* target was nos specified, otherwise an array of field name corresponding
* to the type defined in 'target'.
*/
export const type_col = function type_col(layerName, target) {
// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
  const table = data_manager.user_data.hasOwnProperty(layerName)
    ? data_manager.user_data[layerName]
    : data_manager.result_data.hasOwnProperty(layerName)
      ? data_manager.result_data[layerName]
      : data_manager.joined_dataset[0];
  const fields = Object.getOwnPropertyNames(table[0]);
  const nbFeatures = table.length;
  const deepthTest = nbFeatures > 100 ? 100 : nbFeatures - 1;
  const result = {};
  let field;
  let tmpType;

  for (let j = 0, len = fields.length; j < len; ++j) {
    field = fields[j];
    result[field] = [];
    for (let i = 0; i < deepthTest; ++i) {
      tmpType = typeof table[i][field];
      if (tmpType === 'string' && table[i][field].length === 0) {
        tmpType = 'empty';
      } else if ((tmpType === 'string' && !isNaN(Number(table[i][field]))) || tmpType === 'number') {
        tmpType = 'number';
      } else if (tmpType === 'object' && isFinite(table[i][field])) {
        tmpType = 'empty';
      }
      result[fields[j]].push(tmpType);
    }
  }

  for (let j = 0, len = fields.length; j < len; ++j) {
    field = fields[j];
    if (result[field].every(ft => ft === 'number' || ft === 'empty')
          && result[field].indexOf('number') > -1) {
      result[field] = 'number';
    } else {
      result[field] = 'string';
    }
  }
  if (target) {
    const res = [];
    Object.keys(result).forEach((k) => {
      if (result[k] === target && k !== '_uid') {
        res.push(k);
      }
    });
    return res;
  }
  return result;
};

export const type_col2 = function type_col2(table, _field, skip_if_empty_values = false) {
// Function returning an array of objects like
// {name: "field1", type: "field_type"}, {name: "field2", type: "field_type"}, (...)]
//  for the fields of the selected layer.
  const result = [];
  const nbFeatures = table.length;
  const tmp = {};
  const dups = {};
  let field = _field;
  let tmpType;
  let fields;

  if (!field) {
    fields = Object.getOwnPropertyNames(table[0]).filter(v => v !== '_uid');
    field = undefined;
  } else {
    fields = [field];
    field = undefined;
  }

  for (let j = 0, len = fields.length; j < len; ++j) {
    field = fields[j];
    tmp[field] = [];
    dups[field] = false;
    const h = {};
    for (let i = 0; i < nbFeatures; ++i) {
      const val = table[i][field];
      if (h[val]) dups[field] = true;
      else h[val] = true;
      tmpType = typeof val;
      if (tmpType === 'object' && isFinite(val)) {
        tmpType = 'empty';
      } else if (tmpType === 'string' && val.length === 0) {
        tmpType = 'empty';
      } else if ((tmpType === 'string' && !isNaN(Number(val))) || tmpType === 'number') {
        const _val = Number(val);
        tmpType = (_val | 0) === val
          ? 'stock' : (_val | 0) === +val ? 'stock' : 'ratio';
      }
      tmp[fields[j]].push(tmpType);
    }
  }
  let nb_id_field = 0;
  for (let j = 0, len = fields.length; j < len; ++j) {
    field = fields[j];
    const hasDup = dups[field];
    if ((field.toLowerCase() === 'id' || field.toLowerCase().indexOf('name') > -1 || field.toLowerCase().indexOf('nom') > -1) && !hasDup) {
      result.push({ name: field, type: 'id', has_duplicate: hasDup });
      nb_id_field += 1;
    } else if (field.toLowerCase().indexOf('id') > -1 && nb_id_field < 1 && !hasDup) {
      result.push({ name: field, type: 'id', has_duplicate: hasDup });
      nb_id_field += 1;
    } else if (!hasDup && nb_id_field < 1 && tmp[field].every(ft => ft === 'string' || ft === 'stock')) {
      result.push({ name: field, type: 'id', has_duplicate: hasDup });
      nb_id_field += 1;
    } else if (tmp[field].every(ft => ft === 'string') && !hasDup) {
      result.push({ name: field, type: 'id', has_duplicate: hasDup });
      nb_id_field += 1;
    } else if (tmp[field].every(ft => ft === 'stock' || ft === 'empty') && tmp[field].indexOf('stock') > -1) {
      result.push({ name: field, type: 'stock', has_duplicate: hasDup });
    } else if (tmp[field].every(ft => ft === 'string' || ft === 'empty') && tmp[field].indexOf('string') > -1) {
      result.push({ name: field, type: 'category', has_duplicate: hasDup });
    } else if (tmp[field].every(ft => ft === 'ratio' || ft === 'stock' || ft === 'empty') && tmp[field].indexOf('ratio') > -1) {
      result.push({ name: field, type: 'ratio' });
    } else {
      result.push({ name: field, type: 'unknown', has_duplicate: hasDup });
    }
  }
  return result;
};

export const getFieldsType = function getFieldsType(type, layerName, ref) {
  if (!layerName && !ref) return null;
  const refField = ref || data_manager.current_layers[layerName].fields_type;
  if (!refField) return [];
  return refField.filter(d => d.type === type).map(d => d.name);
};

export function make_box_type_fields(layerName) {
  make_dialog_container(
    'box_type_fields',
    _tr('app_page.box_type_fields.title'),
    'dialog',
  );
  d3.select('#box_type_fields').select('.modal-dialog').style('width', '500px');
  const newbox = d3.select('#box_type_fields').select('.modal-body');
  const tmp = type_col2(data_manager.user_data[layerName]);
  let fields_type = data_manager.current_layers[layerName].fields_type;
  const f = fields_type.map(v => v.name);
  const refType = ['id', 'stock', 'ratio', 'category', 'unknown'];

  // const deferred = Promise.pending();
  const container = document.getElementById('box_type_fields');
  return new Promise((resolve, reject) => {
    const clean_up_box = () => {
      container.remove();
      overlay_under_modal.hide();
      document.removeEventListener('keydown', helper_esc_key_twbs);
      if (window.fields_handler) {
        fields_handler.unfill();
        fields_handler.fill(layerName);
      }
    };

    if (f.length === 0) { // If the user dont have already selected the type :
      fields_type = tmp.slice();
      container.querySelector('.btn_cancel').remove(); // Disabled cancel button to force the user to choose
      const _onclose = () => { // Or use the default values if he use the X  close button
        data_manager.current_layers[layerName].fields_type = tmp.slice();
        getAvailablesFunctionnalities(layerName);
        resolve(false);
        clean_up_box();
      };
      container.querySelector('#xclose').onclick = _onclose;
    } else if (tmp.length > fields_type.length) {
      // There is already types selected but new fields where added
      tmp.forEach((d) => {
        if (f.indexOf(d.name) === -1) { fields_type.push(d); }
      });
      container.querySelector('.btn_cancel').remove(); // Disabled cancel button to force the user to choose
      const _onclose = () => { // Or use the default values if he use the X  close button
        data_manager.current_layers[layerName].fields_type = tmp.slice();
        getAvailablesFunctionnalities(layerName);
        resolve(false);
        clean_up_box();
      };
      container.querySelector('#xclose').onclick = _onclose;
    } else { // There is already types selected and no new fields (so this is a modification) :
      // Use the previous values if the user close
      // the window without confirmation (cancel or X button)
      const _onclose = () => {
        data_manager.current_layers[layerName].fields_type = fields_type;
        resolve(false);
        clean_up_box();
      };
      container.querySelector('.btn_cancel').onclick = _onclose;
      container.querySelector('#xclose').onclick = _onclose;
    }

    // Fetch and store the selected values when 'Ok' button is clicked :
    container.querySelector('.btn_ok').onclick = function () {
      const r = [];
      Array.prototype.forEach.call(
        document.querySelectorAll('#fields_select > li'), (elem) => {
          r.push({ name: elem.childNodes[0].innerHTML.trim(), type: elem.childNodes[1].value });
        });
      resolve(true);
      data_manager.current_layers[layerName].fields_type = r.slice();
      getAvailablesFunctionnalities(layerName);
      clean_up_box();
    };
    function helper_esc_key_twbs(_evt) {
      const evt = _evt || window.event;
      const isEscape = ('key' in evt)
        ? (evt.key === 'Escape' || evt.key === 'Esc')
        : (evt.keyCode === 27);
      if (isEscape) {
        evt.stopPropagation();
        data_manager.current_layers[layerName].fields_type = tmp.slice();
        getAvailablesFunctionnalities(layerName);
        resolve(false);
        clean_up_box();
      }
    }
    document.addEventListener('keydown', helper_esc_key_twbs);
    document.getElementById('btn_type_fields').removeAttribute('disabled');

    newbox.append('h3').html(_tr('app_page.box_type_fields.message_invite'));

    const box_select = newbox.append('ul')
      .attr('id', 'fields_select')
      .styles({
        padding: '0',
        'list-style': 'none',
      });

    box_select.selectAll('li')
      .data(fields_type)
      .enter()
      .append('li');

    box_select.selectAll('li')
      .insert('span')
      .html(d => d.name);

    box_select.selectAll('li')
      .insert('select')
      .style('float', 'right')
      .selectAll('option')
      .data(refType)
      .enter()
      .insert('option')
      .attr('value', d => d)
      .text(d => _tr(`app_page.box_type_fields.${d}`))
      .exit();

    box_select.selectAll('select')
      .each(function (d) {
        this.value = d.type;
      });

    for (let i = 0; i < fields_type.length; i++) {
      if (fields_type[i].type === 'category' || fields_type[i].not_number) {
        box_select.node().childNodes[i].childNodes[1].options.remove(2);
        box_select.node().childNodes[i].childNodes[1].options.remove(1);
      }
      if (fields_type[i].has_duplicate) {
        box_select.node().childNodes[i].childNodes[1].options.remove(0);
      }
    }
    overlay_under_modal.display();
    setTimeout(() => { container.querySelector('button.btn_ok').focus(); }, 400);
  });
}

export function getAvailablesFunctionnalities(layerName) {
  const section = document.getElementById('section2_pre');
  if (!layerName) {
    const elems = section.querySelectorAll(
      '#button_grid, #button_discont, #button_smooth, #button_cartogram, #button_typosymbol, #button_flow, #button_prop, #button_choro, #button_choroprop, #button_typo, #button_proptypo, #button_two_stocks');
    for (let i = 0, len_i = elems.length; i < len_i; i++) {
      elems[i].style.filter = 'grayscale(100%)';
    }
    return;
  }

  const fields_stock = getFieldsType('stock', layerName),
    fields_ratio = getFieldsType('ratio', layerName),
    fields_categ = getFieldsType('category', layerName),
    fields_id = getFieldsType('id', layerName);
  let func_stock,
    func_ratio,
    func_categ,
    func_id;
  if (data_manager.current_layers[layerName].type === 'Line') { // Layer type is Line
    const elems = section.querySelectorAll('#button_grid, #button_discont, #button_smooth, #button_cartogram, #button_typosymbol, #button_flow');
    for (let i = 0, len_i = elems.length; i < len_i; i++) {
      elems[i].style.filter = 'grayscale(100%)';
    }
    func_id = [];
    func_stock = section.querySelectorAll('#button_prop');
    func_ratio = section.querySelectorAll('#button_choro, #button_choroprop');
    func_categ = section.querySelectorAll('#button_typo, #button_proptypo');
  } else if (data_manager.current_layers[layerName].type === 'Point') { // layer type is Point
    const elems = section.querySelectorAll('#button_discont, #button_cartogram');
    for (let i = 0, len_i = elems.length; i < len_i; i++) {
      elems[i].style.filter = 'grayscale(100%)';
    }
    func_id = section.querySelectorAll('#button_flow');
    func_stock = section.querySelectorAll('#button_smooth, #button_prop, #button_grid');
    func_ratio = section.querySelectorAll('#button_choro, #button_choroprop');
    func_categ = section.querySelectorAll('#button_typo, #button_proptypo, #button_typosymbol');
  } else { // Layer type is Polygon
    func_id = section.querySelectorAll('#button_flow');
    func_stock = section.querySelectorAll('#button_smooth, #button_prop, #button_grid, #button_cartogram, #button_discont');
    func_ratio = section.querySelectorAll('#button_choro, #button_choroprop, #button_discont');
    func_categ = section.querySelectorAll('#button_typo, #button_proptypo, #button_typosymbol');
  }
  /* eslint-disable no-param-reassign */
  const to_unactive = (d) => { d.style.filter = 'grayscale(100%)'; };
  const to_active = (d) => { d.style.filter = 'invert(0%) saturate(100%)'; };
  /* eslint-enable no-param-reassign */
  if (fields_stock.length === 0) {
    Array.prototype.forEach.call(func_stock, to_unactive);
  } else {
    Array.prototype.forEach.call(func_stock, to_active);
  }
  if (fields_ratio.length === 0) {
    Array.prototype.forEach.call(func_ratio, to_unactive);
  } else {
    Array.prototype.forEach.call(func_ratio, to_active);
  }
  if (fields_categ.length === 0) {
    Array.prototype.forEach.call(func_categ, to_unactive);
  } else {
    Array.prototype.forEach.call(func_categ, to_active);
  }
  if (fields_id.length === 0) {
    Array.prototype.forEach.call(func_id, to_unactive);
  } else {
    Array.prototype.forEach.call(func_id, to_active);
  }

  // That representation needs both Stock and Ratio variables:
  if (fields_stock.length === 0 || fields_ratio.length === 0) {
    document.getElementById('button_choroprop').style.filter = 'grayscale(100%)';
  } else {
    document.getElementById('button_choroprop').style.filter = 'invert(0%) saturate(100%)';
  }
  // That representation needs both Stock and Categorical variables:
  if (fields_stock.length === 0 || fields_categ.length === 0) {
    document.getElementById('button_proptypo').style.filter = 'grayscale(100%)';
  } else {
    document.getElementById('button_proptypo').style.filter = 'invert(0%) saturate(100%)';
  }
  // That representation needs either a Stock or a Ratio variable:
  if (data_manager.current_layers[layerName].type === 'Polygon'
      && (fields_stock.length > 0 || fields_ratio.length > 0)) {
    document.getElementById('button_discont').style.filter = 'invert(0%) saturate(100%)';
  } else {
    document.getElementById('button_discont').style.filter = 'grayscale(100%)';
  }
  // Special case for the "waffle" kind of map as it needs 2 or more stock variables:
  if (fields_stock.length < 2) {
    document.getElementById('button_two_stocks').style.filter = 'grayscale(100%)';
  } else {
    document.getElementById('button_two_stocks').style.filter = 'invert(0%) saturate(100%)';
  }
}

export const clickLinkFromDataUrl = function clickLinkFromDataUrl(url, filename) {
  return fetch(url)
    .then(res => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', blobUrl);
      dlAnchorElem.setAttribute('download', filename);
      // if (window.isIE || window.isOldMS_Firefox) {
      if (window.isIE) {
        swal({
          title: '',
          html: `<div class="link_download"><p>${_tr('app_page.common.download_link')}</p></div>`,
          showCancelButton: true,
          showConfirmButton: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
          cancelButtonText: _tr('app_page.common.close'),
          animation: 'slide-from-top',
          onOpen() {
            dlAnchorElem.innerHTML = filename;
            const content = document.getElementsByClassName('link_download')[0];
            content.appendChild(dlAnchorElem);
          },
          onClose() {
            URL.revokeObjectURL(blobUrl);
          },
        }).then(() => null, () => null);
      } else {
        dlAnchorElem.style.display = 'none';
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        URL.revokeObjectURL(blobUrl);
      }
    });
};

/**
* Clone a JS Object, taking care of also copying JS Map objects.
*
* @param {Array} obj - The object to be cloned.
* @return {Array} The resulting Object (or Map).
*/
export const cloneObj = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  else if (obj.toString() === '[object Map]') return new Map(obj.entries());
  return Object.assign({}, obj);
};


export function prepareFileExt(files_to_send) {
  /* eslint-disable no-param-reassign */
  Array.prototype.forEach.call(files_to_send, (f) => {
    f._ext = '';
    if (f.name.indexOf('.') > -1) {
      const name = f.name.substring(0, f.name.lastIndexOf('.'));
      const ext = f.name.substring(f.name.lastIndexOf('.') + 1, f.name.length);
      f._name = [name, ext.toLowerCase()].join('.');
      f._ext = ext.toLowerCase();
    }
  });
  /* eslint-enable no-param-reassign */
  return files_to_send;
}

// /**
// * Take an array to reverse it (acting on a copy of the input).
// *
// * @param {Array} arr - The array to be copied and reversed.
// * @return {Array} The resulting Array, letting the input Array untouched.
// */
// function getCopyReversed(arr) {
//   return arr.slice().reverse();
// }

/**
* Try to parse a JSON string into. Returns an Array of two elements :
* like [true, data] if parsing suceeded or like [false, error] if it failed.
*
* @param {String} txt - The JSON string to be parsed.
* @return {Array} An Array of two element, this first one is a Boolean (wheter
* parsing the string sucedded or not) and the second is the resulting object or
* the error thrown.
*/
export const isValidJSON = (txt) => {
  try {
    const a = JSON.parse(txt);
    return [true, a];
  } catch (e) {
    return [false, e];
  }
};

export function accordionize2(css_selector = '.accordion', parent = document) {
  const acc = parent.querySelectorAll(css_selector);
  for (let i = 0; i < acc.length; i++) {
    acc[i].onclick = function () {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');
    };
  }
}

export function getTargetLayerProps() {
  const names = Object.keys(data_manager.current_layers);
  for (let i = 0, n_layer = names.length; i < n_layer; i++) {
    if (data_manager.current_layers[names[i]].targeted) {
      return data_manager.current_layers[names[i]];
    }
  }
  return null;
}
