// Imports from solid-js
import {
  Accessor,
  createEffect,
  For,
  JSX,
  on,
  Setter,
} from 'solid-js';
import { unwrap } from 'solid-js/store';

// GeoJSON types
import type { Feature } from 'geojson';

// Imports from other packages
import { area } from '@turf/turf';
import alasql from 'alasql';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { capitalizeFirstLetter, replaceNullByUndefined, unproxify } from '../helpers/common';

// Types
import type { LayerDescription } from '../global';

// Insert a value (chosen from the list of fields / special fields / operator)
// in the formula at the caret position (taking care of the selection if needed)
const insertInFormula = (
  value: string,
  currentFormula: Accessor<string>,
  setCurrentFormula: Setter<string>,
  refInputFormula: HTMLTextAreaElement,
) => {
  if (currentFormula() === '') {
    setCurrentFormula(`${value} `);
  } else {
    // We need to take care of the caret position
    const caretPosStart = refInputFormula.selectionStart as number;
    const caretPosEnd = refInputFormula.selectionEnd as number;

    // If the user has selected some text, we replace it
    if (caretPosStart !== caretPosEnd) {
      setCurrentFormula(
        `${currentFormula().slice(0, caretPosStart)}${value}${currentFormula().slice(caretPosEnd)}`,
      );
    } else {
      // Otherwise we insert the field at the caret position
      setCurrentFormula(
        `${currentFormula().slice(0, caretPosStart)}${value} ${currentFormula().slice(caretPosStart)}`,
      );
    }
  }
};

export type SampleOutputFormat = {
  type: 'Error' | 'Valid';
  value: any;
};

export type ErrorSampleOutput = SampleOutputFormat & { type: 'Error', value: 'ParsingFormula' | 'EmptyResult' };
export type ValidSampleOutput = SampleOutputFormat & { type: 'Valid', value: { [key: number]: boolean | string | number } };

export const specialFields = {
  layer: ['$count', '$id', '$area'],
  table: ['$count', '$id'],
};

export const hasSpecialFieldId = (formula: string) => formula.includes('@@uuid');

export const hasSpecialFieldArea = (formula: string) => formula.includes('@@area');

export const replaceSpecialFields = (formula: string, lengthDataset: number): string => formula
  .replaceAll(/\$count/gi, lengthDataset.toString())
  .replaceAll(/\$id/gi, '[@@uuid]')
  .replaceAll(/\$area/gi, '[@@area]');

export const formatValidSampleOutput = (
  value: { [key: number]: number | string | boolean },
): string => {
  const nItems = Object.keys(value).length;
  const strArray = [];
  for (let i = 0; i < nItems; i += 1) {
    if (value[i] !== undefined) {
      strArray.push(`[${i}] ${value[i]}`);
    } else {
      strArray.push(`[${i}] null`);
    }
  }
  return strArray.join('\n');
};

export const filterData = (
  layerDescription: LayerDescription,
  formula: string,
): Feature[] => {
  const data: Record<string, any>[] = layerDescription.data.features
    .map((d: Feature<any, Record<string, any>>) => unwrap(d.properties) as Record<string, any>);
  const lengthDataset = data.length;
  const formulaClean = replaceSpecialFields(formula, lengthDataset);
  const query = `SELECT ${formulaClean} as newValue FROM ?`;

  // Add special fields if needed
  if (hasSpecialFieldId(formulaClean)) {
    data.forEach((d, i) => {
      d['@@uuid'] = i; // eslint-disable-line no-param-reassign
    });
  }
  if (hasSpecialFieldArea(formulaClean)) {
    data.forEach((d, i) => {
      d['@@area'] = area(layerDescription.data.features[i].geometry as never); // eslint-disable-line no-param-reassign
    });
  }

  // Compute new column
  const newColumn = alasql(query, [data]);
  const predicateArray = newColumn.map((d: any) => d.newValue);

  // Select the data based on the predicate array
  return layerDescription.data.features.filter((_, i) => predicateArray[i]);
};

const sqlFuncNames = ['power', 'substring', 'substr', 'concat', 'min', 'max', 'count', 'sum', 'avg'];

/**
 * Check if a string (a field name, in lowercase) is a SQL function name.
 * This is useful to escape the field name with brackets if needed
 * in the FormulaInput component.
 *
 * @param {string} name - A string (a field name, in lowercase).
 * @returns {boolean} - True if the string is a SQL function name.
 */
export const isFuncName = (name: string): boolean => sqlFuncNames.includes(name);

