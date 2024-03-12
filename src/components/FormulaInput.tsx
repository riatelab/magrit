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

// Imports from other packages
import { area } from '@turf/turf';
import alasql from 'alasql';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { LayerDescription, TableDescription } from '../global';

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
  layer: ['$length', '$id', '$area'],
  table: ['$length', '$id'],
};

export const hasSpecialFieldId = (formula: string) => formula.includes('@@uuid');

export const hasSpecialFieldArea = (formula: string) => formula.includes('@@area');

export const replaceSpecialFields = (formula: string, lengthDataset: number): string => formula
  .replaceAll(/\$length/gi, lengthDataset.toString())
  .replaceAll(/\$id/gi, '[@@uuid]')
  .replaceAll(/\$area/gi, '[@@area]');

export const formatValidSampleOutput = (
  value: { [key: number]: number | string | boolean },
): string => {
  const strArray = [];
  for (let i = 0; i < 3; i += 1) {
    if (value[i] !== undefined) {
      strArray.push(`[${i}] ${value[i]}`);
    }
  }
  return strArray.join('\n');
};

export default function FormulaInput(
  props: {
    typeDataset: 'layer' | 'table',
    dsDescription: LayerDescription | TableDescription,
    currentFormula: Accessor<string>,
    setCurrentFormula: Setter<string>,
    sampleOutput: Accessor<SampleOutputFormat | undefined>,
    setSampleOutput: Setter<SampleOutputFormat | undefined>,
  },
): JSX.Element {
  let refInputFormula: HTMLTextAreaElement;
  const { LL } = useI18nContext();

  const records = props.typeDataset === 'layer'
    ? (props.dsDescription as LayerDescription).data.features.map((d) => unwrap(d.properties))
    : (props.dsDescription as TableDescription).data.map((d) => unwrap(d));

  const lengthDataset = records.length;

  const styleBadges = {
    'column-gap': '0.4em',
    'flex-wrap': 'wrap',
    'font-size': '0.85rem !important',
    'row-gap': '0.4em',
  };

  const computeSampleOutput = () => {
    const formula = replaceSpecialFields(props.currentFormula(), lengthDataset);
    const query = `SELECT ${formula} as newValue FROM ?`;
    const data = records.slice(0, 3);

    if (hasSpecialFieldId(formula)) {
      data.forEach((d, i) => {
        d['@@uuid'] = i; // eslint-disable-line no-param-reassign
      });
    }
    if (hasSpecialFieldArea(formula)) {
      data.forEach((d, i) => {
        // eslint-disable-next-line no-param-reassign
        d['@@area'] = area((props.dsDescription as LayerDescription).data.features[i].geometry as never);
      });
    }

    try {
      const newColumn = alasql(query, [data]);
      if (newColumn[0].newValue === undefined) {
        props.setSampleOutput({ type: 'Error', value: 'EmptyResult' });
        // TODO: we may try to parse the query here (as it is syntactically correct
        //   since no error was thrown by alasql)
        //   and detect why the output is empty (e.g. a column name is wrong, etc.)
      } else {
        const resultObj: { [key: number]: number | string | boolean } = {};
        for (let i = 0; i < 3; i += 1) {
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
      <div class="is-flex" style={{ width: '75%', ...styleBadges }}>
        <For each={props.dsDescription.fields.map((d) => d.name)}>
          {
            (field) => (
              <span
                class="tag is-warning is-cursor-pointer"
                title={
                  /[àâäéèêëîïôöùûüç -]/i.test(field)
                    ? `${field} - ${LL().FormulaInput.noteSpecialCharacters()}`
                    : field
                }
                onClick={() => {
                  // If the field name contains spaces or special characters,
                  // we need to put it between brackets
                  let fieldValue = field;
                  if (/[àâäéèêëîïôöùûüç -]/i.test(fieldValue)) {
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
              >{field}</span>
            )
          }
        </For>
        <For each={specialFields[props.typeDataset]}>
          {
            (specialField) => (
              <span
                class="tag is-success is-cursor-pointer"
                title={LL().FormulaInput[specialField.replace('$', 'specialField')]()}
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
              >{specialField}</span>
            )
          }
        </For>
      </div>
      <div class="is-flex" style={{ width: '25%', 'flex-flow': 'row-reverse', ...styleBadges }}>
        <For each={['POWER()', 'SUBSTRING()', 'CONCAT()']}>
          {
            (func) => (
              <span
                class="tag is-info is-cursor-pointer"
                title={LL().FormulaInput[func]()}
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
              >{func}</span>
            )
          }
        </For>
        <For each={['*', '+', '-', '/']}>
          {
            (op) => (
              <span
                class="tag is-link is-cursor-pointer"
                title={LL().FormulaInput[op]()}
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
              >{op}</span>
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
