import type { FormattersInitializer } from 'typesafe-i18n';
import type { Locales, Formatters } from './i18n-types';

/* eslint-disable-next-line import/prefer-default-export */
export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {
  console.log(locale);
  const formatters: Formatters = {
    // add your formatter functions here
  };
  return formatters;
};
