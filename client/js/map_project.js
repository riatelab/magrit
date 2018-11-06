import proj4 from 'proj4';
import * as topojson from 'topojson';
import ContextMenu from './context-menu';
import { Colors, rgb2hex } from './colors_helpers';
import {
  clean_menu_function, make_prop_line, make_prop_symbols,
  render_categorical, render_label, render_twostocks_waffle,
  reset_user_values,
} from './function';
import {
  add_simplified_land_layer, handle_active_layer,
  handle_reload_TopoJSON, handle_title, remove_layer_cleanup,
  update_menu_dataset,
} from './interface';
import {
  clickLinkFromDataUrl, create_li_layer_elem, drag_elem_geo,
  getAvailablesFunctionnalities, isValidJSON,
} from './helpers';
import { createDropShadow } from './layers_style_popup';
import {
  createLegend_choro,
  createLegend_choro_horizontal,
  createLegend_discont_links,
  createLegend_layout,
  createLegend_line_symbol,
  createLegend_symbol,
  createLegend_waffle,
} from './legend';
import { canvas_mod_size, canvas_rotation_value, reproj_symbol_layer, rotate_global, zoom_without_redraw } from './map_ctrl';
import {
  addLastProjectionSelect, available_projections, getD3ProjFromProj4, handleClipPath,
} from './projections';
import { make_style_box_indiv_symbol } from './symbols_picto';
import UserArrow from './layout_features/arrow';
import UserEllipse from './layout_features/ellipse';
import { add_layout_feature, add_single_symbol } from './layout_features/helpers';
import { northArrow } from './layout_features/north_arrow';
import UserRectangle from './layout_features/rectangle';
import { scaleBar } from './layout_features/scalebar';
import Textbox from './layout_features/text_annotation';

const serialize_layer_to_topojson = function serialize_layer_to_topojson(layer_name) {
  const layer = svg_map.querySelector(`#${_app.layer_to_id.get(layer_name)}`).querySelectorAll('path');
  const n_features = layer.length;
  const result_features = [];
  for (let i = 0; i < n_features; i++) {
    result_features.push(layer[i].__data__);
  }
  const to_convert = {};
  to_convert[layer_name] = { type: 'FeatureCollection', features: result_features };
  return Promise.resolve(JSON.stringify(topojson.topology(to_convert)));
};

