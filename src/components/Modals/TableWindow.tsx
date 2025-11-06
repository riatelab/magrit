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

// Other libraries
import { getColors } from 'dicopal';

// GeoJSON types
import type { Feature, FeatureCollection } from 'geojson';

// Ag-grid stuffs
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import 'ag-grid-community/styles/ag-grid.min.css'; // grid core CSS
import 'ag-grid-community/styles/ag-theme-quartz.min.css'; // theme

// Imports from other packages
import { type AllGeoJSON, area } from '@turf/turf';
import type { LocalizedString } from 'typesafe-i18n';
import toast from 'solid-toast';
import alasql from '../../helpers/alasql';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { replaceNullByUndefined, sanitizeColumnName, unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { isDarkMode } from '../../helpers/darkmode';
import { clickLinkFromBlob } from '../../helpers/exports';
import {
  type DataType,
  detectTypeField,
  type Variable,
  VariableType,
} from '../../helpers/typeDetection';
import { makeCategoriesMap } from '../../helpers/categorical';
import sanitizeSVG from '../../helpers/sanitize-svg';
import images from '../../helpers/symbol-library';
import { Mfloor, Mrandom } from '../../helpers/math';

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
import {
  type CategoricalChoroplethParameters,
  type CategoricalPictogramParameters,
  ImageType,
  type LayerDescription,
  type TableDescription,
} from '../../global.d';

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

const addMaxWidthAttr = (columnDefs: any[]): any[] => {
  for (let i = 0; i < columnDefs.length; i += 1) {
    // eslint-disable-next-line no-param-reassign
    columnDefs[i].maxWidth = 300;
  }
  return columnDefs;
};

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
    const variableName = sanitizeColumnName(newColumnName());
    const lengthDataset = props.rowData().length;
    const formula = replaceSpecialFields(currentFormula(), lengthDataset);
    const query = `SELECT ${formula} as newValue FROM ?`;
    const data = replaceNullByUndefined(props.rowData().slice());

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
    const newColumn: ({ newValue: any }[]) = alasql(query, [data]);

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

    // Remove positive / negative infinity values and NaN
    newColumn.forEach((d) => {
      if (
        d.newValue === Infinity || d.newValue === -Infinity
        || Number.isNaN(d.newValue) || d.newValue === undefined
      ) {
        d.newValue = null; // eslint-disable-line no-param-reassign
      }
    });

    // Update the data
    props.updateData(
      variableName,
      newColumn.map((d) => d.newValue),
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
          <p class="message is-danger">&nbsp;{LL().DataTable.NewColumnModal.notAcceptedChars()}</p>
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
        records={props.rowData()}
        geometries={
          props.typeDs === 'layer'
            ? (props.dsDescription as LayerDescription).data.features.map((d) => d.geometry)
            : undefined
        }
        currentFormula={currentFormula}
        setCurrentFormula={setCurrentFormula}
        sampleOutput={sampleOutput}
        setSampleOutput={setSampleOutput}
      />
      <div class="control" style={{ display: 'flex', height: '12em' }}>
        <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
          <label class="label">{LL().FormulaInput.sampleOutput()}</label>
        </div>
        <pre
          style={{
            display: 'flex', 'align-items': 'center', width: '120%', 'font-size': '0.75em',
          }}
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
  getColumnDefs: (data: any, fieldDescriptions: Variable[]) => any[];
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
    res.extractRows = (data) => (unproxify(data as never) as FeatureCollection)
      .features
      .map((feature: Feature) => feature.properties);
  } else {
    res.extractRows = (data) => unproxify(data as never) as any[];
  }

  // A function to extract the columns from the data
  if (type === 'layer') {
    res.getColumnDefs = (data, fieldDescriptions) => Object.keys(data.features[0].properties)
      .map((key) => {
        const fd = fieldDescriptions.find((f) => f.name === key);
        if (!fd) {
          console.log(`Missing field description for field: ${key}`);
        }
        const o: Record<string, unknown> = { field: key, headerName: key };
        if (fd && fd.dataType === 'number') {
          o.type = 'numericColumn';
          o.cellEditor = 'agNumberCellEditor';
        }
        return o;
      });
  } else {
    res.getColumnDefs = (data, fieldDescriptions) => Object.keys(data[0])
      .map((key) => {
        const fd = fieldDescriptions.find((f) => f.name === key);
        if (!fd) {
          console.log(`Missing field description for field: ${key}`);
        }
        const o: Record<string, unknown> = { field: key, headerName: key };
        if (fd && fd.dataType === 'number') {
          o.type = 'numericColumn';
          o.cellEditor = 'agNumberCellEditor';
        }
        return o;
      });
  }

  // A function to update the data
  if (type === 'layer') {
    res.updateReferenceData = (dsDescription, newVariables, rowData) => {
      // Prepare the new data in case cell values have been
      // changed or new columns have been added/deleted
      const newData = {
        type: 'FeatureCollection',
        features: (unproxify(dsDescription.data as never) as FeatureCollection).features
          .map((feature: Feature, i: number) => {
            feature.properties = rowData()[i]; // eslint-disable-line no-param-reassign
            return feature;
          }),
      };

      // Compute the new fields names
      const newFieldsName = Object.keys(rowData()[0]);

      // If fields have been removed, we need to remove them from the layer description
      const fieldsToRemove = dsDescription.fields
        .filter((f) => !newFieldsName.includes(f.name));

      // Prepare the new fields description
      const newFields = dsDescription.fields
        .map((f) => {
          // If a cell value has been changed, we may need to update the field description
          // (for example if the user has changed has removed the only string value in a column
          // of numbers, we need to update the field description to set the dataType to 'number')
          if (newFieldsName.includes(f.name)) {
            const values = newData.features.map((d) => d.properties![f.name]);
            const t = detectTypeField(values as never[], f.name);
            return { ...f, hasMissingValues: t.hasMissingValues, dataType: t.dataType };
          }
          return f;
        })
        .concat(newVariables)
        .filter((v) => !fieldsToRemove.includes(v));

      // Update the description of the layer fields
      setLayersDescriptionStore(
        'layers',
        (l: LayerDescription) => l.id === dsDescription.id,
        {
          data: newData,
          fields: newFields,
        },
      );

      // If the layer type is categoricalChoropleth or categoricalPictogram,
      // we may need to update the CategoricalChoroplethMapping or
      // the CategoricalPictogramMapping because the number of features by category
      // may have changed (if the user has edited values in the variable used
      // for the categorization)
      const layer = layersDescriptionStore.layers.find((l) => l.id === dsDescription.id)!;
      if (layer.representationType === 'categoricalChoropleth' || layer.representationType === 'categoricalPictogram') {
        const rendererParams = layer.rendererParameters as (
          CategoricalChoroplethParameters | CategoricalPictogramParameters);
        const v = rendererParams.variable;

        // Count the number of features by category
        const catMap = makeCategoriesMap(newData.features, v);

        // Update the count property of each category in the mapping
        const newMapping = rendererParams
          .mapping
          .map((category) => ({
            ...category,
            count: catMap.get(category.value) || 0,
          }));

        // Do we also have new categories to add to the mapping?
        const existingCategories = new Set(
          rendererParams.mapping.map((category) => category.value),
        );
        Array.from(catMap.keys())
          .forEach((categoryValue) => {
            if (!existingCategories.has(categoryValue)) {
              if (layer.representationType === 'categoricalChoropleth') {
                // Add a new category with a default color
                newMapping.push({
                  value: categoryValue,
                  categoryName: categoryValue !== null ? String(categoryValue) : null,
                  color: categoryValue !== null ? getColors('Tableau', 20)![Mfloor(Mrandom() * 20)] : '',
                  count: catMap.get(categoryValue) || 0,
                  show: true,
                });
              } else {
                // Add a new category with a default symbol
                newMapping.push({
                  value: categoryValue,
                  categoryName: categoryValue !== null ? String(categoryValue) : null,
                  count: catMap.get(categoryValue) || 0,
                  iconType: 'SVG' as ImageType,
                  iconContent: sanitizeSVG(images[Mfloor(Mrandom() * images.length)]),
                  iconDimension: [50, 50],
                  show: true,
                });
              }
            }
          });

        // Do we also need to remove categories from the mapping?
        const dataCategories = new Set(Array.from(catMap.keys()));
        const finalMapping = newMapping.filter((category) => dataCategories.has(category.value));

        // Update the layer description store
        setLayersDescriptionStore(
          'layers',
          (l: LayerDescription) => l.id === dsDescription.id,
          'rendererParameters',
          'mapping',
          finalMapping,
        );
      }
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

      // Prepare the new fields description
      const newFields = dsDescription.fields
        .map((f) => {
          // If a cell value has been changed, we may need to update the field description
          // (for example if the user has changed has removed the only string value in a column
          // of numbers, we need to update the field description to set the dataType to 'number')
          if (newFieldsName.includes(f.name)) {
            const values = newData.map((d) => d[f.name]);
            const t = detectTypeField(values as never[], f.name);
            return { ...f, hasMissingValues: t.hasMissingValues, dataType: t.dataType };
          }
          return f;
        })
        .concat(newVariables)
        .filter((v) => !fieldsToRemove.includes(v));

      // Update the description of the layer fields
      setLayersDescriptionStore(
        'tables',
        (t: TableDescription) => t.id === dsDescription.id,
        {
          data: newData,
          fields: newFields,
        },
      );
    };
  }

  return res as DataHandlerFunctions;
};

