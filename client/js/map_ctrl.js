import alertify from 'alertifyjs';
import { get_nb_decimals, round_value } from './helpers_calc';
import { Mround } from './helpers_math';
import {
  createLegend_symbol, createLegend_layout, createLegend_discont_links, move_legends,
} from './legend';
import { scaleBar } from './layout_features/scalebar';
import { northArrow } from './layout_features/north_arrow';


export const zoom = d3.zoom().on('zoom', zoom_without_redraw);
export let canvas_rotation_value = null;

export function makeSvgMap() {
  // The div containing the svg map:
  const map_div = d3.select('#map');
  map_div.selectAll('*').remove();

  // The 'map':
  // (so actually the `map` variable is a reference to the d3 selection
  //  of the main `svg` element on which we are drawing)
  const map = map_div.styles({ width: `${w}px`, height: `${h}px` })
    .append('svg')
    .attrs({ id: 'svg_map', width: w, height: h })
    .styles({ position: 'absolute', 'background-color': 'rgba(255, 255, 255, 0)' })
    .on('contextmenu', () => { d3.event.preventDefault(); })
    .call(zoom);

  const svg_map = map.node();
  const defs = map.append('defs');
  return {
    map_div, map, svg_map, defs,
  };
}

export function zoom_without_redraw() {
  const rot_val = canvas_rotation_value || '';
  let transform;
  let t_val;
  if (!d3.event || !d3.event.transform || !d3.event.sourceEvent) {
    transform = d3.zoomTransform(svg_map);
    t_val = transform.toString() + rot_val;
    map.selectAll('.layer')
      .transition()
      .duration(50)
      .style('stroke-width', function () {
        const lyr_name = global._app.id_to_layer.get(this.id);
        return data_manager.current_layers[lyr_name].fixed_stroke
          ? this.style.strokeWidth
          : `${data_manager.current_layers[lyr_name]['stroke-width-const'] / transform.k}px`;
      })
      .attr('transform', t_val);
    map.selectAll('.scalable-legend')
      .transition()
      .duration(50)
      .attr('transform', t_val);
  } else {
    t_val = d3.event.transform.toString() + rot_val;
    map.selectAll('.layer')
      .transition()
      .duration(50)
      .style('stroke-width', function () {
        const lyr_name = global._app.id_to_layer.get(this.id);
        return data_manager.current_layers[lyr_name].fixed_stroke
          ? this.style.strokeWidth
          : `${data_manager.current_layers[lyr_name]['stroke-width-const'] / d3.event.transform.k}px`;
      })
      .attr('transform', t_val);
    map.selectAll('.scalable-legend')
      .transition()
      .duration(50)
      .attr('transform', t_val);
  }

  if (scaleBar.displayed) {
    scaleBar.update();
  }

  if (_app.legendRedrawTimeout) {
    clearTimeout(_app.legendRedrawTimeout);
  }
  _app.legendRedrawTimeout = setTimeout(redraw_legends_symbols, 650);
  const zoom_params = svg_map.__zoom;
  const _k = proj.scale() * zoom_params.k;
  // let zoom_k_scale = proj.scale() * zoom_params.k;
  document.getElementById('input-center-x').value = round_value(zoom_params.x, 2);
  document.getElementById('input-center-y').value = round_value(zoom_params.y, 2);
  document.getElementById('input-scale-k').value = (_k > 2 || _k < -2) ? round_value(_k, 2) : round_value(_k, Math.round(get_nb_decimals(_k) / 2));
  // let a = document.getElementById('form_projection'),
  //   disabled_val = (zoom_k_scale > 200) && (window._target_layer_file != undefined || data_manager.result_data.length > 1)? '' : 'disabled';
  // a.querySelector('option[value="ConicConformalSec"]').disabled = disabled_val;
  // a.querySelector('option[value="ConicConformalTangent"]').disabled = disabled_val;
}