/* eslint-disable no-loop-func */
export function get_map_project() {
  const getPropSymbolCurrentPos = (selection, type_symbol) => {
    const result = [];
    const nbFt = selection.length;
    if (type_symbol === 'circle') {
      for (let i = 0; i < nbFt; i++) {
        result.push({
          cx: selection[i].getAttribute('cx'),
          cy: selection[i].getAttribute('cy'),
        });
      }
    } else {
      for (let i = 0; i < nbFt; i++) {
        result.push({
          x: selection[i].getAttribute('x'),
          y: selection[i].getAttribute('y'),
        });
      }
    }
    return result;
  };
  const getWaffleCurrentPos = (selection) => {
    const result = [];
    const nbFt = selection.length;
    for (let i = 0; i < nbFt; i++) {
      result.push(selection[i].getAttribute('transform'));
    }
    return result;
  };
  const get_legend_info = function get_legend_info(lgd_node) {
    const type_lgd = lgd_node.id;
    const rect_fill_value = (lgd_node.getAttribute('visible_rect') === 'true')
      ? { color: lgd_node.querySelector('#under_rect').style.fill,
        opacity: lgd_node.querySelector('#under_rect').style.fillOpacity }
      : undefined;
    const result = {
      type: type_lgd,
      display: lgd_node.getAttribute('display'),
      transform: lgd_node.getAttribute('transform'),
      field: lgd_node.getAttribute('layer_field'),
      rounding_precision: lgd_node.getAttribute('rounding_precision'),
      rect_fill_value: rect_fill_value,
      title: lgd_node.querySelector('#legendtitle').innerHTML,
      subtitle: lgd_node.querySelector('#legendsubtitle').innerHTML,
      bottom_note: lgd_node.querySelector('#legend_bottom_note').innerHTML,
    };
    if (type_lgd === 'legend_root' || type_lgd === 'legend_root_horiz') {
      result.boxgap = lgd_node.getAttribute('boxgap');
      const no_data = lgd_node.querySelector('#no_data_txt');
      if (no_data) result.no_data_txt = no_data.innerHTML;
    } else if (type_lgd === 'legend_root_symbol') {
      result.nested_symbols = lgd_node.getAttribute('nested');
      result.join_line = lgd_node.getAttribute('join_line');
    } else if (type_lgd === 'legend_root_waffle') {
      const lyr_name = lgd_node.getAttribute('layer_name');
      result.field = data_manager.current_layers[lyr_name].rendered_field;
      result.ratio_txt = lgd_node.querySelector('#ratio_txt').innerHTML;
    } else if (type_lgd === 'legend_root_layout') {
      const lyr_name = lgd_node.getAttribute('layer_name');
      result.text_value = lgd_node.querySelector('g.legend_0 > text').innerHTML;
      result.type_geom = data_manager.current_layers[lyr_name].type;
    }
    return result;
  };

  const map_config = {},
    layers_style = [],
    layers = map.selectAll('g.layer'),
    map_title = document.getElementById('map_title'),
    layout_features = document.querySelectorAll('.legend:not(.title):not(.legend_feature)'),
    zoom_transform = d3.zoomTransform(svg_map);

  map_config.projection = _app.current_proj_name;
  if (_app.current_proj_name === 'def_proj4') {
    map_config.custom_projection = _app.last_projection;
  }
  map_config.projection_scale = proj.scale();
  map_config.projection_translate = proj.translate();
  map_config.projection_center = proj.center();
  map_config.projection_rotation = proj.rotate !== undefined ? proj.rotate() : undefined;
  map_config.projection_parallels = proj.parallels !== undefined ? proj.parallels() : undefined;
  map_config.projection_parallel = proj.parallel !== undefined ? proj.parallel() : undefined;
  map_config.zoom_translate = [zoom_transform.x, zoom_transform.y];
  map_config.zoom_scale = zoom_transform.k;
  map_config.div_width = +w;
  map_config.div_height = +h;
  map_config.n_layers = layers._groups[0].length;
  map_config.background_color = map.style('background-color');
  map_config.canvas_rotation = typeof canvas_rotation_value === 'string' ? canvas_rotation_value.match(/\d+/) : undefined;
  map_config.custom_palettes = Array.from(_app.custom_palettes.entries());

  if (map_title) {
    map_config.title = {
      content: map_title.textContent,
      x: map_title.getElementsByTagName('text')[0].getAttribute('x'),
      y: map_title.getElementsByTagName('text')[0].getAttribute('y'),
      style: map_title.getElementsByTagName('text')[0].getAttribute('style'),
    };
  }

  // Save the provided dataset if it wasn't joined to the geo layer :
  if (data_manager.joined_dataset.length > 0 && data_manager.field_join_map.length === 0) {
    map_config.joined_dataset = data_manager.joined_dataset[0];
    map_config.dataset_name = data_manager.dataset_name;
  }

  map_config.global_order = Array.from(svg_map.querySelectorAll('.legend,.layer')).map(ft => ['#', ft.id, '.', ft.className.baseVal.split(' ').join('.')].join(''));

  map_config.layout_features = {};
  if (layout_features) {
    for (let i = 0; i < layout_features.length; i++) {
      const ft = layout_features[i];
      if (ft.id === 'scale_bar') {
        map_config.layout_features.scale_bar = {
          bar_size: scaleBar.bar_size,
          displayed: scaleBar.displayed,
          dist: scaleBar.dist,
          dist_txt: scaleBar.dist_txt,
          fixed_size: scaleBar.fixed_size,
          precision: scaleBar.precision,
          unit: scaleBar.unit,
          x: scaleBar.x,
          y: scaleBar.y,
          transform: scaleBar.Scale._groups[0][0].getAttribute('transform') || '',
        };
      } else if (ft.id === 'north_arrow') {
        const n_arr = northArrow.arrow_img._groups[0][0];
        map_config.layout_features.north_arrow = {
          arrow_img: ft.getAttribute('href'),
          displayed: northArrow.displayed,
          x_img: n_arr.getAttribute('x'),
          y_img: n_arr.getAttribute('y'),
          x_center: northArrow.x_center,
          y_center: northArrow.y_center,
          size: n_arr.getAttribute('width'),
        };
      } else if (ft.classList.contains('user_ellipse')) {
        if (!map_config.layout_features.user_ellipse) map_config.layout_features.user_ellipse = [];
        const ellps = ft.childNodes[0];
        map_config.layout_features.user_ellipse.push({
          rx: ellps.getAttribute('rx'),
          ry: ellps.getAttribute('ry'),
          cx: ellps.getAttribute('cx'),
          cy: ellps.getAttribute('cy'),
          stroke: ellps.style.stroke,
          stroke_width: ellps.style.strokeWidth,
          id: ft.id,
        });
      } else if (ft.classList.contains('user_rectangle')) {
        if (!map_config.layout_features.user_rectangle) {
          map_config.layout_features.user_rectangle = [];
        }
        const rect = ft.childNodes[0];
        map_config.layout_features.user_rectangle.push({
          x: rect.getAttribute('x'),
          y: rect.getAttribute('y'),
          rx: rect.getAttribute('rx'),
          ry: rect.getAttribute('ry'),
          width: rect.getAttribute('width'),
          height: rect.getAttribute('height'),
          style: rect.getAttribute('style'),
          id: ft.id,
        });
      } else if (ft.classList.contains('arrow')) {
        if (!map_config.layout_features.arrow) map_config.layout_features.arrow = [];
        const line = ft.childNodes[0];
        map_config.layout_features.arrow.push({
          stroke_width: line.style.strokeWidth,
          stroke: line.style.stroke,
          pt1: [line.x1.baseVal.value, line.y1.baseVal.value],
          pt2: [line.x2.baseVal.value, line.y2.baseVal.value],
          id: ft.id,
          marker_head: line.getAttribute('marker-end'),
        });
      } else if (ft.classList.contains('txt_annot')) {
        if (!map_config.layout_features.text_annot) map_config.layout_features.text_annot = [];
        const text = ft.querySelector('text');
        map_config.layout_features.text_annot.push({
          id: ft.id,
          content: Array.prototype.map.call(text.querySelectorAll('tspan'), el => el.innerHTML).join('\n'),
          style: text.getAttribute('style'),
          position_x: text.getAttribute('x'),
          position_y: text.getAttribute('y'),
          transform: text.getAttribute('transform'),
        });
      } else if (ft.classList.contains('single_symbol')) {
        if (!map_config.layout_features.single_symbol) {
          map_config.layout_features.single_symbol = [];
        }
        const img = ft.childNodes[0];
        map_config.layout_features.single_symbol.push({
          id: ft.id,
          x: img.getAttribute('x'),
          y: img.getAttribute('y'),
          width: img.getAttribute('width'),
          height: img.getAttribute('height'),
          href: img.getAttribute('href'),
          scalable: ft.classList.contains('scalable-legend'),
        });
      }
    }
  }
  for (let i = map_config.n_layers - 1; i > -1; --i) {
    layers_style[i] = {};
    const layer_style_i = layers_style[i],
      layer_id = layers._groups[0][i].id,
      layer_name = _app.id_to_layer.get(layer_id),
      current_layer_prop = data_manager.current_layers[layer_name],
      layer_type = (current_layer_prop.sphere
        ? 'sphere' : false) || (current_layer_prop.graticule ? 'graticule' : 'layer'),
      nb_ft = current_layer_prop.n_features;
    let selection;

    layer_style_i.layer_name = layer_name;
    layer_style_i.layer_type = layer_type;
    layer_style_i.n_features = nb_ft;
    layer_style_i.visible = layers._groups[0][i].style.visibility !== 'hidden' ? '' : 'hidden';
    layer_style_i.layout_legend_displayed = current_layer_prop.layout_legend_displayed;

    const lgd = document.getElementsByClassName(`lgdf_${layer_id}`);
    if (lgd.length === 0) {
      layer_style_i.legend = undefined;
    } else if (lgd.length === 1) {
      layer_style_i.legend = [get_legend_info(lgd[0])];
    } else if (lgd.length === 2) {
      layer_style_i.legend = lgd[0].id === 'legend_root' ? [get_legend_info(lgd[0]), get_legend_info(lgd[1])] : [get_legend_info(lgd[1]), get_legend_info(lgd[0])];
    }

    if (map.select(`#${layer_id}`).attr('filter')) {
      layer_style_i.filter_shadow = true;
    }

    if (current_layer_prop['stroke-width-const']) {
      layer_style_i['stroke-width-const'] = current_layer_prop['stroke-width-const'];
    }
    if (current_layer_prop.pointRadius !== undefined) {
      layer_style_i.pointRadius = current_layer_prop.pointRadius;
    }
    if (current_layer_prop.fixed_stroke !== undefined) {
      layer_style_i.fixed_stroke = current_layer_prop.fixed_stroke;
    }
    if (current_layer_prop.colors_breaks) {
      layer_style_i.colors_breaks = current_layer_prop.colors_breaks;
    }
    if (current_layer_prop.options_disc !== undefined) {
      layer_style_i.options_disc = current_layer_prop.options_disc;
    }
    if (current_layer_prop.targeted) {
      selection = map.select(`#${layer_id}`).selectAll('path');
      layer_style_i.fill_opacity = selection.style('fill-opacity');
      layer_style_i.targeted = true;
      layer_style_i.topo_geom = true;
      // layer_style_i.topo_geom = JSON.stringify(_target_layer_file);
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.fields_type = current_layer_prop.fields_type;
      layer_style_i.stroke_color = selection.style('stroke');
    } else if (layer_type === 'sphere' || layer_type === 'graticule' || layer_name === 'World') {
      selection = map.select(`#${layer_id}`).selectAll('path');
      layer_style_i.fill_color = rgb2hex(selection.style('fill'));
      layer_style_i.stroke_color = rgb2hex(selection.style('stroke'));
      if (layer_type === 'graticule') {
        layer_style_i.stroke_dasharray = data_manager.current_layers.Graticule.dasharray;
        layer_style_i.step = data_manager.current_layers.Graticule.step;
        layer_style_i.extent = data_manager.current_layers.Graticule.extent;
      }
    } else if (!current_layer_prop.renderer) {
      selection = map.select(`#${layer_id}`).selectAll('path');
      layer_style_i.fill_opacity = selection.style('fill-opacity');
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.topo_geom = true;
      // layer_style_i.topo_geom = String(current_layer_prop.key_name);
      layer_style_i.stroke_color = selection.style('stroke');
    } else if (current_layer_prop.renderer.indexOf('PropSymbols') > -1 && current_layer_prop.type !== 'Line') {
      const type_symbol = current_layer_prop.symbol;
      selection = map.select(`#${layer_id}`).selectAll(type_symbol);
      const features = Array.prototype.map.call(svg_map.querySelector(`#${layer_id}`).getElementsByTagName(type_symbol), d => d.__data__);
      layer_style_i.symbol = type_symbol;
      layer_style_i.size_legend_symbol = current_layer_prop.size_legend_symbol;
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      if (current_layer_prop.rendered_field2) {
        layer_style_i.rendered_field2 = current_layer_prop.rendered_field2;
      }
      layer_style_i.current_position = getPropSymbolCurrentPos(selection._groups[0], type_symbol);
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.size = current_layer_prop.size;
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.stroke_color = selection.style('stroke');
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;
      layer_style_i.geo_pt = {
        type: 'FeatureCollection',
        features: features,
      };
      if (current_layer_prop.renderer === 'PropSymbolsTypo') {
        layer_style_i.color_map = [...current_layer_prop.color_map];
      }
      if (current_layer_prop.break_val) {
        layer_style_i.break_val = current_layer_prop.break_val;
      }
    } else if ((current_layer_prop.renderer.indexOf('PropSymbols') > -1 || current_layer_prop.renderer === 'LinksProportional')
        && current_layer_prop.type === 'Line') {
      const type_symbol = current_layer_prop.symbol;
      selection = map.select(`#${layer_id}`).selectAll('path');
      const features = Array.prototype.map.call(
        svg_map.querySelector(`#${layer_id}`).getElementsByTagName('path'), d => d.__data__);
      layer_style_i.symbol = type_symbol;
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      if (current_layer_prop.rendered_field2) {
        layer_style_i.rendered_field2 = current_layer_prop.rendered_field2;
      }
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.size = current_layer_prop.size;
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;
      layer_style_i.geo_line = {
        type: 'FeatureCollection',
        features: features,
      };
      if (current_layer_prop.renderer === 'PropSymbolsTypo') {
        layer_style_i.color_map = [...current_layer_prop.color_map];
      }
      if (current_layer_prop.break_val) {
        layer_style_i.break_val = current_layer_prop.break_val;
      }
    } else if (['Stewart', 'Gridded', 'Choropleth', 'Categorical', 'Carto_doug', 'OlsonCarto'].indexOf(current_layer_prop.renderer) > -1) {
      selection = map.select(`#${layer_id}`).selectAll('path');
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.topo_geom = true;
      // layer_style_i.topo_geom = String(current_layer_prop.key_name);
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.stroke_color = selection.style('stroke');
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;
      const color_by_id = [];
      const params = current_layer_prop.type === 'Line' ? 'stroke' : 'fill';
      selection.each(function () {
        color_by_id.push(rgb2hex(this.style[params]));
      });
      layer_style_i.color_by_id = color_by_id;
      if (current_layer_prop.renderer !== 'Categorical') {
        layer_style_i.options_disc = current_layer_prop.options_disc;
      } else {
        layer_style_i.color_map = [...current_layer_prop.color_map];
      }

      if (current_layer_prop.renderer === 'Stewart') {
        layer_style_i.color_palette = current_layer_prop.color_palette;
      } else if (current_layer_prop.renderer === 'OlsonCarto') {
        layer_style_i.scale_max = current_layer_prop.scale_max;
        layer_style_i.scale_byFeature = current_layer_prop.scale_byFeature;
      }
    } else if (current_layer_prop.renderer === 'LinksGraduated' || current_layer_prop.renderer === 'DiscLayer') {
      selection = map.select(`#${layer_id}`).selectAll('path');
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.topo_geom = true;
      // layer_style_i.topo_geom = String(current_layer_prop.key_name);
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;
      layer_style_i.size = current_layer_prop.size;
      layer_style_i.min_display = current_layer_prop.min_display;
      layer_style_i.breaks = current_layer_prop.breaks;
      // layer_style_i.topo_geom = String(current_layer_prop.key_name);
      if (current_layer_prop.renderer === 'LinksGraduated') {
        layer_style_i.linksbyId = current_layer_prop.linksbyId.slice(0, nb_ft);
      }
    } else if (current_layer_prop.renderer === 'TypoSymbols') {
      selection = map.select(`#${layer_id}`).selectAll('image');
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.symbols_map = [...current_layer_prop.symbols_map];
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;

      const state_to_save = [];
      const selec = selection._groups[0];
      for (let ix = 0; ix < selec.length; ix++) {
        const ft = selec[ix];
        state_to_save.push({
          display: ft.style.display,
          data: ft.__data__,
          pos: [ft.getAttribute('x'), ft.getAttribute('y')],
          size: ft.getAttribute('width'),
        });
      }
      layer_style_i.current_state = state_to_save;
    } else if (current_layer_prop.renderer === 'Label') {
      selection = map.select(`#${layer_id}`).selectAll('text');
      const selec = document.getElementById(layer_id).getElementsByTagName('text');
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      layer_style_i.default_font = current_layer_prop.default_font;
      layer_style_i.default_size = +current_layer_prop.default_size.slice(0, 2);
      layer_style_i.fill_color = current_layer_prop.fill_color;
      const features = [];
      const current_position = [];
      for (let j = selec.length - 1; j > -1; j--) {
        const s = selec[j];
        features.push(s.__data__);
        current_position.push([
          +s.getAttribute('x'),
          +s.getAttribute('y'),
          s.style.display,
          s.style.fontSize,
          s.style.fontFamily,
          s.style.fill,
          s.textContent,
        ]);
      }
      layer_style_i.data_labels = features;
      layer_style_i.current_position = current_position;
    } else if (current_layer_prop.renderer === 'TwoStocksWaffle') {
      const type_symbol = current_layer_prop.symbol;
      selection = map.select(`#${layer_id}`).selectAll(type_symbol);
      layer_style_i.symbol = type_symbol;
      layer_style_i.rendered_field = current_layer_prop.rendered_field;
      layer_style_i.renderer = current_layer_prop.renderer;
      layer_style_i.size = current_layer_prop.size;
      layer_style_i.fill_color = current_layer_prop.fill_color;
      layer_style_i.ratio = current_layer_prop.ratio;
      layer_style_i.nCol = current_layer_prop.nCol;
      layer_style_i.ref_layer_name = current_layer_prop.ref_layer_name;
      layer_style_i.result_data = JSON.stringify(data_manager.result_data[layer_name]);
      layer_style_i.current_position = getWaffleCurrentPos(svg_map.querySelectorAll(`#${layer_id} > g`));
    } else {
      selection = map.select(`#${layer_id}`).selectAll('path');
    }
    layer_style_i.stroke_opacity = selection.style('stroke-opacity');
    layer_style_i.fill_opacity = selection.style('fill-opacity');
  }

  // return Promise.all(
  // layers_style.map(obj => (obj.topo_geom && !obj.targeted)
  //      ? xhrequest("GET", "/get_layer/" + obj.topo_geom, null, false) : null))
  return Promise.all(
    layers_style.map(obj => (obj.topo_geom ? serialize_layer_to_topojson(obj.layer_name) : null)))
    .then((result) => {
      for (let i = 0; i < layers_style.length; i++) {
        if (result[i]) {
          layers_style[i].topo_geom = result[i];
        }
      }
      // console.log(JSON.stringify({"map_config": map_config, "layers": layers_style}))
      return JSON.stringify({
        map_config: map_config,
        layers: layers_style,
        info: { version: _app.version },
      });
    });
}

