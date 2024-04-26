// Import from solid-js
import {
  Accessor,
  createMemo,
  createSignal,
  For,
  JSX, onCleanup,
  onMount,
  Show,
} from 'solid-js';

// Ag-grid stuffs
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import 'ag-grid-community/styles/ag-grid.min.css'; // grid core CSS
import 'ag-grid-community/styles/ag-theme-quartz.min.css'; // theme

// Imports from other packages
import alasql from 'alasql';
import { type AllGeoJSON, area } from '@turf/turf';
import type { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { isDarkMode } from '../../helpers/darkmode';
import { clickLinkFromDataUrl } from '../../helpers/exports';
import {
  detectTypeField,
  type Variable,
  VariableType,
} from '../../helpers/typeDetection';

// Subcomponents
import InputFieldButton from '../Inputs/InputButton.tsx';
import FormulaInput, {
  formatValidSampleOutput,
  hasSpecialFieldArea,
  hasSpecialFieldId,
  replaceSpecialFields,
  type SampleOutputFormat,
} from '../FormulaInput.tsx';

// Stores
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { resetTableWindowStore, tableWindowStore } from '../../store/TableWindowStore';

// Types / Interfaces / Enums
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  LayerDescription,
  TableDescription,
} from '../../global';

// Styles
import '../../styles/TableWindow.css';

function formatSampleOutput(
  s: SampleOutputFormat | undefined,
  LL: Accessor<TranslationFunctions>,
): string | LocalizedString {
  if (!s) return '';
  if (s.type === 'Error') {
    return LL().FormulaInput[`Error${s.value as 'ParsingFormula' | 'EmptyResult'}`]();
  }
  return formatValidSampleOutput(s.value);
}

function NewFieldPanel(
  props: {
    typeDs: 'layer' | 'table';
    dsDescription: LayerDescription | TableDescription;
    rowData: () => any[];
    columnDefs: () => any[];
    updateData: (variableName: string, newColumn: any[], newColumnType: VariableType) => void;
  },
): JSX.Element {
  const { LL } = useI18nContext();

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
  ] = createSignal<SampleOutputFormat | undefined>(undefined);

  const isEnabledCompute = createMemo(() => newColumnName() !== ''
    && newColumnType() !== VariableType.unknown
    && currentFormula() !== ''
    && sampleOutput() !== undefined
    && sampleOutput()!.value !== ''
    && sampleOutput()!.type !== 'Error');

  const onClickCompute = () => {
    const variableName = newColumnName();
    const lengthDataset = props.rowData().length;
    const formula = replaceSpecialFields(currentFormula(), lengthDataset);
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
        // eslint-disable-next-line no-param-reassign
        d['@@area'] = area(
          (props.dsDescription as LayerDescription).data.features[i].geometry as AllGeoJSON,
        );
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
    props.updateData(
      variableName,
      newColumn.map((d: { newValue: never }) => d.newValue),
      newColumnType(),
    );
  };

  return <div>
    <h3>{ LL().DataTable.NewColumnModal.title() }</h3>
    <div style={{ display: 'block' }}>
      <div class="field-block">
        <label class="label">{LL().DataTable.NewColumnModal.name()}</label>
        <div class="control">
          <input
            class="input"
            type="text"
            placeholder={LL().DataTable.NewColumnModal.namePlaceholder()}
            value={newColumnName()}
            onChange={(e) => {
              setNewColumnName(e.target.value);
            }}
          />
        </div>
      </div>
      <div class="field-block">
        <label class="label">{LL().DataTable.NewColumnModal.newColumnType()}</label>
        <div class="select" style={{ width: '100%' }}>
          <select
            style={{ width: '100%' }}
            onChange={(e) => {
              setNewColumnType(e.target.value as VariableType);
            }}
            value={newColumnType()}
          >
            <For each={Object.keys(VariableType).toReversed()}>
              {
                (type) => (
                  <option value={type}>
                    {LL().FieldsTyping.VariableTypes[type as keyof typeof VariableType]()}
                  </option>)
              }
            </For>
          </select>
        </div>
      </div>
      <FormulaInput
        typeDataset={props.typeDs}
        dsDescription={props.dsDescription}
        currentFormula={currentFormula}
        setCurrentFormula={setCurrentFormula}
        sampleOutput={sampleOutput}
        setSampleOutput={setSampleOutput}
      />
      <div class="control" style={{ display: 'flex', height: '7em' }}>
        <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
          <label class="label">{LL().FormulaInput.sampleOutput()}</label>
        </div>
        <pre
          style={{ display: 'flex', 'align-items': 'center', width: '120%' }}
          classList={{ 'has-text-danger': sampleOutput() && sampleOutput()!.type === 'Error' }}
          id="sample-output"
        >
            {formatSampleOutput(sampleOutput(), LL)}
          </pre>
      </div>
      <br/>
      <InputFieldButton
        label={LL().DataTable.NewColumnModal.compute()}
        disabled={!isEnabledCompute()}
        onClick={onClickCompute}
      />
    </div>
  </div>;
}

