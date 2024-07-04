import { type Accessor } from 'solid-js';
import { unwrap } from 'solid-js/store';
import type { GeoJSONFeature, ID3Element } from '../global';

export default function bindData(el: SVGElement & ID3Element, data: Accessor<GeoJSONFeature>) {
  el.__data__ = unwrap(data()); // eslint-disable-line no-param-reassign, no-underscore-dangle
}
