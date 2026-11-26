import React, { useState } from 'react';
import {
  BuildingIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { DataTable, type Column } from '../components/common/DataTable';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import { calculateScore } from '../lib/formula';
import type { Assessment } from '../lib/types';
import { cn, download, toCsv } from '../lib/utils';

const REPORT_TYPES = [
{ id: 'employee', label: 'Employee report', description: 'Per-person scorecard with section breakdown, evidence and approval trail.', icon: <UsersIcon size={15} /> },
{ id: 'team', label: 'Team report', description: 'Squad-level aggregate with distribution and outliers.', icon: <UsersIcon size={15} /> },
{ id: 'department', label: 'Department report', description: 'Department roll-up including completion and calibration notes.', icon: <BuildingIcon size={15} /> },
{ id: 'company', label: 'Company report', description: 'Organization-wide performance summary for the board pack.', icon: <BuildingIcon size={15} /> },
{ id: 'summary', label: 'KPI summary', description: 'Every KPI item with target, actual and variance.', icon: <FileTextIcon size={15} /> },
{ id: 'performance', label: 'Performance report', description: 'Trend comparison across the last four cycles.', icon: <FileSpreadsheetIcon size={15} /> }];


export function ReportsPage() {
  const { assessments, templates, scales, cycles, userById, orgById, pushToast, logAction } = useApp();
  const [type, setType] = useState('department');
  const [cycleId, setCycleId] = useState('cy-1');

  const enriched = assessments.map((a) => {
    const template = templates.find((t) => t.id === a.templateId) ?? templates[0];
    const scale = scales.find((s) => s.id === template.scaleId) ?? scales[0];
    return { assessment: a, result: calculateScore(template, a.responses, scale) };
  });

  const exportAs = (format: 'PDF' | 'Excel' | 'CSV') => {
    if (format === 'CSV') {
      download(
        `${type}-report.csv`,
        toCsv(
          enriched.map(({ assessment, result }) => ({
            employee: userById(assessment.userId)?.name ?? '',
            department: orgById(userById(assessment.userId)?.orgNodeId)?.name ?? '',
            template: templates.find((t) => t.id === assessment.templateId)?.title ?? '',
            selfScore: assessment.selfScore,
            managerScore: assessment.managerScore ?? '',
            weighted: result.weighted,
            grade: result.grade,
            status: assessment.status
          }))
        )
      );
    }
    logAction(`Exported ${format} report`, 'Reports', `${type} · ${cycleId}`);
    pushToast({ title: `${format} export ready`, description: `${type} report`, tone: 'success' });
  };

  const columns: Column<{assessment: Assessment;result: ReturnType<typeof calculateScore>;}>[] = [
  {
    key: 'employee',
    header: 'Employee',
    sortable: true,
    pinned: true,
    value: (r) => userById(r.assessment.userId)?.name ?? '',
    render: (r) =>
    <div className="min-w-0">
          <p className="truncate font-medium text-fg">{userById(r.assessment.userId)?.name}</p>
          <p className="truncate font-mono text-2xs text-fgsubtle">
            {userById(r.assessment.userId)?.employeeId}
          </p>
        </div>

  },
  { key: 'dept', header: 'Department', sortable: true, value: (r) => orgById(userById(r.assessment.userId)?.orgNodeId)?.name ?? '' },
  { key: 'template', header: 'Template', value: (r) => templates.find((t) => t.id === r.assessment.templateId)?.title ?? '' },
  { key: 'self', header: 'Self', align: 'right', sortable: true, value: (r) => r.assessment.selfScore, render: (r) =>
    <span className="font-mono text-sm text-fgmuted">{r.assessment.selfScore.toFixed(1)}</span>
  },
  { key: 'weighted', header: 'Weighted', align: 'right', sortable: true, value: (r) => r.result.weighted, render: (r) =>
    <span className="font-mono text-sm text-fg">{r.result.weighted.toFixed(2)}</span>
  },
  { key: 'pct', header: 'Percent', align: 'right', sortable: true, value: (r) => r.result.percentage, render: (r) =>
    <span className="font-mono text-sm text-fgmuted">{r.result.percentage}%</span>
  },
  {
    key: 'band',
    header: 'Grade',
    sortable: true,
    value: (r) => r.result.grade,
    render: (r) => <StatusPill status={r.result.grade} tone={r.result.tone} />
  },
  {
    key: 'completion',
    header: 'Completion',
    width: '140px',
    value: (r) => r.result.completion,
    render: (r) => <ScoreBar value={r.result.completion} max={100} tone="info" showValue={false} />
  }];


  return (
    <>
      <PageHeader
        breadcrumb={['Insight', 'Reports']}
        title="Reports"
        description="Generate scoped performance reports and export them as PDF, Excel or CSV."
        actions={
        <>
            <div className="w-44">
              <Select
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
              value={cycleId}
              onChange={(v) => setCycleId(v as string)} />
            
            </div>
            <Button variant="secondary" size="small" leftIcon={<FileIcon size={14} />} onClick={() => exportAs('PDF')}>
              PDF
            </Button>
            <Button variant="secondary" size="small" leftIcon={<FileSpreadsheetIcon size={14} />} onClick={() => exportAs('Excel')}>
              Excel
            </Button>
            <Button size="small" leftIcon={<FileTextIcon size={14} />} onClick={() => exportAs('CSV')}>
              CSV
            </Button>
          </>
        } />
      

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((r) =>
        <button
          key={r.id}
          onClick={() => setType(r.id)}
          className={cn(
            'rounded-lg border p-4 text-left transition-colors',
            type === r.id ? 'border-linestrong bg-surface2' : 'border-line bg-surface hover:bg-surface2'
          )}>
          
            <span className="flex items-center gap-2 text-fgsubtle">{r.icon}</span>
            <p className="mt-2 text-sm font-medium text-fg">{r.label}</p>
            <p className="mt-0.5 text-xs text-fgmuted">{r.description}</p>
          </button>
        )}
      </div>

      <Panel
        title={REPORT_TYPES.find((r) => r.id === type)?.label}
        description={`${cycles.find((c) => c.id === cycleId)?.name} · ${enriched.length} records`}
        bodyClassName="p-0">
        
        <DataTable
          columns={columns}
          rows={enriched}
          rowKey={(r) => r.assessment.id}
          searchPlaceholder="Search report rows…"
          searchValue={(r) => userById(r.assessment.userId)?.name ?? ''}
          groupOptions={[
          { key: 'dept', label: 'Department', get: (r) => orgById(userById(r.assessment.userId)?.orgNodeId)?.name ?? '' },
          { key: 'grade', label: 'Grade', get: (r) => r.result.grade }]
          }
          pageSize={12} />
        
      </Panel>
    </>);

}