interface DataHandlerFunctions {
  extractRows: (data: any) => any[];
  getColumnDefs: (data: any) => any[];
  updateReferenceData: (
    dsDescription: LayerDescription | TableDescription,
    newVariables: Variable[],
    rowData: Accessor<any[]>,
  ) => void;
}

const getHandlerFunctions = (type: 'layer' | 'table'): DataHandlerFunctions => {
  const res: Partial<DataHandlerFunctions> = {};

  // A function to extract the rows from the data
  if (type === 'layer') {
    res.extractRows = (data) => (unproxify(data as never) as GeoJSONFeatureCollection)
      .features
      .map((feature: GeoJSONFeature) => feature.properties);
  } else {
    res.extractRows = (data) => unproxify(data as never) as any[];
  }

  // A function to extract the columns from the data
  if (type === 'layer') {
    res.getColumnDefs = (data) => Object.keys(data.features[0].properties)
      .map((key) => ({ field: key, headerName: key, maxWidth: 300 }));
  } else {
    res.getColumnDefs = (data) => Object.keys(data[0])
      .map((key) => ({ field: key, headerName: key, maxWidth: 300 }));
  }

  // A function to update the data
  if (type === 'layer') {
    res.updateReferenceData = (dsDescription, newVariables, rowData) => {
      // Prepare the new data in case cell values have been
      // changed or new columns have been added/deleted
      const newData = {
        type: 'FeatureCollection',
        features: (unproxify(dsDescription.data as never) as GeoJSONFeatureCollection).features
          .map((feature: GeoJSONFeature, i: number) => {
            feature.properties = rowData()[i]; // eslint-disable-line no-param-reassign
            return feature;
          }),
      };

      // Compute the new fields names
      const newFieldsName = Object.keys(rowData()[0]);

      // If fields have been removed, we need to remove them from the layer description
      const fieldsToRemove = dsDescription.fields
        .filter((f) => !newFieldsName.includes(f.name));

      // Update the description of the layer fields
      setLayersDescriptionStore(
        'layers',
        (l: LayerDescription) => l.id === dsDescription.id,
        {
          data: newData,
          fields: dsDescription.fields
            .concat(newVariables)
            .filter((v) => !fieldsToRemove.includes(v)),
        },
      );
    };
  } else {
    res.updateReferenceData = (dsDescription, newVariables, rowData) => {
      // Prepare the new data in case cell values have been
      // changed or new columns have been added/deleted
      const newData = (unproxify(dsDescription.data as never) as any[])
        .map((feature, i) => rowData()[i]);

      // Compute the new fields names
      const newFieldsName = Object.keys(rowData()[0]);

      // If fields have been removed, we need to remove them from the layer description
      const fieldsToRemove = dsDescription.fields
        .filter((f) => !newFieldsName.includes(f.name));

      // Update the description of the layer fields
      setLayersDescriptionStore(
        'tables',
        (t: TableDescription) => t.id === dsDescription.id,
        {
          data: newData,
          fields: dsDescription.fields
            .concat(newVariables)
            .filter((v) => !fieldsToRemove.includes(v)),
        },
      );
    };
  }

  return res as DataHandlerFunctions;
};

