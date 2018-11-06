import alertify from 'alertifyjs';
import jschardet from 'jschardet';
import proj4 from 'proj4';
import * as topojson from 'topojson';
import { rgb2hex } from './colors_helpers';
import { make_confirm_dialog2 } from './dialogs';
import { available_fonts } from './fonts';
import { clean_menu_function, reset_user_values } from './function';
import {
  create_li_layer_elem, createWaitingOverlay,
  display_error_during_computation,
  drag_elem_geo, getAvailablesFunctionnalities,
  getImgDataUrl, isValidJSON,
  make_box_type_fields, prepareFileExt,
  send_layer_server,
  type_col2, xhrequest,
} from './helpers';
import { round_value } from './helpers_calc';
import { Mmax } from './helpers_math';
import { createJoinBox, valid_join_check_display } from './join_popup';
import { createDropShadow, handle_click_layer } from './layers_style_popup';
import { add_layer_topojson } from './layers';
import { handle_legend } from './legend';
import { reproj_symbol_layer, zoom, zoomClick, zoom_without_redraw } from './map_ctrl';
import { apply_user_preferences, beforeUnloadWindow } from './map_project';
import { addLastProjectionSelect, change_projection, change_projection_4 } from './projections';
import { world_topology } from './sample_topo';
import { boxExplore2 } from './tables';
import handleZoomRect from './zoom_rect';
import { button_type } from './ui/buttons';
import makeHeader from './ui/header';
import makeSection1 from './ui/section1';
import { makeSection2 } from './ui/section2';
import makeSection3 from './ui/section3';
import makeSection4 from './ui/section4';
import { makeSection5 } from './ui/section5';

/**
* Maxium allowed input size in bytes. If the input file is larger than
* this size, the user will receive an alert.
* In the case of sending multiple files unziped, this limit corresponds
* to the sum of the size of each file.
*/
const MAX_INPUT_SIZE = 27300000;


/**
* Function setting-up main elements of the interface
*
* Some of the variables created here are put in global/window scope
* as they are gonna be frequently used
*
*/
export function setUpInterface(reload_project) {
  // Create the waiting overlay to be ready to be displayed when needed:
  global._app.waitingOverlay = createWaitingOverlay();
  // Only ask for confirmation before leaving page if things have been done
  // (layer added, etc..)
  window.addEventListener('beforeunload', beforeUnloadWindow);

  // Remove some layers from the server when user leave the page
  // (ie. result layers are removed but targeted layer and layout layers stay
  // in cache as they have more chance to be added again)
  window.addEventListener('unload', () => {
    const layer_names = Object.getOwnPropertyNames(data_manager.current_layers).filter((name) => {
      if (!(data_manager.current_layers[name].hasOwnProperty('key_name'))) {
        return 0;
      } else if (data_manager.current_layers[name].targeted) {
        return 0;
      } else if (data_manager.current_layers[name].renderer
            && (data_manager.current_layers[name].renderer.indexOf('PropSymbols') > -1
              || data_manager.current_layers[name].renderer.indexOf('Dorling') > -1
              || data_manager.current_layers[name].renderer.indexOf('Choropleth') > -1
              || data_manager.current_layers[name].renderer.indexOf('Categorical') > -1)) {
        return 0;
      }
      return 1;
    });
    if (layer_names.length) {
      const formToSend = new FormData();
      layer_names.forEach((name) => {
        formToSend.append('layer_name', data_manager.current_layers[name].key_name);
      });
      navigator.sendBeacon('/layers/delete', formToSend);
    }
  }, false);

  global.overlay_drop = document.querySelector('#overlay_drop');
  document.getElementById('menu').style.display = null;
  makeHeader();
  makeSection1();
  makeSection2();
  makeSection3();
  makeSection4();
  add_simplified_land_layer();
  makeSection5();

  // Zoom-in, Zoom-out, Info, Hand-Move and RectZoom buttons (on the top of the map) :
  const lm = map_div
    .append('div')
    .attr('class', 'light-menu');

  const lm_buttons = [
    { id: 'zoom_out', i18n: '[data-ot]app_page.lm_buttons.zoom-', class: 'zoom_button i18n tt', html: '-' },
    { id: 'zoom_in', i18n: '[data-ot]app_page.lm_buttons.zoom+', class: 'zoom_button i18n tt', html: '+' },
    { id: 'info_button', i18n: '[data-ot]app_page.lm_buttons.i', class: 'info_button i18n tt', html: 'i' },
    { id: 'brush_zoom_button', i18n: '[data-ot]app_page.lm_buttons.zoom_rect', class: 'brush_zoom_button i18n tt', html: '<img src="static/img/Inkscape_icons_zoom_fit_selection_blank.png" width="18" height="18" alt="Zoom_select"/>' },
    { id: 'hand_button', i18n: '[data-ot]app_page.lm_buttons.hand_button', class: 'hand_button i18n tt', html: '<img src="static/img/Twemoji_1f513.png" width="18" height="18" alt="Hand_closed"/>' },
  ];

  lm.selectAll('input')
    .data(lm_buttons)
    .enter()
    .append('p')
    .attr('class', 'cont_map_btn')
    .insert('button')
    .attrs(elem => ({
      class: elem.class,
      'data-i18n': elem.i18n,
      'data-ot-delay': 0,
      'data-ot-fixed': true,
      'data-ot-target': true,
      id: elem.id,
    }))
    .html(elem => elem.html);

  // Trigger actions when buttons are clicked and set-up the initial view :
  d3.selectAll('.zoom_button').on('click', zoomClick);
  document.getElementById('info_button').onclick = displayInfoOnMove;
  document.getElementById('hand_button').onclick = handle_click_hand;
  document.getElementById('brush_zoom_button').onclick = handleZoomRect;

  // Already append the div for displaying information on features,
  // setting it currently unactive until it will be requested :
  d3.select('body')
    .append('div')
    .attr('id', 'info_features')
    .classed('active', false)
    .style('display', 'none')
    .html('');

  accordionize('.accordion');
  document.getElementById('btn_s1').dispatchEvent(new MouseEvent('click'));
  prepare_drop_section();

  if (reload_project) {
    let url;
    if (reload_project.startsWith('http')) {
      url = reload_project;
    } else {
      url = `https://gist.githubusercontent.com/${reload_project}/raw/`;
    }
    xhrequest('GET', url, undefined, true)
      .then((data) => {
        apply_user_preferences(data);
      });
  } else {
    // Check if there is a project to reload in the localStorage :
    const last_project = window.localStorage.getItem('magrit_project');
    if (last_project && last_project.length && last_project.length > 0) {
      swal({
        title: '',
        // text: _tr('app_page.common.resume_last_project'),
        allowOutsideClick: false,
        allowEscapeKey: false,
        type: 'question',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: _tr('app_page.common.new_project'),
        cancelButtonText: _tr('app_page.common.resume_last'),
      }).then(() => {
        // If we don't want to resume from the last project, we can
        // remove it :
        window.localStorage.removeItem('magrit_project');
      }, () => {
        apply_user_preferences(last_project);
      });
    }
  }
  // Set the properties for the notification zone :
  alertify.set('notifier', 'position', 'bottom-left');
}

/**
*
* @param
*
*
*/
export function askTypeLayer () {
  const opts = { target: _tr('app_page.common.target_l'), layout: _tr('app_page.common.layout_l') };
  const target_layer_added = Object.keys(data_manager.user_data).length > 0;
  let first_reject = false;
  return swal({
    title: '',
    text: _tr('app_page.common.layer_type_selection'),
    type: 'info',
    showCancelButton: true,
    showCloseButton: false,
    allowEscapeKey: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
    input: 'select',
    inputValue: target_layer_added ? 'layout' : 'target',
    inputPlaceholder: _tr('app_page.common.layer_type_selection'),
    inputOptions: opts,
    inputValidator: (value) => {
      return new Promise(function (resolve, reject) {
        if (value.indexOf('target') < 0 && value.indexOf('layout') < 0) {
          reject(_tr('app_page.common.no_value'));
        } else if (value.indexOf('target') > -1 && _app.targeted_layer_added && !first_reject) {
          first_reject = true;
          reject(_tr('app_page.common.ask_replace_target_layer'));
        } else {
          if (value.indexOf('target') > -1 && first_reject) {
            downgradeTargetLayer();
          }
          resolve(value);
        }
      });
    },
  });
}


