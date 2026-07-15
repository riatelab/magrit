import {
  createEffect,
  createMemo,
  type JSX,
  on,
  onMount,
  Show,
} from 'solid-js';

// Imports from other packages
import { CompositionUtils, TricoloreViz } from 'tricolore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isFiniteNumber } from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { Msqrt } from '../../helpers/math';

// Subcomponents and helpers for legend rendering
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
  type LayerDescriptionTrivariateChoropleth,
  type TriChoroContinuousOpts,
  type TriChoroDiscreteOpts,
  type TriChoroSextantOpts,
  type TrivariateChoroplethLegend,
  TricoloreScaleType,
} from '../../global.d';

const defaultSpacing = applicationSettingsStore.defaultLegendSettings.spacing;

export default function legendTrivariateChoropleth(
  legend: TrivariateChoroplethLegend,
): JSX.Element {
  const { LL } = useI18nContext();

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionTrivariateChoropleth;

  const heightTitle = createMemo(
    () => getTextSize(
      legend.title.text,
      legend.title.fontSize,
      legend.title.fontFamily,
    ).height + defaultSpacing,
  );

  const heightSubtitle = createMemo(() => (legend.subtitle.text
    ? getTextSize(
      legend.subtitle.text,
      legend.subtitle.fontSize,
      legend.subtitle.fontFamily,
    ).height
    : 0));

  // const legendHeight = createMemo(() => (Msqrt(3) / 2) * legend.width);

  // const distanceToTop = createMemo(() => {
  //   let vDistanceToTop = 0;
  //   if (legend.title) {
  //     vDistanceToTop += heightTitle() + defaultSpacing;
  //   }
  //   if (legend.subtitle.text) {
  //     vDistanceToTop += getTextSize(
  //       legend.subtitle.text,
  //       legend.subtitle.fontSize,
  //       legend.subtitle.fontFamily,
  //     ).height + defaultSpacing;
  //   }
  //   // vDistanceToTop += legend.boxSpacing / 2;
  //   return vDistanceToTop;
  // });

  const hasNoData = createMemo(() => {
    if (!legend.noDataBox) return false;
    const seriesVar1 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable1] as number);

    const seriesVar2 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable2] as number);

    const seriesVar3 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable3] as number);

    const pts = seriesVar1.map((pt, i) => {
      if (
        isFiniteNumber(pt)
        && isFiniteNumber(seriesVar2[i])
        && isFiniteNumber(seriesVar3[i])
      ) {
        return [+pt, +seriesVar2[i], +seriesVar3[i]];
      }
      return null;
    });

    return pts.filter((d) => d !== null).length !== pts.length;
  });

  console.log(hasNoData());

  const createInnerLegend = () => {
    const p = new TricoloreViz(
      legend.width,
      legend.width,
      {
        top: 0,
        right: 0,
        bottom: 30,
        left: 0,
      },
    );

    const seriesVar1 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable1] as number);

    const seriesVar2 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable2] as number);

    const seriesVar3 = layer.data.features
      .map((f) => f.properties![layer.rendererParameters.variable3] as number);

    const pts = seriesVar1.map((pt, i) => {
      if (
        isFiniteNumber(pt)
        && isFiniteNumber(seriesVar2[i])
        && isFiniteNumber(seriesVar3[i])
      ) {
        return [+pt, +seriesVar2[i], +seriesVar3[i]];
      }
      return null;
    });

    const center = layer.rendererParameters.meanCentered
      ? CompositionUtils.centre(pts.filter((d) => d !== null) as [number, number, number][])
      : [1 / 3, 1 / 3, 1 / 3];

    let svg;
    if (layer.rendererParameters.colorScaleType === TricoloreScaleType.Sextant) {
      svg = p.createSextantPlot(pts, {
        center,
        labels: legend.axisLabels,
        values: (layer.rendererParameters.colorScaleOptions as TriChoroSextantOpts).colors,
        showData: legend.displayData,
        showCenter: legend.displayCenter,
        showLines: legend.displayLines,
        labelPosition: 'edge',
      });
    } else if (layer.rendererParameters.colorScaleType === TricoloreScaleType.Discrete) {
      svg = p.createDiscretePlot(pts, {
        center,
        hue: (layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).hue,
        chroma: (layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).chroma,
        lightness: (layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).lightness,
        contrast: (layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).contrast,
        spread: (layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).spread,
        labels: legend.axisLabels,
        showData: legend.displayData,
        showCenter: legend.displayCenter,
        showLines: legend.displayLines,
        labelPosition: 'edge',
        breaks: Msqrt((layer.rendererParameters.colorScaleOptions as TriChoroDiscreteOpts).classes),
      });
    } else { // TricoloreScaleType.Continuous
      svg = p.createContinuousPlot(pts, {
        center,
        hue: (layer.rendererParameters.colorScaleOptions as TriChoroContinuousOpts).hue,
        chroma: (layer.rendererParameters.colorScaleOptions as TriChoroContinuousOpts).chroma,
        lightness: (layer.rendererParameters.colorScaleOptions as TriChoroContinuousOpts).lightness,
        contrast: (layer.rendererParameters.colorScaleOptions as TriChoroContinuousOpts).contrast,
        spread: (layer.rendererParameters.colorScaleOptions as TriChoroContinuousOpts).spread,
        labels: legend.axisLabels,
        showData: legend.displayData,
        showCenter: legend.displayCenter,
        showLines: legend.displayLines,
        labelPosition: 'edge',
      });
    }
    return svg;
  };

  let refElement: SVGGElement;

  onMount(() => {
    // We need to wait for the legend to be rendered before we can compute its size
    // and bind the drag behavior and the mouse enter / leave behavior.
    bindElementsLegend(refElement!, legend);
  });

  createEffect(
    on(
      () => [
        heightTitle(),
        heightSubtitle(),
        // legendHeight(),
        legend.width,
        legend.title.text,
        legend.subtitle.text,
        legend.note.text,
        legend.note.fontSize,
      ],
      () => {
        computeRectangleBox(refElement!);
      },
    ),
  );

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
    onDblClick={() => {
      makeLegendSettingsModal(legend.id, LL);
    }}
    style={{ cursor: 'grab' }}
  >
    <RectangleBox backgroundRect={legend.backgroundRect}/>
    {makeLegendText(legend.title, [0, 0], 'title')}
    {makeLegendText(legend.subtitle, [0, heightTitle()], 'subtitle')}
    <g
      transform={`translate(0, ${heightTitle() + heightSubtitle()})`}
    >
      { createInnerLegend() }
      <Show when={hasNoData()}>
        <rect
          fill={layer.rendererParameters.noDataColor}
          x={0}
          y={heightTitle() + heightSubtitle() + legend.width - defaultSpacing * 6}
          width={40}
          height={30}
          stroke={layer.strokeColor}
        />
        <text
          x={40 + defaultSpacing}
          y={heightTitle() + heightSubtitle() + legend.width - defaultSpacing * 6 + 15}
          font-size={legend.labels.fontSize}
          font-family={legend.labels.fontFamily}
          font-style={legend.labels.fontStyle}
          font-weight={legend.labels.fontWeight}
          fill={legend.labels.fontColor}
          text-anchor="start"
          dominant-baseline="middle"
        >
          { legend.noDataLabel }
        </text>
      </Show>
    </g>
    {
      makeLegendText(
        legend.note,
        [0, heightTitle() + heightSubtitle() + legend.width - defaultSpacing * 6 + 60],
        'note',
        { 'text-anchor': 'start' },
      )
    }
  </g>;
}
