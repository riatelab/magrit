import { clickLinkFromDataUrl, display_error_during_computation, xhrequest } from './helpers';
import { Mceil } from './helpers_math';
import { custom_fonts } from './fonts';
import { reproj_symbol_layer } from './map_ctrl';


function patchSvgForFonts() {
  function getListUsedFonts() {
    const elems = [
      svg_map.getElementsByTagName('text'),
      svg_map.getElementsByTagName('p'),
    ];
    const needed_definitions = [];
    elems.map(d => d || []);
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < elems[j].length; i++) {
        const font_elem = elems[j][i].style.fontFamily;
        custom_fonts.forEach((font) => {
          if (font_elem.indexOf(font) > -1 && needed_definitions.indexOf(font) === -1) {
            needed_definitions.push(font);
          }
        });
      }
    }
    return needed_definitions;
  }

  const needed_definitions = getListUsedFonts();
  if (needed_definitions.length === 0) {
    return;
  }
  const fonts_definitions = Array.prototype.filter.call(
    document.styleSheets,
    i => (i.href && i.href.indexOf('style-fonts.css') > -1 ? i : null),
  )[0].cssRules;
  const fonts_to_add = needed_definitions
    .map(name => String(fonts_definitions[custom_fonts.indexOf(name)].cssText));
  const style_elem = document.createElement('style');
  style_elem.innerHTML = fonts_to_add.join(' ');
  svg_map.querySelector('defs').appendChild(style_elem);
}


function unpatchSvgForFonts() {
  const defs_style = svg_map.querySelector('defs').querySelector('style');
  if (defs_style) defs_style.remove();
}

function patchSvgForInkscape() {
  svg_map.setAttribute('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');
  const elems = svg_map.getElementsByTagName('g');
  for (let i = elems.length - 1; i > -1; i--) {
    if (elems[i].id === '') {
      continue;
    } else if (elems[i].classList.contains('layer')) {
      elems[i].setAttribute('inkscape:label', elems[i].id);
    } else if (elems[i].id.indexOf('legend') > -1) {
      const layer_name = elems[i].className.baseVal.split('lgdf_')[1];
      elems[i].setAttribute('inkscape:label', `legend_${layer_name}`);
    } else {
      elems[i].setAttribute('inkscape:label', elems[i].id);
    }
    elems[i].setAttribute('inkscape:groupmode', 'layer');
  }
}

function unpatchSvgForInkscape() {
  svg_map.removeAttribute('xmlns:inkscape');
  const elems = svg_map.getElementsByTagName('g');
  for (let i = elems.length - 1; i > -1; i--) {
    if (elems[i].id !== '') {
      elems[i].removeAttribute('inkscape:label');
      elems[i].removeAttribute('inkscape:groupmode');
    }
  }
}

function patchSvgForForeignObj() {
  const elems = document.getElementsByTagName('foreignObject');
  const originals = [];
  for (let i = 0; i < elems.length; i++) {
    const el = elems[i];
    originals.push([el.getAttribute('width'), el.getAttribute('height')]);
    el.setAttribute('width', '100%');
    el.setAttribute('height', '100%');
  }
  return originals;
}

function unpatchSvgForForeignObj(originals) {
  const elems = document.getElementsByTagName('foreignObject');
  for (let i = 0; i < originals.length; i++) {
    const el = elems[i];
    el.setAttribute('width', originals[i][0]);
    el.setAttribute('height', originals[i][1]);
  }
}

function patchSvgBackground() {
  d3.select(svg_map)
    .insert('g', 'defs')
    .attr('id', 'G_bg')
    .insert('rect')
    .attrs({
      id: 'background',
      width: w,
      height: h,
      x: 0,
      y: 0,
    })
    .style('fill', document.getElementById('bg_color').value);
}

function unpatchSvgBackground() {
  svg_map.querySelector('#G_bg').remove();
}

function check_output_name(name, extension) {
  const _name = name.toLowerCase().indexOf(extension) > -1
    ? name.substring(0, name.lastIndexOf('.'))
    : name;
  const regexpName = new RegExp(/^[().a-z0-9_-]+$/i);
  if (regexpName.test(_name) && _name.length < 250) {
    return `${_name}.${extension}`;
  }
  return `export.${extension}`;
}

/*
* Straight from http://stackoverflow.com/a/26047748/5050917
*
*/
function changeResolution(canvas, scaleFactor) {
  // Set up CSS size if it's not set up already
  if (!canvas.style.width) canvas.style.width = `${canvas.width}px`; // eslint-disable-line no-param-reassign
  if (!canvas.style.height) canvas.style.height = `${canvas.height}px`; // eslint-disable-line no-param-reassign

  canvas.width = Mceil(canvas.width * scaleFactor); // eslint-disable-line no-param-reassign
  canvas.height = Mceil(canvas.height * scaleFactor); // eslint-disable-line no-param-reassign
  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);
}

