import { useState, type ChangeEvent, type ReactNode } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { DataTable, type Column } from './DataTable';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../ui/Dialog';
import { useApp } from '../../lib/store';

export const NONE = '__none__';

export interface CrudField<T> {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'select' | 'checkbox';
  options?: {value: string;label: string;}[];
  /** For selects: the option whose value is `NONE` is stored as null. */
  nullable?: boolean;
  searchable?: boolean;
  helperText?: string;
  wide?: boolean;
  render?: (draft: T, patch: (changes: Partial<T>) => void) => ReactNode;
}

interface CrudTableProps<T extends {id: string;}> {
  title: string;
  description?: string;
  noun: string;
  rows: T[];
  columns: Column<T>[];
  fields: CrudField<T>[];
  blank: () => T;
  /** Persist the record. Return an error message to keep the dialog open. */
  onSave: (item: T, isNew: boolean) => string | null;
  /** Remove the record. Return an error message when it is still in use. */
  onDelete?: (item: T) => string | null;
  describe: (item: T) => string;
  searchValue?: (row: T) => string;
  toolbarActions?: ReactNode;
  pageSize?: number;
}

export function CrudTable<T extends {id: string;}>({
  title,
  description,
  noun,
  rows,
  columns,
  fields,
  blank,
  onSave,
  onDelete,
  describe,
  searchValue,
  toolbarActions,
  pageSize = 10
}: CrudTableProps<T>) {
  const { pushToast } = useApp();
  const [draft, setDraft] = useState<T | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<T | null>(null);

  const patch = (changes: Partial<T>) => setDraft((d) => d ? { ...d, ...changes } : d);
  const open = (item: T, fresh: boolean) => {
    setDraft(item);
    setIsNew(fresh);
    setError('');
  };

  const save = () => {
    if (!draft) return;
    const failure = onSave(draft, isNew);
    if (failure) {
      setError(failure);
      return;
    }
    pushToast({ title: `${describe(draft)} ${isNew ? 'added' : 'updated'}`, tone: 'success' });
    setDraft(null);
  };

  const remove = () => {
    if (!deleting || !onDelete) return;
    const failure = onDelete(deleting);
    pushToast(
      failure ?
      { title: `Cannot delete ${describe(deleting)}`, description: failure, tone: 'danger' } :
      { title: `${describe(deleting)} deleted`, tone: 'success' }
    );
    setDeleting(null);
  };

  const allColumns: Column<T>[] = [
  ...columns,
  {
    key: '__actions',
    header: '',
    align: 'right',
    render: (row) =>
    <span className="inline-flex gap-1">
          <Button
        size="small"
        variant="tertiary"
        aria-label={`Edit ${describe(row)}`}
        iconOnly={<PencilIcon size={13} />}
        onClick={(e) => {
          e.stopPropagation();
          open(row, false);
        }} />
      
          {onDelete &&
      <Button
        size="small"
        variant="tertiary"
        aria-label={`Delete ${describe(row)}`}
        iconOnly={<Trash2Icon size={13} className="text-danger" />}
        onClick={(e) => {
          e.stopPropagation();
          setDeleting(row);
        }} />

      }
        </span>

  }];


  return (
    <section>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-fgmuted">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarActions}
          <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => open(blank(), true)}>
            Add {noun}
          </Button>
        </div>
      </div>

      <DataTable
        columns={allColumns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => open(r, false)}
        searchable={!!searchValue}
        searchValue={searchValue}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        pageSize={pageSize}
        emptyMessage={`No ${title.toLowerCase()} yet.`} />
      

      <Dialog isOpen={!!draft} onClose={() => setDraft(null)} size={fields.length > 4 ? 'lg' : 'md'}>
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">
            {isNew ? `Add ${noun}` : `Edit ${noun}`}
          </h2>
        </DialogHeader>
        <DialogContent>
          {draft &&
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => {
              const value = draft[field.key];
              const wide = field.wide || fields.length <= 2 ? 'sm:col-span-2' : '';
              if (field.render) {
                return (
                  <div key={field.key} className={wide}>
                      {field.render(draft, patch)}
                    </div>);

              }
              if (field.type === 'checkbox') {
                return (
                  <label key={field.key} className={`flex cursor-pointer items-start gap-2 text-sm text-fg ${wide}`}>
                      <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5"
                      checked={Boolean(value)}
                      onChange={(e) => patch({ [field.key]: e.target.checked } as Partial<T>)} />
                    
                      <span>
                        {field.label}
                        {field.helperText && <span className="block text-xs text-fgmuted">{field.helperText}</span>}
                      </span>
                    </label>);

              }
              if (field.type === 'select') {
                return (
                  <div key={field.key} className={wide}>
                      <Select
                      label={field.label}
                      searchable={field.searchable}
                      options={field.options ?? []}
                      value={value === null || value === undefined ? NONE : String(value)}
                      onChange={(v: unknown) =>
                      patch({ [field.key]: field.nullable && v === NONE ? null : v } as Partial<T>)
                      } />
                    
                      {field.helperText && <p className="mt-1 text-xs text-fgmuted">{field.helperText}</p>}
                    </div>);

              }
              return (
                <div key={field.key} className={wide}>
                    <Input
                    label={field.label}
                    type={field.type ?? 'text'}
                    value={value === null || value === undefined ? '' : String(value)}
                    helperText={field.helperText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    patch({
                      [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value
                    } as Partial<T>)
                    } />
                  
                  </div>);

            })}
            </div>
          }
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDraft(null)}>
            Cancel
          </Button>
          <Button onClick={save}>{isNew ? `Add ${noun}` : 'Save changes'}</Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={!!deleting} onClose={() => setDeleting(null)} size="sm">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Delete {noun}?</h2>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-fgmuted">
            {deleting && describe(deleting)} will be removed. This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={remove}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </section>);

}
