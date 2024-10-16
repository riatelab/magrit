import { JSX, For, Show } from 'solid-js';
import { useI18nContext } from '../i18n/i18n-solid';

interface PaginationProps {
  totalPages: number;
  onClick: (page: number) => void;
  currentPage: number;
}

const makeButtonsToRender = (pps: PaginationProps) => {
  // We want :
  // - first page,
  // - current page - 1,
  // - current page,
  // - current page + 1,
  // - last page.
  // We also want to take care of not having duplicates.
  if (pps.totalPages === 1) {
    return [1];
  }
  let btns = [...new Set([
    1,
    pps.currentPage - 1,
    pps.currentPage,
    pps.currentPage + 1,
    pps.totalPages,
  ])];
  btns = btns
    .filter((page) => page > 0 && page <= pps.totalPages);
  if (btns[0] !== btns[1] - 1) {
    // Add an ellipsis between first and second element
    btns = [btns[0], -1, ...btns.slice(1)];
  }
  if (
    btns[btns.length - 1]
    !== btns[btns.length - 2] + 1
  ) {
    // Add an ellipsis between second last and last element
    btns = [
      ...btns.slice(0, btns.length - 1),
      -1,
      btns[btns.length - 1],
    ];
  }
  return btns;
};

export default function Pagination(props: PaginationProps): JSX.Element {
  const { LL } = useI18nContext();

  // This should never happen due to
  // how the pagination is used in the parent component
  if (props.currentPage < 1 || props.currentPage > props.totalPages) {
    throw new Error('Invalid page number');
  }

  return <nav class="pagination is-centered" role="navigation" aria-label="pagination">
    <Show when={props.totalPages > 1}>
      <a
        class="pagination-previous"
        aria-disabled={props.currentPage === 1}
        onClick={() => props.onClick(props.currentPage - 1 > 0 ? props.currentPage - 1 : 1)}
      >
        { LL().Pagination.Previous() }
      </a>
      <a
        class="pagination-next"
        aria-disabled={props.currentPage === props.totalPages}
        onClick={() => props.onClick(
          props.currentPage + 1 > props.totalPages ? props.totalPages : props.currentPage + 1,
        )}
      >
        { LL().Pagination.Next() }
      </a>
    </Show>
    <ul class="pagination-list">
      <For each={makeButtonsToRender(props)}>
        {
          (page) => {
            if (page === -1) {
              return <li><span class="pagination-ellipsis">&hellip;</span></li>;
            }
            return <li>
              <a
                class={`pagination-link ${page === props.currentPage ? 'is-current' : ''}`}
                aria-label={`Goto page ${page}`}
                onClick={() => props.onClick(page)}
              >
                {page}
              </a>
            </li>;
          }
        }
      </For>
    </ul>
  </nav>;
}
