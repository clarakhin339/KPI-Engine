import React, { useState } from 'react';
import { ArrowDownIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import type { Workflow, WorkflowStep } from '../lib/types';
import { cn, uid } from '../lib/utils';

export function WorkflowsPage() {
  const { workflows, setWorkflows, roles, pushToast, logAction } = useApp();
  const [selectedId, setSelectedId] = useState(workflows[0].id);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const workflow = workflows.find((w) => w.id === selectedId) ?? workflows[0];

  const patch = (updater: (w: Workflow) => Workflow) =>
  setWorkflows((prev) => prev.map((w) => w.id === workflow.id ? updater(w) : w));

  const patchStep = (stepId: string, updater: (s: WorkflowStep) => WorkflowStep) =>
  patch((w) => ({ ...w, steps: w.steps.map((s) => s.id === stepId ? updater(s) : s) }));

  const move = (from: number, to: number) =>
  patch((w) => {
    const steps = [...w.steps];
    const [item] = steps.splice(from, 1);
    steps.splice(to, 0, item);
    return { ...w, steps };
  });

  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Approval workflow']}
        title="Multi-level approval"
        description="Unlimited approval levels. Drag to reorder, set SLAs, and control who may override scores."
        actions={
        <Button
          size="small"
          leftIcon={<PlusIcon size={14} />}
          onClick={() => {
            const created: Workflow = {
              id: uid('w'),
              name: 'New workflow',
              description: 'Custom approval chain',
              active: false,
              steps: []
            };
            setWorkflows((prev) => [...prev, created]);
            setSelectedId(created.id);
          }}>
          
            New workflow
          </Button>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="Workflows" bodyClassName="p-2">
          <ul className="space-y-0.5">
            {workflows.map((w) =>
            <li key={w.id}>
                <button
                onClick={() => setSelectedId(w.id)}
                className={cn(
                  'w-full rounded px-2 py-2 text-left',
                  w.id === selectedId ? 'bg-accentsoft' : 'hover:bg-surface2'
                )}>
                
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-fg">{w.name}</span>
                    <StatusPill status={w.active ? 'active' : 'draft'} />
                  </span>
                  <span className="mt-0.5 block font-mono text-2xs text-fgsubtle">
                    {w.steps.length} levels
                  </span>
                </button>
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Workflow details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Name" value={workflow.name} onChange={(e) => patch((w) => ({ ...w, name: e.target.value }))} />
              <Input label="Description" value={workflow.description} onChange={(e) => patch((w) => ({ ...w, description: e.target.value }))} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={workflow.active}
                onChange={(e) => patch((w) => ({ ...w, active: e.target.checked }))} />
              
              Active — available for template assignment
            </label>
          </Panel>

          <Panel
            title="Approval chain"
            description="Each level must complete before the next is notified"
            actions={
            <Button
              size="small"
              variant="secondary"
              leftIcon={<PlusIcon size={13} />}
              onClick={() =>
              patch((w) => ({
                ...w,
                steps: [
                ...w.steps,
                { id: uid('ws'), name: `Level ${w.steps.length + 1}`, roleId: 'r-5', slaDays: 3, canOverrideScore: false, optional: false }]

              }))
              }>
              
                Add level
              </Button>
            }>
            
            {workflow.steps.length === 0 &&
            <p className="py-8 text-center text-sm text-fgmuted">
                No approval levels yet. Add the first level to start the chain.
              </p>
            }
            <ol className="space-y-2">
              {workflow.steps.map((step, index) =>
              <li key={step.id}>
                  <div
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
                    setDragIndex(null);
                  }}
                  className={cn(
                    'rounded border border-line bg-surface p-3',
                    dragIndex === index && 'opacity-50'
                  )}>
                  
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon size={13} className="cursor-grab text-fgsubtle" />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-linestrong font-mono text-2xs text-fg">
                        {index + 1}
                      </span>
                      <input
                      value={step.name}
                      aria-label="Level name"
                      onChange={(e) => patchStep(step.id, (s) => ({ ...s, name: e.target.value }))}
                      className="h-8 flex-1 rounded border border-line bg-surface px-2 text-sm text-fg" />
                    
                      <button
                      onClick={() => patch((w) => ({ ...w, steps: w.steps.filter((s) => s.id !== step.id) }))}
                      aria-label={`Delete ${step.name}`}
                      className="text-fgsubtle hover:text-danger">
                      
                        <Trash2Icon size={14} />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 pl-8 sm:grid-cols-3">
                      <Select
                      label="Approver role"
                      options={roles.map((r) => ({ value: r.id, label: r.name }))}
                      value={step.roleId}
                      onChange={(v) => patchStep(step.id, (s) => ({ ...s, roleId: v as string }))} />
                    
                      <Input
                      label="SLA (days)"
                      type="number"
                      value={String(step.slaDays)}
                      onChange={(e) => patchStep(step.id, (s) => ({ ...s, slaDays: Number(e.target.value) }))} />
                    
                      <div className="flex flex-col justify-end gap-1.5 pb-1">
                        <label className="flex items-center gap-2 text-sm text-fg">
                          <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={step.canOverrideScore}
                          onChange={(e) => patchStep(step.id, (s) => ({ ...s, canOverrideScore: e.target.checked }))} />
                        
                          Can override score
                        </label>
                        <label className="flex items-center gap-2 text-sm text-fg">
                          <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={step.optional}
                          onChange={(e) => patchStep(step.id, (s) => ({ ...s, optional: e.target.checked }))} />
                        
                          Optional level
                        </label>
                      </div>
                    </div>
                  </div>
                  {index < workflow.steps.length - 1 &&
                <div className="flex justify-center py-1">
                      <ArrowDownIcon size={14} className="text-fgsubtle" />
                    </div>
                }
                </li>
              )}
            </ol>
            <div className="mt-3 flex justify-end border-t border-line pt-3">
              <Button
                size="small"
                onClick={() => {
                  logAction('Updated approval workflow', 'Settings', workflow.name, 'warning');
                  pushToast({ title: 'Workflow saved', description: `${workflow.steps.length} levels`, tone: 'success' });
                }}>
                
                Save workflow
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>);

}