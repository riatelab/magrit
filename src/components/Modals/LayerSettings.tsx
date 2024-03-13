// Imports from solid-js
import {
  Accessor,
  For,
  JSX,
  Show,
} from 'solid-js';

// Imports from other libs
import { getPalette, getPalettes } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { debounce, unproxify } from '../../helpers/common';
import { webSafeFonts } from '../../helpers/font';

// Sub-components
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldButton from '../Inputs/InputButton.tsx';
import CollapsibleSection from '../CollapsibleSection.tsx';
import { CategoriesCustomisation } from '../PortrayalOption/CategoricalChoroplethComponents.tsx';
import { LinksSelectionOnExistingLayer } from '../PortrayalOption/LinksComponents.tsx';

// Stores
import {
  layersDescriptionStore,
  // In this component we use the base version of the store to avoid pushing
  // the changes to the undo/redo stack (because there is a
  // cancel button in the LayerSettings modal)
  setLayersDescriptionStoreBase,
} from '../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../store/ClassificationPanelStore';

// Types / Interfaces
import {
  type CategoricalChoroplethParameters,
  type ClassificationParameters,
  type GriddedLayerParameters,
  type LabelsParameters,
  type LayerDescription,
  type LayerDescriptionLabels,
  type LinksParameters,
  type MushroomsParameters,
  type ProportionalSymbolsParameters,
  type SmoothedLayerParameters,
  LinkCurvature,
  LinkHeadType,
  ProportionalSymbolsSymbolType,
} from '../../global.d';

// Styles
import '../../styles/LayerAndLegendSettings.css';

const updateProp = (
  layerId: string,
  propOrProps: string | string[],
  value: string | number | boolean,
) => {
  if (Array.isArray(propOrProps)) {
    const allPropsExceptLast = propOrProps.slice(0, propOrProps.length - 1);
    const lastProp = propOrProps[propOrProps.length - 1];
    const args = [
      'layers',
      (l: LayerDescription) => l.id === layerId,
      ...allPropsExceptLast,
      {
        [lastProp]: value,
      },
    ];
    setLayersDescriptionStoreBase(...args);
  } else {
    setLayersDescriptionStoreBase(
      'layers',
      (l: LayerDescription) => l.id === layerId,
      { [propOrProps]: value },
    );
  }
};

const debouncedUpdateProp = debounce(updateProp, 200);

function AestheticsSection(props: LayerDescription): JSX.Element {
  const { LL } = useI18nContext();

  return <details>
    <summary>{ LL().LayerSettings.AestheticFilter() }</summary>
    <div>
      <InputFieldCheckbox
        label={LL().LayerSettings.DropShadow()}
        checked={props.dropShadow}
        onChange={(checked) => updateProp(props.id, 'dropShadow', checked)}
      />
      <InputFieldCheckbox
        label={LL().LayerSettings.Blur()}
        checked={props.blurFilter}
        onChange={(checked) => updateProp(props.id, 'blurFilter', checked)}
      />
    </div>
  </details>;
}

function makeSettingsLabels(
  props: LayerDescriptionLabels,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const rendererParameters = props.rendererParameters as LabelsParameters;
  return <>
    <InputFieldSelect
      label={ LL().LayerSettings.FontFamily() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontFamily'], v)}
      value={rendererParameters.fontFamily}
    >
      <For each={webSafeFonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={ LL().LayerSettings.FontSize() }
      value={rendererParameters.fontSize}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontSize'], v)}
      min={1}
      max={100}
      step={1}
    />
    <InputFieldColor
      label={ LL().LayerSettings.TextColor() }
      value={rendererParameters.fontColor}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontColor'], v)}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.XOffset() }
      value={rendererParameters.textOffset[0]}
      onChange={
        (v) => {
          const value = [v, rendererParameters.textOffset[1]];
          debouncedUpdateProp(props.id, ['rendererParameters', 'textOffset'], value);
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.YOffset() }
      value={rendererParameters.textOffset[1]}
      onChange={
        (v) => {
          const value = [rendererParameters.textOffset[0], v];
          debouncedUpdateProp(props.id, ['rendererParameters', 'textOffset'], value);
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayerSettings.FontStyle() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontStyle'], v)}
      value={rendererParameters.fontStyle}
    >
      <option value="normal">Normal</option>
      <option value="italic">Italic</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayerSettings.FontWeight() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontWeight'], v)}
      value={rendererParameters.fontWeight}
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </InputFieldSelect>
    <InputFieldCheckbox
      label={ LL().LayerSettings.BufferAroundText() }
      checked={rendererParameters.halo !== undefined}
      onChange={(v) => {
        if (v) {
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], { color: '#ffffff', width: 2 });
        } else {
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], undefined);
        }
      }}
    />
    <Show when={rendererParameters.halo !== undefined}>
      <InputFieldColor
        label={ LL().LayerSettings.BufferColor() }
        value={rendererParameters.halo!.color}
        onChange={(v) => {
          const haloProps = {
            color: v,
            width: rendererParameters.halo!.width,
          };
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], haloProps);
        }}
      />
      <InputFieldNumber
        label={ LL().LayerSettings.BufferWidth() }
        value={rendererParameters.halo!.width}
        onChange={
          (v) => {
            const haloProps = {
              color: rendererParameters.halo!.color,
              width: v,
            };
            debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], haloProps);
          }
        }
        min={0}
        max={10}
        step={1}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayerSettings.AllowMovingLabels() }
      checked={rendererParameters.movable}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v)}
    />
    <InputFieldButton
      label={'Reset label locations'}
      onClick={() => {
        // TODO...
      }}
    />
  </>;
}

