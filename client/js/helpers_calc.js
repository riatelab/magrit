import { Mmax, Msqrt, Mabs, Mround } from './helpers_math';
import { reproj_symbol_layer, zoom_without_redraw } from './map_ctrl';

const sin = Math.sin;
const cos = Math.cos;
const atan2 = Math.atan2;

/**
* Function computing the min of an array of values (tking care of empty/null/undefined slot)
*  - no fancy functionnalities here (it doesn't add anything comparing to Math.min.apply()
*    or d3.min() except a little speed-up)
*
* @param {Array} arr - The serie of values.
* @return {Number} - The minimum value.
*/
export function min_fast(arr) {
  let min = arr[0];
  for (let i = 1, len_i = arr.length; i < len_i; ++i) {
    const val = +arr[i];
    if (val && val < min) min = val;
  }
  return min;
}

/**
* Return the maximum value of an array of numbers
*
* @param {Array} arr - the array of numbers
* @return {Number} max
*/
export function max_fast(arr) {
  let max = arr[0];
  for (let i = 1, len_i = arr.length; i < len_i; ++i) {
    const val = +arr[i];
    if (val > max) max = val;
  }
  return max;
}

/**
* Test an array of numbers for negative values
*
* @param {Array} arr - the array of numbers
* @return {Bool} result - True or False, whether it contains negatives values or not
*/
export function has_negative(arr) {
  for (let i = 0; i < arr.length; ++i) {
    if (+arr[i] < 0) return true;
  }
  return false;
}

/**
* @param {Array} arr - The array to test
* @return {Boolean} result - True or False, according to whether it contains empty values or not
*/
export const contains_empty_val = function contains_empty_val(arr) {
  for (let i = arr.length - 1; i > -1; --i) {
    if (arr[i] == null) return true;
    else if (isNaN(+arr[i])) return true;
  }
  return false;
};

/**
* @param {Array} arr - The array to test
* @return {Boolean} result - True or False, according to whether it contains duplicate or not
*/
export function has_duplicate(arr) {
  const _h = {},
    len_arr = arr.length;
  for (let i = 0; i < len_arr; i++) {
    if (_h[arr[i]]) return true;
    _h[arr[i]] = true;
  }
  return false;
}

/**
* Round a given value with the given precision
*
* @param {Number} val - The value to be rounded.
* @param {Number} precision - The wanted precision.
* @return {Number} value - The rounded value.
*/
export const round_value = function (val, nb) {
  if (nb === undefined) { return val; }
  const dec_mult = +['1', Array(Mabs(nb)).fill('0').join('')].join('');
  return nb >= 0
    ? Mround(+val * dec_mult) / dec_mult
    : Mround(+val / dec_mult) * dec_mult;
};

export function get_nb_decimals(nb) {
  const tmp = nb.toString().split('.');
  return tmp.length < 2 ? 0 : tmp[1].length;
}

export function get_nb_left_separator(nb) {
  const tmp = nb.toString().split('.');
  return tmp[0].length;
}

/**
* Get the decimal separator in user's locale.
* and compute the number of item in each bin.
*
* @return {String} separator - The decimal separator (dot or comma)
*/
export function getDecimalSeparator() {
  return 1.1.toLocaleString().substr(1, 1);
}

export const get_precision_axis = (serie_min, serie_max, precision) => {
  const range_serie = serie_max - serie_min;
  if (serie_max > 1 && range_serie > 100) {
    return '.0f';
  } else if (range_serie > 10) {
    if (precision === 0) {
      return '.0f';
    }
    return '.1f';
  } else if (range_serie > 1) {
    if (precision < 2) {
      return '.1f';
    }
    return '.2f';
  } else if (range_serie > 0.1) {
    return '.3f';
  } else if (range_serie > 0.01) {
    return '.4f';
  } else if (range_serie > 0.001) {
    return '.5f';
  } else if (range_serie > 0.0001) {
    return '.6f';
  } else if (range_serie > 0.00001) {
    return '.7f';
  }
  return '.8f';
};

