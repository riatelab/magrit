import ContextMenu from './context-menu';
import { getColorBrewerArray, ColorsSelected, randomColor } from './colors_helpers';
import { display_discretization } from './classification/discretization_panel';
import { display_categorical_box } from './classification/categorical_panel';
import { getOptNbClass, discretize_to_colors, discretize_to_size } from './classification/common';
import {
  cloneObj,
  copy_layer, create_li_layer_elem,
  display_error_during_computation,
  drag_elem_geo, drag_elem_geo2,
  drag_waffle, getFieldsType,
  get_other_layer_names,
  send_layer_server,
  setSelected, xhrequest,
} from './helpers';
import {
  getBinsCount, get_nb_decimals, has_negative,
  haversine_dist, max_fast, min_fast, PropSizer,
} from './helpers_calc';
import { Mabs, Mmax, Mmin, Mround, Msqrt } from './helpers_math';
import { prepare_available_symbols, switch_accordion_section } from './interface';
import { add_layer_topojson } from './layers';
import { make_style_box_indiv_label } from './layers_style_popup';
import { handle_legend } from './legend';
import { zoom_without_redraw } from './map_ctrl';
import { isInterrupted } from './projections';
import { display_box_symbol_typo, make_style_box_indiv_symbol } from './symbols_picto';

const section2 = d3.select('#menu').select('#section2');

export const get_menu_option = (function () {
  const menu_option = {
    smooth: {
      name: 'smooth',
      menu_factory() { return fillMenu_Stewart; },
      fields_handler() { return fields_Stewart; },
    },
    prop: {
      name: 'prop',
      menu_factory() { return fillMenu_PropSymbol; },
      fields_handler() { return fields_PropSymbol; },
    },
    choroprop: {
      name: 'choroprop',
      menu_factory() { return fillMenu_PropSymbolChoro; },
      fields_handler() { return fields_PropSymbolChoro; },
    },
    proptypo: {
      name: 'proptypo',
      menu_factory() { return fillMenu_PropSymbolTypo; },
      fields_handler() { return fields_PropSymbolTypo; },
    },
    choro: {
      name: 'choro',
      menu_factory() { return fillMenu_Choropleth; },
      fields_handler() { return fields_Choropleth; },
    },
    cartogram: {
      name: 'cartogram',
      menu_factory() { return fillMenu_Anamorphose; },
      fields_handler() { return fields_Anamorphose; },
    },
    grid: {
      name: 'grid',
      menu_factory() { return fillMenu_griddedMap; },
      fields_handler() { return fields_griddedMap; },
    },
    flow: {
      name: 'flow',
      menu_factory() { return fillMenu_FlowMap; },
      fields_handler() { return fields_FlowMap; },
    },
    discont: {
      name: 'discont',
      menu_factory() { return fillMenu_Discont; },
      fields_handler() { return fields_Discont; },
    },
    typo: {
      name: 'typo',
      menu_factory() { return fillMenu_Typo; },
      fields_handler() { return fields_Typo; },
    },
    typosymbol: {
      name: 'typosymbol',
      menu_factory() { return fillMenu_TypoSymbol; },
      fields_handler() { return fields_TypoSymbol; },
    },
    two_stocks: {
      name: 'two_stocks',
      menu_factory() { return fillMenu_TwoStocks; },
      fields_handler() { return fields_TwoStocks; },
    },
  };
  return func => menu_option[func.toLowerCase()] || {};
}());

/**
* Remove the div on which we are displaying the options related to each
* kind of rendering.
* @return {void}
*
*/
export function clean_menu_function() {
  if (fields_handler && fields_handler.unfill) {
    fields_handler.unfill();
    fields_handler = undefined;
  }
  if (_app.current_functionnality && _app.current_functionnality.name) {
    const previous_button = document.getElementById(`button_${_app.current_functionnality.name}`);
    if (previous_button.style.filter !== 'grayscale(100%)') {
      previous_button.style.filter = 'invert(0%) saturate(100%)';
    }
    previous_button.classList.remove('active');
    _app.current_functionnality = undefined;
  }
  section2.select('.func-options').remove();
  document.getElementById('accordion2b').style.display = 'none';
  const btn_s2b = document.getElementById('btn_s2b');
  btn_s2b.innerHTML = _tr('app_page.section2_.title_no_choice');
  btn_s2b.setAttribute('data-i18n', 'app_page.section2_.title_no_choice');
  btn_s2b.style.display = 'none';
}

/**
*  Reset the user choosen values remembered for its ease
*  (like discretization choice, symbols, etc. which are redisplayed as they
*   were selected by the user)
*
*/
export function reset_user_values() {
  fields_TypoSymbol.box_typo = undefined;
  fields_TypoSymbol.rendering_params = {};
  fields_TypoSymbol.cats = {};
  fields_PropSymbolChoro.rendering_params = {};
  fields_Typo.rendering_params = {};
  fields_Choropleth.rendering_params = {};
  fields_PropSymbolTypo.rendering_params = {};
}
/**
* Function to remove each node (each <option>) of a <select> HTML element :
*
*/
function unfillSelectInput(select_node) {
  select_node.innerHTML = ''; // eslint-disable-line no-param-reassign
  // for (let i = select_node.childElementCount - 1; i > -1; i--) {
  //   select_node.removeChild(select_node.children[i]);
  // }
}


/** Function trying to avoid layer name collision by adding a suffix
* to the layer name if already exists and incrementing it if necessary
* (MyLayer -> MyLayer_1 -> MyLayer_2 etc.)
*
* @param {string} name - The original wanted name of the layer to add
* @return {string} new_name - An available name to safely add the layer
*     (the input name if possible or a slightly modified
*        one to avoid collision or unwanted characters)
*/
export function check_layer_name(name) {
  let clean_name = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (clean_name.match(/^\d+/)) {
    clean_name = `_${clean_name}`;
  }
  if (!data_manager.current_layers.hasOwnProperty(clean_name) && ['Graticule', 'World'].indexOf(clean_name) < 0) {
    return clean_name;
  }
  //  else {
  let i = 1;
  const match = clean_name.match(/_\d+$/);
  if (!match) {
    return check_layer_name([clean_name, i].join('_'));
  }
  i = match[0];
  clean_name = clean_name.substring(clean_name, clean_name.indexOf(i));
  return check_layer_name([clean_name, parseInt(i.slice(1, i.length), 10) + 1].join('_'));
}

/**
* Display a message when switching between functionnalities if the layer to render
* doesn't have any interesting field to use.
*/
function display_error_num_field() {
  // Actually we are not diplaying an error message anymore but closing
  // closing the openend menu if their is no intersting field to be used for this
  // kind of representation. TODO : Reflect that in function names etc.
  clean_menu_function();
  // swal({
  //   title: '',
  //   text: _tr('app_page.common.error_type_fields'),
  //   type: 'error',
  // });
}

/**
* Display a warning message if the target layer contains
* one or more empty feature(s).
*
* @param {Array} features - the empty features
*
* @return void
*/
function display_warning_empty_geom(features) {
  swal({
    title: '',
    text: _tr('app_page.common.warning_empty_geom', { count: features.length }),
    type: 'warning',
    showCancelButton: false,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.valid')}!`,
  });
}

/**
* Return an approximate value (based on the bbox of the targeted layer)
* to fill the "span" field in stewart functionnality
* as well as the "resolution" field in grid functionnality.
*
* @param {String} func_name - the name of the representation for which this function
*                             is called (between 'grid' and 'stewart').
* @return Number - A first guess for the span value (with no decimal if possible)
*/
const get_first_guess_span = function (func_name) {
  const bbox = _target_layer_file.bbox,
    // layer_name = Object.getOwnPropertyNames(_target_layer_file.objects),
    const_mult = func_name === 'grid' ? 0.09 : 0.05;
  const width_km = haversine_dist(
    [bbox[0], Mabs(bbox[3]) - Mabs(bbox[1])], [bbox[2], Mabs(bbox[3]) - Mabs(bbox[1])]);
  const height_km = haversine_dist(
    [Mabs(bbox[2]) - Mabs(bbox[0]), bbox[1]], [Mabs(bbox[2]) - Mabs(bbox[0]), bbox[3]]);
  const val = Mmax(width_km, height_km) * const_mult;
  return val > 10 ? Mround(val / 10) * 10 : Mround(val);
};

/**
* Check if the wanted resolution isn't too big before sending the request
* to the server.
*
* @param {Number} cell_value - The cell value to test
* @return
*/
function test_maxmin_resolution(cell_value) {
  const bbox = _target_layer_file.bbox;
  const width_km = haversine_dist(
    [bbox[0], Mabs(bbox[3]) - Mabs(bbox[1])], [bbox[2], Mabs(bbox[3]) - Mabs(bbox[1])]);
  const height_km = haversine_dist(
    [Mabs(bbox[2]) - Mabs(bbox[0]), bbox[1]], [Mabs(bbox[2]) - Mabs(bbox[0]), bbox[3]]);
  // const area = width_km * height_km;
  const bigger_side = Mmax(height_km, width_km);
  if ((width_km * height_km) / (cell_value * cell_value) > 15000) {
    return 'higher';
  } else if (cell_value > bigger_side / 1.66) {
    return 'lower';
  }
  // return;
}

/*
* Set the appropriate discretisation icon as selected
*
*/
const color_disc_icons = (function () {
  const types = new Set(['q6', 'equal_interval', 'jenks', 'quantiles']);
  return (type_disc) => {
    if (!type_disc) return;
    const t_disc = type_disc.toLowerCase();
    if (types.has(t_disc)) {
      document.getElementById(`ico_${t_disc}`).style.border = 'solid 1px green';
    }
  };
}());

function make_template_functionnality(parent_node) {
  return parent_node.append('div').attr('class', 'func-options');
}


/**
* Make the input element allowing to choose the resulting layer name
* (used for each representation type)
* @param {Object} parent - The parent of the element to be created.
* @param {String} id - the id of the element to be created.
* @param {String} margin_top - The margin on the top of the input element (in px).
* @return {void}
*/
function make_layer_name_input(parent, id) {
  const a = parent.append('p').style('clear', 'both');
  a.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.output' })
    .html(_tr('app_page.func_options.common.output'));
  a.insert('input')
    .attrs({ class: 'params', id: id })
    .styles({
      width: '240px',
      float: 'right',
      'font-size': '11.5px',
      'margin-bottom': '20px',
      'margin-right': '20px',
      'margin-top': '8px',
     });
}

function make_discretization_icons(discr_section) {
  const subsection1 = discr_section.append('div');
  subsection1.insert('span')
    .attrs({ 'data-i18n': '[html]app_page.func_options.common.discretization_choice', class: 'i18n' })
    .html(_tr('app_page.func_options.common.discretization_choice'));

  const subsection2 = discr_section.append('p')
    .style('margin', '10px 0 0');
  subsection2.append('img')
    .styles({ margin: '0 7.5px', cursor: 'pointer' })
    .attrs({
      title: _tr('app_page.common.Q6'),
      src: '/static/img/discr_icons/q6.png',
      id: 'ico_q6',
      class: 'i18n',
      'data-i18n': '[title]app_page.common.Q6',
    });
  subsection2.append('img')
    .styles({ margin: '0 7.5px', cursor: 'pointer' })
    .attrs({
      title: _tr('app_page.common.jenks'),
      src: '/static/img/discr_icons/jenks.png',
      id: 'ico_jenks',
      class: 'i18n',
      'data-i18n': '[title]app_page.common.jenks',
    });
  subsection2.append('img')
    .styles({ margin: '0 7.5px', cursor: 'pointer' })
    .attrs({
      title: _tr('app_page.common.equal_interval'),
      src: '/static/img/discr_icons/equal_intervals.png',
      id: 'ico_equal_interval',
      class: 'i18n',
      'data-i18n': '[title]app_page.common.equal_interval',
    });
  subsection2.append('img')
    .styles({ margin: '0 7.5px', cursor: 'pointer' })
    .attrs({
      title: _tr('app_page.common.quantiles'),
      src: '/static/img/discr_icons/quantiles.png',
      id: 'ico_quantiles',
      class: 'i18n',
      'data-i18n': '[title]app_page.common.quantiles',
    });
  subsection2.append('img')
    .styles({ margin: '0 7.5px', cursor: 'pointer', width: '20px' })
    .attrs({
      title: _tr('app_page.common.user_defined'),
      src: '/static/img/High-contrast-system-run24.png',
      id: 'ico_others',
      class: 'i18n',
      'data-i18n': '[title]app_page.common.user_defined',
    });
  subsection2.append('span')
    .attrs({ id: 'choro_mini_choice_disc' })
    .styles({ float: 'right', 'margin-top': '5px', 'margin-left': '15px' });
  subsection2.append('img')
    .styles({ width: '15px', position: 'absolute', right: '25px' })
    .attrs({ id: 'img_choice_disc', src: '/static/img/Red_x.png' });
}


function make_ok_button(parent, id, disabled = true) {
  const a = parent.append('p')
    .styles({ clear: 'both', 'text-align': 'center', margin: 'auto' });
  a.append('button')
    .attrs({
      id: id,
      class: 'params button_st3 i18n',
      'data-i18n': '[html]app_page.func_options.common.render',
      disabled: disabled ? true : null,
    })
    .html(_tr('app_page.func_options.common.render'));
}

export function make_min_max_tableau(values, nb_class, discontinuity_type, min_size, max_size, id_parent, breaks, callback) {
  const parent_nd = document.getElementById(id_parent);
  parent_nd.innerHTML = '';

  if (values && breaks === undefined) {
    const disc_result = discretize_to_size(
      values, discontinuity_type, nb_class, min_size, max_size);
    breaks = disc_result[2]; // eslint-disable-line no-param-reassign
    if (!breaks) return false;
  }

  parent_nd.style.marginTop = '3px';
  parent_nd.style.marginBottom = '3px';

  const title = document.createElement('p');
  // title.style = "margin: 1px; word-spacing: 1.8em;";
  title.style.margin = '1px';
  title.style.wordSpacing = '1.8em';
  title.style.paddingLeft = '22px';
  title.innerHTML = 'Min - Max - Size';
  parent_nd.appendChild(title);

  const div_table = document.createElement('div');
  parent_nd.appendChild(div_table);
  for (let i = 0; i < breaks.length; i++) {
    const inner_line = document.createElement('p');
    inner_line.setAttribute('class', 'breaks_vals');
    inner_line.id = ['line', i].join('_');
    inner_line.style.margin = '0px';

    const input1 = document.createElement('input');
    input1.setAttribute('type', 'number');
    input1.setAttribute('class', 'min_class');
    input1.setAttribute('step', 'any');
    input1.value = (+breaks[i][0][0]).toFixed(2);
    input1.style.position = 'unset';
    inner_line.appendChild(input1);

    const input2 = document.createElement('input');
    input2.setAttribute('type', 'number');
    input2.setAttribute('class', 'max_class');
    input2.setAttribute('step', 'any');
    input2.value = (+breaks[i][0][1]).toFixed(2);
    input2.style.position = 'unset';
    inner_line.appendChild(input2);

    const input3 = document.createElement('input');
    input3.setAttribute('type', 'number');
    input3.setAttribute('class', 'size_class');
    input3.setAttribute('step', 'any');
    input3.value = (+breaks[i][1]).toFixed(2);
    input3.style.marginLeft = '20px';
    input3.style.position = 'unset';
    inner_line.appendChild(input3);

    const px = document.createElement('span');
    px.innerHTML = ' px';
    inner_line.appendChild(px);
    div_table.appendChild(inner_line);
  }

  const mins = document.getElementById(id_parent).querySelectorAll('.min_class'),
    maxs = document.getElementById(id_parent).querySelectorAll('.max_class');

  for (let i = 0; i < mins.length; i++) {
    if (i > 0) {
      const prev_ix = i - 1;
      mins[i].onchange = function () {
        maxs[prev_ix].value = this.value;
        if (callback) callback();
      };
    }
    if (i < mins.length - 1) {
      const next_ix = i + 1;
      maxs[i].onchange = function () {
        mins[next_ix].value = this.value;
        if (callback) callback();
      };
    }
  }
  if (callback) {
    const sizes = document.getElementById(id_parent).querySelectorAll('.size_class');
    for (let i = 0; i < sizes.length; i++) {
      sizes[i].onchange = callback;
    }
  }
}

export function fetch_min_max_table_value(parent_id) {
  let parent_node;
  if (parent_id) {
    parent_node = document.getElementById(parent_id);
  } else if (_app.current_functionnality.name === 'flow') {
    parent_node = document.getElementById('FlowMap_discTable');
  } else if (_app.current_functionnality.name === 'discont') {
    parent_node = document.getElementById('Discont_discTable');
  } else {
    return;
  }
  const mins = Array.prototype.map.call(parent_node.querySelectorAll('.min_class'), el => +el.value),
    maxs = Array.prototype.map.call(parent_node.querySelectorAll('.max_class'), el => +el.value),
    sizes = Array.prototype.map.call(parent_node.querySelectorAll('.size_class'), el => +el.value),
    // nb_class = mins.length,
    comp_fun = (a, b) => a - b;

  const r_mins = [].concat(mins);
  const r_maxs = [].concat(maxs);
  const r_sizes = [].concat(sizes);
  const sorted_min = mins.sort(comp_fun);
  const sorted_max = maxs.sort(comp_fun);
  const sorted_sizes = sizes.sort(comp_fun);
  // Some verification regarding the input values provided by the user :
  // - Values are ordered :
  if (!(r_mins.every((d, i) => sorted_min[i] === d)
      && r_maxs.every((d, i) => sorted_max[i] === d)
      && r_sizes.every((d, i) => sorted_sizes[i] === d))) {
    swal('', _tr('app_page.common.error_values_order'), 'error');
  }

  return { mins: sorted_min, maxs: sorted_max, sizes: sorted_sizes };
}

function fillMenu_TwoStocks() {
  const dv2 = make_template_functionnality(section2);

  const f1 = dv2.append('p').attr('class', 'params_section2');
  f1.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.fields' })
    .html(_tr('app_page.func_options.twostocks.fields'));
  f1.insert('select')
    .attrs({
      class: 'params',
      id: 'TwoStocks_fields',
      multiple: 'multiple',
      size: 2,
    });

  // const f2 = dv2.append('p').attr('class', 'params_section2');
  // f2.append('span')
  //   .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.field2' })
  //   .html(_tr('app_page.func_options.twostocks.field2'));
  // f2.insert('select')
  //   .attrs({ class: 'params', id: 'TwoStocks_field2' });

  // const a = dv2.append('p').attr('class', 'params_section2');
  // a.append('span')
  //   .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.type' })
  //   .html(_tr('app_page.func_options.twostocks.type'));
  // const type_select = a.insert('select')
  //   .attrs({ class: 'params', id: 'TwoStocks_type' });


  // Options for waffles :
  const b = dv2.append('p')
    .attr('class', 'params_section2');
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.symbol_choice' })
    .html(_tr('app_page.func_options.twostocks.symbol_choice'));
  b.insert('select')
    .attrs({ class: 'params', id: 'TwoStocks_waffle_symbol' });

  const c = dv2.append('p')
    .attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.waffle_size_circle', id: 'TwoStocks_waffle_size_txt' })
    .html(_tr('app_page.func_options.twostocks.waffle_size_circle'));
  c.insert('input')
    .attrs({
      id: 'TwoStocks_waffle_size',
      type: 'number',
      class: 'params',
      min: 1,
      max: 20,
      step: 1,
    })
    .style('width', '50px')
    .property('value', 3);
  c.append('span').html(' (px)');

  const d = dv2.append('p')
    .attr('class', 'params_section2');
  d.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.waffle_width_rows' })
    .html(_tr('app_page.func_options.twostocks.waffle_width_rows'));
  d.insert('input')
    .attrs({
      id: 'TwoStocks_waffle_WidthRow',
      class: 'params',
      type: 'number',
      min: 2,
      max: 8,
      step: 1,
    })
    .style('width', '50px')
    .property('value', 2);

  const e = dv2.append('p')
    .attr('class', 'params_section2');
  e.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.waffle_ratio' })
    .html(_tr('app_page.func_options.twostocks.waffle_ratio'));
  e.insert('input')
    .attrs({
      id: 'TwoStocks_waffle_ratio',
      class: 'params',
      type: 'number',
      min: 1,
      max: 1000000,
      step: 1,
    })
    .style('width', '50px')
    .property('value', 100);
  e.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.twostocks.waffle_ratio_units' })
    .html(_tr('app_page.func_options.twostocks.waffle_ratio_units'));

  make_layer_name_input(dv2, 'TwoStocks_output_name');
  make_ok_button(dv2, 'twoStocks_yes');
  dv2.selectAll('.params').attr('disabled', true);
}

