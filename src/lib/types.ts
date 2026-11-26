export type ID = string;

export type Tone = 'positive' | 'warning' | 'danger' | 'info' | 'neutral';

/* ------------------------------------------------------------------ */
/* Organization                                                        */
/* ------------------------------------------------------------------ */

export interface Branch {
  id: ID;
  name: string;
  code: string;
}

export interface Team {
  id: ID;
  name: string;
  branchId: ID;
}

export interface Rank {
  id: ID;
  name: string;
  level: number;
}

export interface Position {
  id: ID;
  title: string;
}

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: ID;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  positionId: ID | null;
  rankId: ID | null;
  branchId: ID | null;
  teamId: ID | null;
  hireDate: string;
  status: EmployeeStatus;
  /** External evaluators (e.g. customers) sign in and give feedback but are never evaluated. */
  external: boolean;
}

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export type Capability =
'score' |
'score_team_lead' |
'edit_own' |
'edit_others' |
'view_reports' |
'manage';

export type RoleScope = 'team' | 'global';

export interface Role {
  id: ID;
  name: string;
  description: string;
  scope: RoleScope;
  /** Holders lead the team they are assigned to; only roles with `score_team_lead` may score them. */
  leadsTeam: boolean;
  capabilities: Capability[];
}

export interface RoleAssignment {
  id: ID;
  employeeId: ID;
  roleId: ID;
  /** null = global scope (every team). */
  teamId: ID | null;
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export type CycleStatus = 'upcoming' | 'active' | 'closed';

export interface EvaluationCycle {
  id: ID;
  name: string;
  half: 'H1' | 'H2';
  year: number;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  closedAt?: string;
}

export type EvaluationStatus = 'draft' | 'submitted';

export interface Evaluation {
  id: ID;
  cycleId: ID;
  evaluateeId: ID;
  evaluatorId: ID;
  roleId: ID;
  score: number;
  isDeduction: boolean;
  comment: string;
  commentDate: string;
  lastModified: string;
  status: EvaluationStatus;
  /** Set when someone other than the evaluator (HR) revised the entry. */
  revisedById?: ID;
}

export interface ScoreBand {
  id: ID;
  label: string;
  minScore: number;
  maxScore: number;
  tone: Tone;
}

export interface ReviewSummary {
  cycleId: ID;
  employeeId: ID;
  finalScore: number | null;
  bandId: ID | null;
  evaluationCount: number;
  deductionCount: number;
}

/* ------------------------------------------------------------------ */
/* Platform                                                            */
/* ------------------------------------------------------------------ */

export interface AuditLog {
  id: ID;
  at: string;
  actorId: ID;
  action: string;
  module: string;
  entity: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AppNotification {
  id: ID;
  type: 'cycle' | 'reminder' | 'result' | 'system';
  title: string;
  body: string;
  at: string;
  read: boolean;
  /** null = everyone. */
  employeeId: ID | null;
}