/**
* Function redrawing the prop symbol / img / labels / waffles when the projection
* changes (also taking care of redrawing point layer with appropriate 'pointRadius')
*
* @return {void}
*
*/
export function reproj_symbol_layer() {
  /* eslint-disable no-loop-func */
  const layers = Object.keys(data_manager.current_layers);
  const n_layers = layers.length;
  let lyr_name;
  for (let ix = 0; ix < n_layers; ix++) {
    lyr_name = layers[ix];
    if (data_manager.current_layers[lyr_name].renderer
        && (data_manager.current_layers[lyr_name].renderer.indexOf('PropSymbol') > -1
            || data_manager.current_layers[lyr_name].renderer.indexOf('TypoSymbols') > -1
            || data_manager.current_layers[lyr_name].renderer.indexOf('Label') > -1)) {
      const symbol = data_manager.current_layers[lyr_name].symbol;

      if (symbol === 'text') { // Reproject the labels :
        map.select(`#${global._app.layer_to_id.get(lyr_name)}`)
          .selectAll(symbol)
          .attrs((d) => {
            const pt = path.centroid(d.geometry);
            return { x: pt[0], y: pt[1] };
          });
      } else if (symbol === 'image') { // Reproject pictograms :
        map.select(`#${global._app.layer_to_id.get(lyr_name)}`)
          .selectAll(symbol)
          .attrs(function (d) {
            const coords = path.centroid(d.geometry),
              size = +this.getAttribute('width').replace('px', '') / 2;
            return { x: coords[0] - size, y: coords[1] - size };
          });
      } else if (symbol === 'circle') { // Reproject Prop Symbol :
        map.select(`#${global._app.layer_to_id.get(lyr_name)}`)
          .selectAll(symbol)
          .style('display', d => (isNaN(+path.centroid(d)[0]) ? 'none' : undefined))
          .attrs((d) => {
            const centroid = path.centroid(d);
            return {
              r: d.properties.prop_value,
              cx: centroid[0],
              cy: centroid[1],
            };
          });
      } else if (symbol === 'rect') { // Reproject Prop Symbol :
        map.select(`#${global._app.layer_to_id.get(lyr_name)}`)
          .selectAll(symbol)
          .style('display', d => (isNaN(+path.centroid(d)[0]) ? 'none' : undefined))
          .attrs((d) => {
            const centroid = path.centroid(d),
              size = d.properties.prop_value;
            return {
              height: size,
              width: size,
              x: centroid[0] - size / 2,
              y: centroid[1] - size / 2,
            };
          });
      }
    } else if (data_manager.current_layers[lyr_name].pointRadius !== undefined) {
      map.select(`#${global._app.layer_to_id.get(lyr_name)}`)
        .selectAll('path')
        .attr('d', path.pointRadius(data_manager.current_layers[lyr_name].pointRadius));
    } else if (data_manager.current_layers[lyr_name].renderer === 'TwoStocksWaffle') {
      const selection = svg_map.querySelector(`#${global._app.layer_to_id.get(lyr_name)}`).querySelectorAll('g');
      const nbFt = selection.length;
      if (data_manager.current_layers[lyr_name].symbol === 'circle') {
        for (let i = 0; i < nbFt; i++) {
          const centroid = path.centroid({
            type: 'Point',
            coordinates: selection[i].__data__.properties.centroid,
          });
          const symbols = selection[i].querySelectorAll('circle');
          for (let j = 0, nb_symbol = symbols.length; j < nb_symbol; j++) {
            symbols[j].setAttribute('cx', centroid[0]);
            symbols[j].setAttribute('cy', centroid[1]);
          }
        }
      } else {
        for (let i = 0; i < nbFt; i++) {
          const centroid = path.centroid({
            type: 'Point',
            coordinates: selection[i].__data__.properties.centroid,
          });
          const symbols = selection[i].querySelectorAll('rect');
          for (let j = 0, nb_symbol = symbols.length; j < nb_symbol; j++) {
            symbols[j].setAttribute('x', centroid[0]);
            symbols[j].setAttribute('y', centroid[1]);
          }
        }
      }
    }
  }
  /* eslint-enable no-loop-func */
}

