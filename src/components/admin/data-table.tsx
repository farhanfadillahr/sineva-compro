'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  useTable,
  tableFeatures,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
  functionalUpdate,
} from '@tanstack/react-table'
import { readTableQuery, tableUrl } from './table-state'
import { Pagination } from './pagination'
import s from './admin.module.css'
const features = tableFeatures({
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
})
export type AdminColumn<T> = {
  id: string
  label: string
  sortable?: boolean
  cell: (row: T) => ReactNode
  title?: (row: T) => string
}
export type DataTableProps<T extends { id: string }> = {
  label: string
  rows: T[]
  columns: AdminColumn<T>[]
  total: number
  pathname: string
  query: string
  onNavigate?: (url: string) => void
  selectable?: boolean
  bulkActions?: (ids: string[]) => ReactNode
  filters?: ReactNode
  activeFilters?: { key: string; label: string }[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  exportAction?: ReactNode
  pageSizes?: readonly number[]
  rowHref?: (row: T) => string
}
function Search({
  label,
  value,
  onSearch,
}: {
  label: string
  value: string
  onSearch: (value: string) => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <label className={s.field}>
      Cari {label}
      <input
        type="search"
        aria-label={`Cari ${label}`}
        maxLength={100}
        defaultValue={value}
        onChange={(e) => {
          clearTimeout(timer.current)
          const next = e.target.value
          timer.current = setTimeout(() => onSearch(next), 300)
        }}
      />
    </label>
  )
}
export function DataTable<T extends { id: string }>(props: DataTableProps<T>) {
  return <TablePage key={props.query} {...props} />
}
function TablePage<T extends { id: string }>({
  label,
  rows,
  columns,
  total,
  pathname,
  query,
  onNavigate,
  selectable = false,
  bulkActions,
  filters,
  activeFilters = [],
  loading,
  error,
  onRetry,
  exportAction,
  pageSizes,
  rowHref,
}: DataTableProps<T>) {
  const current = new URLSearchParams(query)
  const state = readTableQuery(
    current,
    columns.filter((c) => c.sortable).map((c) => c.id),
  )
  const [showColumns, setShowColumns] = useState(false)
  const navigate = (patch: Record<string, string | number | undefined>) => {
    const next = tableUrl(pathname, current, patch)
    if (onNavigate) onNavigate(next)
    else window.location.assign(next)
  }
  const defs = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: c.label,
        enableSorting: !!c.sortable,
        cell: ({ row }: { row: { original: T } }) => c.cell(row.original),
      })),
    [columns],
  )
  const table = useTable({
    features,
    data: rows,
    columns: defs,
    getRowId: (r) => r.id,
    enableRowSelection: selectable,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    state: {
      sorting: state.sort ? [{ id: state.sort, desc: state.direction === 'desc' }] : [],
      pagination: { pageIndex: state.page - 1, pageSize: state.pageSize },
    },
    onSortingChange: (updater) => {
      const next = functionalUpdate(
        updater,
        state.sort ? [{ id: state.sort, desc: state.direction === 'desc' }] : [],
      )[0]
      navigate({ page: 1, sort: next?.id, direction: next?.desc ? 'desc' : 'asc' })
    },
  })
  const selected = rows.filter((r) => table.state.rowSelection[r.id]).map((r) => r.id)
  return (
    <div className={s.stack}>
      <div className={s.row}>
        <Search
          label={label}
          value={state.search}
          onSearch={(search) => navigate({ search, page: 1 })}
        />
        {filters}
        <div className={s.popupAnchor}>
          <button
            className={s.button}
            type="button"
            aria-expanded={showColumns}
            onClick={() => setShowColumns((v) => !v)}
          >
            Kolom
          </button>
          {showColumns ? (
            <fieldset className={s.popup}>
              <legend>Kolom yang ditampilkan</legend>
              {table.getAllLeafColumns().map((c) => (
                <label key={c.id} className={s.row}>
                  <input
                    type="checkbox"
                    checked={c.getIsVisible()}
                    onChange={c.getToggleVisibilityHandler()}
                  />
                  {columns.find((col) => col.id === c.id)?.label}
                </label>
              ))}
            </fieldset>
          ) : null}
        </div>
        <button
          className={s.button}
          type="button"
          aria-pressed={current.get('density') === 'compact'}
          onClick={() =>
            navigate({ density: current.get('density') === 'compact' ? 'comfortable' : 'compact' })
          }
        >
          Tampilan ringkas
        </button>
        {exportAction}
      </div>
      {activeFilters.length ? (
        <div className={s.row}>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              className={s.button}
              type="button"
              aria-label={`Hapus filter ${filter.label}`}
              onClick={() => navigate({ [filter.key]: undefined, page: 1 })}
            >
              {filter.label} ×
            </button>
          ))}
        </div>
      ) : null}
      {loading ? (
        <div role="status" aria-live="polite">
          <span>Memuat {label}…</span>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={s.skeleton} style={{ height: 52, marginTop: 4 }} />
          ))}
        </div>
      ) : error ? (
        <div className={s.banner} role="alert">
          <p>{error}</p>
          {onRetry ? (
            <button className={s.button} type="button" onClick={onRetry}>
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={s.tableWrap}>
            <table className={s.table} data-density={current.get('density') ?? undefined}>
              <caption className={s.srOnly}>{label}</caption>
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {selectable ? (
                      <th scope="col">
                        <input
                          type="checkbox"
                          aria-label="Pilih semua baris di halaman ini"
                          checked={table.getIsAllRowsSelected()}
                          ref={(el) => {
                            if (el) el.indeterminate = table.getIsSomeRowsSelected()
                          }}
                          onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                      </th>
                    ) : null}
                    {group.headers.map((header) => {
                      const column = columns.find((c) => c.id === header.column.id)!
                      const sort = header.column.getIsSorted()
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={
                            column.sortable
                              ? sort === 'asc'
                                ? 'ascending'
                                : sort === 'desc'
                                  ? 'descending'
                                  : 'none'
                              : undefined
                          }
                        >
                          {column.sortable ? (
                            <button
                              type="button"
                              aria-label={`Urutkan ${column.label}`}
                              onClick={() =>
                                navigate({
                                  page: 1,
                                  sort: column.id,
                                  direction:
                                    state.sort === column.id && state.direction === 'asc'
                                      ? 'desc'
                                      : 'asc',
                                })
                              }
                            >
                              {column.label}{' '}
                              <span aria-hidden>
                                {sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '↕'}
                              </span>
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} data-selected={row.getIsSelected()}>
                    {selectable ? (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Pilih baris ${row.index + 1}`}
                          checked={row.getIsSelected()}
                          onChange={row.getToggleSelectedHandler()}
                        />
                      </td>
                    ) : null}
                    {row.getVisibleCells().map((cell, i) => {
                      const col = columns.find((c) => c.id === cell.column.id)!
                      return (
                        <td key={cell.id}>
                          {rowHref && i === 0 ? (
                            <a href={rowHref(row.original)}>{col.cell(row.original)}</a>
                          ) : col.title ? (
                            <span className={s.cellTruncate} title={col.title(row.original)}>
                              {col.cell(row.original)}
                            </span>
                          ) : (
                            col.cell(row.original)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? <div className={s.empty}>Belum ada data.</div> : null}
          </div>
          <Pagination
            total={total}
            page={state.page}
            pageSize={state.pageSize}
            pathname={pathname}
            query={query}
            onNavigate={onNavigate}
            pageSizes={pageSizes}
          />
          {selected.length ? (
            <div className={s.bulk} role="region" aria-label="Tindakan pilihan">
              <span role="status">{selected.length} dipilih</span>
              {bulkActions?.(selected)}
              <button className={s.button} type="button" onClick={() => table.resetRowSelection()}>
                Batalkan pilihan
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
