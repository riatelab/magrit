import { v4 as uuidv4 } from 'uuid';

import { applicationSettingsStore } from '../store/ApplicationSettingsStore';

import { getPossibleLegendPosition } from '../components/LegendRenderer/common.tsx';

import {
  type DefaultLegend,
  type LayerDescription,
  type LayoutFeature,
  type Legend,
  LegendType, type VectorType,
} from '../global.d';

export const isLegend1 = (obj: LayoutFeature | Legend): boolean => Object.values(LegendType)
  .includes((obj as Legend).type);

export const isLegend2 = (obj: LayoutFeature | Legend): boolean => Object.keys(LegendType)
  .includes((obj as Legend).type);

export const generateIdLegend = () => `Legend-${uuidv4()}`;

export const makeDefaultLegendDescription = (layer: LayerDescription): DefaultLegend => {
  const legendPosition = getPossibleLegendPosition(150, 150);
  return {
    id: generateIdLegend(),
    layerId: layer.id,
    title: {
      text: '',
      ...applicationSettingsStore.defaultLegendSettings.title,
    },
    subtitle: {
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    },
    note: {
      ...applicationSettingsStore.defaultLegendSettings.note,
    },
    position: legendPosition,
    visible: false,
    roundDecimals: 0,
    backgroundRect: { visible: false },
    // Part specific to default legends
    type: 'default',
    typeGeometry: layer.type as VectorType,
    displayAsPolygon: false,
    labels: {
      text: layer.name,
      ...applicationSettingsStore.defaultLegendSettings.labels,
    },
    boxWidth: 50,
    boxHeight: 30,
    boxCornerRadius: 0,
  } as DefaultLegend;
};
