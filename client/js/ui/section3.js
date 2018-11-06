import { default as Sortable } from 'sortablejs';
import { displayInfoOnMove } from './../interface';

export default function makeSection3() {
  const section3 = d3.select('#menu').select('#section3');

  section3.append('div')
    .append('ul')
    .attrs({ id: 'sortable', class: 'layer_list' });

  new Sortable(document.getElementById('sortable'), {
    animation: 100,
    onUpdate(a) {
      // Set the layer order on the map in concordance with the user changes
      // in the layer manager with a pretty rusty 'sorting' algorythm :
      const desired_order = [],
        actual_order = [],
        layers = svg_map.querySelectorAll('.layer');
      let at_end = null;
      if (document.getElementById('info_features').className === 'active') {
        displayInfoOnMove();
        at_end = true;
      }

      for (let i = 0, len_i = a.target.childNodes.length; i < len_i; i++) {
        const n = a.target.childNodes[i].getAttribute('layer_name');
        desired_order[i] = global._app.layer_to_id.get(n);
        actual_order[i] = layers[i].id;
      }
      for (let i = 0, len = desired_order.length; i < len; i++) {
        // const lyr1 = document.getElementById(desired_order[i]),
        //   lyr2 = document.getElementById(desired_order[i + 1]) ||
        //     document.getElementById(desired_order[i]);
        // svg_map.insertBefore(lyr2, lyr1);
        const lyr = document.getElementById(desired_order[i]);
        svg_map.insertBefore(document.getElementById(desired_order[i + 1]) || lyr, lyr);
      }
      if (at_end) displayInfoOnMove();
    },
    onStart() {
      document.body.classList.add('no-drop');
    },
    onEnd() {
      document.body.classList.remove('no-drop');
    },
  });
}