export const PropSizer = function (fixed_value, fixed_size, type_symbol) {
  this.fixed_value = fixed_value;
  const sqrt = Math.sqrt,
    abs = Math.abs,
    pi = Math.PI;
  if (type_symbol === 'circle') {
    this.smax = fixed_size * fixed_size * pi;
    this.scale = val => sqrt(abs(val) * this.smax / this.fixed_value) / pi;
    this.get_value = size => ((size * pi) ** 2) / this.smax * this.fixed_value;
  } else if (type_symbol === 'line') {
    this.smax = fixed_size;
    this.scale = val => abs(val) * this.smax / this.fixed_value;
    this.get_value = size => size / this.smax * this.fixed_value;
  } else {
    this.smax = fixed_size * fixed_size;
    this.scale = val => sqrt(abs(val) * this.smax / this.fixed_value);
    this.get_value = size => (size ** 2) / this.smax * this.fixed_value;
  }
};

export function prop_sizer3_e(arr, fixed_value, fixed_size, type_symbol) {
  const pi = Math.PI,
    abs = Math.abs,
    sqrt = Math.sqrt,
    arr_len = arr.length,
    res = [];

  if (!fixed_value || fixed_value === 0) {
    fixed_value = max_fast(arr);
  }

  if (type_symbol === 'circle') {
    const smax = fixed_size * fixed_size * pi;
    const t = smax / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(sqrt(abs(arr[i]) * t) / pi); }
  } else if (type_symbol === 'line') {
    const t = fixed_size / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(abs(arr[i]) * t); }
  } else {
    const smax = fixed_size * fixed_size;
    const t = smax / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(sqrt(abs(arr[i]) * t)); }
  }
  return res;
}

/**
* Compute a summary about the given serie of values.
*
* @param {Array} _values - The serie of values.
* @param {Integer} bins - The number of bins to be used to compute the stock by class.
* @return {Object} - A summary containing the break values (according to the number
* of bins), the min value, the max value, the mean value, the median value,
* the standard deviation and the stock by class.
*
*/
export function getBinsCount(_values, bins = 16) {
  const values = _values.filter(a => a).sort((a, b) => a - b);
  const nb_ft = values.length;
  const min = values[0],
    max = values[nb_ft - 1],
    extend = max - min,
    bin_size = extend / bins,
    counts = new Array(bins),
    break_values = [min],
    ix_med = (nb_ft + 1) / 2;
  let sum = 0;

  for (let i = 0; i < bins; i++) {
    break_values.push(break_values[i] + bin_size);
  }
  for (let i = 1, j = 0; i < nb_ft; i++) {
    const class_max = break_values[i - 1];
    counts[i - 1] = 0;
    while (values[j] <= class_max) {
      sum += values[j];
      counts[i - 1] += 1;
      j += 1;
    }
  }
  const mean = sum / nb_ft;
  const stddev = getStdDev(values, mean);

  return {
    breaks: break_values,
    counts,
    min,
    max,
    mean,
    median: (ix_med | 0) === ix_med ? values[ix_med] : (values[Math.floor(ix_med)] + values[Math.ceil(ix_med)]) / 2,
    stddev,
  };
}

