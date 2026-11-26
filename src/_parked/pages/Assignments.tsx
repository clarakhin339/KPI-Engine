import React, { useState } from 'react';
import { CalendarClockIcon, CopyIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { AssignTargetType, Assignment } from '../lib/types';
import { formatDate, uid } from '../lib/utils';

const TARGETS: {value: AssignTargetType;label: string;}[] = [
{ value: 'employee', label: 'Individual employee' },
{ value: 'team', label: 'Team' },
{ value: 'department', label: 'Department' },
{ value: 'position', label: 'Position' }];


export function AssignmentsPage() {
  const { assignments, setAssignments, templates, cycles, users, orgNodes, pushToast, logAction } =
  useApp();
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<AssignTargetType>('department');
  const [targetId, setTargetId] = useState('org-6');
  const [templateId, setTemplateId] = useState('t-1');
  const [cycleId, setCycleId] = useState('cy-1');
  const [dueDate, setDueDate] = useState('2026-10-07');
  const [schedule, setSchedule] = useState(false);

  const targetOptions =
  targetType === 'employee' ?
  users.map((u) => ({ value: u.id, label: `${u.name} · ${u.position}` })) :
  targetType === 'position' ?
  Array.from(new Set(users.map((u) => u.position))).map((p) => ({ value: p, label: p })) :
  orgNodes.
  filter((o) => targetType === 'team' ? o.type === 'team' : o.type === 'department').
  map((o) => ({ value: o.id, label: o.name }));

  const labelFor = (value: string) => targetOptions.find((o) => o.value === value)?.label ?? value;

  const estimated =
  targetType === 'employee' ?
  1 :
  targetType === 'position' ?
  users.filter((u) => u.position === targetId).length :
  users.filter((u) => u.orgNodeId === targetId).length;

  const columns: Column<Assignment>[] = [
  {
    key: 'template',
    header: 'Template',
    sortable: true,
    pinned: true,
    value: (a) => templates.find((t) => t.id === a.templateId)?.title ?? '',
    render: (a) => {
      const t = templates.find((x) => x.id === a.templateId);
      return (
        <div className="min-w-0">
            <p className="truncate font-medium text-fg">{t?.title}</p>
            <p className="truncate font-mono text-2xs text-fgsubtle">{t?.version}</p>
          </div>);

    }
  },
  { key: 'cycle', header: 'Cycle', sortable: true, value: (a) => cycles.find((c) => c.id === a.cycleId)?.name ?? '' },
  {
    key: 'target',
    header: 'Assigned to',
    sortable: true,
    value: (a) => a.targetLabel,
    render: (a) =>
    <div className="min-w-0">
          <p className="truncate text-sm text-fg">{a.targetLabel}</p>
          <p className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">{a.targetType}</p>
        </div>

  },
  { key: 'count', header: 'Assignees', align: 'right', sortable: true, value: (a) => a.assigneeCount, render: (a) =>
    <span className="font-mono text-sm text-fgmuted">{a.assigneeCount}</span>
  },
  { key: 'due', header: 'Due', sortable: true, value: (a) => a.dueDate, render: (a) => formatDate(a.dueDate) },
  { key: 'created', header: 'Created', sortable: true, value: (a) => a.createdAt, render: (a) => formatDate(a.createdAt), defaultHidden: true },
  { key: 'status', header: 'Status', sortable: true, value: (a) => a.status, render: (a) => <StatusPill status={a.status} /> },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (a) =>
    <Button
      size="small"
      variant="tertiary"
      leftIcon={<CopyIcon size={13} />}
      onClick={() => {
        setAssignments((prev) => [
        { ...a, id: uid('a'), status: 'scheduled', createdAt: new Date().toISOString().slice(0, 10) },
        ...prev]
        );
        logAction('Cloned assignment', 'KPI Assignment', a.targetLabel);
        pushToast({ title: 'Assignment cloned', tone: 'success' });
      }}>
      
          Clone
        </Button>

  }];


  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Assignments']}
        title="KPI assignment"
        description="Distribute templates to employees, teams, departments or positions — individually, in bulk or on a schedule."
        actions={
        <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setOpen(true)}>
            New assignment
          </Button>
        } />
      

      <DataTable
        columns={columns}
        rows={assignments}
        rowKey={(a) => a.id}
        selectable
        searchPlaceholder="Search assignments…"
        searchValue={(a) => `${a.targetLabel} ${a.targetType}`}
        groupOptions={[
        { key: 'cycle', label: 'Cycle', get: (a) => cycles.find((c) => c.id === a.cycleId)?.name ?? '' },
        { key: 'status', label: 'Status', get: (a) => a.status }]
        }
        bulkActions={(ids, clear) =>
        <>
            <Button
            size="small"
            variant="secondary"
            onClick={() => {
              setAssignments((prev) =>
              prev.map((a) => ids.includes(a.id) ? { ...a, status: 'active' } : a)
              );
              pushToast({ title: `${ids.length} assignments activated`, tone: 'success' });
              clear();
            }}>
            
              Activate
            </Button>
            <Button
            size="small"
            variant="destructive"
            onClick={() => {
              setAssignments((prev) => prev.filter((a) => !ids.includes(a.id)));
              logAction('Deleted assignments', 'KPI Assignment', `${ids.length} records`, 'critical');
              clear();
            }}>
            
              Delete
            </Button>
          </>
        } />
      

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="lg">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Assign KPI template</h2>
          <p className="text-xs text-fgmuted">
            Assignments snapshot the template version so later edits never mutate historical scores.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Template"
              options={templates.filter((t) => t.status === 'published').map((t) => ({ value: t.id, label: `${t.title} · ${t.version}` }))}
              value={templateId}
              onChange={(v) => setTemplateId(v as string)} />
            
            <Select
              label="Cycle"
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
              value={cycleId}
              onChange={(v) => setCycleId(v as string)} />
            
            <Select
              label="Assign by"
              options={TARGETS}
              value={targetType}
              onChange={(v) => {
                const next = v as AssignTargetType;
                setTargetType(next);
                setTargetId(
                  next === 'employee' ?
                  'u-11' :
                  next === 'position' ?
                  'Software Engineer' :
                  next === 'team' ?
                  'org-10' :
                  'org-6'
                );
              }} />
            
            <Select
              label="Target"
              searchable
              options={targetOptions}
              value={targetId}
              onChange={(v) => setTargetId(v as string)} />
            
            <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <label className="flex items-end gap-2 pb-2 text-sm text-fg">
              <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1">
                <CalendarClockIcon size={13} /> Schedule instead of assigning now
              </span>
            </label>
          </div>
          <div className="mt-3 rounded border border-dashed border-linestrong p-3">
            <p className="mono-label">Preview</p>
            <p className="mt-1 text-sm text-fg">
              {estimated} employee{estimated === 1 ? '' : 's'} will receive{' '}
              <strong>{templates.find((t) => t.id === templateId)?.title}</strong> for{' '}
              <strong>{cycles.find((c) => c.id === cycleId)?.name}</strong>.
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const assignment: Assignment = {
                id: uid('a'),
                templateId,
                cycleId,
                targetType,
                targetLabel: labelFor(targetId),
                assigneeCount: estimated,
                dueDate,
                status: schedule ? 'scheduled' : 'active',
                createdAt: new Date().toISOString().slice(0, 10)
              };
              setAssignments((prev) => [assignment, ...prev]);
              logAction('Assigned KPI', 'KPI Assignment', `${assignment.targetLabel} · ${estimated} employees`);
              pushToast({
                title: schedule ? 'Assignment scheduled' : 'Assignment created',
                description: `${estimated} employees notified.`,
                tone: 'success'
              });
              setOpen(false);
            }}>
            
            {schedule ? 'Schedule' : 'Assign now'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}