/**
* @param {FileList} files - The files(s) to be handled for this layer
*
* @return undefined
*/
export function handle_upload_files(files) {
  const tot_size = Array.prototype.map.call(files, f => f.size).reduce((a, b) => a + b, 0);
  if (files[0] && !files[0]._ext) {
    files = prepareFileExt(files);
  }
  if (tot_size > MAX_INPUT_SIZE) {
    return swal({
      title: `${_tr('app_page.common.error')}!`,
      text: _tr('app_page.common.too_large_input'),
      type: 'error',
      customClass: 'swal2_custom',
      allowEscapeKey: false,
      allowOutsideClick: false
    });
  }
  if (!(files.length === 1)) {
    const files_to_send = [];
    Array.prototype.forEach.call(files, f =>
        (f._ext === 'shp' || f._ext === 'dbf' || f._ext === 'shx' || f._ext === 'prj' || f._ext === 'cpg' ? files_to_send.push(f) : null));
    if (files_to_send.length >= 4 && files_to_send.length <= 6) {
      handle_shapefile(files_to_send);
    } else {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload1'),
        customClass: 'swal2_custom',
        type: 'error',
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
    }
  } else if (files[0]._ext.indexOf('json') > -1 || files[0]._ext === 'zip' || files[0]._ext === 'gml' || files[0]._ext === 'kml') {
    if (files[0]._ext.indexOf('json') < 0) {
      handle_single_file(files[0]);
    } else {
      const rd = new FileReader();
      rd.onloadend = () => {
        const [valid, tmp] = isValidJSON(rd.result);
        if (!valid) {
          console.log(tmp);
          return swal({
            title: `${_tr('app_page.common.error')}!`,
            text: _tr('app_page.common.alert_upload_invalid'),
            type: 'error',
            customClass: 'swal2_custom',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
        }
        if (tmp.type && tmp.type === 'FeatureCollection') {
          handle_single_file(files[0]);
        } else if (tmp.type && tmp.type === 'Topology') {
          handle_TopoJSON_files(files);
        } else if (tmp.map_config && tmp.layers) {
          apply_user_preferences(rd.result);
        } else {
          return swal({
            title: `${_tr('app_page.common.error')}!`,
            text: _tr('app_page.common.alert_upload_invalid'),
            type: 'error',
            customClass: 'swal2_custom',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
        }
      };
      rd.readAsText(files[0]);
    }
  } else if (files[0]._ext === 'csv' || files[0]._ext === 'tsv') {
    handle_dataset(files[0]);
  } else if (files[0]._ext.indexOf('xls') > -1 || files[0]._ext.indexOf('ods') > -1) {
    convert_dataset(files[0]);
  } else {
    let shp_part;
    Array.prototype.forEach.call(files, (f) => {
      f._ext === 'shp' || f._ext === 'dbf' || f._ext === 'shx' || f._ext === 'prj' || f._ext === 'cpg' ? shp_part = true : null;
    });
    if (shp_part) {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload_shp'),
        type: 'error',
        customClass: 'swal2_custom',
        allowOutsideClick: false,
        allowEscapeKey: false,
      })
      .then(() => null, () => null);
    } else {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload_invalid'),
        type: 'error',
        customClass: 'swal2_custom',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }
  }
}

function handleOneByOneShp(files) {
  function populate_shp_slot(slots, file) {
    if (file.name.toLowerCase().indexOf('.shp') > -1) {
      slots.set('.shp', file);
      document.getElementById('f_shp').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.shx') > -1) {
      slots.set('.shx', file);
      document.getElementById('f_shx').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.prj') > -1) {
      slots.set('.prj', file);
      document.getElementById('f_prj').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.dbf') > -1) {
      slots.set('.dbf', file);
      document.getElementById('f_dbf').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.cpg') > -1) {
      slots.set('.cpg', file);
      document.getElementById('f_cpg').className = 'mini_button_ok';
    } else {
      return false;
    }
  }
  let name = files[0].name.substring(0, files[0].name.lastIndexOf('.'));
  const shp_slots = new Map();

  swal({
    title: '',
    html: '<div style="border: dashed 1px green;border-radius: 1%;" id="dv_drop_shp">' +
          `<strong>${_tr('app_page.common.shp_one_by_one_msg1')}</strong><br>` +
          `<p style="margin:auto;">${_tr('app_page.common.shp_one_by_one_msg2', { name: name })}</p>` +
          `<p><i>${_tr('app_page.common.shp_one_by_one_msg3')}</i></p><br>` +
          '<image id="img_drop" src="static/img/Ic_file_download_48px.svg"><br>' +
          '<p id="f_shp" class="mini_button_none">.shp</p><p id="f_shx" class="mini_button_none">.shx</p>' +
          '<p id="f_dbf" class="mini_button_none">.dbf</p><p id="f_prj" class="mini_button_none">.prj</p>' +
          '<p id="f_cpg" class="mini_button_none_orange">.cpg</p></div>',
    type: 'info',
    showCancelButton: true,
    showCloseButton: false,
    allowEscapeKey: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
    preConfirm: () => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!((shp_slots.size === 4 && !shp_slots.has('.cpg')) || shp_slots.size === 5)) {
          reject(_tr('app_page.common.shp_one_by_one_missing_files'));
        } else {
          resolve();
        }
      }, 50);
    }),
  }).then(() => {
    const file_list = [shp_slots.get('.shp'), shp_slots.get('.shx'), shp_slots.get('.dbf'), shp_slots.get('.prj')];
    if (shp_slots.has('.cpg')) {
      file_list.push(shp_slots.get('.cpg'));
    }
    for (let i = 0; i < file_list.length; i++) {
      if (file_list[i].size > MAX_INPUT_SIZE) {
        overlay_drop.style.display = 'none';
        return swal({
          title: `${_tr('app_page.common.error')}!`,
          text: _tr('app_page.common.too_large_input'),
          type: 'error',
          allowEscapeKey: false,
          allowOutsideClick: false,
        });
      }
    }
    handle_shapefile(file_list);
  }, (dismiss) => {
    overlay_drop.style.display = 'none';
    console.log(dismiss);
  });

  populate_shp_slot(shp_slots, files[0]);
  document.getElementById('dv_drop_shp').addEventListener('drop', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const next_files = prepareFileExt(event.dataTransfer.files);
    for (let f_ix = 0; f_ix < next_files.length; f_ix++) {
      // let file = next_files[f_ix];
      populate_shp_slot(shp_slots, next_files[f_ix]);
    }
    if ((shp_slots.size === 4 && !shp_slots.has('.cpg')) || shp_slots.size === 5) {
      // const elem = document.getElementById('dv_drop_shp');
      // elem.innerHTML = elem.innerHTML.replace('Ic_file_download_48px.svg', 'Ic_check_36px.svg');
      this.innerHTML = this.innerHTML.replace('Ic_file_download_48px.svg', 'Ic_check_36px.svg');
    }
  });
  document.getElementById('dv_drop_shp').addEventListener('dragover', function (event) {
    this.style.border = 'dashed 2.5px green';
    event.preventDefault(); event.stopPropagation();
  });
  document.getElementById('dv_drop_shp').addEventListener('dragleave', function (event) {
    this.style.border = 'dashed 1px green';
    event.preventDefault(); event.stopPropagation();
  });
}

/**
* Function called to bind the "drop zone" on the 2 desired menu elements
*
*/
export function prepare_drop_section() {
  let timeout;
  Array.prototype.forEach.call(
    document.querySelectorAll('body, .overlay_drop'),
    (elem) => {
        elem.addEventListener('dragenter', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) return;
          document.getElementById('overlay_drop').style.display = '';
        });

        elem.addEventListener('dragover', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) return;
          if (timeout) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              // e.preventDefault(); e.stopPropagation();
              document.getElementById('overlay_drop').style.display = 'none';
              timeout = null;
            }, 2500);
          }
        });

        elem.addEventListener('dragleave', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) {
            document.body.classList.remove('no-drop');
            return;
          }
          timeout = setTimeout(() => {
            document.getElementById('overlay_drop').style.display = 'none';
            timeout = null;
          }, 2500);
        });

        elem.addEventListener('drop', function _drop_func(e) {
          e.preventDefault(); e.stopPropagation();
          if (timeout) {
            clearTimeout(timeout);
          }
          if (document.body.classList.contains('no-drop') || !e.dataTransfer.files.length) {
            document.getElementById('overlay_drop').style.display = 'none';
            return;
          }
          timeout = setTimeout(() => {
            document.getElementById('overlay_drop').style.display = 'none';
            timeout = null;
          }, 750);

          const files = prepareFileExt(e.dataTransfer.files);
          if (files.length === 1
              && (files[0]._ext === 'shp' || files[0]._ext === 'dbf' || files[0]._ext === 'shx' || files[0]._ext === 'prj' || files[0]._ext === 'cpg')) {
            Array.prototype.slice.call(document.querySelectorAll('body, .overlay_drop'))
              .forEach((_elem) => {
                _elem.removeEventListener('drop', _drop_func);
              });
            handleOneByOneShp(files);
          } else {
            handle_upload_files(files, null);
          }
        });
    });
}

