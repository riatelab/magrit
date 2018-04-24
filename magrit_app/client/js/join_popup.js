function handleJoin() {
  const layer_name = Object.getOwnPropertyNames(user_data);

  if (!(layer_name.length === 1 && joined_dataset.length === 1)) {
    swal('', i18next.t('app_page.join_box.unable_join'), 'error');
  } else if (field_join_map.length !== 0) {
    make_confirm_dialog2('dialogBox', undefined, { html_content: i18next.t('app_page.join_box.ask_forget_join') })
      .then((confirmed) => {
        if (confirmed) {
          valid_join_check_display();
          field_join_map = [];
          removeExistingJointure(layer_name);
          createJoinBox(layer_name[0]);
        }
      });
  } else if (user_data[layer_name].length !== joined_dataset[0].length) {
    make_confirm_dialog2('dialogBox', undefined, { html_content: i18next.t('app_page.join_box.ask_diff_nb_features') })
      .then((confirmed) => {
        if (confirmed) { createJoinBox(layer_name[0]); }
      });
  } else {
    createJoinBox(layer_name[0]);
  }
}

/**
* Function called to update the menu according to user operation
* (triggered when layers/dataset are added and after a join operation)
* @param {bool} val - ...
* @param {Array} prop - The proportion of joined features
* @return {void}
*/
function valid_join_check_display(val, prop) {
  if (!val) {
    const extDatasetImg = document.getElementById('img_data_ext');
    extDatasetImg.setAttribute('src', '/static/img/b/joinfalse.png');
    extDatasetImg.setAttribute('alt', 'Non-validated join');
    extDatasetImg.style.width = '28px';
    extDatasetImg.style.height = '28px';
    extDatasetImg.onclick = handleJoin;

    const joinSec = document.getElementById('join_section');
    joinSec.innerHTML = [prop, i18next.t('app_page.join_box.state_not_joined')].join('');

    const button = document.createElement('button');
    button.setAttribute('id', 'join_button');
    button.style.display = 'inline';
    button.innerHTML = `<button style="font-size: 11px;" class="button_st3" id="_join_button">${i18next.t('app_page.join_box.button_join')}</button>`;
    button.onclick = handleJoin;
    joinSec.appendChild(button);
  } else {
    const extDatasetImg = document.getElementById('img_data_ext');
    extDatasetImg.setAttribute('src', '/static/img/b/jointrue.png');
    extDatasetImg.setAttribute('alt', 'Validated join');
    extDatasetImg.style.width = '28px';
    extDatasetImg.style.height = '28px';
    extDatasetImg.onclick = null;

    const [v1, _] = prop.split('/').map(d => +d);

    const joinSec = document.getElementById('join_section');
    joinSec.innerHTML = [' <b>', prop, i18next.t('app_page.join_box.match', { count: v1 }), '</b>'].join(' ');

    const button = document.createElement('button');
    button.setAttribute('id', 'join_button');
    button.style.display = 'inline';
    button.innerHTML = [' - <i> ', i18next.t('app_page.join_box.change_field'), ' </i>'].join('');
    button.onclick = handleJoin;
    joinSec.appendChild(button);
  }
}


