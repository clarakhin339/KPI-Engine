import { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import type { Employee, ReviewSummary, ScoreBand } from '../lib/types';
import { download, fullName, toCsv } from '../lib/utils';

interface Row {
  employee: Employee;
  summary: ReviewSummary;
  band: ScoreBand | undefined;
  byRole: Record<string, number | null>;
}

export function ReportsPage() {
  const {
    cycles,
    employees,
    evaluations,
    roles,
    branches,
    teams,
    bands,
    summaryFor,
    bandById,
    branchById,
    teamById,
    rankById,
    pushToast,
    logAction
  } = useApp();

  const reportable = cycles.
  filter((c) => c.status !== 'upcoming').
  sort((a, b) => b.startDate.localeCompare(a.startDate));
  const [cycleId, setCycleId] = useState(
    (reportable.find((c) => c.status === 'closed') ?? reportable[0])?.id ?? ''
  );
  const [branchFilter, setBranchFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [bandFilter, setBandFilter] = useState('all');

  const cycle = reportable.find((c) => c.id === cycleId);
  const scoringRoles = roles.filter((r) => r.capabilities.includes('score'));

  const allRows: Row[] = !cycle ?
  [] :
  employees.
  filter((e) => !e.external && e.hireDate <= cycle.endDate).
  map((employee) => {
    const summary = summaryFor(cycle.id, employee.id);
    const entries = evaluations.filter(
      (e) => e.cycleId === cycle.id && e.evaluateeId === employee.id && e.status === 'submitted'
    );
    const byRole = Object.fromEntries(
      scoringRoles.map((role) => {
        const scores = entries.filter((e) => e.roleId === role.id).map((e) => e.score);
        return [
        role.id,
        scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null];

      })
    );
    return { employee, summary, band: bandById(summary.bandId), byRole };
  }).
  filter((r) => r.employee.status === 'active' || r.summary.evaluationCount > 0);

  const rows = allRows.filter(
    (r) =>
    (branchFilter === 'all' || r.employee.branchId === branchFilter) && (
    teamFilter === 'all' || r.employee.teamId === teamFilter) && (
    bandFilter === 'all' || (bandFilter === 'none' ? !r.band : r.band?.id === bandFilter))
  );
  const scored = rows.filter((r) => r.summary.finalScore !== null);
  const average = scored.length ?
  (scored.reduce((sum, r) => sum + (r.summary.finalScore ?? 0), 0) / scored.length).toFixed(1) :
  '—';

  const exportCsv = () => {
    if (!cycle) return;
    download(
      `kpi-summary-${cycle.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      toCsv(
        rows.map((r) => ({
          cycle: cycle.name,
          employee_id: r.employee.employeeCode,
          employee: fullName(r.employee),
          branch: branchById(r.employee.branchId)?.name ?? '',
          team: teamById(r.employee.teamId)?.name ?? '',
          rank: rankById(r.employee.rankId)?.name ?? '',
          ...Object.fromEntries(scoringRoles.map((role) => [role.name, r.byRole[role.id] ?? ''])),
          final_score: r.summary.finalScore ?? '',
          band: r.band?.label ?? '',
          evaluations: r.summary.evaluationCount,
          deductions: r.summary.deductionCount
        }))
      )
    );
    logAction('Exported cycle summary', 'Reports', `${cycle.name} · ${rows.length} records`);
    pushToast({ title: 'Export ready', description: 'CSV downloaded — opens in Excel.', tone: 'success' });
  };

  const columns: Column<Row>[] = [
  {
    key: 'employee',
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
  { key: 'branch', header: 'Branch', sortable: true, value: (r) => branchById(r.employee.branchId)?.name ?? '' },
  { key: 'team', header: 'Team', sortable: true, value: (r) => teamById(r.employee.teamId)?.name ?? '' },
  { key: 'rank', header: 'Rank', sortable: true, value: (r) => rankById(r.employee.rankId)?.name ?? '', defaultHidden: true },
  ...scoringRoles.map(
    (role): Column<Row> => ({
      key: `role-${role.id}`,
      header: role.name,
      align: 'right',
      sortable: true,
      value: (r) => r.byRole[role.id] ?? -1,
      render: (r) => <span className="font-mono text-sm text-fgmuted">{r.byRole[role.id] ?? '—'}</span>
    })
  ),
  {
    key: 'final',
    header: 'Final',
    align: 'right',
    sortable: true,
    value: (r) => r.summary.finalScore ?? -1,
    render: (r) => <span className="font-mono text-sm font-semibold text-fg">{r.summary.finalScore ?? '—'}</span>
  },
  {
    key: 'band',
    header: 'Band',
    sortable: true,
    value: (r) => r.band?.label ?? '',
    render: (r) => r.band ? <StatusPill status={r.band.label} tone={r.band.tone} /> : <span className="text-fgsubtle">—</span>
  },
  {
    key: 'deductions',
    header: 'Deductions',
    align: 'right',
    sortable: true,
    value: (r) => r.summary.deductionCount,
    render: (r) =>
    <span className={r.summary.deductionCount > 0 ? 'font-mono text-sm text-danger' : 'font-mono text-sm text-fgsubtle'}>
          {r.summary.deductionCount}
        </span>

  }];


  return (
    <>
      <PageHeader
        breadcrumb={['HR & management', 'Reports']}
        title="Cycle summary"
        description="Final score and bonus band per employee. The final score is the average of all submitted evaluator scores."
        meta={
        cycle && (
        cycle.status === 'closed' ?
        <StatusPill status="Published" tone="positive" /> :

        <StatusPill status="In progress · provisional" tone="warning" />)

        }
        actions={
        <>
            <div className="w-56">
              <Select
              options={reportable.map((c) => ({
                value: c.id,
                label: c.status === 'active' ? `${c.name} (in progress)` : c.name
              }))}
              value={cycleId}
              onChange={(v: unknown) => setCycleId(v as string)} />
            
            </div>
            <Button size="small" leftIcon={<DownloadIcon size={14} />} onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </>
        } />
      

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard label="Average final score" value={average} hint={`${scored.length} of ${rows.length} scored`} />
        {bands.map((band) =>
        <StatCard
          key={band.id}
          label={band.label}
          value={String(rows.filter((r) => r.band?.id === band.id).length)}
          hint={`${band.minScore}–${band.maxScore}`} />

        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.employee.id}
        searchPlaceholder="Search by name or employee ID…"
        searchValue={(r) => `${fullName(r.employee)} ${r.employee.employeeCode}`}
        pageSize={15}
        groupOptions={[
        { key: 'branch', label: 'Branch', get: (r) => branchById(r.employee.branchId)?.name ?? 'Unassigned' },
        { key: 'team', label: 'Team', get: (r) => teamById(r.employee.teamId)?.name ?? 'Unassigned' },
        { key: 'band', label: 'Band', get: (r) => r.band?.label ?? 'Not scored' }]
        }
        filters={
        <>
            <div className="w-44">
              <Select
              options={[{ value: 'all', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              value={branchFilter}
              onChange={(v: unknown) => {
                setBranchFilter(v as string);
                setTeamFilter('all');
              }} />
            
            </div>
            <div className="w-48">
              <Select
              key={branchFilter}
              options={[
              { value: 'all', label: 'All teams' },
              ...teams.
              filter((t) => branchFilter === 'all' || t.branchId === branchFilter).
              map((t) => ({ value: t.id, label: t.name }))]
              }
              value={teamFilter}
              onChange={(v: unknown) => setTeamFilter(v as string)} />
            
            </div>
            <div className="w-40">
              <Select
              options={[
              { value: 'all', label: 'All bands' },
              ...bands.map((b) => ({ value: b.id, label: b.label })),
              { value: 'none', label: 'Not scored' }]
              }
              value={bandFilter}
              onChange={(v: unknown) => setBandFilter(v as string)} />
            
            </div>
          </>
        } />
      
    </>);

}
