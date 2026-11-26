import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { DataTable, type Column } from '../components/common/DataTable';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { EvaluationDrawer } from '../components/evaluation/EvaluationDrawer';
import { useApp } from '../lib/store';
import { canEditEvaluation, scoringLabel } from '../lib/permissions';
import { bandFor } from '../lib/scoring';
import type { Employee, Evaluation, Tone } from '../lib/types';
import { cn, formatDate, fullName } from '../lib/utils';

const toneText: Record<Tone, string> = {
  positive: 'text-positive',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-fg'
};

interface Row {
  employee: Employee;
  mine: Evaluation | undefined;
  status: 'not-started' | 'draft' | 'submitted';
  action: string;
}

export function ScoreTeamPage() {
  const { me, access, scorable, evaluations, activeCycle, teams, teamById, rankById, positionById, bands } =
  useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const title = scoringLabel(access, me);

  if (!activeCycle) {
    return (
      <>
        <PageHeader breadcrumb={['My work', title]} title={title} />
        <Panel dashed>
          <p className="py-8 text-center text-sm text-fgmuted">
            No evaluation cycle is open right now. Scoring becomes available when HR opens the next
            cycle.
          </p>
        </Panel>
      </>);

  }

  const rows: Row[] = scorable.map((employee) => {
    const mine = evaluations.find(
      (e) =>
      e.cycleId === activeCycle.id && e.evaluateeId === employee.id && e.evaluatorId === me.id
    );
    const editable = !mine || canEditEvaluation(access, me.id, mine, activeCycle);
    return {
      employee,
      mine,
      status: mine?.status ?? 'not-started',
      action: !mine ? 'Score' : editable ? 'Edit' : 'View'
    };
  });
  const submitted = rows.filter((r) => r.status === 'submitted').length;
  const drafts = rows.filter((r) => r.status === 'draft').length;
  const teamIds = Array.from(new Set(rows.map((r) => r.employee.teamId)));
  const filtered = rows.filter(
    (r) =>
    (teamFilter === 'all' || r.employee.teamId === teamFilter) && (
    statusFilter === 'all' || r.status === statusFilter)
  );

  const columns: Column<Row>[] = [
  {
    key: 'name',
    header: 'Employee',
    sortable: true,
    pinned: true,
    value: (r) => fullName(r.employee),
    render: (r) =>
    <div className="min-w-0">
          <p className="truncate font-medium text-fg">{fullName(r.employee)}</p>
          <p className="truncate font-mono text-2xs text-fgsubtle">{r.employee.employeeCode}</p>
        </div>

  },
  { key: 'team', header: 'Team', sortable: true, value: (r) => teamById(r.employee.teamId)?.name ?? '' },
  { key: 'rank', header: 'Rank', sortable: true, value: (r) => rankById(r.employee.rankId)?.name ?? '' },
  { key: 'position', header: 'Position', sortable: true, value: (r) => positionById(r.employee.positionId)?.title ?? '' },
  {
    key: 'score',
    header: 'My score',
    align: 'right',
    sortable: true,
    value: (r) => r.mine?.score ?? -1,
    render: (r) => {
      const band = r.mine ? bandFor(bands, r.mine.score) : undefined;
      return (
        <span className={cn('font-mono text-sm font-semibold', band ? toneText[band.tone] : 'text-fgsubtle')}>
            {r.mine ? r.mine.score : '—'}
            {r.mine?.isDeduction && <span className="ml-1.5 text-danger" title="Marked as deduction">●</span>}
          </span>);

    }

  },
  { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
  {
    key: 'action',
    header: '',
    align: 'right',
    render: (r) =>
    <Button
      size="small"
      variant={r.action === 'Score' ? 'primary' : 'secondary'}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(r.employee.id);
      }}>
      
          {r.action}
        </Button>

  }];


  return (
    <>
      <PageHeader
        breadcrumb={['My work', title]}
        title={title}
        description="Give each person one score and a dated comment. Drafts stay private until you submit."
        meta={
        <>
            <StatusPill status={activeCycle.name} tone="positive" />
            <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
              Closes {formatDate(activeCycle.endDate)}
            </span>
          </>
        } />
      

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-sm text-fg">
            <span className="font-mono text-xl font-semibold">{submitted}</span>
            <span className="text-fgmuted"> / {rows.length} submitted</span>
            {drafts > 0 && <span className="text-fgmuted"> · {drafts} draft{drafts > 1 ? 's' : ''}</span>}
          </p>
          <div className="min-w-[160px] flex-1">
            <ScoreBar
              value={submitted}
              max={Math.max(1, rows.length)}
              tone={submitted === rows.length && rows.length > 0 ? 'positive' : 'info'}
              showValue={false} />
            
          </div>
        </div>
      </Panel>

      <div className="mb-3 flex flex-wrap gap-2">
        {teamIds.length > 1 &&
        <div className="w-52">
            <Select
            options={[
            { value: 'all', label: 'All teams' },
            ...teams.filter((t) => teamIds.includes(t.id)).map((t) => ({ value: t.id, label: t.name }))]
            }
            value={teamFilter}
            onChange={(v: unknown) => setTeamFilter(v as string)} />
          
          </div>
        }
        <div className="w-44">
          <Select
            options={[
            { value: 'all', label: 'All statuses' },
            { value: 'not-started', label: 'Not started' },
            { value: 'draft', label: 'Draft' },
            { value: 'submitted', label: 'Submitted' }]
            }
            value={statusFilter}
            onChange={(v: unknown) => setStatusFilter(v as string)} />
          
        </div>
      </div>

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.employee.id}
          onRowClick={(r) => setSelectedId(r.employee.id)}
          searchPlaceholder="Search by name or employee ID…"
          searchValue={(r) => `${fullName(r.employee)} ${r.employee.employeeCode}`}
          pageSize={15}
          emptyMessage="No employees match the current filters." />
        
      </div>

      <ul className="space-y-2 sm:hidden">
        {filtered.length === 0 &&
        <li className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-fgmuted">
            No employees match the current filters.
          </li>
        }
        {filtered.map((r) =>
        <li key={r.employee.id}>
            <button
            onClick={() => setSelectedId(r.employee.id)}
            className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left">
            
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{fullName(r.employee)}</span>
                <span className="block truncate text-xs text-fgmuted">
                  {[rankById(r.employee.rankId)?.name, teamById(r.employee.teamId)?.name].filter(Boolean).join(' · ')}
                </span>
                <span className="mt-1.5 block">
                  <StatusPill status={r.status} />
                </span>
              </span>
              <span className="font-mono text-xl text-fg">{r.mine ? r.mine.score : '—'}</span>
            </button>
          </li>
        )}
      </ul>

      <EvaluationDrawer
        employee={scorable.find((e) => e.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)} />
      
    </>);

}
