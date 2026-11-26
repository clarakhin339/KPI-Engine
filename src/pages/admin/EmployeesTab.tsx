import { useMemo, useRef, useState } from 'react';
import { CrudTable, NONE } from '../../components/common/CrudTable';
import { Panel } from '../../components/common/Panel';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../../components/ui/Dialog';
import { useApp } from '../../lib/store';
import type { Employee } from '../../lib/types';
import { download, fullName, parseCsv, toCsv, uid } from '../../lib/utils';
import { removeById, upsert } from './shared';

const IMPORT_HEADERS = ['employee_code', 'first_name', 'last_name', 'email', 'team', 'rank', 'position', 'hire_date'];
const IMPORT_SAMPLE =
`employee_code,first_name,last_name,email,team,rank,position,hire_date
OCNG-040,Panadda,Yimyam,panadda.y@onecloudnextgen.com,Sales,Junior,Sales Officer,2024-02-19`;

interface ImportRow {
  row: number;
  employee: Employee;
  errors: string[];
}

export function EmployeesTab() {
  const {
    employees,
    teams,
    ranks,
    positions,
    assignments,
    evaluations,
    setEmployees,
    teamById,
    rankById,
    positionById,
    roleById,
    logAction,
    pushToast
  } = useApp();

  const [importing, setImporting] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ImportRow[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignments) {
      const role = roleById(a.roleId);
      if (!role) continue;
      const label = role.scope === 'global' ? role.name : `${role.name} · ${teamById(a.teamId)?.name ?? '?'}`;
      map.set(a.employeeId, [...(map.get(a.employeeId) ?? []), label]);
    }
    return map;
  }, [assignments, roleById, teamById]);

  const emailTaken = (email: string, exceptId?: string) =>
  employees.some((e) => e.id !== exceptId && e.email.trim().toLowerCase() === email.trim().toLowerCase());
  const codeTaken = (code: string, exceptId?: string) =>
  employees.some((e) => e.id !== exceptId && e.employeeCode.trim().toLowerCase() === code.trim().toLowerCase());

  const parseImport = (text: string) => {
    setHeaderError(null);
    const table = parseCsv(text);
    if (!table.length) {
      setParsed([]);
      return;
    }
    const headers = table[0].map((h) => h.trim().toLowerCase());
    const missing = IMPORT_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
      setHeaderError(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Expected: ${IMPORT_HEADERS.join(', ')}`);
      setParsed(null);
      return;
    }
    const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const seenCodes = new Set<string>();
    const seenEmails = new Set<string>();
    const rows: ImportRow[] = table.slice(1).
    filter((cells) => cells.some((c) => c.trim() !== '')).
    map((cells, i) => {
      const get = (h: string) => (cells[idx[h]] ?? '').trim();
      const errors: string[] = [];
      const team = teams.find((t) => t.name.toLowerCase() === get('team').toLowerCase());
      const rank = ranks.find((r) => r.name.toLowerCase() === get('rank').toLowerCase());
      const position = positions.find((p) => p.title.toLowerCase() === get('position').toLowerCase());
      const code = get('employee_code');
      const email = get('email');
      if (!code) errors.push('employee_code is empty');
      else if (codeTaken(code) || seenCodes.has(code.toLowerCase())) errors.push('duplicate employee_code');
      if (!get('first_name')) errors.push('first_name is empty');
      if (!email.includes('@')) errors.push('invalid email');
      else if (emailTaken(email) || seenEmails.has(email.toLowerCase())) errors.push('duplicate email');
      if (!team) errors.push(`unknown team "${get('team')}"`);
      if (!rank) errors.push(`unknown rank "${get('rank')}"`);
      if (!position) errors.push(`unknown position "${get('position')}"`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(get('hire_date'))) errors.push('hire_date must be YYYY-MM-DD');
      seenCodes.add(code.toLowerCase());
      seenEmails.add(email.toLowerCase());
      return {
        row: i + 2,
        errors,
        employee: {
          id: uid('e'),
          employeeCode: code,
          firstName: get('first_name'),
          lastName: get('last_name'),
          email,
          positionId: position?.id ?? null,
          rankId: rank?.id ?? null,
          teamId: team?.id ?? null,
          branchId: team?.branchId ?? null,
          hireDate: get('hire_date'),
          status: 'active',
          external: false
        }
      };
    });
    setParsed(rows);
  };

  const importable = parsed?.filter((r) => r.errors.length === 0) ?? [];
  const runImport = () => {
    const toAdd = importable.map((r) => r.employee);
    setEmployees([...employees, ...toAdd]);
    logAction('Imported employees', 'Employees', `${toAdd.length} row${toAdd.length > 1 ? 's' : ''} from CSV`);
    pushToast({ title: `Imported ${toAdd.length} employee${toAdd.length > 1 ? 's' : ''}.`, tone: 'success' });
    setImporting(false);
    setCsvText('');
    setParsed(null);
  };

  const exportCsv = () => {
    const rows = employees.map((e) => ({
      employee_code: e.employeeCode,
      name: fullName(e),
      email: e.email,
      team: teamById(e.teamId)?.name ?? '',
      rank: rankById(e.rankId)?.name ?? '',
      position: positionById(e.positionId)?.title ?? '',
      hire_date: e.hireDate,
      status: e.status
    }));
    download('employees.csv', toCsv(rows));
    logAction('Exported employee list', 'Employees', `${employees.length} rows`);
  };

  return (
    <>
      <CrudTable<Employee>
        title="Employees"
        description="Everyone who can sign in or be evaluated. Deactivate leavers instead of deleting them so history stays intact."
        noun="employee"
        rows={employees}
        toolbarActions={
        <>
            <Button variant="secondary" size="small" onClick={exportCsv}>Export CSV</Button>
            <Button variant="secondary" size="small" onClick={() => setImporting(true)}>Import CSV</Button>
          </>
        }
        describe={(e) => fullName(e)}
        blank={() => ({
          id: uid('e'),
          employeeCode: '',
          firstName: '',
          lastName: '',
          email: '',
          positionId: positions[0]?.id ?? null,
          rankId: ranks[0]?.id ?? null,
          teamId: teams[0]?.id ?? null,
          branchId: teams[0]?.branchId ?? null,
          hireDate: new Date().toISOString().slice(0, 10),
          status: 'active',
          external: false
        })}
        searchValue={(e) => `${fullName(e)} ${e.employeeCode} ${e.email} ${teamById(e.teamId)?.name}`}
        columns={[
        {
          key: 'name',
          header: 'Employee',
          sortable: true,
          pinned: true,
          value: (e) => fullName(e),
          render: (e) =>
          <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium text-fg">
                  {fullName(e)}
                  {e.external && <StatusPill status="external" tone="info" />}
                </p>
                <p className="truncate font-mono text-2xs text-fgsubtle">{e.email}</p>
              </div>

        },
        { key: 'code', header: 'Code', sortable: true, value: (e) => e.employeeCode, render: (e) => <span className="font-mono text-xs">{e.employeeCode}</span> },
        { key: 'team', header: 'Team', sortable: true, value: (e) => teamById(e.teamId)?.name ?? '' },
        { key: 'rank', header: 'Rank', sortable: true, value: (e) => rankById(e.rankId)?.name ?? '' },
        { key: 'position', header: 'Position', sortable: true, value: (e) => positionById(e.positionId)?.title ?? '' },
        {
          key: 'roles',
          header: 'Roles',
          value: (e) => (assignmentsByEmployee.get(e.id) ?? []).join(', '),
          render: (e) => {
            const list = assignmentsByEmployee.get(e.id) ?? [];
            return list.length ?
            <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">{list.join('  ·  ')}</span> :
            <span className="text-fgsubtle">—</span>;
          }
        },
        { key: 'status', header: 'Status', sortable: true, value: (e) => e.status, render: (e) => <StatusPill status={e.status} tone={e.status === 'active' ? 'positive' : 'danger'} /> }]
        }
        fields={[
        { key: 'employeeCode', label: 'Employee code' },
        { key: 'hireDate', label: 'Hire date', type: 'date' },
        { key: 'firstName', label: 'First name' },
        { key: 'lastName', label: 'Last name' },
        { key: 'email', label: 'Email', type: 'email', wide: true },
        {
          key: 'teamId',
          label: 'Team',
          type: 'select',
          nullable: true,
          options: [{ value: NONE, label: 'No team (external)' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]
        },
        { key: 'rankId', label: 'Rank', type: 'select', nullable: true, options: [{ value: NONE, label: 'None' }, ...ranks.map((r) => ({ value: r.id, label: r.name }))] },
        { key: 'positionId', label: 'Position', type: 'select', nullable: true, options: [{ value: NONE, label: 'None' }, ...positions.map((p) => ({ value: p.id, label: p.title }))] },
        { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        {
          key: 'external',
          label: 'External evaluator (e.g. a customer — no team or rank needed)',
          type: 'checkbox',
          wide: true
        }]
        }
        onSave={(employee, isNew) => {
          if (!employee.employeeCode.trim()) return 'Employee code is required.';
          if (!employee.firstName.trim()) return 'First name is required.';
          if (!employee.email.includes('@')) return 'Enter a valid email address.';
          if (codeTaken(employee.employeeCode, employee.id)) return 'This employee code is already used.';
          if (emailTaken(employee.email, employee.id)) return 'This email is already used.';
          let cleaned: Employee = { ...employee, employeeCode: employee.employeeCode.trim(), firstName: employee.firstName.trim(), lastName: employee.lastName.trim(), email: employee.email.trim() };
          if (cleaned.external) {
            cleaned = { ...cleaned, teamId: null, branchId: null, rankId: null, positionId: null };
          } else {
            const team = teamById(cleaned.teamId);
            if (!team) return 'Choose a team (or mark the person as external).';
            cleaned = { ...cleaned, branchId: team.branchId };
          }
          upsert(setEmployees, cleaned, isNew);
          logAction(isNew ? 'Added employee' : 'Updated employee', 'Employees', fullName(cleaned));
          return null;
        }}
        onDelete={(employee) => {
          if (evaluations.some((ev) => ev.evaluatorId === employee.id || ev.evaluateeId === employee.id)) {
            return 'This employee already has evaluation records — deactivate them instead of deleting.';
          }
          if (assignments.some((a) => a.employeeId === employee.id)) return 'Remove their role assignments first.';
          removeById(setEmployees, employee.id);
          logAction('Deleted employee', 'Employees', fullName(employee), 'warning');
          return null;
        }} />
      

      <Dialog isOpen={importing} onClose={() => setImporting(false)} size="lg">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Import employees from CSV</h2>
          <p className="mt-0.5 text-xs text-fgmuted">
            Columns: {IMPORT_HEADERS.join(', ')}. Team, rank and position must match the names configured in Admin.
          </p>
        </DialogHeader>
        <DialogContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="text-xs text-fgmuted file:mr-3 file:rounded file:border file:border-line file:bg-inset file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-fg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const text = String(reader.result ?? '');
                  setCsvText(text);
                  parseImport(text);
                };
                reader.readAsText(file);
              }} />
            
            <Button variant="secondary" size="small" onClick={() => { setCsvText(IMPORT_SAMPLE); parseImport(IMPORT_SAMPLE); }}>
              Load sample
            </Button>
          </div>
          <textarea
            className="h-32 w-full rounded border border-line bg-card p-2.5 font-mono text-xs text-fg focus:border-primary focus:outline-none"
            placeholder="…or paste CSV text here"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            onBlur={() => { if (csvText.trim()) parseImport(csvText); }} />
          
          {headerError && <Panel dashed className="border-danger/50 text-sm text-danger">{headerError}</Panel>}
          {parsed &&
          <>
              <p className="text-sm text-fgmuted">
                {parsed.length} row{parsed.length !== 1 ? 's' : ''} found — {importable.length} ready to import
                {parsed.length - importable.length > 0 ? `, ${parsed.length - importable.length} with errors` : ''}.
              </p>
              <div className="max-h-64 overflow-auto rounded border border-line">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-inset text-left font-mono uppercase tracking-wider text-fgsubtle">
                    <tr>
                      <th className="px-2 py-1.5">Row</th>
                      <th className="px-2 py-1.5">Code</th>
                      <th className="px-2 py-1.5">Name</th>
                      <th className="px-2 py-1.5">Team</th>
                      <th className="px-2 py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((r) =>
                  <tr key={r.row} className="border-t border-line">
                        <td className="px-2 py-1.5 font-mono text-fgsubtle">{r.row}</td>
                        <td className="px-2 py-1.5 font-mono">{r.employee.employeeCode}</td>
                        <td className="px-2 py-1.5">{fullName(r.employee)}</td>
                        <td className="px-2 py-1.5">{teamById(r.employee.teamId)?.name ?? '—'}</td>
                        <td className="px-2 py-1.5">
                          {r.errors.length ?
                      <span className="text-danger">{r.errors.join('; ')}</span> :
                      <StatusPill status="ready" tone="positive" />}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </>
          }
        </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setImporting(false)}>Cancel</Button>
          <Button
            disabled={!importable.length || importable.length !== (parsed?.length ?? 0)}
            onClick={runImport}>
            
            Import {importable.length || ''} employee{importable.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}
