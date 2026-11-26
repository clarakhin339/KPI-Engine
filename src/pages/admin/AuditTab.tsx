import { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useApp } from '../../lib/store';
import type { AuditLog } from '../../lib/types';
import { download, formatDateTime, initials, toCsv } from '../../lib/utils';

export function AuditTab() {
  const { auditLogs, nameOf, employeeById, pushToast, logAction } = useApp();
  const [severity, setSeverity] = useState('all');
  const [module, setModule] = useState('all');

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));
  const rows = auditLogs.filter(
    (l) => (severity === 'all' || l.severity === severity) && (module === 'all' || l.module === module)
  );

  const columns: Column<AuditLog>[] = [
  {
    key: 'at',
    header: 'Timestamp',
    sortable: true,
    pinned: true,
    value: (l) => l.at,
    render: (l) => <span className="whitespace-nowrap font-mono text-xs text-fgmuted">{formatDateTime(l.at)}</span>
  },
  {
    key: 'actor',
    header: 'Actor',
    sortable: true,
    value: (l) => nameOf(l.actorId),
    render: (l) =>
    <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-[9px] text-fg">
          {initials(nameOf(l.actorId))}
        </span>
        <span className="truncate text-sm text-fg">{nameOf(l.actorId)}</span>
        {employeeById(l.actorId)?.external && <StatusPill status="external" tone="info" />}
      </div>

  },
  { key: 'action', header: 'Action', sortable: true, value: (l) => l.action },
  { key: 'module', header: 'Module', sortable: true, value: (l) => l.module, render: (l) =>
    <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">{l.module}</span>
  },
  { key: 'entity', header: 'Entity', value: (l) => l.entity, render: (l) =>
    <span className="font-mono text-xs text-fgmuted">{l.entity}</span>
  },
  {
    key: 'severity',
    header: 'Severity',
    sortable: true,
    value: (l) => l.severity,
    render: (l) =>
    <StatusPill
      status={l.severity}
      tone={l.severity === 'critical' ? 'danger' : l.severity === 'warning' ? 'warning' : 'info'} />


  }];


  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Audit trail</h2>
          <p className="mt-0.5 text-xs text-fgmuted">
            Record of sign-ins, configuration changes, score submissions and revisions.
          </p>
        </div>
        <Button
          variant="secondary"
          size="small"
          leftIcon={<DownloadIcon size={14} />}
          onClick={() => {
            download('audit-log.csv', toCsv(rows.map((l) => ({ ...l, actor: nameOf(l.actorId) }))));
            logAction('Exported audit log', 'Audit', `${rows.length} rows`);
            pushToast({ title: 'Audit log exported', tone: 'success' });
          }}>
          
          Export
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recorded events" value={String(auditLogs.length)} hint="since go-live" />
        <StatCard
          label="Warnings"
          value={String(auditLogs.filter((l) => l.severity === 'warning').length)}
          hint="config and role changes" />
        
        <StatCard
          label="Critical events"
          value={String(auditLogs.filter((l) => l.severity === 'critical').length)}
          hint="cycle closes & revisions" />
        
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        searchPlaceholder="Search actions, entities or actors…"
        searchValue={(l) => `${l.action} ${l.entity} ${l.module} ${nameOf(l.actorId)}`}
        pageSize={12}
        dense
        groupOptions={[
        { key: 'module', label: 'Module', get: (l) => l.module },
        { key: 'severity', label: 'Severity', get: (l) => l.severity }]
        }
        filters={
        <>
            <div className="w-40">
              <Select
              options={[
              { value: 'all', label: 'All severities' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'critical', label: 'Critical' }]
              }
              value={severity}
              onChange={(v: string) => setSeverity(v)} />
            
            </div>
            <div className="w-48">
              <Select
              options={[{ value: 'all', label: 'All modules' }, ...modules.map((m) => ({ value: m, label: m }))]}
              value={module}
              onChange={(v: string) => setModule(v)} />
            
            </div>
          </>
        } />
      
    </div>);

}