function ask_replace_dataset() {
  return swal({
    title: '',
    text: _tr('app_page.common.ask_replace_dataset'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
  });
}

function convert_dataset(file) {
  const do_convert = () => {
    const ajaxData = new FormData();
    ajaxData.append('action', 'submit_form');
    ajaxData.append('file[]', file);
    xhrequest('POST', 'convert_tabular', ajaxData, true)
      .then((raw_data) => {
        const data = JSON.parse(raw_data);
        swal({
          title: '',
          text: _tr('app_page.common.warn_xls_sheet') + (data.message ? '\n' + _tr(data.message[0], { sheet_name: data.message[1][0] }) : ''),
          type: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          const tmp_dataset = d3.csvParse(data.file);
          const field_names = Object.getOwnPropertyNames(tmp_dataset[0]).map(el => (el.toLowerCase ? el.toLowerCase() : el));
          if (!_app.targeted_layer_added && (field_names.indexOf('x') > -1 || field_names.indexOf('lat') > -1 || field_names.indexOf('latitude') > -1)) {
            if (field_names.indexOf('y') > -1 || field_names.indexOf('lon') > -1 || field_names.indexOf('longitude') > -1 || field_names.indexOf('long') > -1 || field_names.indexOf('lng') > -1) {
              add_csv_geom(data.file, data.name);
              return;
            }
          }
          data_manager.dataset_name = data.name;
          add_dataset(tmp_dataset);
        }, () => null);
      }, () => {
        display_error_during_computation();
      });
  };

  if (data_manager.joined_dataset.length !== 0) {
    ask_replace_dataset().then(() => {
      remove_ext_dataset_cleanup();
      do_convert();
    }, () => null);
  } else {
    do_convert();
  }
}

/**
* Handle shapefile opened/dropped on the window by the user.
*
* @param {Array} files - An array of files, containing the mandatory files
*                       for correctly reading shapefiles
*                       (.shp, .shx, .dbf, .prj and optionnaly .cpg).
* @return {void}
*/
function handle_shapefile(files) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const ajaxData = new FormData();
      ajaxData.append('type', 'multiple');
      for (let j = 0; j < files.length; j++) {
        ajaxData.append(`file[${j}]`, files[j]);
      }
      xhrequest('POST', 'convert_to_topojson', ajaxData, true)
        .then((data) => {
          add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        }, () => {
          display_error_during_computation();
        });
    }, () => {
      overlay_drop.style.display = 'none';
    });
}


function handle_TopoJSON_files(files) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const f = files[0],
        // name = files[0].name,
        reader = new FileReader(),
        ajaxData = new FormData();
      ajaxData.append('file[]', f);
      xhrequest('POST', 'convert_topojson', ajaxData, true)
        .then((res) => {
          const key = JSON.parse(res).key;
          reader.onloadend = () => {
            const text = reader.result;
            const topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
            add_layer_topojson(topoObjText, { target_layer_on_add: target_layer_on_add });
          };
          reader.readAsText(f);
        }, () => {
          display_error_during_computation();
        });
    }, () => {
      overlay_drop.style.display = 'none';
    });
}

/**
* Function used to reload a TopoJSON layer from a project file.
* The layer is send to the server (for eventual later usage) but
* we are not waiting for its response to actually add the layer to the map.
*
* @param {String} text - The TopoJSON layer stringified in JSON.
* @param {Object} param_add_func - The options Object to be passed to the
*                               'add_layer_topojson' function.
* @return {String} - The actual name of the layer, once added to the map.
*
*/
export function handle_reload_TopoJSON(text, param_add_func) {
  const ajaxData = new FormData();
  const f = new Blob([text], { type: 'application/json' });
  ajaxData.append('file[]', f);

  // let topoObjText = ['{"key":null,"file":', text, '}'].join('');
  const layer_name = add_layer_topojson(['{"key":null,"file":', text, '}'].join(''), param_add_func);
  xhrequest('POST', 'convert_topojson', ajaxData, false)
    .then((response) => {
      const key = JSON.parse(response).key;
      data_manager.current_layers[layer_name].key_name = key;
    });
  return layer_name;
}

/**
* Handle a csv dataset by parsing it as an array of Object (ie features) or by
* converting it to topojson if it contains valid x/y/lat/lon/etc. columns and
* adding it to the map
* @param {File} f - The input csv file
*/
function handle_dataset(f, target_layer_on_add) {
  const check_dataset = () => {
    const reader = new FileReader(),
      name = f.name;

    reader.onload = (e) => {
      let data = e.target.result;
      const encoding = jschardet.detect(data).encoding;
      const new_reader = new FileReader();
      new_reader.onload = function (ev) {
        data = ev.target.result;
        let sep = data.split('\n')[0];
        if (sep.indexOf('\t') > -1) {
          sep = '\t';
        } else if (sep.indexOf(';') > -1) {
          sep = ';';
        } else {
          sep = ',';
        }

        const tmp_dataset = d3.dsvFormat(sep).parse(data);
        const field_names = Object.getOwnPropertyNames(tmp_dataset[0]).map(el => (el.toLowerCase ? el.toLowerCase() : el));
        if (field_names.indexOf('x') > -1 || field_names.indexOf('lat') > -1 || field_names.indexOf('latitude') > -1) {
          if (field_names.indexOf('y') > -1 || field_names.indexOf('lon') > -1 || field_names.indexOf('longitude') > -1 || field_names.indexOf('long') > -1 || field_names.indexOf('lng') > -1) {
            if (target_layer_on_add && _app.targeted_layer_added) {
              swal({
                title: `${_tr('app_page.common.error')}!`,
                text: _tr('app_page.common.error_only_one'),
                customClass: 'swal2_custom',
                type: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false });
            } else {
              add_csv_geom(data, name.substring(0, name.indexOf('.csv')));
            }
            return;
          }
        }
        data_manager.dataset_name = name.substring(0, name.indexOf('.csv'));
        add_dataset(tmp_dataset);
      };
      new_reader.readAsText(f, encoding);
    };
    reader.readAsBinaryString(f);
  };

  if (data_manager.joined_dataset.length !== 0) {
    ask_replace_dataset().then(() => {
      remove_ext_dataset_cleanup();
      check_dataset();
    }, () => null);
  } else {
    check_dataset();
  }
}

// function handle_dataset(f, target_layer_on_add){
//     function box_dataset(){
//         createBoxTextImportWizard(f).then(confirm => {
//             if(confirm){
//                 let [tmp_dataset, valid] = confirm;
//                 console.log(tmp_dataset, valid);
//                 let field_name = Object.getOwnPropertyNames(tmp_dataset[0]);
//                 if(field_name.indexOf("x") > -1 || field_name.indexOf("X") > -1 || field_name.indexOf("lat") > -1 || field_name.indexOf("latitude") > -1){
//                     if(field_name.indexOf("y") > -1 || field_name.indexOf("Y") > -1 || field_name.indexOf("lon") > -1 || field_name.indexOf("longitude") > -1 || field_name.indexOf("long") > -1){
//                         if(target_layer_on_add && _app.targeted_layer_added){
//                             swal({title: _tr("app_page.common.error") + "!",
//                                   text: _tr('app_page.common.error_only_one'),
//                                   customClass: 'swal2_custom',
//                                   type: "error",
//                                   allowEscapeKey: false,
//                                   allowOutsideClick: false});
//
//                         } else {
//                             let reader = new FileReader(),
//                                 name = f.name;
//
//                             reader.onload = function(e) {
//                                 add_csv_geom(e.target.result, f.name.substring(0, name.indexOf('.csv')));
//                             }
//                             reader.readAsText();
//                         }
//                         return;
//                     }
//                 }
//                 data_manager.dataset_name = f.name.substring(0, f.name.indexOf('.csv'));
//                 add_dataset(tmp_dataset);
//             }
//         });
//     }
//
//     if(data_manager.joined_dataset.length !== 0){
//         ask_replace_dataset().then(() => {
//             remove_ext_dataset_cleanup();
//             box_dataset();
//           }, () => { null; });
//     } else {
//         box_dataset();
//     }
// }