/**
 * Check that the variable type is compatible with the content of the column.
 * If not, use the detected type.
 *
 */
const checkVariableType = (
  values: any[],
  dataType: DataType,
  detectedType: VariableType,
  userType: VariableType,
): boolean => {
  if (userType === VariableType.unknown) {
    return true;
  }
  if (userType === detectedType) {
    return true;
  }
  if (userType === VariableType.stock) {
    return dataType === 'number';
  }
  const filteredValues = values.filter((v) => v !== null && v !== '' && v !== undefined);
  const dedupValues = new Set(filteredValues);
  if (userType === VariableType.ratio) {
    if (dataType !== 'number') {
      return false;
    }
    return dedupValues.size !== 1;
  }
  if (userType === VariableType.identifier) {
    return filteredValues.length === dedupValues.size;
  }
  return true;
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
  ] = createSignal<any[]>(getColumnDefs(dsDescription.data, dsDescription.fields));

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
      columnDefs().concat({ field: variableName, headerName: variableName }),
    );

    // Remember that the data has been edited (to ask for confirmation when closing the modal)
    setDataEdited(true);

    // Detect the type of the new variable and count the number of missing values
    const t = detectTypeField(newColumn as never[], variableName);

    // Check if the user has chosen a variable type that is compatible with the content of
    // the column. If not, use the detected type.
    const isVariableTypeCompatible = checkVariableType(
      newColumn,
      t.dataType,
      t.variableType,
      newColumnType,
    );
    const variableType = isVariableTypeCompatible
      ? newColumnType
      : t.variableType;

    if (!isVariableTypeCompatible) {
      // Also warn the user if the variable type has been changed
      toast.error(
        LL().DataTable.NewColumnModal.alertNotValidVariableType(
          LL().FieldsTyping.VariableTypes[newColumnType as keyof typeof VariableType](),
          LL().FieldsTyping.VariableTypes[t.variableType as keyof typeof VariableType](),
        ),
      );
    }
    // Add the new variable to the list of new variables
    // (will be used to update the layer description)
    newVariables.push({
      name: variableName,
      hasMissingValues: t.hasMissingValues,
      type: variableType,
      dataType: t.dataType,
    } as Variable);

    // Go back to the table panel
    setCurrentPanel('table');

    // Wait for the table to be rendered
    setTimeout(() => {
      // Scroll to the new column
      agGridRef!.api.ensureColumnVisible(variableName);

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
    const blob = new Blob([csvStr], { type: 'text/csv' });
    await clickLinkFromBlob(blob, `${dsName}.csv`);
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
      (refParentNode!.querySelector('.cancel-button') as HTMLElement).click();
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
    <div class="modal-card" style={{ width: 'min(1400px, 95vw)' }}>
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
              columnDefs={ addMaxWidthAttr(columnDefs()) }
              defaultColDef={ defaultColDef }
              onCellValueChanged={ () => { setDataEdited(true); } }
              suppressDragLeaveHidesColumns={ true }
              suppressColumnMoveAnimation={ true }
              autoSizeStrategy={{ type: 'fitCellContents' }}
              stopEditingWhenCellsLoseFocus={true}
              onGridPreDestroyed={() => {
                // Unbind the context menu listener on the header cells
                parentGridRef!.querySelector('.ag-header-container')!
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
                  parentGridRef!.querySelector('.ag-header-container')!
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
