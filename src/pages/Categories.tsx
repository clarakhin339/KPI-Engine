import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { KpiCategory } from '../lib/types';
import { uid } from '../lib/utils';

export function CategoriesPage() {
  const { categories, setCategories, pushToast, logAction } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', defaultWeight: 10 });

  const columns: Column<KpiCategory>[] = [
  {
    key: 'name',
    header: 'Category',
    sortable: true,
    value: (c) => c.name,
    render: (c) =>
    <div className="min-w-0">
          <p className="truncate font-medium text-fg">{c.name}</p>
          <p className="truncate text-xs text-fgmuted">{c.description}</p>
        </div>

  },
  {
    key: 'weight',
    header: 'Default weight',
    sortable: true,
    align: 'right',
    value: (c) => c.defaultWeight,
    render: (c) => <span className="font-mono text-sm text-fg">{c.defaultWeight}%</span>
  },
  {
    key: 'items',
    header: 'KPI items using it',
    sortable: true,
    align: 'right',
    value: (c) => c.itemCount,
    render: (c) => <span className="font-mono text-sm text-fgmuted">{c.itemCount}</span>
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    value: (c) => c.active ? 'active' : 'inactive',
    render: (c) => <StatusPill status={c.active ? 'active' : 'inactive'} />
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (c) =>
    <Button
      size="small"
      variant="tertiary"
      onClick={() => {
        setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
        logAction(c.active ? 'Deactivated category' : 'Activated category', 'Settings', c.name);
      }}>
      
          {c.active ? 'Deactivate' : 'Activate'}
        </Button>

  }];


  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Categories']}
        title="KPI categories"
        description="Categories group KPI items for weighting, reporting and competency analysis. Unlimited entries."
        actions={
        <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setOpen(true)}>
            New category
          </Button>
        } />
      

      <DataTable
        columns={columns}
        rows={categories}
        rowKey={(c) => c.id}
        searchPlaceholder="Search categories…"
        searchValue={(c) => `${c.name} ${c.description}`}
        pageSize={12} />
      

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">New category</h2>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Risk Management" />
            <Input label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Input
              label="Default weight (%)"
              type="number"
              value={String(draft.defaultWeight)}
              onChange={(e) => setDraft({ ...draft, defaultWeight: Number(e.target.value) })} />
            
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!draft.name.trim()) return;
              setCategories((prev) => [
              ...prev,
              { id: uid('c'), name: draft.name, description: draft.description, defaultWeight: draft.defaultWeight, active: true, itemCount: 0 }]
              );
              logAction('Created category', 'Settings', draft.name);
              pushToast({ title: 'Category created', tone: 'success' });
              setDraft({ name: '', description: '', defaultWeight: 10 });
              setOpen(false);
            }}>
            
            Create
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}