const fields_TwoStocks = {
  fill(layer) {
    if (!layer) return;
    section2.selectAll('.params').attr('disabled', null);
    const fields_stock = getFieldsType('stock', layer);
    const symbol_choice = section2.select('#TwoStocks_waffle_symbol');
    const fields_list = section2.select('#TwoStocks_fields');
    const ok_button = section2.select('#twoStocks_yes');
    // const ratio_select = section2.select('#TwoStocks_waffle_ratio');
    const input_name = section2.select('#TwoStocks_output_name');
    [
      ['app_page.func_options.common.symbol_circle', 'circle'],
      ['app_page.func_options.common.symbol_square', 'rect'],
    ].forEach((symb) => {
      symbol_choice.append('option').text(_tr(symb[0])).attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
    });
    const nb_display_fields = fields_stock.length <= 4 ? fields_stock.length : 4;
    fields_stock.forEach((f) => {
      fields_list.append('option').text(f).attr('value', f);
    });
    fields_list.node().parentElement.style.marginBottom = `${nb_display_fields * 16}px`;
    fields_list.attr('size', nb_display_fields);
    symbol_choice.on('change', function () {
      if (this.value === 'circle') {
        section2.select('#TwoStocks_waffle_size_txt')
          .attr('data-i18n', '[html]app_page.func_options.twostocks.waffle_size_circle')
          .text(_tr('app_page.func_options.twostocks.waffle_size_circle'));
      } else {
        section2.select('#TwoStocks_waffle_size_txt')
          .attr('data-i18n', '[html]app_page.func_options.twostocks.waffle_size_square')
          .text(_tr('app_page.func_options.twostocks.waffle_size_square'));
      }
    });
    input_name.node().value = `${layer}_Waffle`;
    ok_button.on('click', () => {
      const rendering_params = {};
      let new_layer_name = document.getElementById('TwoStocks_output_name').value;
      new_layer_name = check_layer_name(new_layer_name.length > 0 ? new_layer_name : `${layer}_Waffle`);
      rendering_params.ratio = +document.getElementById('TwoStocks_waffle_ratio').value;
      rendering_params.fields = Array.prototype.slice.call(
        fields_list.node().selectedOptions).map(elem => elem.value);

      // Verify that there is 2 or more fields selected :
      if (rendering_params.fields.length < 2) {
        swal({
          title: `${_tr('app_page.common.error')}!`,
          text: `${_tr('app_page.common.error_multiple_fields')}`,
          customClass: 'swal2_custom',
          type: 'error',
          allowOutsideClick: false,
        });
        return;
      }

      // Verify that there isn't too many symbols to draw:
      let t_max = 0;
      for (let i = 0; i < rendering_params.fields.length; i++) {
        const field = rendering_params.fields[i];
        t_max += max_fast(data_manager.user_data[layer]
            .map(obj => +obj[field])) / rendering_params.ratio;
      }

      if (t_max > 900) {
        swal({
          title: `${_tr('app_page.common.error')}!`,
          text: `${_tr('app_page.common.error_waffle_too_many')}`,
          customClass: 'swal2_custom',
          type: 'error',
          allowOutsideClick: false,
        });
        return;
      }

      // Fetch the necessary settings for rendering the waffle map:
      rendering_params.new_name = new_layer_name;
      rendering_params.symbol_type = symbol_choice.node().value;
      rendering_params.size = +document.getElementById('TwoStocks_waffle_size').value;
      rendering_params.nCol = +document.getElementById('TwoStocks_waffle_WidthRow').value;

      render_twostocks_waffle(layer, rendering_params);
      zoom_without_redraw();
      switch_accordion_section();
      handle_legend(new_layer_name);
    });
  },
  unfill() {
    unfillSelectInput(document.getElementById('TwoStocks_waffle_symbol'));
    unfillSelectInput(document.getElementById('TwoStocks_fields'));
    unfillSelectInput(document.getElementById('TwoStocks_waffle_ratio'));
    document.getElementById('TwoStocks_fields').size = 2;
    document.getElementById('TwoStocks_fields').parentElement.style.marginBottom = '25px';
    section2.selectAll('.params').attr('disabled', true);
  },
};

export function render_twostocks_waffle(layer, rendering_params) {
  const get_colors = (nb) => {
    const res = [];
    for (let i = 0; i < nb; i++) {
      res.push(randomColor());
    }
    return res;
  };
  const {
    ratio,
    symbol_type,
    nCol,
    fields,
    new_name: layer_to_add,
  } = rendering_params;
  const { floor, round } = Math;
  const nbVar = fields.length;
  const colors = [];
  const sums = [];
  let ref_colors;

  const layer_id = encodeId(layer_to_add);
  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);

  if (!rendering_params.result_data) {
    ref_colors = get_colors(nbVar);
    data_manager.result_data[layer_to_add] = [];
    const ref_layer_selection = map.select(`#${_app.layer_to_id.get(layer)}`).selectAll('path');
    const centroids = getCentroids(ref_layer_selection._groups[0]);
    const empty_geoms = [];

    ref_layer_selection.each((d, i) => {
      if (!centroids[i]) {
        empty_geoms.push(d);
      } else {
        const r = { id: d.id, centroid: centroids[i] };
        for (let j = 0; j < nbVar; j++) {
          const field = fields[j];
          r[field] = +data_manager.user_data[layer][i][field];
        }
        data_manager.result_data[layer_to_add].push(r);
      }
    });
    if (empty_geoms.length > 0) {
      display_warning_empty_geom(empty_geoms);
    }
  } else {
    ref_colors = rendering_params.ref_colors;
    data_manager.result_data[layer_to_add] = JSON.parse(rendering_params.result_data);
  }

  for (let i = 0, _length = data_manager.result_data[layer_to_add].length; i < _length; i++) {
    const c = [];
    let sum = 0;
    let color;
    for (let j = 0; j < nbVar; j++) {
      const val = data_manager.result_data[layer_to_add][i][fields[j]] / ratio;
      sum += val;
      color = ref_colors[j];
      for (let ix = 0; ix < val; ix++) {
        c.push(color);
      }
    }
    colors.push(c);
    sums.push(sum);
  }

  const nb_features = data_manager.result_data[layer_to_add].length;
  const new_layer = map.insert('g', '.legend')
    .attrs({ id: layer_id, class: 'layer no_clip' });

  if (symbol_type === 'circle') {
    const r = rendering_params.size;
    for (let j = 0; j < data_manager.result_data[layer_to_add].length; j++) {
      const centroid = path.centroid({
        type: 'Point',
        coordinates: data_manager.result_data[layer_to_add][j].centroid,
      });
      const group = new_layer.append('g');
      const sum = sums[j];
      const _colors = colors[j];
      for (let i = 0; i < sum; i++) {
        const t_x = round((i % nCol) * 2 * r);
        const t_y = floor(floor(i / nCol) * 2 * r);
        group.append('circle')
          .attrs({
            transform: `translate(-${t_x}, -${t_y})`,
            cx: centroid[0],
            cy: centroid[1],
            r: r,
            id: ['waffle_', i, ' feature_', data_manager.result_data[layer_to_add][j].id].join(''),
            fill: _colors[i],
          });
      }
      group.node().__data__ = {
        type: 'Feature',
        properties: data_manager.result_data[layer_to_add][j],
        geometry: {
          type: 'Point',
          coordinates: data_manager.result_data[layer_to_add][j].centroid,
        },
      };
      group.call(drag_waffle);
    }
  } else if (symbol_type === 'rect') {
    const width = rendering_params.size;
    const offset = width / 5;
    for (let j = 0; j < data_manager.result_data[layer_to_add].length; j++) {
      const centroid = path.centroid({
        type: 'Point',
        coordinates: data_manager.result_data[layer_to_add][j].centroid,
      });
      const group = new_layer.append('g');
      const sum = sums[j];
      const _colors = colors[j];
      for (let i = 0; i < sum; i++) {
        const t_x = round((i % nCol) * width) + (offset * round(i % nCol));
        const t_y = floor(floor(i / nCol) * width) + (offset * floor(i / nCol));
        group.append('rect')
          .attrs({
            transform: `translate(-${t_x}, -${t_y})`,
            x: centroid[0],
            y: centroid[1],
            width: width,
            height: width,
            id: ['waffle_', i, ' feature_', data_manager.result_data[layer_to_add][j].id].join(''),
            fill: _colors[i],
          });
      }
      group.node().__data__ = {
        type: 'Feature',
        properties: data_manager.result_data[layer_to_add][j],
        geometry: {
          type: 'Point',
          coordinates: data_manager.result_data[layer_to_add][j].centroid,
        },
      };
      group.call(drag_waffle);
    }
  }

  data_manager.current_layers[layer_to_add] = {
    fill_color: ref_colors,
    n_features: nb_features,
    renderer: 'TwoStocksWaffle',
    symbol: symbol_type,
    rendered_field: fields,
    size: rendering_params.size,
    ratio: ratio,
    nCol: nCol,
    'stroke-width-const': 0,
    is_result: true,
    ref_layer_name: layer,
    draggable: false,
  };
  create_li_layer_elem(layer_to_add, nb_features, ['Point', 'waffle'], 'result');
}

