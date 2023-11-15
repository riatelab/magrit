import { type Accessor } from 'solid-js';
import { type GeoJSONFeature, ID3Element } from '../global.d';

export default function bindData(el: SVGElement & ID3Element, data: Accessor<GeoJSONFeature>) {
  el.__data__ = data(); // eslint-disable-line no-param-reassign, no-underscore-dangle
}
