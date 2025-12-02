// Imports from solid-js
import {
  createMemo, createSignal,
  JSX, Match, mergeProps, Show, Switch,
} from 'solid-js';

// Import from other libraries
import {
  FaSolidArrowRight,
  FaSolidEye,
  FaSolidEyeSlash,
} from 'solid-icons/fa';
import { BsThreeDotsVertical } from 'solid-icons/bs';
import * as Plot from '@observablehq/plot';
import Sortable from 'solid-sortablejs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { isNonNull, unproxify } from '../../helpers/common';

// Types / Interfaces / Enums
import { type CategoricalChoroplethMapping, type CategoricalPictogramMapping } from '../../global.d';

export function CategoriesSummary(
  props: {
    mapping: CategoricalChoroplethMapping[] | CategoricalPictogramMapping[],
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const hasNull = createMemo(() => props.mapping.some((m) => !isNonNull(m.value)));
  const nCategories = createMemo(() => props.mapping.length - (hasNull() ? 1 : 0));
  return <div style={{ 'margin-top': '-1em', 'margin-bottom': '1em' }}>
    <div>
      <FaSolidArrowRight />&nbsp;
      <span>
        { LL().FunctionalitiesSection.CategoricalChoroplethOptions.Categories(nCategories()) }
      </span>
      <br />
      <FaSolidArrowRight/>&nbsp;
      <span>
        {
          hasNull()
            ? LL().FunctionalitiesSection.CategoricalChoroplethOptions.HasNull()
            : LL().FunctionalitiesSection.CategoricalChoroplethOptions.NoNull()
        }
      </span>
    </div>
  </div>;
}

export function CategoriesPlot(
  props: {
    mapping: CategoricalChoroplethMapping[],
    height?: number,
    width?: number,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps(
    { height: 200, width: undefined },
    props,
  );
  const mapping = createMemo(() => mergedProps.mapping.filter((m) => isNonNull(m.value)));

  const domain = createMemo(() => mapping()
    .filter((m) => m.show)
    .map((m) => m.categoryName));
  const range = createMemo(() => mapping()
    .filter((m) => m.show)
    .map((m) => m.color));
  const data = createMemo(() => mapping()
    .filter((m) => m.show)
    .map((m, i) => ({
      position: i,
      category: m.categoryName,
      color: m.color,
      frequency: m.count,
    })));

  return <div>
    {
      Plot.plot({
        height: mergedProps.height,
        width: mergedProps.width,
        color: {
          domain: domain(),
          range: range(),
          legend: true,
        },
        x: {
          type: 'band',
          tickFormat: null,
          ticks: 0,
          label: LL().FunctionalitiesSection.CategoricalChoroplethOptions.XAxisCategories(),
        },
        y: {
          label: LL().FunctionalitiesSection.CategoricalChoroplethOptions.YAxisCount(),
        },
        marks: [
          Plot.barY(
            data(),
            {
              x: 'category',
              y: 'frequency',
              fill: 'color',
              channels: {
                position: (d) => d.position,
              },
              sort: {
                x: 'position',
                order: 'ascending',
              },
            },
          ),
          Plot.ruleY([0]),
        ],
      })
    }
  </div>;
}

export function CategoriesCustomisation(
  props: {
    mapping: () => CategoricalChoroplethMapping[],
    setMapping: (m: CategoricalChoroplethMapping[]) => void,
    detailed?: boolean,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const [
    disabled,
    setDisabled,
  ] = createSignal<boolean>(false);

  // We need to filter out null entries from the mapping
  // before we can use it in the Sortable component
  const mapping = createMemo(() => props.mapping().filter((m) => isNonNull(m.value)));

  // We keep the null entries in a separate variable
  //  to be able to add them back later
  const nulls = createMemo(() => props.mapping().filter((m) => !isNonNull(m.value)));

  // We also need to write a wrapper for the setMapping function
  // to add null entries back to the mapping
  const setMapping = (m: CategoricalChoroplethMapping[]) => {
    props.setMapping(
      m.concat(nulls()),
    );
  };

  const countNulls = createMemo(() => props.mapping()
    .filter((m) => !isNonNull(m.value)).reduce((acc, m) => acc + (m.count || 0), 0));

  return <div>
    <Sortable
      items={mapping()}
      setItems={setMapping as any}
      idField={'value'}
      disabled={disabled()}
    >
      {
        (item) => <div
          style={{ width: '100%', border: 'solid 0.5px currentColor' }}
          class="is-flex is-align-items-center"
        >
          <BsThreeDotsVertical style={{ cursor: 'grab' }} />
          <Switch>
            <Match when={item.show}>
              <FaSolidEye
                style={{ cursor: 'pointer', padding: '0.5em' }}
                onClick={() => {
                  props.setMapping(
                    props.mapping()
                      .map((m) => (m.value === item.value ? { ...m, show: false } : m)),
                  );
                }}
              />
            </Match>
            <Match when={!item.show}>
              <FaSolidEyeSlash
                style={{ cursor: 'pointer', padding: '0.5em' }}
                onClick={() => {
                  props.setMapping(
                    props.mapping()
                      .map((m) => (m.value === item.value ? { ...m, show: true } : m)),
                  );
                }}
              />
            </Match>
          </Switch>
          <input
            type="color"
            style={{ height: '2em', 'vertical-align': 'bottom', border: 0 }}
            value={item.color}
            onChange={(e) => {
              props.setMapping(
                props.mapping()
                  .map((m) => (m.value === item.value ? { ...m, color: e.target.value } : m)),
              );
            }}
          />
          <input
            type="text"
            style={{ height: '2em', width: '45%' }}
            value={item.categoryName || ''}
            onChange={(e) => {
              props.setMapping(
                props.mapping()
                  .map((m) => (
                    m.value === item.value ? { ...m, categoryName: e.target.value } : m)),
              );
              setDisabled(false);
            }}
            onFocus={() => { setDisabled(true); }}
            onFocusOut={() => { setDisabled(false); }}
          />
          <Show when={props.detailed}>
            <span>
              &nbsp;{ LL().FunctionalitiesSection.CategoricalChoroplethOptions.Value() }
              &nbsp;{item.value} -
              &nbsp;{ LL().FunctionalitiesSection.CategoricalChoroplethOptions.Count() }
              &nbsp;{item.count}
            </span>
          </Show>
        </div>
      }
    </Sortable>
    <Show when={countNulls() > 0}>
      <hr style={{ margin: '0.5em' }} />
      <div
        style={{ width: '100%', border: 'solid 0.5px currentColor' }}
        class="is-flex is-align-items-center"
      >
        <BsThreeDotsVertical style={{ cursor: 'grab' }}/>
        <Switch>
          <Match when={nulls()[0].show}>
            <FaSolidEye
              style={{ cursor: 'pointer', padding: '0.5em' }}
              onClick={() => {
                props.setMapping(
                  props.mapping()
                    .map((m) => (m.value === nulls()[0].value ? { ...m, show: false } : m)),
                );
              }}
            />
          </Match>
          <Match when={!nulls()[0].show}>
            <FaSolidEyeSlash
              style={{ cursor: 'pointer', padding: '0.5em' }}
              onClick={() => {
                props.setMapping(
                  props.mapping()
                    .map((m) => (m.value === nulls()[0].value ? { ...m, show: true } : m)),
                );
              }}
            />
          </Match>
        </Switch>
        <input
          type="color"
          style={{ height: '2em', 'vertical-align': 'bottom', border: 0 }}
          value={nulls()[0].color}
          onChange={(e) => {
            props.setMapping(
              props.mapping()
                .map((m) => (m.value === nulls()[0].value ? { ...m, color: e.target.value } : m)),
            );
          }}
        />
        <input
          type="text"
          style={{ height: '2em', width: '45%' }}
          value={nulls()[0].categoryName || ''}
          onChange={(e) => {
            props.setMapping(
              props.mapping()
                .map((m) => (
                  m.value === nulls()[0].value ? { ...m, categoryName: e.target.value } : m)),
            );
            setDisabled(false);
          }}
          onFocus={() => { setDisabled(true); }}
          onFocusOut={() => { setDisabled(false); }}
        />
        <Show when={props.detailed}>
            <span>
              &nbsp;{LL().FunctionalitiesSection.CategoricalChoroplethOptions.NoValues()}
              &nbsp;-&nbsp;{LL().FunctionalitiesSection.CategoricalChoroplethOptions.Count()}
              &nbsp;{countNulls()}
            </span>
        </Show>
      </div>
    </Show>
  </div>;
}