export function update_menu_dataset() {
  const d_name = data_manager.dataset_name.length > 20 ? [data_manager.dataset_name.substring(0, 17), '(...)'].join('') : data_manager.dataset_name,
    nb_features = data_manager.joined_dataset[0].length,
    field_names = Object.getOwnPropertyNames(data_manager.joined_dataset[0][0]);

  d3.select('#ext_dataset_zone')
    .attr('data-i18n', null)
    .styles({
      border: null,
      color: 'black',
      'margin-bottom': '3px',
      padding: null,
      'text-align': 'initial',
    })
    .html(`
<div style="display:inline-block;"><img id="img_data_ext" src="static/img/b/tabular.png" width="26" height="26" alt="Additional dataset"></img></div>
<div style="display:inline-block;margin-left: 4px;"> <b>${d_name}</b><br><i><span style="font-size:10px;">
${nb_features} ${_tr('app_page.common.feature', { count: +nb_features })} - ${field_names.length} ${_tr('app_page.common.field', { count: +field_names.length })}</i></span>
</div>
<div style="float:right;">
<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_dataset">
<img width="14" height="14" src="static/img/dataset.png" id="table_dataset_s1">
</div>`);

  document.getElementById('remove_dataset').onclick = () => {
    remove_ext_dataset();
  };
  if (_app.targeted_layer_added) {
    valid_join_check_display(false);
  }
  document.getElementById('table_dataset_s1').onclick = () => {
    boxExplore2.create(data_manager.dataset_name);
  };
}


/**
*
*
*/
function add_dataset(readed_dataset) {
  // Check if their is an empty name in the columns name (typically the first one) and replace it by UID:
  if (readed_dataset[0].hasOwnProperty('')) {
    const new_col_name = !readed_dataset[0].hasOwnProperty('UID') ? 'UID' : 'Undefined_Name';
    for (let i = 0; i < readed_dataset.length; ++i) {
      readed_dataset[i][new_col_name] = readed_dataset[i][''];
      delete readed_dataset[i][''];
    }
  }

  const cols = Object.getOwnPropertyNames(readed_dataset[0]);

  // Test if there is an empty last line and remove it if its the case :
  if (cols.map(f => readed_dataset[readed_dataset.length - 1][f]).every(f => f === '' || f === undefined)) {
    readed_dataset = readed_dataset.slice(0, readed_dataset.length - 1);
  }

  // Suboptimal way to convert an eventual comma decimal separator to a point decimal separator :
  for (let i = 0; i < cols.length; i++) {
    const tmp = [];
    // Check that all values of this field can be coerced to Number :
    for (let j = 0; j < readed_dataset.length; j++) {
      if ((readed_dataset[j][cols[i]].replace &&
            (!isNaN(+readed_dataset[j][cols[i]].replace(',', '.')) || !isNaN(+readed_dataset[j][cols[i]].split(' ').join(''))))
         || !isNaN(+readed_dataset[j][cols[i]])) {
        // Add the converted value to temporary field if its ok ...
        const t_val = readed_dataset[j][cols[i]].replace(',', '.').split(' ').join('');
        tmp.push(isFinite(t_val) && t_val !== '' && t_val != null ? +t_val : t_val);
      } else {
        // Or break early if a value can't be coerced :
        break; // So no value of this field will be converted
      }
    }
    // If the whole field has been converted successfully, apply the modification :
    if (tmp.length === readed_dataset.length) {
      for (let j = 0; j < readed_dataset.length; j++) {
        readed_dataset[j][cols[i]] = tmp[j];
      }
    }
  }
  data_manager.joined_dataset.push(readed_dataset);

  update_menu_dataset();

  if (_app.current_functionnality && _app.current_functionnality.name === 'flow') {
    fields_handler.fill();
  }

  if (_app.targeted_layer_added) {
    const layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
    ask_join_now(layer_name, 'dataset');
  }
}

/**
* Send a csv file containing x/x columns to the server to convert it
* to a TopoJSON layer.
*
*
* @param {String} file - The csv file to be converted.
* @param {String} name - The original name of the csv file.
* @return {void}
*/
function add_csv_geom(file, name) {
  const ajaxData = new FormData();
  ajaxData.append('filename', name);
  ajaxData.append('csv_file', file);
  xhrequest('POST', 'convert_csv_geo', ajaxData, true)
    .then((data) => {
      data_manager.dataset_name = undefined;
      add_layer_topojson(data, { target_layer_on_add: true });
    }, () => {
      display_error_during_computation();
    });
}

/**
* Send a single file (.zip / .kml / .gml / .geojson) to the server in order to get
* the converted layer added to the map
* @param {File} file
*/
function handle_single_file(file) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const ajaxData = new FormData();
      ajaxData.append('type', 'single');
      ajaxData.append('file[]', file);
      xhrequest('POST', '/convert_to_topojson', ajaxData, true)
        .then((data) => {
          add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        }, () => {
          display_error_during_computation();
        });
    }, () => {
      overlay_drop.style.display = 'none';
    });
}

export function update_section1_layout() {
  let nb_layout_layer = 0;
  Object.keys(data_manager.current_layers).forEach((k) => {
    if (!data_manager.current_layers[k].is_result && !data_manager.current_layers[k].targeted) {
      nb_layout_layer += 1;
    }
  });
  if (nb_layout_layer > 0) {
    d3.select('#layout_layers_section')
      .style('display', 'inline-flex')
      .html(`<div>
<img src="static/img/type_geom/layer_waffle.png" width="26" height="26" style="filter:opacity(0.7)"></img></div>
<div style="margin-top: 7px;margin-left: 4px; font-style: italic;font-size: 90%;">
${_tr('app_page.section1.plus_layout_layers', { count: nb_layout_layer})}</div>`);
  } else {
    d3.select('#layout_layers_section')
      .style('display', 'none')
      .html('');
  }
}

export function update_section1(type, nb_fields, nb_ft, lyr_name_to_add) {
  const nb_char_display = lyr_name_to_add.length;
  const _lyr_name_display = +nb_char_display > 35 ? [lyr_name_to_add.substring(0, 30), '(...)'].join('') : lyr_name_to_add;

  // Prepare an icon according to the type of geometry:
  let _button = button_type.get(type);
  _button = _button.substring(10, _button.indexOf('class') - 2);

  // Upate the zone allowed for displaying info on the target layer:
  d3.select('#target_layer_zone')
    .attr('data-i18n', null)
    .styles({
      border: null,
      color: 'black',
      padding: null,
      'text-align': 'left',
    })
    .html(`<div style="display:inline-block;">
<img src="${_button}" width="26" height="26"></img>
</div>
<div style="display:inline-block;margin-left: 4px;">
<b>${_lyr_name_display}</b>
<br>
<i><span style="font-size:10px;">${nb_ft} ${_tr('app_page.common.feature', { count: +nb_ft })} - ${nb_fields} ${_tr('app_page.common.field', { count: +nb_fields })}</i></span>
</div>
<div style="float:right;">
<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_target">
<img width="14" height="14" src="static/img/dataset.png" id="table_layer_s1">
<img width="14" height="14" src="static/img/replace_target_layer.svg" id="downgrade_target">
</div>`);

  // const remove_target = document.getElementById('remove_target');
  document.getElementById('remove_target').onclick = () => { remove_layer(Object.getOwnPropertyNames(data_manager.user_data)[0]); };
  // const table_target = document.getElementById('table_layer_s1');
  document.getElementById('table_layer_s1').onclick = display_table_target_layer;
  // const downgrade_target = document.getElementById('downgrade_target');
  document.getElementById('downgrade_target').onclick = () => {
    ask_downgrade_target_layer(Object.keys(data_manager.user_data)[0]).then(() => {
      downgradeTargetLayer();
    }, () => null);
  };
}

function ask_downgrade_target_layer(name_layer) {
  return swal({
      title: '',
      text: _tr('app_page.common.replace_target_downgrade', { name_layer }),
      allowOutsideClick: false,
      allowEscapeKey: true,
      type: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: _tr('app_page.common.yes'),
      cancelButtonText: _tr('app_page.common.no'),
    });
}


