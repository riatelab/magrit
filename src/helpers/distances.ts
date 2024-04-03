import { DistanceUnit } from '../global.d';

/**
 * Convert the distance in meters to the given unit.
 *
 * @param distance
 * @param unit
 */
export const convertToUnit = (distance: number, unit: DistanceUnit): number => {
  if (unit === DistanceUnit.km) {
    return distance / 1000;
  }
  if (unit === DistanceUnit.mi) {
    return distance / 1609.344;
  }
  if (unit === DistanceUnit.ft) {
    return distance / 0.3048;
  }
  if (unit === DistanceUnit.yd) {
    return distance / 0.9144;
  }
  if (unit === DistanceUnit.nmi) {
    return distance / 1852;
  }
  return distance;
};

/**
 * Convert the distance from the given unit to meters.
 *
 * @param distance
 * @param unit
 */
export const convertFromUnit = (distance: number, unit: DistanceUnit): number => {
  if (unit === DistanceUnit.km) {
    return distance * 1000;
  }
  if (unit === DistanceUnit.mi) {
    return distance * 1609.344;
  }
  if (unit === DistanceUnit.ft) {
    return distance * 0.3048;
  }
  if (unit === DistanceUnit.yd) {
    return distance * 0.9144;
  }
  if (unit === DistanceUnit.nmi) {
    return distance * 1852;
  }
  return distance;
};