function fillMenu_PropSymbolChoro() {
  const dv2 = make_template_functionnality(section2);

  const a = dv2.append('p').attr('class', 'params_section2');
  a.append('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.field1' })
    .html(_tr('app_page.func_options.choroprop.field1'));
  a.insert('select')
    .attrs({ class: 'params', id: 'PropSymbolChoro_field_1' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const b = dv2.append('p')
    .attr('class', 'params_section2')
    .styles({ margin: 'auto' });
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.fixed_size' })
    .html(_tr('app_page.func_options.choroprop.fixed_size'));
  b.insert('input')
    .attrs({
      id: 'PropSymbolChoro_ref_size',
      type: 'number',
      class: 'params',
      min: 0.1,
      max: 100.0,
      step: 'any',
    })
    .style('width', '50px')
    .property('value', 60);
  b.append('span').html(' (px)');

  const c = dv2.append('p').attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.on_value' })
    .html(_tr('app_page.func_options.choroprop.on_value'));
  c.insert('input')
    .styles({ width: '100px', 'margin-left': '10px' })
    .attrs({ type: 'number', class: 'params', id: 'PropSymbolChoro_ref_value' })
    .attrs({ min: 0.1, step: 0.1 });

  // Other symbols could probably easily be proposed :
  const d = dv2.append('p').attr('class', 'params_section2');
  d.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.symbol_type' })
    .html(_tr('app_page.func_options.choroprop.symbol_type'));
  d.insert('select')
    .attrs({ class: 'params i18n', id: 'PropSymbolChoro_symbol_type' });

  const e = dv2.append('p')
    .attr('class', 'params_section2');
  e.append('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.field2' })
    .html(_tr('app_page.func_options.choroprop.field2'));

  e.insert('select')
    .attrs({ class: 'params', id: 'PropSymbolChoro_field_2' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const discr_section = dv2.insert('p')
    .styles({ clear: 'both', margin: 'auto' });
  discr_section.insert('span')
    .attr('id', 'container_sparkline_propsymbolchoro')
    .styles({ margin: '16px 50px 0px 4px', float: 'right' });
  make_discretization_icons(discr_section);
  // let f = dv2.insert('p').attr('class', 'params_section2');
  // f.append("button")
  //     .attrs({id: 'PropSymbolChoro_btn_disc', class: 'params button_disc i18n',
  //             'data-i18n': '[html]app_page.func_options.common.discretization_choice'})
  //     .styles({"font-size": "0.8em", "text-align": "center"})
  //     .html(_tr("app_page.func_options.common.discretization_choice"));

  make_layer_name_input(dv2, 'PropSymbolChoro_output_name');
  make_ok_button(dv2, 'propChoro_yes');
  dv2.selectAll('.params').attr('disabled', true);
}

const fields_PropSymbolChoro = {
  fill(layer) {
    if (!layer) return;
    section2.selectAll('.params').attr('disabled', null);
    const self = this,
      fields_stock = getFieldsType('stock', layer),
      fields_ratio = getFieldsType('ratio', layer),
      nb_features = data_manager.user_data[layer].length,
      field_size = section2.select('#PropSymbolChoro_field_1'),
      field_color = section2.select('#PropSymbolChoro_field_2'),
      ico_disc = section2.select('#ico_others'),
      ico_jenks = section2.select('#ico_jenks'),
      ico_quantiles = section2.select('#ico_quantiles'),
      ico_equal_interval = section2.select('#ico_equal_interval'),
      ico_q6 = section2.select('#ico_q6'),
      uo_layer_name = section2.select('#PropSymbolChoro_output_name'),
      ref_value_field = section2.select('#PropSymbolChoro_ref_value'),
      symb_selec = section2.select('#PropSymbolChoro_symbol_type'),
      ref_size = section2.select('#PropSymbolChoro_ref_size'),
      choro_mini_choice_disc = section2.select('#choro_mini_choice_disc'),
      img_valid_disc = section2.select('#img_choice_disc'),
      ok_button = section2.select('#propChoro_yes');

    const uncolor_icons = () => {
      ico_jenks.style('border', null);
      ico_q6.style('border', null);
      ico_quantiles.style('border', null);
      ico_equal_interval.style('border', null);
    };

    if (data_manager.current_layers[layer].type === 'Line') {
      ref_size.attr('value', 10.0);
      [
        ['app_page.func_options.common.symbol_line', 'line'],
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    } else {
      ref_size.attr('value', 60.0);
      [
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    }

    const prepare_disc_quantiles = (field) => {
      const _values = data_manager.user_data[layer].map(v => v[field]);
      const n_class = getOptNbClass(_values.length);
      render_mini_chart_serie(_values.map(v => +v), document.getElementById('container_sparkline_propsymbolchoro'));
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'quantiles', n_class);
      self.rendering_params[field] = {
        nb_class: nb_class,
        type: 'quantiles',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.quantiles')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
      uncolor_icons();
      ico_quantiles.style('border', 'solid 1px green');
      if (_values.length > 7500) {
        ico_jenks.style('display', 'none');
      } else {
        ico_jenks.style('display', null);
      }
    };

    if (fields_stock.length === 0 || fields_ratio.length === 0) {
      display_error_num_field();
      return;
    }

    // Set some default colors in order to not force to open the box for selecting them :
    {
      const first_field = fields_ratio[0];
      prepare_disc_quantiles(first_field);
      ok_button.attr('disabled', self.rendering_params[first_field] ? null : true);
    }

    fields_stock.forEach((field) => {
      field_size.append('option').text(field).attr('value', field);
    });
    fields_ratio.forEach((field) => {
      field_color.append('option').text(field).attr('value', field);
    });
    field_size.on('change', function () {
      const field_name = this.value,
        max_val_field = max_fast(data_manager.user_data[layer].map(obj => +obj[field_name]));

      ref_value_field.attrs({ max: max_val_field, value: max_val_field });
      uo_layer_name.attr('value', ['PropSymbols', field_name, field_color.node().value, layer].join('_'));
    });

    field_color.on('change', function () {
      const field_name = this.value;
      const vals = data_manager.user_data[layer].map(a => +a[field_name]);
      render_mini_chart_serie(vals, document.getElementById('container_sparkline_propsymbolchoro'));
      uo_layer_name.attr('value', ['PropSymbols', field_size.node().value, field_name, layer].join('_'));
      if (self.rendering_params[field_name] !== undefined) {
        // ok_button.attr('disabled', null);
        img_valid_disc.attr('src', '/static/img/Light_green_check.png');
        choro_mini_choice_disc.html([
          _tr(`app_page.common.${self.rendering_params[field_name].type}`),
          ', ',
          _tr('app_page.common.class', { count: self.rendering_params[field_name].nb_class })].join(''));
        uncolor_icons();
        color_disc_icons(self.rendering_params[field_name].type);
        // console.log(section2); console.log(self.rendering_params[field_name].type);
      } else {
        prepare_disc_quantiles(field_name);
        // ok_button.attr('disabled', true);
        // img_valid_disc.attr('src', '/static/img/Red_x.png');
        // choro_mini_choice_disc.html('');
      }
    });

    ico_jenks.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_color.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'jenks', n_class, 'BuGn');
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'jenks',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'PropSymbolsChoro',
        rendered_field: selected_field,
        schema: ['BuGn'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.jenks')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_quantiles.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_color.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'quantiles', n_class, 'BuGn');
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'quantiles',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'PropSymbolsChoro',
        rendered_field: selected_field,
        schema: ['BuGn'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.quantiles')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_equal_interval.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_color.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'equal_interval', n_class, 'BuGn');
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'equal_interval',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'PropSymbolsChoro',
        rendered_field: selected_field,
        schema: ['BuGn'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.equal_interval')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_q6.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_color.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'Q6', 6, 'BuGn');
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'Q6',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'PropSymbolsChoro',
        rendered_field: selected_field,
        schema: ['BuGn'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.Q6')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_disc.on('click', () => {
      const selected_field = field_color.node().value;
      const opt_nb_class = getOptNbClass(data_manager.user_data[layer].length);
      let conf_disc_box;

      if (self.rendering_params[selected_field]) {
        conf_disc_box = display_discretization(
          layer,
          selected_field,
          self.rendering_params[selected_field].nb_class,
          {
            schema: self.rendering_params[selected_field].schema,
            colors: self.rendering_params[selected_field].colors,
            no_data: self.rendering_params[selected_field].no_data,
            type: self.rendering_params[selected_field].type,
            breaks: self.rendering_params[selected_field].breaks,
            extra_options: self.rendering_params[selected_field].extra_options,
          },
        );
      } else {
        conf_disc_box = display_discretization(layer, selected_field, opt_nb_class, { type: 'quantiles' });
      }

      conf_disc_box.then((confirmed) => {
        if (confirmed) {
          img_valid_disc.attr('src', '/static/img/Light_green_check.png');
          choro_mini_choice_disc.html([
            _tr(`app_page.common.${confirmed[1]}`), ', ',
            _tr('app_page.common.class', { count: confirmed[0] })].join(''));
          uncolor_icons();
          color_disc_icons(confirmed[1]);
          self.rendering_params[selected_field] = {
            nb_class: confirmed[0],
            type: confirmed[1],
            schema: confirmed[5],
            no_data: confirmed[6],
            breaks: confirmed[2],
            colors: confirmed[3],
            colorsByFeature: confirmed[4],
            renderer: 'PropSymbolsChoro',
            extra_options: confirmed[7],
          };
        }
      });
    });
    ok_button.on('click', () => {
      if (!ref_value_field.node().value) return;
      const rendering_params = self.rendering_params;
      if (rendering_params[field_color.node().value]) {
        // const layer = Object.getOwnPropertyNames(data_manager.user_data)[0];
        const symbol_to_use = symb_selec.node().value,
          // nb_features = data_manager.user_data[layer].length,
          rd_params = {},
          color_field = field_color.node().value;
        let new_layer_name = uo_layer_name.node().value;

        new_layer_name = check_layer_name(new_layer_name.length > 0 ? new_layer_name : `${layer}_PropSymbolsChoro`);

        rd_params.field = field_size.node().value;
        rd_params.new_name = new_layer_name;
        rd_params.nb_features = nb_features;
        rd_params.ref_layer_name = layer;
        rd_params.symbol = symbol_to_use;
        rd_params.ref_value = +ref_value_field.node().value;
        rd_params.ref_size = +ref_size.node().value;
        rd_params.fill_color = rendering_params[color_field].colorsByFeature;
        rd_params.color_field = color_field;

        if (symbol_to_use === 'line') {
          make_prop_line(rd_params);
        } else {
          make_prop_symbols(rd_params);
        }
        const colors_breaks = [];
        for (let i = rendering_params[color_field].breaks.length - 1; i > 0; --i) {
          colors_breaks.push([
            [rendering_params[color_field].breaks[i - 1], ' - ', rendering_params[color_field].breaks[i]].join(''),
            rendering_params[color_field].colors[i - 1]]);
        }

        const options_disc = {
          schema: rendering_params[color_field].schema,
          colors: rendering_params[color_field].colors,
          no_data: rendering_params[color_field].no_data,
          type: rendering_params[color_field].type,
          breaks: rendering_params[color_field].breaks,
          extra_options: rendering_params[color_field].extra_options,
        };

        Object.assign(data_manager.current_layers[new_layer_name], {
          renderer: 'PropSymbolsChoro',
          options_disc: options_disc,
          rendered_field: field_size.node().value,
          rendered_field2: field_color.node().value,
          colors_breaks: colors_breaks,
        });
        zoom_without_redraw();
        switch_accordion_section();
        handle_legend(new_layer_name);
      }
    });
    setSelected(field_size.node(), fields_stock[0]);
    setSelected(field_color.node(), fields_ratio[0]);
  },

  unfill() {
    unfillSelectInput(document.getElementById('PropSymbolChoro_field_1'));
    unfillSelectInput(document.getElementById('PropSymbolChoro_field_2'));
    unfillSelectInput(document.getElementById('PropSymbolChoro_symbol_type'));
    section2.selectAll('.params').attr('disabled', true);
  },

  rendering_params: {},
};

const fillMenu_Typo = function fillMenu_Typo() {
  const dv2 = make_template_functionnality(section2);

  const a = dv2.append('p').attr('class', 'params_section2');
  a.append('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.typo.field' })
    .html(_tr('app_page.func_options.typo.field'));
  a.insert('select')
    .attrs({ id: 'Typo_field_1', class: 'params' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const b = dv2.insert('p')
    .attr('class', 'params_section2')
    .styles({ margin: 'auto', 'text-align': 'center', clear: 'both' });
  b.append('button')
    .attrs({
      id: 'Typo_class',
      class: 'button_disc params i18n',
      'data-i18n': '[html]app_page.func_options.typo.color_choice',
    })
    .styles({ 'font-size': '0.8em', 'text-align': 'center' })
    .html(_tr('app_page.func_options.typo.color_choice'));

  make_layer_name_input(dv2, 'Typo_output_name');
  make_ok_button(dv2, 'Typo_yes');
  dv2.selectAll('.params').attr('disabled', true);
};

const fields_Typo = {
  fill (layer) {
    if (!layer) return;
    const self = this,
      // g_lyr_name = `#${layer}`,
      fields_name = getFieldsType('category', layer),
      field_selec = section2.select('#Typo_field_1'),
      ok_button = section2.select('#Typo_yes'),
      btn_typo_class = section2.select('#Typo_class'),
      uo_layer_name = section2.select('#Typo_output_name');

    const prepare_colors = (field) => {
      const [, col_map] = prepare_categories_array(layer, field, null);
      const nb_class = col_map.size;
      const colorByFeature = data_manager.user_data[layer].map(ft => col_map.get(ft[field])[0]);
      self.rendering_params[field] = {
        nb_class: nb_class,
        color_map: col_map,
        colorByFeature: colorByFeature,
        renderer: 'Categorical',
        rendered_field: field,
        skip_alert: false,
      };
    };

    fields_name.forEach((f_name) => {
      field_selec.append('option').text(f_name).attr('value', f_name);
    });

    field_selec.on('change', function () {
      const selected_field = this.value;
      uo_layer_name.attr('value', ['Typo', selected_field, layer].join('_'));
      prepare_colors(selected_field);
    });

    // Set some default colors in order to not force to open the box for selecting them :
    {
      const first_field = fields_name[0];
      prepare_colors(first_field);
      ok_button.attr('disabled', self.rendering_params[first_field] ? null : true);
    }

    btn_typo_class.on('click', () => {
      const selected_field = field_selec.node().value;
      const col_map = self.rendering_params[selected_field]
        ? self.rendering_params[selected_field].color_map
        : undefined;
      const [cats, ] = prepare_categories_array(layer, selected_field, col_map);
      if (cats.length > 15) {
        swal({
          title: '',
          text: _tr('app_page.common.error_too_many_features_color'),
          type: 'warning',
          showCancelButton: true,
          allowOutsideClick: false,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: `${_tr('app_page.common.valid')}!`,
          cancelButtonText: _tr('app_page.common.cancel'),
        }).then(() => {
          display_categorical_box(data_manager.user_data[layer], layer, selected_field, cats)
            .then((confirmed) => {
              if (confirmed) {
                self.rendering_params[selected_field] = {
                  nb_class: confirmed[0],
                  color_map: confirmed[1],
                  colorByFeature: confirmed[2],
                  renderer: 'Categorical',
                  rendered_field: selected_field,
                  skip_alert: true,
                };
              }
            });
        }, () => null);
      } else {
        display_categorical_box(data_manager.user_data[layer], layer, selected_field, cats)
          .then((confirmed) => {
            if (confirmed) {
              self.rendering_params[selected_field] = {
                nb_class: confirmed[0],
                color_map: confirmed[1],
                colorByFeature: confirmed[2],
                renderer: 'Categorical',
                rendered_field: selected_field,
                skip_alert: true,
              };
            }
          });
      }
    });

    ok_button.on('click', () => {
      const selected_field = field_selec.node().value;
      const params = self.rendering_params[selected_field];
      const render = () => {
        if (params) {
          const _layer = Object.getOwnPropertyNames(data_manager.user_data)[0];
          const output_name = uo_layer_name.node().value;
          params.new_name = check_layer_name(output_name.length > 0 ? output_name : ['Typo', selected_field, _layer].join('_'));
          render_categorical(_layer, params);
          switch_accordion_section();
          handle_legend(params.new_name);
        }
      };
      if (params.color_map.size > 15 && !params.skip_alert) {
        swal({
          title: '',
          text: _tr('app_page.common.error_too_many_features_color'),
          type: 'warning',
          showCancelButton: true,
          allowOutsideClick: false,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: `${_tr('app_page.common.valid')}!`,
          cancelButtonText: _tr('app_page.common.cancel'),
        }).then(() => {
          render();
        }, () => null);
      } else {
        render();
      }
    });
    uo_layer_name.attr('value', `Typo_${layer}`);
    section2.selectAll('.params').attr('disabled', null);
    setSelected(field_selec.node(), fields_name[0]);
  },
  unfill() {
    unfillSelectInput(document.getElementById('Typo_field_1'));
    section2.selectAll('.params').attr('disabled', true);
  },
  rendering_params: {},
};

function fillMenu_Choropleth() {
  const dv2 = make_template_functionnality(section2);

  const field_selec_section = dv2.append('p').attr('class', 'params_section2');
  field_selec_section.insert('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field' })
    .html(_tr('app_page.func_options.common.field'));

  field_selec_section.insert('select')
    .attrs({ id: 'choro_field1', class: 'params' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const discr_section = dv2.insert('p')
    .attr('class', 'params_section2')
    .styles({ margin: 'auto' });
  discr_section.insert('span')
    .attr('id', 'container_sparkline_choro')
    .styles({ margin: '16px 50px 0px 4px', float: 'right' });
  make_discretization_icons(discr_section);

  make_layer_name_input(dv2, 'Choro_output_name');
  make_ok_button(dv2, 'choro_yes');
  dv2.selectAll('.params').attr('disabled', true);
}

const fields_Choropleth = {
  fill (layer) {
    if (!layer) return;
    const self = this,
      // g_lyr_name = `#${layer}`,
      fields = getFieldsType('ratio', layer),
      // fields = type_col(layer, "number"),
      field_selec = section2.select('#choro_field1'),
      uo_layer_name = section2.select('#Choro_output_name'),
      ok_button = section2.select('#choro_yes'),
      img_valid_disc = section2.select('#img_choice_disc'),
      ico_jenks = section2.select('#ico_jenks'),
      ico_quantiles = section2.select('#ico_quantiles'),
      ico_q6 = section2.select('#ico_q6'),
      ico_equal_interval = section2.select('#ico_equal_interval'),
      btn_class = section2.select('#ico_others'),
      choro_mini_choice_disc = section2.select('#choro_mini_choice_disc');

    const uncolor_icons = () => {
      ico_jenks.style('border', null);
      ico_q6.style('border', null);
      ico_quantiles.style('border', null);
      ico_equal_interval.style('border', null);
    };

    const prepare_disc_quantiles = (field) => {
      const _values = data_manager.user_data[layer].map(v => v[field]),
        n_class = getOptNbClass(_values.length);
      render_mini_chart_serie(_values.map(v => +v), document.getElementById('container_sparkline_choro'));
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'quantiles', n_class);
      self.rendering_params[field] = {
        nb_class: nb_class,
        type: 'quantiles',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.quantiles')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
      uncolor_icons();
      ico_quantiles.style('border', 'solid 1px green');
      if (_values.length > 7500) {
        ico_jenks.style('display', 'none');
      } else {
        ico_jenks.style('display', null);
      }
    };

    if (fields.length === 0) {
      display_error_num_field();
      return;
    }
    section2.selectAll('.params').attr('disabled', null);
    fields.forEach((field) => {
      field_selec.append('option').text(field).attr('value', field);
    });

    // Set some default colors in order to not force to open the box for selecting them :
    {
      const first_field = fields[0];
      prepare_disc_quantiles(first_field);
      ok_button.attr('disabled', self.rendering_params[first_field] ? null : true);
    }

    field_selec.on('change', function () {
      const field_name = this.value,
        vals = data_manager.user_data[layer].map(a => +a[field_name]);
      render_mini_chart_serie(vals, document.getElementById('container_sparkline_choro'));
      uo_layer_name.attr('value', ['Choro', field_name, layer].join('_'));
      if (self.rendering_params[field_name] !== undefined) {
        // ok_button.attr('disabled', null);
        img_valid_disc.attr('src', '/static/img/Light_green_check.png');
        const keyi18n = `app_page.common.${self.rendering_params[field_name].type}`;
        choro_mini_choice_disc.html(
            `${_tr(keyi18n)}, ${_tr('app_page.common.class', { count: self.rendering_params[field_name].nb_class })}`);
        uncolor_icons();
        color_disc_icons(self.rendering_params[field_name].type);
      } else {
        prepare_disc_quantiles(field_name);
      }
    });

    ico_jenks.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_selec.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'jenks', n_class);
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'jenks',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: selected_field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.jenks')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      // ok_button.attr('disabled', null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_quantiles.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_selec.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'quantiles', n_class);
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'quantiles',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: selected_field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.quantiles')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      // ok_button.attr("disabled", null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_equal_interval.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_selec.node().value,
        _values = data_manager.user_data[layer].map(v => v[selected_field]),
        n_class = getOptNbClass(_values.length);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'equal_interval', n_class);
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'equal_interval',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: selected_field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.equal_interval')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      // ok_button.attr("disabled", null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    ico_q6.on('click', function () {
      uncolor_icons();
      this.style.border = 'solid 1px green';
      const selected_field = field_selec.node().value;
      const _values = data_manager.user_data[layer].map(v => v[selected_field]);
      const [nb_class, type, breaks, color_array, colors_map, no_data_color] = discretize_to_colors(_values, 'Q6', 6);
      self.rendering_params[selected_field] = {
        nb_class: nb_class,
        type: 'Q6',
        colors: color_array,
        breaks: breaks,
        no_data: no_data_color,
        colorsByFeature: colors_map,
        renderer: 'Choropleth',
        rendered_field: selected_field,
        schema: ['Reds'],
      };
      choro_mini_choice_disc.html(
        `${_tr('app_page.common.Q6')}, ${_tr('app_page.common.class', { count: nb_class })}`);
      // ok_button.attr("disabled", null);
      img_valid_disc.attr('src', '/static/img/Light_green_check.png');
    });

    btn_class.on('click', () => {
      const selected_field = field_selec.node().value,
        opt_nb_class = getOptNbClass(data_manager.user_data[layer].length);
      let conf_disc_box;

      if (self.rendering_params[selected_field]) {
        conf_disc_box = display_discretization(
          layer,
          selected_field,
          self.rendering_params[selected_field].nb_class,
          { schema: self.rendering_params[selected_field].schema,
            colors: self.rendering_params[selected_field].colors,
            type: self.rendering_params[selected_field].type,
            no_data: self.rendering_params[selected_field].no_data,
            breaks: self.rendering_params[selected_field].breaks,
            extra_options: self.rendering_params[selected_field].extra_options },
        );
      } else {
        conf_disc_box = display_discretization(
          layer,
          selected_field,
          opt_nb_class,
          { type: 'quantiles' },
        );
      }
      conf_disc_box.then((confirmed) => {
        if (confirmed) {
          // ok_button.attr("disabled", null);
          img_valid_disc.attr('src', '/static/img/Light_green_check.png');
          const keyi18n = `app_page.common.${confirmed[1]}`;
          choro_mini_choice_disc.html(
              `${_tr(keyi18n)}, ${_tr('app_page.common.class', { count: confirmed[0] })}`);
          uncolor_icons();
          color_disc_icons(confirmed[1]);
          self.rendering_params[selected_field] = {
            nb_class: confirmed[0],
            type: confirmed[1],
            breaks: confirmed[2],
            colors: confirmed[3],
            schema: confirmed[5],
            no_data: confirmed[6],
            colorsByFeature: confirmed[4],
            renderer: 'Choropleth',
            rendered_field: selected_field,
            new_name: '',
            extra_options: confirmed[7],
          };
        }
      });
    });

    ok_button.on('click', () => {
      const field_to_render = field_selec.node().value;
      if (self.rendering_params[field_to_render]) {
        const user_new_layer_name = uo_layer_name.node().value;
        self.rendering_params[field_to_render].new_name = check_layer_name(
          user_new_layer_name.length > 0 ? user_new_layer_name : ['Choro', field_to_render, layer].join('_'));
        render_choro(layer, self.rendering_params[field_to_render]);
        handle_legend(self.rendering_params[field_to_render].new_name);
        switch_accordion_section();
      }
    });
    setSelected(field_selec.node(), fields[0]);
  },

  unfill() {
    // const field_selec = document.getElementById('choro_field1'),
    //   nb_fields = field_selec.childElementCount;
    //
    // for (let i = nb_fields - 1; i > -1; --i) {
    //     // delete this.rendering_params[field_selec.children[i]];
    //   field_selec.removeChild(field_selec.children[i]);
    // }
    unfillSelectInput(document.getElementById('choro_field1'));
    d3.selectAll('.params').attr('disabled', true);
  },
  rendering_params: {},
};

const fields_Stewart = {
  fill (layer) {
    const other_layers = get_other_layer_names(),
      mask_selec = d3.select('#stewart_mask');
    let default_selected_mask;

    unfillSelectInput(mask_selec.node());
    mask_selec.append('option').text('None').attr('value', 'None');
    for (let i = 0, n_layer = other_layers.length, lyr_name; i < n_layer; i++) {
      lyr_name = other_layers[i];
      if (data_manager.current_layers[lyr_name].type === 'Polygon') {
        mask_selec.append('option').text(lyr_name).attr('value', lyr_name);
        if (data_manager.current_layers[lyr_name].targeted) {
          default_selected_mask = lyr_name;
        }
      }
    }
    if (default_selected_mask) {
      setSelected(mask_selec.node(), default_selected_mask);
    }
    if (layer) {
      const fields = getFieldsType('stock', layer),
        field_selec = section2.select('#stewart_field'),
        field_selec2 = section2.select('#stewart_field2');

      if (fields.length === 0) {
        display_error_num_field();
        return;
      }

      field_selec2.append('option').text(' ').attr('value', 'None');
      fields.forEach((field) => {
        field_selec.append('option').text(field).attr('value', field);
        field_selec2.append('option').text(field).attr('value', field);
      });
      document.getElementById('stewart_span').value = get_first_guess_span('stewart');

      field_selec.on('change', function () {
        document.getElementById('stewart_output_name').value = ['Smoothed', this.value, layer].join('_');
      });
      document.getElementById('stewart_output_name').value = ['Smoothed', fields[0], layer].join('_');
      section2.select('#stewart_yes')
        .on('click', render_stewart);
    }
    section2.selectAll('.params').attr('disabled', null);
  },

  unfill() {
    unfillSelectInput(document.getElementById('stewart_field'));
    unfillSelectInput(document.getElementById('stewart_field2'));
    unfillSelectInput(document.getElementById('stewart_mask'));
    d3.selectAll('.params').attr('disabled', true);
  },
};


function render_stewart() {
  const formToSend = new FormData(),
    doc = document,
    field1_n = doc.getElementById('stewart_field').value,
    field2_n = doc.getElementById('stewart_field2').value,
    var1_to_send = {},
    var2_to_send = {},
    layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    span = +doc.getElementById('stewart_span').value,
    beta = +doc.getElementById('stewart_beta').value,
    func_selec = doc.getElementById('stewart_func').value,
    mask_name = doc.getElementById('stewart_mask').value,
    new_user_layer_name = document.getElementById('stewart_output_name').value;

  let nb_class = doc.getElementById('stewart_nb_class').value,
    bval = doc.getElementById('stewart_breaks').value.trim(),
    reso = +doc.getElementById('stewart_resolution').value;

  if (nb_class !== (nb_class | 0)) { // eslint-disable-line
    nb_class = (nb_class | 0);  // eslint-disable-line
    doc.getElementById('stewart_nb_class').value = nb_class;
  }

  if (reso && reso > 0) {
    const res_test = test_maxmin_resolution(reso);
    if (res_test) {
      const message = res_test === 'low'
        ? _tr('app_page.common.error_too_low_resolution')
        : _tr('app_page.common.error_too_high_resolution');
      display_error_during_computation(message);
      return;
    }
    reso *= 1000;
  } else {
    reso = null;
  }
  bval = bval.length > 0 ? bval.split('-').map(val => +val.trim()) : null;

  var1_to_send[field1_n] = data_manager.current_layers[layer].original_fields.has(field1_n) ? []
    : data_manager.user_data[layer].map(i => +i[field1_n]);
  if (field2_n !== 'None') {
    var2_to_send[field2_n] = data_manager.current_layers[layer].original_fields.has(field2_n) ? []
      : data_manager.user_data[layer].map(i => +i[field2_n]);
  }

  formToSend.append('json', JSON.stringify({
    topojson: data_manager.current_layers[layer].key_name,
    variable1: var1_to_send,
    variable2: var2_to_send,
    span: span * 1000,
    beta: beta,
    typefct: func_selec,
    resolution: reso,
    nb_class: nb_class,
    user_breaks: bval,
    mask_layer: mask_name !== 'None' ? data_manager.current_layers[mask_name].key_name : '',
  }));

  xhrequest('POST', 'compute/stewart', formToSend, true)
    .then((res) => {
      const data_split = res.split('|||'),
        raw_topojson = data_split[0],
        options = { result_layer_on_add: true, func_name: 'smooth' };
      if (new_user_layer_name.length > 0) {
        options.choosed_name = new_user_layer_name;
      }
      const n_layer_name = add_layer_topojson(raw_topojson, options);
      if (!n_layer_name) return;
      const class_lim = JSON.parse(data_split[1]),
        col_pal = getColorBrewerArray(class_lim.min.length, 'Oranges'),
        n_class = class_lim.min.length,
        colors_breaks = [];
      for (let i = 0; i < n_class; i++) {
        colors_breaks.push([`${class_lim.min[i]} - ${class_lim.max[i]}`, col_pal[n_class - 1 - i]]);
      }

      data_manager.current_layers[n_layer_name].fill_color = { class: [] };
      data_manager.current_layers[n_layer_name].renderer = 'Stewart';
      data_manager.current_layers[n_layer_name].colors_breaks = colors_breaks;
      data_manager.current_layers[n_layer_name].rendered_field = field1_n;
      data_manager.current_layers[n_layer_name].color_palette = { name: 'Oranges', reversed: true };
      data_manager.current_layers[n_layer_name].options_disc = {
        breaks: [].concat(class_lim.max[0], class_lim.min).reverse(),
      };
      map.select(`#${_app.layer_to_id.get(n_layer_name)}`)
        .selectAll('path')
        .styles((d, i) => ({ fill: col_pal[n_class - 1 - i], 'fill-opacity': 1, 'stroke-opacity': 0 }));
      handle_legend(n_layer_name);
      switch_accordion_section();
      // Todo : use the function render_choro to render the result from stewart too
    }, (error) => {
      display_error_during_computation();
      console.log(error);
    }).catch((err) => {
      display_error_during_computation();
      console.log(err);
    });
}


function fillMenu_Stewart() {
  const dialog_content = make_template_functionnality(section2);

  const a = dialog_content.append('p').attr('class', 'params_section2');
  a.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.field' })
    .html(_tr('app_page.func_options.smooth.field'));
  a.append('select')
    .attrs({ class: 'params marg_auto', id: 'stewart_field' });

  const b = dialog_content.append('p')
    .attr('class', 'params_section2');
  b.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.divide_field' })
    .html(_tr('app_page.func_options.smooth.divide_field'));
  b.insert('select')
    .attrs({ class: 'params marg_auto', id: 'stewart_field2' });

  const p_span = dialog_content.append('p')
    .attr('class', 'params_section2');
  p_span.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.span' })
    .text(_tr('app_page.func_options.smooth.span'));
  p_span.append('input')
    .style('width', '60px')
    .attrs({ type: 'number', class: 'params', id: 'stewart_span', value: 5, min: 0, max: 100000, step: 'any' });
  p_span.append('span')
    .html(' (km)');

  const d = dialog_content.append('p')
    .attr('class', 'params_section2');
  d.append('span')
    .styles({ 'margin-right': '35px' })
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.beta' })
    .html(_tr('app_page.func_options.smooth.beta'));
  d.insert('input')
    .style('width', '60px')
    .attrs({ type: 'number', class: 'params', id: 'stewart_beta', value: 2, min: 0, max: 11, step: 'any' });

  const p_reso = dialog_content.append('p').attr('class', 'params_section2');
  p_reso.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.resolution' })
    .text(_tr('app_page.func_options.smooth.resolution'));
  p_reso.insert('input')
    .style('width', '60px')
    .attrs({ type: 'number', class: 'params', id: 'stewart_resolution', min: 1, max: 1000000, step: 'any' });
  p_reso.insert('label')
    .html(' (km)');

  const f = dialog_content.append('p').attr('class', 'params_section2');
  f.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.func_options' })
    .html(_tr('app_page.func_options.smooth.function'));
  const func_selec = f.insert('select')
    .attrs({ class: 'params i18n', id: 'stewart_func' });

  const g = dialog_content.append('p').attr('class', 'params_section2');
  g.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.nb_class' })
    .html(_tr('app_page.func_options.smooth.nb_class'));
  g.insert('input')
    .style('width', '50px')
    .attrs({ type: 'number', class: 'params', id: 'stewart_nb_class', value: 8, min: 1, max: 22, step: 1 });

  const bvs = dialog_content.append('p').attr('class', 'params_section2');
  bvs.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.break_values' })
    .html(_tr('app_page.func_options.smooth.break_values'));
  bvs.insert('textarea')
    .styles({ width: '100%', height: '2.2em', 'font-size': '0.9em' })
    .attrs({
      class: 'params i18n',
      id: 'stewart_breaks',
      'data-i18n': '[placeholder]app_page.common.expected_class',
      placeholder: _tr('app_page.common.expected_class'),
    });
  const m = dialog_content.append('p')
    .attr('class', 'params_section2');
  m.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.mask' })
    .html(_tr('app_page.func_options.common.mask'));

  m.insert('select')
    .attrs({ class: 'params mask_field', id: 'stewart_mask' });

  [
    ['exponential', 'app_page.func_options.smooth.func_exponential'],
    ['pareto', 'app_page.func_options.smooth.func_pareto'],
  ].forEach((fun_name) => {
    func_selec.append('option')
      .text(_tr(fun_name[1]))
      .attrs({ value: fun_name[0], 'data-i18n': `[text]${fun_name[1]}` });
  });

  make_layer_name_input(dialog_content, 'stewart_output_name');
  make_ok_button(dialog_content, 'stewart_yes', false);
  dialog_content.selectAll('.params').attr('disabled', true);
}

const fields_Anamorphose = {
  fill (layer) {
    if (!layer) return;
    const fields = getFieldsType('stock', layer),
      field_selec = section2.select('#Anamorph_field'),
      algo_selec = section2.select('#Anamorph_algo'),
      ok_button = section2.select('#Anamorph_yes');

    if (fields.length === 0) {
      display_error_num_field();
      return;
    }
    algo_selec.on('change', function () {
      if (this.value === 'olson') {
        section2.selectAll('.opt_dougenik').style('display', 'none');
        section2.selectAll('.opt_olson').style('display', undefined);
      } else if (this.value === 'dougenik') {
        section2.selectAll('.opt_olson').style('display', 'none');
        section2.selectAll('.opt_dougenik').style('display', undefined);
      }
    });
    section2.selectAll('.params').attr('disabled', null);
    fields.forEach((field) => {
      field_selec.append('option').text(field).attr('value', field);
    });

    field_selec.on('change', function () {
      const field_name = this.value,
        ref_value_field = document.getElementById('Anamorph_opt3');

      document.getElementById('Anamorph_output_name').value = ['Cartogram', this.value, layer].join('_');

      if (ref_value_field) {
        const max_val_field = max_fast(data_manager.user_data[layer].map(obj => +obj[field_name]));
        ref_value_field.setAttribute('max', max_val_field);
        ref_value_field.value = max_val_field;
      }
    });

    ok_button.on('click', () => {
      const algo = algo_selec.node().value,
        // nb_features = data_manager.user_data[layer].length,
        field_name = field_selec.node().value,
        new_user_layer_name = document.getElementById('Anamorph_output_name').value;

      if (algo === 'olson') {
        const nb_ft = data_manager.current_layers[layer].n_features;
        const dataset = data_manager.user_data[layer];

        // if (contains_empty_val(dataset.map(a => a[field_name]))) {
        //   discard_rendering_empty_val();
        //   return;
        // }

        const layer_select = document.getElementById(_app.layer_to_id.get(layer)).getElementsByTagName('path'),
          d_val = [],
          transform = [];

        for (let i = 0; i < nb_ft; ++i) {
          let val = +dataset[i][field_name];
          // We deliberatly use 0 if this is a missing value :
          if (isNaN(val) || !isFinite(val)) val = 0;
          d_val.push([i, val, +path.area(layer_select[i].__data__.geometry)]);
        }
        d_val.sort((a, b) => b[1] - a[1]);
        const ref = d_val[0][1] / d_val[0][2];
        d_val[0].push(1);

        for (let i = 0; i < nb_ft; ++i) {
          const val = d_val[i][1] / d_val[i][2];
          const scale = Msqrt(val / ref);
          d_val[i].push(scale);
        }
        d_val.sort((a, b) => a[0] - b[0]);
        const formToSend = new FormData();
        formToSend.append('json', JSON.stringify({
          topojson: data_manager.current_layers[layer].key_name,
          scale_values: d_val.map(ft => ft[3]),
          field_name: field_name,
        }));
        xhrequest('POST', 'compute/olson', formToSend, true)
          .then((result) => {
            const options = {
              choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['OlsonCartogram', field_name, layer].join('_')),
              func_name: 'cartogram',
              result_layer_on_add: true,
            };
            const n_layer_name = add_layer_topojson(result, options);
            data_manager.current_layers[n_layer_name].renderer = 'OlsonCarto';
            data_manager.current_layers[n_layer_name].rendered_field = field_name;
            data_manager.current_layers[n_layer_name].scale_max = 1;
            data_manager.current_layers[n_layer_name].ref_layer_name = layer;
            data_manager.current_layers[n_layer_name].scale_byFeature = transform;
            map.select(`#${_app.layer_to_id.get(n_layer_name)}`)
              .selectAll('path')
              .styles({
                stroke: 'black',
                'stroke-opacity': 0.8,
                'fill-opacity': 0.8,
              });
            switch_accordion_section();
          }, (err) => {
            display_error_during_computation();
            console.log(err);
          });
      } else if (algo === 'dougenik') {
        const formToSend = new FormData(),
          var_to_send = {},
          nb_iter = document.getElementById('Anamorph_dougenik_iterations').value;

        var_to_send[field_name] = [];
        if (!data_manager.current_layers[layer].original_fields.has(field_name)) {
          const table = data_manager.user_data[layer],
            to_send = var_to_send[field_name];
          for (let i = 0, i_len = table.length; i < i_len; ++i) {
            to_send.push(+table[i][field_name]);
          }
        }
        formToSend.append('json', JSON.stringify({
          topojson: data_manager.current_layers[layer].key_name,
          var_name: var_to_send,
          iterations: nb_iter,
        }));

        xhrequest('POST', 'compute/carto_doug', formToSend, true)
          .then((data) => {
            const options = {
              choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['Cartogram', field_name, layer].join('_')),
              func_name: 'cartogram',
              result_layer_on_add: true,
            };
            const n_layer_name = add_layer_topojson(data, options);
            data_manager.current_layers[n_layer_name].fill_color = { random: true };
            data_manager.current_layers[n_layer_name].is_result = true;
            data_manager.current_layers[n_layer_name]['stroke-width-const'] = 0.8;
            data_manager.current_layers[n_layer_name].renderer = 'Carto_doug';
            data_manager.current_layers[n_layer_name].rendered_field = field_name;
            map.select(`#${_app.layer_to_id.get(n_layer_name)}`)
              .selectAll('path')
              .style('fill', () => randomColor())
              .style('fill-opacity', 0.8)
              .style('stroke', 'black')
              .style('stroke-opacity', 0.8);
            switch_accordion_section();
          }, (error) => {
            display_error_during_computation();
            console.log(error);
          });
      }
    });
    setSelected(field_selec.node(), field_selec.node().options[0].value);
  },

  unfill() {
    const field_selec = document.getElementById('Anamorph_field');
    section2.selectAll('.params').attr('disabled', true);
    unfillSelectInput(field_selec);
  },
};


function fillMenu_Anamorphose() {
  const dialog_content = make_template_functionnality(section2);

  const algo_choice = dialog_content.append('p')
    .attr('class', 'params_section2');
  algo_choice.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.algo' })
    .html(_tr('app_page.func_options.cartogram.algo'));
  const algo_selec = algo_choice.insert('select')
    .attrs({ id: 'Anamorph_algo', class: 'params i18n' });

  const field_choice = dialog_content.append('p').attr('class', 'params_section2');
  field_choice.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.field' })
    .html(_tr('app_page.func_options.cartogram.field'));
  field_choice.insert('select')
    .attrs({ class: 'params', id: 'Anamorph_field' });

  // Options for Dougenik mode :
  const doug1 = dialog_content.append('p')
    .attr('class', 'params_section2 opt_dougenik');
  doug1.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.dougenik_iterations' })
    .html(_tr('app_page.func_options.cartogram.dougenik_iterations'));
  doug1.insert('input')
    .attrs({ type: 'number', class: 'params', value: 5, min: 1, max: 12, step: 1, id: 'Anamorph_dougenik_iterations' });

  [
    ['Dougenik & al. (1985)', 'dougenik'],
    ['Olson (2005)', 'olson'],
  ].forEach((fun_name) => {
    algo_selec.append('option').text(fun_name[0]).attr('value', fun_name[1]);
  });

  make_layer_name_input(dialog_content, 'Anamorph_output_name');
  make_ok_button(dialog_content, 'Anamorph_yes', false);

  dialog_content.selectAll('.params').attr('disabled', true);
  dialog_content.selectAll('.opt_olson').style('display', 'none');
}

function getCentroids(ref_layer_selection) {
  const centroids = [];
  for (let i = 0, nb_features = ref_layer_selection.length; i < nb_features; ++i) {
    const geom = ref_layer_selection[i].__data__.geometry;
    if (!geom) {
      centroids.push(null);
    } else if (geom.type.indexOf('Multi') < 0) {
      centroids.push(d3.geoCentroid(geom));
    } else {
      const areas = [];
      for (let j = 0; j < geom.coordinates.length; j++) {
        areas.push(path.area({
          type: geom.type,
          coordinates: [geom.coordinates[j]],
        }));
      }
      // const ix_max = areas.indexOf(max_fast(areas));
      centroids.push(d3.geoCentroid({
        type: geom.type,
        coordinates: [geom.coordinates[areas.indexOf(max_fast(areas))]],
      }));
    }
  }
  return centroids;
}

export function make_prop_line(rendering_params, geojson_line_layer) {
  const layer = rendering_params.ref_layer_name,
    field = rendering_params.field,
    color_field = rendering_params.color_field,
    t_field_name = 'prop_value',
    nb_features = rendering_params.nb_features,
    abs = Math.abs,
    ref_size = rendering_params.ref_size,
    ref_value = rendering_params.ref_value,
    symbol_type = rendering_params.symbol,
    layer_to_add = rendering_params.new_name,
    propSize = new PropSizer(ref_value, ref_size, symbol_type);

  if (!geojson_line_layer) {
    const make_geojson_line_layer = () => {
      const ref_layer_selection = document.getElementById(_app.layer_to_id.get(layer)).getElementsByTagName('path');
      const result = [];

      for (let i = 0, n_features = ref_layer_selection.length; i < n_features; ++i) {
        const ft = ref_layer_selection[i].__data__,
          value = +ft.properties[field];
        const new_obj = {
          id: i,
          type: 'Feature',
          properties: {},
          geometry: cloneObj(ft.geometry),
        };
        if (f_ix_len) {
          for (let f_ix = 0; f_ix < f_ix_len; f_ix++) {
            new_obj.properties[fields_id[f_ix]] = ft.properties[fields_id[f_ix]];
          }
        }
        new_obj.properties[field] = value;
        new_obj.properties[t_field_name] = propSize.scale(value);
        new_obj.properties.color = get_color(value, i);
        if (color_field) new_obj.properties[color_field] = ft.properties[color_field];
        result.push([value, new_obj]);
      }
      result.sort((a, b) => abs(b[0]) - abs(a[0]));
      return {
        type: 'FeatureCollection',
        features: result.map(d => d[1]),
      };
    };

    const fields_id = getFieldsType('id', layer).concat(getFieldsType('category', layer));
    const f_ix_len = fields_id ? fields_id.length : 0;
    let get_color,
      col1,
      col2;
    if (rendering_params.break_val !== undefined && rendering_params.fill_color.two) {
      col1 = rendering_params.fill_color.two[0];
      col2 = rendering_params.fill_color.two[1];
      get_color = (val) => (val > rendering_params.break_val ? col2 : col1);
    } else if (rendering_params.fill_color instanceof Array
                && rendering_params.fill_color.length === nb_features) {
      get_color = (_, ix) => rendering_params.fill_color[ix];
    } else {
      get_color = () => rendering_params.fill_color;
    }

    geojson_line_layer = make_geojson_line_layer();
  }
  const require_clip_path = (isInterrupted(_app.current_proj_name.toLowerCase())
    || _app.current_proj_name.toLowerCase().indexOf('conicconformal') > -1) ? 'url(#clip)' : null;
  const layer_id = encodeId(layer_to_add);
  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);
  data_manager.result_data[layer_to_add] = [];
  map.insert('g', '.legend')
    .attrs({ id: layer_id, class: 'layer', 'clip-path': require_clip_path })
    .styles({ 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    .selectAll('path')
    .data(geojson_line_layer.features)
    .enter()
    .append('path')
    .attr('d', path)
    .styles((d) => {
      data_manager.result_data[layer_to_add].push(d.properties);
      return {
        fill: 'transparent', stroke: d.properties.color, 'stroke-width': d.properties[t_field_name] };
    });

  data_manager.current_layers[layer_to_add] = {
    n_features: nb_features,
    renderer: rendering_params.renderer || 'PropSymbols',
    // symbol: symbol_type,
    symbol: 'path',
    rendered_field: field,
    size: [ref_value, ref_size],
    // "stroke-width-const": 1,
    is_result: true,
    ref_layer_name: layer,
    type: 'Line',
  };

  if (rendering_params.fill_color.two !== undefined) {
    data_manager.current_layers[layer_to_add].fill_color = cloneObj(rendering_params.fill_color);
  } else if (rendering_params.fill_color instanceof Array) {
    data_manager.current_layers[layer_to_add].fill_color = {
      class: geojson_line_layer.features.map(v => v.properties.color),
    };
  } else {
    data_manager.current_layers[layer_to_add].fill_color = { single: rendering_params.fill_color };
  }
  if (rendering_params.break_val !== undefined) {
    data_manager.current_layers[layer_to_add].break_val = rendering_params.break_val;
  }
  create_li_layer_elem(layer_to_add, nb_features, ['Line', 'prop'], 'result');
}


export function make_prop_symbols(rendering_params, _pt_layer) {
  const layer = rendering_params.ref_layer_name,
    field = rendering_params.field,
    color_field = rendering_params.color_field,
    t_field_name = 'prop_value',
    nb_features = rendering_params.nb_features,
    abs = Math.abs,
    ref_size = rendering_params.ref_size,
    ref_value = rendering_params.ref_value,
    symbol_type = rendering_params.symbol,
    layer_to_add = rendering_params.new_name,
    zs = d3.zoomTransform(svg_map).k,
    propSize = new PropSizer(ref_value, ref_size, symbol_type),
    warn_empty_features = [];
  let geojson_pt_layer;

  if (!_pt_layer) {
    const make_geojson_pt_layer = () => {
      const ref_layer_selection = document.getElementById(_app.layer_to_id.get(layer)).getElementsByTagName('path');
      const result = [];
      for (let i = 0, n_features = ref_layer_selection.length; i < n_features; ++i) {
        const ft = ref_layer_selection[i].__data__;
        const value = +ft.properties[field];
        const new_obj = {
          id: i,
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point' },
        };
        if (!ft.geometry) {
          warn_empty_features.push([i, ft]);
        } else if (ft.geometry.type.indexOf('Multi') < 0) {
          if (f_ix_len) {
            for (let f_ix = 0; f_ix < f_ix_len; f_ix++) {
              new_obj.properties[fields_id[f_ix]] = ft.properties[fields_id[f_ix]];
            }
          }
          new_obj.properties[field] = value;
          new_obj.properties[t_field_name] = propSize.scale(value);
          new_obj.geometry.coordinates = d3.geoCentroid(ft.geometry);
          new_obj.properties.color = get_color(value, i);
          if (color_field) new_obj.properties[color_field] = ft.properties[color_field];
          result.push([value, new_obj]);
        } else {
          const areas = [];
          for (let j = 0; j < ft.geometry.coordinates.length; j++) {
            areas.push(path.area({
              type: ft.geometry.type,
              coordinates: [ft.geometry.coordinates[j]],
            }));
          }
          const ix_max = areas.indexOf(max_fast(areas));
          if (f_ix_len) {
            for (let f_ix = 0; f_ix < f_ix_len; f_ix++) {
              new_obj.properties[fields_id[f_ix]] = ft.properties[fields_id[f_ix]];
            }
          }
          new_obj.properties[field] = value;
          new_obj.properties[t_field_name] = propSize.scale(value);
          new_obj.geometry.coordinates = d3.geoCentroid({
            type: ft.geometry.type, coordinates: [ft.geometry.coordinates[ix_max]] });
          new_obj.properties.color = get_color(value, i);
          if (color_field) new_obj.properties[color_field] = ft.properties[color_field];
          result.push([value, new_obj]);
        }
      }
      result.sort((a, b) => abs(b[0]) - abs(a[0]));
      return {
        type: 'FeatureCollection',
        features: result.map(d => d[1]),
      };
    };

    const fields_id = getFieldsType('id', layer).concat(getFieldsType('category', layer));
    const f_ix_len = fields_id ? fields_id.length : 0;
    let get_color,
      col1,
      col2;

    if (rendering_params.break_val !== undefined && rendering_params.fill_color.two) {
      col1 = rendering_params.fill_color.two[0];
      col2 = rendering_params.fill_color.two[1];
      get_color = (val) => (val > rendering_params.break_val ? col2 : col1);
    } else if (rendering_params.fill_color instanceof Array
        && rendering_params.fill_color.length === nb_features) {
      get_color = (_, ix) => rendering_params.fill_color[ix];
    } else {
      get_color = () => rendering_params.fill_color;
    }
    geojson_pt_layer = make_geojson_pt_layer();
  } else {
    geojson_pt_layer = _pt_layer;
  }

  const layer_id = encodeId(layer_to_add);
  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);
  data_manager.result_data[layer_to_add] = [];
  if (symbol_type === 'circle') {
    map.insert('g', '.legend')
      .attrs({ id: layer_id, class: 'layer no_clip' })
      .selectAll('circle')
      .data(geojson_pt_layer.features)
      .enter()
      .append('circle')
      .attrs((d, i) => {
        data_manager.result_data[layer_to_add].push(d.properties);
        return {
          id: ['PropSymbol_', i, ' feature_', d.id].join(''),
          r: d.properties[t_field_name],
          cx: path.centroid(d)[0],
          cy: path.centroid(d)[1],
        };
      })
      .styles(d => ({
        fill: d.properties.color,
        stroke: 'black',
        'stroke-width': 1 / zs,
      }))
      .call(drag_elem_geo2);
  } else if (symbol_type === 'rect') {
    map.insert('g', '.legend')
      .attrs({ id: layer_id, class: 'layer no_clip' })
      .selectAll('circle')
      .data(geojson_pt_layer.features)
      .enter()
      .append('rect')
      .attrs((d, i) => {
        const size = d.properties[t_field_name];
        data_manager.result_data[layer_to_add].push(d.properties);
        return {
          id: ['PropSymbol_', i, ' feature_', d.id].join(''),
          height: size,
          width: size,
          x: path.centroid(d)[0] - size / 2,
          y: path.centroid(d)[1] - size / 2,
        };
      })
      .styles(d => ({
        fill: d.properties.color,
        stroke: 'black',
        'stroke-width': 1 / zs,
      }))
      .call(drag_elem_geo2);
  }

  data_manager.current_layers[layer_to_add] = {
    n_features: nb_features,
    renderer: rendering_params.renderer || 'PropSymbols',
    symbol: symbol_type,
    rendered_field: field,
    size: [ref_value, ref_size],
    'stroke-width-const': 1,
    is_result: true,
    ref_layer_name: layer,
    draggable: false,
  };

  if (rendering_params.fill_color.two !== undefined) {
    data_manager.current_layers[layer_to_add].fill_color = cloneObj(rendering_params.fill_color);
  } else if (rendering_params.fill_color instanceof Array) {
    data_manager.current_layers[layer_to_add].fill_color = {
      class: geojson_pt_layer.features.map(v => v.properties.color),
    };
  } else {
    data_manager.current_layers[layer_to_add].fill_color = { single: rendering_params.fill_color };
  }
  if (rendering_params.break_val !== undefined) {
    data_manager.current_layers[layer_to_add].break_val = rendering_params.break_val;
  }
  create_li_layer_elem(layer_to_add, nb_features, ['Point', 'prop'], 'result');

  if (warn_empty_features.length > 0) {
    display_warning_empty_geom(warn_empty_features);
  }
}

export function render_categorical(layer, rendering_params) {
  let layer_name;
  if (rendering_params.new_name) {
    const fields = [].concat(getFieldsType('id', layer), rendering_params.rendered_field);
    copy_layer(layer, rendering_params.new_name, 'typo', fields);
    data_manager.current_layers[rendering_params.new_name].key_name = data_manager.current_layers[layer].key_name;
    data_manager.current_layers[rendering_params.new_name].type = data_manager.current_layers[layer].type;
    layer_name = rendering_params.new_name;
  } else {
    layer_name = layer;
  }

  const colorsByFeature = rendering_params.colorByFeature,
    color_map = rendering_params.color_map,
    field = rendering_params.rendered_field;
  const layer_to_render = map.select(`#${_app.layer_to_id.get(layer_name)}`);
  layer_to_render
    .style('opacity', 1)
    .style('stroke-width', `${0.75 / d3.zoomTransform(svg_map).k}px`);
  if (data_manager.current_layers[layer_name].type === 'Line') {
    layer_to_render.selectAll('path')
      .styles((_, i) => ({
        fill: 'transparent',
        stroke: colorsByFeature[i],
        'stroke-opacity': 1,
      }));
  } else {
    layer_to_render.selectAll('path')
      .styles((_, i) => ({
        fill: colorsByFeature[i],
        'fill-opacity': 0.9,
        stroke: '#000',
        'stroke-opacity': 0.9,
      }));
  }
  data_manager.current_layers[layer_name].renderer = rendering_params.renderer;
  data_manager.current_layers[layer_name].rendered_field = field;
  data_manager.current_layers[layer_name].fill_color = { class: rendering_params.colorByFeature };
  data_manager.current_layers[layer_name]['stroke-width-const'] = 0.75;
  data_manager.current_layers[layer_name].is_result = true;
  data_manager.current_layers[layer_name].color_map = color_map;
  zoom_without_redraw();
}

// Function to render the `layer` according to the `rendering_params`
// (layer should be the name of group of path, ie. not a PropSymbol layer)
// Currently used fo "choropleth", "MTA - relative deviations", "gridded map" functionnality
function render_choro(layer, rendering_params) {
  let layer_name;
  if (rendering_params.new_name) {
    const fields = [].concat(getFieldsType('id', layer), rendering_params.rendered_field);
    copy_layer(layer, rendering_params.new_name, 'choro', fields);
    // Assign the same key to the cloned layer so it could be used transparently on server side
    // after deletion of the reference layer if needed :
    data_manager.current_layers[rendering_params.new_name].key_name = data_manager.current_layers[layer].key_name;
    data_manager.current_layers[rendering_params.new_name].type = data_manager.current_layers[layer].type;
    layer_name = rendering_params.new_name;
  } else {
    layer_name = layer;
  }
  const breaks = rendering_params.breaks;
  const options_disc = {
    schema: rendering_params.schema,
    colors: rendering_params.colors,
    no_data: rendering_params.no_data,
    type: rendering_params.type,
    breaks: breaks,
    extra_options: rendering_params.extra_options,
  };
  const layer_to_render = map.select(`#${_app.layer_to_id.get(layer_name)}`);
  layer_to_render
    .style('opacity', 1)
    .style('stroke-width', `${0.75 / d3.zoomTransform(svg_map).k}px`);
  if (data_manager.current_layers[layer_name].type === 'Line') {
    layer_to_render
      .selectAll('path')
      .styles({ fill: 'transparent', 'stroke-opacity': 1 })
      .style('stroke', (d, i) => rendering_params.colorsByFeature[i]);
  } else {
    layer_to_render
      .selectAll('path')
      .styles({ 'fill-opacity': 1, 'stroke-opacity': 1, stroke: '#000' })
      .style('fill', (d, i) => rendering_params.colorsByFeature[i]);
  }
  data_manager.current_layers[layer_name].renderer = rendering_params.renderer;
  data_manager.current_layers[layer_name].rendered_field = rendering_params.rendered_field;
  data_manager.current_layers[layer_name].fill_color = { class: rendering_params.colorsByFeature };
  data_manager.current_layers[layer_name]['stroke-width-const'] = 0.75;
  data_manager.current_layers[layer_name].is_result = true;
  data_manager.current_layers[layer_name].options_disc = options_disc;
  const colors_breaks = [];
  for (let i = breaks.length - 1; i > 0; --i) {
    colors_breaks.push([
      [breaks[i - 1], ' - ', breaks[i]].join(''), rendering_params.colors[i - 1]]);
  }
  data_manager.current_layers[layer_name].colors_breaks = colors_breaks;
  zoom_without_redraw();
}

function render_mini_chart_serie(values, parent, max_h, nb_bins) {
  const bins = nb_bins || (values.length > 20 ? 16 : undefined) || (values.length > 15 ? 10 : 5);
  const class_count = getBinsCount(values, bins),
    background = '#f1f1f1',
    color = '#6633ff',
    width = 3 * bins - 3,
    height = 25,
    canvas = document.createElement('canvas');
  const cap = max_h || max_fast(class_count.counts);
  canvas.width = width;
  canvas.height = height;

  const old = parent.querySelector('canvas');
  if (old) old.remove();
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barwidth = 2;
  const barspace = 1;
  let x = 0;

  ctx.fillStyle = color;
  for (let i = 0; i < bins; i++) {
    const barheight = Math.floor(Mmin(class_count.counts[i] / cap, 1) * (height - 1));
    x += barspace;
    ctx.fillRect(x, height, barwidth, -barheight);
    x += barwidth;
  }
  canvas.setAttribute('tooltip-info', make_mini_summary(class_count));
  new Tooltip(canvas, {
    dataAttr: 'tooltip-info',
    animation: 'slideNfade',
    duration: 50,
    delay: 100,
    container: document.getElementById('twbs'),
    placement: 'top',
  });
}

function make_mini_summary(summary) {
  const p = Mmax(get_nb_decimals(summary.min), get_nb_decimals(summary.max));
  const props = {
    min: summary.min,
    max: summary.max,
    mean: summary.mean.toFixed(p),
    median: summary.median.toFixed(p),
    stddev: summary.stddev.toFixed(p),
  };
  return _tr('app_page.stat_summary.mini_summary', props);
}

function fillMenu_PropSymbolTypo() {
  const dv2 = make_template_functionnality(section2);

  const a = dv2.append('p')
    .attr('class', 'params_section2');
  a.append('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.field1' })
    .html(_tr('app_page.func_options.proptypo.field1'));
  a.insert('select')
    .attrs({ class: 'params', id: 'PropSymbolTypo_field_1' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const b = dv2.append('p').attr('class', 'params_section2');
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.fixed_size' })
    .html(_tr('app_page.func_options.proptypo.fixed_size'));
  b.insert('input')
    .attrs({
      type: 'number',
      class: 'params',
      id: 'PropSymbolTypo_ref_size',
      min: 0.1,
      max: 100.0,
      step: 'any',
    })
    .style('width', '50px')
    .property('value', 60.0);
  b.append('span').html(' (px)');

  const c = dv2.append('p').attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.on_value' })
    .html(_tr('app_page.func_options.proptypo.on_value'));
  c.insert('input')
    .styles({ width: '100px', 'margin-left': '10px' })
    .attrs({
      type: 'number', class: 'params', id: 'PropSymbolTypo_ref_value', min: 0.1, step: 0.1,
     });

  // Other symbols could probably easily be proposed :
  const d = dv2.append('p').attr('class', 'params_section2');
  d.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.symbol_type' })
    .html(_tr('app_page.func_options.proptypo.symbol_type'));
  d.insert('select')
    .attrs({ class: 'params', id: 'PropSymbolTypo_symbol_type' });

  const e = dv2.append('p')
    .attr('class', 'params_section2');
  e.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.field2' })
    .html(_tr('app_page.func_options.proptypo.field2'));
  e.insert('select')
    .attrs({ class: 'params', id: 'PropSymbolTypo_field_2' });

  const f = dv2.insert('p')
    .attr('class', 'params_section2')
    .styles({ margin: 'auto', 'text-align': 'center' });
  f.append('button')
    .attrs({
      id: 'Typo_class',
      class: 'button_disc params i18n',
      'data-i18n': '[html]app_page.func_options.typo.color_choice',
    })
    .styles({ 'font-size': '0.8em', 'text-align': 'center' })
    .html(_tr('app_page.func_options.typo.color_choice'));

  make_layer_name_input(dv2, 'PropSymbolTypo_output_name');
  make_ok_button(dv2, 'propTypo_yes');
  section2.selectAll('.params').attr('disabled', true);
}

export function prepare_categories_array(layer_name, selected_field, col_map) {
  const cats = [];
  if (!col_map) {
    let _col_map = new Map();
    for (let i = 0, data_layer = data_manager.user_data[layer_name]; i < data_layer.length; ++i) {
      const value = data_layer[i][selected_field],
        ret_val = _col_map.get(value);
      _col_map.set(value, ret_val ? [ret_val[0] + 1, [i].concat(ret_val[1])] : [1, [i]]);
    }
    _col_map.forEach((v, k) => {
      cats.push({ name: k, display_name: k, nb_elem: v[0], color: randomColor() });
    });
    _col_map = new Map();
    for (let i = 0; i < cats.length; i++) {
      _col_map.set(cats[i].name, [cats[i].color, cats[i].name, cats[i].nb_elem]);
    }
    return [cats, _col_map];
  }
  col_map.forEach((v, k) => {
    cats.push({ name: k, display_name: v[1], nb_elem: v[2], color: v[0] });
  });
  return [cats, col_map];
}

const askManyFeaturesCategorical = () => {
  return swal({
    title: '',
    text: _tr('app_page.common.error_too_many_features_color'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.valid')}!`,
    cancelButtonText: _tr('app_page.common.cancel'),
  });
}

const fields_PropSymbolTypo = {
  fill (layer) {
    if (!layer) return;
    section2.selectAll('.params').attr('disabled', null);
    const self = this,
      fields_num = getFieldsType('stock', layer),
      fields_categ = getFieldsType('category', layer),
      // nb_features = data_manager.user_data[layer].length,
      field1_selec = section2.select('#PropSymbolTypo_field_1'),
      field2_selec = section2.select('#PropSymbolTypo_field_2'),
      ref_value_field = section2.select('#PropSymbolTypo_ref_value'),
      ref_size = section2.select('#PropSymbolTypo_ref_size'),
      symb_selec = section2.select('#PropSymbolTypo_symbol_type'),
      uo_layer_name = section2.select('#PropSymbolTypo_output_name'),
      btn_typo_class = section2.select('#Typo_class'),
      ok_button = section2.select('#propTypo_yes');

    const prepare_colors = (field) => {
      const [_, col_map] = prepare_categories_array(layer, field, null);
      const nb_class = col_map.size;
      const colorByFeature = data_manager.user_data[layer].map(ft => col_map.get(ft[field])[0]);
      self.rendering_params[field] = {
        nb_class: nb_class,
        color_map: col_map,
        colorByFeature: colorByFeature,
        renderer: 'Categorical',
        rendered_field: field,
        skip_alert: false,
      };
    };

    if (fields_categ.length === 0 || fields_num.length === 0) {
      display_error_num_field();
      return;
    }

    if (data_manager.current_layers[layer].type === 'Line') {
      ref_size.attr('value', 10.0);
      [
        ['app_page.func_options.common.symbol_line', 'line'],
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    } else {
      ref_size.attr('value', 60.0);
      [
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    }

    fields_num.forEach((field) => {
      field1_selec.append('option').text(field).attr('value', field);
    });

    fields_categ.forEach((field) => {
      field2_selec.append('option').text(field).attr('value', field);
    });

    // Set some default colors in order to not force to open the box for selecting them :
    {
      const first_field = fields_categ[0];
      prepare_colors(first_field);
      ok_button.attr('disabled', self.rendering_params[first_field] ? null : true);
    }

    field1_selec.on('change', function () {
      const field_name = this.value,
        max_val_field = max_fast(data_manager.user_data[layer].map(obj => +obj[field_name]));
      ref_value_field.attrs({ max: max_val_field, value: max_val_field });
      uo_layer_name.attr('value', ['Typo', field_name, field2_selec.node().value, layer].join('_'));
    });

    field2_selec.on('change', function () {
      const field_name = this.value;
      prepare_colors(field_name);
      // ok_button.attr("disabled", self.rendering_params[field_name] ? null : true);
      uo_layer_name.attr('value', ['Typo', field1_selec.node().value, field_name, layer].join('_'));
    });

    btn_typo_class.on('click', () => {
      const selected_field = field2_selec.node().value,
        new_layer_name = check_layer_name(['Typo', field1_selec.node().value, selected_field, layer].join('_'));
      const col_map = self.rendering_params[selected_field]
        ? self.rendering_params[selected_field].color_map
        : undefined;
      const [cats, ] = prepare_categories_array(layer, selected_field, col_map);

      const fun = () => {
        display_categorical_box(data_manager.user_data[layer], layer, selected_field, cats)
          .then((confirmed) => {
            if (confirmed) {
              // ok_button.attr("disabled", null);
              self.rendering_params[selected_field] = {
                nb_class: confirmed[0],
                color_map: confirmed[1],
                colorByFeature: confirmed[2],
                renderer: 'Categorical',
                rendered_field: selected_field,
                new_name: new_layer_name,
                skip_alert: true,
              };
            }
          });
      };
      if (cats.length > 15) {
        askManyFeaturesCategorical().then(fun, () => null);
      } else {
        fun();
      }
    });

    ok_button.on('click', () => {
      const render = () => {
        render_PropSymbolTypo(
          field1_selec.node().value,
          field2_selec.node().value,
          uo_layer_name.node().value,
          ref_value_field.node().value,
          section2.select('#PropSymbolTypo_ref_size').node().value,
          section2.select('#PropSymbolTypo_symbol_type').node().value,
        );
      };
      const field_color = field2_selec.node().value;
      if (self.rendering_params[field_color].color_map.size > 15
              && !self.rendering_params[field_color].skip_alert) {
        askManyFeaturesCategorical().then(render, () => null);
      } else {
        render();
      }
    });
    setSelected(field1_selec.node(), fields_num[0]);
    setSelected(field2_selec.node(), fields_categ[0]);
  },

  unfill() {
    unfillSelectInput(document.getElementById('PropSymbolTypo_field_1'));
    unfillSelectInput(document.getElementById('PropSymbolTypo_field_2'));
    unfillSelectInput(document.getElementById('PropSymbolTypo_symbol_type'));
    section2.selectAll('.params').attr('disabled', true);
  },
  rendering_params: {},
};


function render_PropSymbolTypo(field1, color_field, n_layer_name, ref_value, ref_size, symb_selec) {
  if (!ref_value || !color_field || !fields_PropSymbolTypo.rendering_params[color_field]) {
    return;
  }
  const layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    nb_features = data_manager.user_data[layer].length,
    rendering_params = fields_PropSymbolTypo.rendering_params[color_field],
    rd_params = {};

  const new_layer_name = check_layer_name(n_layer_name.length > 0
    ? n_layer_name
    : ['PropSymbolsTypo', field1, color_field, layer].join('_'));

  rd_params.field = field1;
  rd_params.new_name = new_layer_name;
  rd_params.nb_features = nb_features;
  rd_params.ref_layer_name = layer;
  rd_params.symbol = symb_selec;
  rd_params.ref_value = +ref_value;
  rd_params.color_field = color_field;
  rd_params.ref_size = +ref_size;
  rd_params.fill_color = rendering_params.colorByFeature;

  if (symb_selec === 'line') {
    make_prop_line(rd_params);
  } else {
    make_prop_symbols(rd_params);
  }

  Object.assign(data_manager.current_layers[new_layer_name], {
    renderer: 'PropSymbolsTypo',
    rendered_field: field1,
    rendered_field2: color_field,
    color_map: rendering_params.color_map,
  });
  zoom_without_redraw();
  switch_accordion_section();
  handle_legend(new_layer_name);
}

function fillMenu_Discont() {
  const dv2 = make_template_functionnality(section2);

  const a = dv2.append('p')
    .attr('class', 'params_section2');
  a.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.field' })
    .html(_tr('app_page.func_options.discont.field'));
  a.insert('select')
    .attrs({ class: 'params', id: 'field_Discont' });

  // let b = dv2.append('p').attr('class', 'params_section2');
  // b.append('span')
  //   .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.id_field'})
  //   .html(_tr('app_page.func_options.discont.id_field'));
  // b.insert('select')
  //   .attrs({class: 'params', id: 'field_id_Discont'});

  const c = dv2.append('p').attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.type_discontinuity' })
    .html(_tr('app_page.func_options.discont.type_discontinuity'));
  const discontinuity_type = c.insert('select')
    .attrs({ class: 'params i18n', id: 'kind_Discont' });

  [
    ['app_page.func_options.discont.type_relative', 'rel'],
    ['app_page.func_options.discont.type_absolute', 'abs'],
  ].forEach((k) => {
    discontinuity_type.append('option')
      .text(_tr(k[0]))
      .attrs({ value: k[1], 'data-i18n': `[text]${k[0]}` });
  });

  // let d = dv2.append('p').attr('class', 'params_section2');
  // d.append('span')
  //   .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.nb_class'})
  //   .html(_tr('app_page.func_options.discont.nb_class'));
  // d.insert('input')
  //   .attrs({type: 'number', class: 'params', id: 'Discont_nbClass', min: 1, max: 33, value: 4})
  //   .style('width', '50px');

  const e = dv2.append('p').attr('class', 'params_section2');
  e.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.discretization' })
    .html(_tr('app_page.func_options.discont.discretization'));
  const disc_type = e.insert('select')
    .attrs({ class: 'params i18n', id: 'Discont_discKind' });

  [
    ['app_page.common.equal_interval', 'equal_interval'],
    ['app_page.common.quantiles', 'quantiles'],
    ['app_page.common.Q6', 'Q6'],
    ['app_page.common.jenks', 'jenks'],
  ].forEach((field) => {
    disc_type.append('option')
      .text(_tr(field[0]))
      .attrs({ value: field[1], 'data-i18n': `[text]${field[0]}` });
  });

  const f = dv2.append('p').attr('class', 'params_section2');
  f.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.color' })
    .html(_tr('app_page.func_options.discont.color'));
  f.insert('input')
    .attrs({ class: 'params', id: 'color_Discont', type: 'color', value: ColorsSelected.random() });

  make_layer_name_input(dv2, 'Discont_output_name');
  make_ok_button(dv2, 'yes_Discont', false);

  dv2.selectAll('.params').attr('disabled', true);
}

const fields_Discont = {
  fill (layer) {
    if (!layer) return;
    const fields_num = getFieldsType('stock', layer).concat(getFieldsType('ratio', layer)),
      // fields_id = getFieldsType('id', layer),
      select_type_discont = section2.select('#kind_Discont'),
      field_discont = section2.select('#field_Discont'),
      // field_id = section2.select("#field_id_Discont"),
      ok_button = section2.select('#yes_Discont');

    if (fields_num.length === 0) {
      display_error_num_field();
      return;
    }

    select_type_discont.on('change', function () {
      const field_name = field_discont.node().value;
      document.getElementById('Discont_output_name').value = ['Disc', field_name, this.value, layer].join('_');
    });

    fields_num.forEach((field) => {
      field_discont.append('option').text(field).attr('value', field);
    });
    // if (fields_id.length == 0) {
    //     field_id.append("option")
    //        .text(_tr("app_page.common.default"))
    //        .attrs({"value": "__default__", "class": "i18n",
    //                "data-i18n": "[text]app_page.common.default"});
    // } else {
    //   fields_id.forEach(function(field) {
    //       field_id.append("option").text(field).attr("value", field);
    //   });
    // }
    field_discont.on('change', function () {
      const discontinuity_type = document.getElementById('kind_Discont').value;
      document.getElementById('Discont_output_name').value = ['Disc', this.value, discontinuity_type, layer].join('_');
    });
    ok_button.on('click', render_discont);
    section2.selectAll('.params').attr('disabled', null);
    document.getElementById('Discont_output_name').value = ['Disc', field_discont.node().value, select_type_discont.node().value, layer].join('_');
  },
  unfill() {
    unfillSelectInput(document.getElementById('field_Discont'));
    // unfillSelectInput(document.getElementById("field_id_Discont"));
    section2.selectAll('.params').attr('disabled', true);
  },
};

const render_discont = function () {
  const layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    field = document.getElementById('field_Discont').value,
    // field_id = document.getElementById("field_id_Discont").value,
    min_size = 1,
    max_size = 10,
    discontinuity_type = document.getElementById('kind_Discont').value,
    discretization_type = document.getElementById('Discont_discKind').value,
    nb_class = 4,
    user_color = document.getElementById('color_Discont').value;
  let new_layer_name = document.getElementById('Discont_output_name').value;

  new_layer_name = check_layer_name(new_layer_name.length > 0 ? new_layer_name : ['Disc', field, discontinuity_type, layer].join('_'));

  const id_layer = encodeId(new_layer_name);
  _app.layer_to_id.set(new_layer_name, id_layer);
  _app.id_to_layer.set(id_layer, new_layer_name);


  // This is the "id" field used to make a new id for the discontinuity line
  // created in this function (by taking the id of the two nearby feature).
  // We don't let the user choose it anymore but we might change that
  // it just stay as 'undefined' for now:
  const field_id = undefined;
  // field_id = field_id == "__default__" ? undefined : field_id;

  const topo_to_use = _target_layer_file;

  _app.waitingOverlay.display();

  // Discontinuity are computed in another thread to avoid blocking the ui
  // (a waiting message is displayed during this time to avoid action from the user)
  const discont_worker = new Worker('static/dist/webworker_discont.js');
  _app.webworker_to_cancel = discont_worker;
  discont_worker.postMessage(
    [topo_to_use, layer, field, discontinuity_type, discretization_type, field_id]);
  discont_worker.onmessage = function (e) {
    const [arr_tmp, d_res] = e.data;
    _app.webworker_to_cancel = undefined;
    const nb_ft = arr_tmp.length,
      step = (max_size - min_size) / (nb_class - 1),
      class_size = Array(nb_class).fill(0).map((d, i) => min_size + (i * step));

    let [, , breaks, serie] = discretize_to_size(
      arr_tmp, discretization_type, nb_class, min_size, max_size);
    if (!serie || !breaks) {
      const opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft));
      const w = nb_class > opt_nb_class ? _tr('app_page.common.smaller') : _tr('app_page.common.larger');
      swal('', _tr('app_page.common.error_discretization', { arg: w }), 'error');
      return;
    }
    const require_clip_path = (isInterrupted(_app.current_proj_name.toLowerCase())
      || _app.current_proj_name.toLowerCase().indexOf('conicconformal') > -1) ? 'url(#clip)' : null;
    breaks = breaks.map(ft => [ft[0], ft[1]]).filter(d => d[1] !== undefined);

    data_manager.result_data[new_layer_name] = [];

    const result_layer = map.insert('g', '.legend')
      .attrs({
        id: id_layer,
        class: 'layer',
        'clip-path': require_clip_path,
      })
      .styles({
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      });

    const data_result = data_manager.result_data[new_layer_name];

    for (let i = 0; i < nb_ft; i++) {
      const val = d_res[i][0];
      const p_size = class_size[serie.getClass(val)];
      const elem = result_layer.append('path')
        .datum(d_res[i][2])
        .attrs({ d: path, id: ['feature', i].join('_') })
        .styles({ stroke: user_color, 'stroke-width': p_size, fill: 'transparent', 'stroke-opacity': 1 });
      const elem_data = elem.node().__data__;
      data_result.push(d_res[i][1]);
      elem_data.geometry = d_res[i][2];
      elem_data.properties = data_result[i];
      elem_data.properties.prop_val = p_size;
    }

    data_manager.current_layers[new_layer_name] = {
      renderer: 'DiscLayer',
      breaks: breaks,
      min_display: 0, // FIXME
      type: 'Line',
      rendered_field: field,
      size: [0.5, 10],
      is_result: true,
      fixed_stroke: true,
      ref_layer_name: layer,
      fill_color: { single: user_color },
      n_features: nb_ft,
    };
    create_li_layer_elem(new_layer_name, nb_ft, ['Line', 'discont'], 'result');

    _app.waitingOverlay.hide();

    { // Only display the 50% most important values :
      // TODO : reintegrate this upstream in the layer creation :
      const lim = 0.5 * data_manager.current_layers[new_layer_name].n_features;
      result_layer.selectAll('path').style('display', (_, i) => (i <= lim ? null : 'none'));
      data_manager.current_layers[new_layer_name].min_display = 0.5;
    }

    d3.select('#layer_to_export').append('option').attr('value', new_layer_name).text(new_layer_name);
    zoom_without_redraw();
    switch_accordion_section();
    handle_legend(new_layer_name);
    send_layer_server(new_layer_name, '/layers/add');
    discont_worker.terminate();
  };
};

function fillMenu_PropSymbol() {
  const dialog_content = make_template_functionnality(section2),
    max_allowed_size = Mround(h / 2 - h / 10);

  const a = dialog_content.append('p')
    .attr('class', 'params_section2');
  a.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field' })
    .html(_tr('app_page.func_options.common.field'));
  a.insert('select')
    .attrs({ class: 'params', id: 'PropSymbol_field_1' });

  const b = dialog_content.append('p').attr('class', 'params_section2');
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.fixed_size' })
    .html(_tr('app_page.func_options.prop.fixed_size'));
  b.insert('input')
    .attrs({
      id: 'PropSymbol_ref_size',
      type: 'number',
      class: 'params',
      min: 0.2,
      max: max_allowed_size,
      step: 0.1,
    })
    .style('width', '50px')
    .property('value', 60.0);
  b.append('span').html(' px');

  const c = dialog_content.append('p').attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.on_value' })
    .html(_tr('app_page.func_options.prop.on_value'));
  c.insert('input')
    .styles({ width: '100px', 'margin-left': '10px' })
    .attrs({ id: 'PropSymbol_ref_value', type: 'number', class: 'params', min: 0.1, step: 0.1 });

  const d = dialog_content.append('p').attr('class', 'params_section2');
  d.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.symbol_type' })
    .html(_tr('app_page.func_options.prop.symbol_type'));
  d.insert('select')
    .attrs({ class: 'params i18n', id: 'PropSymbol_symbol' });

  // [['app_page.func_options.common.symbol_circle', 'circle'],
  //  ['app_page.func_options.common.symbol_square', 'rect']
  // ].forEach(function(symb) {
  //     symb_selec.append("option")
  //       .text(_tr(symb[0])).attrs({"value": symb[1], 'data-i18n': `[text]${symb[0]}`});});

  const color_section = dialog_content.append('p').attr('class', 'params_section2');
  color_section.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.symbol_color' })
    .html(_tr('app_page.func_options.prop.symbol_color'));
  const color_par = color_section.append('select')
    .attrs({ id: 'PropSymbol_nb_colors', class: 'params' });
  color_par.append('option')
    .attrs({ value: 1, class: 'i18n', 'data-i18n': '[text]app_page.func_options.prop.options_one_color' })
    .text(_tr('app_page.func_options.prop.options_one_color'));
  color_par.append('option')
    .attrs({ value: 2, class: 'i18n', 'data-i18n': '[text]app_page.func_options.prop.options_two_colors' })
    .text(_tr('app_page.func_options.prop.options_two_colors'));

  const col_p = dialog_content.append('p')
    .attr('class', 'params_section2')
    .styles({ 'padding-top': '5px', 'margin-bottom': '-5px', 'text-align': 'center' });
  col_p.insert('input')
    .styles({ position: 'unset' })
    .attrs({ type: 'color', class: 'params', id: 'PropSymbol_color1' })
    .property('value', ColorsSelected.random());
  col_p.insert('input')
    .styles({ display: 'none', position: 'unset' })
    .attrs({ type: 'color', class: 'params', id: 'PropSymbol_color2' })
    .property('value', ColorsSelected.random());

  const col_b = dialog_content.insert('p').attr('class', 'params_section2');
  col_b.insert('span')
    .style('display', 'none')
    .attrs({ id: 'PropSymbol_color_txt', class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.options_break_two_colors' })
    .html(_tr('app_page.func_options.prop.options_break_two_colors'));
  col_b.insert('input')
    .attrs({ id: 'PropSymbol_break_val', type: 'number', class: 'params' })
    .styles({ display: 'none', width: '75px' });

  make_layer_name_input(dialog_content, 'PropSymbol_output_name');
  make_ok_button(dialog_content, 'PropSymbol_yes', false);
  dialog_content.selectAll('.params').attr('disabled', true);
}

const fields_PropSymbol = {
  fill (layer) {
    if (!layer) return;
    section2.selectAll('.params').attr('disabled', null);
    const fields = getFieldsType('stock', layer),
      nb_features = data_manager.user_data[layer].length,
      field_selec = section2.select('#PropSymbol_field_1'),
      nb_color = section2.select('#PropSymbol_nb_colors'),
      ok_button = section2.select('#PropSymbol_yes'),
      ref_value_field = section2.select('#PropSymbol_ref_value'),
      ref_size = section2.select('#PropSymbol_ref_size'),
      symb_selec = section2.select('#PropSymbol_symbol'),
      uo_layer_name = section2.select('#PropSymbol_output_name'),
      fill_color = section2.select('#PropSymbol_color1'),
      fill_color2 = section2.select('#PropSymbol_color2'),
      fill_color_opt = section2.select('#PropSymbol_break_val'),
      fill_color_text = section2.select('#PropSymbol_color_txt');

    if (data_manager.current_layers[layer].type === 'Line') {
      ref_size.attr('value', 10.0);
      [
        ['app_page.func_options.common.symbol_line', 'line'],
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    } else {
      ref_size.attr('value', 60.0);
      [
        ['app_page.func_options.common.symbol_circle', 'circle'],
        ['app_page.func_options.common.symbol_square', 'rect'],
      ].forEach((symb) => {
        symb_selec.append('option')
          .text(_tr(symb[0]))
          .attrs({ value: symb[1], 'data-i18n': `[text]${symb[0]}` });
      });
    }

    fields.forEach((field) => {
      field_selec.append('option')
        .text(field)
        .attr('value', field);
    });

    field_selec.on('change', function () {
      const field_name = this.value,
        field_values = data_manager.user_data[layer].map(obj => +obj[field_name]),
        max_val_field = max_fast(field_values);
      uo_layer_name.attr('value', ['PropSymbol', this.value, layer].join('_'));
      ref_value_field.attrs({ max: max_val_field, value: max_val_field });
      if (has_negative(field_values)) {
        setSelected(nb_color.node(), 2);
        fill_color_opt.attr('value', 0);
      } else {
        setSelected(nb_color.node(), 1);
      }
    });

    nb_color.on('change', function () {
      if (+this.value === 1) {
        fill_color2.style('display', 'none');
        fill_color_opt.style('display', 'none');
        fill_color_text.style('display', 'none');
      } else {
        fill_color2.style('display', null);
        fill_color_opt.style('display', null);
        fill_color_text.style('display', 'inline');
      }
    });

    ok_button.on('click', () => {
      const field_to_render = field_selec.node().value,
        symbol_to_use = symb_selec.node().value,
        user_new_layer_name = uo_layer_name.node().value,
        new_layer_name = check_layer_name(
          user_new_layer_name.length > 0 ? user_new_layer_name : ['PropSymbols', field_to_render, layer].join('_'));
      const rendering_params = {
        field: field_to_render,
        nb_features: nb_features,
        new_name: new_layer_name,
        ref_layer_name: layer,
        symbol: symbol_to_use,
        ref_size: +ref_size.node().value,
        ref_value: +ref_value_field.node().value,
        fill_color: fill_color.node().value,
      };

      if (+nb_color.node().value === 2) {
        rendering_params.break_val = +fill_color_opt.node().value;
        rendering_params.fill_color = { two: [fill_color.node().value, fill_color2.node().value] };
      }
      if (symbol_to_use === 'line') {
        make_prop_line(rendering_params);
      } else {
        make_prop_symbols(rendering_params);
      }
      zoom_without_redraw();
      switch_accordion_section();
      handle_legend(new_layer_name);
    });
    uo_layer_name.attr('value', ['PropSymbols', layer].join('_'));
    setSelected(field_selec.node(), fields[0]);
  },

  unfill() {
    unfillSelectInput(document.getElementById('PropSymbol_field_1'));
    unfillSelectInput(document.getElementById('PropSymbol_symbol'));
    section2.selectAll('.params').attr('disabled', true);
  },
};

function fillMenu_TypoSymbol() {
  const dv2 = make_template_functionnality(section2);
  const a = dv2.append('p').attr('class', 'params_section2');
  a.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.typosymbol.field' })
    .html(_tr('app_page.func_options.typosymbol.field'));
  a.insert('select')
    .attrs({ class: 'params', id: 'field_Symbol' });

  const b = dv2.insert('p')
    .attr('class', 'params_section2')
    .styles({ 'text-align': 'center', margin: 'auto' });
  b.append('button')
    .attrs({
      id: 'selec_Symbol',
      class: 'button_disc params i18n',
      'data-i18n': '[html]app_page.func_options.typosymbol.symbols_choice',
    })
    .styles({ 'font-size': '0.8em', 'text-align': 'center' })
    .html(_tr('app_page.func_options.typosymbol.symbols_choice'));

  make_layer_name_input(dv2, 'TypoSymbols_output_name');
  make_ok_button(dv2, 'yesTypoSymbols');
  dv2.selectAll('.params').attr('disabled', true);
  if (!(_app.default_symbols) || _app.default_symbols.length === 0) {
    _app.default_symbols = [];
    prepare_available_symbols();
  }
}

function discard_rendering_empty_val() {
  swal({
    title: '',
    type: 'error',
    text: _tr('app_page.common.error_empty_vals'),
  });
}

const fields_TypoSymbol = {
  fill (layer) {
    if (!layer) return;
    const fields_all = Object.getOwnPropertyNames(data_manager.user_data[layer][0]),
      field_to_use = section2.select('#field_Symbol'),
      selec_symbol = section2.select('#selec_Symbol'),
      uo_layer_name = section2.select('#TypoSymbols_output_name'),
      ok_button = section2.select('#yesTypoSymbols'),
      self = this;

    section2.selectAll('.params').attr('disabled', null);
    fields_all.forEach((field) => {
      field_to_use.append('option')
        .text(field)
        .attr('value', field);
    });
    field_to_use.on('change', function () {
      const field = this.value;
      ok_button.attr('disabled', self.rendering_params[field] ? null : true);
    });
    selec_symbol.on('click', () => {
      swal({
        title: '',
        text: _tr('app_page.common.error_too_many_features'),
        type: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: `${_tr('app_page.common.valid')}!`,
        cancelButtonText: _tr('app_page.common.cancel'),
      }).then(() => {
        const field = document.getElementById('field_Symbol').value;
        const symbol_map = self.rendering_params[field]
          ? self.rendering_params[field].symbols_map
          : undefined;
        display_box_symbol_typo(layer, field, symbol_map).then((confirmed) => {
          if (confirmed) {
            document.getElementById('yesTypoSymbols').disabled = null;
            self.rendering_params[field] = {
              nb_cat: confirmed[0],
              symbols_map: confirmed[1],
              field: field,
            };
          }
        });
      }, () => null);
    });
    ok_button.on('click', () => {
      const field = field_to_use.node().value;
      render_TypoSymbols(self.rendering_params[field], uo_layer_name.node().value);
    });
    setSelected(field_to_use.node(), fields_all[0]);
    uo_layer_name.attr('value', ['Symbols', layer].join('_'));
  },
  unfill() {
    unfillSelectInput(document.getElementById('field_Symbol'));
    section2.selectAll('.params').attr('disabled', true);
  },
  rendering_params: {},
};

function render_TypoSymbols(rendering_params, new_name) {
  const layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
  const ref_layer_id = _app.layer_to_id.get(layer_name);
  const field = rendering_params.field;
  const layer_to_add = check_layer_name(new_name.length > 0 ? new_name : ['Symbols', field, layer_name].join('_'));
  const ref_selection = document.getElementById(ref_layer_id).getElementsByTagName('path');
  const nb_ft = ref_selection.length;

  function make_geojson_pt_layer() {
    const result = [];
    for (let i = 0, nb_features = ref_selection.length; i < nb_features; ++i) {
      const ft = ref_selection[i].__data__;
      const value = ft.properties[field];
      const new_obj = {
        id: i,
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point' },
      };
      if (ft.geometry.type.indexOf('Multi') < 0) {
        new_obj.properties.symbol_field = value;
        new_obj.properties.id_parent = ft.id;
        new_obj.geometry.coordinates = d3.geoCentroid(ft.geometry);
        result.push(new_obj);
      } else {
        const areas = [];
        for (let j = 0; j < ft.geometry.coordinates.length; j++) {
          areas.push(path.area({
            type: ft.geometry.type,
            coordinates: [ft.geometry.coordinates[j]],
          }));
        }
        const ix_max = areas.indexOf(max_fast(areas));
        new_obj.properties.symbol_field = value;
        new_obj.properties.id_parent = ft.id;
        new_obj.geometry.coordinates = d3.geoCentroid({
          type: ft.geometry.type, coordinates: [ft.geometry.coordinates[ix_max]] });
        result.push(new_obj);
      }
    }
    return {
      type: 'FeatureCollection',
      features: result,
    };
  }

  const new_layer_data = make_geojson_pt_layer();
  const layer_id = encodeId(layer_to_add);
  const context_menu = new ContextMenu();
  const getItems = self_parent => [
    { name: _tr('app_page.common.edit_style'), action: () => { make_style_box_indiv_symbol(self_parent); } },
    { name: _tr('app_page.common.delete'), action: () => { self_parent.style.display = 'none'; } }, // eslint-disable-line no-param-reassign
  ];

  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);

  map.insert('g', '.legend')
    .attrs({ id: layer_id, class: 'layer no_clip' })
    .selectAll('image')
    .data(new_layer_data.features)
    .enter()
    .insert('image')
    .attrs((d) => {
      const symb = rendering_params.symbols_map.get(d.properties.symbol_field),
        coords = path.centroid(d.geometry);
      return {
        x: coords[0] - symb[1] / 2,
        y: coords[1] - symb[1] / 2,
        width: symb[1],
        height: symb[1],
        'xlink:href': symb[0],
      };
    })
    .on('mouseover', function () { this.style.cursor = 'pointer'; })
    .on('mouseout', function () { this.style.cursor = 'initial'; })
    .on('contextmenu dblclick', function () {
      context_menu.showMenu(d3.event, document.querySelector('body'), getItems(this));
    })
    .call(drag_elem_geo);

  data_manager.current_layers[layer_to_add] = {
    n_features: data_manager.current_layers[layer_name].n_features,
    renderer: 'TypoSymbols',
    symbols_map: rendering_params.symbols_map,
    rendered_field: field,
    is_result: true,
    symbol: 'image',
    ref_layer_name: layer_name,
  };
  create_li_layer_elem(layer_to_add, nb_ft, ['Point', 'symbol'], 'result');
  handle_legend(layer_to_add);
  zoom_without_redraw();
  switch_accordion_section();
}

function fillMenu_griddedMap() {
  const dialog_content = make_template_functionnality(section2);

  const sectiontypemap = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point')
    .style('display', 'none');

  sectiontypemap.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.map_type' })
    .html(_tr('app_page.func_options.grid.map_type'));

  const map_type = sectiontypemap.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_map_type' });

  const ee = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point')
    .style('display', 'none');

  ee.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.mesh_type' })
    .html(_tr('app_page.func_options.grid.mesh_type'));

  const mesh_type = ee.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_mesh_type' });

  const e = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point')
    .style('display', 'none');

  e.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.func' })
    .html(_tr('app_page.func_options.grid.func'));

  const grid_func_ratio = e.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_func_ratio' });

  const grid_func_stock = e.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_func_stock' });

  const aa = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point opt_field')
    .styles({ 'margin-top': '2px', display: 'none' });

  aa.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field' })
    .html(_tr('app_page.func_options.common.field'));

  aa.insert('select')
    .attrs({ class: 'params field_to_use', id: 'Gridded_field_pt' });

  const gg = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point opt_user_layer')
    .style('display', 'none');

  gg.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.user_polygon_layer' })
    .html(_tr('app_page.func_options.grid.user_polygon_layer'));

  gg.insert('select')
    .attrs({ class: 'params mask_field', id: 'Gridded_polygon_layer' });

  const bb = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point opt_grid')
    .styles({ display: 'none', margin: '35px 0 0 0' });

  bb.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.cellsize' })
    .html(_tr('app_page.func_options.grid.cellsize'));

  bb.insert('input')
    .style('width', '100px')
    .attrs({
      type: 'number',
      class: 'params',
      id: 'Gridded_cellsize_pt',
      min: 1.000,
      max: 7000,
      step: 'any'
    })
    .property('value', 10.0);

  const cc = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point opt_grid')
    .style('display', 'none');
  cc.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.shape' })
    .html(_tr('app_page.func_options.grid.shape'));

  const grid_shape_pt = cc.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_shape_pt' });

  const f = dialog_content.append('p')
    .attr('class', 'params_section2 opt_point opt_grid')
    .styles({
      display: 'none',
      'padding-top': '10px',
    });

  f.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.mask' })
    .html(_tr('app_page.func_options.common.mask'));

  f.insert('select')
    .attrs({ class: 'params mask_field', id: 'Gridded_mask' });

  [
    ['app_page.func_options.grid.type_stock', 'stock'],
    ['app_page.func_options.grid.type_ratio', 'ratio'],
  ].forEach((_t) => {
    map_type.append('option')
      .text(_tr(_t[0]))
      .attrs({ value: _t[1], 'data-i18n': `[text]${_t[0]}` });
  });

  [
    ['app_page.func_options.grid.user_polygons', 'user_polygons'],
    ['app_page.func_options.grid.regular_grid', 'regular_grid'],
  ].forEach((_f) => {
    mesh_type.append('option')
      .text(_tr(_f[0]))
      .attrs({ value: _f[1], 'data-i18n': `[text]${_f[0]}` });
  });

  [
    ['app_page.func_options.grid.density_count', 'density_count'],
    ['app_page.func_options.grid.density_weighted', 'density_weighted'],
    ['app_page.func_options.grid.mean', 'mean'],
    ['app_page.func_options.grid.stddev', 'stddev'],
  ].forEach((_f) => {
    grid_func_ratio.append('option')
      .text(_tr(_f[0]))
      .attrs({ value: _f[1], 'data-i18n': `[text]${_f[0]}` })
      .property('disabled', _f[2]);
  });

  [
    ['app_page.func_options.grid.stock_count', 'count'],
    ['app_page.func_options.grid.stock_weighted', 'weighted'],
  ].forEach((_f) => {
    grid_func_stock.append('option')
      .text(_tr(_f[0]))
      .attrs({ value: _f[1], 'data-i18n': `[text]${_f[0]}` })
      .property('disabled', _f[2]);
  });

  const a = dialog_content.append('p')
    .attr('class', 'params_section2 opt_polygon')
    .style('margin-top', '9px');

  a.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field' })
    .html(_tr('app_page.func_options.common.field'));

  a.insert('select')
    .attrs({ class: 'params field_to_use', id: 'Gridded_field' });

  const b = dialog_content.append('p')
    .attr('class', 'params_section2 opt_polygon')
    .style('margin', '35px 0 0 0');
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.cellsize' })
    .html(_tr('app_page.func_options.grid.cellsize'));
  b.insert('input')
    .style('width', '100px')
    .attrs({
      type: 'number',
      class: 'params',
      id: 'Gridded_cellsize',
      min: 1.000,
      max: 7000,
      step: 'any',
    })
    .property('value', 10.0);

  const c = dialog_content.append('p')
    .attr('class', 'params_section2 opt_polygon');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.shape' })
    .html(_tr('app_page.func_options.grid.shape'));

  const grid_shape = c.insert('select')
    .attrs({ class: 'params i18n', id: 'Gridded_shape' });

  const d = dialog_content.append('p')
    .attr('class', 'params_section2 opt_polygon opt_point opt_grid')
    .style('padding-top', '2px');
  d.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.coloramp' })
    .html(_tr('app_page.func_options.grid.coloramp'));
  const col_pal = d.insert('select')
    .attrs({ class: 'params', id: 'Gridded_color_pal' });

  [
    'Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn',
    'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds',
  ].forEach((color) => { col_pal.append('option').text(color).attr('value', color); });

  [
    ['app_page.func_options.grid.square', 'Square'],
    ['app_page.func_options.grid.diamond', 'Diamond'],
    ['app_page.func_options.grid.hexagon', 'Hexagon'],
  ].forEach((shape) => {
    grid_shape.append('option')
      .text(_tr(shape[0]))
      .attrs({ value: shape[1], 'data-i18n': `[text]${shape[0]}` });
    grid_shape_pt.append('option')
      .text(_tr(shape[0]))
      .attrs({ value: shape[1], 'data-i18n': `[text]${shape[0]}` });
  });

  make_layer_name_input(dialog_content, 'Gridded_output_name');
  make_ok_button(dialog_content, 'Gridded_yes', false);
  section2.selectAll('.params').attr('disabled', true);
}


const fields_griddedMap = {
  fill (layer) {
    const user_polygon_layer = d3.select('#Gridded_polygon_layer');
    const mask_selec = d3.select('#Gridded_mask');
    const other_layers = get_other_layer_names();
    unfillSelectInput(mask_selec.node());
    unfillSelectInput(user_polygon_layer.node());
    mask_selec.append('option').text('None').attr('value', 'None');
    for (let i = 0, n_layer = other_layers.length, lyr_name; i < n_layer; i++) {
      lyr_name = other_layers[i];
      if (data_manager.current_layers[lyr_name].type === 'Polygon') {
        mask_selec.append('option').text(lyr_name).attr('value', lyr_name);
        user_polygon_layer.append('option').text(lyr_name).attr('value', lyr_name);
      }
    }
    if (!layer) return;
    const type_layer = data_manager.current_layers[layer].type;
    section2.selectAll('.opt_polygon').style('display', type_layer === 'Polygon' ? null : 'none');
    section2.selectAll('.opt_point').style('display', type_layer === 'Point' ? null : 'none');
    if (type_layer === 'Point') {
      const current_map_type = document.getElementById('Gridded_map_type').value;
      const current_mesh_type = document.getElementById('Gridded_mesh_type').value;
      const current_func_type = current_map_type === 'ratio'
        ? document.getElementById('Gridded_func_ratio').value
        : document.getElementById('Gridded_func_stock').value;
      if (current_map_type === 'stock') {
        document.getElementById('Gridded_func_stock').style.display = null;
        document.getElementById('Gridded_func_ratio').style.display = 'none';
        section2.select('option[value="regular_grid"]').property('disabled', true);
      } else {
        document.getElementById('Gridded_func_stock').style.display = 'none';
        document.getElementById('Gridded_func_ratio').style.display = null;
        section2.select('option[value="regular_grid"]').property('disabled', false);
      }
      section2.selectAll('.opt_point.opt_grid').style('display', current_mesh_type === 'regular_grid' ? null : 'none');
      section2.selectAll('.opt_point.opt_user_layer').style('display', current_mesh_type !== 'regular_grid' ? null : 'none');
      section2.select('.opt_point.opt_field').style('display', current_func_type !== 'density_count' && current_func_type !== 'count' ? null : 'none');
      section2.select('#Gridded_mesh_type')
        .on('change', function () {
          if (this.value === 'regular_grid') {
            section2.selectAll('.opt_point.opt_grid').style('display', null);
            section2.selectAll('.opt_point.opt_user_layer').style('display', 'none');
          } else if (this.value === 'user_polygons') {
            section2.selectAll('.opt_point.opt_grid').style('display', 'none');
            section2.selectAll('.opt_point.opt_user_layer').style('display', null);
          }
        });
      section2.select('#Gridded_func_ratio')
        .on('change', function () {
          section2.select('.opt_point.opt_field')
            .style('display', this.value === 'density_count' ? 'none' : null);
          output_name_field.attr('value', ['Gridded', layer].join('_'));
        });
      section2.select('#Gridded_func_stock')
        .on('change', function () {
          section2.select('.opt_point.opt_field')
            .style('display', this.value === 'count' ? 'none' : null);
          output_name_field.attr('value', ['PropSymbol', layer].join('_'));
        });
      section2.select('#Gridded_map_type')
        .on('change', function () {
          section2.select('#Gridded_mesh_type')
            .property('value', 'user_polygons')
            .dispatch('change');
          if (this.value === 'stock') {
            document.getElementById('Gridded_func_stock').style.display = null;
            document.getElementById('Gridded_func_ratio').style.display = 'none';
            section2.select('option[value="regular_grid"]').property('disabled', true);
          } else {
            document.getElementById('Gridded_func_stock').style.display = 'none';
            document.getElementById('Gridded_func_ratio').style.display = null;
            section2.select('option[value="regular_grid"]').property('disabled', false);
          }
        });
    }

    const fields = getFieldsType('stock', layer),
      field_selecs = section2.selectAll('.field_to_use'),
      output_name_field = section2.select('#Gridded_output_name'),
      ok_button = section2.select('#Gridded_yes');

    fields.forEach((field) => {
      field_selecs.append('option').text(field).attr('value', field);
    });
    field_selecs.on('change', function () {
      if (type_layer !== 'Point') {
        output_name_field.attr('value', ['Gridded', this.value, layer].join('_'));
      }
    });
    ok_button.on('click', () => {
      const output_name = output_name_field.node().value;
      if (type_layer === 'Point') {
        const map_type = document.getElementById('Gridded_map_type').value;
        const id_func_type = map_type === 'stock' ? 'Gridded_func_stock' : 'Gridded_func_ratio';
        const params = {
          mesh_type: document.getElementById('Gridded_mesh_type').value,
          func_type: document.getElementById(id_func_type).value,
          field: document.getElementById('Gridded_field_pt').value,
          resolution: document.getElementById('Gridded_cellsize_pt').value,
          cell_shape: document.getElementById('Gridded_shape_pt').value,
          mask_layer: document.getElementById('Gridded_mask').value,
          polygon_layer: document.getElementById('Gridded_polygon_layer').value,
          color_palette: document.getElementById('Gridded_color_pal').value,
        };
        if (params.mesh_type === 'user_polygons' && !params.polygon_layer) {
          display_error_during_computation(_tr('app_page.common.error_background_needed'));
          return;
        }
        render_GriddedFromPts(params, output_name);
      } else {
        render_Gridded(
          document.getElementById('Gridded_field').value,
          document.getElementById('Gridded_cellsize').value,
          document.getElementById('Gridded_shape').value,
          document.getElementById('Gridded_color_pal').value,
          output_name,
        );
      }
    });
    output_name_field.attr('value', ['Gridded', layer].join('_'));
    document.getElementById('Gridded_cellsize').value = get_first_guess_span('grid');
    document.getElementById('Gridded_cellsize_pt').value = get_first_guess_span('grid');
    section2.selectAll('.params').attr('disabled', null);
  },
  unfill() {
    unfillSelectInput(document.getElementById('Gridded_field'));
    unfillSelectInput(document.getElementById('Gridded_field_pt'));
    section2.selectAll('.params').attr('disabled', true);
  },
};

function render_GriddedFromPts(params, new_user_layer_name) {
  const layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    formToSend = new FormData();
  let var_to_send = null;

  // If the mesh to be used is a regular grid, test that the resolution is
  // not too high/too low:
  if (params.mesh_type === 'regular_grid') {
    const res_test = test_maxmin_resolution(params.resolution);
    if (res_test) {
      const message = res_test === 'low'
        ? _tr('app_page.common.error_too_low_resolution')
        : _tr('app_page.common.error_too_high_resolution');
      display_error_during_computation(message);
      return;
    }
  } else if (!(params.polygon_layer in data_manager.current_layers)) {
    display_error_during_computation('Unable to find the layer');
    return;
  }

  // If the method require a numerical field:
  if (params.func_type !== 'density_count') {
    const field_name = params.field;
    var_to_send = {};
    if (data_manager.current_layers[layer].original_fields.has(field_name)) {
      var_to_send[field_name] = [];
    } else {
      var_to_send[field_name] = data_manager.user_data[layer].map(i => i[field_name]);
    }
  }

  formToSend.append('json', JSON.stringify({
    topojson: data_manager.current_layers[layer].key_name,
    mesh_type: params.mesh_type,
    var_name: var_to_send,
    cellsize: params.resolution * 1000,
    grid_shape: params.cell_shape,
    polygon_layer: params.mesh_type !== 'regular_grid' ? data_manager.current_layers[params.polygon_layer].key_name : null,
    mask_layer: params.mask_layer !== 'None' ? data_manager.current_layers[params.mask_layer].key_name : null,
    func_type: params.func_type,
  }));

  xhrequest('POST', 'compute/gridded_point', formToSend, true)
    .then((data) => {
      if (params.func_type === 'count' || params.func_type === 'weighted') {
        data = JSON.parse(data);
        const _data = data.file.objects[Object.keys(data.file.objects)].geometries;
        const field_to_render = params.func_type;
        let nb_features = 0;
        let maxval = -Infinity;
        d3.select(`#${_app.layer_to_id.get(params.polygon_layer)}`)
          .selectAll('path')
          .each(function (d, i) {
            const v = _data[i].properties[field_to_render];
            d.properties[field_to_render] = v;
            nb_features += 1;
            if (v > maxval) {
              maxval = v;
            }
          });

        const symbol_to_use = 'circle',
          new_layer_name = check_layer_name(
            new_user_layer_name.length > 0 ? new_user_layer_name : ['PropSymbols', field_to_render, params.polygon_layer].join('_'));
        const rendering_params = {
          field: field_to_render,
          nb_features: nb_features,
          new_name: new_layer_name,
          ref_layer_name: params.polygon_layer,
          symbol: symbol_to_use,
          ref_size: 40,
          ref_value: maxval,
          fill_color: 'pink',
        };
        make_prop_symbols(rendering_params);
        zoom_without_redraw();
        switch_accordion_section();
        handle_legend(new_layer_name);
      } else {
        const rendered_field = params.func_type;
        const _options = {
          choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['PropSymbols', rendered_field, params.polygon_layer].join('_')),
          func_name: 'grid',
          result_layer_on_add: true,
        };
        const n_layer_name = add_layer_topojson(data, _options);
        if (!n_layer_name) return;
        const res_data = data_manager.result_data[n_layer_name],
          nb_ft = res_data.length,
          d_values = [];
        let opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft));
        opt_nb_class = opt_nb_class > 4 ? opt_nb_class - 1 : opt_nb_class;
        for (let i = 0; i < nb_ft; i++) {
          d_values.push(res_data[i][rendered_field]);
        }
        const disc_method = 'jenks';
        data_manager.current_layers[n_layer_name].renderer = 'Gridded';
        const [
          nb_class, type, breaks, color_array, colors_map, no_data_color
        ] = discretize_to_colors(d_values, disc_method, opt_nb_class, params.color_palette);
        const rendering_params = {
          nb_class: nb_class,
          type: type,
          schema: [params.color_palette],
          breaks: breaks,
          no_data: no_data_color,
          colors: color_array,
          colorsByFeature: colors_map,
          renderer: 'Gridded',
          rendered_field: rendered_field,
        };
        render_choro(n_layer_name, rendering_params);
        handle_legend(n_layer_name);
        switch_accordion_section();
      }
    }, (error) => {
      display_error_during_computation();
      console.log(error);
    });
}

function render_Gridded(field_n, resolution, cell_shape, color_palette, new_user_layer_name) {
  const layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    formToSend = new FormData(),
    var_to_send = {},
    res_test = test_maxmin_resolution(resolution);

  if (res_test) {
    const message = res_test === 'low'
      ? _tr('app_page.common.error_too_low_resolution')
      : _tr('app_page.common.error_too_high_resolution');
    display_error_during_computation(message);
    return;
  }

  if (data_manager.current_layers[layer].original_fields.has(field_n)) {
    var_to_send[field_n] = [];
  } else {
    var_to_send[field_n] = data_manager.user_data[layer].map(i => i[field_n]);
  }

  formToSend.append('json', JSON.stringify({
    topojson: data_manager.current_layers[layer].key_name,
    var_name: var_to_send,
    cellsize: resolution * 1000,
    grid_shape: cell_shape,
  }));

  xhrequest('POST', 'compute/gridded', formToSend, true)
    .then((data) => {
      const _options = {
        choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['Gridded', resolution, layer].join('_')),
        func_name: 'grid',
        result_layer_on_add: true,
      };
      const rendered_field = `${field_n}_densitykm`;
      const n_layer_name = add_layer_topojson(data, _options);
      if (!n_layer_name) return;
      const res_data = data_manager.result_data[n_layer_name],
        nb_ft = res_data.length,
        opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft)),
        d_values = [];
      for (let i = 0; i < nb_ft; i++) {
        d_values.push(+res_data[i][rendered_field]);
      }
      const disc_method = 'quantiles';
      data_manager.current_layers[n_layer_name].renderer = 'Gridded';
      const disc_result = discretize_to_colors(d_values, disc_method, opt_nb_class, color_palette);
      const rendering_params = {
        nb_class: opt_nb_class,
        type: disc_method,
        schema: [color_palette],
        breaks: disc_result[2],
        colors: disc_result[3],
        colorsByFeature: disc_result[4],
        renderer: 'Gridded',
        rendered_field: rendered_field,
      };
      render_choro(n_layer_name, rendering_params);
      handle_legend(n_layer_name);
      switch_accordion_section();
    }, (error) => {
      display_error_during_computation();
      console.log(error);
    });
}


