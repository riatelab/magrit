import proj4 from 'proj4';
import * as topojson from 'topojson';
import { ColorsSelected } from './colors_helpers';
import { check_remove_existing_box, make_confirm_dialog2 } from './dialogs';
import { check_layer_name } from './function';
import {
  create_li_layer_elem, display_error_during_computation,
  isValidJSON, make_box_type_fields, request_data, setSelected, xhrequest,
} from './helpers';
import { valid_join_check_display } from './join_popup';
import { zoom_without_redraw } from './map_ctrl';
import {
  addLastProjectionSelect, change_projection, change_projection_4,
  handleClipPath, tryFindNameProj } from './projections';

import {
  ask_join_now, askTypeLayer, binds_layers_buttons,
  center_map, handle_click_hand,
  remove_layer_cleanup, scale_to_lyr,
  update_section1, update_section1_layout,
} from './interface';

/**
* Function to display the dialog allowing the choose and add a sample target layer.
*
* @return {void}
*/
export function add_sample_layer() {
  const prepare_extra_dataset_availables = () => {
    request_data('GET', 'extrabasemaps').then((result) => {
      _app.list_extrabasemaps = JSON.parse(result.target.responseText).filter(elem => elem[0] !== 'Tunisia');
    });
  };
  check_remove_existing_box('.sampleDialogBox');
  if (!_app.list_extrabasemaps) {
    prepare_extra_dataset_availables();
  }
  const fields_type_sample = new Map([
    ['quartier_paris', [
      { name: 'n_sq_qu', type: 'id' },
      { name: 'c_qu', type: 'id' },
      { name: 'c_quinsee', type: 'id' },
      { name: 'l_qu', type: 'id' },
      { name: 'c_ar', type: 'category', has_duplicate: true },
      { name: 'n_sq_ar', type: 'category', has_duplicate: true },
      { name: 'surface', type: 'stock' },
      { name: 'P12_POP', type: 'stock' },
      { name: 'P07_POP', type: 'stock' }]],
    ['GrandParisMunicipalities', [
      { name: 'DEPARTEMENT', type: 'category', has_duplicate: true },
      { name: 'IDCOM', type: 'id' },
      { name: 'EPT', type: 'category', has_duplicate: true },
      { name: 'REVENUS', type: 'stock' },
      { name: 'LIBCOM', type: 'id' },
      { name: 'LIBEPT', type: 'category', has_duplicate: true },
      { name: 'MENAGES_FISCAUX', type: 'stock' },
      { name: 'UID', type: 'id' },
      { name: 'REVENUS_PAR_MENAGE', type: 'ratio' }]],
    ['martinique', [
      { name: 'INSEE_COM', type: 'id' },
      { name: 'NOM_COM', type: 'id', not_number: true },
      { name: 'STATUT', type: 'category', has_duplicate: true },
      { name: 'SUPERFICIE', type: 'stock' },
      { name: 'P13_POP', type: 'stock' },
      { name: 'P13_LOG', type: 'stock' },
      { name: 'P13_LOGVAC', type: 'stock' },
      { name: 'Part_Logements_Vacants', type: 'ratio' }]],
    ['nuts2-2013-data', [
      { name: 'id', type: 'id', not_number: true },
      { name: 'name', type: 'id', not_number: true },
      { name: 'POP', type: 'stock' },
      { name: 'GDP', type: 'stock' },
      { name: 'UNEMP', type: 'ratio' },
      { name: 'COUNTRY', type: 'category', has_duplicate: true }]],
    ['voronoi_communes_2016_2-2', [
      { name: 'INSEE_COM', type: 'id' }]],
    ['regions_2016_2-2', [
      { name: 'CODE_REG', type: 'id' }]],
    ['departements_2016_2-2', [
      { name: 'CODE_DEPT', type: 'id' },
      { name: 'CODE_REG', type: 'category', has_duplicate: true }]],
    ['brazil', [
      { name: 'ADMIN_NAME', type: 'id', not_number: true },
      { name: 'Abbreviation', type: 'id', not_number: true },
      { name: 'Capital', type: 'id', not_number: true },
      { name: 'GDP_per_capita_2012', type: 'stock' },
      { name: 'Life_expectancy_2014', type: 'ratio' },
      { name: 'Pop2014', type: 'stock' },
      { name: 'REGIONS', type: 'category', has_duplicate: true },
      { name: 'STATE2010', type: 'id' },
      { name: 'popdensity2014', type: 'ratio' }]],
    ['FR_communes', [
      { name: 'INSEE_COM', type: 'id' },
      { name: 'NOM_COM', type: 'id' },
      { name: 'SUPERFICIE', type: 'stock' },
      { name: 'POPULATION', type: 'stock' },
      { name: 'CODE_DEPT', type: 'category', has_duplicate: true },
      { name: 'NOM_DEPT', type: 'category', has_duplicate: true },
      { name: 'CODE_REG', type: 'category', has_duplicate: true },
      { name: 'NOM_REG', type: 'category', has_duplicate: true }]],
    ['world_countries_data', [
      { name: 'ISO2', type: 'id', not_number: true },
      { name: 'ISO3', type: 'id', not_number: true },
      { name: 'ISONUM', type: 'id' },
      { name: 'NAMEen', type: 'id', not_number: true },
      { name: 'NAMEfr', type: 'id', not_number: true },
      { name: 'UNRegion', type: 'category', has_duplicate: true },
      { name: 'GrowthRate', type: 'ratio' },
      { name: 'PopDensity', type: 'ratio' },
      { name: 'PopTotal', type: 'stock' },
      { name: 'JamesBond', type: 'stock' }]],
  ]);

  const suggested_projection = new Map([
    ['quartier_paris', ['proj4', 'EPSG:2154']],
    ['GrandParisMunicipalities', ['proj4', 'EPSG:2154']],
    ['martinique', ['proj4', 'EPSG:2973']],
    ['nuts2-2013-data', ['proj4', 'EPSG:3035']],
    ['voronoi_communes_2016_2-2', ['proj4', 'EPSG:2154']],
    ['departements_2016_2-2', ['proj4', 'EPSG:2154']],
    ['brazil', ['proj4', 'EPSG:5527']],
    ['world_countries_data', ['d3', 'NaturalEarth2']],
    ['commune_dep_971', ['proj4', 'EPSG:32620']],
    ['commune_dep_972', ['proj4', 'EPSG:32620']],
    ['commune_dep_973', ['proj4', 'EPSG:2972']],
    ['commune_dep_974', ['proj4', 'EPSG:2975']],
    ['commune_dep_976', ['proj4', 'EPSG:7075']],
  ]);
  const target_layers = [
    [_tr('app_page.sample_layer_box.layer'), ''],
    [_tr('app_page.sample_layer_box.grandparismunicipalities'), 'GrandParisMunicipalities'],
    [_tr('app_page.sample_layer_box.quartier_paris'), 'quartier_paris'],
    [_tr('app_page.sample_layer_box.martinique'), 'martinique'],
    [_tr('app_page.sample_layer_box.departements_2016_2-2'), 'departements_2016_2-2'],
    [_tr('app_page.layout_layer_box.departements_vor_2016_2-2'), 'departements_vor_2016_2-2'],
    [_tr('app_page.sample_layer_box.regions_2016_2-2'), 'regions_2016_2-2'],
    [_tr('app_page.layout_layer_box.france_contour_2016_2-2'), 'france_contour_2016_2-2'],
    [_tr('app_page.sample_layer_box.nuts2_data'), 'nuts2-2013-data'],
    [_tr('app_page.sample_layer_box.brazil'), 'brazil'],
    [_tr('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
    [_tr('app_page.sample_layer_box.communes_reg_11'), 'communes_reg_11'],
    [_tr('app_page.sample_layer_box.communes_reg_24'), 'communes_reg_24'],
    [_tr('app_page.sample_layer_box.communes_reg_27'), 'communes_reg_27'],
    [_tr('app_page.sample_layer_box.communes_reg_28'), 'communes_reg_28'],
    [_tr('app_page.sample_layer_box.communes_reg_32'), 'communes_reg_32'],
    [_tr('app_page.sample_layer_box.communes_reg_44'), 'communes_reg_44'],
    [_tr('app_page.sample_layer_box.communes_reg_52'), 'communes_reg_52'],
    [_tr('app_page.sample_layer_box.communes_reg_53'), 'communes_reg_53'],
    [_tr('app_page.sample_layer_box.communes_reg_75'), 'communes_reg_75'],
    [_tr('app_page.sample_layer_box.communes_reg_76'), 'communes_reg_76'],
    [_tr('app_page.sample_layer_box.communes_reg_84'), 'communes_reg_84'],
    [_tr('app_page.sample_layer_box.communes_reg_93'), 'communes_reg_93'],
    [_tr('app_page.sample_layer_box.communes_reg_94'), 'communes_reg_94'],
    [_tr('app_page.sample_layer_box.commune_dep_971'), 'commune_dep_971'],
    [_tr('app_page.sample_layer_box.commune_dep_972'), 'commune_dep_972'],
    [_tr('app_page.sample_layer_box.commune_dep_973'), 'commune_dep_973'],
    [_tr('app_page.sample_layer_box.commune_dep_974'), 'commune_dep_974'],
    [_tr('app_page.sample_layer_box.commune_dep_976'), 'commune_dep_976'],
    [_tr('app_page.sample_layer_box.voronoi_communes_2016_2-2'), 'voronoi_communes_2016_2-2'],
    [_tr('app_page.layout_layer_box.nuts0'), 'nuts0'],
    [_tr('app_page.layout_layer_box.nuts1'), 'nuts1'],
    [_tr('app_page.layout_layer_box.nuts2'), 'nuts2'],
    [_tr('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
    [_tr('app_page.layout_layer_box.world_countries'), 'world_country'],
    [_tr('app_page.layout_layer_box.world_capitals'), 'world_cities'],
    [_tr('app_page.layout_layer_box.tissot'), 'tissot'],
  ];
  let selec,
    selec_url,
    content;

  make_confirm_dialog2('sampleDialogBox', _tr('app_page.sample_layer_box.title'))
    .then((confirmed) => {
      if (confirmed) {
        askTypeLayer()
          .then((_type_layer) => {
            const target_layer = _type_layer.indexOf('target') > -1;
            if (content.attr('id') === 'panel1') {
              if (selec) {
                const sugg_proj = selec.indexOf('communes_reg') > -1
                  ? ['proj4', 'EPSG:2154']
                  : suggested_projection.get(selec);
                const _fields_type = (selec.indexOf('communes_reg') > -1 || selec.indexOf('commune_dep') > 1)
                  ? fields_type_sample.get('FR_communes')
                  : fields_type_sample.get(selec);
                add_sample_geojson(selec, {
                  target_layer_on_add: target_layer,
                  fields_type: _fields_type,
                  default_projection: sugg_proj,
                });
              }
            } else if (content.attr('id') === 'panel2') {
              const formToSend = new FormData();
              formToSend.append('url', selec_url[1]);
              formToSend.append('layer_name', selec_url[0]);
              xhrequest('POST', '/convert_extrabasemap', formToSend, true)
                .then((data) => {
                  add_layer_topojson(data, { target_layer_on_add: target_layer });
                }, () => {
                  display_error_during_computation();
                });
            }
          }, dismiss => { console.log(dismiss); });
      }
    });

  function make_panel2() {
    box_body.selectAll('div').remove();
    content = box_body.append('div').attr('id', 'panel2');
    content.append('h3').html(_tr('app_page.sample_layer_box.subtitle1'));
    content.append('p')
      .append('span')
      .html(_tr('app_page.sample_layer_box.extra_basemaps_info'));
    const select_extrabasemap = content.append('p')
      .insert('select')
      .on('change', function () {
        const id_elem = this.value;
        selec_url = [
          _app.list_extrabasemaps[id_elem][0],
          _app.list_extrabasemaps[id_elem][1],
          id_elem,
        ];
      });
    for (let i = 0, len_i = _app.list_extrabasemaps.length; i < len_i; i++) {
      select_extrabasemap.append('option').attr('value', i).html(_app.list_extrabasemaps[i][0]);
    }
    content.append('p')
      .styles({ margin: 'auto', 'text-align': 'right', cursor: 'pointer' })
      .append('span')
      .html(_tr('app_page.sample_layer_box.back_sample'))
      .on('click', () => {
        make_panel1();
      });
    if (selec_url) {
      setSelected(select_extrabasemap.node(), selec_url[2]);
    } else {
      selec_url = [_app.list_extrabasemaps[0][0], _app.list_extrabasemaps[0][1], 0];
    }
    content.select('#link1').on('click', () => {
      window.open('http://www.naturalearthdata.com', 'Natural Earth', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
    });
    content.select('#link2').on('click', () => {
      window.open('https://github.com/riatelab/basemaps/tree/master/Countries', 'riatelab/basemaps', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
    });
  }

  function make_panel1() {
    box_body.selectAll('div').remove();
    content = box_body.append('div').attr('id', 'panel1');
    content.append('h3').html(_tr('app_page.sample_layer_box.subtitle1'));

    const t_layer_selec = content.append('p').html('')
      .insert('select').attr('class', 'sample_target');
    target_layers.forEach((layer_info) => {
      t_layer_selec.append('option').html(layer_info[0]).attr('value', layer_info[1]);
    });
    t_layer_selec.on('change', function () { selec = this.value; });
    content.append('p')
      .styles({ margin: 'auto', 'text-align': 'right', cursor: 'pointer' })
      .append('span')
      .html(_tr('app_page.sample_layer_box.more_basemaps'))
      .on('click', () => {
        make_panel2();
      });
    if (selec) {
      setSelected(t_layer_selec.node(), selec);
    }
  }

  const container = d3.select('.sampleDialogBox')
    .styles({ width: '625px', display: 'flex' });
  container.select('.modal-content').style('width', '625px');
  const box_body = container.select('.modal-body')
  setTimeout(() => { document.querySelector('select.sample_target').focus(); }, 500);
  make_panel1();
}


function add_sample_geojson(name, options) {
  const formToSend = new FormData();
  formToSend.append('layer_name', name);
  xhrequest('POST', 'sample', formToSend, true)
    .then((data) => {
      add_layer_topojson(data, options);
    })
    .catch((err) => {
      display_error_during_computation();
      console.log(err);
    });
}

/**
* Add a TopoJSON layer to the 'svg' element.
*
* @param {String} text - the text content to be parsed as a JS object.
* @param {Object} url - options regarding the layer to be added (such as wether
*   skipping the 'success' alert or not, which name to use for the layer, etc.).
* @return {String} The actual name of the layer once added, or `undefined` if
*     something went wrong.
*/
export function add_layer_topojson(text, options = {}) {
  const [valid, parsedJSON] = isValidJSON(text);
  // If JSON.parse failed:
  if (!valid){
    display_error_during_computation('Unable to load the layer');
    return;
  }
  // Server returns a JSON reponse like {"Error":"The error"}
  // if something went bad during the conversion:
  if (parsedJSON.Error) {
    display_error_during_computation(parsedJSON.Error);
    return;
  }

  const result_layer_on_add = options.result_layer_on_add ? true : false,
    target_layer_on_add = options.target_layer_on_add ? true : false,
    skip_alert = options.skip_alert ? true : false,
    skip_rescale = options.skip_rescale === true ? true : false,
    fields_type = options.fields_type ? options.fields_type : undefined;
  const topoObj = parsedJSON.file.transform ? parsedJSON.file : topojson.quantize(parsedJSON.file, 1e5);
  const layers_names = Object.getOwnPropertyNames(topoObj.objects);
  const random_color1 = ColorsSelected.random();
  const lyr_name = layers_names[0];
  const lyr_name_to_add = check_layer_name(options.choosed_name ? options.choosed_name : lyr_name);
  const lyr_id = encodeId(lyr_name_to_add);
  const nb_ft = topoObj.objects[lyr_name].geometries.length;
  const topoObj_objects = topoObj.objects[lyr_name];
  let data_to_load = false;
  let type,
    _proj;

  // We don't allow multiple layer to be added at the same time, so the TopoJSON
  // file we are handling is supposed to only contains one layer. If it's not
  // the case, a warning is displayed and only the first layer is added to the svg.
  if (layers_names.length > 1) {
    swal('', _tr('app_page.common.warning_multiple_layers'), 'warning');
  }

  // Abort if the layer is empty (doesn't contains any feature)
  if (!topoObj_objects.geometries || topoObj_objects.geometries.length === 0) {
    display_error_during_computation(_tr('app_page.common.error_invalid_empty'));
    return;
  }

  // "Register" the layer name in the UI and it's corresponding id on the DOM :
  _app.layer_to_id.set(lyr_name_to_add, lyr_id);
  _app.id_to_layer.set(lyr_id, lyr_name_to_add);

  for (let _t_ix = 0; _t_ix < nb_ft; _t_ix++) {
    if (topoObj_objects.geometries[_t_ix] && topoObj_objects.geometries[_t_ix].type) {
      if (topoObj_objects.geometries[_t_ix].type.indexOf('Point') > -1) type = 'Point';
      else if (topoObj_objects.geometries[_t_ix].type.indexOf('LineString') > -1) type = 'Line';
      else if (topoObj_objects.geometries[_t_ix].type.indexOf('Polygon') > -1) type = 'Polygon';
      break;
    }
  }

  // Abort if the layer doesn't contains any feature with a geometry type within
  // "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"
  if (!type) {
    display_error_during_computation(_tr('app_page.common.error_invalid_empty'));
    return;
  }

  // Some special operations if this is the first layer to be added:
  if (data_manager.current_layers.World && data_manager.current_layers.World.default_layer) {
    // Remove the 'world' layout layer displayed when the application starts:
    remove_layer_cleanup('World');
  }

  // Read the projection information provided with the layer, if any:
  if (parsedJSON.proj) {
    try {
      _proj = proj4(parsedJSON.proj);
    } catch (e) {
      _proj = undefined;
      console.log(e);
    }
  }

  data_manager.current_layers[lyr_name_to_add] = {
    type: type,
    n_features: nb_ft,
    'stroke-width-const': type === 'Line' ? 1.5 : 0.4,
    fill_color: { single: random_color1 },
    key_name: parsedJSON.key,
  };

  if (target_layer_on_add) {
    data_manager.current_layers[lyr_name_to_add].targeted = true;
    data_manager.user_data[lyr_name_to_add] = [];
    data_to_load = true;
    data_manager.current_layers[lyr_name_to_add].fields_type = [];
  } else if (result_layer_on_add) {
    data_manager.result_data[lyr_name_to_add] = [];
    data_manager.current_layers[lyr_name_to_add].is_result = true;
  }

  const field_names = topoObj_objects.geometries[0].properties
    ? Object.getOwnPropertyNames(topoObj_objects.geometries[0].properties) : [];
  const path_to_use = options.pointRadius ? path.pointRadius(options.pointRadius) : path;
  const nb_fields = field_names.length;
  topoObj_objects.geometries.forEach((d, ix) => {
    if (data_to_load && nb_fields > 0) {
      if (d.id !== undefined && d.id !== ix) {
        d.properties._uid = d.id; // eslint-disable-line no-param-reassign
        d.id = +ix; // eslint-disable-line no-param-reassign
      } else if (!d.id) {
        d.id = +ix; // eslint-disable-line no-param-reassign
      }
      data_manager.user_data[lyr_name_to_add].push(d.properties);
    } else if (data_to_load) {
      d.properties.id = d.id = ix; // eslint-disable-line no-param-reassign, no-multi-assign
      data_manager.user_data[lyr_name_to_add].push({ id: d.properties.id });
    } else if (result_layer_on_add) {
      data_manager.result_data[lyr_name_to_add].push(d.properties);
    }
  });

  const func_data_idx = (_, ix) => `feature_${ix}`;

  map.insert('g', '.legend')
    .attrs({ id: lyr_id, class: data_to_load ? 'targeted_layer layer' : 'layer' })
    .styles({ 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    .selectAll('.subunit')
    .data(topojson.feature(topoObj, topoObj_objects).features, d => d.id)
    .enter()
    .append('path')
    .attrs({ d: path_to_use, id: func_data_idx })
    .styles({
      stroke: type !== 'Line' ? 'rgb(0, 0, 0)' : random_color1,
      'stroke-opacity': 1,
      fill: type !== 'Line' ? random_color1 : null,
      'fill-opacity': type !== 'Line' ? 0.90 : 0,
    });
  d3.select('#layer_to_export').append('option').attr('value', lyr_name_to_add).text(lyr_name_to_add);
  update_section1_layout();
  if (target_layer_on_add) {
    data_manager.current_layers[lyr_name_to_add].original_fields = new Set(Object.getOwnPropertyNames(data_manager.user_data[lyr_name_to_add][0]));
    if (data_manager.joined_dataset.length !== 0) {
      valid_join_check_display(false);
    }
    update_section1(type, nb_fields, nb_ft, lyr_name_to_add);
    create_li_layer_elem(lyr_name_to_add, nb_ft, type, 'target');
    _app.targeted_layer_added = true;
    window._target_layer_file = topoObj;
    if (!skip_rescale) {
      scale_to_lyr(lyr_name_to_add);
      center_map(lyr_name_to_add);
    }
    if (_app.current_functionnality !== undefined) {
      fields_handler.fill(lyr_name_to_add);
    }
    handle_click_hand('lock');

    // If the target layer is a point layer, slightly change the tooltip for the "grid"
    // functionnality:
    document.getElementById('button_grid')
      .setAttribute('data-i18n', type === 'Point'
        ? '[title]app_page.func_description.grid_point'
        : '[title]app_page.func_description.grid');
    localize('#button_grid');
  } else if (result_layer_on_add) {
    create_li_layer_elem(
      lyr_name_to_add,
      nb_ft,
      [type, options.func_name],
      'result',
    );
  } else {
    create_li_layer_elem(lyr_name_to_add, nb_ft, type, '');
  }

  if (!target_layer_on_add && _app.current_functionnality !== undefined
      && (_app.current_functionnality.name === 'smooth' || _app.current_functionnality.name === 'grid')) {
    fields_handler.fill();
  }

  if (type === 'Point') {
    data_manager.current_layers[lyr_name_to_add].pointRadius = options.pointRadius || path.pointRadius();
  }

  // layers_listed.insertBefore(li, layers_listed.childNodes[0]);
  handleClipPath(_app.current_proj_name);
  binds_layers_buttons(lyr_name_to_add);
  if (!skip_rescale) {
    zoom_without_redraw();
  }

  // An alert is triggered when the layer is successfully added, except if
  // 'skip_alert' is false.
  // That "success" alert guide the user through other message; one for typing it's
  // data fields, on other (optionnal) for making the jointure between it's layer
  // and it's tabular dataset and another one (optional too)
  // to allow him to use the projection originally provided with the layer.
  if (!skip_alert) {
    if (fields_type) {
      data_manager.current_layers[lyr_name_to_add].fields_type = fields_type;
    }

    // No projection was provided with the layer
    if (_proj === undefined) {
    // if (_proj === undefined || !target_layer_on_add) {
      swal({
        title: '',
        text: _tr('app_page.common.layer_success'),
        allowOutsideClick: true,
        allowEscapeKey: true,
        type: 'success',
      }).then(() => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, () => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      });
    } else { // A projection was provided with the layer:
      swal({
        title: '',
        text: _tr('app_page.common.layer_success_and_proj'),
        showCancelButton: true,
        showCloseButton: false,
        allowEscapeKey: true,
        allowOutsideClick: true,
        type: 'success',
      }).then(() => {
        _app.last_projection = parsedJSON.proj;
        _app.current_proj_name = 'def_proj4';
        change_projection_4(_proj);
        const custom_name = tryFindNameProj(_app.last_projection);
        addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, () => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      });
    }
  }

  if (options.default_projection) {
    // We are also storing this information for later use if the user promotes/downgrade
    // some lmayers:
    data_manager.current_layers[lyr_name_to_add].default_projection = options.default_projection;
    if (options.target_layer_on_add) {
      // The 'default_projection' property is used for providing a custom projection
      // with our sample layer (it use a separate path compared to the previous
      // block of code, in order to not let the choice to the user)
      if (options.default_projection[0] === 'proj4') {
        let proj_str = options.default_projection[1];
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
      } else if (options.default_projection[0] === 'd3') {
        _app.current_proj_name = options.default_projection[1];
        change_projection(options.default_projection[1]);
        addLastProjectionSelect(_app.current_proj_name);
      }
    }
  } else if (parsedJSON.proj) {
    // We are also storing informations about the projection read from the .proj file
    // if any:
    data_manager.current_layers[lyr_name_to_add].default_projection = ['proj4', parsedJSON.proj];
  }
  return lyr_name_to_add;
}