// Function triggered when the user request a download of its map preferences
export function save_map_project() {
  _app.waitingOverlay.display();
  get_map_project().then((json_params) => {
    const url = `data:text/json;charset=utf-8,${encodeURIComponent(json_params)}`;
    _app.waitingOverlay.hide();
    clickLinkFromDataUrl(url, 'magrit_project.json');
  });
}

export function load_map_project() {
  const input_button = d3.select(document.createElement('input'))
    .attrs({ type: 'file', name: 'file', accept: '.json' })
    .on('change', () => {
      const file = d3.event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => { apply_user_preferences(reader.result); };
      reader.readAsText(file);
    });

  input_button.node().dispatchEvent(new MouseEvent('click'));
}

function display_error_loading_project(error) {
  swal({
    title: `${_tr('app_page.common.error')}!`,
    text: `${_tr('app_page.common.error_map_project')}${error || 'Unknown'}`,
    type: 'error',
    allowOutsideClick: false,
  });
}

const getAppVersion = (info) => {
  if (!info || !info.version) {
    return { app_version: undefined, p_version: undefined };
  }
  const app_version = info.version;
  const version_split = app_version.split('.');
  const p_version = {
    major: version_split[0],
    minor: version_split[1],
    patch: version_split[2],
  };
  return { app_version, p_version };
};

