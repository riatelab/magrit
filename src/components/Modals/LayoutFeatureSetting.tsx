// Imports from solid-js
import {
  Accessor,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';

// Stores
import {
  layersDescriptionStore,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';

// Helpers
import type { TranslationFunctions } from '../../i18n/i18n-types';

// Types / Interfaces / Enums
import { type LayoutFeature, LayoutFeatureType, Rectangle } from '../../global.d';

/**
 * Update a single property of a layout feature in the layersDescriptionStore,
 * given its id and the path to the property.
 *
 * @param {string} layoutFeatureId - The id of the layout feature to update.
 * @param {string[]} props - The path to the property to update.
 * @param {string | number} value - The new value of the property.
 * @return {void}
 */
const updateLayoutFeatureProperty = (
  layoutFeatureId: string,
  props: string[],
  value: string | number,
) => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layoutFeatures',
    (f: LayoutFeature) => f.id === layoutFeatureId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStore(...args);
};

function makeSettingsRectangle(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as Rectangle;
  return <>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.FillColor() }</label>
      <div class="control">
        <input
          class="color"
          type="color"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['fillColor'],
            e.currentTarget.value,
          )}
          value={ft.fillColor}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.FillOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['fillOpacity'],
            +e.currentTarget.value,
          )}
          value={ft.fillOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.StrokeColor() }</label>
      <div class="control">
        <input
          class="color"
          type="color"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['strokeColor'],
            e.currentTarget.value,
          )}
          value={ft.strokeColor}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.StrokeOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['strokeOpacity'],
            +e.currentTarget.value,
          )}
          value={ft.strokeOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.StrokeWidth() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['strokeWidth'],
            +e.currentTarget.value,
          )}
          value={ft.strokeWidth}
          min="0"
          max="100"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Modal.RoundCorners() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['cornerRadius'],
            +e.currentTarget.value,
          )}
          value={ft.cornerRadius}
          min="0"
          max="100"
          step="1"
        />
      </div>
    </div>
  </>;
}

function makeSettingsEllipse(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <></>;
}

function makeSettingsScaleBar(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <></>;
}

export default function LayoutFeatureSettings(
  props: {
    layoutFeatureId: string,
    LL: Accessor<TranslationFunctions>
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const {
    layoutFeatureId,
    LL,
  } = props; // eslint-disable-line solid/reactivity

  const layoutFeature = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId);

  if (!layoutFeature) {
    // Due to the way this settings modal is triggered,
    // this should never happen...
    throw new Error('LayoutFeatureSettings: layoutFeature is undefined');
  }

  return <div class="layout-feature-settings">
    <div class="layout-features-settings__content">
      {
        ({
          [LayoutFeatureType.Rectangle]: makeSettingsRectangle,
          [LayoutFeatureType.Ellipse]: makeSettingsEllipse,
          [LayoutFeatureType.ScaleBar]: makeSettingsScaleBar,
        })[layoutFeature.type](layoutFeatureId, LL)
      }
    </div>
  </div>;
}