function ask_replace_target_layer(name_layer) {
  return swal({
      title: '',
      text: _tr('app_page.common.replace_target_promote', { name_layer }),
      allowOutsideClick: false,
      allowEscapeKey: true,
      type: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: _tr('app_page.common.yes'),
      cancelButtonText: _tr('app_page.common.no'),
    });
}

export function ask_join_now(layer_name, on_add = 'layer') {
  swal({
    title: '',
    text: _tr('app_page.join_box.before_join_ask'),
    allowOutsideClick: false,
    allowEscapeKey: true,
    type: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: _tr('app_page.common.yes'),
    cancelButtonText: _tr('app_page.common.no'),
  }).then(() => {
    createJoinBox(layer_name);
  }, () => {
    if (on_add === 'layer') make_box_type_fields(layer_name);
  });
}

const display_table_target_layer = () => {
  const layer_name = Object.keys(data_manager.user_data)[0];
  boxExplore2.create(layer_name);
};

export function updateLayer(layer_name) {
  const fields = Object.keys(data_manager.user_data[layer_name][0]);
  data_manager.current_layers[layer_name].n_features = data_manager.user_data[layer_name].length;
  data_manager.current_layers[layer_name].original_fields = new Set(fields);
  const lyr_id = _app.layer_to_id.get(layer_name);
  const k = Object.keys(_target_layer_file.objects)[0];
  const selection = map.select(`#${lyr_id}`)
    .selectAll('path')
    .data(topojson.feature(_target_layer_file, _target_layer_file.objects[k]).features, d => d.id);
  selection.exit().remove();
  scale_to_lyr(layer_name);
  center_map(layer_name);
  zoom_without_redraw();
  update_section1(data_manager.current_layers[layer_name].type, fields.length, data_manager.current_layers[layer_name].n_features, layer_name);
}

export function handle_click_hand(behavior) {
  const hb = d3.select('#hand_button');
  // eslint-disable-next-line no-param-reassign
  const b = typeof behavior === 'object' ? (!hb.classed('locked') ? 'lock' : 'unlock') : (behavior && typeof behavior === 'string' ? behavior : false);
  if (b === 'lock') {
    hb.classed('locked', true);
    hb.html('<img src="static/img/Twemoji_1f512.png" width="18" height="18" alt="locked"/>');
    map.select('.brush').remove();
    document.getElementById('zoom_in').parentElement.style.display = 'none';
    document.getElementById('zoom_out').parentElement.style.display = 'none';
    document.getElementById('brush_zoom_button').parentElement.style.display = 'none';
    zoom.on('zoom', (() => { const blocked = svg_map.__zoom; return function () { this.__zoom = blocked; }; })());
  } else {
    hb.classed('locked', false);
    hb.html('<img src="static/img/Twemoji_1f513.png" width="18" height="18" alt="unlocked"/>');
    zoom.on('zoom', zoom_without_redraw);
    document.getElementById('zoom_in').parentElement.style.display = '';
    document.getElementById('zoom_out').parentElement.style.display = '';
    document.getElementById('brush_zoom_button').parentElement.style.display = '';
    map.select('.brush').remove();
  }
}

