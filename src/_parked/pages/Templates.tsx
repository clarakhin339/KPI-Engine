import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CopyIcon, PencilRulerIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { KpiTemplate } from '../lib/types';
import { formatDate, uid } from '../lib/utils';

export function TemplatesPage() {
  const { templates, setTemplates, orgNodes, orgById, userById, scales, workflows, pushToast, logAction } =
  useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    orgNodeId: 'org-6',
    position: 'Software Engineer',
    scaleId: 's-1',
    workflowId: 'w-1'
  });

  const rows = templates.filter((t) => status === 'all' || t.status === status);

  const duplicate = (t: KpiTemplate) => {
    const copy: KpiTemplate = {
      ...t,
      id: uid('t'),
      title: `${t.title} (copy)`,
      status: 'draft',
      version: 'v0.1',
      updatedAt: new Date().toISOString().slice(0, 10),
      sections: t.sections.map((s) => ({
        ...s,
        id: uid('sec'),
        fields: s.fields.map((f) => ({ ...f, id: uid('f') }))
      }))
    };
    setTemplates((prev) => [copy, ...prev]);
    logAction('Duplicated template', 'KPI Templates', copy.title);
    pushToast({ title: 'Template duplicated', tone: 'success' });
  };

  const columns: Column<KpiTemplate>[] = [
  {
    key: 'title',
    header: 'Template',
    sortable: true,
    pinned: true,
    value: (t) => t.title,
    render: (t) =>
    <div className="min-w-0">
          <p className="truncate font-medium text-fg">{t.title}</p>
          <p className="truncate text-xs text-fgmuted">{t.description}</p>
        </div>

  },
  { key: 'version', header: 'Version', sortable: true, value: (t) => t.version, render: (t) => <span className="font-mono text-xs text-fgmuted">{t.version}</span> },
  { key: 'scope', header: 'Scope', value: (t) => orgById(t.orgNodeId)?.name ?? 'Global' },
  { key: 'position', header: 'Position', sortable: true, value: (t) => t.position },
  {
    key: 'structure',
    header: 'Structure',
    value: (t) => t.sections.length,
    render: (t) =>
    <span className="font-mono text-xs text-fgmuted">
          {t.sections.length} sections · {t.sections.reduce((s, x) => s + x.fields.length, 0)} items
        </span>

  },
  { key: 'scale', header: 'Rating scale', value: (t) => scales.find((s) => s.id === t.scaleId)?.name ?? '', defaultHidden: true },
  { key: 'workflow', header: 'Workflow', value: (t) => workflows.find((w) => w.id === t.workflowId)?.name ?? '', defaultHidden: true },
  { key: 'updated', header: 'Updated', sortable: true, value: (t) => t.updatedAt, render: (t) =>
    <span className="text-xs text-fgmuted">
        {formatDate(t.updatedAt)} · {userById(t.updatedBy)?.name.split(' ')[0]}
      </span>
  },
  { key: 'status', header: 'Status', sortable: true, value: (t) => t.status, render: (t) => <StatusPill status={t.status} /> },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (t) =>
    <div className="flex justify-end gap-1">
          <Button
        size="small"
        variant="tertiary"
        iconOnly={<CopyIcon size={14} />}
        aria-label={`Duplicate ${t.title}`}
        onClick={(e) => {
          e.stopPropagation();
          duplicate(t);
        }} />
      
          <Button
        size="small"
        variant="secondary"
        leftIcon={<PencilRulerIcon size={13} />}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/templates/${t.id}/builder`);
        }}>
        
            Build
          </Button>
        </div>

  }];


  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Templates']}
        title="KPI templates"
        description="Versioned scorecard definitions. Publishing a template makes it available to assignments."
        actions={
        <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setOpen(true)}>
            New template
          </Button>
        } />
      

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        onRowClick={(t) => navigate(`/templates/${t.id}/builder`)}
        searchPlaceholder="Search templates…"
        searchValue={(t) => `${t.title} ${t.description} ${t.position}`}
        groupOptions={[
        { key: 'status', label: 'Status', get: (t) => t.status },
        { key: 'scope', label: 'Scope', get: (t) => orgById(t.orgNodeId)?.name ?? 'Global' }]
        }
        filters={
        <div className="w-40">
            <Select
            options={[
            { value: 'all', label: 'All statuses' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' }]
            }
            value={status}
            onChange={(v) => setStatus(v as string)} />
          
          </div>
        } />
      

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">New KPI template</h2>
          <p className="text-xs text-fgmuted">
            Templates start as drafts. Structure is defined in the builder.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Marketing KPI" />
            <Input label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Select
              label="Department"
              options={[
              { value: '', label: 'Global (all departments)' },
              ...orgNodes.filter((o) => o.type === 'department').map((o) => ({ value: o.id, label: o.name }))]
              }
              value={draft.orgNodeId}
              onChange={(v) => setDraft({ ...draft, orgNodeId: v as string })} />
            
            <Input label="Position" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
            <Select
              label="Rating scale"
              options={scales.map((s) => ({ value: s.id, label: s.name }))}
              value={draft.scaleId}
              onChange={(v) => setDraft({ ...draft, scaleId: v as string })} />
            
            <Select
              label="Approval workflow"
              options={workflows.map((w) => ({ value: w.id, label: w.name }))}
              value={draft.workflowId}
              onChange={(v) => setDraft({ ...draft, workflowId: v as string })} />
            
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!draft.title.trim()) return;
              const template: KpiTemplate = {
                id: uid('t'),
                title: draft.title,
                description: draft.description || 'No description provided.',
                version: 'v0.1',
                status: 'draft',
                orgNodeId: draft.orgNodeId || null,
                position: draft.position,
                scaleId: draft.scaleId,
                workflowId: draft.workflowId,
                sections: [],
                updatedAt: new Date().toISOString().slice(0, 10),
                updatedBy: 'u-2'
              };
              setTemplates((prev) => [template, ...prev]);
              logAction('Created template', 'KPI Templates', template.title);
              setOpen(false);
              navigate(`/templates/${template.id}/builder`);
            }}>
            
            Create & open builder
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}