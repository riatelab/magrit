// Import from solid-js
import {
  Accessor,
  Setter,
  JSX,
  createMemo,
  createEffect,
  on,
} from 'solid-js';

// Import from other packages
import { getPalette, Palette } from 'dicopal';
import { FaSolidCircleCheck } from 'solid-icons/fa';
import {
  quantile, equal, jenks, q6,
} from 'statsbreaks';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import d3 from '../../helpers/d3-custom';
import { getClassifier, noop } from '../../helpers/classification';
import { Mmin } from '../../helpers/math';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setClassificationPanelStore } from '../../store/ClassificationPanelStore';

// Assets
import imgQuantiles from '../../assets/quantiles.png';
import imgEqualIntervals from '../../assets/equal_intervals.png';
import imgQ6 from '../../assets/q6.png';
import imgJenks from '../../assets/jenks.png';
import imgMoreOption from '../../assets/buttons2.svg?url';

// Types
import { ClassificationMethod, ClassificationParameters, CustomPalette } from '../../global.d';

// eslint-disable-next-line prefer-destructuring
const defaultColorScheme = applicationSettingsStore.defaultColorScheme;
// eslint-disable-next-line prefer-destructuring
const defaultNoDataColor = applicationSettingsStore.defaultNoDataColor;

function getEntitiesByClass(
  values: number[],
  breaks: number[],
) {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(values, null, breaks);
  return classifier.countByClass();
}

