import React, { useState } from 'react';
import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { OrgNode, OrgNodeType } from '../lib/types';
import { cn, initials, uid } from '../lib/utils';

const TYPE_LABEL: Record<OrgNodeType, string> = {
  company: 'Company',
  branch: 'Branch',
  division: 'Division',
  department: 'Department',
  team: 'Team'
};

export function OrganizationPage() {
  const { orgNodes, setOrgNodes, users, setUsers, userById, pushToast, logAction } = useApp();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('org-6');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUser, setTransferUser] = useState('u-11');
  const [transferTarget, setTransferTarget] = useState('org-11');
  const [nodeOpen, setNodeOpen] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState<OrgNodeType>('team');
  const [nodeParent, setNodeParent] = useState('org-6');

  const roots = orgNodes.filter((n) => n.parentId === null);
  const childrenOf = (id: string) => orgNodes.filter((n) => n.parentId === id);
  const membersOf = (id: string) => users.filter((u) => u.orgNodeId === id);
  const selectedNode = orgNodes.find((n) => n.id === selected);

  const isDescendant = (candidate: string, ancestor: string): boolean => {
    let node = orgNodes.find((n) => n.id === candidate);
    while (node?.parentId) {
      if (node.parentId === ancestor) return true;
      node = orgNodes.find((n) => n.id === node!.parentId);
    }
    return false;
  };

  const reparent = (childId: string, parentId: string) => {
    if (childId === parentId || isDescendant(parentId, childId)) {
      pushToast({ title: 'Invalid move', description: 'A node cannot be nested inside itself.', tone: 'danger' });
      return;
    }
    setOrgNodes((prev) => prev.map((n) => n.id === childId ? { ...n, parentId } : n));
    const child = orgNodes.find((n) => n.id === childId);
    const parent = orgNodes.find((n) => n.id === parentId);
    logAction('Moved org node', 'Organization', `${child?.name} → ${parent?.name}`, 'warning');
    pushToast({ title: 'Hierarchy updated', description: `${child?.name} now reports into ${parent?.name}.`, tone: 'success' });
  };

  const renderNode = (node: OrgNode, depth: number): React.ReactNode => {
    const kids = childrenOf(node.id);
    const isCollapsed = collapsed.includes(node.id);
    const head = userById(node.headId);
    return (
      <li key={node.id}>
        <div
          draggable
          onDragStart={() => setDragId(node.id)}
          onDragEnd={() => {
            setDragId(null);
            setDropId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDropId(node.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId) reparent(dragId, node.id);
            setDragId(null);
            setDropId(null);
          }}
          onClick={() => setSelected(node.id)}
          className={cn(
            'group flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5',
            selected === node.id ? 'border-linestrong bg-surface2' : 'border-transparent hover:bg-surface2',
            dropId === node.id && dragId !== node.id && 'border-dashed border-linestrong bg-accentsoft',
            dragId === node.id && 'opacity-50'
          )}
          style={{ marginLeft: depth * 18 }}>
          
          <GripVerticalIcon size={13} className="shrink-0 text-fgsubtle opacity-0 group-hover:opacity-100" />
          {kids.length > 0 ?
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => c.includes(node.id) ? c.filter((x) => x !== node.id) : [...c, node.id]);
            }}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            className="shrink-0 text-fgsubtle hover:text-fg">
            
              {isCollapsed ? <ChevronRightIcon size={13} /> : <ChevronDownIcon size={13} />}
            </button> :

          <span className="w-[13px]" />
          }
          <BuildingIcon size={13} className="shrink-0 text-fgsubtle" />
          <span className="min-w-0 flex-1 truncate text-sm text-fg">{node.name}</span>
          <span className="hidden shrink-0 font-mono text-2xs uppercase tracking-wider text-fgsubtle sm:inline">
            {TYPE_LABEL[node.type]}
          </span>
          {head &&
          <span className="hidden h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-[9px] text-fgmuted sm:flex">
              {initials(head.name)}
            </span>
          }
          <span className="w-8 shrink-0 text-right font-mono text-2xs text-fgsubtle">
            {membersOf(node.id).length}
          </span>
        </div>
        {!isCollapsed && kids.length > 0 &&
        <ul className="mt-0.5 space-y-0.5">{kids.map((k) => renderNode(k, depth + 1))}</ul>
        }
      </li>);

  };

  return (
    <>
      <PageHeader
        breadcrumb={['Administration', 'Organization']}
        title="Organization management"
        description="Company, branch, division, department and team hierarchy. Drag any node onto another to re-parent it."
        actions={
        <>
            <Button variant="secondary" size="small" onClick={() => setTransferOpen(true)}>
              Transfer employee
            </Button>
            <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setNodeOpen(true)}>
              Add unit
            </Button>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title="Organization chart" description="Drag to restructure · click to inspect">
          <ul className="space-y-0.5">{roots.map((r) => renderNode(r, 0))}</ul>
        </Panel>

        <div className="space-y-4">
          {selectedNode &&
          <Panel title={selectedNode.name} description={`${TYPE_LABEL[selectedNode.type]} · ${selectedNode.code}`}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-fgmuted">Reports into</dt>
                  <dd className="text-fg">
                    {orgNodes.find((n) => n.id === selectedNode.parentId)?.name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fgmuted">Head</dt>
                  <dd className="text-fg">{userById(selectedNode.headId)?.name ?? 'Unassigned'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fgmuted">Direct members</dt>
                  <dd className="font-mono text-fg">{membersOf(selectedNode.id).length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fgmuted">Sub-units</dt>
                  <dd className="font-mono text-fg">{childrenOf(selectedNode.id).length}</dd>
                </div>
              </dl>
            </Panel>
          }

          <Panel title="Members" description="Direct members of the selected unit" bodyClassName="p-2">
            {membersOf(selected).length === 0 ?
            <p className="px-2 py-6 text-center text-sm text-fgmuted">No direct members.</p> :

            <ul className="space-y-0.5">
                {membersOf(selected).map((u) =>
              <li key={u.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-[9px] text-fg">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{u.name}</span>
                      <span className="block truncate font-mono text-2xs text-fgsubtle">{u.position}</span>
                    </span>
                  </li>
              )}
              </ul>
            }
          </Panel>

          <Panel title="Positions & job titles" bodyClassName="p-3">
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(users.map((u) => u.position))).map((p) =>
              <span key={p} className="rounded border border-dashed border-line px-2 py-0.5 font-mono text-2xs text-fgmuted">
                  {p}
                </span>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <Dialog isOpen={transferOpen} onClose={() => setTransferOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Transfer employee</h2>
          <p className="text-xs text-fgmuted">
            History and previous KPI cycles are preserved; only future assignments follow the new unit.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Select
              label="Employee"
              searchable
              options={users.map((u) => ({ value: u.id, label: `${u.name} · ${u.position}` }))}
              value={transferUser}
              onChange={(v) => setTransferUser(v as string)} />
            
            <Select
              label="Destination unit"
              options={orgNodes.map((o) => ({ value: o.id, label: `${o.name} (${TYPE_LABEL[o.type]})` }))}
              value={transferTarget}
              onChange={(v) => setTransferTarget(v as string)} />
            
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setTransferOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setUsers((prev) =>
              prev.map((u) => u.id === transferUser ? { ...u, orgNodeId: transferTarget } : u)
              );
              const name = userById(transferUser)?.name;
              const dest = orgNodes.find((o) => o.id === transferTarget)?.name;
              logAction('Transferred employee', 'Organization', `${name} → ${dest}`, 'warning');
              pushToast({ title: 'Employee transferred', description: `${name} moved to ${dest}.`, tone: 'success' });
              setTransferOpen(false);
            }}>
            
            Transfer
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={nodeOpen} onClose={() => setNodeOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Add organizational unit</h2>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Input label="Unit name" value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="Data Platform Team" />
            <Select
              label="Type"
              options={(Object.keys(TYPE_LABEL) as OrgNodeType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
              value={nodeType}
              onChange={(v) => setNodeType(v as OrgNodeType)} />
            
            <Select
              label="Parent unit"
              options={orgNodes.map((o) => ({ value: o.id, label: o.name }))}
              value={nodeParent}
              onChange={(v) => setNodeParent(v as string)} />
            
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setNodeOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!nodeName.trim()) return;
              const node: OrgNode = {
                id: uid('org'),
                name: nodeName,
                type: nodeType,
                parentId: nodeParent,
                code: nodeName.slice(0, 3).toUpperCase()
              };
              setOrgNodes((prev) => [...prev, node]);
              logAction('Created org unit', 'Organization', node.name);
              pushToast({ title: 'Unit created', tone: 'success' });
              setNodeName('');
              setNodeOpen(false);
            }}>
            
            Create unit
          </Button>
        </DialogFooter>
      </Dialog>

      <Panel title="Reporting lines" description="Manager to direct report mapping" className="mt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.
          filter((u) => users.some((r) => r.managerId === u.id)).
          map((manager) =>
          <div key={manager.id} className="rounded border border-line p-3">
                <div className="flex items-center gap-2">
                  <UsersIcon size={13} className="text-fgsubtle" />
                  <span className="text-sm font-medium text-fg">{manager.name}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {users.
              filter((r) => r.managerId === manager.id).
              map((r) =>
              <li key={r.id} className="flex items-center justify-between text-xs">
                        <span className="text-fgmuted">{r.name}</span>
                        <span className="font-mono text-2xs text-fgsubtle">{r.employeeId}</span>
                      </li>
              )}
                </ul>
              </div>
          )}
        </div>
      </Panel>
    </>);

}