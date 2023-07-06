import { JSX } from 'solid-js';

export function makeLegendTitle(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-title">
    <text>
      <tspan
        x="0"
        y="0"
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendSubtitle(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-subtitle">
    <text>
      <tspan
        x="0"
        y="0"
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendNote(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-note">
    <text>
      <tspan
        x="0"
        y="0"
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}