function valid_join_on(layer_name, join_values1, join_values2, field1, field2, hits) {
  const ext_dataset = joined_dataset[0];
  const layer_dataset = user_data[layer_name];
  const prop = [hits, '/', join_values1.length].join('');
  let f_name = '';
  let val;

  if (hits >= join_values1.length) {
    swal({ title: '',
      text: i18next.t('app_page.common.success'),
      type: 'success',
      allowOutsideClick: true });
    const fields_name_to_add = Object.getOwnPropertyNames(ext_dataset[0]);
    for (let i = 0, len = join_values1.length; i < len; i++) {
      val = field_join_map[i];
      for (let j = 0, leng = fields_name_to_add.length; j < leng; j++) {
        f_name = fields_name_to_add[j];
        if (f_name.length > 0) {
          layer_dataset[i][f_name] = ext_dataset[val][f_name];
        }
      }
    }
    valid_join_check_display(true, prop);
    return Promise.resolve(true);
  } else if (hits > 0) {
    return swal({
      title: `${i18next.t('app_page.common.confirm')}!`,
      text: i18next.t('app_page.join_box.partial_join', { ratio: prop }),
      allowOutsideClick: false,
      allowEscapeKey: true,
      type: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: i18next.t('app_page.common.yes'),
      cancelButtonText: i18next.t('app_page.common.no'),
    }).then(() => {
      const fields_name_to_add = Object.getOwnPropertyNames(ext_dataset[0]);
      for (let i = 0, len = field_join_map.length; i < len; i++) {
        val = field_join_map[i];
        for (let j = 0, leng = fields_name_to_add.length; j < leng; j++) {
          f_name = fields_name_to_add[j];
          if (f_name.length > 0) {
            let t_val;
            if (val == undefined) t_val = null;  // eslint-disable-line
            else if (ext_dataset[val][f_name] === '') t_val = null;
            else t_val = ext_dataset[val][f_name];
            layer_dataset[i][f_name] = val != undefined ? ext_dataset[val][f_name] : null; // eslint-disable-line
          }
        }
      }
      return swal({
        title: `${i18next.t('app_page.common.confirm')}!`,
        text: i18next.t('app_page.join_box.delete_not_join'),
        allowOutsideClick: false,
        allowEscapeKey: true,
        type: 'question',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: i18next.t('app_page.common.yes'),
        cancelButtonText: i18next.t('app_page.common.no'),
      }).then(() => {
        const k = Object.keys(_target_layer_file.objects);
        const geoms = _target_layer_file.objects[k[0]].geometries;
        const temp1 = [];
        const temp2 = [];
        for (let i = 0; i < layer_dataset.length; i++) {
          if (field_join_map[i] !== undefined) {
            temp1.push(layer_dataset[i]);
            temp2.push(geoms[i]);
          }
        }
        user_data[layer_name] = temp1;
        _target_layer_file.objects[k[0]].geometries = temp2;
        updateLayer(layer_name);
        valid_join_check_display(true, [user_data[layer_name].length, user_data[layer_name].length].join('/'));
        const formToSend = new FormData();
        const json_layer = path_to_geojson2(layer_name);
        formToSend.append('geojson', json_layer);
        formToSend.append('layer_name', layer_name);
        xhrequest('POST', '/layers/add', formToSend, false).then((e) => {
          current_layers[layer_name].key_name = JSON.parse(e).key;
        }).catch((err) => {
          display_error_during_computation();
          console.log(err);
        });
        return Promise.resolve(true);
      }, (dismiss) => {
        valid_join_check_display(true, prop);
        return Promise.resolve(true);
      });
    }, (dismiss) => {
      field_join_map = [];
      return Promise.resolve(false);
    });
  }
  swal('',
       i18next.t('app_page.join_box.no_match', { field1, field2 }),
       'error');
  field_join_map = [];
  return Promise.resolve(false);
}