const remove_all_layers = () => {
  const layer_names = Object.getOwnPropertyNames(data_manager.current_layers);
  for (let i = 0, nb_layers = layer_names.length; i < nb_layers; i++) {
    remove_layer_cleanup(layer_names[i]);
  }
  // Make sure there is no layers and legend/layout features on the map :
  let _l = svg_map.childNodes;
  let _ll = _l.length;
  for (let i = _ll - 1; i > -1; i--) {
    _l[i].remove();
  }
  // Make sure there is no layers in the layer manager :
  _l = document.querySelector('#sortable.layer_list').childNodes;
  _ll = _l.length;
  for (let i = _ll - 1; i > -1; i--) {
    _l[i].remove();
  }
  // Get a new object for where we are storing the main properties :
  data_manager.current_layers = {};
};

function reorder_layers(desired_order) {
  const layers = svg_map.querySelectorAll('.layer'),
    parent = layers[0].parentNode,
    nb_layers = desired_order.length;
  // eslint-disable-next-line no-param-reassign
  desired_order = desired_order.map(el => _app.layer_to_id.get(el));
  for (let i = 0; i < nb_layers; i++) {
    const t = document.getElementById(desired_order[i]);
    if (t) {
      parent.insertBefore(t, parent.firstChild);
    }
  }
  svg_map.insertBefore(defs.node(), svg_map.childNodes[0]);
}

function reorder_elem_list_layer(desired_order) {
  const parent = document.getElementsByClassName('layer_list')[0],
    // layers = parent.childNodes,
    nb_layers = desired_order.length;
  for (let i = 0; i < nb_layers; i++) {
    const selec = parent.querySelector(`li.${_app.layer_to_id.get(desired_order[i])}`);
    if (selec) {
      parent.insertBefore(selec, parent.firstChild);
    }
  }
}

function reorder_layers_elem_legends(desired_order) {
  const elems = svg_map.querySelectorAll('.legend,.layer');
  const parent = elems[0].parentNode;
  const nb_elems = desired_order.length;
  for (let i = 0; i < nb_elems; i++) {
    const t = svg_map.querySelector(desired_order[i]);
    if (t) {
      parent.appendChild(t);
    }
  }
  svg_map.insertBefore(defs.node(), svg_map.childNodes[0]);
}