/**
*  Get the bounding box (in map/svg coordinates) of a layer using path.bounds()
*
*  @param {string} name - The name of layer
*  @return {Array} The bbox [[xmin, ymin], [xmax, ymax]] of the layer.
*/
function get_bbox_layer_path(name) {
  const selec = svg_map.querySelector('#' + _app.layer_to_id.get(name)).childNodes;
  let bbox_layer_path = [[Infinity, Infinity], [-Infinity, -Infinity]];
  for (let i = 0, len_i = selec.length; i < len_i; i++) {
    const bbox_path = path.bounds(selec[i].__data__);
    bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
    bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
    bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
    bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
  }
  if (_app.current_proj_name === 'ConicConformal') {
    const s1 = Mmax((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    const bbox_layer_path2 = path.bounds({ type: 'MultiPoint', coordinates: [ [ -69.3, -55.1 ], [ 20.9, -36.7 ], [ 147.2, -42.2 ], [ 162.1, 67.0 ], [ -160.2, 65.7 ] ] });
    const s2 = Mmax((bbox_layer_path2[1][0] - bbox_layer_path2[0][0]) / w, (bbox_layer_path2[1][1] - bbox_layer_path2[0][1]) / h);
    if (s2 < s1) bbox_layer_path = bbox_layer_path2;
  } else if (_app.current_proj_name === 'Armadillo') {
    const s1 = Mmax((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    const bbox_layer_path2 = path.bounds({ type: 'MultiPoint', coordinates: [ [ -69.3, -35.0 ], [ -170, 10 ], [ -170, 85 ], [ 0, -70 ], [ 20.9, -35.0 ], [ 147.2, -35.0 ], [ 170, 85 ], [ 170, 10 ] ] });
    const s2 = Mmax((bbox_layer_path2[1][0] - bbox_layer_path2[0][0]) / w, (bbox_layer_path2[1][1] - bbox_layer_path2[0][1]) / h);
    if (s2 < s1) bbox_layer_path = bbox_layer_path2;
  }
  return bbox_layer_path;
}

/**
* Change the projection scale and translate properties in order to fit the layer.
* Redraw the path from all the current layers to reflect the change.
*
* @param {string} name - The name of layer to scale on
* @return {void}
*/
export function scale_to_lyr(name) {
  const bbox_layer_path = get_bbox_layer_path(name);
  if (!bbox_layer_path) return;
  s = 0.95 / Mmax(
    (bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w,
    (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h) * proj.scale();
  t = [0, 0];
  proj.scale(s).translate(t);
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
}

/**
* Center and zoom to a layer (using zoom scale and translate properties).
* Projection properties stay unchanged.
*
* @param {string} name - The name of layer to zoom on
* @return {void}
*/
export function center_map(name) {
  const bbox_layer_path = get_bbox_layer_path(name);
  const zoom_scale = 0.95 / Mmax(
    (bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w,
    (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
  const zoom_translate = [
    (w - zoom_scale * (bbox_layer_path[1][0] + bbox_layer_path[0][0])) / 2,
    (h - zoom_scale * (bbox_layer_path[1][1] + bbox_layer_path[0][1])) / 2,
  ];
  const _zoom = svg_map.__zoom;
  _zoom.k = zoom_scale;
  _zoom.x = zoom_translate[0];
  _zoom.y = zoom_translate[1];
}

export function fitLayer(layer_name) {
  proj.scale(1).translate([0, 0]);
  const b = get_bbox_layer_path(layer_name);
  const s = 0.95 / Mmax((b[1][0] - b[0][0]) / w, (b[1][1] - b[0][1]) / h);
  const t = [(w - s * (b[1][0] + b[0][0])) / 2, (h - s * (b[1][1] + b[0][1])) / 2];
  proj.scale(s).translate(t);
  return [s, t];
}

/**
* Helper function called when a new 'Sphere' layer is added, in order to put it
* on the bottom of the other layer on the map.
*
* @param {string} sphere_id - The DOM id of the sphere.
* @return {void}
*/
export function setSphereBottom(sphere_id) {
  const layers_list = document.querySelector('.layer_list');
  layers_list.appendChild(layers_list.childNodes[0]);
  svg_map.insertBefore(svg_map.querySelector(`#${sphere_id}.layer`), svg_map.childNodes[0]);
  svg_map.insertBefore(defs.node(), svg_map.childNodes[0]);
}

/**
* Helper function to add the 'world' layer (notably added) when the application
* is started.
*
* @return {void}
*/
export function add_simplified_land_layer(options = {}) {
  const skip_rescale = options.skip_rescale || false;
  const stroke = options.stroke || 'rgb(0,0,0)';
  const fill = options.fill || '#d3d3d3';
  const stroke_opacity = options.stroke_opacity || 0.0;
  const fill_opacity = options.fill_opacity || 0.75;
  const stroke_width = options.stroke_width || '0.3px';
  const visible = !(options.visible === false);
  const drop_shadow = options.drop_shadow || false;

  const world_id = encodeId('World');
  _app.layer_to_id.set('World', world_id);
  _app.id_to_layer.set(world_id, 'World');
  data_manager.current_layers.World = {
    type: 'Polygon',
    n_features: 125,
    'stroke-width-const': +stroke_width.slice(0, -2),
    fill_color: { single: fill },
    default_layer: true,
  };
  map.insert('g', '.legend')
    .attrs({ id: world_id, class: 'layer', 'clip-path': 'url(#clip)' })
    .style('stroke-width', stroke_width)
    .selectAll('.subunit')
    .data(topojson.feature(world_topology, world_topology.objects.World).features)
    .enter()
    .append('path')
    .attr('d', path)
    .styles({
      stroke: stroke,
      fill: fill,
      'stroke-opacity': stroke_opacity,
      'fill-opacity': fill_opacity,
    });
  create_li_layer_elem('World', null, 'Polygon', 'sample');
  if (drop_shadow) {
    createDropShadow('World');
  }
  if (!skip_rescale) {
    scale_to_lyr('World');
    center_map('World');
  }
  if (!visible) {
    handle_active_layer('World');
  }
  zoom_without_redraw();
}

function send_remove_server(layer_name) {
  const formToSend = new FormData();
  formToSend.append('layer_name', data_manager.current_layers[layer_name].key_name);
  xhrequest('POST', 'layers/delete', formToSend, true)
    .then((data) => {
      const parsed = JSON.parse(data);
      if (!parsed.code || parsed.code !== 'Ok') console.log(data);
    }).catch((err) => {
      console.log(err);
    });
}

export function prepare_available_symbols() {
  return xhrequest('GET', 'static/json/list_symbols.json', null)
    .then((result) => {
      const list_res = JSON.parse(result);
      return Promise.all(list_res.map(name => getImgDataUrl(`static/img/svg_symbols/${name}`)))
        .then((symbols) => {
          for (let i = 0; i < list_res.length; i++) {
            _app.default_symbols.push([list_res[i], symbols[i]]);
          }
        });
    });
}

export function accordionize(css_selector = '.accordion', parent) {
  const _parent = parent && typeof parent === 'object' ? parent
          : parent && typeof parent === 'string' ? document.querySelector(parent)
          : document;
  const acc = _parent.querySelectorAll(css_selector);
  for (let i = 0; i < acc.length; i++) {
    acc[i].onclick = function () {
      const opened = _parent.querySelector(`${css_selector}.active`);
      if (opened) {
        opened.classList.toggle('active');
        opened.nextElementSibling.classList.toggle('show');
      }
      if (!opened || opened.id !== this.id) {
        this.classList.toggle('active');
        this.nextElementSibling.classList.toggle('show');
      }
    };
  }
}

function downgradeTargetLayer() {
  const old_target = Object.keys(data_manager.user_data)[0];
  if (!old_target) return;
  delete data_manager.current_layers[old_target].targeted;
  data_manager.field_join_map = [];
  data_manager.user_data = {};
  _app.targeted_layer_added = false;
  _target_layer_file = null;
  resetSection1();
  getAvailablesFunctionnalities();
  const id_lyr = _app.layer_to_id.get(old_target);
  document.querySelector(`.${id_lyr}.sortable_target`).classList.remove('sortable_target');
  return old_target;
}

function changeTargetLayer(new_target) {
  function _reproj(d_proj) {
    if (d_proj[0] === 'proj4') {
      let proj_str = d_proj[1];
      let custom_name;
      if (proj_str.startsWith('EPSG:')) {
        const code = +proj_str.split('EPSG:')[1];
        const rv = _app.epsg_projections[code];
        proj_str = rv.proj4;
        custom_name = rv.name;
      }
      _app.current_proj_name = 'def_proj4';
      _app.last_projection = proj_str;
      change_projection_4(proj4(proj_str));
      addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
    } else if (d_proj[0] === 'd3') {
      _app.current_proj_name = d_proj[1];
      change_projection(d_proj[1]);
      addLastProjectionSelect(_app.current_proj_name);
    }
  }
  downgradeTargetLayer();
  // const old_target = downgradeTargetLayer();
  data_manager.current_layers[new_target].targeted = true;
  _app.targeted_layer_added = true;
  data_manager.user_data[new_target] = Array.from(document.querySelector(`#${_app.layer_to_id.get(new_target)}`).querySelectorAll('path')).map(d => d.__data__.properties);
  const fields = Object.keys(data_manager.user_data[new_target][0]);
  update_section1(data_manager.current_layers[new_target].type, fields.length, data_manager.current_layers[new_target].n_features, new_target);
  if (!data_manager.current_layers[new_target].fields_type) {
    data_manager.current_layers[new_target].original_fields = new Set(fields);
  }
  if (!data_manager.current_layers[new_target].fields_type) {
      data_manager.current_layers[new_target].fields_type =  type_col2(data_manager.user_data[new_target]);
  }
  document.getElementById('btn_type_fields').removeAttribute('disabled');
  getAvailablesFunctionnalities(new_target);
  scale_to_lyr(new_target);
  center_map(new_target);
  zoom_without_redraw();

  // Reproject the map to the default projection if any:
  if (data_manager.current_layers[new_target].default_projection) {
    const d_proj = data_manager.current_layers[new_target].default_projection;
    _reproj(d_proj);
  } else if (data_manager.current_layers[new_target].last_projection) {
    const d_proj = data_manager.current_layers[new_target].last_projection;
    _reproj(d_proj);
  }

  const id_new_target_lyr = _app.layer_to_id.get(new_target);
  document.querySelector(`#sortable > .${id_new_target_lyr}`).classList.add('sortable_target');

  const d = {};
  d[new_target] = {
    type: 'FeatureCollection',
    features: Array.prototype.slice.call(document.querySelectorAll(`#${id_new_target_lyr} > path`)).map(d => d.__data__),
  };
  window._target_layer_file = topojson.topology(d);

  if (!data_manager.current_layers[new_target].key_name) {
    send_layer_server(new_target, '/layers/add');
  }

  // Replace the proposed variables in the options of the current representation
  // if any:
  if (_app.current_functionnality !== undefined) {
    fields_handler.unfill();
    fields_handler.fill(new_target);
  }
}

function resetSection1() {
  // Remove infos and buttons about the target layer:
  d3.select('#target_layer_zone')
    .attrs({
      class: 'i18n',
      'data-i18n': '[html]app_page.section1.no_target',
    })
    .styles({
      border: '3px dashed #ccc',
      color: '#ccc',
      'margin-bottom': '3px',
      padding: '3px',
      'text-align': 'center',
    })
    .html(_tr('app_page.section1.no_target'));

  // Restore the state of the bottom of the section 1 :
  document.getElementById('join_section').innerHTML = '';

  // Disabled the button allowing the user to choose type for its layer :
  document.getElementById('btn_type_fields').setAttribute('disabled', 'true');

  // Set all the representation modes to "unavailable":
  getAvailablesFunctionnalities();

  // Reset some values stored in the functionnality panel:
  reset_user_values();
}

// Function to be called after clicking on "render" in order to close the section 2
// and to have the section 3 opened
export function switch_accordion_section(id_elem) {
  document.getElementById(id_elem || 'btn_s3').dispatchEvent(new MouseEvent('click'));
}


// Function to handle the title add and changes
export function handle_title(txt) {
  const title = d3.select('#map_title').select('text');
  if (title.node()) {
    title.text(txt);
  } else {
    map.append('g')
      .attrs({ class: 'legend title', id: 'map_title' })
      .style('cursor', 'pointer')
      .insert('text')
      .attrs({ x: w / 2, y: h / 12, 'alignment-baseline': 'middle', 'text-anchor': 'middle' })
      .styles({ 'font-family': 'verdana', 'font-size': '20px', position: 'absolute', color: 'black' })
      .text(txt)
      .on('contextmenu dblclick', () => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        handle_title_properties();
      })
      .call(drag_elem_geo);
  }
}

export function handle_title_properties() {
  const title = d3.select('#map_title').select('text');
  if (!title.node() || title.text() === '') {
    swal({
      title: '',
      text: _tr('app_page.common.error_no_title'),
      type: 'error',
      allowOutsideClick: true,
      allowEscapeKey: true,
    }).then(() => null, () => null);
    return;
  }
  const title_props = {
    size: title.style('font-size'),
    font_weight: title.style('font-weight'),
    font_style: title.style('font-style'),
    text_decoration: title.style('text-decoration'),
    color: title.style('fill'),
    position_x: title.attr('x'),
    position_x_pct: round_value(+title.attr('x') / w * 100, 1),
    position_y: title.attr('y'),
    position_y_pct: round_value(+title.attr('y') / h * 100, 1),
    font_family: title.style('font-family'),
    stroke: title.style('stroke'),
    stroke_width: title.style('stroke-width'),
  };
  title_props.font_weight = (title_props.font_weight === '400' || title_props.font_weight === '') ? '' : 'bold';
  // Font name don't seems to be formatted in the same way on Firefox and Chrome
  // (a space is inserted after the comma in Chrome so we are removing it)
  title_props.font_family = title_props.font_family ? title_props.font_family.replace(', ', ',') : title_props.font_family;

  // Properties on the title are changed in real-time by the user
  // then it will be rollbacked to original properties if Cancel is clicked
  make_confirm_dialog2('mapTitleitleDialogBox', _tr('app_page.title_box.title'), { widthFitContent: true })
    .then((confirmed) => {
      if (!confirmed) {
        title.attrs({ x: title_props.position_x, y: title_props.position_y })
          .styles({
            fill: title_props.color,
            stroke: title_props.stroke,
            'stroke-width': title_props.stroke_width,
            'font-family': title_props.font_family,
            'font-size': title_props.size,
            'font-style': title_props.font_style,
            'font-weight': title_props.font_weight,
            'text-decoration': title_props.text_decoration,
          });
      }
    });
  const box_content = d3.select('.mapTitleitleDialogBox').select('.modal-body').append('div').style('margin', '15x');
  box_content.append('p')
    .html(_tr('app_page.title_box.font_size'))
    .insert('input')
    .attrs({ type: 'number', min: 2, max: 40, step: 1 })
    .property('value', +title_props.size.split('px')[0])
    .style('width', '65px')
    .on('change', function () { title.style('font-size', `${this.value}px`); });
  box_content.append('p')
    .html(_tr('app_page.title_box.xpos'))
    .insert('input')
    .attrs({ type: 'number', min: 0, max: 100, step: 1 })
    .property('value', title_props.position_x_pct)
    .style('width', '65px')
    .on('change', function () { title.attr('x', w * +this.value / 100); });
  box_content.append('p')
    .html(_tr('app_page.title_box.ypos'))
    .insert('input')
    .attrs({ type: 'number', min: 0, max: 100, step: 1  })
    .property('value', title_props.position_y_pct)
    .style('width', '65px')
    .on('change', function () { title.attr('y', h * +this.value / 100); });
  box_content.append('p').html(_tr('app_page.title_box.font_color'))
    .insert('input')
    .attr('type', 'color')
    .property('value', rgb2hex(title_props.color))
    .on('change', function () { title.style('fill', this.value); });

  const font_select = box_content.append('p')
    .html(_tr('app_page.title_box.font_family'))
    .insert('select').attr('class', 'params')
    .on('change', function () { title.style('font-family', this.value); });
  available_fonts.forEach((font) => {
    font_select.append('option').text(font[0]).attr('value', font[1]);
  });
  font_select.node().selectedIndex = available_fonts.map(d => (d[1] === title_props.font_family ? '1' : '0')).indexOf('1');

  const options_format = box_content.append('p'),
    btn_bold = options_format.insert('span').attr('class', title_props.font_weight === 'bold' ? 'active button_disc' : 'button_disc').html('<img title="Bold" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAInhI+pa+H9mJy0LhdgtrxzDG5WGFVk6aXqyk6Y9kXvKKNuLbb6zgMFADs=">'),
    btn_italic = options_format.insert('span').attr('class', title_props.font_style === 'italic' ? 'active button_disc' : 'button_disc').html('<img title="Italic" src="data:image/gif;base64,R0lGODlhFgAWAKEDAAAAAF9vj5WIbf///yH5BAEAAAMALAAAAAAWABYAAAIjnI+py+0Po5x0gXvruEKHrF2BB1YiCWgbMFIYpsbyTNd2UwAAOw==">'),
    btn_underline = options_format.insert('span').attr('class', title_props.text_decoration === 'underline' ? 'active button_disc' : 'button_disc').html('<img title="Underline" src="data:image/gif;base64,R0lGODlhFgAWAKECAAAAAF9vj////////yH5BAEAAAIALAAAAAAWABYAAAIrlI+py+0Po5zUgAsEzvEeL4Ea15EiJJ5PSqJmuwKBEKgxVuXWtun+DwxCCgA7">');

  btn_bold.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('font-weight', '');
    } else {
      this.classList.add('active');
      title.style('font-weight', 'bold');
    }
  });
  btn_italic.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('font-style', '');
    } else {
      this.classList.add('active');
      title.style('font-style', 'italic');
    }
  });
  btn_underline.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('text-decoration', '');
    } else {
      this.classList.add('active');
      title.style('text-decoration', 'underline');
    }
  });

  const hasBuffer = title_props.stroke !== 'none';
  const buffer_section1 = box_content.append('p');
  const buffer_section2 = box_content.append('p').style('display', hasBuffer ? '' : 'none');
  box_content.append('p').style('clear', 'both');

  buffer_section1.append('input')
    .attrs({ type: 'checkbox', id: 'title_buffer_chkbox', checked: hasBuffer ? true : null })
    .on('change', function () {
      if (this.checked) {
        buffer_section2.style('display', '');
        title.style('stroke', buffer_color.node().value)
          .style('stroke-width', `${buffer_width.node().value}px`);
      } else {
        buffer_section2.style('display', 'none');
        title.style('stroke', 'none')
          .style('stroke-width', '1px');
      }
    });

  buffer_section1.append('label')
    .attrs({ for: 'title_buffer_chkbox' })
    .text(_tr('app_page.title_box.buffer'));

  let buffer_color = buffer_section2.insert('input')
    .style('float', 'left')
    .attrs({ type: 'color' })
    .property('value', hasBuffer ? rgb2hex(title_props.stroke) : '#ffffff')
    .on('change', function () {
      title.style('stroke', this.value);
    });

  buffer_section2.insert('span')
    .style('float', 'right')
    .html(' px');

  let buffer_width = buffer_section2.insert('input')
    .styles({ float: 'right', width: '60px' })
    .attrs({ type: 'number', step: '0.1' })
    .property('value', hasBuffer ? +title_props.stroke_width.replace('px', '') : 1)
    .on('change', function () {
      title.style('stroke-width', `${this.value}px`);
    });
}