// eslint-disable-next-line import/prefer-default-export
export function ChoroplethClassificationSelector(
  props: {
    values: Accessor<number[]>,
    targetVariable: Accessor<string>,
    targetClassification: Accessor<ClassificationParameters | undefined>,
    setTargetClassification: Setter<ClassificationParameters | undefined>,
  },
): JSX.Element {
  const { LL } = useI18nContext();

  const numberOfClasses = createMemo(() => Mmin(d3.thresholdSturges(props.values()), 9));

  const palette = createMemo(() => getPalette(defaultColorScheme, numberOfClasses()) as Palette);

  createEffect(
    on(
      () => props.values(),
      () => {
        const breaks = quantile(props.values(), { nb: numberOfClasses(), precision: null });

        props.setTargetClassification({
          variable: props.targetVariable(),
          method: ClassificationMethod.quantiles,
          classes: numberOfClasses(),
          breaks,
          palette: palette() as unknown as CustomPalette,
          noDataColor: defaultNoDataColor,
          entitiesByClass: getEntitiesByClass(props.values(), breaks),
          reversePalette: false,
        } as ClassificationParameters);
      },
    ),
  );

  props.setTargetClassification({ // eslint-disable-line solid/reactivity
    variable: props.targetVariable(), // eslint-disable-line solid/reactivity
    method: ClassificationMethod.quantiles,
    classes: numberOfClasses(), // eslint-disable-line solid/reactivity
    // eslint-disable-next-line solid/reactivity
    breaks: quantile(props.values(), { nb: numberOfClasses(), precision: null }),
    palette: palette() as unknown as CustomPalette, // eslint-disable-line solid/reactivity
    noDataColor: defaultNoDataColor,
    entitiesByClass: getEntitiesByClass(
      props.values(),
      quantile(props.values(), { nb: numberOfClasses(), precision: null }),
    ),
    reversePalette: false,
  } as ClassificationParameters);

  return <div class="field-block">
    <label class="label">{LL().FunctionalitiesSection.ChoroplethOptions.Classification()}</label>
    <div style={{
      width: '30vh', display: 'flex', 'justify-content': 'space-between', margin: 'auto',
    }}>
      <button
        aria-label={LL().ClassificationPanel.classificationMethods.quantiles()}
        class="unstyled"
        title={LL().ClassificationPanel.classificationMethods.quantiles()}
        onClick={() => {
          const breaks = quantile(props.values(), { nb: numberOfClasses(), precision: null });
          props.setTargetClassification({
            variable: props.targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.quantiles,
            classes: numberOfClasses(),
            breaks,
            palette: palette() as unknown as CustomPalette,
            noDataColor: defaultNoDataColor,
            entitiesByClass: getEntitiesByClass(props.values(), breaks),
            reversePalette: false,
          } as ClassificationParameters);
        }}
      >
        <img
          class={`mini-button${props.targetClassification().method === ClassificationMethod.quantiles ? ' selected' : ''}`}
          src={imgQuantiles}
          alt={LL().ClassificationPanel.classificationMethods.quantiles()}
        />
      </button>
      <button
        aria-label={LL().ClassificationPanel.classificationMethods.equalIntervals()}
        class="unstyled"
        title={LL().ClassificationPanel.classificationMethods.equalIntervals()}
        onClick={() => {
          const breaks = equal(props.values(), { nb: numberOfClasses(), precision: null });
          props.setTargetClassification({
            variable: props.targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.equalIntervals,
            classes: numberOfClasses(),
            breaks,
            palette: palette() as unknown as CustomPalette,
            noDataColor: defaultNoDataColor,
            entitiesByClass: getEntitiesByClass(props.values(), breaks),
            reversePalette: false,
          } as ClassificationParameters);
        }}
      >
        <img
          class={`mini-button${props.targetClassification().method === ClassificationMethod.equalIntervals ? ' selected' : ''}`}
          src={imgEqualIntervals}
          alt={LL().ClassificationPanel.classificationMethods.equalIntervals()}
        />
      </button>
      <button
        aria-label={LL().ClassificationPanel.classificationMethods.q6()}
        class="unstyled"
        title={LL().ClassificationPanel.classificationMethods.q6()}
        onClick={() => {
          const breaks = q6(props.values(), { precision: null });
          props.setTargetClassification({
            variable: props.targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.q6,
            classes: 6,
            breaks,
            palette: getPalette(defaultColorScheme, 6) as unknown as CustomPalette,
            noDataColor: defaultNoDataColor,
            entitiesByClass: getEntitiesByClass(props.values(), breaks),
            reversePalette: false,
          } as ClassificationParameters);
        }}
      >
        <img
          class={`mini-button${props.targetClassification().method === ClassificationMethod.q6 ? ' selected' : ''}`}
          src={imgQ6}
          alt={LL().ClassificationPanel.classificationMethods.q6()}
        />
      </button>
      <button
        aria-label={LL().ClassificationPanel.classificationMethods.jenks()}
        class="unstyled"
        title={LL().ClassificationPanel.classificationMethods.jenks()}
        onClick={() => {
          const breaks = jenks(props.values(), { nb: numberOfClasses(), precision: null });
          props.setTargetClassification({
            variable: props.targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.jenks,
            classes: numberOfClasses(),
            breaks,
            palette: palette() as unknown as CustomPalette,
            noDataColor: defaultNoDataColor,
            entitiesByClass: getEntitiesByClass(props.values(), breaks),
            reversePalette: false,
          } as ClassificationParameters);
        }}
      >
        <img
          class={`mini-button${props.targetClassification()!.method === ClassificationMethod.jenks ? ' selected' : ''}`}
          src={imgJenks}
          alt={LL().ClassificationPanel.classificationMethods.jenks()}
        />
      </button>
      <button
        aria-label={LL().ClassificationPanel.classificationMethods.manual()}
        class="unstyled"
        title={LL().ClassificationPanel.classificationMethods.manual()}
        onClick={() => {
          setClassificationPanelStore({
            show: true,
            layerName: '',
            variableName: props.targetVariable(),
            series: props.values(),
            nClasses: numberOfClasses(),
            colorScheme: defaultColorScheme,
            invertColorScheme: false,
            noDataColor: props.targetClassification()!.noDataColor,
            onCancel: () => {},
            onConfirm: (classification: ClassificationParameters) => {
              props.setTargetClassification(classification);
            },
          });
        }}
      >
        <img
          class={`mini-button${props.targetClassification()!.method === ClassificationMethod.manual ? ' selected' : ''}`}
          src={imgMoreOption}
          alt={LL().ClassificationPanel.classificationMethods.manual()}
        />
      </button>
    </div>
    <div style={{
      display: 'flex', 'align-items': 'center', margin: '10px auto auto auto', 'justify-content': 'center',
    }}>
      <FaSolidCircleCheck fill={'green'} style={{ 'margin-right': '10px' }}/>
      {LL().ClassificationPanel.classificationMethods[props.targetClassification()!.method]()}
      , {
      // eslint-disable-next-line max-len
      LL().FunctionalitiesSection.ChoroplethOptions.CurrentNumberOfClasses(props.targetClassification()!.classes)}
    </div>
  </div>;
}
