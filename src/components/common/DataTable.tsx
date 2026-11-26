import React, { useMemo, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  GroupIcon,
  InboxIcon,
  SearchIcon,
  XIcon } from
'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  pinned?: boolean;
  defaultHidden?: boolean;
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => string | number;
}

export interface GroupOption<T> {
  key: string;
  label: string;
  get: (row: T) => string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: (row: T) => string;
  filters?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  selectable?: boolean;
  bulkActions?: (selectedIds: string[], clear: () => void) => React.ReactNode;
  groupOptions?: GroupOption<T>[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Search…',
  searchValue,
  filters,
  toolbarActions,
  selectable = false,
  bulkActions,
  groupOptions,
  onRowClick,
  pageSize = 10,
  emptyMessage = 'No records match the current filters.',
  dense = false
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{key: string;dir: 'asc' | 'desc';} | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupKey, setGroupKey] = useState<string>('');
  const [hidden, setHidden] = useState<string[]>(
    columns.filter((c) => c.defaultHidden).map((c) => c.key)
  );
  const [showColumns, setShowColumns] = useState(false);

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      if (searchValue) return searchValue(row).toLowerCase().includes(q);
      return columns.some((c) => String(c.value?.(row) ?? '').toLowerCase().includes(q));
    });
  }, [rows, query, columns, searchValue]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.value) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.value!(a);
      const bv = col.value!(b);
      if (av === bv) return 0;
      const res = av > bv ? 1 : -1;
      return sort.dir === 'asc' ? res : -res;
    });
  }, [filtered, sort, columns]);

  const group = groupOptions?.find((g) => g.key === groupKey);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = group ? sorted : sorted.slice(page * pageSize, page * pageSize + pageSize);

  const grouped = useMemo(() => {
    if (!group) return null;
    const map = new Map<string, T[]>();
    sorted.forEach((row) => {
      const key = group.get(row) || 'Ungrouped';
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return Array.from(map.entries());
  }, [group, sorted]);

  const allSelected = current.length > 0 && current.every((r) => selected.includes(rowKey(r)));

  const toggleAll = () => {
    if (allSelected) setSelected((s) => s.filter((id) => !current.some((r) => rowKey(r) === id)));else
    setSelected((s) => Array.from(new Set([...s, ...current.map(rowKey)])));
  };

  const cellPad = dense ? 'px-3 py-1.5' : 'px-3 py-2.5';

  const renderRow = (row: T) => {
    const id = rowKey(row);
    return (
      <tr
        key={id}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={cn(
          'border-b border-line last:border-0',
          onRowClick && 'cursor-pointer hover:bg-surface2',
          selected.includes(id) && 'bg-accentsoft'
        )}>
        
        {selectable &&
        <td className={cn(cellPad, 'w-10')} onClick={(e) => e.stopPropagation()}>
            <input
            type="checkbox"
            aria-label={`Select row ${id}`}
            className="h-3.5 w-3.5 rounded border-linestrong accent-current"
            checked={selected.includes(id)}
            onChange={() =>
            setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
            } />
          
          </td>
        }
        {visibleColumns.map((col) =>
        <td
          key={col.key}
          className={cn(
            cellPad,
            'text-sm text-fg align-middle',
            col.align === 'right' && 'text-right',
            col.align === 'center' && 'text-center',
            col.pinned && 'sticky left-0 z-10 bg-surface'
          )}
          style={{ width: col.width }}>
          
            {col.render ? col.render(row) : String(col.value?.(row) ?? '—')}
          </td>
        )}
      </tr>);

  };

  return (
    <div className="rounded-lg border border-line bg-surface">
      {(searchable || filters || toolbarActions || groupOptions) &&
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {searchable &&
        <div className="relative min-w-[200px] flex-1">
              <SearchIcon
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fgsubtle" />
          
              <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 w-full rounded border border-line bg-surface2 pl-8 pr-7 text-sm text-fg placeholder:text-fgsubtle" />
          
              {query &&
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fgsubtle hover:text-fg">
            
                  <XIcon size={13} />
                </button>
          }
            </div>
        }
          {filters}
          {groupOptions &&
        <label className="flex h-8 items-center gap-1.5 rounded border border-line bg-surface2 px-2 text-xs text-fgmuted">
              <GroupIcon size={13} />
              <span className="sr-only">Group by</span>
              <select
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value)}
            className="bg-transparent text-xs text-fg outline-none">
            
                <option value="">No grouping</option>
                {groupOptions.map((g) =>
            <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
            )}
              </select>
            </label>
        }
          <div className="relative">
            <button
            onClick={() => setShowColumns((s) => !s)}
            aria-expanded={showColumns}
            className="flex h-8 items-center gap-1.5 rounded border border-line bg-surface2 px-2 text-xs text-fgmuted hover:text-fg">
            
              <Columns3Icon size={13} /> Columns
            </button>
            {showColumns &&
          <div className="absolute right-0 z-30 mt-1 w-52 rounded border border-line bg-surface p-2 shadow-lg">
                {columns.map((c) =>
            <label
              key={c.key}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-fg hover:bg-surface2">
              
                    <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={!hidden.includes(c.key)}
                onChange={() =>
                setHidden((h) =>
                h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]
                )
                } />
              
                    {c.header}
                  </label>
            )}
              </div>
          }
          </div>
          {toolbarActions}
        </div>
      }

      {selectable && selected.length > 0 &&
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface2 px-3 py-2">
          <span className="font-mono text-xs text-fgmuted">{selected.length} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions?.(selected, () => setSelected([]))}
          </div>
          <button
          onClick={() => setSelected([])}
          className="ml-auto text-xs text-fgmuted underline hover:text-fg">
          
            Clear
          </button>
        </div>
      }

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface2">
              {selectable &&
              <th className={cn(cellPad, 'w-10 text-left')}>
                  <input
                  type="checkbox"
                  aria-label="Select all rows"
                  className="h-3.5 w-3.5"
                  checked={allSelected}
                  onChange={toggleAll} />
                
                </th>
              }
              {visibleColumns.map((col) =>
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={cn(
                  cellPad,
                  'whitespace-nowrap text-left font-mono text-2xs uppercase tracking-wider text-fgsubtle',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.pinned && 'sticky left-0 z-10 bg-surface2'
                )}>
                
                  {col.sortable && col.value ?
                <button
                  className="inline-flex items-center gap-1 hover:text-fg"
                  onClick={() =>
                  setSort((s) =>
                  s?.key === col.key ?
                  { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } :
                  { key: col.key, dir: 'asc' }
                  )
                  }>
                  
                      {col.header}
                      {sort?.key === col.key && (
                  sort.dir === 'asc' ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />)}
                    </button> :

                col.header
                }
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 &&
            <tr>
                <td
                colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                className="px-3 py-12 text-center">
                
                  <InboxIcon size={20} className="mx-auto mb-2 text-fgsubtle" />
                  <p className="text-sm text-fgmuted">{emptyMessage}</p>
                </td>
              </tr>
            }
            {grouped ?
            grouped.map(([label, groupRows]) =>
            <React.Fragment key={label}>
                    <tr className="bg-surface2">
                      <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-3 py-1.5 font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                  
                        {label} · {groupRows.length}
                      </td>
                    </tr>
                    {groupRows.map(renderRow)}
                  </React.Fragment>
            ) :
            current.map(renderRow)}
          </tbody>
        </table>
      </div>

      {!group && sorted.length > pageSize &&
      <div className="flex items-center justify-between border-t border-line px-3 py-2">
          <p className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            className="rounded border border-line p-1 text-fgmuted disabled:opacity-40 hover:text-fg">
            
              <ChevronLeftIcon size={14} />
            </button>
            <span className="px-2 font-mono text-xs text-fgmuted">
              {page + 1} / {totalPages}
            </span>
            <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            className="rounded border border-line p-1 text-fgmuted disabled:opacity-40 hover:text-fg">
            
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      }
    </div>);

}