import React, { useState } from 'react';
import { LockIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import { ACTIONS, MODULES } from '../lib/mockData';
import type { DataScope, ModuleKey, PermissionAction, Role } from '../lib/types';
import { cn, uid } from '../lib/utils';

const SCOPES: {value: DataScope;label: string;hint: string;}[] = [
{ value: 'all', label: 'All records', hint: 'Company-wide visibility' },
{ value: 'department', label: 'Department', hint: 'Own department subtree only' },
{ value: 'team', label: 'Team', hint: 'Direct reports and team members' },
{ value: 'self', label: 'Self', hint: 'Own records only' }];


export function RolesPage() {
  const { roles, setRoles, pushToast, logAction } = useApp();
  const [selectedId, setSelectedId] = useState(roles[0].id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const role = roles.find((r) => r.id === selectedId) ?? roles[0];

  const toggle = (module: ModuleKey, action: PermissionAction) => {
    setRoles((prev) =>
    prev.map((r) => {
      if (r.id !== role.id) return r;
      const current = r.permissions[module] ?? [];
      const next = current.includes(action) ?
      current.filter((a) => a !== action) :
      [...current, action];
      return { ...r, permissions: { ...r.permissions, [module]: next } };
    })
    );
  };

  const toggleModuleAll = (module: ModuleKey) => {
    setRoles((prev) =>
    prev.map((r) => {
      if (r.id !== role.id) return r;
      const full = (r.permissions[module] ?? []).length === ACTIONS.length;
      return { ...r, permissions: { ...r.permissions, [module]: full ? [] : [...ACTIONS] } };
    })
    );
  };

  return (
    <>
      <PageHeader
        breadcrumb={['Administration', 'Roles & permissions']}
        title="Role based access control"
        description="Unlimited roles with module, action and data-scope permissions. No code changes required."
        actions={
        <Button size="small" leftIcon={<PlusIcon size={14} />} onClick={() => setOpen(true)}>
            New role
          </Button>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="Roles" bodyClassName="p-2">
          <ul className="space-y-0.5">
            {roles.map((r) =>
            <li key={r.id}>
                <button
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  'flex w-full items-start gap-2 rounded px-2 py-2 text-left',
                  r.id === selectedId ? 'bg-accentsoft' : 'hover:bg-surface2'
                )}>
                
                  <ShieldCheckIcon size={14} className="mt-0.5 shrink-0 text-fgsubtle" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-fg">{r.name}</span>
                      {r.isSystem && <LockIcon size={10} className="shrink-0 text-fgsubtle" />}
                    </span>
                    <span className="block font-mono text-2xs text-fgsubtle">
                      {r.memberCount} members · scope {r.dataScope}
                    </span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel
            title={role.name}
            description={role.description}
            actions={
            <div className="w-44">
                <Select
                options={SCOPES.map((s) => ({ value: s.value, label: `Scope: ${s.label}` }))}
                value={role.dataScope}
                onChange={(v) =>
                setRoles((prev) =>
                prev.map((r) => r.id === role.id ? { ...r, dataScope: v as DataScope } : r)
                )
                } />
              
              </div>
            }>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SCOPES.map((s) =>
              <div
                key={s.value}
                className={cn(
                  'rounded border p-2.5',
                  role.dataScope === s.value ?
                  'border-linestrong bg-surface2' :
                  'border-dashed border-line'
                )}>
                
                  <p className="text-sm font-medium text-fg">{s.label}</p>
                  <p className="mt-0.5 text-xs text-fgmuted">{s.hint}</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Permission matrix"
            description="Module, CRUD, API and button-level permissions"
            bodyClassName="p-0">
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface2">
                    <th className="px-3 py-2 text-left mono-label">Module</th>
                    {ACTIONS.map((a) =>
                    <th key={a} className="px-3 py-2 text-center mono-label">
                        {a}
                      </th>
                    )}
                    <th className="px-3 py-2 text-right mono-label">All</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => {
                    const granted = role.permissions[m.key] ?? [];
                    return (
                      <tr key={m.key} className="border-b border-line last:border-0">
                        <td className="px-3 py-2 text-sm text-fg">{m.label}</td>
                        {ACTIONS.map((a) =>
                        <td key={a} className="px-3 py-2 text-center">
                            <input
                            type="checkbox"
                            aria-label={`${m.label} ${a}`}
                            className="h-3.5 w-3.5"
                            checked={granted.includes(a)}
                            onChange={() => toggle(m.key, a)} />
                          
                          </td>
                        )}
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => toggleModuleAll(m.key)}
                            className="font-mono text-2xs uppercase tracking-wider text-fgmuted underline hover:text-fg">
                            
                            toggle
                          </button>
                        </td>
                      </tr>);

                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t border-line p-3">
              <Button
                size="small"
                onClick={() => {
                  logAction('Updated role permissions', 'Settings', role.name, 'warning');
                  pushToast({ title: 'Permissions saved', description: role.name, tone: 'success' });
                }}>
                
                Save permissions
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Create custom role</h2>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <Input label="Role name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Regional HR Partner" />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              const permissions = {} as Role['permissions'];
              MODULES.forEach((m) => {
                permissions[m.key] = [];
              });
              const role: Role = {
                id: uid('r'),
                name,
                description: description || 'Custom role',
                isSystem: false,
                dataScope: 'department',
                permissions,
                memberCount: 0
              };
              setRoles((prev) => [...prev, role]);
              setSelectedId(role.id);
              logAction('Created role', 'Settings', role.name);
              pushToast({ title: 'Role created', description: 'Assign permissions to activate it.', tone: 'success' });
              setName('');
              setDescription('');
              setOpen(false);
            }}>
            
            Create role
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}