/**
* Return the haversine distance in kilometers between two points (lat/long coordinates)
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/
export function haversine_dist(A, B) {
  const pi_dr = Math.PI / 180;

  const lat1 = +A[0],
    lon1 = +A[1],
    lat2 = +B[0],
    lon2 = +B[1];

  const x1 = lat2 - lat1,
    dLat = x1 * pi_dr,
    x2 = lon2 - lon1,
    dLon = x2 * pi_dr;

  const a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1 * pi_dr) * cos(lat2 * pi_dr) *
                sin(dLon / 2) * sin(dLon / 2);
  return 6371 * 2 * atan2(Msqrt(a), Msqrt(1 - a));
}

/**
* Return the distance in kilometers between two points (lat/long coordinates)
* according to the spherical law of cosines
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/
export function coslaw_dist(A, B) {
  const pi_dr = Math.PI / 180;

  const lat1 = +A[0],
    lon1 = +A[1],
    lat2 = +B[0],
    lon2 = +B[1];
  const phi1 = lat1 * pi_dr,
    phi2 = lat2 * pi_dr,
    d_lambda = (lon2 - lon1) * pi_dr;
  return Math.acos(Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(d_lambda)) * 6371;
}

// /**
// * Compute the euclidian distance between pt1 and pt2, in the unit provided.
// *
// * @param {Array} pt1 - Coordinates of the 1st point as [x, y].
// * @param {Array} pt2 - Coordinates of the 2nd point as [x, y].
// * @return {Number} - The euclidian distance between pt1 and pt2.
// */
// export function get_distance(pt1, pt2) {
//   const xs = pt2[0] - pt1[1];
//   const ys = pt2[1] - pt1[1];
//   return Msqrt((xs * xs) + (ys * ys));
// }

/**
* Compute the standard deviation of a serie of values.
*
* @param {Array} values - The serie of values.
* @param {Number} mean_val - The mean of the serie (computed upstream).
* @return {Number} - The standard deviation.
*/
function getStdDev(values, mean_val) {
  const nb_val = values.length;
  // const pow = Math.pow;
  let s = 0;
  for (let i = 0; i < nb_val; i++) {
    // s += pow(values[i] - mean_val, 2);
    s += (values[i] - mean_val) ** 2;
  }
  return Msqrt((1 / nb_val) * s);
}

/**
* Return the maximal available rectangle in the map
*  in order to locate a new legend without covering existing ones.
*
* Implementation taken from http://www.codinghands.co.uk/blog/2013/02/javascript-implementation-omn-maximal-rectangle-algorithm/
*
* @param {NodeList} legend_nodes - All the existing `Node`s corresponding
                    to the main (ie. larger) element of a legend on the map.
* @return {Object} - A summary about the larger available rectangle found.
*
*/
function getMaximalAvailableRectangle(legend_nodes) {
  function getMaxRect() {
    const cache = new Array(rows + 1);
    const stack = [];
    let bestUpperLeft = { x: -1, y: -1 };
    let bestLowerRight = { x: -1, y: -1 };

    for (let i = 0; i < cache.length; i++) {
      cache[i] = 0;
    }

    for (let x = cols - 1; x >= 0; x--) {
      updateCache(x, cache);
      let width = 0;
      for (let y = 0; y < rows + 1; y++) {
        if (cache[y] > width) {
          stack.push({ y, width });
          width = cache[y];
        }
        if (cache[y] < width) {
          let y0;
          let w0;
          while (true) {
            const pop = stack.pop();
            y0 = pop.y;
            w0 = pop.width;
            if (((width * (y - y0)) > area(bestUpperLeft, bestLowerRight))
                && (y - y0 >= minQuadY) && (width >= minQuadX)) {
              bestUpperLeft = { x, y: y0 };
              bestLowerRight = { x: x + width - 1, y: y - 1 };
            }
            width = w0;
            if (cache[y] >= width) break;
          }
          width = cache[y];
          if (width !== 0) stack.push({ y: y0, width: w0 });
        }
      }
    }
    return {
      x: bestUpperLeft.x,
      y: bestUpperLeft.y,
      lenX: bestLowerRight.x - bestUpperLeft.x + 1,
      lenY: bestLowerRight.y - bestUpperLeft.y + 1,
      area: area(bestUpperLeft, bestLowerRight),
    };
  }

  function area(upperLeft, lowerRight) {
    if (upperLeft.x > lowerRight.x || upperLeft.y > lowerRight.y) return 0;
    return ((lowerRight.x + 1) - (upperLeft.x)) * ((lowerRight.y + 1) - (upperLeft.y));
  }

  function updateCache(x, cache) {
    for (let y = 0; y < rows; y++) {
      if (mat[x][y] === 1) cache[y]++;
      else cache[y] = 0;
    }
  }

  function fillMat(xs, ys) {
    for (let x = xs[0]; x < xs[1]; x++) {
      for (let y = ys[0]; y < ys[1]; y++) {
        mat[x][y] = 0;
      }
    }
  }
  let { x: x0, y: y0 } = get_map_xy0();
  let minQuadY = 100;
  let minQuadX = 40;
  // x0 = Math.abs(x0);
  // y0 = Math.abs(y0);
  // let cols = Math.abs(w);
  // let rows = Math.abs(h);
  // let mat = new Array(cols);
  // for (let i = 0; i < cols; i++) {
  //   mat[i] = new Array(rows);
  //   for (let j = 0; j < rows; j++) {
  //     mat[i][j] = 1;
  //   }
  // }
  x0 = Math.floor(x0);
  y0 = Math.floor(y0);
  let cols = Math.floor(w);
  let rows = Math.floor(h);
  let mat = [];
  for (let i = 0; i < cols; i++) {
    mat.push([]);
    for (let j = 0; j < rows; j++) {
      mat[i].push(1);
    }
  }
  for (let i = 0; i < legend_nodes.length; i++) {
    const bbox = legend_nodes[i].getBoundingClientRect();
    let bx = Math.floor(bbox.left - x0);
    let by = Math.floor(bbox.top - y0);
    if (bx < 0) bx = 0;
    if (by < 0) by = 0;
    const bx2 = (bx + Math.floor(bbox.width)) >= cols ? cols - 1 : bx + Math.floor(bbox.width);
    const by2 = (by + Math.floor(bbox.height)) >= rows ? rows - 1 : by + Math.floor(bbox.height);
    fillMat([bx, bx2], [by, by2]);
  }
  return getMaxRect(mat);
}