function fillMenu_FlowMap() {
  const dv2 = make_template_functionnality(section2);

  const subtitle = dv2.append('p')
    .attr('class', 'params_section2');
  subtitle.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.subtitle1' })
    .html(_tr('app_page.func_options.flow.subtitle1'));

  const origin_section = dv2.append('p')
    .attr('class', 'params_section2');
  origin_section.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.origin_field' })
    .html(_tr('app_page.func_options.flow.origin_field'));
  origin_section.insert('select')
    .attrs({ id: 'FlowMap_field_i', class: 'params' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const destination_section = dv2.append('p')
    .attr('class', 'params_section2');
  destination_section.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.destination_field' })
    .html(_tr('app_page.func_options.flow.destination_field'));
  destination_section.append('select')
    .attrs({ class: 'params', id: 'FlowMap_field_j' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const intensity_section = dv2.append('p')
    .attr('class', 'params_section2');
  intensity_section.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.intensity_field' })
    .html(_tr('app_page.func_options.flow.intensity_field'));
  intensity_section.append('select')
    .attrs({ class: 'params', id: 'FlowMap_field_fij' })
    .styles({ position: 'relative', float: 'right', 'margin-bottom': '7.5px' });

  const discretization_section = dv2.append('p')
    .attr('class', 'params_section2');
  discretization_section.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.discretization' })
    .html(_tr('app_page.func_options.flow.discretization'));
  const disc_type = discretization_section.insert('select')
    .attrs({ class: 'params i18n', id: 'FlowMap_discKind' });

  [
    ['app_page.common.no_classification', 'no_classification'],
    ['app_page.common.equal_interval', 'equal_interval'],
    ['app_page.common.quantiles', 'quantiles'],
    ['app_page.common.Q6', 'Q6'],
    ['app_page.common.jenks', 'jenks'],
  ].forEach((field) => {
    disc_type.append('option')
      .text(_tr(field[0]))
      .attrs({ value: field[1], 'data-i18n': `[text]${field[0]}` });
  });

  const with_discretisation = dv2.append('div')
    .attr('id', 'FlowMap_discSection')
    .styles({ clear: 'both', display: 'none', 'padding-top': '2px' });

  const without_discretisation = dv2.append('div')
    .attr('id', 'FlowMap_noDiscSection')
    .styles({ clear: 'both', 'padding-top': '2px' });

  const b = without_discretisation.append('p')
    .attr('class', 'params_section2');
  b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.fixed_size' })
    .html(_tr('app_page.func_options.choroprop.fixed_size'));
  b.insert('input')
    .attrs({
      id: 'FlowMap_ref_size',
      type: 'number',
      class: 'params',
      min: 0.1,
      max: 100.0,
      step: 'any',
    })
    .style('width', '50px');
  b.append('span').html(' (px)');

  const c = without_discretisation.append('p').attr('class', 'params_section2');
  c.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.on_value' })
    .html(_tr('app_page.func_options.choroprop.on_value'));
  c.insert('input')
    .styles({ width: '100px', 'margin-left': '10px' })
    .attrs({ type: 'number', class: 'params', id: 'FlowMap_ref_value' })
    .attrs({ min: 0.1, step: 0.1 });

  const nb_class_section = with_discretisation.append('p').attr('class', 'params_section2');
  nb_class_section.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.nb_class' })
    .html(_tr('app_page.func_options.flow.nb_class'));
  nb_class_section.insert('input')
    .attrs({ type: 'number', class: 'params', id: 'FlowMap_nbClass', min: 1, max: 33 })
    .style('width', '50px')
    .property('value', 8);

  with_discretisation.append('p')
    .attrs({ class: 'params', id: 'FlowMap_discTable' });
  with_discretisation.append('p').attr('class', 'params_section2')
    .insert('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.ref_layer_field' })
    .html(_tr('app_page.func_options.flow.ref_layer_field'));

  const join_field_section = dv2.append('p')
    .attr('class', 'params_section2');
  join_field_section.append('p')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.join_field' })
    .html(_tr('app_page.func_options.flow.join_field'));
  join_field_section.insert('select')
    .attrs({ class: 'params', id: 'FlowMap_field_join' });

  make_layer_name_input(dv2, 'FlowMap_output_name');
  make_ok_button(dv2, 'FlowMap_yes', false);

  d3.selectAll('.params').attr('disabled', true);
}

const fields_FlowMap = {
  fill (layer) {
    const field_i = section2.select('#FlowMap_field_i'),
      field_j = section2.select('#FlowMap_field_j'),
      field_fij = section2.select('#FlowMap_field_fij'),
      join_field = section2.select('#FlowMap_field_join'),
      nb_class_input = section2.select('#FlowMap_nbClass'),
      disc_type = section2.select('#FlowMap_discKind'),
      ref_value = section2.select('#FlowMap_ref_value'),
      ref_size = section2.select('#FlowMap_ref_size').property('value', 20),
      ok_button = section2.select('#FlowMap_yes'),
      uo_layer_name = section2.select('#FlowMap_output_name');

    if (data_manager.joined_dataset.length > 0
          && document.getElementById('FlowMap_field_i').options.length === 0) {
      const fields = Object.getOwnPropertyNames(data_manager.joined_dataset[0][0]);
      fields.forEach((field) => {
        field_i.append('option').text(field).attr('value', field);
        field_j.append('option').text(field).attr('value', field);
        field_fij.append('option').text(field).attr('value', field);
      });
    }
    if (layer) {
      const ref_fields = Object.getOwnPropertyNames(data_manager.user_data[layer][0]);
      ref_fields.forEach((field) => {
        join_field.append('option').text(field).attr('value', field);
      });
      uo_layer_name.attr('value', ref_fields.length >= 1 ? ['Links', ref_fields[0]].join('_') : 'LinksLayer');
    } else {
      uo_layer_name.attr('value', 'LinksLayer');
    }
    join_field.on('change', function () {
      uo_layer_name.attr('value', ['Links', this.value].join('_'));
    });
    // if (layer || data_manager.joined_dataset.length > 0) {
    //   section2.selectAll('.params').attr('disabled', null);
    //   uo_layer_name.attr('value', ['Links', layer].join('_'));
    // }
    let values_fij;

    field_fij.on('change', function () {
      const name = this.value;
      const disc = disc_type.node().value;
      values_fij = data_manager.joined_dataset[0].map(obj => +obj[name]);
      if (disc === 'no_classification') {
        ref_value.property('value', max_fast(values_fij));
      } else {
        const nclass = +nb_class_input.node().value,
          min_size = 0.5,
          max_size = 10;
        make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, 'FlowMap_discTable');
      }
    });

    disc_type.on('change', function () {
      const disc = this.value;
      const name = field_fij.node().value;
      values_fij = data_manager.joined_dataset[0].map(obj => +obj[name]);
      if (disc === 'no_classification') {
        section2.select('#FlowMap_noDiscSection').style('display', null);
        section2.select('#FlowMap_discSection').style('display', 'none');
        ref_value.property('value', max_fast(values_fij));
      } else {
        section2.select('#FlowMap_noDiscSection').style('display', 'none');
        section2.select('#FlowMap_discSection').style('display', null);
        const min_size = 0.5,
          max_size = 10;
        let nclass = +nb_class_input.node().value;
        if (disc === 'Q6') {
          nclass = 6;
          nb_class_input.property('value', 6);
        }
        make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, 'FlowMap_discTable');
      }
    });

    nb_class_input.on('change', function () {
      const nclass = this.value,
        disc = disc_type.node().value,
        min_size = 0.5,
        max_size = 10;
      make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, 'FlowMap_discTable');
    });

    ok_button.on('click', () => {
      const discretisation = disc_type.node().value;
      if (discretisation === 'no_classification') {
        render_ProportionalFlowMap(
          field_i.node().value,
          field_j.node().value,
          field_fij.node().value,
          join_field.node().value,
          +ref_size.node().value,
          +ref_value.node().value,
          uo_layer_name.node().value,
        );
      } else {
        render_GraduatedFlowMap(
          field_i.node().value,
          field_j.node().value,
          field_fij.node().value,
          join_field.node().value,
          discretisation,
          uo_layer_name.node().value,
        );
      }
    });

    if (layer && data_manager.joined_dataset.length > 0) {
      section2.selectAll('.params').attr('disabled', null);
      const fields = Object.getOwnPropertyNames(data_manager.joined_dataset[0][0]);
      if (fields.length >= 3) {
        field_j.node().value = fields[1];
        field_fij.node().value = fields[2];
        field_j.node().dispatchEvent(new Event('change'));
        field_fij.node().dispatchEvent(new Event('change'));
      }
    }
  },

  unfill() {
    unfillSelectInput(document.getElementById('FlowMap_field_i'));
    unfillSelectInput(document.getElementById('FlowMap_field_j'));
    unfillSelectInput(document.getElementById('FlowMap_field_fij'));
    unfillSelectInput(document.getElementById('FlowMap_field_join'));
    document.getElementById('FlowMap_discTable').innerHTML = '';
    document.getElementById('FlowMap_output_name').value = '';
    section2.selectAll('.params').attr('disabled', true);
  },
};

