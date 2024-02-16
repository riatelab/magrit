// Import from solid-js
import {
  createEffect,
  type JSX,
  on,
  onMount,
} from 'solid-js';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bindElementsLayoutFeature,
  computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { debounce } from '../../helpers/common';
import { Matan2, radToDegConstant } from '../../helpers/math';

// Types / Interfaces / Enums
import type { LayoutFeature, NorthArrow } from '../../global';

const simpleNorthArrow = (props: NorthArrow) => <g
  transform={`rotate(${props.rotation} ${props.size / 2} ${props.size / 2})`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 642.41 929.51"
    version="1.1"
    width={props.size}
    height={props.size}
  >
    <g transform="translate(-51.471 -91.49)">
      <path
        d="m373.75 91.496c-0.95-1.132-74.87 153.23-164.19 343.02-160.8 341.68-162.27 345.16-156.49 350.27 3.203 2.83 6.954 4.79 8.319 4.34 1.365-0.46 71.171-73.88 155.14-163.1 83.97-89.22 153.66-162.83 154.87-163.56 1.2-0.72 71.42 72.34 156.04 162.29s155.21 163.82 156.95 164.19 5.57-1.19 8.5-3.44c5.04-3.86-3.75-23.46-156.04-348-88.77-189.18-162.15-344.88-163.1-346.01zm-2.72 42.694c1.4-1.53 2.45 63.91 2.45 148.36v151.07l-142.3 151.34c-124.61 132.46-143.8 152.86-145.1 153.51 0.143-0.35 1.009-1.57 1.361-2.26 0.81-1.59 64.409-137.07 141.3-301.05 76.89-163.99 140.93-299.45 142.29-300.97zm-99.77 642v244.81h32.11v-204.82l108.55 204.82h44.6v-244.81h-32.11v204.8l-108.56-204.8h-44.59z"
      />
    </g>
  </svg>
</g>;

const fancyNorthArrow = (props: NorthArrow) => <g
  transform={`rotate(${props.rotation} ${props.size / 2} ${props.size / 2})`}
>
  <svg
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    version="1.0"
    viewBox="0 0 512.00045 512.00045"
    width={props.size}
    height={props.size}
  >
    <defs
      id="defs3829">
      <linearGradient
        id="linearGradient3100">
        <stop
          style="stop-color:#b9b9b9;stop-opacity:1;"
          offset="0"
          id="stop3102" />
        <stop
          id="stop3104"
          offset="0.81299859"
          style="stop-color:#bbc3cd;stop-opacity:1;" />
        <stop
          style="stop-color:#dee0e6;stop-opacity:1;"
          offset="0.9107883"
          id="stop3106" />
        <stop
          style="stop-color:#cbcbcb;stop-opacity:1;"
          offset="1"
          id="stop3108" />
      </linearGradient>
      <linearGradient
        id="linearGradient3040">
        <stop
          style="stop-color:#c0d8e4;stop-opacity:1;"
          offset="0"
          id="stop3042" />
        <stop
          style="stop-color:#84b0c7;stop-opacity:1;"
          offset="1"
          id="stop3044" />
      </linearGradient>
      <linearGradient
        id="linearGradient4319">
        <stop
          id="stop4321"
          offset="0"
          style="stop-color:#b9b9b9;stop-opacity:1;" />
        <stop
          style="stop-color:#bbc3cd;stop-opacity:1;"
          offset="0.96389127"
          id="stop4323" />
        <stop
          id="stop4325"
          offset="0.98027217"
          style="stop-color:#dee0e6;stop-opacity:1;" />
        <stop
          id="stop4327"
          offset="1"
          style="stop-color:#cbcbcb;stop-opacity:1;" />
      </linearGradient>
      <linearGradient
        id="linearGradient4294">
        <stop
          style="stop-color:#775012;stop-opacity:1;"
          offset="0"
          id="stop4296" />
        <stop
          id="stop4298"
          offset="0.84926814"
          style="stop-color:#6b4819;stop-opacity:1;" />
        <stop
          style="stop-color:#bf7a31;stop-opacity:1;"
          offset="0.94233865"
          id="stop4300" />
        <stop
          style="stop-color:#6e4e1b;stop-opacity:1;"
          offset="1"
          id="stop4302" />
      </linearGradient>
      <linearGradient
        id="linearGradient3819">
        <stop
          style="stop-color:#d3eef7;stop-opacity:1;"
          offset="0"
          id="stop3821" />
        <stop
          style="stop-color:#386f82;stop-opacity:1;"
          offset="1"
          id="stop3823" />
      </linearGradient>
      <linearGradient
        id="linearGradient3089">
        <stop
          style="stop-color:#ffffff;stop-opacity:1;"
          offset="0"
          id="stop3091" />
        <stop
          style="stop-color:#7b7b7b;stop-opacity:1;"
          offset="1"
          id="stop3093" />
      </linearGradient>
      <linearGradient
        id="linearGradient3135">
        <stop
          style="stop-color:#ffffff;stop-opacity:1;"
          offset="0"
          id="stop3137" />
        <stop
          style="stop-color:#ffffff;stop-opacity:0;"
          offset="1"
          id="stop3139" />
      </linearGradient>
      <radialGradient
        xlink:href="#linearGradient3040"
        id="radialGradient3046"
        cx="1438.9623"
        cy="355.11862"
        fx="1438.9623"
        fy="355.11862"
        r="169.51469"
        gradientTransform="translate(0,4.1214449e-5)"
        gradientUnits="userSpaceOnUse" />
      <radialGradient
        xlink:href="#linearGradient3100"
        id="radialGradient3098"
        cx="1438.9623"
        cy="279.45819"
        fx="1438.9623"
        fy="279.45819"
        r="35.979576"
        gradientTransform="matrix(1,0,0,1.0000019,0,-5.436994e-4)"
        gradientUnits="userSpaceOnUse" />
      <radialGradient
        xlink:href="#linearGradient3089"
        id="radialGradient3116"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.0260552,0,0,1.0260572,-37.492504,-7.2819075)"
        cx="1445.4623"
        cy="269.95822"
        fx="1445.4623"
        fy="269.95822"
        r="35.979576" />
      <radialGradient
        xlink:href="#linearGradient3100"
        id="radialGradient3193"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(6.7124386,0,0,6.7124514,-8219.9838,-1596.3915)"
        cx="1438.9623"
        cy="279.45819"
        fx="1438.9623"
        fy="279.45819"
        r="35.979576" />
      <linearGradient
        xlink:href="#linearGradient3135"
        id="linearGradient3217"
        x1="1397.257"
        y1="83"
        x2="1464.257"
        y2="292"
        gradientUnits="userSpaceOnUse" />
      <linearGradient
        xlink:href="#linearGradient3135"
        id="linearGradient3221"
        gradientUnits="userSpaceOnUse"
        x1="1432.257"
        y1="-97.879494"
        x2="1448.4972"
        y2="265.20303" />
    </defs>
    <g
      id="layer1"
      transform="translate(0,-488)">
      <path
        style="display:inline;overflow:visible;visibility:visible;opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.84134156;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
        d="m 385.4416,743.33061 c 0,67.44845 -54.74107,122.18917 -122.18918,122.18917 -67.44808,0 -122.18916,-54.74072 -122.18916,-122.18917 0,-67.44837 54.74108,-122.18911 122.18916,-122.18911 67.44811,0 122.18918,54.74074 122.18918,122.18911 z"
        id="path3218"
      />
      <path
        id="path3216"
        d="m 350.11864,743.33061 c 0,47.95018 -38.91631,86.86622 -86.86622,86.86622 -47.94987,0 -86.8662,-38.91604 -86.8662,-86.86622 0,-47.95011 38.91633,-86.86613 86.8662,-86.86613 47.94991,0 86.86622,38.91602 86.86622,86.86613 z"
        style="display:inline;overflow:visible;visibility:visible;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.84134156;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 329.69524,582.92307 196.80963,903.73821"
        id="path4308"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 386.02328,620.56005 140.48158,866.10118"
        id="path4306"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 423.66032,676.88759 102.84455,809.77369"
        id="path4304"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 423.66032,809.77362 102.84455,676.88767"
        id="path4300"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 386.02328,866.10138 140.48158,620.55989"
        id="path4298"
      />
      <path
        style="fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.92499393;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        d="M 329.69524,903.73829 196.80963,582.92301"
        id="path3116"
      />
      <g
        id="g3195"
        transform="matrix(3.8869914,1.6100445,-1.6100445,3.8869914,-3521.8811,-3706.3599)">
        <path
          id="path3170"
          d="m 1228.1852,665.24094 -22.1916,-71.50144 -71.5014,-22.19158 71.5014,-22.19159 22.1916,-71.50144 22.1916,71.50143 71.5014,22.19159 -71.5014,22.19159 z"
          style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
          transform="matrix(0,0.2226953,-0.2226953,0,1363.2025,359.31805)"
        />
        <path
          d="m 1235.2022,632.82912 h -19.2054 l 15.2054,-4.71923 m 4.7193,5.43847 v 19.20539 l -4.7193,-15.20539 m 5.4385,-4.71924 h 19.2054 l -15.2054,4.71924 m -4.7192,-5.43847 v -19.2054 l 4.7192,15.2054"
          style="display:inline;overflow:visible;visibility:visible;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
          id="path3188"
        />
      </g>
      <g
        transform="matrix(1.6100445,3.8869914,-3.8869914,1.6100445,733.16495,-5079.5692)"
        id="g3199">
        <path
          transform="matrix(0,0.2226953,-0.2226953,0,1363.2025,359.31805)"
          style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;marker:none;enable-background:accumulate"
          d="m 1228.1852,665.24094 -22.1916,-71.50144 -71.5014,-22.19158 71.5014,-22.19159 22.1916,-71.50144 22.1916,71.50143 71.5014,22.19159 -71.5014,22.19159 z"
          id="path3201"
        />
        <path
          id="path3204"
          style="display:inline;overflow:visible;visibility:visible;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;marker:none;enable-background:accumulate"
          d="m 1235.2022,632.82912 h -19.2054 l 15.2054,-4.71923 m 4.7193,5.43847 v 19.20539 l -4.7193,-15.20539 m 5.4385,-4.71924 h 19.2054 l -15.2054,4.71924 m -4.7192,-5.43847 v -19.2054 l 4.7192,15.2054"
        />
      </g>
      <g
        transform="matrix(0,4.6156171,-4.6156171,0,3184.1492,-4726.7312)"
        id="g3162">
        <path
          style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
          id="path3164"
          d="m 1228.1852,665.24094 -13.2107,-80.48232 -80.4823,-13.2107 80.4823,-13.21072 13.2107,-80.48231 13.2107,80.48231 80.4823,13.21071 -80.4823,13.21071 z"
          transform="matrix(0.2007868,0.2007868,-0.2007868,0.2007868,1053.2763,271.46646)" />
        <path
          id="path3166"
          style="display:inline;overflow:visible;visibility:visible;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.40518039;stroke-linecap:square;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;marker-start:none;marker-mid:none;marker-end:none;enable-background:accumulate"
          d="m 1180.2011,632.82919 4.8499,0.0694 -17.3751,17.37516 12.5252,-17.44455 z m 4.9194,4.91939 0.069,-4.84997 17.3752,17.37515 -17.4445,-12.52518 z m 4.9193,-4.91936 -4.85,-0.0694 17.3752,-17.37517 -12.5252,17.44458 z m -4.9194,-4.91939 -0.069,4.84997 -17.3751,-17.37514 17.4445,12.52517 z"
        />
      </g>
      <g
        id="g3108"
        transform="matrix(4.2000347,4.2000347,-4.2000347,4.2000347,-2056.3901,-6892.1208)">
        <path
          transform="matrix(0.21309255,0.21309255,-0.21309255,0.21309255,1045.1959,249.3194)"
          d="m 1228.1852,665.24094 -13.2107,-80.48232 -80.4823,-13.2107 80.4823,-13.21072 13.2107,-80.48231 13.2107,80.48231 80.4823,13.21071 -80.4823,13.21071 z"
          id="path3104"
          style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.52386701px;marker:none;enable-background:accumulate"
        />
        <path
          d="m 1180.2011,632.82919 4.8499,0.0694 -17.3751,17.37516 12.5252,-17.44455 z m 4.9194,4.91939 0.069,-4.84997 17.3752,17.37515 -17.4445,-12.52518 z m 4.9193,-4.91936 -4.85,-0.0694 17.3752,-17.37517 -12.5252,17.44458 z m -4.9194,-4.91939 -0.069,4.84997 -17.3751,-17.37514 17.4445,12.52517 z"
          style="display:inline;overflow:visible;visibility:visible;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.40518039;marker:none;enable-background:accumulate"
          id="path3106"
        />
      </g>
      <path
        style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;baseline-shift:baseline;text-anchor:start;white-space:normal;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;opacity:1;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.97745842;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate"
        d="m 263.25273,546.97606 c -108.34599,0 -196.354618,88.00847 -196.354618,196.35462 0,108.34624 88.008628,196.35461 196.354618,196.35461 108.34602,0 196.35353,-88.00837 196.35353,-196.35461 0,-108.34615 -88.00751,-196.35462 -196.35353,-196.35462 z"
        id="path4233"
      />
      <path
        style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;baseline-shift:baseline;text-anchor:start;white-space:normal;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;opacity:1;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.90225983;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;marker:none;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate"
        d="m 263.2527,569.06675 c 96.23149,0 174.2629,78.03232 174.2629,174.26393 0,96.2317 -78.03141,174.26392 -174.2629,174.26392 -96.23148,0 -174.263932,-78.03222 -174.263932,-174.26392 0,-96.23161 78.032452,-174.26393 174.263932,-174.26393 z"
        id="path3026"
      />
      <text
        style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;line-height:0%;font-family:'Bitstream Charter';-inkscape-font-specification:'Bitstream Charter';letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
        x="251.07111"
        y="537.31195"
        id="text4269"><tspan
           id="tspan4271"
           x="251.07111"
           y="537.31195"
           style="font-size:34.1695137px;line-height:1.25">N</tspan></text>
      <text
        style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;line-height:0%;font-family:'Bitstream Charter';-inkscape-font-specification:'Bitstream Charter';letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
        x="468.12671"
        y="754.79456"
        id="text4277"><tspan
           id="tspan4279"
           x="468.12671"
           y="754.79456"
           style="font-size:34.1695137px;line-height:1.25">E</tspan></text>
      <text
        style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;line-height:0%;font-family:'Bitstream Charter';-inkscape-font-specification:'Bitstream Charter';letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
        x="25.148424"
        y="754.79456"
        id="text4281"><tspan
           id="tspan4283"
           x="25.148424"
           y="754.79456"
           style="font-size:34.1695137px;line-height:1.25">W</tspan></text>
      <text
        id="text4273"
        y="973.20581"
        x="253.70215"
        style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;line-height:0%;font-family:'Bitstream Charter';-inkscape-font-specification:'Bitstream Charter';letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
      ><tspan
           y="973.20581"
           x="253.70215"
           id="tspan4287"
           style="font-size:34.1695137px;line-height:1.25">S</tspan></text>
      <path
        d="m 459.08716,743.33068 -10.55641,4.12277 -10.55643,-4.12277 10.55643,-4.12278 z"
        style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;enable-background:accumulate"
        id="path4318" />
      <path
        id="path4320"
        style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;enable-background:accumulate"
        d="M 88.52706,743.33068 77.970643,747.45345 67.41422,743.33068 77.970643,739.2079 Z"
      />
      <path
        d="m 263.25241,917.97615 4.12278,10.55641 -4.12278,10.55643 -4.12277,-10.55643 z"
        style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;enable-background:accumulate"
        id="path4322" />
      <path
        d="m 263.25219,568.63946 -4.12278,-10.55641 4.12278,-10.55643 4.12277,10.55643 z"
        style="display:inline;overflow:visible;visibility:visible;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dashoffset:0;stroke-opacity:1;marker:none;enable-background:accumulate"
        id="path4324" />
    </g>
  </svg>
