// Imports from solid-js
import { Accessor, For, JSX } from 'solid-js';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';
import { debounce } from '../../helpers/common';
import { webSafeFonts } from '../../helpers/font';
import { findLayerById } from '../../helpers/layers';

// Stores
import { layersDescriptionStore, setLayersDescriptionStoreBase } from '../../store/LayersDescriptionStore';

// Other components
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';

// Types / Interfaces / Enums
import { LabelsParameters, type LayerDescription } from '../../global';

// TODO: merge some duplicated code about props update
//  between this file, LayerSettings.tsx and LegendSettings.tsx
const updateProp = (
  layerId: string,
  propOrProps: string | string[],
  value: string | number | boolean | object | null,
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
    // @ts-expect-error because we use a spread argument
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

export default function SingleLabelEdition(
  props: {
    layerId: string,
    featureIx: number,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  const {
    layerId,
    featureIx,
    LL,
    // eslint-disable-next-line solid/reactivity
  } = props;
  const layer = findLayerById(
    layersDescriptionStore.layers,
    layerId,
  )!;

  const rendererParameters = layer.rendererParameters as LabelsParameters;
  const defaultLabel = rendererParameters.default;

  return <div class="single-label-edition">
    <InputFieldSelect
      label={LL().LayerSettings.FontFamily()}
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            { ...defaultLabel, fontFamily: v },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontFamily'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontFamily
          : rendererParameters.default.fontFamily
      }
    >
      <For each={webSafeFonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={ LL().LayerSettings.FontSize() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontSize
          : rendererParameters.default.fontSize
      }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            { ...defaultLabel, fontSize: v },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontSize'],
          v,
        );
      }}
      min={1}
      max={100}
      step={1}
    />
    <InputFieldColor
      label={ LL().LayerSettings.TextColor() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontColor
          : rendererParameters.default.fontColor
      }
      onChange={(v) => {
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontColor'],
          v,
        );
      }}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.XOffset() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].textOffset[0]
          : rendererParameters.default.textOffset[0]
      }
      onChange={
        (v) => {
          if (!rendererParameters.specific[featureIx]) {
            const value = [v, rendererParameters.default.textOffset[1]];
            updateProp(
              layerId,
              ['rendererParameters', 'specific', featureIx],
              { ...defaultLabel, textOffset: value },
            );
            return;
          }
          const value = [v, rendererParameters.specific[featureIx].textOffset[1]];
          updateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx, 'textOffset'],
            value,
          );
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.YOffset() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].textOffset[1]
          : rendererParameters.default.textOffset[1]
      }
      onChange={
        (v) => {
          if (!rendererParameters.specific[featureIx]) {
            const value = [rendererParameters.default.textOffset[0], v];
            updateProp(
              layerId,
              ['rendererParameters', 'specific', featureIx],
              { ...defaultLabel, textOffset: value },
            );
            return;
          }
          const value = [rendererParameters.specific[featureIx].textOffset[0], v];
          updateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx, 'textOffset'],
            value,
          );
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayerSettings.FontStyle() }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            { ...defaultLabel, fontStyle: v },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontStyle'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontStyle
          : rendererParameters.default.fontStyle
      }
    >
      <option value="normal">Normal</option>
      <option value="italic">Italic</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayerSettings.FontWeight() }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            { ...defaultLabel, fontWeight: v },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontWeight'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontWeight
          : rendererParameters.default.fontWeight
      }
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </InputFieldSelect>
  </div>;
}
