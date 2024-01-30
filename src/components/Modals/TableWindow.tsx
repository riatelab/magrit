// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
  onMount,
  Show,
} from 'solid-js';

// Ag-grid stuffs
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import 'ag-grid-community/styles/ag-grid.css'; // grid core CSS
import 'ag-grid-community/styles/ag-theme-alpine.css'; // optional theme

// Imports from other packages
import alasql from 'alasql';
import { area } from '@turf/turf';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { clickLinkFromDataUrl } from '../../helpers/exports';
import {
  detectTypeField,
  type Variable,
  VariableType,
} from '../../helpers/typeDetection';

// Subcomponents
import InputFieldButton from '../Inputs/InputButton.tsx';

// Stores
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore, tableWindowStore } from '../../store/TableWindowStore';

// Types / Interfaces / Enums
import type { GeoJSONFeature, GeoJSONFeatureCollection, LayerDescription } from '../../global';

// Styles
import '../../styles/TableWindow.css';

function NewFieldPanel(
  props: {
    layer: LayerDescription;
    rowData: () => any[];
    columnDefs: () => any[];
    updateData: (variableName: string, newColumn: any[]) => void;
  },
): JSX.Element {
  const { LL } = useI18nContext();

  // Reference to the input field for the formula
  let refInputFormula: HTMLInputElement;
  // Signals for the new column form
  const [
    newColumnName,
    setNewColumnName,
  ] = createSignal<string>('');
  const [
    newColumnType,
    setNewColumnType,
  ] = createSignal<VariableType>(VariableType.unknown);
  const [
    currentFormula,
    setCurrentFormula,
  ] = createSignal<string>('');
  const [
    sampleOutput,
    setSampleOutput,
  ] = createSignal<string>('');

  // Common style for the badges
  const styleBadges = {
    'column-gap': '0.4em',
    'flex-wrap': 'wrap',
    'font-size': '0.85rem !important',
    'row-gap': '0.4em',
  };

  const isEnabledCompute = createMemo(() => newColumnName() !== ''
    && newColumnType() !== VariableType.unknown
    && currentFormula() !== ''
    && sampleOutput() !== ''
    && !sampleOutput().startsWith('Err'));

  const replaceSpecialFields = (formula: string): string => formula
    .replaceAll(/\$length/gi, props.rowData().length.toString())
    .replaceAll(/\$id/gi, '[@@uuid]')
    .replaceAll(/\$area/gi, '[@@area]');

  const hasSpecialFieldId = (formula: string) => formula.includes('@@uuid');

  const hasSpecialFieldArea = (formula: string) => formula.includes('@@area');

  // Insert a value (chosen from the list of fields / special fields / operator)
  // in the formula at the caret position (taking care of the selection if needed)
  const insertInFormula = (formula: string, value: string) => {
    if (formula === '') {
      setCurrentFormula(`${value} `);
    } else {
      // We need to take care of the caret position
      const caretPosStart = refInputFormula.selectionStart as number;
      const caretPosEnd = refInputFormula.selectionEnd as number;

      // If the user has selected some text, we replace it
      if (caretPosStart !== caretPosEnd) {
        setCurrentFormula(
          `${formula.slice(0, caretPosStart)}${value}${formula.slice(caretPosEnd)}`,
        );
      } else {
        // Otherwise we insert the field at the caret position
        setCurrentFormula(
          `${formula.slice(0, caretPosStart)}${value} ${formula.slice(caretPosStart)}`,
        );
      }
    }
  };

  const computeSampleOutput = () => {
    const formula = replaceSpecialFields(currentFormula());
    const query = `SELECT ${formula} as newValue FROM ?`;
    const data = props.rowData().slice(0, 3);

    if (hasSpecialFieldId(formula)) {
      data.forEach((d, i) => {
        d['@@uuid'] = i; // eslint-disable-line no-param-reassign
      });
    }
    if (hasSpecialFieldArea(formula)) {
      data.forEach((d, i) => {
        d['@@area'] = area(props.layer.data.features[i].geometry); // eslint-disable-line no-param-reassign
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

  const onClickCompute = () => {
    const variableName = newColumnName();
    const formula = replaceSpecialFields(currentFormula());
    const query = `SELECT ${formula} as newValue FROM ?`;
    const data = props.rowData().slice();

    // Add special fields if needed
    if (hasSpecialFieldId(formula)) {
      data.forEach((d, i) => {
        d['@@uuid'] = i; // eslint-disable-line no-param-reassign
      });
    }
    if (hasSpecialFieldArea(formula)) {
      data.forEach((d, i) => {
        d['@@area'] = area(props.layer.data.features[i].geometry); // eslint-disable-line no-param-reassign
      });
    }

    // Compute new column
    const newColumn = alasql(query, [data]);

    // Remove special fields if needed
    if (hasSpecialFieldId(formula)) {
      data.forEach((d) => {
        delete d['@@uuid']; // eslint-disable-line no-param-reassign
      });
    }
    if (hasSpecialFieldArea(formula)) {
      data.forEach((d) => {
        delete d['@@area']; // eslint-disable-line no-param-reassign
      });
    }

    // Update the data
    props.updateData(variableName, newColumn.map((d: { newValue: never }) => d.newValue));
  };

  return <div>
    <h3>{ LL().DataTable.NewColumnModal.title() }</h3>
    <div style={{ display: 'block' }}>
      <div class="field-block">
        <label class="label">{ LL().DataTable.NewColumnModal.name() }</label>
        <div class="control">
          <input
            class="input"
            type="text"
            placeholder={ LL().DataTable.NewColumnModal.namePlaceholder() }
            value={ newColumnName() }
            onChange={ (e) => { setNewColumnName(e.target.value); } }
          />
        </div>
      </div>
      <div class="field-block">
        <label class="label">{ LL().DataTable.NewColumnModal.newColumnType() }</label>
        <div class="select" style={{ width: '100%' }}>
          <select
            style={{ width: '100%' }}
            onChange={ (e) => {
              setNewColumnType(e.target.value as VariableType);
            } }
            value={ newColumnType() }
          >
            <For each={Object.keys(VariableType).toReversed()}>
              {
                (type) => (
                  <option value={ type }>{ LL().FieldsTyping.VariableTypes[type]() }</option>)
              }
            </For>
          </select>
        </div>
      </div>
      <div class="field-block">
        <label class="label">{ LL().DataTable.NewColumnModal.formula() }</label>
        <div class="control is-flex">
          <div class="is-flex" style={{ width: '75%', ...styleBadges }}>
            <For each={props.columnDefs()}>
              {
                (field) => (
                  <span
                    class="tag is-warning is-cursor-pointer"
                    title={
                      /[àâäéèêëîïôöùûüç -]/i.test(field.field)
                        ? `${field.field} - ${LL().DataTable.NewColumnModal.noteSpecialCharacters()}`
                        : field.field
                    }
                    onClick={() => {
                      // If the field name contains spaces or special characters,
                      // we need to put it between brackets
                      let fieldValue = field.field;
                      if (/[àâäéèêëîïôöùûüç -]/i.test(fieldValue)) {
                        fieldValue = `[${fieldValue}]`;
                      }
                      // Insert the field in the formula
                      insertInFormula(currentFormula(), fieldValue);
                      // Focus on the input field to help the UX
                      refInputFormula.focus();
                      // Compute the sample output
                      computeSampleOutput();
                    }}
                  >{ field.field }</span>
                )
              }
            </For>
            <For each={['$Length', '$Area', '$Id']}>
              {
                (specialField) => (
                  <span
                    class="tag is-success is-cursor-pointer"
                    title={ LL().DataTable.NewColumnModal[specialField.replace('$', 'specialField')]() }
                    onClick={() => {
                      // Insert the field in the formula
                      insertInFormula(currentFormula(), specialField);
                      // Focus on the input field to help the UX
                      refInputFormula.focus();
                      // Compute the sample output
                      computeSampleOutput();
                    }}
                  >{ specialField }</span>
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
                    title={ LL().DataTable.NewColumnModal[func]() }
                    onClick={() => {
                      // Insert the field in the formula
                      insertInFormula(currentFormula(), func);
                      // Focus on the input field to help the UX
                      refInputFormula.focus();
                      // Compute the sample output
                      computeSampleOutput();
                    }}
                  >{ func }</span>
                )
              }
            </For>
            <For each={['*', '+', '-', '/']}>
              {
                (op) => (
                  <span
                    class="tag is-link is-cursor-pointer"
                    title={ LL().DataTable.NewColumnModal[op]() }
                    onClick={() => {
                      // Insert the field in the formula
                      insertInFormula(currentFormula(), op);
                      // Focus on the input field to help the UX
                      refInputFormula.focus();
                      // Compute the sample output
                      computeSampleOutput();
                    }}
                  >{ op }</span>
                )
              }
            </For>
          </div>
        </div>
        <br />
        <div class="control" style={{ width: '100%', display: 'inline-block' }}>
          <input
            ref={(el) => { refInputFormula = el; }}
            class="input"
            type="text"
            value={currentFormula()}
            onKeyUp={ (e) => {
              const element = e.target as EventTarget & HTMLInputElement;
              setCurrentFormula(element.value);
              computeSampleOutput();
            }}
            // TODO: add a placeholder
          />
        </div>
        <div class="control" style={{ display: 'flex', height: '7em' }}>
          <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
            <label class="label">{ LL().DataTable.NewColumnModal.sampleOutput() }</label>
          </div>
          <pre
            style={{ display: 'flex', 'align-items': 'center', width: '120%' }}
            classList={{ 'has-text-danger': sampleOutput().startsWith('Error') }}
            id="sample-output"
          >
            { sampleOutput() }
          </pre>
        </div>
      </div>
      <br />
      <InputFieldButton
        label={ LL().DataTable.NewColumnModal.compute() }
        disabled={!isEnabledCompute()}
        onClick={onClickCompute}
      />
    </div>
  </div>;
}

export default function TableWindow(): JSX.Element {
  const { LL } = useI18nContext();
  // Extract layerId and editable from tableWindowStore
  // and find the layer from layersDescriptionStore
  // to get the data (we know that this wont change during the lifetime of the component
  // so we can destructure it)
  const { layerId, editable } = tableWindowStore;
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);

  if (!layer) {
    // This should never happen due to how the table window is opened
    throw new Error(`Layer with id ${layerId} not found`);
  }

  const { name: layerName } = layer;

  // Ref to the ag-grid table
  let agGridRef: AgGridSolidRef;
  // And a ref to its parent element
  let parentGridRef: HTMLDivElement;

  // The data to be displayed
  // (we use a signal because we may add new columns)
  const [
    rowData,
    setRowData,
  ] = createSignal<any[]>((unproxify(layer.data as never) as GeoJSONFeatureCollection)
    .features
    .map((feature: GeoJSONFeature) => feature.properties));

  // The rows we want to display
  const [
    columnDefs,
    setColumnDefs,
  ] = createSignal<any[]>(
    Object.keys(layer.data.features[0].properties)
      .map((key) => ({ field: key, headerName: key })),
  );

  // The new variables that will be added to the layer description
  // when the modal is closed and if the user chooses to save the data
  const newVariables: Variable[] = [];

  // Other option for ag-grid table
  const defaultColDef = {
    editable,
    sortable: true,
  };

  // Whether the data has been edited
  const [
    dataEdited,
    setDataEdited,
  ] = createSignal<boolean>(false);

  // Whether we are displaying the table or the form to add a new column
  const [
    currentPanel,
    setCurrentPanel,
  ] = createSignal<'table' | 'newColumn'>('table');

  // Change the state of the tableWindowStore to close the modal
  const closeModal = () => {
    setTableWindowStore({
      show: false,
      editable: false,
      layerId: '',
    });
  };

  // Function that is called when the user clicks on the confirm button
  // (if the user clicks on the cancel button, the modal
  // is closed directly and the data is not saved).
  const confirmCallback = () => {
    if (!dataEdited()) {
      // If the data has not been edited, just close the table modal now
      closeModal();
    } else {
      // The data has been edited, so we need to ask for confirmation
      const onConfirm = () => {
        // Prepare the new data in case cell values have been changed or new columns have been added
        const newData = {
          type: 'FeatureCollection',
          features: (unproxify(layer.data as never) as GeoJSONFeatureCollection).features
            .map((feature: GeoJSONFeature, i: number) => {
              feature.properties = rowData()[i]; // eslint-disable-line no-param-reassign
              return feature;
            }),
        };

        // Update the description of the layer fields
        setLayersDescriptionStore(
          'layers',
          (l: LayerDescription) => l.id === layerId,
          {
            data: newData,
            fields: layer.fields!.concat(newVariables),
          },
        );

        // Actually close the modal
        closeModal();
      };

      // Open alert that ask for confirmation
      setNiceAlertStore({
        show: true,
        type: 'warning',
        content: (): JSX.Element => <p>{ LL().Alerts.SaveEditedData() }</p>,
        confirmCallback: onConfirm,
        cancelCallback: closeModal,
        focusOn: 'confirm',
      });
    }
  };

  // Function that is called from the NewFieldPanel to update the data...
  const updateData = (variableName: string, newColumn: any[]) => {
    // We need to update the data for the table
    setRowData(
      rowData().map((row, i) => ({
        ...row,
        [variableName]: newColumn[i],
      })),
    );

    // Update the column definitions
    setColumnDefs(
      columnDefs().concat({ field: variableName, headerName: variableName }),
    );

    // Remember that the data has been edited (to ask for confirmation when closing the modal)
    setDataEdited(true);

    // Detect the type of the new variable
    const t = detectTypeField(newColumn as never[], variableName);

    // Add the new variable to the list of new variables
    // (will be used to update the layer description)
    newVariables.push({
      name: variableName,
      hasMissingValues: t.hasMissingValues,
      type: t.variableType,
      dataType: t.dataType,
    } as Variable);

    // Go back to the table panel
    setCurrentPanel('table');

    // Wait for the table to be rendered
    setTimeout(() => {
      // Scroll to the new column
      agGridRef.api.ensureColumnVisible(variableName);

      // Highlight the new column for a few seconds
      const headerAndCells = document.querySelectorAll(`[col-id="${variableName}"]`);
      headerAndCells.forEach((d) => {
        d.classList.add('ag-new-cell-highlight');
        setTimeout(() => {
          d.classList.remove('ag-new-cell-highlight');
        }, 750);
      });
    }, 50);
  };

  // Function that is called when the user clicks the "export csv" button
  const csvExport = async () => {
    const csvStr = d3.csvFormat(rowData());
    await clickLinkFromDataUrl(
      `data:text/plan;charset=utf-8,${encodeURIComponent(csvStr)}`,
      `${layerName}.csv`,
    );
  };

  const triggerContextMenu = (
    e: MouseEvent,
    colId: string,
  ): void => {
    setContextMenuStore({
      show: true,
      position: [e.clientX, e.clientY],
      entries: [
        {
          label: LL().DataTable.DeleteColumn(),
          callback: () => {
            // Delete the column from the columnDefs
            setColumnDefs(columnDefs().filter((d) => d.field !== colId));
            // Delete the column from the rowData
            setRowData(
              rowData().map((row) => {
                const newRow = { ...row };
                delete newRow[colId];
                return newRow;
              }),
            );
            setDataEdited(true);
          },
        },
      ],
    });
  };

  onMount(() => {
    // Let some time for the table to be rendered
    setTimeout(() => {
      // Add a context menu on the headers of the table
      // to propose to remove a column.
      // We need to add the listener on the parent of the header cells because
      // all the header cells aren't rendered (only the visible ones).
      parentGridRef.querySelector('.ag-header-container')
        ?.addEventListener('contextmenu', (e) => {
          const target = e.target as HTMLElement;
          if (
            !target.classList.contains('ag-header-cell-label')
            && !target.classList.contains('ag-header-cell-text')
          ) {
            // The user clicked on the header container but not on a header cell
            // (maybe on a resize handle for example).
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          // Go up in the DOM to find the column id
          let elem = target;
          while (!elem.classList.contains('ag-header-cell')) {
            elem = elem.parentElement!;
          }
          const colId = elem.getAttribute('col-id')!;
          triggerContextMenu(e as MouseEvent, colId);
        });
    }, 125);
  });
  return <div class="table-window modal" style={{ display: 'flex' }}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().DataTable.titleGeo() }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body" style={{ height: '80vh' }}>
        {/*
          Table panel
        */}
        <Show when={ currentPanel() === 'table' }>
          <h3>
            { layerName }
            &nbsp;- { LL().DataTable.Features(rowData().length) }
            &nbsp;- { LL().DataTable.Columns(columnDefs().length) }
          </h3>
          <div ref={ parentGridRef! } class="ag-theme-alpine" style={{ height: '70vh' }}>
            <AgGridSolid
              ref={ agGridRef! }
              rowData={ rowData() }
              columnDefs={ columnDefs() }
              defaultColDef={ defaultColDef }
              onCellValueChanged={ () => { setDataEdited(true); } }
            />
          </div>
        </Show>
        {/*
          New column panel
        */}
        <Show when={ currentPanel() === 'newColumn' }>
          <NewFieldPanel
            layer={ layer }
            rowData={ rowData }
            columnDefs={ columnDefs }
            updateData={ updateData }
          />
        </Show>
      </section>
      <footer class="modal-card-foot">
        <div>
          <Show when={ currentPanel() === 'table' }>
            <button
              class="button is-primary"
              onClick={ csvExport }
            >
              { LL().DataTable.ExportCsv() }
            </button>
            <button
              class="button is-primary"
              onClick={ () => setCurrentPanel('newColumn') }
            >
              { LL().DataTable.NewColumn() }
            </button>
          </Show>
          <Show when={ currentPanel() === 'newColumn' }>
            <button
              class="button is-primary"
              onClick={ () => setCurrentPanel('table') }
            >
              { LL().DataTable.NewColumnModal.BackToDatatable() }
            </button>
          </Show>
        </div>
        <div>
          <button
            class="button is-success"
            onClick={ () => { confirmCallback(); } }
          >{ LL().SuccessButton() }</button>
          <button
            class="button"
            onClick={ () => { closeModal(); } }
          >{ LL().CancelButton() }</button>
        </div>
      </footer>
    </div>
  </div>;
}