export default function FormulaInput(
  props: {
    typeDataset: 'layer' | 'table',
    records: Record<string, any>[],
    geometries?: Geometry[],
    currentFormula: Accessor<string>,
    setCurrentFormula: Setter<string>,
    sampleOutput: Accessor<SampleOutputFormat | undefined>,
    setSampleOutput: Setter<SampleOutputFormat | undefined>,
  },
): JSX.Element {
  let refInputFormula: HTMLTextAreaElement;
  const { LL } = useI18nContext();

  const styleBadges = {
    'column-gap': '0.4em',
    'flex-wrap': 'wrap',
    'row-gap': '0.4em',
  } as JSX.CSSProperties;

  const computeSampleOutput = () => {
    const formula = replaceSpecialFields(props.currentFormula(), props.records.length);

    if (formula.trim() === '') {
      props.setSampleOutput(undefined);
      return;
    }

    const query = `SELECT ${formula} as newValue FROM ?`;
    const data = replaceNullByUndefined(unproxify(props.records.slice(0, 8)));

    if (hasSpecialFieldId(formula)) {
      data.forEach((d, i) => {
        d['@@uuid'] = i; // eslint-disable-line no-param-reassign
      });
    }
    if (props.typeDataset === 'layer' && hasSpecialFieldArea(formula)) {
      data.forEach((d, i) => {
        // We know props.geometry is defined here because we have a geographic layer
        // eslint-disable-next-line no-param-reassign
        d['@@area'] = area(props.geometries![i] as never);
      });
    }

    try {
      const newColumn = alasql(query, [data]);
      const allUndefined = newColumn.every((d: any) => d.newValue === undefined);
      if (allUndefined) {
        props.setSampleOutput({ type: 'Error', value: 'EmptyResult' });
        // TODO: we may try to parse the query here (as it is syntactically correct
        //   since no error was thrown by alasql)
        //   and detect why the output is empty (e.g. a column name is wrong, etc.)
      } else {
        const resultObj: { [key: number]: number | string | boolean } = {};
        for (let i = 0; i < newColumn.length; i += 1) {
          if (newColumn[i]) {
            resultObj[i] = newColumn[i].newValue;
          }
        }
        props.setSampleOutput({
          type: 'Valid',
          value: resultObj,
        });
      }
    } catch (e) {
      props.setSampleOutput({ type: 'Error', value: 'ParsingFormula' });
    }

    // Cleanup the special fields
    data.forEach((d) => {
      // eslint-disable-next-line no-param-reassign
      delete d['@@uuid'];
      // eslint-disable-next-line no-param-reassign
      delete d['@@area'];
    });
  };

  createEffect(
    on(
      () => props.currentFormula(),
      () => {
        computeSampleOutput();
      },
    ),
  );

  return <div class="field-block">
    <label class="label">{LL().FormulaInput.formula()}</label>
    <div class="control is-flex">
      <div class="is-flex" style={{ width: '68%', ...styleBadges }}>
        <For each={Object.keys(props.records[0])}>
          {
            (field) => (
              <button
                class="tag is-warning"
                title={
                  /[àâäéèêëîïôöùûüç -+]/i.test(field) || isFuncName(field.toLocaleLowerCase())
                    ? `${field} - ${LL().FormulaInput.noteSpecialCharacters()}`
                    : field
                }
                onClick={() => {
                  // If the field name contains spaces or special characters,
                  // we need to put it between brackets
                  let fieldValue = field;
                  // Note that the two dashes are not the same
                  if (
                    /[àâäéèêëîïôöùûüç --+]/i.test(fieldValue)
                    || isFuncName(field.toLocaleLowerCase())
                  ) {
                    fieldValue = `[${fieldValue}]`;
                  }
                  // Insert the field in the formula
                  insertInFormula(
                    fieldValue,
                    props.currentFormula,
                    props.setCurrentFormula,
                    refInputFormula,
                  );
                  // Focus on the input field to help the UX
                  refInputFormula.focus();
                }}
              >{field}</button>
            )
          }
        </For>
        <For each={specialFields[props.typeDataset]}>
          {
            (specialField) => (
              <button
                class="tag is-success"
                title={
                  LL().FormulaInput[
                    `specialField${capitalizeFirstLetter(specialField.replace('$', ''))}` as 'specialFieldId' | 'specialFieldCount' | 'specialFieldArea'
                  ]()
                }
                onClick={() => {
                  // Insert the field in the formula
                  insertInFormula(
                    specialField,
                    props.currentFormula,
                    props.setCurrentFormula,
                    refInputFormula,
                  );
                  // Focus on the input field to help the UX
                  refInputFormula.focus();
                }}
              >{specialField}</button>
            )
          }
        </For>
      </div>
      <div class="is-flex" style={{ width: '32%', 'flex-flow': 'row-reverse', ...styleBadges }}>
        <For each={['POWER()', 'SUBSTRING()', 'CONCAT()']}>
          {
            (func) => (
              <button
                class="tag is-info"
                title={LL().FormulaInput[func as 'POWER()' | 'SUBSTRING()' | 'CONCAT()']()}
                onClick={() => {
                  // Insert the field in the formula
                  insertInFormula(
                    func,
                    props.currentFormula,
                    props.setCurrentFormula,
                    refInputFormula,
                  );
                  // Focus on the input field to help the UX
                  refInputFormula.focus();
                }}
              >{func}</button>
            )
          }
        </For>
        <For each={['*', '+', '-', '/']}>
          {
            (op) => (
              <button
                class="tag is-link"
                title={LL().FormulaInput[op as '*' | '+' | '-' | '/']()}
                onClick={() => {
                  // Insert the field in the formula
                  insertInFormula(
                    op,
                    props.currentFormula,
                    props.setCurrentFormula,
                    refInputFormula,
                  );
                  // Focus on the input field to help the UX
                  refInputFormula.focus();
                }}
              >{op}</button>
            )
          }
        </For>
      </div>
    </div>
    <br/>
    <div class="control" style={{ width: '100%', display: 'inline-block' }}>
      <textarea
        rows={3}
        ref={(el) => {
          refInputFormula = el;
        }}
        class="input"
        style={{ height: 'unset' }}
        value={props.currentFormula()}
        onKeyUp={(e) => {
          const element = e.target as EventTarget & HTMLInputElement;
          props.setCurrentFormula(element.value);
        }}
      />
    </div>
  </div>;
}
