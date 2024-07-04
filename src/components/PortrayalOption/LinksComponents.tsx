import {
  createEffect,
  createSignal,
  For,
  type JSX,
  on,
  onMount,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import * as Plot from '@observablehq/plot';

// Helpers
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';
import { Mmin } from '../../helpers/math';

// Subcomponents
import InputFieldMultiSelect from '../Inputs/InputMultiSelect.tsx';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import { Filter, LayerDescriptionLinks } from '../../global';

interface LinksSelectionProps {
  origins: string[];
  destinations: string[];
  intensity: number[];
  distance: number[];
  existingFilters?: Filter[];
  setFiltersFunction: (filters: Filter[]) => void;
}

interface BrushableHistogramProps {
  values: number[];
  onBrush: (range: [number, number] | null) => void;
  selection: [number, number] | null;
}

function BrushableHistogram(props: BrushableHistogramProps): JSX.Element {
  let containerNode: HTMLDivElement;
  let brush: d3.BrushBehavior<SVGSVGElement> | undefined;
  let selectedRange;

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

  const xScale = chart.scale('x')!;
  const yScale = chart.scale('y')!;

  onMount(() => {
    brush = d3.brushX()
      .extent([[xScale.range[0], yScale.range[1]], [xScale.range[1], yScale.range[0]]])
      .on('end', (event) => {
        if (event.selection) {
          // There is a selection
          selectedRange = [
            xScale.invert(event.selection[0]),
            xScale.invert(event.selection[1]),
          ];
          props.onBrush(selectedRange);
        } else {
          // If there is no selection...
          props.onBrush(null);
        }
      });
    // Add the brush to the chart
    const svg = d3.select(containerNode).select('svg');
    svg.call(brush);

    // Set the initial selection (existing selection or full range)
    if (props.selection) {
      svg.call(brush.move, [xScale.apply(props.selection[0]), xScale.apply(props.selection[1])]);
    } else {
      const initialSelection = [xScale.invert(xScale.range[0]), xScale.invert(xScale.range[1])];
      svg.call(brush.move, initialSelection);
      props.onBrush(initialSelection);
    }

    // Style the chart (currentColor is the color of the parent element,
    // so it works for light/dark mode)
    svg.select('[aria-label="y-axis tick label"]').attr('fill', 'currentColor');
    svg.select('[aria-label="x-axis tick label"]').attr('fill', 'currentColor');
    svg.select('[aria-label="rect"]').attr('fill', 'steelblue');
  });

  createEffect(
    on(
      () => props.selection,
      () => {
        if (
          props.selection
          && selectedRange
          && (props.selection[0] !== selectedRange[0]
            || props.selection[1] !== selectedRange[1])
        ) {
          // Move the brush to the selected range
          const x0 = xScale.apply(props.selection[0]);
          const x1 = xScale.apply(props.selection[1]);
          const svg = d3.select(containerNode).select('svg');
          svg.call(brush.move, [x0, x1]);
        }
      },
    ),
  );

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

  /* eslint-disable solid/reactivity */
  const initialValueOrigins = props.existingFilters
    ? JSON.parse(props.existingFilters.find((f) => f.variable === 'Origin')?.value || '[]')
    : [];
  const initialValueDestinations = props.existingFilters
    ? JSON.parse(props.existingFilters.find((f) => f.variable === 'Destination')?.value || '[]')
    : [];
  const initialValueIntensity = props.existingFilters && props.existingFilters.some((f) => f.variable === 'Intensity')
    ? props.existingFilters
      .filter((f) => f.variable === 'Intensity')
      .map((f) => +f.value) as [number, number]
    : null;
  const initialValueDistance = props.existingFilters && props.existingFilters.some((f) => f.variable === 'DistanceKm')
    ? props.existingFilters
      .filter((f) => f.variable === 'DistanceKm')
      .map((f) => +f.value) as [number, number]
    : null;
  /* eslint-enable solid/reactivity */

  const [
    selectedOrigins,
    setSelectedOrigins,
  ] = createSignal<string[]>(initialValueOrigins);
  const [
    selectedDestinations,
    setSelectedDestinations,
  ] = createSignal<string[]>(initialValueDestinations);
  const [
    currentSelectionIntensity,
    setCurrentSelectionIntensity,
  ] = createSignal<[number, number] | null>(initialValueIntensity);
  const [
    currentSelectionDistance,
    setCurrentSelectionDistance,
  ] = createSignal<[number, number] | null>(initialValueDistance);

  // When the selection changes, we update the filters
  createEffect(
    on(
      () => [
        selectedOrigins(),
        selectedDestinations(),
        currentSelectionIntensity(),
        currentSelectionDistance(),
      ],
      () => {
        // Create the corresponding filters and send them to the parent component
        const filters: Filter[] = [];
        if (selectedOrigins().length > 0) {
          filters.push({
            variable: 'Origin',
            operator: 'in',
            value: JSON.stringify(selectedOrigins()),
          });
        }
        if (selectedDestinations().length > 0) {
          filters.push({
            variable: 'Destination',
            operator: 'in',
            value: JSON.stringify(selectedDestinations()),
          });
        }
        if (currentSelectionIntensity()) {
          filters.push({
            variable: 'Intensity',
            operator: '>=',
            value: currentSelectionIntensity()![0],
          });
          filters.push({
            variable: 'Intensity',
            operator: '<=',
            value: currentSelectionIntensity()![1],
          });
        }
        if (currentSelectionDistance()) {
          filters.push({
            variable: 'DistanceKm',
            operator: '>=',
            value: currentSelectionDistance()![0],
          });
          filters.push({
            variable: 'DistanceKm',
            operator: '<=',
            value: currentSelectionDistance()![1],
          });
        }
        props.setFiltersFunction(filters);
      },
    ),
  );

  return <div class="links-selection">
    <div class="is-flex">
      <div style={{ width: '33%' }}>
        <InputFieldMultiSelect
          label={LL().FunctionalitiesSection.LinksOptions.OriginId()}
          onChange={(values) => {
            setSelectedOrigins(values);
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
          label={LL().FunctionalitiesSection.LinksOptions.DestinationId()}
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
        <div style={{ width: '20%' }}>
          <InputFieldNumber
            label={'Min'}
            value={currentSelectionIntensity() ? currentSelectionIntensity()[0] : ''}
            onChange={(v) => {
              setCurrentSelectionIntensity([v, currentSelectionIntensity()![1]]);
            }}
            min={0}
            max={1e12}
            step={1}
            width={100}
          />
        </div>
        <div style={{ width: '20%' }}>
          <InputFieldNumber
            label={'Max'}
            value={currentSelectionIntensity() ? currentSelectionIntensity()[1] : ''}
            onChange={(v) => {
              setCurrentSelectionIntensity([currentSelectionIntensity()![0], v]);
            }}
            min={0}
            max={1e12}
            step={1}
            width={100}
          />
        </div>
      </div>
    </div>

    <div>
      <label class="label">Filtrage selon la valeur <i>DistanceKm</i></label>
      <BrushableHistogram
        values={props.distance}
        onBrush={(range) => {
          setCurrentSelectionDistance(range);
        }}
        selection={currentSelectionDistance()}
      />
      <div style={{
        display: 'flex',
        'justify-content': 'space-evenly',
      }}>
        <div style={{ width: '20%' }}>
          <InputFieldNumber
            label={'Min'}
            value={currentSelectionDistance() ? currentSelectionDistance()[0] : ''}
            onChange={(v) => {
              setCurrentSelectionDistance([v, currentSelectionDistance()![1]]);
            }}
            min={0}
            max={1e12}
            step={1}
            width={100}
          />
        </div>
        <div style={{ width: '20%' }}>
          <InputFieldNumber
            label={'Max'}
            value={currentSelectionDistance() ? currentSelectionDistance()[1] : ''}
            onChange={(v) => {
              setCurrentSelectionDistance([currentSelectionDistance()![0], v]);
            }}
            min={0}
            max={1e12}
            step={1}
            width={100}
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

  const setFiltersFunction = (filters: Filter[]) => {
    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          const layer = draft.layers.find((l) => l.id === props.layerId);
          if (layer) {
            (layer as LayerDescriptionLinks).rendererParameters.filters = filters;
          }
        },
      ),
    );
  };
  return <>
    <LinksSelection
      origins={origins}
      destinations={destinations}
      intensity={intensities}
      distance={distances}
      existingFilters={(layerDescription as LayerDescriptionLinks).rendererParameters.filters}
      setFiltersFunction={setFiltersFunction}
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
