import type {
  Capability,
  Employee,
  Evaluation,
  EvaluationCycle,
  ID,
  Role,
  RoleAssignment } from
'./types';

/**
 * Evaluation access rules. Pure functions so the same checks can be ported
 * one-to-one into the API guards — the browser copy is for UX only.
 */

export interface AccessData {
  employees: Employee[];
  roles: Role[];
  assignments: RoleAssignment[];
}

export interface Grant {
  assignment: RoleAssignment;
  role: Role;
}

export function grantsOf(data: AccessData, userId: ID): Grant[] {
  return data.assignments.
  filter((a) => a.employeeId === userId).
  flatMap((assignment) => {
    const role = data.roles.find((r) => r.id === assignment.roleId);
    return role ? [{ assignment, role }] : [];
  });
}

export function hasCapability(data: AccessData, userId: ID, capability: Capability): boolean {
  return grantsOf(data, userId).some((g) => g.role.capabilities.includes(capability));
}

function covers(grant: Grant, employee: Employee): boolean {
  return grant.assignment.teamId === null ?
  grant.role.scope === 'global' :
  grant.assignment.teamId === employee.teamId;
}

function leadsOwnTeam(data: AccessData, employee: Employee): boolean {
  return grantsOf(data, employee.id).some(
    (g) => g.role.leadsTeam && g.assignment.teamId === employee.teamId
  );
}

/** The role under which `userId` may score `evaluatee`, or null if not allowed. Team-scoped roles win over global ones. */
export function scoringGrant(
data: AccessData,
userId: ID,
evaluatee: Employee | undefined)
: Grant | null {
  if (!evaluatee || evaluatee.external || evaluatee.status !== 'active' || evaluatee.id === userId) {
    return null;
  }
  const isLead = leadsOwnTeam(data, evaluatee);
  const grants = grantsOf(data, userId).filter(
    (g) =>
    g.role.capabilities.includes('score') &&
    covers(g, evaluatee) && (
    !isLead || g.role.capabilities.includes('score_team_lead'))
  );
  return grants.find((g) => g.assignment.teamId !== null) ?? grants[0] ?? null;
}

export function scorableEmployees(data: AccessData, userId: ID): Employee[] {
  return data.employees.filter((e) => scoringGrant(data, userId, e) !== null);
}

export function scoringLabel(data: AccessData, user: Employee): string {
  if (user.external) return 'Give feedback';
  const global = grantsOf(data, user.id).some(
    (g) => g.assignment.teamId === null && g.role.capabilities.includes('score')
  );
  return global ? 'Score employees' : 'Score my team';
}

/** Whether `userId` may revise entries written by any evaluator for this employee (HR). */
function canReviseOthers(data: AccessData, userId: ID, evaluatee: Employee | undefined): boolean {
  return (
    !!evaluatee &&
    grantsOf(data, userId).some(
      (g) => g.role.capabilities.includes('edit_others') && covers(g, evaluatee)
    ));

}

export function canEditEvaluation(
data: AccessData,
userId: ID,
evaluation: Evaluation,
cycle: EvaluationCycle | undefined)
: boolean {
  if (!cycle || cycle.status !== 'active') return false;
  const role = data.roles.find((r) => r.id === evaluation.roleId);
  if (evaluation.evaluatorId === userId) {
    return evaluation.status === 'draft' || !!role?.capabilities.includes('edit_own');
  }
  const evaluatee = data.employees.find((e) => e.id === evaluation.evaluateeId);
  return evaluation.status === 'submitted' && canReviseOthers(data, userId, evaluatee);

}

export function canViewEvaluation(
data: AccessData,
userId: ID,
evaluation: Evaluation,
cycle: EvaluationCycle | undefined)
: boolean {
  if (evaluation.evaluatorId === userId) return true;
  if (evaluation.status !== 'submitted') return false;
  if (evaluation.evaluateeId === userId) return cycle?.status === 'closed';
  const evaluatee = data.employees.find((e) => e.id === evaluation.evaluateeId);
  return canReviseOthers(data, userId, evaluatee) || hasCapability(data, userId, 'view_reports');
}

export interface ExpectedEvaluation {
  evaluatorId: ID;
  evaluateeId: ID;
  roleId: ID;
  teamId: ID | null;
}

/** Every evaluator → employee pairing the current role assignments call for. */
export function expectedEvaluations(data: AccessData): ExpectedEvaluation[] {
  const evaluators = data.employees.filter(
    (e) => e.status === 'active' && hasCapability(data, e.id, 'score')
  );
  return evaluators.flatMap((evaluator) =>
  data.employees.flatMap((evaluatee) => {
    const grant = scoringGrant(data, evaluator.id, evaluatee);
    return grant ?
    [
    {
      evaluatorId: evaluator.id,
      evaluateeId: evaluatee.id,
      roleId: grant.role.id,
      teamId: evaluatee.teamId
    }] :

    [];
  })
  );
}