export default function TableWindow(): JSX.Element {
  const { LL } = useI18nContext();
  // Extract identifier and editable value from tableWindowStore
  // and find the layer from layersDescriptionStore
  // to get the data (we know that this wont change during the lifetime of the component
  // so we can destructure it)
  const { identifier, editable } = tableWindowStore;

  const dsDescription = identifier!.type === 'layer'
    ? layersDescriptionStore.layers.find((l) => l.id === identifier!.id)
    : layersDescriptionStore.tables.find((l) => l.id === identifier!.id);

  if (!dsDescription) {
    // This should never happen due to how the table window is opened
    throw new Error(`Layer with id ${dsDescription} not found`);
  }

  const {
    extractRows,
    getColumnDefs,
    updateReferenceData,
  } = getHandlerFunctions(identifier!.type);

  const { name: dsName } = dsDescription;

  // Ref to the ag-grid table
  let agGridRef: AgGridSolidRef;
  // And a ref to its parent element
  let parentGridRef: HTMLDivElement;
  // Ref to the parent node of the modal
  let refParentNode: HTMLDivElement;

  // The data to be displayed
  // (we use a signal because we may add new columns)
  const [
    rowData,
    setRowData,
  ] = createSignal<any[]>(extractRows(dsDescription.data));

  // The rows we want to display
  const [
    columnDefs,
    setColumnDefs,
  ] = createSignal<any[]>(getColumnDefs(dsDescription.data));

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
  const closeModal = () => resetTableWindowStore();

  // Function that is called when the user clicks on the confirm button
  // (if the user clicks on the cancel button, the modal
  // is closed directly, and the data is not saved).
  const confirmCallback = () => {
    if (!dataEdited()) {
      // If the data has not been edited, just close the table modal now
      closeModal();
    } else {
      // The data has been edited, so we need to ask for confirmation
      const onConfirm = () => {
        // Update the layer / table description
        // in the layersDescriptionStore
        updateReferenceData(dsDescription, newVariables, rowData);
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
  const updateData = (
    variableName: string,
    newColumn: any[],
    newColumnType: VariableType,
  ) => {
    // We need to update the data for the table
    setRowData(
      rowData().map((row, i) => ({
        ...row,
        [variableName]: newColumn[i],
      })),
    );

    // Update the column definitions
    setColumnDefs(
      columnDefs().concat({ field: variableName, headerName: variableName })
        .map((colDef) => ({ ...colDef, maxWidth: 300 })),
    );

    // Remember that the data has been edited (to ask for confirmation when closing the modal)
    setDataEdited(true);

    // Detect the type of the new variable and count the number of missing values
    const t = detectTypeField(newColumn as never[], variableName);

    // Add the new variable to the list of new variables
    // (will be used to update the layer description)
    newVariables.push({
      name: variableName,
      hasMissingValues: t.hasMissingValues,
      // TODO: check 'newColumnType' it is compatible with the content
      //  of the new column (and if not, use the one detected and stored in 't.variableType')
      type: newColumnType,
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
      `${dsName}.csv`,
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

  const listenerEscapeKey = (event: KeyboardEvent) => {
    const isEscape = event.key
      ? (event.key === 'Escape' || event.key === 'Esc')
      : (event.keyCode === 27);
    if (!isEscape) return;
    if (currentPanel() === 'newColumn') {
      setCurrentPanel('table');
    } else {
      (refParentNode.querySelector('.cancel-button') as HTMLElement).click();
    }
  };

  const listenerContextMenuHeader = (e: Event) => {
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
  };

  onMount(() => {
    // Bind the escape key to the cancel button
    document.addEventListener('keydown', listenerEscapeKey);
  });

  onCleanup(() => {
    // Unbind the escape key
    document.removeEventListener('keydown', listenerEscapeKey);
  });

  return <div
    class="table-window modal"
    style={{ display: 'flex' }}
    aria-modal="true"
    role="dialog"
    ref={refParentNode!}
  >
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
            { dsName }
            &nbsp;- { LL().DataTable.Features(rowData().length) }
            &nbsp;- { LL().DataTable.Columns(columnDefs().length) }
          </h3>
          <div
            ref={ parentGridRef! }
            class={ isDarkMode() ? 'ag-theme-quartz-dark' : 'ag-theme-quartz' }
            style={{ height: '70vh' }}
          >
            <AgGridSolid
              ref={ agGridRef! }
              rowData={ rowData() }
              columnDefs={ columnDefs() }
              defaultColDef={ defaultColDef }
              onCellValueChanged={ () => { setDataEdited(true); } }
              suppressDragLeaveHidesColumns={ true }
              suppressColumnMoveAnimation={ true }
              autoSizeStrategy={{ type: 'fitCellContents' }}
              onGridPreDestroyed={() => {
                // Unbind the context menu listener on the header cells
                parentGridRef.querySelector('.ag-header-container')!
                  .removeEventListener('contextmenu', listenerContextMenuHeader);
              }}
              onGridReady={() => {
                setTimeout(() => {
                  // The idea is that the grid is rendered with the 'fitCellContents' strategy
                  // so that width of each column fits its contents, but with a maximum width
                  // of 300px (we defined that in the columnDefs at the beginning / when
                  // updating the data when a new column is added).
                  // Then, when the grid is rendered, we remove the maxWidth property
                  // so users can resize the columns as they want, with no maximum width.
                  setColumnDefs(columnDefs().map((colDef) => {
                    const newColDef = { ...colDef };
                    delete newColDef.maxWidth;
                    return newColDef;
                  }));

                  // Add a context menu on the headers of the table to propose to remove a column.
                  // We need to add the listener on the parent of the header cells because
                  // all the header cells aren't rendered (only the visible ones).
                  parentGridRef.querySelector('.ag-header-container')!
                    .addEventListener('contextmenu', listenerContextMenuHeader);
                }, 15);
              }}
            />
          </div>
        </Show>
        {/*
          New column panel
        */}
        <Show when={ currentPanel() === 'newColumn' }>
          <NewFieldPanel
            dsDescription={ dsDescription }
            typeDs={ identifier!.type }
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
        <Show when={ currentPanel() === 'table' }>
          <div>
            <button
              class="button is-success"
              onClick={ () => { confirmCallback(); } }
            >{ LL().SuccessButton() }</button>
            <button
              class="button cancel-button"
              onClick={ () => { closeModal(); } }
            >{ LL().CancelButton() }</button>
          </div>
        </Show>
      </footer>
    </div>
  </div>;
}
