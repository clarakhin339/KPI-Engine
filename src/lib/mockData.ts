import { expectedEvaluations } from './permissions';
import { summarise } from './scoring';
import type {
  AppNotification,
  AuditLog,
  Branch,
  Employee,
  Evaluation,
  EvaluationCycle,
  Position,
  Rank,
  ReviewSummary,
  Role,
  RoleAssignment,
  ScoreBand,
  Team } from
'./types';

/* ------------------------------------------------------------------ */
/* Organization                                                        */
/* ------------------------------------------------------------------ */

export const branches: Branch[] = [
{ id: 'b-1', name: '1CNG', code: '1CNG' },
{ id: 'b-2', name: 'BackBone / IPBB', code: 'IPBB' }];


export const teams: Team[] = [
{ id: 't-1', name: 'Sales', branchId: 'b-1' },
{ id: 't-2', name: 'Cloud Engineering', branchId: 'b-1' },
{ id: 't-3', name: 'People & Culture', branchId: 'b-1' },
{ id: 't-4', name: 'Network Operations', branchId: 'b-2' },
{ id: 't-5', name: 'IP Core', branchId: 'b-2' },
{ id: 't-6', name: 'Management Office', branchId: 'b-1' }];


export const ranks: Rank[] = [
{ id: 'rk-1', name: 'Junior', level: 1 },
{ id: 'rk-2', name: 'Mid-1', level: 2 },
{ id: 'rk-3', name: 'Mid-2', level: 3 },
{ id: 'rk-4', name: 'Senior-1', level: 4 },
{ id: 'rk-5', name: 'Senior-2', level: 5 },
{ id: 'rk-6', name: 'Team Lead', level: 6 }];


export const positions: Position[] = [
{ id: 'p-1', title: 'Engineer' },
{ id: 'p-2', title: 'Network Engineer' },
{ id: 'p-3', title: 'Analyst' },
{ id: 'p-4', title: 'Account Executive' },
{ id: 'p-5', title: 'Support Specialist' },
{ id: 'p-6', title: 'Project Manager' },
{ id: 'p-7', title: 'HR Officer' },
{ id: 'p-8', title: 'Director' }];


/* ------------------------------------------------------------------ */
/* Employees                                                           */
/* ------------------------------------------------------------------ */