// Where the real join is done
// Its two main results are:
//    -the update of the global "field_join_map" array
//       (storing the relation between index of the geometry
//         layer and index of the external dataset)
//    -the update of the global "user_data" object, adding actualy the value
//     to each object representing each feature of the layer
function prepare_join_on(layer_name, field1, field2) {
  const join_values1 = [],
    join_values2 = [];
  const layer_dataset = user_data[layer_name];
  const ext_dataset = joined_dataset[0];
  const nb_features = layer_dataset.length;
  let hits = 0;
  let val;

  field_join_map = [];

  for (let i = 0, len = ext_dataset.length; i < len; i++) {
    join_values2.push(ext_dataset[i][field2]);
  }
  for (let i = 0, len = layer_dataset.length; i < len; i++) {
    join_values1.push(layer_dataset[i][field1]);
  }
  if (has_duplicate(join_values1) || has_duplicate(join_values2)) {
    return swal('', i18next.t('app_page.join_box.error_not_uniques'), 'warning');
  }
  if (nb_features > 5000) {
    _app.waitingOverlay.display();
    const jointure_worker = new Worker('static/js/webworker_jointure.js');
    _app.webworker_to_cancel = jointure_worker;
    jointure_worker.postMessage(
      [join_values1, join_values2]);
    jointure_worker.onmessage = function (e) {
      const [join_map, _hits] = e.data;
      _app.webworker_to_cancel = undefined;
      hits = _hits;
      field_join_map = join_map;
      _app.waitingOverlay.hide();
      valid_join_on(layer_name, join_values1, join_values2, field1, field2, hits)
        .then((valid) => {
          jointure_worker.terminate();
          if (valid) make_box_type_fields(layer_name);
        });
    };
  } else {
    if (typeof join_values1[0] === 'number' && typeof join_values2[0] === 'string') {
      for (let i = 0; i < nb_features; i++) {
        val = join_values2.indexOf(String(join_values1[i]));
        if (val !== -1) {
          field_join_map.push(val);
          hits += 1;
        } else {
          field_join_map.push(undefined);
        }
      }
    } else if (typeof join_values2[0] === 'number' && typeof join_values1[0] === 'string') {
      for (let i = 0; i < nb_features; i++) {
        val = join_values2.indexOf(Number(join_values1[i]));
        if (val !== -1) {
          field_join_map.push(val);
          hits += 1;
        } else {
          field_join_map.push(undefined);
        }
      }
    } else if (typeof join_values2[0] === 'number' && typeof join_values1[0] === 'number') {
      for (let i = 0; i < nb_features; i++) {
        val = join_values2.indexOf(join_values1[i]);
        if (val !== -1) {
          field_join_map.push(val);
          hits += 1;
        } else {
          field_join_map.push(undefined);
        }
      }
    } else {
      for (let i = 0; i < nb_features; i++) {
        val = join_values2.indexOf(String(join_values1[i]));
        if (val !== -1) {
          field_join_map.push(val);
          hits += 1;
        } else {
          field_join_map.push(undefined);
        }
      }
    }
    valid_join_on(layer_name, join_values1, join_values2, field1, field2, hits)
      .then((valid) => {
        if (valid) make_box_type_fields(layer_name);
      });
  }
}
// Function creating the join box, filled by two "select" input, one containing
// the field names of the geometry layer, the other one containing those from
// the external dataset, in order to let the user choose the common field to do
// the join.
const createJoinBox = function createJoinBox(layer) {
  const geom_layer_fields = [...current_layers[layer].original_fields.keys()];
  const ext_dataset_fields = Object.getOwnPropertyNames(joined_dataset[0][0]);
  const button1 = ['<select id=button_field1>'];
  const button2 = ['<select id=button_field2>'];
  const lastChoice = { field1: geom_layer_fields[0], field2: ext_dataset_fields[0] };

  for (let i = 0, len = geom_layer_fields.length; i < len; i++) {
    button1.push(['<option value="', geom_layer_fields[i], '">', geom_layer_fields[i], '</option>'].join(''));
  }
  button1.push('</select>');

  for (let i = 0, len = ext_dataset_fields.length; i < len; i++) {
    if (ext_dataset_fields[i].length > 0) {
      button2.push(['<option value="', ext_dataset_fields[i], '">', ext_dataset_fields[i], '</option>'].join(''));
    }
  }
  button2.push('</select>');

  const inner_box = [
    '<p><b><i>',
    i18next.t('app_page.join_box.select_fields'), '</i></b></p>',
    '<div style="padding:10px"><p>',
    i18next.t('app_page.join_box.geom_layer_field'), '</p>',
    button1.join(''), '<em style="float:right;">(', layer, ')</em></div>',
    '<div style="padding:15px 10px 10px"><p>',
    i18next.t('app_page.join_box.ext_dataset_field'), '<br></p>',
    button2.join(''), '<em style="float:right;">(', dataset_name, '.csv)</em></div>',
    '<br><p><strong>', i18next.t('app_page.join_box.ask_join'), '<strong></p></div>',
  ].join('');


  make_confirm_dialog2('joinBox', i18next.t('app_page.join_box.title'), { html_content: inner_box, widthFitContent: true })
    .then((confirmed) => {
      if (confirmed) {
        prepare_join_on(layer, lastChoice.field1, lastChoice.field2);
      }
    });

  d3.select('.joinBox').styles({ 'text-align': 'center', 'line-height': '0.9em' });
  d3.select('#button_field1').style('float', 'left').on('change', function () { lastChoice.field1 = this.value; });
  d3.select('#button_field2').style('float', 'left').on('change', function () { lastChoice.field2 = this.value; });
};

const removeExistingJointure = (layer_name) => {
  if (!user_data[layer_name] || user_data[layer_name].length < 1) return;
  const dataLayer = user_data[layer_name];
  const original_fields = current_layers[layer_name].original_fields;
  const fieldDifference = Object.getOwnPropertyNames(
    dataLayer[0]).filter(f => !original_fields.has(f));
  const nbFields = fieldDifference.length;
  for (let i = 0, nbFt = dataLayer.length; i < nbFt; i++) {
    for (let j = 0; j < nbFields; j++) {
      delete dataLayer[i][fieldDifference[j]];
    }
  }
};