function makeSettingsDefaultPoint(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <>
    {/*
      The way the entities are colored depends on the renderer...
        - For 'default' renderer (i.e. no classification), we can choose the color manually
        - For 'choropleth' renderer, we propose to reopen the classification modal
        - For 'proportional' renderer, ... (TODO)
    */}
    <Show when={props.renderer === 'default'}>
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={props.fillColor!}
        onChange={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
      />
    </Show>
    <Show when={props.renderer === 'choropleth'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              layerName: props.name,
              variableName: (props.rendererParameters as ClassificationParameters).variable,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              nClasses: (props.rendererParameters as ClassificationParameters).classes,
              colorScheme: (props.rendererParameters as ClassificationParameters).palette.name,
              invertColorScheme: (
                props.rendererParameters as ClassificationParameters).reversePalette,
              noDataColor: (props.rendererParameters as ClassificationParameters).noDataColor,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                console.log(newParams);
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{ LL().LayerSettings.ChangeClassification() }</button>
      </div>
    </Show>
    <Show when={props.renderer === 'categoricalChoropleth'}>
      <CollapsibleSection title={LL().PortrayalSection.CategoricalChoroplethOptions.Customize()}>
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </CollapsibleSection>
    </Show>
    <Show when={props.renderer === 'proportionalSymbols'}>
      <InputFieldSelect
        label={LL().PortrayalSection.ProportionalSymbolsOptions.SymbolType()}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'symbolType'], v)}
        value={(props.rendererParameters as ProportionalSymbolsParameters).symbolType}
      >
        <option value={ProportionalSymbolsSymbolType.circle}>
          { LL().PortrayalSection.ProportionalSymbolsOptions.SymbolTypes.circle() }
        </option>
        <option value={ProportionalSymbolsSymbolType.square}>
          { LL().PortrayalSection.ProportionalSymbolsOptions.SymbolTypes.square() }
        </option>
      </InputFieldSelect>
      <InputFieldNumber
        label={LL().PortrayalSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as ProportionalSymbolsParameters).referenceRadius}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'referenceRadius'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={ LL().PortrayalSection.ProportionalSymbolsOptions.OnValue() }
        value={(props.rendererParameters as ProportionalSymbolsParameters).referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={ (props.rendererParameters as ProportionalSymbolsParameters).color as string }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'color'], v)}
      />
    </Show>
    <InputFieldColor
      label={ LL().LayerSettings.StrokeColor() }
      value={ props.strokeColor! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.FillOpacity() }
      value={ props.fillOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeOpacity() }
      value={ props.strokeOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeWidth() }
      value={props.strokeWidth!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      min={0}
      max={10}
      step={0.1}
    />
    <Show when={ props.renderer !== 'proportionalSymbols' && props.renderer !== 'mushrooms' }>
      <InputFieldNumber
        label={ LL().LayerSettings.PointRadius() }
        value={ props.pointRadius! }
        onChange={(v) => debouncedUpdateProp(props.id, 'pointRadius', v)}
        min={1}
        max={20}
        step={1}
      />
    </Show>
    <Show when={props.renderer === 'mushrooms'}>
      <div class="mt-4 mb-5 has-text-weight-bold">
        {LL().PortrayalSection.MushroomsOptions.TopProperties()}
      </div>
      <InputFieldNumber
        label={LL().PortrayalSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceSize}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceSize'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().PortrayalSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
      <InputFieldColor
        label={LL().LayerSettings.FillColor()}
        value={(props.rendererParameters as MushroomsParameters).top.color as string}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'color'], v)}
      />
      <div class="mt-4 mb-5 has-text-weight-bold">
        {LL().PortrayalSection.MushroomsOptions.BottomProperties()}
      </div>
      <InputFieldNumber
        label={LL().PortrayalSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceSize}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceSize'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().PortrayalSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
      <InputFieldColor
        label={LL().LayerSettings.FillColor()}
        value={(props.rendererParameters as MushroomsParameters).bottom.color as string}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'color'], v)}
      />
    </Show>
    <Show when={props.renderer === 'proportionalSymbols'}>
      <InputFieldCheckbox
        label={ LL().PortrayalSection.ProportionalSymbolsOptions.AvoidOverlapping() }
        checked={ (props.rendererParameters as ProportionalSymbolsParameters).avoidOverlapping }
        onChange={(checked) => {
          setLayersDescriptionStoreBase(
            'layers',
            (l: LayerDescription) => l.id === props.id,
            'rendererParameters',
            { avoidOverlapping: checked },
          );
          // TODO: update the map
        }}
      />
      <Show when={(props.rendererParameters as ProportionalSymbolsParameters).avoidOverlapping}>
        <InputFieldNumber
          label={'Iterations'}
          value={(props.rendererParameters as ProportionalSymbolsParameters).iterations}
          onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'iterations'], v)}
          min={1}
          max={1000}
          step={1}
        />
      </Show>
      <InputFieldCheckbox
        label={ LL().LayerSettings.AllowMovingSymbols() }
        checked={(props.rendererParameters as ProportionalSymbolsParameters).movable}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v)}
      />
    </Show>
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsDefaultLine(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  // TODO: we have layer of proportional symbols with geometry type "linestring"
  //  so we should handle this case here
  return <>
    <Show when={
      props.renderer === 'default'
      || props.renderer === 'discontinuity'
      || props.renderer === 'links'
    }>
      <InputFieldColor
        label={ LL().LayerSettings.StrokeColor() }
        value={ props.strokeColor! }
        onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
      />
    </Show>
    <Show when={props.renderer === 'choropleth'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              layerName: props.name,
              variableName: (props.rendererParameters as ClassificationParameters).variable,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              nClasses: (props.rendererParameters as ClassificationParameters).classes,
              colorScheme: (props.rendererParameters as ClassificationParameters).palette.name,
              invertColorScheme: (
                props.rendererParameters as ClassificationParameters).reversePalette,
              noDataColor: (props.rendererParameters as ClassificationParameters).noDataColor,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                console.log(newParams);
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{ LL().LayerSettings.ChangeClassification() }</button>
      </div>
    </Show>
    <Show when={props.renderer === 'categoricalChoropleth'}>
      <CollapsibleSection title={LL().PortrayalSection.CategoricalChoroplethOptions.Customize()}>
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </CollapsibleSection>
    </Show>
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeOpacity() }
      value={ props.strokeOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <Show when={
      props.renderer !== 'discontinuity'
      && !(props.renderer === 'links'
        && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type))
    }>
      <InputFieldNumber
        label={ LL().LayerSettings.StrokeWidth() }
        value={props.strokeWidth!}
        onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
        min={0}
        max={10}
        step={0.1}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayerSettings.StrokeDashed() }
      checked={!!props.strokeDasharray}
      onChange={(checked) => {
        const v = checked ? '5 5' : undefined;
        debouncedUpdateProp(props.id, 'strokeDasharray', v);
      }}
    />
    <Show when={
      props.renderer === 'links'
      && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type)
      && (props.rendererParameters as LinksParameters).proportional
    }>
      <InputFieldNumber
        label={ LL().PortrayalSection.LinksOptions.LinkSizeProportionalReferenceSize() }
        value={ (props.rendererParameters as LinksParameters).proportional!.referenceSize }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'proportional', 'referenceSize'], v)}
        min={1}
        max={50}
        step={0.5}
      />
      <InputFieldNumber
        label={ LL().PortrayalSection.LinksOptions.LinkSizeProportionalReferenceValue() }
        value={ (props.rendererParameters as LinksParameters).proportional!.referenceValue }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'proportional', 'referenceValue'], v)}
        min={1}
        max={1e12}
        step={0.5}
      />
    </Show>
    <Show when={
      props.renderer === 'links'
      && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type)
      && (props.rendererParameters as LinksParameters).classification
    }>
      <></>
    </Show>
    <Show when={props.renderer === 'links'}>
      <InputFieldSelect
        label={LL().PortrayalSection.LinksOptions.LinkCurvature()}
        value={(props.rendererParameters as LinksParameters).curvature}
        onChange={(v) => updateProp(props.id, ['rendererParameters', 'curvature'], v)}
      >
        <For each={Object.entries(LinkCurvature)}>
          {
            ([key, value]) => <option value={value}>
              {LL().PortrayalSection.LinksOptions[`LinkCurvature${key}`]()}
            </option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().PortrayalSection.LinksOptions.LinkHeadType()}
        value={(props.rendererParameters as LinksParameters).head}
        onChange={(v) => updateProp(props.id, ['rendererParameters', 'head'], v)}
      >
        <For each={Object.entries(LinkHeadType)}>
          {
            ([key, value]) => <option value={value}>
              {LL().PortrayalSection.LinksOptions[`LinkHeadType${key}`]()}
            </option>
          }
        </For>
      </InputFieldSelect>
      <details>
        <summary>{ LL().PortrayalSection.LinksOptions.Selection() }</summary>
        <LinksSelectionOnExistingLayer layerId={props.id}/>
      </details>
    </Show>
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsDefaultPolygon(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const availableSequentialPalettes = getPalettes({ type: 'sequential', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
    }));

  return <>
    {/*
      The way the entities are colored depends on the renderer...
        - For 'default' renderer (i.e. no classification) or 'sphere',
          we can choose the color manually
        - For 'choropleth' renderer, we propose to reopen the classification modal
        - For 'proportional' renderer, ... (TODO)
    */}
    <Show when={props.renderer === 'default' || props.renderer === 'sphere' || props.renderer === 'cartogram'}>
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={props.fillColor!}
        onChange={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
      />
    </Show>
    <Show when={props.renderer === 'choropleth'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              layerName: props.name,
              variableName: (props.rendererParameters as ClassificationParameters).variable,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              classificationMethod: (props.rendererParameters as ClassificationParameters).method,
              nClasses: (props.rendererParameters as ClassificationParameters).classes,
              colorScheme: (props.rendererParameters as ClassificationParameters).palette.name,
              invertColorScheme: (
                props.rendererParameters as ClassificationParameters).reversePalette,
              noDataColor: (props.rendererParameters as ClassificationParameters).noDataColor,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{ LL().LayerSettings.ChangeClassification() }</button>
      </div>
    </Show>
    <Show when={props.renderer === 'categoricalChoropleth'}>
      <CollapsibleSection title={LL().PortrayalSection.CategoricalChoroplethOptions.Customize()}>
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </CollapsibleSection>
    </Show>
    <Show when={props.renderer === 'smoothed' || props.renderer === 'grid'}>
      <InputFieldSelect
        label={LL().LayerSettings.Palette()}
        onChange={(palName) => {
          const n = (props.rendererParameters as SmoothedLayerParameters).breaks.length - 1;
          const palette = getPalette(palName, n);
          debouncedUpdateProp(props.id, ['rendererParameters', 'palette'], palette);
        }}
        value={(props.rendererParameters as SmoothedLayerParameters).palette.name}
        width={300}
      >
        <For each={availableSequentialPalettes}>
          {
            (d) => <option value={d.value}>{d.name}</option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldCheckbox
        label={ 'Reverse palette' }
        checked={
          (
            props.rendererParameters as SmoothedLayerParameters | GriddedLayerParameters
          ).reversePalette
        }
        onChange={(value) => {
          updateProp(props.id, ['rendererParameters', 'reversePalette'], value);
        }}
      />
    </Show>
    <InputFieldColor
      label={ LL().LayerSettings.StrokeColor() }
      value={ props.strokeColor! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.FillOpacity() }
      value={ props.fillOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeOpacity() }
      value={ props.strokeOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeWidth() }
      value={props.strokeWidth!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      min={0}
      max={10}
      step={0.1}
    />
    <AestheticsSection {...props} />
  </>;
}

export default function LayerSettings(
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { id, LL } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === id) as LayerDescription;

  let innerElement;
  if (layerDescription.renderer === 'labels') {
    innerElement = makeSettingsLabels(layerDescription as LayerDescriptionLabels, LL);
  } else {
    innerElement = {
      point: makeSettingsDefaultPoint,
      linestring: makeSettingsDefaultLine,
      polygon: makeSettingsDefaultPolygon,
    }[layerDescription.type as ('point' | 'linestring' | 'polygon')](layerDescription, LL);
  }

  return <div class="layer-settings">
    <div class="layer-settings__title">
      <InputFieldText
        label={ LL().LayerSettings.Name() }
        value={ layerDescription.name }
        onChange={(v) => updateProp(layerDescription.id, 'name', v)}
        width={460}
      />
    </div>
    <br />
    <div class="layer-settings__content">
      { innerElement }
    </div>
  </div>;
}
