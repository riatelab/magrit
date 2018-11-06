import { default as Sortable } from 'sortablejs';
import { hexToRgb, randomColor, rgb2hex } from './../colors_helpers';
import { make_dialog_container, overlay_under_modal, reOpenParent } from './../dialogs';

function fetch_categorical_colors() {
  const categ = document.getElementsByClassName('typo_class'),
    color_map = new Map();
  for (let i = 0; i < categ.length; i++) {
    const color = rgb2hex(categ[i].querySelector('.color_square').style.backgroundColor),
      new_name = categ[i].querySelector('.typo_name').value,
      nb_features = categ[i].querySelector('.typo_count_ft').getAttribute('data-count');
    color_map.set(categ[i].__data__.name, [color, new_name, nb_features]);
  }
  return color_map;
}

export function display_categorical_box(data_layer, layer_name, field, cats) {
  const is_hex_color = new RegExp(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  const nb_features = data_manager.current_layers[layer_name].n_features;
  const nb_class = cats.length;
  const existing_typo_layer = Object.keys(data_manager.current_layers)
    .filter(lyr => data_manager.current_layers[lyr].renderer === 'Categorical' || data_manager.current_layers[lyr].renderer === 'PropSymbolsTypo');
  const modal_box = make_dialog_container(
    'categorical_box',
    _tr('app_page.categorical_box.title', { layer: layer_name, nb_features: nb_features }),
    'dialog');

  const newbox = d3.select('#categorical_box').select('.modal-body')
    .styles({ 'overflow-y': 'scroll', 'max-height': `${window.innerHeight - 145}px` });

  newbox.append('h3').html('');
  newbox.append('p')
    .html(_tr(
      'app_page.symbol_typo_box.field_categ',
      { field: field, nb_class: +nb_class, nb_features: +nb_features },
    ));

  newbox.append('ul')
    .style('padding', 'unset')
    .attr('id', 'sortable_typo_name')
    .selectAll('li')
    .data(cats)
    .enter()
    .append('li')
    .styles({ margin: 'auto', 'list-style': 'none' })
    .attr('class', 'typo_class')
    .attr('id', (_, i) => ['line', i].join('_'));

  newbox.selectAll('.typo_class')
    .append('input')
    .styles({
      width: '140px',
      height: 'auto',
      display: 'inline-block',
      'vertical-align': 'middle',
      'margin-right': '20px',
    })
    .attrs(d => ({ class: 'typo_name', id: d.name }))
    .property('value', d => d.display_name);

  newbox.selectAll('.typo_class')
    .insert('p')
    .attr('class', 'color_square')
    .style('background-color', d => d.color)
    .styles({
      width: '22px',
      height: '22px',
      margin: 'auto',
      display: 'inline-block',
      'vertical-align': 'middle',
      'border-radius': '10%',
    })
    .on('click', function () {
      const self = this;
      const this_color = self.style.backgroundColor;
      const input_col = document.createElement('input');
      input_col.setAttribute('type', 'color');
      input_col.setAttribute('value', rgb2hex(this_color));
      input_col.className = 'color_input';
      input_col.onchange = function (change) {
        self.style.backgroundColor = hexToRgb(change.target.value, 'string');
        self.nextSibling.value = change.target.value;
      };
      input_col.dispatchEvent(new MouseEvent('click'));
    });

    newbox.selectAll('.typo_class')
      .append('input')
      .attr('class', 'color_hex')
      .styles({ height: '22px', 'vertical-align': 'middle' })
      .property('value', d => d.color)
      .style('width', '60px')
      .on('keyup', function () {
        if (is_hex_color.test(this.value)) {
          this.previousSibling.style.backgroundColor = this.value;
        }
      });

  newbox.selectAll('.typo_class')
    .insert('span')
    .attrs(d => ({ class: 'typo_count_ft', 'data-count': d.nb_elem }))
    .html(d => _tr('app_page.symbol_typo_box.count_feature', { count: +d.nb_elem }));

  newbox.insert('p')
    .insert('button')
    .attr('class', 'button_st3')
    .html(_tr('app_page.categorical_box.new_random_colors'))
    .on('click', () => {
      const lines = document.getElementsByClassName('typo_class');
      for (let i = 0; i < lines.length; ++i) {
        const random_color = randomColor();
        lines[i].querySelector('.color_square').style.backgroundColor = random_color;
        lines[i].querySelector('.color_hex').value = random_color;
      }
    });

  // Allow the user to reuse the colors from an existing 'Categorical'
  // (or 'PropSymbolsTypo') layer if any:
  if (existing_typo_layer.length > 0) {
    newbox.insert('p')
      .attr('class', 'button_copy_style')
      .styles({
        margin: '5px',
        cursor: 'pointer',
        'font-style': 'italic',
      })
      .html(_tr('app_page.categorical_box.copy_style'))
      .on('click', () => {
        make_box_copy_style_categorical(existing_typo_layer)
          .then((result) => {
            if (result) { // Apply the selected style:
              const ref_map = data_manager.current_layers[result].color_map;
              const selection = newbox.select('#sortable_typo_name').selectAll('li');
              // Change the displayed name of the elements:
              selection.selectAll('input.typo_name').each(function (d) {
                const r = ref_map.get(d.name);
                if (r) {
                  d.display_name = r[1];
                  this.value = r[1];
                }
              });
              // Change the selected colors:
              selection.selectAll('p').each(function (d) {
                const r = ref_map.get(d.name);
                if (r) {
                  d.color = r[0];
                  this.style.backgroundColor = r[0];
                  this.nextSibling.value = r[0];
                }
              });
            }
          });
      });
  }

  new Sortable(document.getElementById('sortable_typo_name'));
  const container = document.getElementById('categorical_box');

  return new Promise((resolve, reject) => {
    const _onclose = () => {
      resolve(false);
      document.removeEventListener('keydown', helper_esc_key_twbs);
      container.remove();
      const p = reOpenParent();
      if (!p) overlay_under_modal.hide();
    };

    container.querySelector('.btn_ok').onclick = () => {
      const color_map = fetch_categorical_colors();
      const colorByFeature = data_layer.map(ft => color_map.get(ft[field])[0]);
      resolve([nb_class, color_map, colorByFeature]);
      document.removeEventListener('keydown', helper_esc_key_twbs);
      container.remove();
      const p = reOpenParent();
      if (!p) overlay_under_modal.hide();
    };

    container.querySelector('.btn_cancel').onclick = _onclose;
    container.querySelector('#xclose').onclick = _onclose;
    function helper_esc_key_twbs(evt) {
      const _event = evt || window.event;
      const isEscape = ('key' in _event)
        ? (_event.key === 'Escape' || _event.key === 'Esc')
        : (_event.keyCode === 27);
      if (isEscape) {
        _event.stopPropagation();
        _onclose();
      }
    }
    document.addEventListener('keydown', helper_esc_key_twbs);
    overlay_under_modal.display();
  });
}

/**
* Create the box allowing to choose the name of the categorical
* layer whose palette will be used.
*
* @param {Array} existing_typo_layer - An array containing the name of any existing
*                                     'Categorial' or 'PropSymbolsTypo' layer.
* @return {Promise} - A promise containing the state of the swal2 alert created.
*/
function make_box_copy_style_categorical(existing_typo_layer) {
  let selected_layer = existing_typo_layer[0];
  return swal({
    title: _tr('app_page.categorical_box.title_copy_style_box'),
    html: '<div id="copy_style_box_content" style="margin: 35px;"></div>',
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonText: _tr('app_page.common.close'),
    animation: 'slide-from-top',
    onOpen: () => {
      document.querySelector('.swal2-modal').style.width = '400px';
      const content = d3.select('#copy_style_box_content');
      const select_layer = content.append('select');
      // select_layer.append('option').attr('value', '').html('');
      existing_typo_layer.forEach((layer_name) => {
        select_layer.append('option').attr('value', layer_name).html(layer_name);
      });
      select_layer.on('change', function () {
        selected_layer = this.value;
      });
    },
  }).then(
    () => selected_layer,
    () => null,
  );
}