function render_ProportionalFlowMap(field_i, field_j, field_fij, name_join_field, ref_size, ref_value, new_user_layer_name) {
  const ref_layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    formToSend = new FormData(),
    join_field_to_send = {};

  join_field_to_send[name_join_field] = data_manager.user_data[ref_layer].map(obj => obj[name_join_field]);

  formToSend.append('json', JSON.stringify({
    topojson: data_manager.current_layers[ref_layer].key_name,
    csv_table: JSON.stringify(data_manager.joined_dataset[0]),
    field_i: field_i,
    field_j: field_j,
    field_fij: field_fij,
    join_field: join_field_to_send,
  }));

  xhrequest('POST', 'compute/links', formToSend, true)
    .then((data) => {
      const options = {
        choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['Links', name_join_field].join('_')),
        func_name: 'flow',
        result_layer_on_add: true,
      };
      const temp = JSON.parse(data);
      temp.file.objects.LinksLayer.geometries = temp.file.objects.LinksLayer.geometries.sort(
        (a, b) => +b.properties[field_fij] - +a.properties[field_fij]);
      const new_layer_name = add_layer_topojson(JSON.stringify(temp), options);
      if (!new_layer_name) return;
      const layer_to_render = map.select(`#${_app.layer_to_id.get(new_layer_name)}`).selectAll('path'),
        fij_field_name = field_fij,
        fij_values = data_manager.result_data[new_layer_name].map(obj => +obj[fij_field_name]),
        nb_ft = fij_values.length,
        t_field_name = 'prop_value';

      const propSize = new PropSizer(ref_value, ref_size, 'line');
      layer_to_render.each((d) => {
        d.properties.color = '#FF0000'; // eslint-disable-line no-param-reassign
        d.properties[t_field_name] = propSize.scale(d.properties[field_fij]); // eslint-disable-line no-param-reassign
      });

      layer_to_render
        .styles(d => ({ fill: 'transparent', stroke: d.properties.color, 'stroke-width': d.properties[t_field_name] }));

      Object.assign(data_manager.current_layers[new_layer_name], {
        n_features: nb_ft,
        renderer: 'LinksProportional',
        symbol: 'path',
        rendered_field: field_fij,
        size: [ref_value, ref_size],
        'stroke-width-const': undefined,
        is_result: true,
        ref_layer_name: ref_layer,
        fill_color: { single: '#FF0000' },
        type: 'Line',
      });
      switch_accordion_section();
      handle_legend(new_layer_name);
    });
}