export function export_compo_svg(output_name, clip_to_viewport) {
  const _finally = () => {
    if (clip_to_viewport) {
      proj = proj.clipExtent(null);
      map.selectAll('.layer').selectAll('path').attr('d', path);
      reproj_symbol_layer();
    }
  };
  const zoom_params = svg_map.__zoom;
  const _output_name = check_output_name(output_name, 'svg');
  patchSvgForInkscape();
  patchSvgForFonts();
  patchSvgBackground();
  if (clip_to_viewport) {
    proj = proj.clipExtent([
      [0 - zoom_params.x / zoom_params.k, 0 - zoom_params.y / zoom_params.k],
      [(w - zoom_params.x) / zoom_params.k, (h - zoom_params.y) / zoom_params.k],
    ]);
    map.selectAll('.layer').selectAll('path').attr('d', path);
    reproj_symbol_layer();
  }
  const dimensions_foreign_obj = patchSvgForForeignObj();
  const targetSvg = document.getElementById('svg_map'),
    serializer = new XMLSerializer();
  let source = serializer.serializeToString(targetSvg);

  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = ['<?xml version="1.0" standalone="no"?>\r\n', source].join('');

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  clickLinkFromDataUrl(url, _output_name).then(() => {
    unpatchSvgForFonts();
    unpatchSvgForForeignObj(dimensions_foreign_obj);
    unpatchSvgForInkscape();
    unpatchSvgBackground();
    _finally();
  }).catch((err) => {
    display_error_during_computation();
    console.log(err);
    _finally();
  });
}

// Maybe PNGs should be rendered on server side in order to avoid limitations that
//   could be encountered in the browser (as 'out of memory' error)
export function export_compo_png(scalefactor = 1, output_name) {
  global._app.waitingOverlay.display();
  const _output_name = check_output_name(output_name, 'png');
  const dimensions_foreign_obj = patchSvgForForeignObj();
  patchSvgForFonts();
  const targetCanvas = d3.select('body').append('canvas')
    .attrs({ id: 'canvas_map_export', height: h, width: w })
    .node();
  const targetSVG = document.querySelector('#svg_map');
  const mime_type = 'image/png';
  let svg_xml,
    ctx,
    img;

  // At this point it might be better to wrap the whole function in a try catch ?
  // (as it seems it could fail on various points :
  // XMLSerializer()).serializeToString, toDataURL, changeResolution, etc.)
  try {
    svg_xml = (new XMLSerializer()).serializeToString(targetSVG);
    ctx = targetCanvas.getContext('2d');
    img = new Image();
  } catch (err) {
    global._app.waitingOverlay.hide();
    targetCanvas.remove();
    display_error_during_computation(String(err));
    return;
  }
  if (scalefactor !== 1) {
    try {
      changeResolution(targetCanvas, scalefactor);
    } catch (err) {
      global._app.waitingOverlay.hide();
      targetCanvas.remove();
      display_error_during_computation(`${_tr('app_page.common.error_too_high_resolution')} ${String(err)}`);
      return;
    }
  }
  let imgUrl;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg_xml)}`;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    try {
      imgUrl = targetCanvas.toDataURL(mime_type);
    } catch (err) {
      global._app.waitingOverlay.hide();
      targetCanvas.remove();
      display_error_during_computation(String(err));
      return;
    }
    clickLinkFromDataUrl(imgUrl, _output_name).then(() => {
      unpatchSvgForFonts();
      unpatchSvgForForeignObj(dimensions_foreign_obj);
      global._app.waitingOverlay.hide();
      targetCanvas.remove();
    }).catch((err) => {
      display_error_during_computation();
      console.log(err);
    });
  };
}

export function export_layer_geo(layer, type, projec, proj4str) {
  const formToSend = new FormData();
  formToSend.append('layer', layer);
  formToSend.append('layer_name', data_manager.current_layers[layer].key_name);
  formToSend.append('format', type);
  if (projec === 'proj4string') {
    formToSend.append('projection', JSON.stringify({ proj4string: proj4str }));
  } else {
    formToSend.append('projection', JSON.stringify({ name: projec }));
  }
  const extensions = new Map([
    ['GeoJSON', 'geojson'],
    ['TopoJSON', 'topojson'],
    ['ESRI Shapefile', 'zip'],
    ['GML', 'zip'],
    ['KML', 'kml']]);

  xhrequest('POST', 'get_layer2', formToSend, true)
    .then((data) => {
      if (data.indexOf('{"Error"') === 0 || data.length === 0) {
        let error_message;
        if (data.indexOf('{"Error"') < 5) {
          error_message = _tr(JSON.parse(data).Error);
        } else {
          error_message = _tr('app_page.common.error_msg');
        }
        swal({
          title: 'Oops...',
          text: error_message,
          type: 'error',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => null, () => null);
        return;
      }
      const ext = extensions.get(type),
        filename = [layer, ext].join('.');
      let dataStr;
      if (ext.indexOf('json') > -1) {
        dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`;
      } else if (ext.indexOf('kml') > -1) {
        dataStr = `data:text/xml;charset=utf-8,${encodeURIComponent(data)}`;
      } else {
        dataStr = `data:application/zip;base64,${data}`;
      }
      clickLinkFromDataUrl(dataStr, filename);
    }, (error) => {
      console.log(error);
    });
}