function staff(
n: number,
firstName: string,
lastName: string,
positionId: string,
rankId: string,
teamId: string,
hireDate: string,
extra: Partial<Employee> = {})
: Employee {
  return {
    id: `e-${n}`,
    employeeCode: `OCNG-${String(1000 + n)}`,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@1cloudng.com`.toLowerCase(),
    positionId,
    rankId,
    teamId,
    branchId: teams.find((t) => t.id === teamId)?.branchId ?? null,
    hireDate,
    status: 'active',
    external: false,
    ...extra
  };
}

export const employees: Employee[] = [
staff(1, 'Khin', 'Khin', 'p-7', 'rk-5', 't-3', '2019-03-04'),
staff(2, 'Kyaw', 'Zin', 'p-7', 'rk-3', 't-3', '2022-08-15'),
staff(3, 'Min', 'Thant', 'p-6', 'rk-5', 't-6', '2018-11-01'),
staff(4, 'Hnin', 'Wai', 'p-6', 'rk-4', 't-6', '2020-02-17'),

staff(5, 'Aye', 'Chan', 'p-4', 'rk-6', 't-1', '2019-06-10'),
staff(6, 'Su', 'Myat', 'p-4', 'rk-4', 't-1', '2021-01-11'),
staff(7, 'Htet', 'Naing', 'p-4', 'rk-3', 't-1', '2022-05-02'),
staff(8, 'Ei', 'Phyu', 'p-3', 'rk-1', 't-1', '2025-02-03'),
staff(9, 'Wai', 'Yan', 'p-4', 'rk-2', 't-1', '2023-09-18'),

staff(10, 'Zaw', 'Lin', 'p-1', 'rk-6', 't-2', '2018-07-23'),
staff(11, 'Nay', 'Htun', 'p-1', 'rk-5', 't-2', '2019-10-07'),
staff(12, 'May', 'Thu', 'p-1', 'rk-3', 't-2', '2022-03-14'),
staff(13, 'Phyo', 'Ko', 'p-1', 'rk-2', 't-2', '2023-11-20'),
staff(14, 'Yamin', 'Soe', 'p-3', 'rk-1', 't-2', '2025-08-04'),

staff(15, 'Thura', 'Win', 'p-2', 'rk-6', 't-4', '2017-04-03'),
staff(16, 'Kaung', 'Sett', 'p-2', 'rk-4', 't-4', '2020-09-21'),
staff(17, 'Moe', 'Pwint', 'p-2', 'rk-2', 't-4', '2023-06-05'),
staff(18, 'Lin', 'Latt', 'p-5', 'rk-1', 't-4', '2024-10-14'),

staff(19, 'Soe', 'Moe', 'p-2', 'rk-6', 't-5', '2018-01-15'),
staff(20, 'Ye', 'Yint', 'p-2', 'rk-5', 't-5', '2019-12-02'),
staff(21, 'Cho', 'Zin', 'p-2', 'rk-3', 't-5', '2022-07-25'),
staff(22, 'Pyae', 'Sone', 'p-2', 'rk-1', 't-5', '2024-04-08', { status: 'inactive' }),

staff(23, 'Khin', 'Maung', 'p-8', 'rk-5', 't-6', '2016-05-09'),
{
  id: 'e-24',
  employeeCode: 'EXT-0001',
  firstName: 'Daniel',
  lastName: 'Tan',
  email: 'daniel.tan@client.example',
  positionId: null,
  rankId: null,
  branchId: null,
  teamId: null,
  hireDate: '2025-01-01',
  status: 'active',
  external: true
}];


/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export const roles: Role[] = [
{
  id: 'r-tl',
  name: 'Team Lead',
  description: 'Scores the members of their own team.',
  scope: 'team',
  leadsTeam: true,
  capabilities: ['score', 'edit_own']
},
{
  id: 'r-pm',
  name: 'Project Manager',
  description: 'Scores team members and the team lead of assigned teams.',
  scope: 'team',
  leadsTeam: false,
  capabilities: ['score', 'score_team_lead', 'edit_own']
},
{
  id: 'r-hr',
  name: 'HR',
  description: 'Scores anyone, revises Team Lead / PM entries and manages cycles and configuration.',
  scope: 'global',
  leadsTeam: false,
  capabilities: ['score', 'score_team_lead', 'edit_own', 'edit_others', 'view_reports', 'manage']
},
{
  id: 'r-cust',
  name: 'Customer',
  description: 'Gives feedback on assigned teams. Entries are final once submitted.',
  scope: 'team',
  leadsTeam: false,
  capabilities: ['score', 'score_team_lead']
},
{
  id: 'r-mgmt',
  name: 'Management',
  description: 'Receives the cycle summary report.',
  scope: 'global',
  leadsTeam: false,
  capabilities: ['view_reports']
}];


export const assignments: RoleAssignment[] = [
{ id: 'ra-1', employeeId: 'e-1', roleId: 'r-hr', teamId: null },
{ id: 'ra-2', employeeId: 'e-2', roleId: 'r-hr', teamId: null },
{ id: 'ra-3', employeeId: 'e-3', roleId: 'r-pm', teamId: 't-1' },
{ id: 'ra-4', employeeId: 'e-3', roleId: 'r-pm', teamId: 't-2' },
{ id: 'ra-5', employeeId: 'e-4', roleId: 'r-pm', teamId: 't-4' },
{ id: 'ra-6', employeeId: 'e-4', roleId: 'r-pm', teamId: 't-5' },
{ id: 'ra-7', employeeId: 'e-5', roleId: 'r-tl', teamId: 't-1' },
{ id: 'ra-8', employeeId: 'e-10', roleId: 'r-tl', teamId: 't-2' },
{ id: 'ra-9', employeeId: 'e-15', roleId: 'r-tl', teamId: 't-4' },
{ id: 'ra-10', employeeId: 'e-19', roleId: 'r-tl', teamId: 't-5' },
{ id: 'ra-11', employeeId: 'e-24', roleId: 'r-cust', teamId: 't-1' },
{ id: 'ra-12', employeeId: 'e-23', roleId: 'r-mgmt', teamId: null }];


/* ------------------------------------------------------------------ */
/* Cycles & score bands                                                */
/* ------------------------------------------------------------------ */

export const cycles: EvaluationCycle[] = [
{ id: 'cy-2025h1', name: 'H1 2025', half: 'H1', year: 2025, startDate: '2025-01-01', endDate: '2025-06-30', status: 'closed', closedAt: '2025-07-10T04:00:00Z' },
{ id: 'cy-2025h2', name: 'H2 2025', half: 'H2', year: 2025, startDate: '2025-07-01', endDate: '2025-12-31', status: 'closed', closedAt: '2026-01-12T04:00:00Z' },
{ id: 'cy-2026h1', name: 'H1 2026', half: 'H1', year: 2026, startDate: '2026-01-01', endDate: '2026-06-30', status: 'closed', closedAt: '2026-07-09T04:00:00Z' },
{ id: 'cy-2026h2', name: 'H2 2026', half: 'H2', year: 2026, startDate: '2026-07-01', endDate: '2026-12-31', status: 'active' },
{ id: 'cy-2027h1', name: 'H1 2027', half: 'H1', year: 2027, startDate: '2027-01-01', endDate: '2027-06-30', status: 'upcoming' }];


/** Example bands from the HR draft — pending confirmation by management. */
export const bands: ScoreBand[] = [
{ id: 'sb-1', label: 'Unsatisfactory', minScore: 0, maxScore: 59, tone: 'danger', benefit: null, kpiBonus: false, salaryIncrease: false, promotion: false },
{ id: 'sb-2', label: 'Needs Improvement', minScore: 60, maxScore: 69, tone: 'warning', benefit: null, kpiBonus: true, salaryIncrease: false, promotion: false },
{ id: 'sb-3', label: 'Meets Expectations', minScore: 70, maxScore: 79, tone: 'neutral', benefit: null, kpiBonus: true, salaryIncrease: false, promotion: false },
{ id: 'sb-4', label: 'Exceeds Expectations', minScore: 80, maxScore: 89, tone: 'info', benefit: 'Excellence Allowance', kpiBonus: true, salaryIncrease: true, promotion: true },
{ id: 'sb-5', label: 'Excellent', minScore: 90, maxScore: 100, tone: 'positive', benefit: 'Excellence Allowance', kpiBonus: true, salaryIncrease: true, promotion: true }];


/* ------------------------------------------------------------------ */
/* Evaluations (generated, deterministic)                              */
/* ------------------------------------------------------------------ */

const PRAISE = [
'Consistent delivery and dependable follow-through on commitments.',
'Strong ownership of assigned work; communicates blockers early.',
'Good collaboration with other teams and a positive influence on peers.',
'Solid technical quality. Documentation could be more thorough.',
'Handled customer escalations calmly and closed them on time.',
'Met targets for the period and supported onboarding of new members.'];


const DEDUCTIONS = [
'Repeated late arrival to scheduled on-call handovers.',
'Missed two agreed delivery dates without prior notice.',
'Incident report was submitted incomplete and after the deadline.',
'Customer complaint about slow response during the period.'];


const BASE_SCORE: Record<string, number> = { 'e-18': 46, 'e-9': 55, 'e-11': 91 };

function hash(text: string) {
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 99991;
  return h;
}

const pad = (n: number) => String(n).padStart(2, '0');

function seedEvaluations(): Evaluation[] {
  /* History only: closed cycles get a complete set of submitted entries.
     The active cycle starts empty — fabricated entries would look like work
     the person never did, no matter who you sign in as. */
  const pairs = expectedEvaluations({ employees, roles, assignments });
  return cycles.
  filter((c) => c.status === 'closed').
  flatMap((cycle) =>
  pairs.flatMap((pair) => {
    const evaluatee = employees.find((e) => e.id === pair.evaluateeId);
    const evaluator = employees.find((e) => e.id === pair.evaluatorId);
    if (!evaluatee || !evaluator) return [];
    if (evaluatee.hireDate > cycle.endDate || evaluator.hireDate > cycle.endDate) return [];

    const h = hash(`${cycle.id}:${pair.evaluatorId}:${pair.evaluateeId}`);
    const isDeduction = h % 11 === 0;
    const base = BASE_SCORE[evaluatee.id] ?? 60 + hash(evaluatee.id) % 32;
    const score = Math.max(30, Math.min(99, base + h % 11 - 5 - (isDeduction ? 10 : 0)));
    const month = cycle.half === 'H1' ? '06' : '12';
    const at = `${cycle.year}-${month}-${pad(1 + h % 24)}T${pad(2 + h % 8)}:${pad(h % 60)}:00Z`;

    return [
    {
      id: `ev-${cycle.id}-${pair.evaluatorId}-${pair.evaluateeId}`,
      cycleId: cycle.id,
      evaluateeId: pair.evaluateeId,
      evaluatorId: pair.evaluatorId,
      roleId: pair.roleId,
      score,
      isDeduction,
      comment: isDeduction ? DEDUCTIONS[h % DEDUCTIONS.length] : PRAISE[h % PRAISE.length],
      commentDate: at,
      lastModified: at,
      status: 'submitted'
    }];

  })
  );
}

export const evaluations: Evaluation[] = seedEvaluations();

export const summaries: ReviewSummary[] = cycles.
filter((c) => c.status === 'closed').
flatMap((cycle) =>
employees.
filter((e) => !e.external && e.status === 'active' && e.hireDate <= cycle.endDate).
map((e) => summarise(cycle.id, e.id, evaluations, bands))
);

/* ------------------------------------------------------------------ */
/* Platform data                                                       */
/* ------------------------------------------------------------------ */

export const auditLogs: AuditLog[] = [
{ id: 'al-1', at: '2026-11-18T05:02:55Z', actorId: 'e-1', action: 'Assigned role', module: 'Roles', entity: 'Daniel Tan · Customer · Sales', severity: 'warning' },
{ id: 'al-2', at: '2026-11-03T04:15:48Z', actorId: 'e-2', action: 'Imported employees', module: 'Employees', entity: '2 records', severity: 'info' },
{ id: 'al-3', at: '2026-10-14T09:07:33Z', actorId: 'e-1', action: 'Deactivated employee', module: 'Employees', entity: 'Pyae Sone (OCNG-1022)', severity: 'warning' },
{ id: 'al-4', at: '2026-07-09T04:00:00Z', actorId: 'e-1', action: 'Closed cycle', module: 'Cycles', entity: 'H1 2026 · results published', severity: 'critical' },
{ id: 'al-5', at: '2026-07-01T01:00:00Z', actorId: 'e-1', action: 'Activated cycle', module: 'Cycles', entity: 'H2 2026', severity: 'info' },
{ id: 'al-6', at: '2026-06-28T07:44:02Z', actorId: 'e-1', action: 'Updated score band', module: 'Score bands', entity: 'Exceeds Expectations · 80–89', severity: 'warning' }];


export const notifications: AppNotification[] = [
{ id: 'n-1', type: 'reminder', title: 'Evaluations due soon', body: 'H2 2026 closes on 31 Dec 2026. Please finish scoring your team.', at: '2026-11-25T02:00:00Z', read: false, employeeId: null },
{ id: 'n-2', type: 'cycle', title: 'H2 2026 is open for scoring', body: 'The evaluation cycle is active. Scores and comments can be entered until HR closes the cycle.', at: '2026-07-01T01:00:00Z', read: true, employeeId: null },
{ id: 'n-3', type: 'result', title: 'H1 2026 results published', body: 'Your final score and comments for H1 2026 are available under My Results.', at: '2026-07-09T04:00:00Z', read: true, employeeId: null }];
