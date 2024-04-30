// Imports from solid-js
import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { PropSizer } from '../../helpers/geo';
import { findLayerById } from '../../helpers/layers';
import { Mmax, round, sum } from '../../helpers/math';

// Sub-components
import {
  bindElementsLegend,
  computeRectangleBox,
  getTextSize,
  makeLegendSettingsModal,
  makeLegendText,
  RectangleBox,
  triggerContextMenuLegend,
} from './common.tsx';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import {
  LayerDescriptionProportionalSymbols, ProportionalSymbolSingleColorParameters,
  ProportionalSymbolsLegend, ProportionalSymbolsPositiveNegativeParameters,
} from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

function stackedSquareLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;

  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxHeight = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxHeight()
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.values,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={legend.values.toReversed()}>
        {
          (value) => {
            const symbolSize = propSize.scale(value);
            return <>
              <rect
                fill={getColor()(value)}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                width={symbolSize}
                height={symbolSize}
                x={maxHeight() - symbolSize}
                y={heightTitleSubtitle() - symbolSize + maxHeight()}
              ></rect>
              <text
                font-size={`${legend.labels.fontSize}px`}
                font-family={legend.labels.fontFamily}
                font-style={legend.labels.fontStyle}
                font-weight={legend.labels.fontWeight}
                fill={legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                x={maxHeight() + defaultSpacing * 2}
                y={heightTitleSubtitle() + maxHeight() - symbolSize}
              >{
                round(value, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals,
                      ),
                    },
                  )
                }
              </text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxHeight()}
                y1={heightTitleSubtitle() + maxHeight() - symbolSize}
                x2={maxHeight() + defaultSpacing * 2}
                y2={heightTitleSubtitle() + maxHeight() - symbolSize}
              ></line>
            </>;
          }
        }
      </For>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function horizontalSquareLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;

  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxHeight = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxHeight()
    + legend.labels.fontSize
    + defaultSpacing * 3
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.spacing,
        legend.values,
      );
    }
  });
  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    // If we have negative values we want the horizontal legend to start (on the left)
    // by the lowest value, otherwise we want the horizontal legend to start by the highest value
    const hasNegativeValues = legend.values.some((v) => v < 0);
    const targetValues = hasNegativeValues ? legend.values : legend.values.toReversed();
    return targetValues
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        const x = lastSize + i * legend.spacing;
        lastSize += symbolSize;
        return {
          size: symbolSize,
          x,
          y: heightTitleSubtitle() - symbolSize + maxHeight(),
          value,
        };
      });
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <rect
              fill={getColor()(d.value)}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              width={d.size}
              height={d.size}
              x={d.x}
              y={d.y}
            ></rect>
            <text
              font-size={`${legend.labels.fontSize}px`}
              font-family={legend.labels.fontFamily}
              font-style={legend.labels.fontStyle}
              font-weight={legend.labels.fontWeight}
              fill={legend.labels.fontColor}
              text-anchor="middle"
              dominant-baseline="hanging"
              x={d.x + d.size / 2}
              y={heightTitleSubtitle() + maxHeight() + defaultSpacing * 2}
            >{
              round(d.value, legend.roundDecimals)
                .toLocaleString(
                  applicationSettingsStore.userLocale,
                  {
                    minimumFractionDigits: precisionToMinimumFractionDigits(
                      legend.roundDecimals,
                    ),
                  },
                )
            }</text>
          </>
        }
      </For>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function verticalSquareLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;
  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxHeight = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle() // The size necessary for the title and subtitle
    + ( // The size for all the symbols and the spacing between them
      sum(legend.values.map((v) => propSize.scale(v) + legend.spacing))
      - legend.spacing
    )
    + defaultSpacing * 2 // Spacing between last symbol and note
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.values,
      );
    }
  });
  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    return legend.values.toReversed()
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        lastSize += symbolSize;
        return {
          size: symbolSize,
          x: (maxHeight() - symbolSize) / 2,
          y: heightTitleSubtitle() - symbolSize + lastSize + legend.spacing * i,
          value,
        };
      });
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
              <rect
                fill={getColor()(d.value)}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                width={d.size}
                height={d.size}
                x={d.x}
                y={d.y}
              ></rect>
              <text
                font-size={`${legend.labels.fontSize}px`}
                font-family={legend.labels.fontFamily}
                font-style={legend.labels.fontStyle}
                font-weight={legend.labels.fontWeight}
                fill={legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                x={maxHeight() + defaultSpacing * 2}
                y={d.y + d.size / 2}
              >{
                round(d.value, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals,
                      ),
                    },
                  )
              }</text>
            </>
        }
      </For>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function stackedCircleLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;
  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxRadius = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    heightTitleSubtitle()
    + maxRadius() * 2
    + defaultSpacing * 2
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.values,
      );
    }
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={legend.values.toReversed()}>
        {
          (value) => {
            const symbolSize = propSize.scale(value);
            return <>
              <circle
                fill={getColor()(value)}
                fill-opacity={layer.fillOpacity}
                stroke={layer.strokeColor}
                stroke-width={layer.strokeWidth}
                r={symbolSize}
                cx={maxRadius()}
                cy={heightTitleSubtitle() - symbolSize + maxRadius() * 2}
              ></circle>
              <text
                font-size={`${legend.labels.fontSize}px`}
                font-family={legend.labels.fontFamily}
                font-style={legend.labels.fontStyle}
                font-weight={legend.labels.fontWeight}
                fill={legend.labels.fontColor}
                text-anchor="start"
                dominant-baseline="middle"
                x={maxRadius() * 2 + defaultSpacing * 2}
                y={heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2}
              >{
                round(value, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals,
                      ),
                    },
                  )
              }</text>
              <line
                stroke-width={0.8}
                stroke-dasharray="2"
                stroke="black"
                x1={maxRadius()}
                y1={heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2}
                x2={maxRadius() * 2 + defaultSpacing * 2}
                y2={heightTitleSubtitle() + maxRadius() * 2 - symbolSize * 2}
              ></line>
            </>;
          }
        }
      </For>
    </g>
    { makeLegendText(legend.note, [0, positionNote()], 'note') }
  </g>;
}

function verticalCircleLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;

  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxRadius = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.spacing,
        legend.values,
      );
    }
  });

  // Precompute the size and position of the symbols now
  // instead of computing it in the For directive
  // (and use createMemo to make it reactive)
  const sizesAndPositions = createMemo(() => {
    let lastPosition = heightTitleSubtitle();
    return legend.values.toReversed()
      .map((value) => {
        const symbolSize = propSize.scale(value);
        const cy = symbolSize + lastPosition;
        lastPosition = cy + symbolSize + legend.spacing;
        return {
          size: symbolSize,
          x: maxRadius(),
          y: cy,
          value,
        };
      });
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <circle
              fill={getColor()(d.value)}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              r={d.size}
              cx={d.x}
              cy={d.y}
            ></circle>
            <text
              font-size={`${legend.labels.fontSize}px`}
              font-family={legend.labels.fontFamily}
              font-style={legend.labels.fontStyle}
              font-weight={legend.labels.fontWeight}
              fill={legend.labels.fontColor}
              text-anchor="start"
              dominant-baseline="middle"
              x={d.x * 2 + defaultSpacing}
              y={d.y}
            >{
              round(d.value, legend.roundDecimals)
                .toLocaleString(
                  applicationSettingsStore.userLocale,
                  {
                    minimumFractionDigits: precisionToMinimumFractionDigits(
                      legend.roundDecimals,
                    ),
                  },
                )
            }</text>
          </>
        }
      </For>
    </g>
    {
      makeLegendText(
        legend.note,
        [
          0,
          sizesAndPositions()[sizesAndPositions().length - 1].y
          + sizesAndPositions()[sizesAndPositions().length - 1].size
          + defaultSpacing * 2,
        ],
        'note',
      )
    }
  </g>;
}

function horizontalCircleLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  let refElement: SVGGElement;
  const { LL } = useI18nContext();
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionProportionalSymbols;

  const propSize = new PropSizer(
    layer.rendererParameters.referenceValue,
    layer.rendererParameters.referenceRadius,
    layer.rendererParameters.symbolType,
  );

  const getColor = createMemo(() => {
    if (layer.rendererParameters.colorMode === 'singleColor') {
      return () => (layer.rendererParameters as ProportionalSymbolSingleColorParameters).color;
    }
    if (layer.rendererParameters.colorMode === 'positiveNegative') {
      return (value: number) => (
        value >= 0
          ? (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]
          : (layer.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]
      );
    }
    return () => 'white';
  });

  const maxRadius = createMemo(
    () => Mmax(
      propSize.scale(legend.values[legend.values.length - 1]),
      propSize.scale(legend.values[0]),
    ),
  );

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightTitleSubtitle = createMemo(() => {
    if (!legend.subtitle || !legend.subtitle.text) {
      return heightTitle();
    }
    return heightTitle() + getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height + defaultSpacing;
  });

  const positionNote = createMemo(() => (
    maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 3 + legend.labels.fontSize
  ));

  onMount(() => {
    bindElementsLegend(refElement, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        heightTitle(),
        heightTitleSubtitle(),
        positionNote(),
        legend.title.text,
        legend.subtitle?.text,
        legend.note?.text,
        legend.roundDecimals,
        legend.spacing,
        legend.values,
      );
    }
  });

  const sizesAndPositions = createMemo(() => {
    let lastSize = 0;
    // If we have negative values we want the horizontal legend to start (on the left)
    // by the lowest value, otherwise we want the horizontal legend to start by the highest value
    const hasNegativeValues = legend.values.some((v) => v < 0);
    const targetValues = hasNegativeValues ? legend.values : legend.values.toReversed();
    return targetValues
      .map((value, i) => {
        const symbolSize = propSize.scale(value);
        const x = symbolSize + lastSize + i * legend.spacing;
        lastSize += symbolSize * 2;
        return {
          size: symbolSize,
          x,
          y: maxRadius() + heightTitleSubtitle() + (maxRadius() - symbolSize),
          value,
        };
      });
  });

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => { makeLegendSettingsModal(legend.id, LL); }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
    { makeLegendText(legend.title, [0, 0], 'title') }
    { makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle') }
    <g class="legend-content">
      <For each={sizesAndPositions()}>
        {
          (d) => <>
            <circle
              fill={getColor()(d.value)}
              fill-opacity={layer.fillOpacity}
              stroke={layer.strokeColor}
              stroke-width={layer.strokeWidth}
              r={d.size}
              cx={d.x}
              cy={d.y}
            ></circle>
            <text
              font-size={`${legend.labels.fontSize}px`}
              font-family={legend.labels.fontFamily}
              font-style={legend.labels.fontStyle}
              font-weight={legend.labels.fontWeight}
              fill={legend.labels.fontColor}
              text-anchor="middle"
              dominant-baseline="hanging"
              x={d.x}
              y={maxRadius() * 2 + heightTitleSubtitle() + defaultSpacing * 2}
            >{
              round(d.value, legend.roundDecimals)
                .toLocaleString(
                  applicationSettingsStore.userLocale,
                  {
                    minimumFractionDigits: precisionToMinimumFractionDigits(
                      legend.roundDecimals,
                    ),
                  },
                )
            }</text>
          </>
        }
      </For>
    </g>
    {
      makeLegendText(
        legend.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}

function verticalLineLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => {
      makeLegendSettingsModal(legend.id, LL);
    }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect}/>
  </g>;
}

function horizontalLineLegend(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;

  return <g
    ref={refElement!}
    class="legend proportionalSymbols"
    for={layer.id}
    transform={`translate(${legend.position[0]}, ${legend.position[1]})`}
    visibility={layer.visible && legend.visible ? undefined : 'hidden'}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLegend(e, legend.id, LL);
    }}
    onDblClick={() => {
      makeLegendSettingsModal(legend.id, LL);
    }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect} />
  </g>;
}

export default function legendProportionalSymbols(
  legend: ProportionalSymbolsLegend,
): JSX.Element {
  return <>
    {
      (
        // eslint-disable-next-line no-nested-ternary
        legend.symbolType === 'circle'
          ? ({
            stacked: stackedCircleLegend,
            vertical: verticalCircleLegend,
            horizontal: horizontalCircleLegend,
          })[legend.layout](legend)
          : legend.symbolType === 'square'
            ? ({
              stacked: stackedSquareLegend,
              vertical: verticalSquareLegend,
              horizontal: horizontalSquareLegend,
            })[legend.layout](legend)
            : ({
              stacked: verticalLineLegend,
              vertical: verticalLineLegend,
              horizontal: horizontalLineLegend,
            })[legend.layout](legend)
      )
    }
  </>;
}
