// Imports from solid-js
import {
  createEffect,
  createSignal,
  For,
  JSX,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { createStore } from 'solid-js/store';

// Imports from other packages
import { CompositionUtils, Viz } from 'tricolore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isFiniteNumber, unproxify } from '../../helpers/common';
import { Msqrt } from '../../helpers/math';

// Stores
import {
  classificationMultivariatePanelStore,
  setClassificationMultivariatePanelStore,
} from '../../store/ClassificationMultivariatePanelStore';

// Subcomponents
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';

// Styles
import '../../styles/ClassificationPanel.css';

// Types, interfaces and enums
import {
  type TriChoroContinuousOpts,
  type TriChoroDiscreteOpts,
  type TriChoroSextantOpts,
  TricoloreScaleType,
  type TrivariateChoroplethParameters,
} from '../../global.d';

type SextantColorArray = [string, string, string, string, string, string];

export default function ClassificationTrivariatePanel(): JSX.Element {
  const { LL } = useI18nContext();

  const parameters = classificationMultivariatePanelStore
    .classificationParameters as TrivariateChoroplethParameters;

  const series1 = classificationMultivariatePanelStore.series![0];
  const series2 = classificationMultivariatePanelStore.series![1];
  const series3 = classificationMultivariatePanelStore.series![2];

  const pts = series1.map((v, i) => {
    if (
      isFiniteNumber(v)
      && isFiniteNumber(series2[i])
      && isFiniteNumber(series3[i])
    ) {
      return [+v, +series2[i], +series3[i]] as [number, number, number];
    }
    return null;
  });

  const filteredPts = pts.filter((d) => d !== null) as [number, number, number][];

  const hasNoData = pts.length !== filteredPts.length;

  const [
    currentClassifInfo,
    setCurrentClassifInfo,
  ] = createSignal<TrivariateChoroplethParameters>(unproxify(parameters));

  const [
    colorScaleType,
    setColorScaleType,
  ] = createSignal<TricoloreScaleType>(parameters.colorScaleType);

  const [useMeanCentering, setUseMeanCentering] = createSignal<boolean>(parameters.meanCentered);

  const [colorScaleParams, setColorScaleParams] = createStore(
    parameters.colorScaleType === TricoloreScaleType.Sextant
      ? {
        hue: 10,
        chroma: 120,
        lightness: 70,
        contrast: 0.2,
        spread: 1,
      }
      : {
        hue: (parameters
          .colorScaleOptions as TriChoroContinuousOpts | TriChoroDiscreteOpts).hue,
        chroma: (parameters
          .colorScaleOptions as TriChoroContinuousOpts | TriChoroDiscreteOpts).chroma,
        lightness: (parameters
          .colorScaleOptions as TriChoroContinuousOpts | TriChoroDiscreteOpts).lightness,
        contrast: (parameters
          .colorScaleOptions as TriChoroContinuousOpts | TriChoroDiscreteOpts).contrast,
        spread: (parameters
          .colorScaleOptions as TriChoroContinuousOpts | TriChoroDiscreteOpts).spread,
      },
  );

  const [
    sextantColors,
    setSextantColors,
  ] = createSignal<SextantColorArray>(
    parameters.colorScaleType !== TricoloreScaleType.Sextant
      ? ['#FFFF00', '#B3DCC3', '#01A0C6', '#B8B3D8', '#F11D8C', '#FFB3B3']
      : (parameters.colorScaleOptions as TriChoroSextantOpts).colors,
  );

  const [
    nClasses,
    setNClasses,
  ] = createSignal<4 | 9 | 16>(
    parameters.colorScaleType !== TricoloreScaleType.Discrete
      ? 9
      : (parameters.colorScaleOptions as TriChoroDiscreteOpts).classes,
  );

  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(parameters.noDataColor);

  let refParentNode: HTMLDivElement;

  let plotDiv: HTMLDivElement;

  createEffect(
    on(
      () => [
        useMeanCentering(), colorScaleType(), sextantColors(), noDataColor(),
        nClasses(), colorScaleParams.hue, colorScaleParams.chroma, colorScaleParams.lightness,
        colorScaleParams.contrast, colorScaleParams.spread,
      ],
      () => {
        if (!plotDiv) return;
        // Clean up previous plot if any
        plotDiv!.innerHTML = '';
        const dimensions = {
          width: 300,
          height: 300,
          margin: {
            top: 0,
            right: 0,
            bottom: 30,
            left: 0,
          },
        };
        const center: [number, number, number] = useMeanCentering()
          ? CompositionUtils.center(filteredPts)
          : [1 / 3, 1 / 3, 1 / 3];

        const labels: [string, string, string] = [
          `⟵ ${currentClassifInfo().variable1}`,
          `⟵ ${currentClassifInfo().variable2}`,
          `${currentClassifInfo().variable3} ⟶`,
        ];

        let svg;

        if (colorScaleType() === TricoloreScaleType.Sextant) {
          svg = Viz.createSextantPlot(filteredPts, {
            center,
            labels,
            values: sextantColors(),
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
          }, dimensions);
        } else if (colorScaleType() === TricoloreScaleType.Discrete) {
          svg = Viz.createDiscretePlot(filteredPts, {
            center,
            hue: colorScaleParams.hue,
            chroma: colorScaleParams.chroma,
            lightness: colorScaleParams.lightness,
            contrast: colorScaleParams.contrast,
            spread: colorScaleParams.spread,
            labels,
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
            breaks: Msqrt(nClasses()),
          }, dimensions);
        } else { // TricoloreScaleType.Continuous
          svg = Viz.createContinuousPlot(filteredPts, {
            center,
            hue: colorScaleParams.hue,
            chroma: colorScaleParams.chroma,
            lightness: colorScaleParams.lightness,
            contrast: colorScaleParams.contrast,
            spread: colorScaleParams.spread,
            labels,
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
          }, dimensions);
        }
        svg.setAttribute('fill', 'var(--bulma-label-color)');
        plotDiv.appendChild(svg);

        // eslint-disable-next-line no-nested-ternary
        const params = colorScaleType() === TricoloreScaleType.Sextant
          ? { colors: sextantColors() } as TriChoroSextantOpts
          : colorScaleType() === TricoloreScaleType.Discrete
            ? { classes: nClasses(), ...unproxify(colorScaleParams) } as TriChoroDiscreteOpts
            : { ...unproxify(colorScaleParams) } as TriChoroContinuousOpts;

        setCurrentClassifInfo({
          variable1: currentClassifInfo().variable1,
          variable2: currentClassifInfo().variable2,
          variable3: currentClassifInfo().variable3,
          meanCentered: useMeanCentering(),
          colorScaleType: colorScaleType(),
          colorScaleOptions: params,
          noDataColor: noDataColor(),
        });
      },
    ),
  );

  const listenerEscKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (isEscape) {
      (refParentNode!.querySelector(
        '.classification-panel__cancel-button',
      ) as HTMLElement).click();
    }
  };

  onMount(() => {
    // We could set focus on the confirm button when the modal is shown
    // as in some other modal, although it is not as important here...
    document.body.addEventListener('keydown', listenerEscKey);
  });

  onCleanup(() => {
    document.body.removeEventListener('keydown', listenerEscKey);
  });

  return <div
    class="modal-window modal classification-panel"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          { LL().ClassificationPanel.title() }&nbsp;
          - {classificationMultivariatePanelStore.layerName}
        </p>
      </header>
      <section class="modal-card-body">
        <div class="is-flex">
          <div
            style={{ width: '50%' }}
            class={'is-flex is-flex-direction-column is-justify-content-center'}
          >
            <div>
              <InputFieldSelect
                label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.ColorScaleType() }
                onChange={(value) => { setColorScaleType(value as TricoloreScaleType); }}
                value={colorScaleType()}
              >
                <For each={Object.entries(TricoloreScaleType)}>
                  {
                    ([key, value]) => <option value={key}>
                      {LL().FunctionalitiesSection.TrivariateChoroplethOptions[value]()}
                    </option>
                  }
                </For>
              </InputFieldSelect>
              <Show when={colorScaleType() === TricoloreScaleType.Discrete}>
                <InputFieldSelect
                  label={ LL().ClassificationPanel.numberOfClasses() }
                  onChange={(value) => { setNClasses(+value as 4 | 9 | 16); }}
                  value={`${nClasses()}`}
                >
                  <option value={'4'}>4</option>
                  <option value={'9'}>9</option>
                  <option value={'16'}>16</option>
                </InputFieldSelect>
              </Show>
              <InputFieldCheckbox
                label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.UseMeanCentering() }
                checked={useMeanCentering()}
                onChange={(value) => { setUseMeanCentering(value); }}
              />
              <Show when={colorScaleType() === TricoloreScaleType.Sextant}>
                <div class={'is-flex is-justify-content-space-evenly'}>
                  <For each={[0, 1, 2, 3, 4, 5]}>
                    {
                      (ix) => <input type="color" value={sextantColors()[ix]} onChange={(e) => {
                        const newColors = [...sextantColors()];
                        newColors[ix] = e.currentTarget.value;
                        setSextantColors(newColors as SextantColorArray);
                      }} />
                    }
                  </For>
                </div>
              </Show>
              <Show when={colorScaleType() !== TricoloreScaleType.Sextant}>
                <div class={'is-flex is-justify-content-space-evenly has-text-centered'}>
                  <InputFieldNumber
                    label={'Hue'}
                    onChange={(value) => { setColorScaleParams('hue', value); }}
                    value={colorScaleParams.hue}
                    min={0}
                    max={360}
                    step={1}
                    layout={'vertical'}
                    width={100}
                  />
                  <InputFieldNumber
                    label={'Chroma'}
                    onChange={(value) => { setColorScaleParams('chroma', value); }}
                    value={colorScaleParams.chroma}
                    min={0}
                    max={200}
                    step={1}
                    layout={'vertical'}
                    width={100}
                  />
                  <InputFieldNumber
                    label={'Lightness'}
                    onChange={(value) => { setColorScaleParams('lightness', value); }}
                    value={colorScaleParams.lightness}
                    min={0}
                    max={100}
                    step={1}
                    layout={'vertical'}
                    width={100}
                  />
                  <InputFieldNumber
                    label={'Contrast'}
                    onChange={(value) => { setColorScaleParams('contrast', value); }}
                    value={colorScaleParams.contrast}
                    min={0}
                    max={1}
                    step={0.1}
                    layout={'vertical'}
                    width={100}
                  />
                  <InputFieldNumber
                    label={'Spread'}
                    onChange={(value) => { setColorScaleParams('spread', value); }}
                    value={colorScaleParams.spread}
                    min={0}
                    max={5}
                    step={0.1}
                    layout={'vertical'}
                    width={100}
                  />
                </div>
              </Show>
              <Show when={hasNoData}>
                <hr />
                <InputFieldColor
                  label={LL().ClassificationPanel.noDataColor()}
                  value={noDataColor()}
                  onChange={(v) => { setNoDataColor(v); }}
                  width={50}
                />
              </Show>
            </div>
          </div>
          <div style={{ width: '50%' }}>
            <div class={'has-text-centered'} ref={plotDiv!}></div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success classification-panel__confirm-button"
          onClick={() => {
            if (classificationMultivariatePanelStore.onConfirm) {
              classificationMultivariatePanelStore.onConfirm(currentClassifInfo());
            }
            setClassificationMultivariatePanelStore({ show: false });
          }}
        >{LL().SuccessButton()}</button>
        <button
          class="button classification-panel__cancel-button"
          onClick={() => {
            if (classificationMultivariatePanelStore.onCancel) {
              classificationMultivariatePanelStore.onCancel();
            }
            setClassificationMultivariatePanelStore({ show: false });
          }}
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
