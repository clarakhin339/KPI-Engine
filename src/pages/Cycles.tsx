import { useState, type ChangeEvent } from 'react';
import { LockIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { DataTable, type Column } from '../components/common/DataTable';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import { expectedEvaluations } from '../lib/permissions';
import type { EvaluationCycle } from '../lib/types';
import { formatDate } from '../lib/utils';

export function CyclesPage() {
  const { cycles, activeCycle, access, evaluations, createCycle, activateCycle, closeCycle, pushToast } =
  useApp();

  const latest = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const suggestion = !latest ?
  { half: 'H1' as const, year: new Date().getFullYear() } :
  latest.half === 'H1' ?
  { half: 'H2' as const, year: latest.year } :
  { half: 'H1' as const, year: latest.year + 1 };

  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [half, setHalf] = useState<'H1' | 'H2'>(suggestion.half);
  const [year, setYear] = useState(String(suggestion.year));
  const [error, setError] = useState('');

  const expected = expectedEvaluations(access);
  const submitted = evaluations.filter((e) => e.cycleId === activeCycle?.id && e.status === 'submitted');
  const submittedKeys = new Set(submitted.map((e) => `${e.evaluatorId}:${e.evaluateeId}`));
  const missing = expected.filter((p) => !submittedKeys.has(`${p.evaluatorId}:${p.evaluateeId}`));
  const unscored = new Set(expected.map((p) => p.evaluateeId));
  submitted.forEach((e) => unscored.delete(e.evaluateeId));
  const drafts = evaluations.filter((e) => e.cycleId === activeCycle?.id && e.status === 'draft').length;

  const report = (failure: string | null, success: string) =>
  pushToast(failure ? { title: failure, tone: 'danger' } : { title: success, tone: 'success' });

  const columns: Column<EvaluationCycle>[] = [
  { key: 'name', header: 'Cycle', sortable: true, pinned: true, value: (c) => c.name, render: (c) => <span className="font-medium text-fg">{c.name}</span> },
  {
    key: 'period',
    header: 'Period',
    sortable: true,
    value: (c) => c.startDate,
    render: (c) =>
    <span className="whitespace-nowrap text-xs text-fgmuted">
          {formatDate(c.startDate)} → {formatDate(c.endDate)}
        </span>

  },
  { key: 'status', header: 'Status', sortable: true, value: (c) => c.status, render: (c) => <StatusPill status={c.status} /> },
  {
    key: 'closed',
    header: 'Results published',
    value: (c) => c.closedAt ?? '',
    render: (c) =>
    c.closedAt ?
    <span className="flex items-center gap-1 whitespace-nowrap text-sm text-fgmuted">
          <LockIcon size={11} /> {formatDate(c.closedAt)}
        </span> :

    <span className="text-fgsubtle">—</span>

  },
  {
    key: 'action',
    header: '',
    align: 'right',
    render: (c) =>
    c.status === 'upcoming' ?
    <Button size="small" variant="secondary" onClick={() => report(activateCycle(c.id), `${c.name} is open for scoring`)}>
          Open for scoring
        </Button> :
    c.status === 'active' ?
    <Button size="small" variant="destructive" onClick={() => setCloseOpen(true)}>
          Close cycle
        </Button> :
    null
  }];


  return (
    <>
      <PageHeader
        breadcrumb={['HR & management', 'Cycles']}
        title="Evaluation cycles"
        description="One cycle every six months. Only one cycle is open at a time; closing it locks every score and publishes the results."
        actions={
        <Button
          size="small"
          leftIcon={<PlusIcon size={14} />}
          onClick={() => {
            setHalf(suggestion.half);
            setYear(String(suggestion.year));
            setError('');
            setCreateOpen(true);
          }}>
          
            New cycle
          </Button>
        } />
      

      {activeCycle &&
      <Panel
        title={`Active cycle · ${activeCycle.name}`}
        description={`${formatDate(activeCycle.startDate)} → ${formatDate(activeCycle.endDate)}`}
        className="mb-4"
        actions={
        <Button size="small" variant="destructive" onClick={() => setCloseOpen(true)}>
              Close cycle
            </Button>
        }>
        
          <div className="mb-1 flex items-center justify-between">
            <span className="mono-label">Evaluations submitted</span>
            <span className="font-mono text-xs text-fgmuted">
              {expected.length - missing.length} / {expected.length}
            </span>
          </div>
          <ScoreBar value={expected.length - missing.length} max={Math.max(1, expected.length)} tone="info" showValue={false} />
        </Panel>
      }

      <DataTable
        columns={columns}
        rows={[...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))}
        rowKey={(c) => c.id}
        searchable={false} />
      

      <Dialog isOpen={createOpen} onClose={() => setCreateOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">New evaluation cycle</h2>
          <p className="text-xs text-fgmuted">
            H1 runs 1 Jan – 30 Jun, H2 runs 1 Jul – 31 Dec. The cycle starts as upcoming until you
            open it for scoring.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Half"
              options={[
              { value: 'H1', label: 'H1 (Jan – Jun)' },
              { value: 'H2', label: 'H2 (Jul – Dec)' }]
              }
              value={half}
              onChange={(v: unknown) => setHalf(v as 'H1' | 'H2')} />
            
            <Input label="Year" type="number" value={year} onChange={(e: ChangeEvent<HTMLInputElement>) => setYear(e.target.value)} />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const failure = createCycle(half, Number(year));
              if (failure) {
                setError(failure);
                return;
              }
              pushToast({ title: `${half} ${year} created`, tone: 'success' });
              setCreateOpen(false);
            }}>
            
            Create cycle
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={closeOpen && !!activeCycle} onClose={() => setCloseOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Close {activeCycle?.name}?</h2>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-fg">
            Closing locks every evaluation, calculates final scores and publishes results to
            employees and management. This cannot be undone.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className={missing.length > 0 ? 'text-danger' : 'text-fgmuted'}>
              {missing.length} expected evaluation{missing.length === 1 ? ' has' : 's have'} not been submitted
            </li>
            <li className={unscored.size > 0 ? 'text-danger' : 'text-fgmuted'}>
              {unscored.size} employee{unscored.size === 1 ? '' : 's'} would be published without any score
            </li>
            <li className="text-fgmuted">
              {drafts} draft{drafts === 1 ? '' : 's'} will be discarded from the results
            </li>
          </ul>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCloseOpen(false)}>
            Keep open
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (activeCycle) report(closeCycle(activeCycle.id), `${activeCycle.name} closed · results published`);
              setCloseOpen(false);
            }}>
            
            Close cycle & publish
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}
