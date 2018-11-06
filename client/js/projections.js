import proj4 from 'proj4';
import { make_dialog_container, overlay_under_modal } from './dialogs';
import { accordionize2, getTargetLayerProps } from './helpers';
import { scale_to_bbox } from './helpers_calc';
import { scale_to_lyr, remove_layer_cleanup, fitLayer, center_map } from './interface';
import { reproj_symbol_layer, zoom_without_redraw } from './map_ctrl';
import { hatanoRaw, winkel1Raw } from './projection_others';
import { add_layout_feature } from './layout_features/helpers';

(d3.geoWinkel1 = (() => d3.geoProjection(winkel1Raw(45)).scale(200)));
(d3.geoHatano = (() => d3.geoProjection(hatanoRaw).scale(200)));

export const shortListContent = [
  'AzimuthalEqualAreaEurope',
  'ConicConformalFrance',
  'HEALPix',
  'Mercator',
  'NaturalEarth2',
  'Robinson',
  'TransverseMercator',
  'WinkelTriple',
  'more',
  'proj4',
];

/* eslint-disable object-curly-newline,max-len */
export const available_projections = new Map([
  ['Armadillo', { name: 'geoArmadillo', scale: '400', param_in: 'other', param_ex: 'aphylactic' }],
  ['AzimuthalEquidistant', { name: 'geoAzimuthalEquidistant', scale: '700', param_in: 'plan', param_ex: 'equidistant' }],
  ['AzimuthalEqualArea', { name: 'geoAzimuthalEqualArea', scale: '700', param_in: 'plan', param_ex: 'equalarea' }],
  ['AzimuthalEqualAreaEurope', { name: 'geoAzimuthalEqualArea', scale: '700', rotate: [-10, -52, 0], bounds: [-10.6700, 34.5000, 31.5500, 71.0500], param_in: 'plan', param_ex: 'equalarea' }],
  ['Baker', { name: 'geoBaker', scale: '400', param_in: 'other', param_ex: 'aphylactic' }],
  ['Berhmann', { name: 'geoCylindricalEqualArea', scale: '400', parallel: 30, param_in: 'cylindrical', param_ex: 'equalarea' }],
  ['Bertin', { name: 'geoBertin1953', scale: '400', param_in: 'other', param_ex: 'aphylactic' }],
  ['Boggs', { name: 'geoBoggs', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['InterruptedBoggs', { name: 'geoInterruptedBoggs', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Bonne', { name: 'geoBonne', scale: '400', param_in: 'pseudocone', param_ex: 'equalarea' }],
  ['Bromley', { name: 'geoBromley', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Collignon', { name: 'geoCollignon', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  // ["ConicConformalTangent", {'name': 'geoConicConformal', 'scale': '400', 'parallels': [44, 44], bounds: [-25.5, -25.5, 75.5, 75.5], param_in: 'cone', param_ex: 'conformal'}],
  ['ConicConformal', { name: 'geoConicConformal', scale: '400', parallels: [44, 49], bounds: [-25.5, -25.5, 75.5, 75.5], param_in: 'cone', param_ex: 'conformal' }],
  ['ConicConformalFrance', { name: 'geoConicConformal', scale: '400', parallels: [44, 49], rotate: [-3, -46.5, 0], bounds: [-10.6700, 34.5000, 31.5500, 71.0500], param_in: 'cone', param_ex: 'conformal' }],
  ['ConicEqualArea', { name: 'geoConicEqualArea', scale: '400', param_in: 'cone', param_ex: 'equalarea' }],
  ['ConicEquidistant', { name: 'geoConicEquidistant', scale: '400', parallels: [40, 45], param_in: 'cone', param_ex: 'equidistant' }],
  // ["ConicEquidistantTangent", {'name': 'geoConicEquidistant', 'scale': '400', parallels: [40, 40], param_in: 'cone', param_ex: 'equidistant'}],
  ['CrasterParabolic', { name: 'geoCraster', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Equirectangular', { name: 'geoEquirectangular', scale: '400', param_in: 'cylindrical', param_ex: 'equidistant' }],
  ['CylindricalEqualArea', { name: 'geoCylindricalEqualArea', scale: '400', param_in: 'cylindrical', param_ex: 'equalarea' }],
  ['CylindricalStereographic', { name: 'geoCylindricalStereographic', scale: '400', param_in: 'cylindrical', param_ex: 'aphylactic' }],
  ['EckertI', { name: 'geoEckert1', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['EckertII', { name: 'geoEckert2', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['EckertIII', { name: 'geoEckert3', scale: '525', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['EckertIV', { name: 'geoEckert4', scale: '525', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['EckertV', { name: 'geoEckert5', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['EckertVI', { name: 'geoEckert6', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Eisenlohr', { name: 'geoEisenlohr', scale: '400', param_in: 'other', param_ex: 'conformal' }],
  ['GallPeters', { name: 'geoCylindricalEqualArea', scale: '400', parallel: 45, param_in: 'cylindrical', param_ex: 'equalarea' }],
  ['GallStereographic', { name: 'geoCylindricalStereographic', scale: '400', parallel: 45, param_in: 'cylindrical', param_ex: 'aphylactic' }],
  ['Gilbert', { name: 'geoGilbert', scale: '400', type: '', param_in: 'other', param_ex: 'aphylactic' }],
  ['Gnomonic', { name: 'geoGnomonic', scale: '400', param_in: 'plan', param_ex: 'aphylactic' }],
  ['Gringorten', { name: 'geoGringorten', scale: '400', param_in: 'other', param_ex: 'equalarea' }],
  ['GringortenQuincuncial', { name: 'geoGringortenQuincuncial', scale: '400', param_in: 'other', param_ex: 'equalarea' }],
  ['Hatano', { name: 'geoHatano', scale: '200', param_in: 'other', param_ex: 'equalarea' }],
  ['HEALPix', { name: 'geoHealpix', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['HoboDyer', { name: 'geoCylindricalEqualArea', scale: '400', parallel: 37.5, param_in: 'cylindrical', param_ex: 'equalarea' }],
  ['Homolosine', { name: 'geoHomolosine', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['InterruptedHomolosine', { name: 'geoInterruptedHomolosine', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Loximuthal', { name: 'geoLoximuthal', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['Mercator', { name: 'geoMercator', scale: '375', param_in: 'cylindrical', param_ex: 'conformal' }],
  ['Miller', { name: 'geoMiller', scale: '375', param_in: 'cylindrical', param_ex: 'aphylactic' }],
  ['MillerOblatedStereographic', { name: 'geoModifiedStereographicMiller', scale: '375', param_in: 'plan', param_ex: 'conformal' }],
  ['Mollweide', { name: 'geoMollweide', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['NaturalEarth', { name: 'geoNaturalEarth1', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['NaturalEarth2', { name: 'geoNaturalEarth2', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['Orthographic', { name: 'geoOrthographic', scale: '475', clipAngle: 90, param_in: 'plan', param_ex: 'aphylactic' }],
  ['Patterson', { name: 'geoPatterson', scale: '400', param_in: 'cylindrical', param_ex: 'aphylactic' }],
  ['Polyconic', { name: 'geoPolyconic', scale: '400', param_in: 'pseudocone', param_ex: 'aphylactic' }],
  ['Peircequincuncial', { name: 'geoPeirceQuincuncial', scale: '400', param_in: 'other', param_ex: 'conformal' }],
  ['Robinson', { name: 'geoRobinson', scale: '400', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['SinuMollweide', { name: 'geoSinuMollweide', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['InterruptedSinuMollweide', { name: 'geoInterruptedSinuMollweide', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Sinusoidal', { name: 'geoSinusoidal', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['InterruptedSinusoidal', { name: 'geoInterruptedSinusoidal', scale: '400', param_in: 'pseudocylindre', param_ex: 'equalarea' }],
  ['Stereographic', { name: 'geoStereographic', scale: '400', param_in: 'cylindrical', param_ex: 'aphylactic' }],
  ['TransverseMercator', { name: 'geoTransverseMercator', scale: '400', param_in: 'cylindrical', param_ex: 'conformal' }],
  ['Werner', { name: 'geoBonne', scale: '400', parallel: 90, param_in: 'pseudocone', param_ex: 'equalarea' }],
  ['Winkel1', { name: 'geoWinkel1', scale: '200', param_in: 'pseudocylindre', param_ex: 'aphylactic' }],
  ['WinkelTriple', { name: 'geoWinkel3', scale: '400', param_in: 'pseudoplan', param_ex: 'aphylactic' }],
]);
/* eslint-enable object-curly-newline,max-len */

function storePrefProjection(type_proj, name_proj) {
  const props = getTargetLayerProps();
  if (!props) return;
  props.last_projection = [type_proj, name_proj]
}

/**
* Function to change (one of more of) the three rotations axis of a d3 projection
* and redraw all the path (+ move symbols layers) in respect to that.
*
* @param {Array} param - The new [lambda, phi, gamma] properties to be used.
* @return {void}
*/
function handle_proj_center_button(param) {
  // Fetch the current rotation params :
  const current_rotation = proj.rotate();
  // Reuse it for the missing value passed in arguments and do the rotation:
  // proj.rotate(param.map((val, i) => val !== null ? val : current_rotation[i]));
  proj.rotate(param.map((val, i) => val || current_rotation[i]));
  // Redraw the path and move the symbols :
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
}

function handle_parallels_change(parallels) {
  const current_values = proj.parallels();
  proj.parallels(parallels.map((val, i) => val || current_values[i]));
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
}

function handle_parallel_change(parallel) {
  proj.parallel(parallel);
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
}

const createBoxProj4 = function createBoxProj4() {
  make_dialog_container(
    'box_projection_input',
    _tr('app_page.section5.title'),
    'dialog',
  );
  const container = document.getElementById('box_projection_input');
  const dialog = container.querySelector('.modal-dialog');

  const content = d3.select(container)
    .select('.modal-body')
    .attr('id', 'box_proj4');

  dialog.style.width = undefined;
  dialog.style.maxWidth = '500px';
  dialog.style.minWidth = '400px';

  const input_section = content.append('p');
  input_section.append('span')
    .style('float', 'left')
    .html(_tr('app_page.proj4_box.enter_string'));
  input_section.append('input')
    .styles({ width: '90%' })
    .attrs({
      id: 'input_proj_string',
      placeholder: 'EPSG:3035',
      // placeholder: '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs',
    });

  const fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, clean_up_box); };
  const clean_up_box = () => {
    container.remove();
    overlay_under_modal.hide();
    document.removeEventListener('keydown', fn_cb);
  };
  const _onclose_valid = () => {
    let proj_str = document.getElementById('input_proj_string').value.trim();
    let _p;
    let error_msg;
    let custom_name;
    // Trim the input string from eventual superflous quotes:
    if (proj_str.startsWith('"') || proj_str.startsWith("'")) {
      proj_str = proj_str.substr(1);
    }
    if (proj_str.endsWith('"') || proj_str.endsWith("'")) {
      proj_str = proj_str.slice(0, -1);
    }
    // If the string is something like EPSG:xxxx, transform it to an actual proj4 string
    // using a list of EPSG code contained in Magrit:
    if (proj_str.toUpperCase().startsWith('EPSG:')) {
      const code = +proj_str.toUpperCase().split('EPSG:')[1];
      const rv = _app.epsg_projections[code];
      if (!rv) {
        error_msg = _tr('app_page.common.missing_epsg');
        proj_str = undefined;
      } else {
        custom_name = rv.name;
        proj_str = rv.proj4;
      }
    } else {
      custom_name = tryFindNameProj(proj_str);
    }
    clean_up_box();
    try {
      _p = proj4(proj_str);
    } catch (e) {
      swal({
        title: 'Oops...',
        text: _tr('app_page.proj4_box.error', { detail: error_msg || e }),
        type: 'error',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => null, () => null);
      return;
    }
    const rv = change_projection_4(_p);
    if (rv) {
      _app.last_projection = proj_str;
      addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
      _app.current_proj_name = 'def_proj4';
      storePrefProjection('proj4', _app.last_projection);
    } else {
      swal({
        title: 'Oops...',
        text: _tr('app_page.proj4_box.error', { detail: '' }),
        type: 'error',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => null, () => null);
    }
  };
  container.querySelector('.btn_cancel').onclick = clean_up_box;
  container.querySelector('#xclose').onclick = clean_up_box;
  container.querySelector('.btn_ok').onclick = _onclose_valid;
  document.addEventListener('keydown', fn_cb);
  overlay_under_modal.display();
};

const displayTooltipProj4 = function displayTooltipProj4(ev) {
  const target = ev.target;
  if (!(target && target.tagName === 'SELECT')) { // && target.value === 'last_projection')) {
    return;
  }
  const title = target.tooltip;
  const tooltipWrap = document.createElement('div');
  tooltipWrap.className = 'custom_tooltip';
  tooltipWrap.appendChild(document.createTextNode(title));

  const firstChild = document.body.firstChild;
  firstChild.parentNode.insertBefore(tooltipWrap, firstChild);

  const linkProps = this.getBoundingClientRect();
  const tooltipProps = tooltipWrap.getBoundingClientRect();
  const topPos = linkProps.bottom - tooltipProps.height / 2;
  tooltipWrap.setAttribute('style', `top: ${topPos}px; left: ${linkProps.right - 15}px;`);
};

const removeTooltipProj4 = function removeTooltipProj4(ev) {
  const target = ev.target;
  if (!(target && target.tagName === 'SELECT')) { // && target.value === 'last_projection')) {
    return;
  }
  const a = document.querySelector('div.custom_tooltip');
  if (a) a.remove();
};

const makeTooltipProj4 = (proj_select, proj4string) => {
  proj_select.tooltip = proj4string; // eslint-disable-line no-param-reassign
  proj_select.addEventListener('mouseover', displayTooltipProj4);
  proj_select.addEventListener('mouseout', removeTooltipProj4);
};

export function handle_projection_select() {
  const tmp = this.querySelector('[value="last_projection"]');
  let val = this.value;
  if (val === 'more') {
    this.value = (tmp && _app.current_proj_name === tmp.name) ? 'last_projection' : _app.current_proj_name;
    createBoxCustomProjection();
    return;
  } else if (val === 'proj4') {
    this.value = (tmp && _app.current_proj_name === tmp.name) ? 'last_projection' : _app.current_proj_name;
    createBoxProj4();
    return;
  } else if (val === 'last_projection') {
    val = tmp.name;
    if (tmp.projValue) {
      _app.last_projection = tmp.projValue;
    }
  } else if (val === 'ConicConformalFrance') {
    val = 'def_proj4';
    _app.last_projection = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ';
  } else if (val === 'AzimuthalEqualAreaEurope') {
    val = 'def_proj4';
    _app.last_projection = '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ';
  }

  if (val === 'def_proj4') {
    _app.current_proj_name = val;
    change_projection_4(proj4(_app.last_projection));
    makeTooltipProj4(this, _app.last_projection);
    storePrefProjection('proj4', _app.last_projection);
  } else {
    _app.current_proj_name = val;
    change_projection(_app.current_proj_name);
    storePrefProjection('d3', _app.current_proj_name);
  }
}

export function addLastProjectionSelect(proj_name, proj4string, custom_name) {
  const proj_select = document.getElementById('form_projection2');
  if (shortListContent.indexOf(proj_name) > -1) {
    proj_select.value = proj_name;
  } else if (custom_name === 'RGF93 / Lambert-93') {
    proj_select.value = 'ConicConformalFrance';
  } else if (custom_name === 'ETRS89 / LAEA Europe') {
    proj_select.value = 'AzimuthalEqualAreaEurope';
  } else if (proj_select.options.length === 10) {
    const prev_elem = proj_select.querySelector("[value='more']");
    const new_option = document.createElement('option');
    new_option.className = 'i18n';
    new_option.value = 'last_projection';
    new_option.name = proj_name;
    new_option.projValue = proj4string;
    new_option.innerHTML = custom_name || _tr(`app_page.projection_name.${proj_name}`);
    if (!custom_name) new_option.setAttribute('data-i18n', `[text]app_page.projection_name.${proj_name}`);
    proj_select.insertBefore(new_option, prev_elem);
    proj_select.value = 'last_projection';
  } else {
    const option = proj_select.querySelector("[value='last_projection']");
    option.name = proj_name;
    option.projValue = proj4string;
    option.innerHTML = custom_name || _tr(`app_page.projection_name.${proj_name}`);
    if (!custom_name) option.setAttribute('data-i18n', `[text]app_page.projection_name.${proj_name}`);
    else option.removeAttribute('data-i18n');
    proj_select.value = 'last_projection';
  }
  if (proj4string) {
    makeTooltipProj4(proj_select, proj4string);
  }
}

const createBoxCustomProjection = function createBoxCustomProjection() {
  function updateSelect(filter_in, filter_ex) {
    display_select_proj.remove();
    display_select_proj = p.append('select')
      .attrs({ id: 'select_proj', size: 18 })
      .style('min-width', '195px');
    if (!filter_in && !filter_ex) {
      Array.from(available_projections.keys()).forEach((proj_name) => {
        display_select_proj.append('option')
          .attrs({ class: 'i18n', value: proj_name, 'data-i18n': `app_page.projection_name.${proj_name}` })
          .text(_tr(`app_page.projection_name.${proj_name}`));
      });
    } else if (!filter_ex) {
      available_projections.forEach((v, k) => {
        if (v.param_in === filter_in) {
          display_select_proj.insert('option')
            .attrs({ class: 'i18n', value: k })
            .text(_tr(`app_page.projection_name.${k}`));
        }
      });
    } else if (!filter_in) {
      available_projections.forEach((v, k) => {
        if (v.param_ex === filter_ex) {
          display_select_proj.append('option')
            .attrs({ class: 'i18n', value: k })
            .text(_tr(`app_page.projection_name.${k}`));
        }
      });
    } else {
      let empty = true;
      available_projections.forEach((v, k) => {
        if (v.param_in === filter_in && v.param_ex === filter_ex) {
          empty = false;
          display_select_proj.append('option')
            .attrs({ class: 'i18n', value: k })
            .text(_tr(`app_page.projection_name.${k}`));
        }
      });
      if (empty) {
        display_select_proj.append('option')
          .attrs({ class: 'i18n', value: 'no_result' })
          .html(_tr('app_page.projection_box.no_result_projection'));
      }
    }
    display_select_proj.on('dblclick', function () {
      if (this.value === 'no_result') return;
      reproj(this.value);
    });
  }
  function onClickFilter() {
    let filter1_val = Array.prototype.filter.call(
      document.querySelector('.switch-field.f1').querySelectorAll('input'),
      f => f.checked,
    )[0];
    let filter2_val = Array.prototype.filter.call(
      document.querySelector('.switch-field.f2').querySelectorAll('input'),
      f => f.checked,
    )[0];
    filter1_val = filter1_val === undefined ? undefined : filter1_val.value;
    if (filter1_val === 'any') filter1_val = undefined;
    filter2_val = filter2_val === undefined ? undefined : filter2_val.value;
    if (filter2_val === 'any') filter2_val = undefined;
    updateSelect(filter1_val, filter2_val);
  }
  function updateProjOptions() {
    if (proj.rotate) {
      rotate_section.style('display', '');
      const param_rotate = proj.rotate();
      lambda_input.node().value = -param_rotate[0];
      phi_input.node().value = -param_rotate[1];
      gamma_input.node().value = -param_rotate[2];
    } else {
      rotate_section.style('display', 'none');
    }
    if (proj.parallels) {
      const param_parallels = proj.parallels();
      parallels_section.style('display', '');
      parallel_section.style('display', 'none');
      sp1_input.node().value = param_parallels[0];
      sp2_input.node().value = param_parallels[1];
    } else if (proj.parallel) {
      parallels_section.style('display', 'none');
      parallel_section.style('display', '');
      sp_input.node().value = proj.parallel();
    } else {
      parallels_section.style('display', 'none');
      parallel_section.style('display', 'none');
    }
  }

  function reproj(value) {
    _app.current_proj_name = value;
    addLastProjectionSelect(_app.current_proj_name);
    change_projection(_app.current_proj_name);
    updateProjOptions();
    storePrefProjection('d3', _app.current_proj_name);
  }

  const prev_projection = _app.current_proj_name,
    prev_translate = [].concat(t),
    prev_scale = s,
    prev_rotate = proj.rotate ? proj.rotate() : undefined,
    prev_parallels = proj.parallels ? proj.parallels() : undefined,
    prev_parallel = proj.parallel ? proj.parallel() : undefined;

  make_dialog_container(
    'box_projection_customization',
    _tr('app_page.section5.title'),
    'dialog',
  );
  const container = document.getElementById('box_projection_customization'),
    dialog = container.querySelector('.modal-dialog');

  const content = d3.select(container)
    .select('.modal-body')
    .attr('id', 'box_projection');

  dialog.style.width = '700px';

  content.append('button')
    .attrs({ class: 'accordion_proj active', id: 'btn_choice_proj' })
    .style('padding', '0 6px')
    .html(_tr('app_page.projection_box.choice_projection'));
  const accordion_choice_projs = content.append('div')
    .attrs({ class: 'panel show', id: 'accordion_choice_projection' })
    .style('padding', '10px')
    .style('width', '98%');
  const choice_proj_content = accordion_choice_projs.append('div')
    .attr('id', 'choice_proj_content')
    .style('text-align', 'center');

  const column1 = choice_proj_content.append('div')
    .styles({ float: 'left', width: '50%' });
  const column3 = choice_proj_content.append('div')
    .styles({ float: 'right', width: '45%' });
  const column2 = choice_proj_content.append('div')
    .styles({ float: 'left', width: '50%' });
  choice_proj_content.append('div')
    .style('clear', 'both');

  const filtersection1 = column1.append('div').attr('class', 'switch-field f1');
  filtersection1.append('div')
    .attrs({ class: 'switch-title' })
    .html(_tr('app_page.projection_box.filter_nature'));
  ['any', 'other', 'cone', 'cylindrical', 'plan', 'pseudocone', 'pseudocylindre', 'pseudoplan'].forEach((v, i) => {
    const _id = `switch_proj1_elem_${i}`;
    filtersection1.append('input')
      .attrs({
        type: 'radio', id: _id, class: 'filter1', name: 'switch_proj1', value: v,
      });
    filtersection1.append('label')
      .attr('for', _id)
      .html(_tr(`app_page.projection_box.${v}`));
  });

  const filtersection2 = column2.append('div').attr('class', 'switch-field f2');
  filtersection2.append('div')
    .attrs({ class: 'switch-title' })
    .html(_tr('app_page.projection_box.filter_prop'));
  ['any', 'aphylactic', 'conformal', 'equalarea', 'equidistant'].forEach((v, i) => {
    const _id = `switch_proj2_elem_${i}`;
    filtersection2.append('input')
      .attrs({
        type: 'radio', id: _id, class: 'filter2', name: 'switch_proj2', value: v,
      });
    filtersection2.append('label')
      .attr('for', _id)
      .html(_tr(`app_page.projection_box.${v}`));
  });

  Array.prototype.forEach.call(
    document.querySelectorAll('.filter1,.filter2'),
    (el) => { el.onclick = onClickFilter; }, // eslint-disable-line no-param-reassign
  );

  const p = column3.append('p').style('margin', 'auto');
  let display_select_proj = p.append('select')
    .attrs({ id: 'select_proj', size: 18 });

  updateSelect(null, null);

  column3.append('button')
    .style('margin', '5px 0 5px 0')
    .attrs({ id: 'btn_valid_reproj', class: 'button_st4 i18n' })
    .html(_tr('app_page.projection_box.ok_reproject'))
    .on('click', () => {
      const value = document.getElementById('select_proj').value;
      if (value === 'no_result') return;
      reproj(value);
    });

  content.append('button')
    .attrs({ class: 'accordion_proj', id: 'btn_choice_proj' })
    .style('padding', '0 6px')
    .html(_tr('app_page.projection_box.projection_options'));
  const accordion_choice_options = content.append('div')
    .attrs({ class: 'panel', id: 'accordion_choice_projection' })
    .styles({ padding: '10px', width: '98%' });
  const options_proj_content = accordion_choice_options.append('div')
    .attr('id', 'options_proj_content')
    .styles({ transform: 'translateX(45%)', width: '60%' });

  let rotate_section = options_proj_content.append('div').style('display', prev_rotate ? '' : 'none');
  const lambda_section = rotate_section.append('p');
  lambda_section.append('span')
    .style('float', 'left')
    .html(_tr('app_page.section5.projection_center_lambda'));
  let lambda_input = lambda_section.append('input')
    .styles({
      width: '60px', float: 'right', height: '2rem',
    })
    .attrs({
      type: 'number', min: -180, max: 180, step: 0.50,
    })
    .property('value', prev_rotate ? -prev_rotate[0] : 0)
    .on('input', function () {
      if (this.value > 180) this.value = 180;
      else if (this.value < -180) this.value = -180;
      handle_proj_center_button([-this.value, null, null]);
    });

  const phi_section = rotate_section.append('p')
    .style('clear', 'both');
  phi_section.append('span')
    .style('float', 'left')
    .html(_tr('app_page.section5.projection_center_phi'));
  let phi_input = phi_section.append('input')
    .styles({
      width: '60px', float: 'right', height: '2rem',
    })
    .attrs({
      type: 'number', min: -180, max: 180, step: 0.5,
    })
    .property('value', prev_rotate ? -prev_rotate[1] : 0)
    .on('input', function () {
      if (this.value > 180) { this.value = 180; } else if (this.value < -180) { this.value = -180; }
      handle_proj_center_button([null, -this.value, null]);
    });

  const gamma_section = rotate_section.append('p')
    .style('clear', 'both');
  gamma_section.append('span')
    .style('float', 'left')
    .html(_tr('app_page.section5.projection_center_gamma'));
  const gamma_input = gamma_section.append('input')
    .styles({
      width: '60px', float: 'right', height: '2rem',
    })
    .attrs({
      type: 'number', min: -90, max: 90, step: 0.5,
    })
    .property('value', prev_rotate ? -prev_rotate[2] : 0)
    .on('input', function () {
      if (this.value > 90) { this.value = 90; } else if (this.value < -90) { this.value = -90; }
      handle_proj_center_button([null, null, -this.value]);
    });

  const parallels_section = options_proj_content.append('div')
    .styles({
      clear: 'both',
      display: prev_parallels ? '' : 'none',
      'text-align': 'center',
    });
  parallels_section.append('span')
    .html(_tr('app_page.section5.parallels'));
  const inputs = parallels_section.append('p')
    .styles({ 'text-align': 'center', margin: 'auto' });

  const sp1_input = inputs.append('input')
    .styles({ width: '60px', display: 'inline', 'margin-right': '2px' })
    .attrs({
      type: 'number', min: -90, max: 90, step: 0.5,
    })
    .property('value', prev_parallels ? prev_parallels[0] : 0)
    .on('input', function () {
      if (this.value > 90) this.value = 90;
      else if (this.value < -90) this.value = -90;
      handle_parallels_change([this.value, null]);
    });
  const sp2_input = inputs.append('input')
    .styles({ width: '60px', display: 'inline', 'margin-left': '2px' })
    .attrs({
      type: 'number', min: -90, max: 90, step: 0.5,
    })
    .property('value', prev_parallels ? prev_parallels[1] : 0)
    .on('input', function () {
      if (this.value > 90) this.value = 90;
      else if (this.value < -90) this.value = -90;
      handle_parallels_change([null, this.value]);
    });

  const parallel_section = options_proj_content.append('div')
    .styles({ 'text-align': 'center', clear: 'both' })
    .style('display', prev_parallel ? '' : 'none');
  parallel_section.append('span')
    .html(_tr('app_page.section5.parallel'));

  const sp_input = parallel_section.append('p')
    .styles({ 'text-align': 'center', margin: 'auto' })
    .append('input')
    .styles({ width: '60px', display: 'inline', 'margin-right': '2px' })
    .attrs({
      type: 'number', min: -90, max: 90, step: 0.5,
    })
    .property('value', prev_parallel || 0)
    .on('input', function () {
      if (this.value > 90) this.value = 90;
      else if (this.value < -90) this.value = -90;
      handle_parallel_change(this.value);
    });

  if (prev_projection === 'def_proj4') {
    options_proj_content.selectAll('input')
      .attr('disabled', 'disabled');
    options_proj_content.selectAll('span')
      .styles({ color: 'darkgrey', 'font-style': 'italic' });
  }

  accordionize2('.accordion_proj', container);
  const clean_up_box = () => {
    container.remove();
    overlay_under_modal.hide();
    document.removeEventListener('keydown', fn_cb);
  };
  let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose_cancel); };
  let _onclose_cancel = () => {
    clean_up_box();
    s = prev_scale;
    t = prev_translate.slice();
    _app.current_proj_name = prev_projection;

    if (prev_projection !== 'def_proj4') {
      change_projection(_app.current_proj_name);
      addLastProjectionSelect(_app.current_proj_name);
      storePrefProjection('d3', _app.current_proj_name);
    } else if (prev_projection === 'def_proj4') {
      change_projection_4(proj4(_app.last_projection));
      let custom_name = Object.keys(_app.epsg_projections)
        .map(d => [d, _app.epsg_projections[d]])
        .filter(ft => ft[1].proj4 === _app.last_projection);
      custom_name = custom_name && custom_name.length > 0 && custom_name[0].length > 1
        ? custom_name[0][1].name : undefined;
      addLastProjectionSelect(_app.current_proj_name, _app.last_projection, custom_name);
      storePrefProjection('proj4', _app.last_projection);
    }
    if (prev_rotate) {
      handle_proj_center_button(prev_rotate);
    }
    if (prev_parallels) {
      handle_parallels_change(prev_parallels);
    } else if (prev_parallel) {
      handle_parallel_change(prev_parallel);
    }
  };
  container.querySelector('.btn_cancel').onclick = _onclose_cancel;
  container.querySelector('#xclose').onclick = _onclose_cancel;
  container.querySelector('.btn_ok').onclick = clean_up_box;
  document.addEventListener('keydown', fn_cb);
  overlay_under_modal.display();
};

// const getD3ProjFromProj4 = function getD3ProjFromProj4(_proj) {
//   // Create the custom d3 projection using proj 4 forward and inverse functions:
//   const projRaw = function (lambda, phi) {
//     return _proj.forward([lambda, phi].map(radiansToDegrees));
//   };
//   projRaw.invert = function (x, y) {
//     return _proj.inverse([x, y]).map(degreesToRadians);
//   };
//   return d3.geoProjection(projRaw);
// };
// const pidegrad = 0.017453292519943295;
// const piraddeg = 57.29577951308232;
// const degreesToRadians = function degreesToRadians(degrees) { return degrees * pidegrad; };
// const radiansToDegrees = function radiansToDegrees(radians) { return radians * piraddeg; };

/**
* Return a d3.geoProjection from a proj4 projection.
* (code below should avoid some function calls compared to the previous commented
* section but achieve exactly the same job).
*
* @param {Object} _proj - The valid proj4 object returned by proj4.
* @return {Object} - The projection as a d3.geoProjection.
*
*/
export const getD3ProjFromProj4 = function getD3ProjFromProj4(_proj) {
  // Create the custom d3 projection using proj 4 forward and inverse functions:
  const projRaw = function (lambda, phi) {
    return _proj.forward([lambda * 57.29577951308232, phi * 57.29577951308232]);
  };
  projRaw.invert = function (x, y) {
    const p = _proj.inverse([x, y]);
    return [p[0] * 0.017453292519943295, p[1] * 0.017453292519943295];
  };
  return d3.geoProjection(projRaw);
};

export const tryFindNameProj = (proj_str) => {
  const o = Object.entries(_app.epsg_projections)
    .filter(proj => proj[1].proj4.indexOf(proj_str) > -1
      || proj[1].proj4.replace('+towgs84=0,0,0,0,0,0,0 ', '').indexOf(proj_str) > -1);
  if (o.length > 0) return o[0][1].name;
  return undefined;
};

export function isInterrupted(proj_name) {
  return (
    proj_name.indexOf('interrupted') > -1
    || proj_name.indexOf('armadillo') > -1
    || proj_name.indexOf('healpix') > -1);
}

export function handleClipPath(proj_name = '', main_layer) {
  const proj_name_lower = proj_name.toLowerCase();
  const defs_sphere = defs.node().querySelector('#sphereClipPath');
  const defs_extent = defs.node().querySelector('#extent');
  const defs_clipPath = defs.node().querySelector('clipPath');
  if (defs_sphere) { defs_sphere.remove(); }
  if (defs_extent) { defs_extent.remove(); }
  if (defs_clipPath) { defs_clipPath.remove(); }

  if (isInterrupted(proj_name_lower)) {
    defs.append('path')
      .datum({ type: 'Sphere' })
      .attr('id', 'sphereClipPath')
      .attr('d', path);

    defs.append('clipPath')
      .attr('id', 'clip')
      .append('use')
      .attr('xlink:href', '#sphereClipPath');

    map.selectAll('.layer:not(.no_clip)')
      .attr('clip-path', 'url(#clip)');

    svg_map.insertBefore(defs.node(), svg_map.childNodes[0]);
  } else if (proj_name_lower.indexOf('conicconformal') > -1) {
    const outline = d3.geoGraticule().extentMajor([[-180, -60], [180, 90]]).outline();

    // proj.fitSize([w, h], outline);
    // proj.scale(s).translate(t)
    // path.projection(proj);

    defs.append('path')
      .attr('id', 'extent')
      .attr('d', path(outline));
    defs.append('clipPath')
      .attr('id', 'clip')
      .append('use')
      .attr('xlink:href', '#extent');

    map.selectAll('.layer:not(.no_clip)')
      .attr('clip-path', 'url(#clip)');
    // map.selectAll('.layer')
    //     .selectAll('path')
    //     .attr('d', path);
    //
    // reproj_symbol_layer();
    // if (main_layer) {
    //   center_map(main_layer);
    //   zoom_without_redraw();
    // }
  } else {
    map.selectAll('.layer')
      .attr('clip-path', null);
  }
}

export function change_projection(new_proj_name) {
  // Disable the zoom by rectangle selection if the user is using it :
  map.select('.brush').remove();

  // Reactivate the graticule and the sphere options:
  d3.select('img#btn_graticule').style('opacity', '1').on('click', () => add_layout_feature('graticule'));
  d3.select('img#btn_sphere').style('opacity', '1').on('click', () => add_layout_feature('sphere'));

  // Only keep the first argument of the rotation parameter :
  let prev_rotate = proj.rotate ? [proj.rotate()[0], 0, 0] : [0, 0, 0];
  const def_proj = available_projections.get(new_proj_name);

  // Update global variables:
  // proj = def_proj.custom ? d3.geoProjection(window[def_proj.name]()).scale(def_proj.scale)
  //      : d3[def_proj.name]();
  proj = d3[def_proj.name]();
  if (def_proj.parallels) proj = proj.parallels(def_proj.parallels);
  else if (def_proj.parallel) proj = proj.parallel(def_proj.parallel);
  if (def_proj.clipAngle) proj = proj.clipAngle(def_proj.clipAngle);
  if (def_proj.rotate) prev_rotate = def_proj.rotate;
  if (proj.rotate) proj.rotate(prev_rotate);

  path = d3.geoPath().projection(proj).pointRadius(4);

  // According to the availability of the invert method (as they both need it):
  //  - Enable or disable the 'brush zoom' button
  //       allowing to zoom according to a rectangle selection.
  //  - Enable or disable the "scale bar" feature.
  if (proj.invert !== undefined) {
    document.getElementById('brush_zoom_button').style.display = '';
    d3.select('img#btn_scale').style('opacity', '1').on('click', () => add_layout_feature('scale'));
  } else {
    document.getElementById('brush_zoom_button').style.display = 'none';
    d3.select('img#btn_scale').style('opacity', '0.3').on('click', null);
  }

  // Reset the zoom on the targeted layer (or on the top layer if no targeted layer):
  let layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
  if (!layer_name && def_proj.bounds) {
    scale_to_bbox(def_proj.bounds);
  } else if (!layer_name) {
    const layers_active = Array.prototype.filter.call(
      svg_map.querySelectorAll('.layer'),
      f => f.style.visibility !== 'hidden',
    );
    layer_name = layers_active.length > 0
      ? global._app.id_to_layer.get(layers_active[layers_active.length - 1].id)
      : undefined;
  }
  if (layer_name) {
    scale_to_lyr(layer_name);
    center_map(layer_name);
    zoom_without_redraw();
  } else {
    proj.translate(t).scale(s);
    map.selectAll('.layer').selectAll('path').attr('d', path);
    reproj_symbol_layer();
  }

  // Remove the tooltip used for projections using proj4 :
  const a = document.querySelector('div.custom_tooltip');
  if (a) a.remove();
  const selectProj = document.querySelector('#form_projection2');
  selectProj.removeAttribute('tooltip');
  selectProj.removeEventListener('mouseover', displayTooltipProj4);
  selectProj.removeEventListener('mouseout', removeTooltipProj4);

  // Set or remove the clip-path according to the projection:
  handleClipPath(new_proj_name, layer_name);
}

export function change_projection_4(_proj) {
  remove_layer_cleanup('Sphere');

  // Disable the "sphere" and the "graticule" layers only if the projection is a conic one:
  if (global._app.last_projection &&
      (global._app.last_projection.indexOf('=lcc') > -1 || global._app.last_projection.indexOf('Lambert_Conformal_Conic') > -1)) {
    d3.select('img#btn_graticule').style('opacity', '0.3').on('click', null);
    d3.select('img#btn_sphere').style('opacity', '0.3').on('click', null);
  } else {
    d3.select('img#btn_graticule').style('opacity', '1').on('click', () => add_layout_feature('graticule'));
    d3.select('img#btn_sphere').style('opacity', '1').on('click', () => add_layout_feature('sphere'));
  }
  // Disable the zoom by rectangle selection if the user is using it :
  map.select('.brush').remove();

  // // Only keep the first argument of the rotation parameter :
  // const prev_rotate = proj.rotate ? [proj.rotate()[0], 0, 0] : [0, 0, 0];

  proj = getD3ProjFromProj4(_proj);
  path = d3.geoPath().projection(proj).pointRadius(4);
  // According to the availability of the invert method (as they both need it):
  //  - Enable or disable the 'brush zoom' button
  //      allowing to zoom according to a rectangle selection.
  //  - Enable or disable the "scale bar" feature.
  if (proj.invert !== undefined) {
    document.getElementById('brush_zoom_button').style.display = '';
    d3.select('img#btn_scale').style('opacity', '1').on('click', () => add_layout_feature('scale'));
  } else {
    document.getElementById('brush_zoom_button').style.display = 'none';
    d3.select('img#btn_scale').style('opacity', '0.3').on('click', null);
  }

  // // Reset the zoom on the targeted layer (or on the top layer if no targeted layer):
  let layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
  if (!layer_name) {
    const layers_active = Array.prototype.filter.call(
      svg_map.querySelectorAll('.layer'),
      f => f.style.visibility !== 'hidden',
    );
    layer_name = layers_active.length > 0
      ? global._app.id_to_layer.get(layers_active[layers_active.length - 1].id) : undefined;
  }
  if (!layer_name || layer_name === 'World' || layer_name === 'Sphere' || layer_name === 'Graticule') {
    scale_to_bbox([-10.6700, 34.5000, 31.5500, 71.0500]);
  } else {
    const rv = fitLayer(layer_name);
    s = rv[0];
    t = rv[1];
    if (isNaN(s) || s === 0 || isNaN(t[0]) || isNaN(t[1])) {
      s = 100; t = [0, 0];
      scale_to_bbox([-10.6700, 34.5000, 31.5500, 71.0500]);
    }
  }
  if (isNaN(s) || s === 0 || isNaN(t[0]) || isNaN(t[1])) {
    s = 100; t = [0, 0];
    console.log('Error');
    return false;
  }
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
  center_map(layer_name);
  zoom_without_redraw();

  // Remove the existing clip path if any :
  handleClipPath();
  return true;
}
