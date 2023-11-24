// Import from solid-js
import {
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';

// Ag-grid stuffs
import AgGridSolid from 'ag-grid-solid';
import 'ag-grid-community/styles/ag-grid.css'; // grid core CSS
import 'ag-grid-community/styles/ag-theme-alpine.css'; // optional theme

// Imports from other packages
import alasql from 'alasql';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { clickLinkFromDataUrl } from '../../helpers/exports';
import {
  DataType,
  detectTypeField,
  type Variable,
  VariableType,
} from '../../helpers/typeDetection';

// Subcomponents
import InputFieldButton from '../Inputs/InputButton.tsx';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { setTableWindowStore, tableWindowStore } from '../../store/TableWindowStore';

// Types / Interfaces / Enums
import { GeoJSONFeature, GeoJSONFeatureCollection, LayerDescription } from '../../global.d';

// Styles
import '../../styles/TableWindow.css';

const operatorToFunction: { [key: string]: (a: any, b: any) => number | string } = {
  add: (a: number, b: number) => a + b,
  sub: (a: number, b: number) => a - b,
  mul: (a: number, b: number) => a * b,
  div: (a: number, b: number) => a / b,
  pow: (a: number, b: number) => a ** b,
  concatenate: (a: any, b: any) => `${a}${b}`,
  truncate: (a: any, b: number) => {
    if (b < 0) {
      return a.toString().slice(b);
    }
    return a.toString().slice(0, b);
  },
};

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

  // The data to be displayed
  // (we use a signal because we may add new columns)
  const [
    rowData,
    setRowData,
  ] = createSignal<any[]>((unproxify(layer.data) as GeoJSONFeatureCollection)
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

  // Signals for the new column form
  const [
    newColumnContent,
    setNewColumnContent,
  ] = createSignal<'numerical' | 'non-numerical'>('numerical');
  const [
    newColumnType,
    setNewColumnType,
  ] = createSignal<VariableType>(VariableType.unknown);
  const [
    newColumnName,
    setNewColumnName,
  ] = createSignal<string>('');
  const [
    selectedFieldLeft,
    setSelectedFieldLeft,
  ] = createSignal<string>(columnDefs()[0].field);
  const [
    selectedFieldRight,
    setSelectedFieldRight,
  ] = createSignal<string>(columnDefs()[0].field);
  const [
    selectedOperator,
    setSelectedOperator,
  ] = createSignal<string>('add');
  const [
    sampleOutput,
    setSampleOutput,
  ] = createSignal<string>('');

  const newVariables: Variable[] = [];

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
          features: unproxify(layer.data).features
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

  // Function that is called when the user clicks the "compute" button
  // in the new column form
  const onClickCompute = () => {
    const variableName = newColumnName();
    console.log(
      variableName,
      selectedFieldLeft(),
      selectedFieldRight(),
      selectedOperator(),
      newColumnType(),
    );

    // The function that will be used to compute the new column
    const fn = operatorToFunction[selectedOperator()];

    // Compute the new column
    const newColumn = rowData().map((row) => {
      const left = row[selectedFieldLeft()];
      const right = selectedFieldRight() === '~~constant~~'
        ? 1
        : row[selectedFieldRight()];
      return fn(left, right);
    });

    console.log(newColumn);

    // We need to update the data for the table
    setRowData(
      rowData().map((row, i) => ({
        ...row,
        [variableName]: newColumn[i],
      })),
    );
    setColumnDefs(
      columnDefs().concat({ field: variableName, headerName: variableName }),
    );
    setDataEdited(true);

    const t = detectTypeField(newColumn as never[], variableName);

    newVariables.push({
      name: variableName,
      hasMissingValues: t.hasMissingValues,
      type: t.variableType,
      dataType: t.dataType,
    } as Variable);
  };

  // Function that is called when the user clicks the "export csv" button
  const csvExport = async () => {
    const csvStr = d3.csvFormat(rowData());
    await clickLinkFromDataUrl(
      `data:text/plan;charset=utf-8,${encodeURIComponent(csvStr)}`,
      `${layerName}.csv`,
    );
  };

  return <div class="table-window modal" style={{ display: 'flex' }}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().DataTable.titleGeo() }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body" style="height: 80vh;">
        {/*
          Table panel
        */}
        <Show when={ currentPanel() === 'table' }>
          <h3>
            { layerName }
            &nbsp;- { LL().DataTable.Features(rowData().length) }
            &nbsp;- { LL().DataTable.Columns(columnDefs().length) }
          </h3>
          <div class="ag-theme-alpine" style="height: 70vh;">
            <AgGridSolid
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
          <div>
            <h3>{ LL().DataTable.NewColumnModal.title() }</h3>
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
              <label class="label">{ LL().DataTable.NewColumnModal.newColumnContent() }</label>
              <div class="select" style={{ width: '100%' }}>
                <select
                  style={{ width: '100%' }}
                  onChange={ (e) => {
                    setNewColumnContent(e.target.value as 'numerical' | 'non-numerical');
                  } }
                  value={ newColumnContent() }
                >
                  <option value="numerical">{ LL().DataTable.NewColumnModal.numericalValues() }</option>
                  <option value="non-numerical">{ LL().DataTable.NewColumnModal.nonNumericalValues() }</option>
                </select>
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
                  <For each={Object.keys(VariableType)}>
                    {
                      (type) => (
                        <option value={ type }>{ LL().FieldsTyping.VariableTypes[type]() }</option>)
                    }
                  </For>
                </select>
              </div>
            </div>
            <Show when={ newColumnContent() === 'numerical' }>
              <div class="field-block">
                <label class="label">{ LL().DataTable.NewColumnModal.formula() }</label>
                <div class="select" style={{ width: '40%' }}>
                  <select
                    style={{ width: '100%' }}
                    onChange={ (e) => { setSelectedFieldLeft(e.target.value); } }
                  >
                    <For each={layer.fields.filter(((d) => d.dataType === DataType.number))}>
                      {
                        (field) => (
                          <option value={ field.name }>{ field.name }</option>)
                      }
                    </For>
                  </select>
                </div>
                <div class="select" style={{ width: '20%' }}>
                  <select
                    style={{ width: '100%' }}
                    onChange={ (e) => { setSelectedOperator(e.target.value); }}
                  >
                    <option value="add">+</option>
                    <option value="sub">-</option>
                    <option value="mul">*</option>
                    <option value="div">/</option>
                    <option value="pow">^</option>
                  </select>
                </div>
                <div class="select" style={{ width: selectedFieldRight() !== '~~constant~~' ? '40%' : '20%' }}>
                  <select
                    style={{ width: '100%' }}
                    onChange={ (e) => { setSelectedFieldRight(e.target.value); } }
                  >
                    <For each={layer.fields.filter(((d) => d.dataType === DataType.number))}>
                      {
                        (field) => (
                          <option value={ field.name }>{ field.name }</option>)
                      }
                    </For>
                    <option value="~~constant~~" style={{ 'font-style': 'italic' }}>
                      { LL().DataTable.NewColumnModal.constantValue() }
                    </option>
                  </select>
                </div>
                <Show when={selectedFieldRight() === '~~constant~~'}>
                  <div class="control" style={{ width: '20%', display: 'inline-block' }}>
                    <input
                      class="input"
                      type="number"
                      style={{ height: '2em' }}
                      value={1}
                    />
                  </div>
                </Show>
              </div>
            </Show>
            <Show when={ newColumnContent() === 'non-numerical' }>
              <div class="field-block">
                <label class="label">{ LL().DataTable.NewColumnModal.operation() }</label>
                <label class="label"> </label>
                <div class="select" style={{ width: '40%' }}>
                  <select
                    onChange={ (e) => { setSelectedFieldLeft(e.target.value); } }
                    style={{ width: '100%' }}
                  >
                    <For each={layer.fields}>
                      {
                        (field) => (
                          <option value={ field.name }>{ field.name }</option>)
                      }
                    </For>
                  </select>
                </div>
                <div class="select" style={{ width: '20%' }}>
                  <select
                    style={{ width: '100%' }}
                    onChange={ (e) => { setSelectedOperator(e.target.value); }}
                  >
                    <option value="concatenate">{ LL().DataTable.NewColumnModal.concatenate() }</option>
                    <option value="truncate">{ LL().DataTable.NewColumnModal.truncate() }</option>
                  </select>
                </div>
                <Show when={selectedOperator() === 'concatenate'}>
                  <div class="select" style={{ width: '40%' }}>
                    <select
                      style={{ width: '100%' }}
                      onChange={ (e) => { setSelectedFieldRight(e.target.value); } }
                    >
                      <For each={layer.fields}>
                        {
                          (field) => (
                            <option value={ field.name }>{ field.name }</option>)
                        }
                      </For>
                    </select>
                  </div>
                </Show>
                <Show when={selectedOperator() === 'truncate'}>
                  <div style={{ width: '40%', height: '2em' }}>
                    <input
                      type="number"
                      class="input"
                      style={{ width: '100%' }}
                      value={2}
                    />
                  </div>
                </Show>
              </div>
            </Show>
            <div class="field-block">
              <label class="label">{ 'Formula' }</label>
              <div class="control">
                <input
                  class="input"
                  id="formula"
                  type="text"
                  // TODO: add a placeholder
                  // TODO: compute the result while the user is typing (on a sample of the data)
                />
              </div>
              <div class="control">
                <button
                  class="button is-primary"
                  style={{ width: '100%' }}
                  onClick={ () => {
                    // TODO: use signals instead of directly manipulating the DOM
                    const formula = (document.getElementById('formula') as HTMLInputElement).value;
                    const query = `SELECT ${formula} as newValue FROM ?`;
                    try {
                      const newColumn = alasql(query, [rowData()]);
                      if (newColumn[0].newValue === undefined) {
                        // TODO: use signals instead of directly manipulating the DOM
                        document.getElementById('sample-output')?.classList.add('has-text-danger');
                        setSampleOutput('Error - Empty result');
                        // TODO: we may try to parse the query here (as it is syntactically correct
                        //   since no error was thrown by alasql)
                        //   and detect why the output is empty (e.g. a column name is wrong, etc.)
                      } else {
                        // TODO: use signals instead of directly manipulating the DOM
                        document.getElementById('sample-output')?.classList.remove('has-text-danger');
                        setSampleOutput(
                          `[0] ${newColumn[0].newValue}\n[1] ${newColumn[1].newValue}\n[2] ${newColumn[2].newValue}`,
                        );
                      }
                    } catch (e) {
                      // TODO: use signals instead of directly manipulating the DOM
                      document.getElementById('sample-output')?.classList.add('has-text-danger');
                      setSampleOutput('Error while parsing formula');
                    }
                  }}
                >{ 'Compute' }</button>
              </div>
              <div class="control" style={{ display: 'flex' }}>
                <div style={{ display: 'flex', 'align-items': 'center', width: '15%' }}>
                  <label class="label">{ 'Sample output' }</label>
                </div>
                <pre style={{ width: '100%' }} id="sample-output">
                  { sampleOutput() }
                </pre>
              </div>
            </div>
          </div>
          <br />
          <InputFieldButton
            label={ LL().DataTable.NewColumnModal.compute() }
            onClick={onClickCompute}
            disabled={newColumnName() === ''}
          />
        </Show>
      </section>
      <footer class="modal-card-foot">
        <div>
          <button
            class="button is-primary"
            onClick={ csvExport }
          >
            { LL().DataTable.ExportCsv() }
          </button>
          <Show when={ currentPanel() === 'table' }>
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
              { 'Back to data table' }
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