// Function to display information on the top layer (in the layer manager)
export function displayInfoOnMove() {
  const info_features = d3.select('#info_features');
  if (info_features.classed('active')) {
    map.selectAll('.layer').selectAll('path').on('mouseover', null);
    map.selectAll('.layer').selectAll('circle').on('mouseover', null);
    map.selectAll('.layer').selectAll('rect').on('mouseover', null);
    info_features.classed('active', false);
    info_features.style('display', 'none').html('');
    d3.select('#info_button').classed('active', false);
    svg_map.style.cursor = '';
  } else {
    map.select('.brush').remove();
    d3.select('#brush_zoom_button').classed('active', false);
    const layers = svg_map.querySelectorAll('.layer'),
      nb_layer = layers.length;
    let top_visible_layer = null;

    for (let i = nb_layer - 1; i > -1; i--) {
      if (layers[i].style.visibility !== 'hidden') {
        top_visible_layer = global._app.id_to_layer.get(layers[i].id);
        break;
      }
    }

    if (!top_visible_layer) {
      swal('', _tr('app_page.common.error_no_visible'), 'error');
      return;
    }

    const id_top_layer = `#${global._app.layer_to_id.get(top_visible_layer)}`;
    const symbol = data_manager.current_layers[top_visible_layer].symbol || 'path';

    map.select(id_top_layer).selectAll(symbol).on('mouseover', (d, i) => {
      const txt_info = [
        '<h3>', top_visible_layer, '</h3><i>Feature ',
        i + 1, '/', data_manager.current_layers[top_visible_layer].n_features, '</i><p>'];
      const properties = data_manager.result_data[top_visible_layer] ? data_manager.result_data[top_visible_layer][i] : d.properties;
      Object.getOwnPropertyNames(properties).forEach((el) => {
        txt_info.push(`<br><b>${el}</b> : ${properties[el]}`);
      });
      txt_info.push('</p>');
      info_features.style('display', null).html(txt_info.join(''));
    });

    map.select(id_top_layer).selectAll(symbol).on('mouseout', () => {
      info_features.style('display', 'none').html('');
    });

    info_features.classed('active', true);
    svg_map.style.cursor = 'help';
    d3.select('#info_button').classed('active', true);
  }
}

