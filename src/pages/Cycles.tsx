import React, { useState } from 'react';
import { CalendarRangeIcon, LockIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { DataTable, type Column } from '../components/common/DataTable';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { CycleType, KpiCycle } from '../lib/types';
import { formatDate, uid } from '../lib/utils';

const TYPES: CycleType[] = ['Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Custom'];

export function CyclesPage() {
  const { cycles, setCycles, pushToast, logAction } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    type: 'Quarterly' as CycleType,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    dueDate: '2027-01-07',
    lockDate: '2027-01-14'
  });

  const active = cycles.find((c) => c.status === 'active');

  const columns: Column<KpiCycle>[] = [
  {
    key: 'name',
    header: 'Cycle',
    sortable: true,
    pinned: true,
    value: (c) => c.name,
    render: (c) =>
    <div className="min-w-0">
          <p className="truncate font-medium text-fg">{c.name}</p>
          <p className="truncate font-mono text-2xs text-fgsubtle">{c.type}</p>
        </div>

  },
  { key: 'period', header: 'Period', value: (c) => c.startDate, render: (c) =>
    <span className="whitespace-nowrap text-xs text-fgmuted">
        {formatDate(c.startDate)} → {formatDate(c.endDate)}
      </span>
  },
  { key: 'due', header: 'Due', sortable: true, value: (c) => c.dueDate, render: (c) => formatDate(c.dueDate) },
  { key: 'lock', header: 'Lock', sortable: true, value: (c) => c.lockDate, render: (c) =>
    <span className="flex items-center gap-1 whitespace-nowrap text-sm text-fgmuted">
        <LockIcon size={11} /> {formatDate(c.lockDate)}
      </span>
  },
  { key: 'assignments', header: 'Assignments', align: 'right', sortable: true, value: (c) => c.assignmentCount, render: (c) =>
    <span className="font-mono text-sm text-fgmuted">{c.assignmentCount}</span>
  },
  {
    key: 'completion',
    header: 'Completion',
    sortable: true,
    width: '160px',
    value: (c) => c.completion,
    render: (c) =>
    <ScoreBar value={c.completion} max={100} tone={c.completion === 100 ? 'positive' : 'info'} showValue={false} />

  },
  { key: 'status', header: 'Status', sortable: true, value: (c) => c.status, render: (c) => <StatusPill status={c.status} /> }];


  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Cycles']}
        title="KPI cycles"
        description="Periods that scope every assignment and score. Locked cycles are immutable — history is never deleted."
        actions={
        <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setOpen(true)}>
            New cycle
          </Button>
        } />
      

      {active &&
      <Panel
        title={`Active cycle · ${active.name}`}
        description="Key dates and progress"
        className="mb-4"
        actions={<CalendarRangeIcon size={15} className="text-fgsubtle" />}>
        
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
          ['Start', active.startDate],
          ['End', active.endDate],
          ['Submission due', active.dueDate],
          ['Lock', active.lockDate]].
          map(([label, date], i) =>
          <li key={label} className="relative rounded border border-line p-3">
                <span className="mono-label">{label}</span>
                <p className="mt-1 text-sm font-medium text-fg">{formatDate(date)}</p>
                <span className="absolute right-3 top-3 font-mono text-2xs text-fgsubtle">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </li>
          )}
          </ol>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="mono-label">Completion</span>
              <span className="font-mono text-xs text-fgmuted">{active.completion}%</span>
            </div>
            <ScoreBar value={active.completion} max={100} tone="info" showValue={false} />
          </div>
        </Panel>
      }

      <DataTable
        columns={columns}
        rows={cycles}
        rowKey={(c) => c.id}
        searchPlaceholder="Search cycles…"
        searchValue={(c) => `${c.name} ${c.type}`}
        groupOptions={[{ key: 'type', label: 'Cycle type', get: (c) => c.type }]} />
      

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">New KPI cycle</h2>
          <p className="text-xs text-fgmuted">
            Lock date freezes all scores; previous cycles remain readable forever.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Input label="Cycle name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Q4 2026 Performance" />
            <Select
              label="Type"
              options={TYPES.map((t) => ({ value: t, label: t }))}
              value={draft.type}
              onChange={(v) => setDraft({ ...draft, type: v as CycleType })} />
            
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start date" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              <Input label="End date" type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
              <Input label="Due date" type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Input label="Lock date" type="date" value={draft.lockDate} onChange={(e) => setDraft({ ...draft, lockDate: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!draft.name.trim()) return;
              setCycles((prev) => [
              { id: uid('cy'), ...draft, status: 'draft', assignmentCount: 0, completion: 0 },
              ...prev]
              );
              logAction('Created cycle', 'Settings', draft.name);
              pushToast({ title: 'Cycle created', description: 'Publish assignments to activate it.', tone: 'success' });
              setOpen(false);
            }}>
            
            Create cycle
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}