function render_GraduatedFlowMap(field_i, field_j, field_fij, name_join_field, disc_type, new_user_layer_name) {
  const ref_layer = Object.getOwnPropertyNames(data_manager.user_data)[0],
    formToSend = new FormData(),
    join_field_to_send = {};

  const disc_params = fetch_min_max_table_value('FlowMap_discTable'),
    mins = disc_params.mins,
    maxs = disc_params.maxs,
    sizes = disc_params.sizes,
    nb_class = mins.length,
    user_breaks = [].concat(mins, maxs[nb_class - 1]),
    min_size = min_fast(sizes),
    max_size = max_fast(sizes);

  join_field_to_send[name_join_field] = data_manager.user_data[ref_layer].map(obj => obj[name_join_field]);

  formToSend.append('json', JSON.stringify({
    topojson: data_manager.current_layers[ref_layer].key_name,
    csv_table: JSON.stringify(data_manager.joined_dataset[0]),
    field_i: field_i,
    field_j: field_j,
    field_fij: field_fij,
    join_field: join_field_to_send,
  }));

  xhrequest('POST', 'compute/links', formToSend, true)
    .then((data) => {
      const options = {
        choosed_name: check_layer_name(new_user_layer_name.length > 0 ? new_user_layer_name : ['Links', name_join_field].join('_')),
        func_name: 'flow',
        result_layer_on_add: true,
      };
      const new_layer_name = add_layer_topojson(data, options);
      if (!new_layer_name) return;
      const layer_to_render = map.select(`#${_app.layer_to_id.get(new_layer_name)}`).selectAll('path'),
        fij_field_name = field_fij,
        fij_values = data_manager.result_data[new_layer_name].map(obj => +obj[fij_field_name]),
        nb_ft = fij_values.length,
        serie = new geostats(fij_values); // eslint-disable-line new-cap

      if (user_breaks[0] < serie.min()) user_breaks[0] = serie.min();
      if (user_breaks[nb_class] > serie.max()) user_breaks[nb_class] = serie.max();

      serie.setClassManually(user_breaks);

      data_manager.current_layers[new_layer_name].fixed_stroke = true;
      data_manager.current_layers[new_layer_name].renderer = 'LinksGraduated';
      data_manager.current_layers[new_layer_name].breaks = [];
      data_manager.current_layers[new_layer_name].linksbyId = [];
      data_manager.current_layers[new_layer_name].size = [min_size, max_size];
      data_manager.current_layers[new_layer_name].rendered_field = fij_field_name;
      data_manager.current_layers[new_layer_name].ref_layer_name = ref_layer;
      data_manager.current_layers[new_layer_name].min_display = 0;

      const links_byId = data_manager.current_layers[new_layer_name].linksbyId;

      for (let i = 0; i < nb_ft; ++i) {
        const val = +fij_values[i];
        links_byId.push([i, val, sizes[serie.getClass(val)]]);
      }
      for (let i = 0; i < nb_class; ++i) {
        data_manager.current_layers[new_layer_name].breaks.push(
          [[user_breaks[i], user_breaks[i + 1]], sizes[i]]);
      }
      layer_to_render.style('fill-opacity', 0)
        .style('stroke-opacity', 0.8)
        .style('stroke-width', (d, i) => links_byId[i][2]);
      switch_accordion_section();
      handle_legend(new_layer_name);
    }, (error) => {
      display_error_during_computation();
      console.log(error);
    });
}

