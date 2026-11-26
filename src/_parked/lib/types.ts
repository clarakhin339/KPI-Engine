export type ID = string;

/* ------------------------------------------------------------------ */
/* Organization                                                        */
/* ------------------------------------------------------------------ */

export type OrgNodeType =
'company' |
'branch' |
'division' |
'department' |
'team';

export interface OrgNode {
  id: ID;
  name: string;
  type: OrgNodeType;
  parentId: ID | null;
  headId?: ID;
  code: string;
}

export type EmploymentType =
'Full-time' |
'Part-time' |
'Contract' |
'Intern' |
'Probation';

export type UserStatus = 'active' | 'inactive' | 'invited';

export interface User {
  id: ID;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  orgNodeId: ID;
  teamId?: ID;
  position: string;
  jobTitle: string;
  managerId: ID | null;
  employmentType: EmploymentType;
  joinDate: string;
  status: UserStatus;
  roleId: ID;
}

/* ------------------------------------------------------------------ */
/* RBAC                                                                */
/* ------------------------------------------------------------------ */

export type PermissionAction =
'view' |
'create' |
'edit' |
'delete' |
'approve' |
'export';

export type ModuleKey =
'dashboard' |
'users' |
'organization' |
'templates' |
'builder' |
'assignments' |
'reviews' |
'approvals' |
'reports' |
'settings' |
'audit';

export type DataScope = 'all' | 'department' | 'team' | 'self';

export interface Role {
  id: ID;
  name: string;
  description: string;
  isSystem: boolean;
  dataScope: DataScope;
  permissions: Record<ModuleKey, PermissionAction[]>;
  memberCount: number;
}

/* ------------------------------------------------------------------ */
/* KPI configuration                                                   */
/* ------------------------------------------------------------------ */

export interface KpiCategory {
  id: ID;
  name: string;
  description: string;
  defaultWeight: number;
  active: boolean;
  itemCount: number;
}

export type CycleType =
'Weekly' |
'Monthly' |
'Quarterly' |
'Half-Yearly' |
'Yearly' |
'Custom';

export type CycleStatus = 'draft' | 'active' | 'in-review' | 'locked' | 'closed';

export interface KpiCycle {
  id: ID;
  name: string;
  type: CycleType;
  startDate: string;
  endDate: string;
  dueDate: string;
  lockDate: string;
  status: CycleStatus;
  assignmentCount: number;
  completion: number;
}

export type FieldType =
'section' |
'group' |
'title' |
'subtitle' |
'description' |
'kpi' |
'number' |
'percentage' |
'rating' |
'score' |
'weight' |
'formula' |
'dropdown' |
'radio' |
'checkbox' |
'date' |
'text' |
'textarea' |
'attachment' |
'comment';

export interface FieldCondition {
  fieldId: ID;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than';
  value: string;
}

export interface KpiField {
  id: ID;
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  hidden: boolean;
  weight?: number;
  categoryId?: ID;
  scaleId?: ID;
  options?: string[];
  formula?: string;
  min?: number;
  max?: number;
  target?: string;
  condition?: FieldCondition;
}

export interface KpiSection {
  id: ID;
  title: string;
  subtitle?: string;
  description?: string;
  weight: number;
  collapsed: boolean;
  hidden: boolean;
  fields: KpiField[];
}

export type TemplateStatus = 'draft' | 'published' | 'archived';

export interface KpiTemplate {
  id: ID;
  title: string;
  description: string;
  version: string;
  status: TemplateStatus;
  orgNodeId: ID | null;
  position: string;
  scaleId: ID;
  workflowId: ID;
  sections: KpiSection[];
  updatedAt: string;
  updatedBy: string;
}

/* ------------------------------------------------------------------ */
/* Scoring & formula                                                   */
/* ------------------------------------------------------------------ */

export type ScaleType =
'numeric' |
'percentage' |
'letter' |
'five-star' |
'traffic-light' |
'custom';

export interface ScaleLevel {
  label: string;
  min: number;
  max: number;
  tone: 'positive' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface RatingScale {
  id: ID;
  name: string;
  type: ScaleType;
  min: number;
  max: number;
  passingScore: number;
  levels: ScaleLevel[];
  formula: string;
}

/* ------------------------------------------------------------------ */
/* Workflow                                                            */
/* ------------------------------------------------------------------ */

export interface WorkflowStep {
  id: ID;
  name: string;
  roleId: ID;
  slaDays: number;
  canOverrideScore: boolean;
  optional: boolean;
}

export interface Workflow {
  id: ID;
  name: string;
  description: string;
  active: boolean;
  steps: WorkflowStep[];
}

/* ------------------------------------------------------------------ */
/* Assignment & assessment                                             */
/* ------------------------------------------------------------------ */

export type AssignTargetType = 'employee' | 'team' | 'department' | 'position';

export interface Assignment {
  id: ID;
  templateId: ID;
  cycleId: ID;
  targetType: AssignTargetType;
  targetLabel: string;
  assigneeCount: number;
  dueDate: string;
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
}

export type AssessmentStatus =
'not-started' |
'draft' |
'submitted' |
'in-review' |
'revision-requested' |
'approved' |
'rejected';

export interface ApprovalRecord {
  stepId: ID;
  stepName: string;
  approverId: ID;
  status: 'pending' | 'approved' | 'rejected' | 'revision' | 'skipped';
  actedAt?: string;
  note?: string;
}

export interface KpiComment {
  id: ID;
  authorId: ID;
  role: 'employee' | 'reviewer' | 'hr';
  fieldId?: ID;
  body: string;
  createdAt: string;
  mentions: ID[];
  replies: KpiComment[];
}

export interface Evidence {
  id: ID;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'excel' | 'zip';
  size: string;
  uploadedBy: ID;
  uploadedAt: string;
  version: number;
  fieldId?: ID;
}

export interface HistoryEntry {
  id: ID;
  at: string;
  actorId: ID;
  action: string;
  detail: string;
}

export interface SelfAppraisal {
  achievements: string;
  challenges: string;
  improvementPlan: string;
  selfRating: number;
}

export interface Assessment {
  id: ID;
  assignmentId: ID;
  userId: ID;
  templateId: ID;
  cycleId: ID;
  status: AssessmentStatus;
  responses: Record<ID, string | number | boolean>;
  selfAppraisal: SelfAppraisal;
  selfScore: number;
  managerScore: number | null;
  finalScore: number | null;
  rating: string | null;
  currentStep: number;
  approvals: ApprovalRecord[];
  comments: KpiComment[];
  evidence: Evidence[];
  history: HistoryEntry[];
  submittedAt?: string;
  updatedAt: string;
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
  ip: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AppNotification {
  id: ID;
  type: 'due' | 'approval' | 'comment' | 'mention' | 'rejected' | 'system';
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export interface LoginSession {
  id: ID;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}