</g>;

/**
 * Compute the angle to north for the the north arrow
 *
 * @param position - The current position of the north arrow (in pixels)
 * @param size - The size of the north arrow (in pixels)
 * @param projection - The current projection
 * @return {number} - Angle to use as rotation value for the north arrow
 */
const computeAngleToNorth = (
  position: [number, number],
  projection: any,
): number => {
  const geoPosition = projection.invert(position);
  const positionSymbolTop = projection([geoPosition[0], geoPosition[1] + 1]);
  const positionSymbolBottom = projection([geoPosition[0], geoPosition[1] - 1]);
  const angle = Matan2(
    positionSymbolTop[0] - positionSymbolBottom[0],
    positionSymbolBottom[1] - positionSymbolTop[1],
  ) * radToDegConstant;
  const posNorth = projection([0, 90]);
  return position[1] < posNorth[1]
    ? angle + 180
    : angle;
};

export default function NorthArrowRenderer(props: NorthArrow): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  // We need to recompute the rectangle box when following properties change
  createEffect(
    on(
      () => [props.size, props.rotation, props.style],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  const debouncedUpdate = debounce(() => {
    const angleToNorth = computeAngleToNorth(
      props.position,
      globalStore.projection,
    );
    setLayersDescriptionStore(
      'layoutFeatures',
      (f: LayoutFeature) => f.id === props.id,
      'rotation',
      angleToNorth,
    );
  }, 500, false);

  // We need to recompute the rotation when one of the following properties change
  // (but we debounce the update to avoid too many updates, otherwise it
  // would be too slow when the map is moving)
  createEffect(
    on(
      () => [
        props.position,
        props.size,
        props.autoRotate,
        globalStore.projection,
        mapStore.scale,
        mapStore.translate,
      ],
      () => {
        if (props.autoRotate && globalStore.projection) {
          debouncedUpdate();
        }
      },
    ),
  );

  return <g
    ref={refElement!}
    class="layout-feature north-arrow"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, false, false, LL);
    }}
    onDblClick={() => {
      makeLayoutFeaturesSettingsModal(props.id, LL);
    }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    {
      props.style === 'simple'
        ? simpleNorthArrow(props)
        : fancyNorthArrow(props)
    }
    <RectangleBox backgroundRect={props.backgroundRect}/>
  </g>;
}
