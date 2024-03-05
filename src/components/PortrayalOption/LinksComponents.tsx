import {
  createSignal,
  For,
  type JSX,
  onMount,
} from 'solid-js';

// Imports from other packages
import * as Plot from '@observablehq/plot';
import type { Plot as PlotType } from '@observablehq/plot';

// Helpers
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';
import { Mmin } from '../../helpers/math';

// Subcomponents
import InputFieldMultiSelect from '../Inputs/InputMultiSelect.tsx';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import InputFieldNumber from '../Inputs/InputNumber.tsx';

interface LinksSelectionProps {
  origins: string[];
  destinations: string[];
  intensity: number[];
  distance: number[];
}

interface BrushableHistogramProps {
  values: number[];
  onBrush: (range: [number, number] | null) => void;
  selection: [number, number] | null;
}

function BrushableHistogram(props: BrushableHistogramProps): JSX.Element {
  let containerNode: HTMLDivElement;

  const chart = Plot.plot({
    height: 200,
    y: {
      nice: true,
    },
    x: {
      nice: false,
    },
    marks: [
      Plot.rectY(
        props.values,
        Plot.binX({
          y: 'count',
        }, {
          x: (d) => d,
          thresholds: 20,
        }),
      ),
      Plot.ruleY([0]),
    ],
  });

  const xScale = chart.scale('x');
  const yScale = chart.scale('y');

  onMount(() => {
    const brush = d3.brushX()
      .on('end', (event) => {
        if (event.selection) {
          // There is a selection
          const selectedRange = [
            xScale.invert(event.selection[0]),
            xScale.invert(event.selection[1]),
          ];
          props.onBrush(selectedRange);
        } else {
          // If there is no selection...
          props.onBrush(null);
        }
      });
    const svg = d3.select(containerNode).select('svg');
    svg.call(
      brush.extent([[xScale.range[0], yScale.range[1]], [xScale.range[1], yScale.range[0]]]),
    );
    svg.select('[aria-label="y-axis tick label"]').attr('fill', 'currentColor');
    svg.select('[aria-label="x-axis tick label"]').attr('fill', 'currentColor');
    svg.select('[aria-label="rect"]').attr('fill', 'steelblue');

    console.log(brush, svg);
  });

  return <div ref={containerNode!}>{ chart }</div>;
}

/**
 * Component for selecting the links to display.
 * Several selection options are available:
 * - By Origin + Destination
 * - By Origin
 * - By Destination
 * - By the value of the intensity variable
 * - By the value of the distance variable
 * - By the value of another variable (that may contain temporal or categorical information)
 * - By the combination of the previous options
 *
 */
function LinksSelection(props: LinksSelectionProps): JSX.Element {
  const { LL } = useI18nContext();
  const [
    selectedOrigins,
    setSelectedOrigins,
  ] = createSignal<string[]>([]);
  const [
    selectedDestinations,
    setSelectedDestinations,
  ] = createSignal<string[]>([]);
  const [
    currentSelectionIntensity,
    setCurrentSelectionIntensity,
  ] = createSignal<[number, number] | null>(null);

  return <div class="links-selection">
    <div class="is-flex">
      <div style={{ width: '33%' }}>
        <InputFieldMultiSelect
          label={ LL().PortrayalSection.LinksOptions.OriginId() }
          onChange={(values) => {
            setSelectedOrigins(values);
            console.log(selectedOrigins());
          }}
          size={Mmin(5, props.origins.length) as number}
          values={selectedOrigins()}
        >
          <For each={props.origins}>
            {(origin) => <option value={origin}>{origin}</option>}
          </For>
        </InputFieldMultiSelect>
      </div>
      <div style={{ width: '33%' }}></div>
      <div style={{ width: '33%' }}>
        <InputFieldMultiSelect
          label={ LL().PortrayalSection.LinksOptions.DestinationId() }
          onChange={(values) => {
            setSelectedDestinations(values);
          }}
          size={Mmin(5, props.origins.length) as number}
          values={selectedDestinations()}
        >
          <For each={props.destinations}>
            {(origin) => <option value={origin}>{origin}</option>}
          </For>
        </InputFieldMultiSelect>
      </div>
    </div>

    <div>
      <label class="label">Filtrage selon la valeur <i>Intensity</i></label>
      <BrushableHistogram
        values={props.intensity}
        onBrush={(range) => {
          setCurrentSelectionIntensity(range);
        }}
        selection={currentSelectionIntensity()}
      />
      <div style={{
        display: 'flex',
        'justify-content': 'space-evenly',
      }}>
        <div style={{ width: '25%' }}>
          <InputFieldNumber
            label={'Min'}
            value={currentSelectionIntensity() ? currentSelectionIntensity()[0] : ''}
            onChange={(v) => {
              setCurrentSelectionIntensity([v, currentSelectionIntensity()![1]]);
            }}
            min={0}
            max={1e12}
            step={1}
          />
        </div>
        <div style={{ width: '25%' }}>
          <InputFieldNumber
            label={'Max'}
            value={currentSelectionIntensity() ? currentSelectionIntensity()[1] : ''}
            onChange={(v) => {
              setCurrentSelectionIntensity([currentSelectionIntensity()![0], v]);
            }}
            min={0}
            max={1e12}
            step={1}
          />
        </div>
      </div>
    </div>
  </div>;
}

function LinksSelectionOnExistingLayer(props: { layerId: string }): JSX.Element {
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === props.layerId)!;

  const origins: string[] = [
    ...new Set(layerDescription.data.features.map((f) => f.properties.Origin))] as string[];
  const destinations: string[] = [
    ...new Set(layerDescription.data.features.map((f) => f.properties.Destination))] as string[];
  const intensities = layerDescription.data.features.map((f) => f.properties.Intensity) as number[];
  const distances = layerDescription.data.features.map((f) => f.properties.DistanceKm) as number[];

  return <>
    <LinksSelection
      origins={origins}
      destinations={destinations}
      intensity={intensities}
      distance={distances}
    />
  </>;
}

function LinksSelectionOnInexistingLayer(): JSX.Element {
  return <></>;
}

/**
 * Component for classifying the links to display.
 * All the classification methods available in the application are available.
 * The user can choose the classification method, the number of classes
 * and the corresponding link width for each class.
 *
 */
function LinksClassification(): JSX.Element {
  return <></>;
}

export {
  LinksClassification,
  LinksSelection,
  LinksSelectionOnExistingLayer,
  LinksSelectionOnInexistingLayer,
};
