// Imports from solid-js
import {
  Accessor, createEffect,
  createSignal,
  For,
  JSX,
  on,
  Setter,
} from 'solid-js';

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

export default function FormulaInput(
  props: {
    typeDataset: 'layer' | 'table',
    dsDescription: LayerDescription | TableDescription,
    currentFormula: Accessor<string>,
    setCurrentFormula: Setter<string>,
  },
): JSX.Element {
  let refInputFormula: HTMLTextAreaElement;
  const { LL } = useI18nContext();

  const records = props.typeDataset === 'layer'
    ? (props.dsDescription as LayerDescription).data.features.map((d) => d.properties)
    : (props.dsDescription as TableDescription).data;

  const lengthDataset = records.length;

  const styleBadges = {
    'column-gap': '0.4em',
    'flex-wrap': 'wrap',
    'font-size': '0.85rem !important',
    'row-gap': '0.4em',
  };

  const specialFields = {
    layer: ['$length', '$id', '$area'],
    table: ['$length', '$id'],
  };

  const [
    sampleOutput,
    setSampleOutput,
  ] = createSignal<string>('');

  const hasSpecialFieldId = (formula: string) => formula.includes('@@uuid');

  const hasSpecialFieldArea = (formula: string) => formula.includes('@@area');

  const replaceSpecialFields = (formula: string): string => formula
    .replaceAll(/\$length/gi, lengthDataset.toString())
    .replaceAll(/\$id/gi, '[@@uuid]')
    .replaceAll(/\$area/gi, '[@@area]');

  const computeSampleOutput = () => {
    const formula = replaceSpecialFields(props.currentFormula());
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
        d['@@area'] = area((props.dsDescription as LayerDescription).data.features[i].geometry);
      });
    }

    try {
      const newColumn = alasql(query, [data]);
      if (newColumn[0].newValue === undefined) {
        setSampleOutput(LL().DataTable.NewColumnModal.errorEmptyResult());
        // TODO: we may try to parse the query here (as it is syntactically correct
        //   since no error was thrown by alasql)
        //   and detect why the output is empty (e.g. a column name is wrong, etc.)
      } else {
        setSampleOutput(
          `[0] ${newColumn[0].newValue}\n[1] ${newColumn[1].newValue}\n[2] ${newColumn[2].newValue}`,
        );
      }
    } catch (e) {
      setSampleOutput(LL().DataTable.NewColumnModal.errorParsingFormula());
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
    <label class="label">{LL().DataTable.NewColumnModal.formula()}</label>
    <div class="control is-flex">
      <div class="is-flex" style={{ width: '75%', ...styleBadges }}>
        <For each={props.dsDescription.fields.map((d) => d.name)}>
          {
            (field) => (
              <span
                class="tag is-warning is-cursor-pointer"
                title={
                  /[àâäéèêëîïôöùûüç -]/i.test(field)
                    ? `${field} - ${LL().DataTable.NewColumnModal.noteSpecialCharacters()}`
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
                title={LL().DataTable.NewColumnModal[specialField.replace('$', 'specialField')]()}
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
                title={LL().DataTable.NewColumnModal[func]()}
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
                title={LL().DataTable.NewColumnModal[op]()}
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
    <div class="control" style={{ display: 'flex', height: '7em' }}>
      <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
        <label class="label">{LL().DataTable.NewColumnModal.sampleOutput()}</label>
      </div>
      <pre
        style={{ display: 'flex', 'align-items': 'center', width: '120%' }}
        classList={{ 'has-text-danger': sampleOutput().startsWith('Error') }}
        id="sample-output"
      >
        {sampleOutput()}
      </pre>
    </div>
  </div>;
}