export const render_label = function render_label(layer, rendering_params, options) {
  const label_field = rendering_params.label_field;
  const txt_color = rendering_params.color;
  const selected_font = rendering_params.font;
  const font_size = `${rendering_params.ref_font_size}px`;
  let new_layer_data = [];
  const warn_empty_features = [];
  const layer_to_add = rendering_params.uo_layer_name && rendering_params.uo_layer_name.length > 0
    ? check_layer_name(rendering_params.uo_layer_name)
    : check_layer_name(`Labels_${layer}`);
  let filter_test = () => true;
  if (rendering_params.filter_options !== undefined) {
    if (rendering_params.filter_options.type_filter === 'sup') {
      filter_test = prop => prop[rendering_params.filter_options.field] > rendering_params.filter_options.filter_value;
    } else if (rendering_params.filter_options.type_filter === 'inf') {
      filter_test = prop => prop[rendering_params.filter_options.field] < rendering_params.filter_options.filter_value;
    }
  }
  const layer_id = encodeId(layer_to_add);
  let pt_position;
  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);
  let nb_ft;
  if (options && options.current_position) {
    pt_position = options.current_position;
  }
  if (options && options.data) {
    new_layer_data = options.data;
    nb_ft = new_layer_data.length;
  } else if (layer) {
    const type_ft_ref = data_manager.current_layers[layer].symbol || 'path';
    const ref_selection = document.getElementById(_app.layer_to_id.get(layer))
      .getElementsByTagName(type_ft_ref);
    let i_id = 0;
    nb_ft = ref_selection.length;
    for (let i = 0; i < nb_ft; i++) {
      const ft = ref_selection[i].__data__;
      if (!filter_test(ft.properties)) continue;
      let coords;
      if (!ft.geometry) {
        warn_empty_features.push([i, ft]);
        continue;
      } else if (ft.geometry.type.indexOf('Multi') === -1) {
        coords = d3.geoCentroid(ft.geometry);
      } else {
        const areas = [];
        for (let j = 0; j < ft.geometry.coordinates.length; j++) {
          areas.push(path.area({
            type: ft.geometry.type,
            coordinates: [ft.geometry.coordinates[j]],
          }));
        }
        const ix_max = areas.indexOf(max_fast(areas));
        coords = d3.geoCentroid({
          type: ft.geometry.type, coordinates: [ft.geometry.coordinates[ix_max]] });
      }
      i_id += 1;
      new_layer_data.push({
        id: i_id,
        type: 'Feature',
        properties: { label: ft.properties[label_field], x: coords[0], y: coords[1] },
        geometry: { type: 'Point', coordinates: coords },
      });
    }
  }
  const context_menu = new ContextMenu();
  const getItems = self_parent => [
    { name: _tr('app_page.common.edit_style'), action: () => { make_style_box_indiv_label(self_parent); } },
    { name: _tr('app_page.common.delete'), action: () => { self_parent.style.display = 'none'; } }, // eslint-disable-line no-param-reassign
  ];
  const selection = map.insert('g', '.legend')
    .attrs({ id: layer_id, class: 'layer no_clip' })
    .selectAll('text')
    .data(new_layer_data)
    .enter()
    .insert('text');
  if (pt_position) {
    selection
      .attrs((d, i) => ({
        id: `Feature_${i}`,
        x: pt_position[i][0],
        y: pt_position[i][1],
        'alignment-baseline': 'middle',
        'text-anchor': 'middle',
      }))
      .styles((d, i) => ({
        display: pt_position[i][2],
        'font-size': pt_position[i][3],
        'font-family': pt_position[i][4],
        fill: pt_position[i][5],
      }))
      .text((_, i) => pt_position[i][6]);
  } else {
    selection
      .attrs((d, i) => {
        const pt = path.centroid(d.geometry);
        return {
          id: `Feature_${i}`,
          x: pt[0],
          y: pt[1],
          'alignment-baseline': 'middle',
          'text-anchor': 'middle',
        };
      })
      .styles({ 'font-size': font_size, 'font-family': selected_font, fill: txt_color })
      .text(d => d.properties.label);
  }

  selection
    .on('mouseover', function () { this.style.cursor = 'pointer'; })
    .on('mouseout', function () { this.style.cursor = 'initial'; })
    .on('dblclick contextmenu', function () {
      context_menu.showMenu(d3.event, document.querySelector('body'), getItems(this));
    })
    .call(drag_elem_geo);

  data_manager.current_layers[layer_to_add] = {
    n_features: new_layer_data.length,
    renderer: 'Label',
    symbol: 'text',
    fill_color: txt_color,
    rendered_field: label_field,
    is_result: true,
    ref_layer_name: layer,
    default_size: font_size,
    default_font: selected_font,
  };
  create_li_layer_elem(layer_to_add, nb_ft, ['Point', 'label'], 'result');
  if (warn_empty_features.length > 0) {
    setTimeout(() => { display_warning_empty_geom(warn_empty_features); }, 50);
  }
  zoom_without_redraw();
  return layer_to_add;
};