// Function to switch the visibility of a layer the open/closed eye button
export function handle_active_layer(name) {
  let fill_value,
    parent_div,
    selec,
    at_end;

  if (document.getElementById('info_features').className === 'active') {
    displayInfoOnMove();
    at_end = true;
  }
  if (!name) {
    selec = this;
    parent_div = selec.parentElement;
    name = parent_div.parentElement.getAttribute('layer_name'); // eslint-disable-line no-param-reassign
  } else {
    selec = document.querySelector(`#sortable .${global._app.layer_to_id.get(name)} .active_button`);
    parent_div = selec.parentElement;
  }
  const func = () => { handle_active_layer(name); };
  if (selec.id === 'eye_closed') {
    fill_value = 1;
    const eye_open = make_eye_button('open');
    eye_open.onclick = func;
    parent_div.replaceChild(eye_open, selec);
  } else {
    fill_value = 0;
    const eye_closed = make_eye_button('closed');
    eye_closed.onclick = func;
    parent_div.replaceChild(eye_closed, selec);
  }
  map.select(`#${global._app.layer_to_id.get(name)}`)
    .style('visibility', fill_value === 0 ? 'hidden' : 'initial');
  map.selectAll(`.lgdf_${global._app.layer_to_id.get(name)}`)
    .style('visibility', fill_value === 0 ? 'hidden' : 'initial');

  if (at_end) {
    displayInfoOnMove();
  }
}

function make_eye_button(state) {
  if (state === 'open') {
    const eye_open = document.createElement('img');
    eye_open.setAttribute('src', 'static/img/b/eye_open.png');
    eye_open.setAttribute('class', 'active_button i18n');
    eye_open.setAttribute('id', 'eye_open');
    eye_open.setAttribute('width', 17);
    eye_open.setAttribute('height', 17);
    eye_open.setAttribute('alt', 'Visible');
    return eye_open;
  } else if (state === 'closed') {
    const eye_closed = document.createElement('img');
    eye_closed.setAttribute('src', 'static/img/b/eye_closed.png');
    eye_closed.setAttribute('class', 'active_button i18n');
    eye_closed.setAttribute('id', 'eye_closed');
    eye_closed.setAttribute('width', 17);
    eye_closed.setAttribute('height', 17);
    eye_closed.setAttribute('alt', 'Not visible');
    return eye_closed;
  }
}


// Wrapper to obtain confirmation before actually removing a layer :
function remove_layer(name) {
  // eslint-disable-next-line no-param-reassign
  name = name || this.parentElement.parentElement.getAttribute('layer_name');
  swal({
    title: '',
    text: _tr('app_page.common.remove_layer', { layer: name }),
    type: 'warning',
    customClass: 'swal2_custom',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.delete')}!`,
    cancelButtonText: _tr('app_page.common.cancel'),
  }).then(() => { remove_layer_cleanup(name); },
          () => null);
  // ^^^^^^^^^^^^ Do nothing on cancel, but this avoid having an "uncaught exeption (cancel)" comming in the console if nothing is set here
              //  ^^^^^^^^^^^^^^^^^^^^^^^ Not sure anymore :/
}

function remove_ext_dataset() {
  swal({
    title: '',
    text: _tr('app_page.common.remove_tabular'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.delete')}!`,
    cancelButtonText: _tr('app_page.common.cancel'),
  }).then(() => {
    remove_ext_dataset_cleanup();
  }, () => null);
}

function remove_ext_dataset_cleanup() {
  data_manager.field_join_map = [];
  data_manager.joined_dataset = [];
  data_manager.dataset_name = undefined;
  d3.select('#ext_dataset_zone')
    .attr('data-i18n', '[html]app_page.section1.no_ext_dataset')
    .styles({
      border: '3px dashed #ccc',
      color: 'rgb(204, 204, 204)',
      padding: '3px',
      'text-align': 'center',
    })
    .html(_tr('app_page.section1.no_ext_dataset'));
  document.getElementById('join_section').innerHTML = '';
}

// Do some clean-up when a layer is removed
// Most of the job is to do when it's the targeted layer which is removed in
// order to restore functionnalities to their initial states
export function remove_layer_cleanup(name) {
  if (!data_manager.current_layers[name]) return;
  const layer_id = global._app.layer_to_id.get(name);
  // Making some clean-up regarding the result layer :
  if (data_manager.current_layers[name].is_result
      || data_manager.current_layers[name].layout_legend_displayed) {
    map.selectAll(['.lgdf_', layer_id].join('')).remove();
  }
  // Making some clean-up regarding the result layer :
  if (data_manager.result_data.hasOwnProperty(name)) {
    delete data_manager.result_data[name];
  }
  if (data_manager.current_layers[name].hasOwnProperty('key_name')
       && data_manager.current_layers[name].renderer
       && data_manager.current_layers[name].renderer.indexOf('Choropleth') < 0
       && data_manager.current_layers[name].renderer.indexOf('Categorical') < 0) {
    send_remove_server(name);
  }
  // Is the layer using a filter ? If yes, remove it:
  const filter_id = map.select(`#${layer_id}`).attr('filter');
  if (filter_id) {
    svg_map.querySelector(filter_id.substr(4).replace(')', '')).remove();
  }

  // Remove the layer from the map and from the layer manager :
  map.select(`#${layer_id}`).remove();
  document.querySelector(`#sortable .${layer_id}`).remove();

  // Remove the layer from the "geo export" menu :
  const a = document.getElementById('layer_to_export').querySelector(`option[value="${name}"]`);
  if (a) a.remove();

  // Remove the layer from the "mask" section if the "smoothed map" menu is open :
  if (global._app.current_functionnality && (
      global._app.current_functionnality.name === 'smooth' || global._app.current_functionnality.name === 'grid')) {
    Array.prototype.slice.call(document.querySelectorAll('.mask_field'))
      .forEach((elem) => {
        const aa = elem.querySelector(`option[value="${name}"]`);
        if (aa) aa.remove();
      });
  }

  // Reset the panel displaying info on the targeted layer if she"s the one to be removed :
  if (data_manager.current_layers[name].targeted) {
    // Unfiling the fields related to the targeted functionnality:
    if (global._app.current_functionnality) {
      clean_menu_function();
    }

    // Update some global variables :
    data_manager.field_join_map = [];
    data_manager.user_data = {};
    global._app.targeted_layer_added = false;

    // Updating the top of the menu (section 1) :
    resetSection1();

    // Reset the projection (if the projection was defined via proj4):
    if (_app.current_proj_name === 'def_proj4') {
      _app.current_proj_name = 'NaturalEarth2';
      change_projection(_app.current_proj_name);
      addLastProjectionSelect(_app.current_proj_name);
    }
  }

  // There is probably better ways in JS to delete the object,
  // but in order to make it explicit that we are removing it :
  delete data_manager.current_layers[name];

  // Lastly remove it from the mapping 'layer name' <-> DOM id :
  if (name !== 'Graticule') {
    global._app.layer_to_id.delete(name);
    global._app.id_to_layer.delete(layer_id);
  }
}


// To bind the set of small buttons
// (trash icon, paint icon, active/deactive visibility, info tooltip, etc..)
// which are on each feature representing a layer in the layer manager
// (the function is called each time that a new feature is put in this layer manager)
export function binds_layers_buttons(layer_name) {
  const layer_id = global._app.layer_to_id.get(layer_name);
  const sortable_elem = d3.select('#sortable').select(`.${layer_id}`);
  sortable_elem.on('dblclick', () => { handle_click_layer(layer_name); });
  sortable_elem.on('contextmenu', () => { d3.event.preventDefault(); });
  sortable_elem.select('#trash_button').on('click', () => { remove_layer(layer_name); });
  sortable_elem.select('.active_button').on('click', () => { handle_active_layer(layer_name); });
  sortable_elem.select('.style_button').on('click', () => { handle_click_layer(layer_name); });
  sortable_elem.select('.style_target_layer').on('click', () => { handle_click_layer(layer_name); });
  sortable_elem.select('#legend_button').on('click', () => { handle_legend(layer_name); });
  sortable_elem.select('#browse_data_button').on('click', () => { boxExplore2.create(layer_name); });
  sortable_elem.select('#replace_button')
    .on('click', () => {
      ask_replace_target_layer(layer_name)
        .then(() => {
          changeTargetLayer(layer_name);
        }, () => null);
    });
  sortable_elem.select('#zoom_fit_button').on('click', () => {
    center_map(layer_name);
    zoom_without_redraw();
  });
  // TODO : re-add a tooltip when the mouse is over that sortable element ?
}