export function rotate_global(angle) {
  canvas_rotation_value = ['rotate(', angle, ')'].join('');
  const zoom_transform = d3.zoomTransform(svg_map);

  map.selectAll('g.layer')
    .transition()
    .duration(10)
    .attr('transform', `${canvas_rotation_value},translate(${[zoom_transform.x, zoom_transform.y]}),scale(${zoom_transform.k})`);

  if (northArrow.displayed) {
    const current_rotate = !isNaN(+northArrow.svg_node.attr('rotate')) ? +northArrow.svg_node.attr('rotate') : 0;
    northArrow.svg_node.attr('transform', `rotate(${+angle + current_rotate},${northArrow.x_center}, ${northArrow.y_center})`);
  }
  zoom_without_redraw();
}

export function redraw_legends_symbols(targeted_node) {
  const legend_nodes = targeted_node
    ? [targeted_node]
    : document.querySelectorAll('#legend_root_symbol,#legend_root_layout');
  const hide = svg_map.__zoom.k > 5 || svg_map.__zoom.k < 0.15;
  let hidden_message = false;

  for (let i = 0; i < legend_nodes.length; ++i) {
    const layer_id = legend_nodes[i].classList[2].split('lgdf_')[1],
      layer_name = global._app.id_to_layer.get(layer_id),
      rendered_field = data_manager.current_layers[layer_name].rendered_field;
    const transform_param = legend_nodes[i].getAttribute('transform'),
      rounding_precision = legend_nodes[i].getAttribute('rounding_precision'),
      lgd_title = legend_nodes[i].querySelector('#legendtitle').innerHTML,
      lgd_subtitle = legend_nodes[i].querySelector('#legendsubtitle').innerHTML,
      notes = legend_nodes[i].querySelector('#legend_bottom_note').innerHTML;

    const rect_fill_value = legend_nodes[i].getAttribute('visible_rect') === 'true' ? {
      color: legend_nodes[i].querySelector('#under_rect').style.fill,
      opacity: legend_nodes[i].querySelector('#under_rect').style.fillOpacity,
    } : undefined;

    const display_value = legend_nodes[i].getAttribute('display'),
      visible = legend_nodes[i].style.visibility;
    const type_lgd_layout = data_manager.current_layers[layer_name].type;
    let new_lgd;

    if (!rendered_field && type_lgd_layout === 'Point') {
      const text_value = legend_nodes[i].querySelector('g.lg.legend_0 > text').innerHTML;
      legend_nodes[i].remove();
      createLegend_layout(
        layer_name,
        type_lgd_layout,
        lgd_title,
        lgd_subtitle,
        rect_fill_value,
        text_value,
        notes,
      );

      new_lgd = document.querySelector(['#legend_root_layout.lgdf_', layer_id].join(''));
    } else if (rendered_field && ['Carto_doug', 'OlsonCarto'].indexOf(data_manager.current_layers[layer_name].renderer) < 0) {
      const nested = legend_nodes[i].getAttribute('nested'),
        join_line = legend_nodes[i].getAttribute('join_line');

      legend_nodes[i].remove();
      createLegend_symbol(
        layer_name,
        rendered_field,
        lgd_title,
        lgd_subtitle,
        nested,
        join_line,
        rect_fill_value,
        rounding_precision,
        notes,
      );
      new_lgd = document.querySelector(['#legend_root_symbol.lgdf_', layer_id].join(''));
    } else {
      continue;
    }
    new_lgd.style.visibility = visible;
    if (transform_param) {
      new_lgd.setAttribute('transform', transform_param);
    }
    if (display_value) {
      new_lgd.setAttribute('display', display_value);
    } else if (hide && rendered_field) {
      new_lgd.setAttribute('display', 'none');
      hidden_message = true;
    }
  }
  if (hidden_message) {
    alertify.notify(_tr('app_page.notification.warning_deactivation_prop_symbol_legend'), 'warning', 5);
  }

  // if (!targeted_node) {
  const legend_nodes_links_discont = document.querySelectorAll('#legend_root_lines_class');
  for (let i = 0; i < legend_nodes_links_discont.length; ++i) {
    const layer_id = legend_nodes_links_discont[i].classList[2].split('lgdf_')[1],
      layer_name = global._app.id_to_layer.get(layer_id),
      rendered_field = data_manager.current_layers[layer_name].rendered_field,
      display_value = legend_nodes_links_discont[i].getAttribute('display'),
      visible = legend_nodes_links_discont[i].style.visibility;

    const transform_param = legend_nodes_links_discont[i].getAttribute('transform'),
      rounding_precision = legend_nodes_links_discont[i].getAttribute('rounding_precision'),
      lgd_title = legend_nodes_links_discont[i].querySelector('#legendtitle').innerHTML,
      lgd_subtitle = legend_nodes_links_discont[i].querySelector('#legendsubtitle').innerHTML,
      notes = legend_nodes_links_discont[i].querySelector('#legend_bottom_note').innerHTML;

    const rect_fill_value = legend_nodes_links_discont[i].getAttribute('visible_rect') === 'true' ? {
      color: legend_nodes_links_discont[i].querySelector('#under_rect').style.fill,
      opacity: legend_nodes_links_discont[i].querySelector('#under_rect').style.fillOpacity,
    } : undefined;

    legend_nodes_links_discont[i].remove();
    createLegend_discont_links(
      layer_name,
      rendered_field,
      lgd_title,
      lgd_subtitle,
      rect_fill_value,
      rounding_precision,
      notes,
    );
    const new_lgd = document.querySelector(['#legend_root_lines_class.lgdf_', layer_id].join(''));
    new_lgd.style.visibility = visible;
    if (transform_param) {
      new_lgd.setAttribute('transform', transform_param);
    }
    if (display_value) {
      new_lgd.setAttribute('display', display_value);
    }
  }
}