export const render_label_graticule = function render_label_graticule(layer, rendering_params, options) {
  const txt_color = rendering_params.color;
  const selected_font = rendering_params.font;
  const font_size = `${rendering_params.ref_font_size}px`;
  const position_lat = rendering_params.position_lat || 'bottom';
  const position_lon = rendering_params.position_lon || 'left';
  let new_layer_data = [];
  const layer_to_add = check_layer_name('Labels_Graticule');
  const layer_id = encodeId(layer_to_add);
  _app.layer_to_id.set(layer_to_add, layer_id);
  _app.id_to_layer.set(layer_id, layer_to_add);
  let nb_ft;
  if (options && options.data) {
    new_layer_data = options.data;
    nb_ft = new_layer_data.length;
  } else if (layer) {
    let grat = d3.geoGraticule()
      .step([data_manager.current_layers.Graticule.step, data_manager.current_layers.Graticule.step]);
    grat = data_manager.current_layers.Graticule.extent
      ? grat.extent(data_manager.current_layers.Graticule.extent).lines()
      : grat.lines();
    nb_ft = grat.length;
    for (let i = 0; i < nb_ft; i++) {
      const line = grat[i];
      let txt;
      let geometry;
      if (line.coordinates[0][0] === line.coordinates[1][0]) {
        txt = line.coordinates[0][0];
        geometry = position_lat === 'bottom' ? { type: 'Point', coordinates: line.coordinates[0] } : { type: 'Point', coordinates: line.coordinates[line.length - 1] };
      } else if (line.coordinates[0][1] === line.coordinates[1][1]) {
        txt = line.coordinates[0][1];
        geometry = position_lon === 'left' ? { type: 'Point', coordinates: line.coordinates[0] } : { type: 'Point', coordinates: line.coordinates[line.length - 1] };
      }
      if (txt !== undefined) {
        new_layer_data.push({
          id: i,
          type: 'Feature',
          properties: { label: txt },
          geometry: geometry,
        });
      }
    }
  }
  const context_menu = new ContextMenu();
  const getItems = self_parent => [
    { name: _tr('app_page.common.edit_style'), action: () => { make_style_box_indiv_label(self_parent); } },
    { name: _tr('app_page.common.delete'), action: () => { self_parent.style.display = 'none'; } }, // eslint-disable-line
  ];

  map.insert('g', '.legend')
    .attrs({ id: layer_id, class: 'layer no_clip' })
    .selectAll('text')
    .data(new_layer_data)
    .enter()
    .insert('text')
    .attrs((d, i) => {
      const pt = path.centroid(d.geometry);
      return {
        id: `Feature_${i}`,
        x: pt[0],
        y: pt[1],
        'alignment-baseline': 'middle',
        'text-anchor': 'middle',
      };
    })
    .styles({ 'font-size': font_size, 'font-family': selected_font, fill: txt_color })
    .text(d => d.properties.label)
    .on('mouseover', function () { this.style.cursor = 'pointer'; })
    .on('mouseout', function () { this.style.cursor = 'initial'; })
    .on('dblclick contextmenu', function () {
      context_menu.showMenu(
        d3.event,
        document.querySelector('body'),
        getItems(this),
      );
    })
    .call(drag_elem_geo);
  data_manager.current_layers[layer_to_add] = {
    n_features: new_layer_data.length,
    renderer: 'Label',
    symbol: 'text',
    fill_color: txt_color,
    is_result: true,
    ref_layer_name: layer,
    default_size: font_size,
    default_font: selected_font,
  };
  create_li_layer_elem(layer_to_add, nb_ft, ['Point', 'label'], 'result');
  zoom_without_redraw();
  return layer_to_add;
};