function rehandle_legend(layer_name, properties) {
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.type === 'legend_root') {
      createLegend_choro(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.boxgap,
        prop.rect_fill_value,
        prop.rounding_precision,
        prop.no_data_txt,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_symbol') {
      createLegend_symbol(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.nested_symbols,
        prop.join_line,
        prop.rect_fill_value,
        prop.rounding_precision,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_lines_class') {
      createLegend_discont_links(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.rect_fill_value,
        prop.rounding_precision,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_lines_symbol') {
      createLegend_line_symbol(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.rect_fill_value,
        prop.rounding_precision,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_waffle') {
      createLegend_waffle(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.rect_fill_value,
        prop.ratio_txt,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_horiz') {
      createLegend_choro_horizontal(
        layer_name,
        prop.field,
        prop.title,
        prop.subtitle,
        prop.boxgap,
        prop.rect_fill_value,
        prop.rounding_precision,
        prop.no_data_txt,
        prop.bottom_note,
      );
    } else if (prop.type === 'legend_root_layout') {
      createLegend_layout(
        layer_name,
        prop.type_geom,
        prop.title,
        prop.subtitle,
        prop.rect_fill_value,
        prop.text_value,
        prop.bottom_note,
      );
    }
    const lgd = svg_map.querySelector(`#${prop.type}.lgdf_${_app.layer_to_id.get(layer_name)}`);
    lgd.setAttribute('transform', prop.transform);
    if (prop.display === 'none') lgd.setAttribute('display', 'none');
  }
}

export function apply_user_preferences(json_pref) {
  // Try to read the project-file provided by the user:
  const [valid, preferences] = isValidJSON(json_pref);
  if (!valid) {
    display_error_loading_project(_tr('app_page.common.error_invalid_map_project') + preferences);
    return;
  }
  const map_config = preferences.map_config;
  const layers = preferences.layers;
  if (!layers || !map_config) {
    display_error_loading_project(_tr('app_page.common.error_invalid_map_project'));
    return;
  }
  const { app_version, p_version } = getAppVersion(preferences.info);

  // Clean the map and the menus from existing layers:
  remove_all_layers();

  // Display waiting overlay:
  _app.waitingOverlay.display({ cancel_button: false });

  // Restore the state of the page (ie. without any open functionnality):
  if (window.fields_handler) {
    clean_menu_function();
  }

  // Clean the values remembered for the user from the previous rendering if any:
  reset_user_values();


  const restorePreviousPos = (layer_id, current_position, type_symbol) => {
    const selection = map.select(`#${layer_id}`)
      .selectAll(type_symbol);
    if (type_symbol === 'circle') {
      selection.attrs((d, i) => ({
        cx: current_position[i].cx,
        cy: current_position[i].cy,
      }));
    } else {
      selection.attrs((d, i) => ({
        x: current_position[i].x,
        y: current_position[i].y,
      }));
    }
  };
  const restorePreviousPosWaffle = (layer_id, current_position /* , type_symbol */) => {
    map.select(`#${layer_id}`)
      .selectAll('g')
      .attr('transform', (d, i) => current_position[i]);
  };

  const set_final_param = () => {
    setTimeout(() => {
      const _zoom = svg_map.__zoom;
      _zoom.k = map_config.zoom_scale;
      _zoom.x = map_config.zoom_translate[0];
      _zoom.y = map_config.zoom_translate[1];
      zoom_without_redraw();
      s = map_config.projection_scale;
      t = map_config.projection_translate;
      proj.scale(s).translate(t);
      if (map_config.projection_rotation) proj = proj.rotate(map_config.projection_rotation);
      path = d3.geoPath().projection(proj).pointRadius(4);
      map.selectAll('.layer').selectAll('path').attr('d', path);
      handleClipPath(_app.current_proj_name);
      reproj_symbol_layer();
      apply_layout_lgd_elem();
      if (!map_config.global_order) { // Old method to reorder layers :
        if (layers.length > 1) {
          const desired_order = layers.map(i => i.layer_name);
          reorder_elem_list_layer(desired_order);
          desired_order.reverse();
          reorder_layers(desired_order);
        }
      } else if (p_version.minor <= 4) {
        reorder_layers_elem_legends(map_config.global_order);
        if (layers.length > 1) {
          const desired_order = layers.map(i => i.layer_name);
          reorder_elem_list_layer(desired_order);
          desired_order.reverse();
          reorder_layers(desired_order);
        }
      // Current method to reorder layers:
      } else if (map_config.global_order && map_config.global_order.length > 1
          && (p_version.minor > 4 || (p_version.minor === 4 && p_version.patch > 1))) {
        const order = layers.map(i => i.layer_name);
        reorder_elem_list_layer(order);
        reorder_layers_elem_legends(map_config.global_order);
      }
      if (map_config.canvas_rotation) {
        document.getElementById('form_rotate').value = map_config.canvas_rotation;
        document.getElementById('canvas_rotation_value_txt').value = map_config.canvas_rotation;
        rotate_global(map_config.canvas_rotation);
      }
      _app.waitingOverlay.hide();
      const targeted_layer = Object.getOwnPropertyNames(data_manager.user_data)[0];
      if (targeted_layer) getAvailablesFunctionnalities(targeted_layer);
      for (let ii = 0; ii < at_end.length; ii++) {
        at_end[ii][0](at_end[ii][1], at_end[ii][2], at_end[ii][3]);
      }
    }, 150);
  };

  function apply_layout_lgd_elem() {
    if (map_config.title) {
      // Create the title object :
      handle_title(map_config.title.content);
      // Use its old properties :
      const title = document.getElementById('map_title').getElementsByTagName('text')[0];
      title.setAttribute('x', map_config.title.x);
      title.setAttribute('y', map_config.title.y);
      title.setAttribute('style', map_config.title.style);
      // Also fill the input field on the left menu :
      document.querySelector('input#title.list_elem_section4').value = map_config.title.content;
    }
    if (map_config.layout_features) {
      if (map_config.layout_features.scale_bar) {
        scaleBar.create();
        scaleBar.bar_size = map_config.layout_features.scale_bar.bar_size;
        scaleBar.displayed = map_config.layout_features.scale_bar.displayed;
        scaleBar.dist = map_config.layout_features.scale_bar.dist;
        scaleBar.dist_txt = map_config.layout_features.scale_bar.dist_txt;
        scaleBar.fixed_size = map_config.layout_features.scale_bar.fixed_size;
        scaleBar.precision = map_config.layout_features.scale_bar.precision;
        scaleBar.x = map_config.layout_features.scale_bar.x;
        scaleBar.y = map_config.layout_features.scale_bar.y;
        scaleBar.Scale._groups[0][0].setAttribute('transform', map_config.layout_features.scale_bar.transform);
        // We should be able to avoid this condition and always use the same method
        // but while waiting to test it more it may be safer to do it that way
        if (scaleBar.fixed_size === false) {
          scaleBar.update();
        } else {
          scaleBar.resize();
        }
      }
      if (map_config.layout_features.north_arrow) {
        northArrow.display();
        northArrow.arrow_img._groups[0][0].setAttribute('x', map_config.layout_features.north_arrow.x_img);
        northArrow.arrow_img._groups[0][0].setAttribute('y', map_config.layout_features.north_arrow.y_img);
        northArrow.arrow_img._groups[0][0].setAttribute('width', map_config.layout_features.north_arrow.size);
        northArrow.arrow_img._groups[0][0].setAttribute('height', map_config.layout_features.north_arrow.size);
        northArrow.under_rect._groups[0][0].setAttribute('x', map_config.layout_features.north_arrow.x_img - 7.5);
        northArrow.under_rect._groups[0][0].setAttribute('y', map_config.layout_features.north_arrow.y_img - 7.5);
        northArrow.x_center = map_config.layout_features.north_arrow.x_center;
        northArrow.y_center = map_config.layout_features.north_arrow.y_center;
        northArrow.displayed = map_config.layout_features.north_arrow.displayed;
      }
      if (map_config.layout_features.arrow) {
        for (let i = 0; i < map_config.layout_features.arrow.length; i++) {
          const ft = map_config.layout_features.arrow[i];
          const _arrow = new UserArrow(ft.id, ft.pt1, ft.pt2, svg_map, true);
          const _line = _arrow.arrow.select('line').node();
          _arrow.hide_head = map_config.layout_features.arrow[i].marker_head === null;
          _line.setAttribute('marker-end', map_config.layout_features.arrow[i].marker_head);
          _line.style.stroke = map_config.layout_features.arrow[i].stroke;
          _line.style.strokeWidth = map_config.layout_features.arrow[i].stroke_width;
        }
      }
      if (map_config.layout_features.user_ellipse) {
        for (let i = 0; i < map_config.layout_features.user_ellipse.length; i++) {
          const ft = map_config.layout_features.user_ellipse[i];
          const ellps = new UserEllipse(ft.id, [ft.cx, ft.cy], svg_map, true);
          const ellps_node = ellps.ellipse.node().querySelector('ellipse');
          ellps_node.setAttribute('rx', ft.rx);
          ellps_node.setAttribute('ry', ft.ry);
          ellps_node.style.stroke = ft.stroke;
          ellps_node.style.strokeWidth = ft.stroke_width;
        }
      }
      if (map_config.layout_features.user_rectangle) {
        for (let i = 0; i < map_config.layout_features.user_rectangle.length; i++) {
          const ft = map_config.layout_features.user_rectangle[i],
            rect = new UserRectangle(ft.id, [ft.x, ft.y], svg_map, true),
            rect_node = rect.rectangle.node().querySelector('rect');
          rect_node.setAttribute('rx', ft.rx);
          rect_node.setAttribute('ry', ft.ry);
          rect_node.setAttribute('height', ft.height);
          rect_node.setAttribute('width', ft.width);
          rect_node.setAttribute('style', ft.style);
        }
      }
      if (map_config.layout_features.text_annot) {
        for (let i = 0; i < map_config.layout_features.text_annot.length; i++) {
          const ft = map_config.layout_features.text_annot[i];
          const new_txt_box = new Textbox(svg_map, ft.id, [ft.position_x, ft.position_y]);
          new_txt_box.textAnnot.node().setAttribute('style', ft.style);
          new_txt_box.textAnnot
            .attrs({
              transform: ft.transform,
              x: ft.position_x,
              y: ft.position_y,
            })
            .selectAll('tspan')
            .attrs({
              x: ft.position_x,
              y: ft.position_y,
            });
          new_txt_box.fontSize = +ft.style.split('font-size: ')[1].split('px')[0];
          new_txt_box.fontFamily = (ft.style.split('font-family: ')[1].split(';')[0] || '').replace(', ', ',');
          new_txt_box.updateLineHeight();
          new_txt_box.update_text(ft.content);
        }
      }
      if (map_config.layout_features.single_symbol) {
        for (let i = 0; i < map_config.layout_features.single_symbol.length; i++) {
          const ft = map_config.layout_features.single_symbol[i];
          const symb = add_single_symbol(ft.href, ft.x, ft.y, ft.width, ft.height, ft.id);
          if (ft.scalable) {
            const parent_symb = symb.node().parentElement;
            parent_symb.classList.add('scalable-legend');
            parent_symb.setAttribute('transform', ['translate(', map_config.zoom_translate[0], ',', map_config.zoom_translate[1], ') scale(', map_config.zoom_scale, ',', map_config.zoom_scale, ')'].join(''));
          }
        }
      }
    }
  }
  let at_end = [];
  let done = 0;
  const func_name_corresp = new Map([
    ['LinksGraduated', 'flow'],
    ['Carto_doug', 'cartogram'],
    ['OlsonCarto', 'cartogram'],
    ['Stewart', 'smooth'],
    ['Gridded', 'grid'],
    ['DiscLayer', 'discont'],
    ['Choropleth', 'choro'],
    ['Categorical', 'typo'],
  ]);

  // Set the dimension of the map (width and height) :
  w = +map_config.div_width;
  h = +map_config.div_height;
  canvas_mod_size([w, h]);
  document.getElementById('input-width').value = w;
  document.getElementById('input-height').value = h;

  // Recrate the Map for the palettes defined by the user:
  _app.custom_palettes = new Map(map_config.custom_palettes);

  // Set the variables/fields related to the projection
  // (names were slightly changed in a last version, thus the replacing of whitespace)
  _app.current_proj_name = map_config.projection.replace(/ /g, '');
  if (map_config.custom_projection) {
    proj = getD3ProjFromProj4(proj4(map_config.custom_projection));
    _app.last_projection = map_config.custom_projection;
    let custom_name = Object.keys(_app.epsg_projections)
      .map(d => [d, _app.epsg_projections[d]])
      .filter(ft => ft[1].proj4 === _app.last_projection);
    custom_name = custom_name
      && custom_name.length > 0
      && custom_name[0].length > 1 ? custom_name[0][1].name : undefined;
    addLastProjectionSelect(_app.current_proj_name, _app.last_projection, custom_name);
  } else {
    proj = d3[available_projections.get(_app.current_proj_name).name]();
    addLastProjectionSelect(_app.current_proj_name);
  }
  if (map_config.projection_parallels) proj = proj.parallels(map_config.projection_parallels);
  if (map_config.projection_parallel) proj = proj.parallel(map_config.projection_parallel);
  if (map_config.projection_clipAngle) proj = proj.clipAngle(map_config.projection_clipAngle);
  s = map_config.projection_scale;
  t = map_config.projection_translate;
  proj.scale(s).translate(t);
  if (map_config.projection_rotation) proj = proj.rotate(map_config.projection_rotation);
  defs = map.append('defs');
  path = d3.geoPath().projection(proj).pointRadius(4);
  map.selectAll('.layer').selectAll('path').attr('d', path);

  // Set the background color of the map :
  map.style('background-color', map_config.background_color);
  document.querySelector('input#bg_color').value = rgb2hex(map_config.background_color);

  // Reload the external (not-joined) dataset if there is one :
  if (map_config.joined_dataset) {
    data_manager.field_join_map = [];
    data_manager.joined_dataset = [map_config.joined_dataset.slice()];
    data_manager.dataset_name = map_config.dataset_name;
    update_menu_dataset();
  }

  // Add each layer :
  for (let i = map_config.n_layers - 1; i > -1; --i) {
    const _layer = layers[i];
    let layer_name = _layer.layer_name,
      layer_type = _layer.layer_type,
      layer_id;
      // symbol;

    // Reload the sphere differently as some ("breaking") changes were made
    // when updating to 0.3.3
    if (app_version === undefined
        || (p_version.major === 0 && p_version.minor <= 3 && p_version.patch < 3)) {
      if (layer_name === 'Sphere') {
        layer_type = 'sphere';
      } else if (layer_name === 'Graticule') {
        layer_type = 'graticule';
      }
    }
    const fill_opacity = _layer.fill_opacity,
      stroke_opacity = _layer.stroke_opacity;

    // This is a layer for which a geometries have been stocked as TopoJSON :
    if (_layer.topo_geom) {
      const tmp = {
        skip_alert: true,
        choosed_name: layer_name,
        skip_rescale: true,
      };
      if (_layer.targeted) {
        tmp.target_layer_on_add = true;
      } else if (_layer.renderer) {
        tmp.func_name = func_name_corresp.get(_layer.renderer);
        tmp.result_layer_on_add = true;
      }
      if (_layer.pointRadius !== undefined) {
        tmp.pointRadius = _layer.pointRadius;
      }
      // handle_reload_TopoJSON(_layer.topo_geom, tmp).then(function(n_layer_name){
      layer_name = handle_reload_TopoJSON(_layer.topo_geom, tmp);
      const current_layer_prop = data_manager.current_layers[layer_name];
      if (_layer.renderer) {
        current_layer_prop.renderer = _layer.renderer;
      }
      if (_layer.targeted && _layer.fields_type) {
        current_layer_prop.fields_type = _layer.fields_type;
        document.getElementById('btn_type_fields').removeAttribute('disabled');
      }
      layer_id = _app.layer_to_id.get(layer_name);
      const layer_selec = map.select(`#${layer_id}`);

      current_layer_prop.rendered_field = _layer.rendered_field;
      if (_layer.layout_legend_displayed) current_layer_prop.layout_legend_displayed = _layer.layout_legend_displayed;
      if (_layer.ref_layer_name) current_layer_prop.ref_layer_name = _layer.ref_layer_name;
      if (_layer.size) current_layer_prop.size = _layer.size;
      if (_layer.colors_breaks) current_layer_prop.colors_breaks = _layer.colors_breaks;
      if (_layer.options_disc) current_layer_prop.options_disc = _layer.options_disc;
      if (_layer.fill_color) current_layer_prop.fill_color = _layer.fill_color;
      if (_layer.color_palette) current_layer_prop.color_palette = _layer.color_palette;
      if (_layer.renderer) {
        if (['Choropleth', 'Stewart', 'Gridded'].indexOf(_layer.renderer) > -1) {
          layer_selec.selectAll('path')
            .style(current_layer_prop.type === 'Line' ? 'stroke' : 'fill', (d, j) => _layer.color_by_id[j]);
        } else if (_layer.renderer === 'LinksGraduated') {
          current_layer_prop.linksbyId = _layer.linksbyId;
          current_layer_prop.min_display = _layer.min_display;
          current_layer_prop.breaks = _layer.breaks;
          layer_selec.selectAll('path')
            .styles((d, j) => ({
              display: (+d.properties.fij > _layer.min_display) ? null : 'none',
              stroke: _layer.fill_color.single,
              'stroke-width': current_layer_prop.linksbyId[j][2],
            }));
        } else if (_layer.renderer === 'DiscLayer') {
          current_layer_prop.min_display = _layer.min_display || 0;
          current_layer_prop.breaks = _layer.breaks;
          const lim = current_layer_prop.min_display !== 0
            ? current_layer_prop.min_display * data_manager.current_layers[layer_name].n_features
            : -1;
          layer_selec.selectAll('path')
            .styles((d, j) => ({
              fill: 'none',
              stroke: _layer.fill_color.single,
              display: j <= lim ? null : 'none',
              'stroke-width': d.properties.prop_val,
            }));
        } else if (_layer.renderer.startsWith('Categorical')) {
          render_categorical(layer_name, {
            colorByFeature: _layer.color_by_id,
            color_map: new Map(_layer.color_map),
            rendered_field: _layer.rendered_field,
            renderer: 'Categorical',
          });
        }
      }
      if (_layer.stroke_color) {
        layer_selec.selectAll('path').style('stroke', _layer.stroke_color);
      }
      if (_layer['stroke-width-const']) {
        current_layer_prop['stroke-width-const'] = _layer['stroke-width-const'];
        layer_selec.style('stroke-width', _layer['stroke-width-const']);
      }
      if (_layer.fixed_stroke) {
        current_layer_prop.fixed_stroke = _layer.fixed_stroke;
      }
      if (_layer.legend) {
        rehandle_legend(layer_name, _layer.legend);
      }
      if (_layer.fill_color && _layer.fill_color.single && _layer.renderer !== 'DiscLayer') {
        layer_selec
          .selectAll('path')
          .style(current_layer_prop.type !== 'Line' ? 'fill' : 'stroke', _layer.fill_color.single);
      } else if (_layer.fill_color && _layer.fill_color.random) {
        layer_selec
          .selectAll('path')
          .style(current_layer_prop.type !== 'Line' ? 'fill' : 'stroke', () => Colors.names[Colors.random()]);
      }

      layer_selec.selectAll('path')
        .styles({ 'fill-opacity': fill_opacity, 'stroke-opacity': stroke_opacity });
      if (_layer.visible === 'hidden') {
        handle_active_layer(layer_name);
      }
      if (_layer.filter_shadow) {
        createDropShadow(layer_id);
      }
      done += 1;
      if (done === map_config.n_layers) set_final_param();
      // });
    } else if (layer_name === 'World') {
      add_simplified_land_layer({
        skip_rescale: true,
        fill: _layer.fill_color,
        stroke: _layer.stroke_color,
        fill_opacity: fill_opacity,
        stroke_opacity: stroke_opacity,
        stroke_width: `${_layer['stroke-width-const']}px`,
        visible: _layer.visible !== 'hidden',
        drop_shadow: _layer.filter_shadow,
      });
      done += 1;
      if (done === map_config.n_layers) set_final_param();
    // ... or this is a layer provided by the application :
    } else {
      if (layer_type === 'sphere' || layer_type === 'graticule') {
        const options = {
          layer_name: layer_name,
          stroke: _layer.stroke_color,
          fill_opacity: fill_opacity,
          stroke_opacity: stroke_opacity,
          stroke_width: `${_layer['stroke-width-const']}px`,
        };
        if (layer_type === 'graticule') {
          options.fill = 'none';
          options.stroke_dasharray = _layer.stroke_dasharray;
          options.step = _layer.step;
          options.extent = _layer.extent;
        } else {
          options.fill = _layer.fill_color;
        }
        add_layout_feature(layer_type, options);
        layer_id = _app.layer_to_id.get(layer_name);
      // ... or this is a layer of proportionnals symbols :
      } else if (_layer.renderer && (_layer.renderer.startsWith('PropSymbol') || _layer.renderer === 'LinksProportional')) {
        const geojson_layer = _layer.geo_line || _layer.geo_pt;
        const s = _layer.symbol === 'path' ? 'line' : _layer.symbol;
        const rendering_params = {
          new_name: layer_name,
          field: _layer.rendered_field,
          ref_value: _layer.size[0],
          ref_size: _layer.size[1],
          symbol: s,
          nb_features: geojson_layer.features.length,
          ref_layer_name: _layer.ref_layer_name,
          renderer: _layer.renderer,
        };
        if (_layer.renderer === 'PropSymbolsChoro' || _layer.renderer === 'PropSymbolsTypo') {
          rendering_params.fill_color = _layer.fill_color.class;
        } else if (_layer.fill_color.random) {
          rendering_params.fill_color = '#fff';
        } else if (_layer.fill_color.single !== undefined) {
          rendering_params.fill_color = _layer.fill_color.single;
        } else if (_layer.fill_color.two) {
          rendering_params.fill_color = _layer.fill_color;
          rendering_params.break_val = _layer.break_val;
        }

        if (_layer.symbol === 'line' || _layer.symbol === 'path') {
          make_prop_line(rendering_params, geojson_layer);
        } else {
          make_prop_symbols(rendering_params, geojson_layer);
          if (_layer.stroke_color) {
            map.select(`#${_app.layer_to_id.get(layer_name)}`)
              .selectAll(_layer.symbol)
              .style('stroke', _layer.stroke_color);
          }
        }
        if (_layer.renderer === 'PropSymbolsTypo') {
          data_manager.current_layers[layer_name].color_map = new Map(_layer.color_map);
        }
        if (_layer.options_disc) {
          data_manager.current_layers[layer_name].options_disc = _layer.options_disc;
        }
        if (_layer.rendered_field2) {
          data_manager.current_layers[layer_name].rendered_field2 = _layer.rendered_field2;
        }
        if (_layer.colors_breaks) {
          data_manager.current_layers[layer_name].colors_breaks = _layer.colors_breaks;
        }
        if (_layer.size_legend_symbol) {
          data_manager.current_layers[layer_name].size_legend_symbol = _layer.size_legend_symbol;
        }
        if (_layer.legend) {
          rehandle_legend(layer_name, _layer.legend);
        }
        data_manager.current_layers[layer_name]['stroke-width-const'] = _layer['stroke-width-const'];
        layer_id = _app.layer_to_id.get(layer_name);
        const layer_selec = map.select(`#${layer_id}`)
          .selectAll(_layer.symbol);
        layer_selec.styles({
          'stroke-width': `${_layer['stroke-width-const']}px`,
          'fill-opacity': fill_opacity,
          'stroke-opacity': stroke_opacity,
        });
        if (_layer.fill_color.random) {
          layer_selec.style('fill', () => Colors.names[Colors.random()]);
        }
        if (_layer.current_position) {
          at_end.push([restorePreviousPos, layer_id, _layer.current_position, _layer.symbol]);
        }
      // ... or this is a layer of labels :
      } else if (_layer.renderer && _layer.renderer.startsWith('Label')) {
        const rendering_params = {
          uo_layer_name: layer_name,
          label_field: _layer.rendered_field,
          color: _layer.fill_color,
          ref_font_size: _layer.default_size,
          font: _layer.default_font,
        };
        // TODO : apply the same thing as with PropSymbol
        // for setting label at their original positions :
        render_label(null, rendering_params, {
          data: _layer.data_labels,
          current_position: _layer.current_position,
        });
        layer_id = _app.layer_to_id.get(layer_name);
      } else if (_layer.renderer && _layer.renderer === 'TwoStocksWaffle') {
        render_twostocks_waffle(undefined, {
          nCol: _layer.nCol,
          ratio: _layer.ratio,
          symbol_type: _layer.symbol,
          new_name: layer_name,
          size: _layer.size,
          ref_colors: _layer.fill_color,
          fields: _layer.rendered_field,
          result_data: _layer.result_data,
        });
        layer_id = _app.layer_to_id.get(layer_name);
        map.select(`#${layer_id}`)
          .selectAll(_layer.symbol)
          .style('fill-opacity', _layer.fill_opacity);
        if (_layer.legend) {
          rehandle_legend(layer_name, _layer.legend);
        }
        if (_layer.current_position) {
          at_end.push([restorePreviousPosWaffle, layer_id, _layer.current_position, _layer.symbol]);
        }
      } else if (_layer.renderer && _layer.renderer.startsWith('TypoSymbol')) {
        const symbols_map = new Map(_layer.symbols_map);
        const new_layer_data = {
          type: 'FeatureCollection',
          features: _layer.current_state.map(d => d.data),
        };

        const nb_features = new_layer_data.features.length;
        const context_menu = new ContextMenu();
        const getItems = self_parent => [
          { name: _tr('app_page.common.edit_style'), action: () => { make_style_box_indiv_symbol(self_parent); } },
          { name: _tr('app_page.common.delete'), action: () => { self_parent.style.display = 'none'; } }, // eslint-disable-line no-param-reassign
        ];
        layer_id = encodeId(layer_name);
        _app.layer_to_id.set(layer_name, layer_id);
        _app.id_to_layer.set(layer_id, layer_name);
        // Add the features at there original positions :
        map.append('g').attrs({ id: layer_id, class: 'layer' })
          .selectAll('image')
          .data(new_layer_data.features)
          .enter()
          .insert('image')
          .attrs((d, j) => {
            const symb = symbols_map.get(d.properties.symbol_field),
              prop = _layer.current_state[j],
              coords = prop.pos;
            return {
              x: coords[0] - symb[1] / 2,
              y: coords[1] - symb[1] / 2,
              width: prop.size,
              height: prop.size,
              'xlink:href': symb[0],
            };
          })
          .style('display', (d, j) => _layer.current_state[j].display)
          .on('mouseover', function () { this.style.cursor = 'pointer'; })
          .on('mouseout', function () { this.style.cursor = 'initial'; })
          .on('contextmenu dblclick', function () {
            context_menu.showMenu(d3.event, document.querySelector('body'), getItems(this));
          })
          .call(drag_elem_geo);

        create_li_layer_elem(layer_name, nb_features, ['Point', 'symbol'], 'result');
        data_manager.current_layers[layer_name] = {
          n_features: nb_features,
          renderer: 'TypoSymbols',
          symbols_map: symbols_map,
          rendered_field: _layer.rendered_field,
          is_result: true,
          symbol: 'image',
          ref_layer_name: _layer.ref_layer_name,
        };
        if (_layer.legend) {
          rehandle_legend(layer_name, _layer.legend);
        }
      } else {
        null;
      }
      // Had the layer a shadow effect ?
      if (_layer.filter_shadow) {
        createDropShadow(layer_id);
      }
      // Was the layer visible when the project was saved :
      if (_layer.visible === 'hidden' && layer_name !== 'World') {
        handle_active_layer(layer_name);
      }
      // This function is called on each layer added
      //   to delay the call to the function doing a final
      //   adjusting of the zoom factor / translate values / layers orders :
      done += 1;
      if (done === map_config.n_layers) set_final_param();
    }
  }
}
/* eslint-enable no-loop-func */

export const beforeUnloadWindow = (event) => {
  get_map_project().then((jsonParams) => {
    window.localStorage.removeItem('magrit_project');
    if (jsonParams.length < 5500000) {
      window.localStorage.setItem('magrit_project', jsonParams);
    }
  });
  // eslint-disable-next-line no-param-reassign
  event.returnValue = (global._app.targeted_layer_added
    || Object.getOwnPropertyNames(data_manager.result_data).length > 0)
    ? 'Confirm exit' : undefined;
};
