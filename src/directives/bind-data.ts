import { type Accessor } from 'solid-js';
import { type GeoJSONFeature } from '../global.d';

export default function bindData(el: SVGPathElement, data: Accessor<GeoJSONFeature>) {
  el.__data__ = data(); // eslint-disable-line no-param-reassign, no-underscore-dangle
}
