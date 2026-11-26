import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import type { AuditLog } from '../lib/types';
import { download, formatDateTime, initials, toCsv } from '../lib/utils';

export function AuditLogsPage() {
  const { auditLogs, userById, pushToast } = useApp();
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
    value: (l) => userById(l.actorId)?.name ?? '',
    render: (l) =>
    <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-[9px] text-fg">
            {initials(userById(l.actorId)?.name ?? '?')}
          </span>
          <span className="truncate text-sm text-fg">{userById(l.actorId)?.name}</span>
        </div>

  },
  { key: 'action', header: 'Action', sortable: true, value: (l) => l.action },
  { key: 'module', header: 'Module', sortable: true, value: (l) => l.module, render: (l) =>
    <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">{l.module}</span>
  },
  { key: 'entity', header: 'Entity', value: (l) => l.entity, render: (l) =>
    <span className="font-mono text-xs text-fgmuted">{l.entity}</span>
  },
  { key: 'ip', header: 'IP address', value: (l) => l.ip, render: (l) =>
    <span className="font-mono text-xs text-fgsubtle">{l.ip}</span>,
    defaultHidden: true },
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
    <>
      <PageHeader
        breadcrumb={['Administration', 'Audit logs']}
        title="Audit trail"
        description="Append-only record of authentication, configuration, score and approval events."
        actions={
        <Button
          variant="secondary"
          size="small"
          leftIcon={<DownloadIcon size={14} />}
          onClick={() => {
            download('audit-log.csv', toCsv(rows.map((l) => ({ ...l, actor: userById(l.actorId)?.name ?? '' }))));
            pushToast({ title: 'Audit log exported', tone: 'success' });
          }}>
          
            Export
          </Button>
        } />
      

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Events (30 days)" value={String(auditLogs.length)} hint="all modules" />
        <StatCard
          label="Critical events"
          value={String(auditLogs.filter((l) => l.severity === 'critical').length)}
          hint="require review" />
        
        <StatCard
          label="Score overrides"
          value={String(auditLogs.filter((l) => l.action.toLowerCase().includes('overrode')).length)}
          hint="reviewer adjustments" />
        
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        searchPlaceholder="Search actions, entities or actors…"
        searchValue={(l) => `${l.action} ${l.entity} ${l.module} ${userById(l.actorId)?.name}`}
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
              onChange={(v) => setSeverity(v as string)} />
            
            </div>
            <div className="w-48">
              <Select
              options={[{ value: 'all', label: 'All modules' }, ...modules.map((m) => ({ value: m, label: m }))]}
              value={module}
              onChange={(v) => setModule(v as string)} />
            
            </div>
          </>
        } />
      
    </>);

}