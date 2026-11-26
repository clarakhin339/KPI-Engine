import React, { useState } from 'react';
import { DownloadIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { useApp } from '../lib/store';
import type { User } from '../lib/types';
import { download, formatDate, initials, toCsv, uid } from '../lib/utils';

const EMPTY: Omit<User, 'id'> = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  orgNodeId: 'org-6',
  position: 'Software Engineer',
  jobTitle: 'Software Engineer',
  managerId: 'u-3',
  employmentType: 'Full-time',
  joinDate: new Date().toISOString().slice(0, 10),
  status: 'invited',
  roleId: 'r-7'
};

export function UsersPage() {
  const { users, setUsers, roles, orgNodes, orgById, pushToast, logAction } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<User, 'id'>>(EMPTY);

  const filtered = users.filter(
    (u) =>
    (statusFilter === 'all' || u.status === statusFilter) && (
    deptFilter === 'all' || u.orgNodeId === deptFilter)
  );

  const setStatus = (ids: string[], status: User['status'], clear: () => void) => {
    setUsers((prev) => prev.map((u) => ids.includes(u.id) ? { ...u, status } : u));
    logAction(status === 'active' ? 'Activated users' : 'Deactivated users', 'Users', `${ids.length} records`, 'warning');
    pushToast({ title: `${ids.length} user${ids.length > 1 ? 's' : ''} ${status === 'active' ? 'activated' : 'deactivated'}`, tone: 'success' });
    clear();
  };

  const exportCsv = () => {
    download(
      'users.csv',
      toCsv(
        filtered.map((u) => ({
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          department: orgById(u.orgNodeId)?.name ?? '',
          position: u.position,
          employmentType: u.employmentType,
          joinDate: u.joinDate,
          status: u.status
        }))
      )
    );
    logAction('Exported users', 'Users', `${filtered.length} records`);
    pushToast({ title: 'Export ready', description: 'users.csv downloaded', tone: 'success' });
  };

  const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Employee',
    sortable: true,
    pinned: true,
    value: (u) => u.name,
    render: (u) =>
    <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-2xs text-fg">
            {initials(u.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">{u.name}</span>
            <span className="block truncate font-mono text-2xs text-fgsubtle">{u.email}</span>
          </span>
        </div>

  },
  { key: 'employeeId', header: 'Employee ID', sortable: true, value: (u) => u.employeeId, render: (u) => <span className="font-mono text-xs text-fgmuted">{u.employeeId}</span> },
  { key: 'department', header: 'Department', sortable: true, value: (u) => orgById(u.orgNodeId)?.name ?? '' },
  { key: 'position', header: 'Position', sortable: true, value: (u) => u.position },
  {
    key: 'manager',
    header: 'Manager',
    value: (u) => users.find((m) => m.id === u.managerId)?.name ?? '—',
    defaultHidden: true
  },
  { key: 'employmentType', header: 'Type', sortable: true, value: (u) => u.employmentType },
  { key: 'phone', header: 'Phone', value: (u) => u.phone, defaultHidden: true },
  { key: 'joinDate', header: 'Join date', sortable: true, value: (u) => u.joinDate, render: (u) => formatDate(u.joinDate) },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    value: (u) => roles.find((r) => r.id === u.roleId)?.name ?? '',
    render: (u) =>
    <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">
          {roles.find((r) => r.id === u.roleId)?.name}
        </span>

  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    value: (u) => u.status,
    render: (u) => <StatusPill status={u.status} />
  }];


  return (
    <>
      <PageHeader
        breadcrumb={['Administration', 'Users']}
        title="User management"
        description="Directory of every person in the KPI engine, their reporting line and access role."
        actions={
        <>
            <Button variant="secondary" size="small" leftIcon={<UploadIcon size={14} />} onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button variant="secondary" size="small" leftIcon={<DownloadIcon size={14} />} onClick={exportCsv}>
              Export
            </Button>
            <Button
            size="small"
            leftIcon={<PlusIcon size={14} />}
            onClick={() => {
              setDraft(EMPTY);
              setOpen(true);
            }}>
            
              Add user
            </Button>
          </>
        } />
      

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(u) => u.id}
        selectable
        searchPlaceholder="Search by name, email or employee ID…"
        searchValue={(u) => `${u.name} ${u.email} ${u.employeeId} ${u.position}`}
        groupOptions={[
        { key: 'dept', label: 'Department', get: (u) => orgById(u.orgNodeId)?.name ?? 'Unassigned' },
        { key: 'role', label: 'Role', get: (u) => roles.find((r) => r.id === u.roleId)?.name ?? '—' },
        { key: 'type', label: 'Employment type', get: (u) => u.employmentType }]
        }
        filters={
        <>
            <div className="w-40">
              <Select
              options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'invited', label: 'Invited' }]
              }
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as string)} />
            
            </div>
            <div className="w-48">
              <Select
              options={[
              { value: 'all', label: 'All departments' },
              ...orgNodes.
              filter((o) => o.type === 'department' || o.type === 'team').
              map((o) => ({ value: o.id, label: o.name }))]
              }
              value={deptFilter}
              onChange={(v) => setDeptFilter(v as string)} />
            
            </div>
          </>
        }
        bulkActions={(ids, clear) =>
        <>
            <Button size="small" variant="secondary" onClick={() => setStatus(ids, 'active', clear)}>
              Activate
            </Button>
            <Button size="small" variant="secondary" onClick={() => setStatus(ids, 'inactive', clear)}>
              Deactivate
            </Button>
            <Button
            size="small"
            variant="destructive"
            onClick={() => {
              setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
              logAction('Deleted users', 'Users', `${ids.length} records`, 'critical');
              pushToast({ title: `${ids.length} users removed`, tone: 'danger' });
              clear();
            }}>
            
              Delete
            </Button>
          </>
        } />
      

      <Dialog isOpen={open} onClose={() => setOpen(false)} size="lg">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Add user</h2>
          <p className="text-xs text-fgmuted">
            The employee is invited by email and inherits the selected role’s permissions.
          </p>
        </DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Employee ID" value={draft.employeeId} onChange={(e) => setDraft({ ...draft, employeeId: e.target.value })} placeholder="EMP-1019" />
            <Input label="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            <Input label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Select
              label="Department / Team"
              options={orgNodes.filter((o) => o.type === 'department' || o.type === 'team').map((o) => ({ value: o.id, label: o.name }))}
              value={draft.orgNodeId}
              onChange={(v) => setDraft({ ...draft, orgNodeId: v as string })} />
            
            <Input label="Position" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value, jobTitle: e.target.value })} />
            <Select
              label="Reporting manager"
              searchable
              options={users.map((u) => ({ value: u.id, label: `${u.name} · ${u.position}` }))}
              value={draft.managerId ?? ''}
              onChange={(v) => setDraft({ ...draft, managerId: v as string })} />
            
            <Select
              label="Employment type"
              options={['Full-time', 'Part-time', 'Contract', 'Intern', 'Probation'].map((t) => ({ value: t, label: t }))}
              value={draft.employmentType}
              onChange={(v) => setDraft({ ...draft, employmentType: v as User['employmentType'] })} />
            
            <Input label="Join date" type="date" value={draft.joinDate} onChange={(e) => setDraft({ ...draft, joinDate: e.target.value })} />
            <Select
              label="Access role"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              value={draft.roleId}
              onChange={(v) => setDraft({ ...draft, roleId: v as string })} />
            
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!draft.name || !draft.email) {
                pushToast({ title: 'Name and email are required', tone: 'danger' });
                return;
              }
              const user: User = { ...draft, id: uid('u') };
              setUsers((prev) => [user, ...prev]);
              logAction('Created user', 'Users', `${user.name} (${user.employeeId})`);
              pushToast({ title: 'User invited', description: `${user.name} will receive a verification email.`, tone: 'success' });
              setOpen(false);
            }}>
            
            Create user
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={importOpen} onClose={() => setImportOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Import users</h2>
        </DialogHeader>
        <DialogContent>
          <div className="rounded border border-dashed border-linestrong p-8 text-center">
            <UploadIcon size={20} className="mx-auto mb-2 text-fgsubtle" />
            <p className="text-sm text-fg">Drop a CSV or XLSX file here</p>
            <p className="mt-1 text-xs text-fgmuted">
              Required columns: employee_id, name, email, department, position, role
            </p>
          </div>
          <p className="mt-3 text-xs text-fgmuted">
            Rows are validated before commit; conflicting employee IDs are reported without partial
            writes.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setImportOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setImportOpen(false);
              pushToast({ title: 'Import queued', description: 'You will be notified when validation completes.', tone: 'success' });
            }}>
            
            Validate & import
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}