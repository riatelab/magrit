import { getColorBrewerArray } from './../colors_helpers';
import { isNumber } from './../helpers';
import { has_negative, round_value } from './../helpers_calc';
import { Mabs, Mceil, Mround, Msqrt } from './../helpers_math';

const floor = Math.floor;
const log10 = Math.log10;

// Shortcut to the name of the methods offered by geostats library:
export const discretiz_geostats_switch = new Map([
  ['jenks', 'getJenks'],
  ['equal_interval', 'getEqInterval'],
  // ['std_dev', 'getStdDeviation'],
  ['quantiles', 'getQuantile'],
  ['Q6', 'getBreaksQ6'],
  ['geometric_progression', 'getGeometricProgression'],
]);

/**
* Compute the "optimal" (cf. xxx) number of class according to the number
* of features in serie of values.
*
* @param {Integer} len_serie - The length of the serie of values.
* @return {Integer} - The "optimal" number of classes to be used to discretize the serie.
*/
export function getOptNbClass(len_serie) {
  return floor(1 + 3.3 * log10(len_serie));
}


/**
* Compute breaks according to "Q6" method
* and compute the number of item in each bin.
*
* @param {Array} serie - An array of ordered values.
* @param {Number} precision - An integer value decribing the precision of the serie.
* @return {Object} - Object containing the breaks and the stock in each class.
*/
export function getBreaksQ6(serie, precision = null) {
  const len_serie = serie.length;
  const q6_class = [
    1,
    0.05 * len_serie,
    0.275 * len_serie,
    0.5 * len_serie,
    0.725 * len_serie,
    0.95 * len_serie,
    len_serie,
  ];
  let breaks = [];
  let tmp = 0;
  let j;
  const stock_class = [];
  for (let i = 0; i < 7; ++i) {
    j = Mround(q6_class[i]) - 1;
    breaks.push(+serie[j]);
    stock_class.push(j - tmp);
    tmp = j;
  }
  stock_class.shift();
  if (breaks[0] === breaks[1]) {
    // breaks[1] = breaks[0] + (breaks[2] - breaks[1]) / 2;
    breaks[1] = (+serie[1] + breaks[0]) / 2;
  }
  if (breaks[6] === breaks[5]) {
    breaks[5] = serie[len_serie - 2];
    // breaks[5] = breaks[4] + (breaks[5] - breaks[4]) / 2;
  }
  if (precision != null) {
    breaks = breaks.map(val => round_value(val, precision));
  }
  return {
    breaks,
    stock_class,
  };
}

/**
* Compute breaks according to our "mean and standard deviation" method
* and compute the number of item in each bin.
*
* @param {Array} serie - An array of ordered values.
* @param {Number} share - The ratio of stddev to be used a size for each class.
* @param {String} mean_position - The position of the mean value.
* @param {Number} precision - An integer value decribing the precision of the serie.
* @return {Object} - Object containing the breaks and the stock in each class.
*/
export function getBreaksStdDev(serie, share, mean_position = 'center', precision) {
  const min = serie.min(),
    max = serie.max(),
    mean = serie.mean(),
    std_dev = serie.stddev(),
    class_size = std_dev * share;
  const breaks = mean_position === 'center'
    ? [mean - (class_size / 2), mean + (class_size / 2)]
    : [mean - class_size, mean, mean + class_size];

  const _precision = precision || serie.precision;

  while (breaks[0] > min) {
    breaks.unshift(breaks[0] - class_size);
  }
  while (breaks[breaks.length - 1] < max) {
    breaks.push(breaks[breaks.length - 1] + class_size);
  }
  const nb_class = breaks.length - 1;
  if (breaks[0] < min) {
    if (breaks[1] < min) {
      console.log('This shouldn\'t happen (min)');
    }
    breaks[0] = min;
  }

  if (breaks[nb_class] > max) {
    if (breaks[nb_class - 1] > max) {
      console.log('This shouldn\'t happen (max)');
    }
    breaks[nb_class] = max;
  }
  return {
    nb_class,
    breaks: breaks.map(v => round_value(v, _precision)),
  };
}

function getBreaks(values, type, n_class) {
  // const _values = values.filter(v => v === 0 || (v && !Number.isNaN(+v))),
  const _values = values.filter(v => isNumber(v)),
    no_data = values.length - _values.length,
    nb_class = +n_class || getOptNbClass(_values.length);
  const serie = new geostats(_values); // eslint-disable-line new-cap
  let breaks;
  if (type === 'Q6') {
    const tmp = getBreaksQ6(serie.sorted(), serie.precision);
    breaks = tmp.breaks;
    breaks[0] = serie.min();
    breaks[nb_class] = serie.max();
    serie.setClassManually(breaks);
  } else {
    const _func = discretiz_geostats_switch.get(type);
    breaks = serie[_func](nb_class);
    if (serie.precision) breaks = breaks.map(val => round_value(val, serie.precision));
  }
  return [serie, breaks, nb_class, no_data];
}