/**
* Get the x and y parameters to be used to translate a newly created legend
* in order it doesn't overlay existing legends.
*
* @return {Array} - The x and y values to be used to translate the new legend.
*
*/
export function getTranslateNewLegend() {
  const legends = svg_map.querySelectorAll('.legend_feature');
  if (legends.length === 0) {
    return { x: 0, y: 0 };
  }
  try {
    return getMaximalAvailableRectangle(legends);
  } catch (e) {
    console.log(e);
    return { x: 0, y: 0 };
  }
}

/**
* Scale the map to the given rectangular bouding box (in geographic coordinates / WGS84),
* redraw the path of all the layer and also reproject the layers containing ponctual
* features (such as symbol layer, labels, etc.)
*
* @param {Array} bbox - The bounding box (as [xmin, ymin, xmax, ymax]) to scale on.
* @return {void}
*
*/
export function scale_to_bbox(bbox) {
  const [xmin, ymin, xmax, ymax] = bbox;
  const feature = {
    type: 'Feature',
    properties: {},
    id: 0,
    geometry: {
      type: 'LineString',
      coordinates: [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]],
    },
  };
  const bboxPath = path.bounds(feature);
  s = 0.95 / Mmax(
    (bboxPath[1][0] - bboxPath[0][0]) / w, (bboxPath[1][1] - bboxPath[0][1]) / h) * proj.scale();
  t = [0, 0];
  proj.scale(s).translate(t);
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
  const zoom_scale = 1;
  const zoom_translate = [
    (w - zoom_scale * (bboxPath[1][0] + bboxPath[0][0])) / 2,
    (h - zoom_scale * (bboxPath[1][1] + bboxPath[0][1])) / 2];
  const zoom = svg_map.__zoom;
  zoom.k = zoom_scale;
  zoom.x = zoom_translate[0];
  zoom.y = zoom_translate[1];
  zoom_without_redraw();
}
