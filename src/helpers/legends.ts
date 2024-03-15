import { v4 as uuidv4 } from 'uuid';

import {
  type LayoutFeature,
  type Legend,
  LegendType,
} from '../global.d';

export const isLegend1 = (obj: LayoutFeature | Legend): boolean => Object.values(LegendType)
  .includes((obj as Legend).type);

export const isLegend2 = (obj: LayoutFeature | Legend): boolean => Object.keys(LegendType)
  .includes((obj as Legend).type);

export const generateIdLegend = () => `Legend-${uuidv4()}`;