export function discretize_to_size(values, type, nb_class, min_size, max_size) {
  const [serie, breaks, n_class] = getBreaks(values, type, nb_class);
  const step = (max_size - min_size) / (n_class - 1),
    class_size = Array(n_class).fill(0).map((d, i) => min_size + (i * step)),
    breaks_prop = [];

  for (let i = 0; i < breaks.length - 1; ++i) {
    breaks_prop.push([[breaks[i], breaks[i + 1]], class_size[i]]);
  }
  return [n_class, type, breaks_prop, serie];
}

export function discretize_to_colors(values, type, nb_class, col_ramp_name) {
  const name_col_ramp = col_ramp_name || 'Reds';
  const [serie, breaks, n_class, nb_no_data] = getBreaks(values, type, nb_class),
    color_array = getColorBrewerArray(n_class, name_col_ramp),
    no_data_color = nb_no_data > 0 ? '#e7e7e7' : null,
    colors_map = [];
  for (let j = 0; j < values.length; ++j) {
    if (isNumber(values[j])) {
      const idx = serie.getClass(values[j]);
      colors_map.push(color_array[idx]);
    } else {
      colors_map.push(no_data_color);
    }
  }
  return [n_class, type, breaks, color_array, colors_map, no_data_color];
}

/**
* Parse a string of comma separated break values
* to an actual Array of break values.
* The serie is used to defined if there may be negative values
* in the defined break values.
*
* @param {Array} serie - The serie of values to be discretised with `breaks_list`.
* @param {String} breaks_list - The user_defined break values as String.
* @return {Array} - The actual Array of break values.
*/
function parseUserDefinedBreaks(serie, breaks_list) {
  const separator = has_negative(serie) ? '- ' : '-';
  return breaks_list.split(separator).map(el => +el.trim());
}

/**
* Returns the break values and the stock of each class given
* a list of breaks defined by the user.
*
* @param {Array} serie - The serie of values to be discretised
* @param {Array} breaks - The list of breaks, whether as a String (a typed by the user)
*                    or as an Array.
* @return {Object} - An Object with the stock (number of feature) in each class
*                    and the break values (should be unchanged if provided as an Array)
*/
export function getBreaks_userDefined(serie, breaks) {
  const break_values = (typeof breaks === 'string')
    ? parseUserDefinedBreaks(serie, breaks)
    : breaks;
  const len_break_val = break_values.length,
    stock_class = new Array(len_break_val - 1);
  let j = 0;
  for (let i = 1; i < len_break_val; ++i) {
    const class_max = break_values[i];
    stock_class[i - 1] = 0;
    while (serie[j] <= class_max) {
      stock_class[i - 1] += 1;
      j += 1;
    }
  }
  return {
    breaks: break_values,
    stock_class,
  };
}

