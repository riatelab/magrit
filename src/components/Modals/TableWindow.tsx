import { createSignal, JSX, Show } from 'solid-js';

import AgGridSolid from 'ag-grid-solid';
import 'ag-grid-community/styles/ag-grid.css'; // grid core CSS
import 'ag-grid-community/styles/ag-theme-alpine.css'; // optional theme

import { unproxify } from '../../helpers/common';
import { useI18nContext } from '../../i18n/i18n-solid';

import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setNiceAlertStore } from '../../store/NiceAlertStore';
import { tableWindowStore, setTableWindowStore } from '../../store/TableWindowStore';

import '../../styles/TableWindow.css';
import d3 from '../../helpers/d3-custom';
import { clickLinkFromDataUrl } from '../../helpers/exports';

export default function TableWindow(): JSX.Element {
  const { LL } = useI18nContext();
  // Extract layerId and editable from tableWindowStore
  // and find the layer from layersDescriptionStore
  // to get the data
  const { layerId, editable } = tableWindowStore;
  const layer = layersDescriptionStore.layers
    .find((l) => l.id === layerId);
  const { name: layerName } = layer;
  const rowData = unproxify(layer.data).features.map((feature) => feature.properties);
  // The row we want to display
  const columnDefs = Object.keys(layer.data.features[0].properties)
    .map((key) => ({ field: key, headerName: key }));
  // Other option for ag-grid table
  const defaultColDef = {
    editable,
    sortable: true,
  };

  // Whether the data has been edited
  const [
    cellEdited,
    setCellEdited,
  ] = createSignal<boolean>(false);

  // Whether we are displaying the table or the form to add a new column
  const [
    currentPanel,
    setCurrentPanel,
  ] = createSignal<'table' | 'newColumn'>('table');

  // Signals for the new column form
  const [
    newColumnContentType,
    setNewColumnContentType,
  ] = createSignal<'numerical' | 'non-numerical'>('numerical');
  const [
    newColumnName,
    setNewColumnName,
  ] = createSignal<string>('');

  const confirmCallback = () => {
    // Remove the table window
    setTableWindowStore({
      show: false,
      editable: false,
      layerId: '',
    });

    // If the data has been edited, ask for confirmation
    if (cellEdited()) {
      const onConfirm = () => {
        const newData = {
          type: 'FeatureCollection',
          features: unproxify(layer.data).features.map((feature, i) => {
            feature.properties = rowData[i]; // eslint-disable-line no-param-reassign
            return feature;
          }),
        };

        setLayersDescriptionStore(
          'layers',
          (l) => l.id === layerId,
          { data: newData },
        );
      };

      // Open alert that ask for confirmation
      setNiceAlertStore({
        show: true,
        type: 'warning',
        content: (): JSX.Element => <p>{ LL().Alerts.SaveEditedData() }</p>,
        confirmCallback: onConfirm,
        focusOn: 'confirm',
      });
    }
  };
  const cancelCallback = () => {
    setTableWindowStore({
      show: false,
      editable: false,
      layerId: '',
    });
  };

  const csvExport = async () => {
    const csvStr = d3.csvFormat(rowData);
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
        <Show when={ currentPanel() === 'table' }>
          <h3>
            { layerName }
            &nbsp;- { LL().DataTable.Features(rowData.length) }
            &nbsp;- { LL().DataTable.Columns(columnDefs.length) }
          </h3>
          <div class="ag-theme-alpine" style="height: 70vh;">
            <AgGridSolid
              rowData={ rowData }
              columnDefs={ columnDefs }
              defaultColDef={ defaultColDef }
              onCellValueChanged={ () => { setCellEdited(true); } }
            />
          </div>
        </Show>
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
                    setNewColumnContentType(e.target.value as 'numerical' | 'non-numerical');
                  } }
                  value={ newColumnContentType() }
                >
                  <option value="numerical">{ LL().DataTable.NewColumnModal.numericalValues() }</option>
                  <option value="non-numerical">{ LL().DataTable.NewColumnModal.nonNumericalValues() }</option>
                </select>
              </div>
            </div>
            <Show when={ newColumnContentType() === 'numerical' }>
              <div class="field-block">
                <label class="label">{ LL().DataTable.NewColumnModal.formula() }</label>
                <div class="select" style={{ width: '40%' }}>
                  <select style={{ width: '100%' }}></select>
                </div>
                <div class="select" style={{ width: '20%' }}>
                  <select style={{ width: '100%' }}>
                    <option value="add">+</option>
                    <option value="sub">-</option>
                    <option value="mul">*</option>
                    <option value="div">/</option>
                    <option value="pow">^</option>
                  </select>
                </div>
                <div class="select" style={{ width: '40%' }}>
                  <select style={{ width: '100%' }}>
                    <option value="constant">{ LL().DataTable.NewColumnModal.constantValue() }</option>
                  </select>
                </div>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    style={{ float: 'right', width: '40%' }}
                    value={1}
                  />
                </div>
              </div>
            </Show>
            <Show when={ newColumnContentType() === 'non-numerical' }>
              <div class="field-block">
                <label class="label">{ LL().DataTable.NewColumnModal.operation() }</label>
                <label class="label"> </label>
                <div class="select" style={{ width: '40%' }}>
                  <select style={{ width: '100%' }}></select>
                </div>
                <div class="select" style={{ width: '20%' }}>
                  <select style={{ width: '100%' }}></select>
                </div>
                <div class="select" style={{ width: '40%' }}>
                  <select style={{ width: '100%' }}></select>
                </div>
              </div>
            </Show>
          </div>
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
            onClick={ () => { cancelCallback(); } }
          >{ LL().CancelButton() }</button>
        </div>
      </footer>
    </div>
  </div>;
}