function interpolateZoom(translate, scale) {
  const transform = d3.zoomTransform(svg_map);
  return d3.transition().duration(225).tween('zoom', () => {
    const iTranslate = d3.interpolate([transform.x, transform.y], translate);
    const iScale = d3.interpolate(transform.k, scale);
    return (t_value) => {
      svg_map.__zoom.k = iScale(t_value);
      const _t = iTranslate(t_value);
      svg_map.__zoom.x = _t[0];
      svg_map.__zoom.y = _t[1];
      zoom_without_redraw();
    };
  });
}

export function zoomClick() {
  if (map_div.select('#hand_button').classed('locked')) return;
  const direction = (this.id === 'zoom_in') ? 1 : -1,
    factor = 0.1,
    center = [w / 2, h / 2],
    transform = d3.zoomTransform(svg_map),
    translate = [transform.x, transform.y],
    view = { x: translate[0], y: translate[1], k: transform.k };
  let target_zoom = 1,
    translate0 = [],
    l = [];
  d3.event.preventDefault();
  target_zoom = transform.k * (1 + factor * direction);
  translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
  view.k = target_zoom;
  l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];
  view.x += center[0] - l[0];
  view.y += center[1] - l[1];
  interpolateZoom([view.x, view.y], view.k);
}

// Change color of the background
// (ie the parent "svg" element on the top of which group of elements have been added)
export function handle_bg_color(color) {
  map.style('background-color', color);
}

/** Function triggered by the change of map/canvas size
* @param {Array} shape - An Array of two elements : [width, height] to use;
*                generally only used once at the time so `shape` values
*                are like [null, 750] or [800, null]
*                but also works with the 2 params together like [800, 750])
*/
export function canvas_mod_size(shape) {
  if (shape[0]) {
    w = +shape[0];
    map.attr('width', w)
      .call(zoom_without_redraw);
    map_div.style('width', `${w}px`);
    if (w + 360 + 33 < window.innerWidth) {
      document.querySelector('.light-menu').style.right = '-33px';
    } else {
      document.querySelector('.light-menu').style.right = '0px';
    }
  }
  if (shape[1]) {
    h = +shape[1];
    map.attr('height', h)
      .call(zoom_without_redraw);
    map_div.style('height', `${h}px`);
  }
  move_legends();

  // Lets update the corresponding fields in the export section :
  let ratio;
  const format = document.getElementById('select_png_format').value;
  if (format === 'web') {
    ratio = 1;
  } else if (format === 'user_defined') {
    ratio = 118.11;
  } else {
    return;
  }
  // const zoom_params = svg_map.__zoom;
  document.getElementById('export_png_width').value = Mround(w * ratio * 10) / 10;
  document.getElementById('export_png_height').value = Mround(h * ratio * 10) / 10;
  document.getElementById('input-width').value = w;
  document.getElementById('input-height').value = h;
}