export const prepare_ref_histo = (parent_node, serie, formatCount) => {
  const svg_h = h / 7.25 > 80 ? h / 7.25 : 80,
    svg_w = w / 4 > 320 ? 320 : w / 4,
    values = serie.sorted(),
    nb_bins = (values.length / 3) > 51 ? 50 : Mceil(Msqrt(values.length)) + 1;

  const q5 = serie.getQuantile(4).map(v => +v);

  const m_margin = { top: 10, right: 20, bottom: 10, left: 20 },
    m_width = svg_w - m_margin.right - m_margin.left,
    m_height = svg_h - m_margin.top - m_margin.bottom;

  const ref_histo = parent_node.select('#ref_histo_box').select('#inner_ref_histo_box');

  ref_histo.append('p')
    .attrs({ id: 'ref_histo_title' })
    .styles({ margin: 'auto', 'text-align': 'center' })
    .html(`<b>${_tr('disc_box.hist_ref_title')}</b>`);

  const c = ref_histo.append('svg')
    .attrs({
      id: 'svg_ref_histo',
      width: svg_w + m_margin.left + m_margin.right,
      height: svg_h + m_margin.top + m_margin.bottom,
    });

  const x = d3.scaleLinear()
    .domain([serie.min(), serie.max()])
    .rangeRound([0, m_width]);

  let svg_ref_histo = c.append('g')
    .attr('transform', `translate(${m_margin.left + m_margin.right}, ${m_margin.top})`);

  return (type) => {
    svg_ref_histo.remove();
    svg_ref_histo = c.append('g')
      .attr('transform', `translate(${m_margin.left + m_margin.right}, ${m_margin.top})`);
    if (type === 'histogram') {
      const data = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(nb_bins))(values);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.length)])
        .range([m_height, 0]);

      const bar = svg_ref_histo.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attrs(d => ({
          class: 'bar',
          width: Mabs(x(d.x1)) - Mabs(x(d.x0)),
          height: m_height - y(d.length),
          x: 0,
          transform: `translate(${x(d.x0)},${y(d.length)})`,
        }))
        .styles({ fill: 'beige', stroke: 'black', 'stroke-width': '0.4px' });

      svg_ref_histo.append('g')
        .style('font-size', '10px')
        .attrs({ class: 'x_axis', transform: `translate(0,${m_height})` })
        .call(d3.axisBottom()
          .scale(x)
          .ticks(4)
          .tickFormat(formatCount))
        .selectAll('text')
        .attrs({
          x: -4,
          y: 4,
          dy: '.45em',
          transform: 'rotate(-40)',
        })
        .style('text-anchor', 'end');

      svg_ref_histo.append('g')
        .attr('class', 'y_axis')
        .style('font-size', '10px')
        .call(d3.axisLeft()
          .scale(y)
          .ticks(5)
          .tickFormat(d3.format('.0f')));
    } else if (type === 'box_plot') {
      svg_ref_histo.append('g')
        .style('font-size', '10px')
        .attrs({ class: 'x_axis', transform: `translate(0,${m_height})` })
        .call(d3.axisBottom()
          .scale(x)
          .ticks(4)
          .tickFormat(formatCount))
        .selectAll('text')
        .attrs({
          x: -4,
          y: 4,
          dy: '.45em',
          transform: 'rotate(-40)',
        })
        .style('text-anchor', 'end');

      const y_mid = (m_margin.top + m_height - m_margin.bottom) / 2;

      svg_ref_histo.append('g')
        .insert('line')
        .attrs({ x1: x(q5[0]), y1: m_margin.top * 2, x2: x(q5[0]), y2: m_height - m_margin.bottom * 2 })
        .styles({ 'stroke-width': 1, stroke: 'black', fill: 'none' });

      svg_ref_histo.append('g')
        .insert('rect')
        .attrs({ x: x(q5[1]), y: m_margin.top, width: x(q5[2]) - x(q5[1]), height: m_height - m_margin.bottom - m_margin.top })
        .styles({ 'stroke-width': 1, stroke: 'black', fill: 'lightblue' });

      svg_ref_histo.append('g')
        .insert('line')
        .attrs({ x1: x(q5[2]), y1: m_margin.top, x2: x(q5[2]), y2: m_height - m_margin.bottom })
        .styles({ 'stroke-width': 3, stroke: 'black', fill: 'none' });

      svg_ref_histo.append('g')
        .insert('rect')
        .attrs({ x: x(q5[2]), y: m_margin.top, width: x(q5[3]) - x(q5[2]), height: m_height - m_margin.bottom - m_margin.top })
        .styles({ 'stroke-width': 1, stroke: 'black', fill: 'lightblue' });

      svg_ref_histo.append('g')
        .insert('line')
        .attrs({ x1: x(q5[4]), y1: m_margin.top * 2, x2: x(q5[4]), y2: m_height - m_margin.bottom * 2 })
        .styles({ 'stroke-width': 1, stroke: 'black', fill: 'none' });

      svg_ref_histo.append('g')
        .insert('line')
        .attrs({
          x1: x(q5[0]),
          y1: y_mid,
          x2: x(q5[1]),
          y2: y_mid,
        })
        .styles({
          'stroke-width': 1,
          stroke: 'black',
          fill: 'none',
          'stroke-dasharray': '3,3',
        });

      svg_ref_histo.append('g')
        .insert('line')
        .attrs({
          x1: x(q5[3]),
          y1: y_mid,
          x2: x(q5[4]),
          y2: y_mid,
        })
        .styles({
          'stroke-width': 1,
          stroke: 'black',
          fill: 'none',
          'stroke-dasharray': '3,3',
        });
    } else if (type === 'beeswarm') {
      const data = values.map(v => ({ value: +v }));

      const simulation = d3.forceSimulation(data)
        .force('x', d3.forceX(d => x(d.value)).strength(1))
        .force('y', d3.forceY(m_height / 2).strength(2))
        .force('collide', d3.forceCollide(4))
        .stop();

      for (let i = 0; i < 75; ++i) {
        simulation.tick();
      }
      svg_ref_histo.append('g')
        .style('font-size', '10px')
        .attrs({ class: 'x_axis', transform: `translate(0,${m_height})` })
        .call(d3.axisBottom()
          .scale(x)
          .ticks(4)
          .tickFormat(formatCount))
        .selectAll('text')
        .attrs({
          x: -4,
          y: 4,
          dy: '.45em',
          transform: 'rotate(-40)',
        })
        .style('text-anchor', 'end');

      const cell = svg_ref_histo.append('g')
        .attr('class', 'cells')
        .selectAll('g')
        .data(d3.voronoi()
          .extent([[0, 0], [m_width, m_height]])
          .x(d => d.x)
          .y(d => d.y)
          .polygons(data))
        .enter()
        .append('g');

      cell.append('circle')
        .attrs((d) => {
          if (d) {
            return {
              r: data.lenght < 250 ? 2.5 : data.lenght < 500 ? 1.5 : 1,
              transform: `translate(${d.data.x},${d.data.y})`,
            };
          }
          return undefined;
        });

      cell.append('path')
        .attr('d', (d) => {
          if (d) return `M${d.join('L')}Z`;
          return undefined;
        });
    }
  };
};
