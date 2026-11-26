import { CrudTable, NONE } from '../../components/common/CrudTable';
import { StatusPill } from '../../components/common/StatusPill';
import { useApp } from '../../lib/store';
import type { Capability, Role, RoleAssignment } from '../../lib/types';
import { fullName, uid } from '../../lib/utils';
import { nameTaken, removeById, upsert } from './shared';

const CAPABILITY_INFO: {id: Capability;label: string;hint: string;}[] = [
{ id: 'score', label: 'Score', hint: 'Can enter scores and comments' },
{ id: 'score_team_lead', label: 'Score team leads', hint: 'May also score the person leading the team' },
{ id: 'edit_own', label: 'Edit own entries', hint: 'May change submitted entries they wrote' },
{ id: 'edit_others', label: 'Revise others', hint: 'May revise submitted entries written by other roles' },
{ id: 'view_reports', label: 'View reports', hint: 'Sees the cycle summary reports' },
{ id: 'manage', label: 'Manage', hint: 'Full administration: cycles, employees and configuration' }];


export function RolesTab() {
  const {
    roles,
    assignments,
    evaluations,
    employees,
    teams,
    setRoles,
    setAssignments,
    roleById,
    teamById,
    employeeById,
    logAction
  } = useApp();

  const stillManaged = (nextRoles: Role[], nextAssignments: RoleAssignment[]) =>
  nextAssignments.some(
    (a) =>
    nextRoles.find((r) => r.id === a.roleId)?.capabilities.includes('manage') &&
    employeeById(a.employeeId)?.status === 'active'
  );

  return (
    <div className="space-y-8">
      <CrudTable<Role>
        title="Evaluator roles"
        description="What each role can do. Scopes decide whether the role applies to one team or the whole company."
        noun="role"
        rows={roles}
        describe={(r) => r.name}
        blank={() => ({ id: uid('r'), name: '', description: '', scope: 'team', leadsTeam: false, capabilities: ['score'] })}
        columns={[
        { key: 'name', header: 'Role', sortable: true, value: (r) => r.name, render: (r) => <span className="font-medium text-fg">{r.name}</span> },
        { key: 'scope', header: 'Scope', value: (r) => r.scope, render: (r) => <StatusPill status={r.scope === 'global' ? 'global' : 'per team'} tone={r.scope === 'global' ? 'info' : 'neutral'} /> },
        { key: 'leads', header: 'Leads team', value: (r) => (r.leadsTeam ? 'yes' : 'no'), render: (r) => (r.leadsTeam ? 'Yes' : '—') },
        { key: 'capabilities', header: 'Capabilities', value: (r) => r.capabilities.length, render: (r) =>
          <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">
            {r.capabilities.length}
          </span>
        },
        { key: 'assigned', header: 'Assigned', align: 'right', value: (r) => assignments.filter((a) => a.roleId === r.id).length }]
        }
        fields={[
        { key: 'name', label: 'Role name' },
        {
          key: 'scope',
          label: 'Scope',
          type: 'select',
          options: [
          { value: 'team', label: 'Per team (assigned to specific teams)' },
          { value: 'global', label: 'Global (all teams)' }]

        },
        { key: 'description', label: 'Description', wide: true },
        {
          key: 'leadsTeam',
          label: 'Holders of this role lead their team',
          type: 'checkbox',
          wide: true,
          helperText: 'Team leads are scored only by roles that can score team leads.'
        },
        {
          key: 'capabilities',
          label: 'Capabilities',
          wide: true,
          render: (draft, patch) =>
          <div>
                <span className="text-sm font-medium text-fg">Capabilities</span>
                <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {CAPABILITY_INFO.map((cap) =>
              <label key={cap.id} className="flex cursor-pointer items-start gap-2 rounded border border-line p-2 text-sm text-fg">
                      <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5"
                  checked={draft.capabilities.includes(cap.id)}
                  onChange={(e) =>
                  patch({
                    capabilities: e.target.checked ?
                    [...draft.capabilities, cap.id] :
                    draft.capabilities.filter((c) => c !== cap.id)
                  })
                  } />
                
                      <span>
                        {cap.label}
                        <span className="block text-xs text-fgmuted">{cap.hint}</span>
                      </span>
                    </label>
              )}
                </div>
              </div>

        }]
        }
        onSave={(role, isNew) => {
          if (!role.name.trim()) return 'Role name is required.';
          if (nameTaken(roles, role, (r) => r.name)) return 'A role with this name already exists.';
          if (role.scope === 'global' && role.leadsTeam) return 'A global role cannot be a team lead role.';
          const cleaned: Role = { ...role, name: role.name.trim() };
          const nextRoles = isNew ? [...roles, cleaned] : roles.map((r) => r.id === role.id ? cleaned : r);
          if (!stillManaged(nextRoles, assignments)) return 'That would leave the system without an administrator.';
          upsert(setRoles, cleaned, isNew);
          logAction(isNew ? 'Created role' : 'Updated role', 'Roles', role.name, isNew ? 'info' : 'warning');
          return null;
        }}
        onDelete={(role) => {
          if (assignments.some((a) => a.roleId === role.id)) return 'Remove its assignments first.';
          if (evaluations.some((e) => e.roleId === role.id)) return 'Evaluations were already recorded under this role — history must not be lost.';
          removeById(setRoles, role.id);
          logAction('Deleted role', 'Roles', role.name, 'warning');
          return null;
        }} />
      

      <CrudTable<RoleAssignment>
        title="Role assignments"
        description="Who holds which role, and for which team. Team-scoped roles need a team; global roles cover every team."
        noun="assignment"
        rows={assignments}
        describe={(a) => `${fullName(employeeById(a.employeeId))} · ${roleById(a.roleId)?.name}`}
        blank={() => ({ id: uid('ra'), employeeId: '', roleId: roles[0]?.id ?? '', teamId: teams[0]?.id ?? null })}
        searchValue={(a) => `${fullName(employeeById(a.employeeId))} ${roleById(a.roleId)?.name} ${teamById(a.teamId)?.name}`}
        columns={[
        { key: 'employee', header: 'Employee', sortable: true, pinned: true, value: (a) => fullName(employeeById(a.employeeId)), render: (a) =>
          <div className="min-w-0">
              <p className="truncate font-medium text-fg">{fullName(employeeById(a.employeeId))}</p>
              <p className="truncate font-mono text-2xs text-fgsubtle">{employeeById(a.employeeId)?.employeeCode}</p>
            </div>
        },
        { key: 'role', header: 'Role', sortable: true, value: (a) => roleById(a.roleId)?.name ?? '' },
        { key: 'team', header: 'Team', sortable: true, value: (a) => teamById(a.teamId)?.name ?? 'All teams (global)', render: (a) =>
          a.teamId ? teamById(a.teamId)?.name : <StatusPill status="global" tone="info" />
        }]
        }
        fields={[
        {
          key: 'employeeId',
          label: 'Employee',
          type: 'select',
          searchable: true,
          options: employees.map((e) => ({ value: e.id, label: `${fullName(e)}${e.external ? ' (external)' : ''}` }))
        },
        { key: 'roleId', label: 'Role', type: 'select', options: roles.map((r) => ({ value: r.id, label: r.name })) },
        {
          key: 'teamId',
          label: 'Team',
          type: 'select',
          nullable: true,
          wide: true,
          helperText: 'Required for team-scoped roles. Leave on "All teams" for global roles.',
          options: [{ value: NONE, label: 'All teams (global)' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]
        }]
        }
        onSave={(assignment, isNew) => {
          const role = roleById(assignment.roleId);
          const employee = employeeById(assignment.employeeId);
          if (!employee) return 'Choose an employee.';
          if (!role) return 'Choose a role.';
          const teamId = role.scope === 'global' ? null : assignment.teamId;
          if (role.scope === 'team' && !teamId) return `"${role.name}" is a team-scoped role — choose a team.`;
          if (employee.external && !role.capabilities.includes('score')) return 'External evaluators can only hold scoring roles.';
          if (assignments.some((a) => a.id !== assignment.id && a.employeeId === assignment.employeeId && a.roleId === assignment.roleId && a.teamId === teamId)) {
            return 'This assignment already exists.';
          }
          const next = { ...assignment, teamId };
          const nextAssignments = isNew ? [...assignments, next] : assignments.map((a) => a.id === assignment.id ? next : a);
          if (!stillManaged(roles, nextAssignments)) return 'That would leave the system without an administrator.';
          upsert(setAssignments, next, isNew);
          logAction('Assigned role', 'Roles', `${fullName(employee)} · ${role.name}${teamId ? ` · ${teamById(teamId)?.name}` : ' · global'}`, 'warning');
          return null;
        }}
        onDelete={(assignment) => {
          const rest = assignments.filter((a) => a.id !== assignment.id);
          if (!stillManaged(roles, rest)) return 'That would leave the system without an administrator.';
          removeById(setAssignments, assignment.id);
          logAction('Removed role assignment', 'Roles', `${fullName(employeeById(assignment.employeeId))} · ${roleById(assignment.roleId)?.name}`, 'warning');
          return null;
        }} />
      
    </div>);

}
