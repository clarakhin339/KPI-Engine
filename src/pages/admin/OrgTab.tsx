import { CrudTable } from '../../components/common/CrudTable';
import { useApp } from '../../lib/store';
import type { Branch, Team } from '../../lib/types';
import { uid } from '../../lib/utils';
import { nameTaken, removeById, upsert } from './shared';

export function OrgTab() {
  const { branches, teams, employees, assignments, setBranches, setTeams, branchById, logAction } =
  useApp();

  return (
    <div className="space-y-8">
      <CrudTable<Branch>
        title="Branches"
        description="Company branches / divisions."
        noun="branch"
        rows={branches}
        describe={(b) => b.name}
        blank={() => ({ id: uid('b'), name: '', code: '' })}
        columns={[
        { key: 'name', header: 'Branch', sortable: true, value: (b) => b.name },
        { key: 'code', header: 'Code', sortable: true, value: (b) => b.code },
        { key: 'teams', header: 'Teams', align: 'right', value: (b) => teams.filter((t) => t.branchId === b.id).length },
        { key: 'people', header: 'Employees', align: 'right', value: (b) => employees.filter((e) => e.branchId === b.id).length }]
        }
        fields={[
        { key: 'name', label: 'Branch name' },
        { key: 'code', label: 'Short code' }]
        }
        onSave={(branch, isNew) => {
          if (!branch.name.trim()) return 'Branch name is required.';
          if (nameTaken(branches, branch, (b) => b.name)) return 'A branch with this name already exists.';
          upsert(setBranches, { ...branch, name: branch.name.trim(), code: branch.code.trim() }, isNew);
          logAction(isNew ? 'Created branch' : 'Updated branch', 'Organization', branch.name);
          return null;
        }}
        onDelete={(branch) => {
          if (teams.some((t) => t.branchId === branch.id)) return 'Move or delete its teams first.';
          removeById(setBranches, branch.id);
          logAction('Deleted branch', 'Organization', branch.name, 'warning');
          return null;
        }} />
      

      <CrudTable<Team>
        title="Teams"
        description="Teams belong to one branch. Evaluator roles are assigned per team."
        noun="team"
        rows={teams}
        describe={(t) => t.name}
        blank={() => ({ id: uid('t'), name: '', branchId: branches[0]?.id ?? '' })}
        searchValue={(t) => `${t.name} ${branchById(t.branchId)?.name}`}
        columns={[
        { key: 'name', header: 'Team', sortable: true, value: (t) => t.name },
        { key: 'branch', header: 'Branch', sortable: true, value: (t) => branchById(t.branchId)?.name ?? '' },
        { key: 'people', header: 'Employees', align: 'right', value: (t) => employees.filter((e) => e.teamId === t.id).length }]
        }
        fields={[
        { key: 'name', label: 'Team name' },
        { key: 'branchId', label: 'Branch', type: 'select', options: branches.map((b) => ({ value: b.id, label: b.name })) }]
        }
        onSave={(team, isNew) => {
          if (!team.name.trim()) return 'Team name is required.';
          if (!branchById(team.branchId)) return 'Choose a branch.';
          if (teams.some((t) => t.id !== team.id && t.branchId === team.branchId && t.name.trim().toLowerCase() === team.name.trim().toLowerCase())) {
            return 'This branch already has a team with that name.';
          }
          upsert(setTeams, { ...team, name: team.name.trim() }, isNew);
          logAction(isNew ? 'Created team' : 'Updated team', 'Organization', team.name);
          return null;
        }}
        onDelete={(team) => {
          if (employees.some((e) => e.teamId === team.id)) return 'The team still has employees.';
          if (assignments.some((a) => a.teamId === team.id)) return 'Remove the role assignments for this team first.';
          removeById(setTeams, team.id);
          logAction('Deleted team', 'Organization', team.name, 'warning');
          return null;
        }} />
      
    </div>);

}
