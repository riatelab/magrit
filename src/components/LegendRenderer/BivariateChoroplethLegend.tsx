import {
  createEffect,
  createMemo,
  For,
  type JSX,
  onMount,
  Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { precisionToMinimumFractionDigits } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { round } from '../../helpers/math';

// Sub-components and helpers for legend rendering
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
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces / Enums
import {
  type LayerDescriptionBivariateChoropleth,
  type BivariateChoroplethLegend,
} from '../../global';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendBivariateChoropleth(
  legend: BivariateChoroplethLegend,
): JSX.Element {
  const { LL } = useI18nContext();

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionBivariateChoropleth;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const distanceToTop = createMemo(() => {
    let vDistanceToTop = 0;
    if (legend.title) {
      vDistanceToTop += heightTitle() + defaultSpacing;
    }
    if (legend.subtitle.text) {
      vDistanceToTop += getTextSize(
        legend.subtitle.text,
        legend.subtitle.fontSize,
        legend.subtitle.fontFamily,
      ).height + defaultSpacing;
    }
    // vDistanceToTop += legend.boxSpacing / 2;
    return vDistanceToTop;
  });

  // How many boxes on each side of the bivariate legend grid
  const gridSize = 3;

  // Padding for the labels of the variables
  const extraPadding = createMemo(() => (
    legend.displayBreakValues ? 30 : 20));
  // Padding around the legend grid (not used for now since
  // we let the axis labels overflow on the left when the legend is rotated)
  // const padding = createMemo(() => (legend.displayBreakValues ? 20 : 10));

  // The size depends on whether we rotate the legend or not
  const totalSize = createMemo(
    () => legend.boxWidth * gridSize + legend.boxSpacing * (gridSize - 1),
  );
  const diagonalSize = createMemo(() => Math.ceil(Math.SQRT2 * totalSize()));
  const sizeX = createMemo(() => (legend.rotate ? diagonalSize() : totalSize()));
  const sizeY = createMemo(() => (
    sizeX()
    + (legend.noDataBox ? defaultSpacing * 2 + legend.boxWidth / 2 + legend.boxStrokeWidth * 2 : 0)
  ));

  // The step between the break values to be displayed
  // (n should be 1 to 2 since we have only 2 breaks to display on each axis)
  const breaksStep = createMemo(
    () => (n: number) => (
      (legend.boxWidth + legend.boxSpacing / 2) * n) + (legend.boxSpacing / 2) * (n - 1),
  );

  // The position of the no data box if any
  const positionNoDataBox = createMemo(
    () => (legend.rotate
      ? distanceToTop() + sizeY() - defaultSpacing * 2
      : distanceToTop() + sizeY() + defaultSpacing * 2),
  );

  // The position of the note if any
  const positionNote = createMemo(() => {
    let vPosition;
    if (legend.noDataBox) {
      vPosition = positionNoDataBox();
    } else {
      vPosition = distanceToTop() + sizeY() + defaultSpacing * (legend.rotate ? -1 : 3);
    }
    if (legend.note) {
      vPosition += legend.boxWidth / 2 + defaultSpacing * 2;
    }
    return vPosition;
  });

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement!, legend);
  });

  createEffect(() => {
    if (refElement && layer.visible && legend.visible) {
      computeRectangleBox(
        refElement,
        distanceToTop(),
        sizeX(),
        sizeY(),
        breaksStep(),
        positionNote(),
        legend.displayBreakValues,
        legend.note?.text,
        // And more...
      );
    }
  });

  return <g
    ref={refElement!}
    id={legend.id}
    class="legend bichoro"
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
    <g
      class="legend-content"
      transform={`translate(${sizeX() / 2 + (legend.rotate ? 0 : extraPadding())}, ${distanceToTop() + sizeX() / 2}) rotate(${legend.rotate ? -135 : -90})`}
    >
      <g
        class="grid-group"
        transform={`translate(${-totalSize() / 2}, ${-totalSize() / 2})`}
      >
        <For each={[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]}>
          {([row, col]) => (
              <rect
                x={col * (legend.boxWidth + legend.boxSpacing)}
                y={row * (legend.boxHeight + legend.boxSpacing)}
                width={legend.boxWidth}
                height={legend.boxHeight}
                rx={legend.boxCornerRadius}
                ry={legend.boxCornerRadius}
                stroke={'black'}
                stroke-width={legend.boxStrokeWidth}
                fill={layer.rendererParameters.palette.colors[col * 3 + row]}
              />
          )}
        </For>
      </g>
      <Show when={legend.displayBreakValues}>
        <For each={layer.rendererParameters.variable1.breaks.slice(1, 3).reverse()}>
          {(breakValue, index) => (
            <text
              x={-totalSize() / 2 + breaksStep()(index() + 1)}
              y={totalSize() / 2 + 12}
              text-anchor="middle"
              font-size={legend.labels.fontSize}
              font-family={legend.labels.fontFamily}
              fill={legend.labels.fontColor}
              transform={'rotate(180)'}
            >
              {
                round(breakValue, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals || 0,
                      ),
                    },
                  )
              }
            </text>
          )}
        </For>
        <For each={layer.rendererParameters.variable2.breaks.slice(1, 3)}>
          {(breakValue, index) => (
            <text
              x={-totalSize() / 2 + breaksStep()(index() + 1)}
              y={totalSize() / 2 + 12}
              text-anchor="middle"
              font-size={legend.labels.fontSize}
              font-family={legend.labels.fontFamily}
              fill={legend.labels.fontColor}
              transform={'rotate(90)'}
            >
              {
                round(breakValue, legend.roundDecimals)
                  .toLocaleString(
                    applicationSettingsStore.userLocale,
                    {
                      minimumFractionDigits: precisionToMinimumFractionDigits(
                        legend.roundDecimals || 0,
                      ),
                    },
                  )
              }
            </text>
          )}
        </For>
      </Show>
    </g>
    <Show when={legend.displayLabels}>
      {/*
        We put the labels (in case there is a rotation of the legend)
        in separate groups because otherwise, if they are grouped together,
        it creates a bounding rectangle that is too large, which results in a box
        (in case we ask to display a rectangle under the legend) that appears too large
        at the bottom.
      */}
      <Show when={legend.variable2Label !== ''}>
        <g
          class="legend-labels"
          transform={`translate(${sizeX() / 2 + (legend.rotate ? 0 : extraPadding())}, ${distanceToTop() + sizeX() / 2}) rotate(${legend.rotate ? -135 : -90})`}
        >
          <text
            x={totalSize() / 2}
            y={totalSize() / 2 + extraPadding()}
            font-size={legend.labels.fontSize}
            font-family={legend.labels.fontFamily}
            fill={legend.labels.fontColor}
            text-anchor="end"
            transform={'rotate(90)'}
          >
            {legend.variable2Label} →
          </text>
        </g>
      </Show>
      <Show when={legend.variable1Label !== ''}>
        <g
          class="legend-labels"
          transform={`translate(${sizeX() / 2 + (legend.rotate ? 0 : extraPadding())}, ${distanceToTop() + sizeX() / 2}) rotate(${legend.rotate ? -135 : -90})`}
        >
          <text
            x={-totalSize() / 2}
            y={totalSize() / 2 + extraPadding()}
            font-size={legend.labels.fontSize}
            font-family={legend.labels.fontFamily}
            fill={legend.labels.fontColor}
            text-anchor="start"
            transform={'rotate(180)'}
          >
            ← {legend.variable1Label}
          </text>
        </g>
      </Show>
    </Show>
    <Show when={legend.noDataBox}>
      <g>
        <rect
          fill={layer.rendererParameters.noDataColor}
          x={0}
          y={positionNoDataBox()}
          rx={legend.boxCornerRadius}
          ry={legend.boxCornerRadius}
          width={legend.boxWidth}
          height={legend.boxWidth / 2}
          stroke={legend.boxStrokeWidth ? layer.strokeColor : undefined}
        />
        <text
          x={legend.boxWidth + defaultSpacing}
          y={positionNoDataBox() + (legend.boxWidth / 4)}
          font-size={legend.labels.fontSize}
          font-family={legend.labels.fontFamily}
          font-style={legend.labels.fontStyle}
          font-weight={legend.labels.fontWeight}
          fill={legend.labels.fontColor}
          text-anchor="start"
          dominant-baseline="middle"
        >{ legend.noDataLabel }</text>
      </g>
    </Show>
    {
      makeLegendText(
        legend.note,
        [0, positionNote()],
        'note',
      )
    }
  </g>;
}
