import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatCard } from '../components/common/StatCard';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import type { Assessment } from '../lib/types';
import { formatDate, initials } from '../lib/utils';

export function ReviewsPage() {
  const { assessments, setAssessments, templates, cycles, userById, orgById, pushToast, logAction } =
  useApp();
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');

  const rows = assessments.filter((a) => status === 'all' || a.status === status);

  const pending = assessments.filter((a) => ['submitted', 'in-review'].includes(a.status)).length;
  const overdue = assessments.filter((a) => a.status === 'revision-requested').length;
  const approved = assessments.filter((a) => a.status === 'approved').length;

  const bulkApprove = (ids: string[], clear: () => void) => {
    setAssessments((prev) =>
    prev.map((a) =>
    ids.includes(a.id) ?
    {
      ...a,
      status: 'approved',
      finalScore: a.managerScore ?? a.selfScore,
      rating: 'Exceeds',
      currentStep: a.approvals.length,
      approvals: a.approvals.map((s) => ({ ...s, status: 'approved' as const }))
    } :
    a
    )
    );
    logAction('Bulk approved assessments', 'KPI Approval', `${ids.length} records`);
    pushToast({ title: `${ids.length} assessments approved`, tone: 'success' });
    clear();
  };

  const columns: Column<Assessment>[] = [
  {
    key: 'employee',
    header: 'Employee',
    sortable: true,
    pinned: true,
    value: (a) => userById(a.userId)?.name ?? '',
    render: (a) => {
      const u = userById(a.userId);
      return (
        <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-2xs text-fg">
              {initials(u?.name ?? '')}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-fg">{u?.name}</span>
              <span className="block truncate font-mono text-2xs text-fgsubtle">{u?.position}</span>
            </span>
          </div>);

    }
  },
  { key: 'department', header: 'Department', sortable: true, value: (a) => orgById(userById(a.userId)?.orgNodeId)?.name ?? '' },
  { key: 'template', header: 'Template', value: (a) => templates.find((t) => t.id === a.templateId)?.title ?? '' },
  { key: 'cycle', header: 'Cycle', value: (a) => cycles.find((c) => c.id === a.cycleId)?.name ?? '', defaultHidden: true },
  {
    key: 'step',
    header: 'Approval step',
    sortable: true,
    value: (a) => a.currentStep,
    render: (a) =>
    <span className="font-mono text-xs text-fgmuted">
          {Math.min(a.currentStep + 1, a.approvals.length)}/{a.approvals.length} ·{' '}
          {a.approvals[a.currentStep]?.stepName ?? 'Complete'}
        </span>

  },
  {
    key: 'self',
    header: 'Self',
    align: 'right',
    sortable: true,
    value: (a) => a.selfScore,
    render: (a) => <span className="font-mono text-sm text-fgmuted">{a.selfScore ? a.selfScore.toFixed(1) : '—'}</span>
  },
  {
    key: 'manager',
    header: 'Manager',
    align: 'right',
    sortable: true,
    value: (a) => a.managerScore ?? 0,
    render: (a) =>
    <span className="font-mono text-sm text-fg">{a.managerScore ? a.managerScore.toFixed(1) : '—'}</span>

  },
  {
    key: 'progress',
    header: 'Progress',
    width: '140px',
    value: (a) => a.currentStep,
    render: (a) =>
    <ScoreBar
      value={a.currentStep / a.approvals.length * 100}
      max={100}
      tone={a.status === 'approved' ? 'positive' : 'info'}
      showValue={false} />


  },
  { key: 'updated', header: 'Updated', sortable: true, value: (a) => a.updatedAt, render: (a) => formatDate(a.updatedAt), defaultHidden: true },
  { key: 'status', header: 'Status', sortable: true, value: (a) => a.status, render: (a) => <StatusPill status={a.status} /> }];


  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'Reviews & approvals']}
        title="Reviews & approvals"
        description="Every assessment routed to you, with its position in the multi-level approval chain." />
      

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending your review" value={String(pending)} hint="awaiting action" />
        <StatCard label="Revision requested" value={String(overdue)} hint="returned to employee" />
        <StatCard label="Approved this cycle" value={String(approved)} hint="fully signed off" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        selectable
        onRowClick={(a) => navigate(`/assessments/${a.id}`)}
        searchPlaceholder="Search by employee…"
        searchValue={(a) => `${userById(a.userId)?.name} ${userById(a.userId)?.position}`}
        groupOptions={[
        { key: 'status', label: 'Status', get: (a) => a.status },
        { key: 'dept', label: 'Department', get: (a) => orgById(userById(a.userId)?.orgNodeId)?.name ?? '' }]
        }
        filters={
        <div className="w-48">
            <Select
            options={[
            { value: 'all', label: 'All statuses' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'in-review', label: 'In review' },
            { value: 'revision-requested', label: 'Revision requested' },
            { value: 'approved', label: 'Approved' },
            { value: 'draft', label: 'Draft' },
            { value: 'not-started', label: 'Not started' }]
            }
            value={status}
            onChange={(v) => setStatus(v as string)} />
          
          </div>
        }
        bulkActions={(ids, clear) =>
        <>
            <Button size="small" variant="secondary" onClick={() => bulkApprove(ids, clear)}>
              Approve
            </Button>
            <Button
            size="small"
            variant="secondary"
            onClick={() => {
              setAssessments((prev) =>
              prev.map((a) => ids.includes(a.id) ? { ...a, status: 'revision-requested' } : a)
              );
              logAction('Requested revision', 'KPI Reviews', `${ids.length} records`);
              pushToast({ title: `${ids.length} sent back for revision`, tone: 'default' });
              clear();
            }}>
            
              Request revision
            </Button>
          </>
        } />
      
    </>);

}