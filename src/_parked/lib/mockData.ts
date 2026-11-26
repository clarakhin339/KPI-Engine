import type {
  Assessment,
  Assignment,
  AuditLog,
  AppNotification,
  KpiCategory,
  KpiCycle,
  KpiTemplate,
  LoginSession,
  ModuleKey,
  OrgNode,
  PermissionAction,
  RatingScale,
  Role,
  User,
  Workflow } from
'./types';

export const MODULES: {key: ModuleKey;label: string;}[] = [
{ key: 'dashboard', label: 'Dashboard' },
{ key: 'users', label: 'Users' },
{ key: 'organization', label: 'Organization' },
{ key: 'templates', label: 'KPI Templates' },
{ key: 'builder', label: 'KPI Builder' },
{ key: 'assignments', label: 'KPI Assignment' },
{ key: 'reviews', label: 'KPI Reviews' },
{ key: 'approvals', label: 'KPI Approval' },
{ key: 'reports', label: 'Reports' },
{ key: 'settings', label: 'Settings' },
{ key: 'audit', label: 'Audit Logs' }];


export const ACTIONS: PermissionAction[] = [
'view',
'create',
'edit',
'delete',
'approve',
'export'];


const all: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
const readOnly: PermissionAction[] = ['view'];

function perms(
overrides: Partial<Record<ModuleKey, PermissionAction[]>>,
base: PermissionAction[] = [])
: Record<ModuleKey, PermissionAction[]> {
  const out = {} as Record<ModuleKey, PermissionAction[]>;
  MODULES.forEach((m) => {
    out[m.key] = overrides[m.key] ?? base;
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Organization                                                        */
/* ------------------------------------------------------------------ */

export const orgNodes: OrgNode[] = [
{ id: 'org-1', name: 'One Cloud Next Gen', type: 'company', parentId: null, code: 'OCNG', headId: 'u-1' },
{ id: 'org-2', name: 'Jakarta HQ', type: 'branch', parentId: 'org-1', code: 'OCNG-JKT', headId: 'u-2' },
{ id: 'org-3', name: 'Singapore Office', type: 'branch', parentId: 'org-1', code: 'OCNG-SG', headId: 'u-9' },
{ id: 'org-4', name: 'Technology Division', type: 'division', parentId: 'org-2', code: 'DIV-TECH', headId: 'u-2' },
{ id: 'org-5', name: 'Commercial Division', type: 'division', parentId: 'org-2', code: 'DIV-COM', headId: 'u-9' },
{ id: 'org-6', name: 'Engineering', type: 'department', parentId: 'org-4', code: 'ENG', headId: 'u-3' },
{ id: 'org-7', name: 'Information Security', type: 'department', parentId: 'org-4', code: 'SEC', headId: 'u-7' },
{ id: 'org-8', name: 'Sales', type: 'department', parentId: 'org-5', code: 'SLS', headId: 'u-9' },
{ id: 'org-9', name: 'People & Culture', type: 'department', parentId: 'org-2', code: 'HR', headId: 'u-5' },
{ id: 'org-10', name: 'Platform Team', type: 'team', parentId: 'org-6', code: 'ENG-PLT', headId: 'u-4' },
{ id: 'org-11', name: 'Product Team', type: 'team', parentId: 'org-6', code: 'ENG-PRD', headId: 'u-6' },
{ id: 'org-12', name: 'GRC Team', type: 'team', parentId: 'org-7', code: 'SEC-GRC', headId: 'u-7' },
{ id: 'org-13', name: 'Enterprise Sales', type: 'team', parentId: 'org-8', code: 'SLS-ENT', headId: 'u-10' }];


export const positions = [
'Chief Executive Officer',
'Chief Technology Officer',
'Engineering Manager',
'Tech Lead',
'Senior Software Engineer',
'Software Engineer',
'Security Analyst',
'HR Manager',
'Sales Director',
'Account Executive'];


/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export const roles: Role[] = [
{
  id: 'r-1',
  name: 'Super Admin',
  description: 'Unrestricted access to every module and configuration surface.',
  isSystem: true,
  dataScope: 'all',
  permissions: perms({}, all),
  memberCount: 1
},
{
  id: 'r-2',
  name: 'Admin',
  description: 'Manages the KPI engine configuration without billing or tenancy control.',
  isSystem: true,
  dataScope: 'all',
  permissions: perms({ audit: readOnly }, all),
  memberCount: 2
},
{
  id: 'r-3',
  name: 'HR',
  description: 'Owns cycles, assignments and the final approval gate.',
  isSystem: true,
  dataScope: 'all',
  permissions: perms(
    {
      dashboard: readOnly,
      users: ['view', 'create', 'edit', 'export'],
      organization: readOnly,
      templates: ['view', 'create', 'edit'],
      builder: ['view', 'edit'],
      assignments: all,
      reviews: ['view', 'edit', 'approve'],
      approvals: ['view', 'approve'],
      reports: ['view', 'export'],
      settings: ['view', 'edit'],
      audit: readOnly
    },
    []
  ),
  memberCount: 2
},
{
  id: 'r-4',
  name: 'Department Head',
  description: 'Approves department-scoped assessments and reviews aggregate performance.',
  isSystem: true,
  dataScope: 'department',
  permissions: perms(
    {
      dashboard: readOnly,
      users: readOnly,
      organization: readOnly,
      templates: readOnly,
      assignments: ['view', 'create'],
      reviews: ['view', 'edit', 'approve'],
      approvals: ['view', 'approve'],
      reports: ['view', 'export']
    },
    []
  ),
  memberCount: 4
},
{
  id: 'r-5',
  name: 'Manager',
  description: 'Reviews and scores direct reports, may override employee scores.',
  isSystem: true,
  dataScope: 'team',
  permissions: perms(
    {
      dashboard: readOnly,
      users: readOnly,
      reviews: ['view', 'edit', 'approve'],
      approvals: ['view', 'approve'],
      reports: readOnly
    },
    []
  ),
  memberCount: 5
},
{
  id: 'r-6',
  name: 'Team Leader',
  description: 'First-level reviewer for team members.',
  isSystem: true,
  dataScope: 'team',
  permissions: perms(
    { dashboard: readOnly, reviews: ['view', 'edit'], approvals: ['view', 'approve'] },
    []
  ),
  memberCount: 3
},
{
  id: 'r-7',
  name: 'Employee',
  description: 'Fills in the assessment, self appraisal and evidence for their own KPIs.',
  isSystem: true,
  dataScope: 'self',
  permissions: perms({ dashboard: readOnly, reviews: ['view', 'edit'] }, []),
  memberCount: 24
},
{
  id: 'r-8',
  name: 'Auditor',
  description: 'Read-only access to every record including the full audit trail.',
  isSystem: true,
  dataScope: 'all',
  permissions: perms({}, readOnly),
  memberCount: 1
},
{
  id: 'r-9',
  name: 'Viewer',
  description: 'Dashboard and report visibility only.',
  isSystem: false,
  dataScope: 'department',
  permissions: perms({ dashboard: readOnly, reports: readOnly }, []),
  memberCount: 2
}];


/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

function u(
id: string,
employeeId: string,
name: string,
position: string,
orgNodeId: string,
managerId: string | null,
roleId: string,
extra: Partial<User> = {})
: User {
  return {
    id,
    employeeId,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@northwind.io`,
    phone: '+62 812 3456 ' + employeeId.slice(-4),
    orgNodeId,
    position,
    jobTitle: position,
    managerId,
    roleId,
    employmentType: 'Full-time',
    joinDate: '2021-03-15',
    status: 'active',
    ...extra
  };
}

export const users: User[] = [
u('u-1', 'EMP-1001', 'Amara Okafor', 'Chief Executive Officer', 'org-1', null, 'r-1', { joinDate: '2018-01-08' }),
u('u-2', 'EMP-1002', 'Daniel Reyes', 'Chief Technology Officer', 'org-4', 'u-1', 'r-2', { joinDate: '2018-06-01' }),
u('u-3', 'EMP-1003', 'Priya Nair', 'Engineering Manager', 'org-6', 'u-2', 'r-4', { joinDate: '2019-02-11' }),
u('u-4', 'EMP-1004', 'Marcus Feld', 'Tech Lead', 'org-10', 'u-3', 'r-6', { joinDate: '2020-08-24' }),
u('u-5', 'EMP-1005', 'Sofia Lindqvist', 'HR Manager', 'org-9', 'u-1', 'r-3', { joinDate: '2019-09-02' }),
u('u-6', 'EMP-1006', 'Kenji Watanabe', 'Engineering Manager', 'org-11', 'u-3', 'r-5', { joinDate: '2020-01-20' }),
u('u-7', 'EMP-1007', 'Lena Brandt', 'Security Analyst', 'org-12', 'u-2', 'r-4', { joinDate: '2021-05-17' }),
u('u-8', 'EMP-1008', 'Tobias Meyer', 'Senior Software Engineer', 'org-10', 'u-4', 'r-7', { joinDate: '2021-11-08' }),
u('u-9', 'EMP-1009', 'Rania Haddad', 'Sales Director', 'org-8', 'u-1', 'r-4', { joinDate: '2019-04-01' }),
u('u-10', 'EMP-1010', 'Chris Bennett', 'Account Executive', 'org-13', 'u-9', 'r-5', { joinDate: '2022-02-14' }),
u('u-11', 'EMP-1011', 'Yuki Tanaka', 'Software Engineer', 'org-10', 'u-4', 'r-7', { joinDate: '2022-07-04' }),
u('u-12', 'EMP-1012', 'Ibrahim Sesay', 'Software Engineer', 'org-11', 'u-6', 'r-7', { joinDate: '2023-01-16' }),
u('u-13', 'EMP-1013', 'Elena Costa', 'Senior Software Engineer', 'org-11', 'u-6', 'r-7', { joinDate: '2021-10-11' }),
u('u-14', 'EMP-1014', 'Noah Whitfield', 'Security Analyst', 'org-12', 'u-7', 'r-7', {
  joinDate: '2024-03-04',
  employmentType: 'Probation'
}),
u('u-15', 'EMP-1015', 'Grace Mwangi', 'Account Executive', 'org-13', 'u-10', 'r-7', {
  joinDate: '2023-06-19',
  status: 'inactive'
}),
u('u-16', 'EMP-1016', 'Oscar Delgado', 'Software Engineer', 'org-10', 'u-4', 'r-7', {
  joinDate: '2024-09-02',
  employmentType: 'Contract'
}),
u('u-17', 'EMP-1017', 'Hanna Virtanen', 'Software Engineer', 'org-11', 'u-6', 'r-7', {
  joinDate: '2025-01-13',
  employmentType: 'Intern',
  status: 'invited'
}),
u('u-18', 'EMP-1018', 'Victor Adeyemi', 'Security Analyst', 'org-12', 'u-7', 'r-8', { joinDate: '2022-11-28' })];


/* ------------------------------------------------------------------ */
/* KPI configuration                                                   */
/* ------------------------------------------------------------------ */

export const categories: KpiCategory[] = [
{ id: 'c-1', name: 'Attendance', description: 'Presence, punctuality and availability.', defaultWeight: 10, active: true, itemCount: 6 },
{ id: 'c-2', name: 'Productivity', description: 'Throughput and delivery predictability.', defaultWeight: 25, active: true, itemCount: 14 },
{ id: 'c-3', name: 'Technical Skills', description: 'Craft, code quality and architecture.', defaultWeight: 20, active: true, itemCount: 11 },
{ id: 'c-4', name: 'Leadership', description: 'Direction setting and people growth.', defaultWeight: 15, active: true, itemCount: 8 },
{ id: 'c-5', name: 'Teamwork', description: 'Collaboration across squads.', defaultWeight: 10, active: true, itemCount: 5 },
{ id: 'c-6', name: 'Communication', description: 'Clarity, written and verbal.', defaultWeight: 10, active: true, itemCount: 4 },
{ id: 'c-7', name: 'Innovation', description: 'Improvement proposals adopted.', defaultWeight: 5, active: true, itemCount: 3 },
{ id: 'c-8', name: 'Customer Satisfaction', description: 'CSAT and escalation handling.', defaultWeight: 15, active: true, itemCount: 7 },
{ id: 'c-9', name: 'Documentation', description: 'Runbooks, ADRs and handover quality.', defaultWeight: 5, active: true, itemCount: 4 },
{ id: 'c-10', name: 'Security', description: 'Secure engineering practice.', defaultWeight: 15, active: true, itemCount: 9 },
{ id: 'c-11', name: 'Compliance', description: 'ISO 27001 and internal policy adherence.', defaultWeight: 10, active: false, itemCount: 6 }];


export const scales: RatingScale[] = [
{
  id: 's-1',
  name: 'Standard 1–5',
  type: 'numeric',
  min: 1,
  max: 5,
  passingScore: 3,
  formula: 'SUM(item.score * item.weight) / SUM(item.weight)',
  levels: [
  { label: 'Outstanding', min: 4.5, max: 5, tone: 'positive' },
  { label: 'Exceeds', min: 3.5, max: 4.49, tone: 'positive' },
  { label: 'Meets', min: 2.5, max: 3.49, tone: 'info' },
  { label: 'Needs Improvement', min: 1.5, max: 2.49, tone: 'warning' },
  { label: 'Unsatisfactory', min: 0, max: 1.49, tone: 'danger' }]

},
{
  id: 's-2',
  name: 'Percentage Achievement',
  type: 'percentage',
  min: 0,
  max: 100,
  passingScore: 70,
  formula: 'SUM(actual / target * weight)',
  levels: [
  { label: 'A', min: 90, max: 100, tone: 'positive' },
  { label: 'B', min: 80, max: 89.99, tone: 'positive' },
  { label: 'C', min: 70, max: 79.99, tone: 'info' },
  { label: 'D', min: 60, max: 69.99, tone: 'warning' },
  { label: 'E', min: 0, max: 59.99, tone: 'danger' }]

},
{
  id: 's-3',
  name: 'Traffic Light',
  type: 'traffic-light',
  min: 0,
  max: 3,
  passingScore: 2,
  formula: 'MIN(item.status)',
  levels: [
  { label: 'Green', min: 2.5, max: 3, tone: 'positive' },
  { label: 'Amber', min: 1.5, max: 2.49, tone: 'warning' },
  { label: 'Red', min: 0, max: 1.49, tone: 'danger' }]

},
{
  id: 's-4',
  name: 'Five Star',
  type: 'five-star',
  min: 0,
  max: 5,
  passingScore: 3,
  formula: 'AVG(item.stars)',
  levels: [
  { label: '★★★★★', min: 4.5, max: 5, tone: 'positive' },
  { label: '★★★★', min: 3.5, max: 4.49, tone: 'positive' },
  { label: '★★★', min: 2.5, max: 3.49, tone: 'info' },
  { label: '★★', min: 1.5, max: 2.49, tone: 'warning' },
  { label: '★', min: 0, max: 1.49, tone: 'danger' }]

}];


export const workflows: Workflow[] = [
{
  id: 'w-1',
  name: 'Standard Performance Approval',
  description: 'Default six-stage chain used by all engineering and commercial templates.',
  active: true,
  steps: [
  { id: 'ws-1', name: 'Employee Submission', roleId: 'r-7', slaDays: 5, canOverrideScore: false, optional: false },
  { id: 'ws-2', name: 'Team Leader Review', roleId: 'r-6', slaDays: 3, canOverrideScore: true, optional: false },
  { id: 'ws-3', name: 'Manager Review', roleId: 'r-5', slaDays: 3, canOverrideScore: true, optional: false },
  { id: 'ws-4', name: 'Department Head Review', roleId: 'r-4', slaDays: 2, canOverrideScore: true, optional: false },
  { id: 'ws-5', name: 'HR Calibration', roleId: 'r-3', slaDays: 3, canOverrideScore: true, optional: false },
  { id: 'ws-6', name: 'Final Approval', roleId: 'r-2', slaDays: 2, canOverrideScore: false, optional: false }]

},
{
  id: 'w-2',
  name: 'Probation Fast Track',
  description: 'Shortened chain for probation evaluations.',
  active: true,
  steps: [
  { id: 'ws-7', name: 'Employee Submission', roleId: 'r-7', slaDays: 3, canOverrideScore: false, optional: false },
  { id: 'ws-8', name: 'Manager Review', roleId: 'r-5', slaDays: 2, canOverrideScore: true, optional: false },
  { id: 'ws-9', name: 'HR Decision', roleId: 'r-3', slaDays: 2, canOverrideScore: true, optional: false }]

}];


export const cycles: KpiCycle[] = [
{ id: 'cy-1', name: 'Q3 2026 Performance', type: 'Quarterly', startDate: '2026-07-01', endDate: '2026-09-30', dueDate: '2026-10-07', lockDate: '2026-10-14', status: 'active', assignmentCount: 18, completion: 46 },
{ id: 'cy-2', name: 'Q2 2026 Performance', type: 'Quarterly', startDate: '2026-04-01', endDate: '2026-06-30', dueDate: '2026-07-07', lockDate: '2026-07-14', status: 'locked', assignmentCount: 18, completion: 100 },
{ id: 'cy-3', name: 'July 2026 Monthly Ops', type: 'Monthly', startDate: '2026-07-01', endDate: '2026-07-31', dueDate: '2026-08-05', lockDate: '2026-08-08', status: 'in-review', assignmentCount: 12, completion: 83 },
{ id: 'cy-4', name: 'FY2026 Annual Review', type: 'Yearly', startDate: '2026-01-01', endDate: '2026-12-31', dueDate: '2027-01-15', lockDate: '2027-01-31', status: 'draft', assignmentCount: 0, completion: 0 },
{ id: 'cy-5', name: 'H1 2026 Leadership', type: 'Half-Yearly', startDate: '2026-01-01', endDate: '2026-06-30', dueDate: '2026-07-10', lockDate: '2026-07-20', status: 'closed', assignmentCount: 9, completion: 100 }];


export const templates: KpiTemplate[] = [
{
  id: 't-1',
  title: 'Software Engineer KPI',
  description: 'Delivery, craft and collaboration scorecard for individual contributors in Engineering.',
  version: 'v3.2',
  status: 'published',
  orgNodeId: 'org-6',
  position: 'Software Engineer',
  scaleId: 's-1',
  workflowId: 'w-1',
  updatedAt: '2026-07-12',
  updatedBy: 'u-3',
  sections: [
  {
    id: 'sec-1',
    title: 'Delivery & Productivity',
    subtitle: 'Predictable, high-quality shipping',
    description: 'Measures how reliably the engineer converts committed work into shipped value.',
    weight: 40,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-1', type: 'kpi', label: 'Sprint commitment met', helpText: 'Percentage of committed story points delivered inside the sprint.', required: true, hidden: false, weight: 15, categoryId: 'c-2', scaleId: 's-2', target: '90%', min: 0, max: 100 },
    { id: 'f-2', type: 'percentage', label: 'Cycle time within SLA', helpText: 'Share of tickets closed within the agreed cycle time.', required: true, hidden: false, weight: 10, categoryId: 'c-2', min: 0, max: 100, target: '85%' },
    { id: 'f-3', type: 'number', label: 'Production incidents caused', required: true, hidden: false, weight: 8, categoryId: 'c-2', min: 0, max: 20, target: '≤ 1' },
    { id: 'f-4', type: 'formula', label: 'Delivery composite', helpText: 'Auto-calculated from the three metrics above.', required: false, hidden: false, weight: 7, formula: '(f-1 * 0.5) + (f-2 * 0.35) + ((20 - f-3) * 0.15)' },
    { id: 'f-5', type: 'attachment', label: 'Delivery evidence', helpText: 'Sprint reports, dashboards or release notes.', required: false, hidden: false }]

  },
  {
    id: 'sec-2',
    title: 'Technical Craft',
    subtitle: 'Code quality and system thinking',
    weight: 30,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-6', type: 'rating', label: 'Code review quality', required: true, hidden: false, weight: 10, categoryId: 'c-3', scaleId: 's-1', min: 1, max: 5 },
    { id: 'f-7', type: 'rating', label: 'Architecture & design contribution', required: true, hidden: false, weight: 10, categoryId: 'c-3', scaleId: 's-1', min: 1, max: 5 },
    { id: 'f-8', type: 'percentage', label: 'Automated test coverage on owned modules', required: true, hidden: false, weight: 10, categoryId: 'c-3', min: 0, max: 100, target: '80%' },
    { id: 'f-9', type: 'dropdown', label: 'Primary technical growth area', required: false, hidden: false, options: ['Distributed systems', 'Frontend performance', 'Data modelling', 'Security engineering', 'Developer experience'] }]

  },
  {
    id: 'sec-3',
    title: 'Collaboration & Communication',
    weight: 20,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-10', type: 'rating', label: 'Cross-team collaboration', required: true, hidden: false, weight: 10, categoryId: 'c-5', scaleId: 's-1', min: 1, max: 5 },
    { id: 'f-11', type: 'rating', label: 'Written communication clarity', required: true, hidden: false, weight: 5, categoryId: 'c-6', scaleId: 's-1', min: 1, max: 5 },
    { id: 'f-12', type: 'checkbox', label: 'Mentored at least one engineer this cycle', required: false, hidden: false, weight: 5, categoryId: 'c-4' },
    { id: 'f-13', type: 'textarea', label: 'Notable collaboration example', helpText: 'Only required when the mentoring checkbox is ticked.', required: false, hidden: false, condition: { fieldId: 'f-12', operator: 'equals', value: 'true' } }]

  },
  {
    id: 'sec-4',
    title: 'Compliance & Security',
    weight: 10,
    collapsed: true,
    hidden: false,
    fields: [
    { id: 'f-14', type: 'checkbox', label: 'Completed mandatory security training', required: true, hidden: false, weight: 5, categoryId: 'c-10' },
    { id: 'f-15', type: 'radio', label: 'Policy adherence', required: true, hidden: false, weight: 5, categoryId: 'c-11', options: ['Full', 'Partial', 'Non-compliant'] },
    { id: 'f-16', type: 'date', label: 'Last access review completed', required: false, hidden: false },
    { id: 'f-17', type: 'comment', label: 'Reviewer notes', required: false, hidden: false }]

  }]

},
{
  id: 't-2',
  title: 'Sales KPI',
  description: 'Quota attainment, pipeline hygiene and customer outcomes for the commercial org.',
  version: 'v2.0',
  status: 'published',
  orgNodeId: 'org-8',
  position: 'Account Executive',
  scaleId: 's-2',
  workflowId: 'w-1',
  updatedAt: '2026-06-28',
  updatedBy: 'u-9',
  sections: [
  {
    id: 'sec-5',
    title: 'Revenue Attainment',
    weight: 60,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-20', type: 'percentage', label: 'Quota attainment', required: true, hidden: false, weight: 35, categoryId: 'c-2', min: 0, max: 200, target: '100%' },
    { id: 'f-21', type: 'number', label: 'New logos closed', required: true, hidden: false, weight: 15, categoryId: 'c-2', min: 0, max: 50, target: '4' },
    { id: 'f-22', type: 'percentage', label: 'Pipeline coverage', required: true, hidden: false, weight: 10, categoryId: 'c-2', min: 0, max: 500, target: '300%' }]

  },
  {
    id: 'sec-6',
    title: 'Customer Outcomes',
    weight: 40,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-23', type: 'rating', label: 'Customer satisfaction (CSAT)', required: true, hidden: false, weight: 20, categoryId: 'c-8', scaleId: 's-4', min: 1, max: 5 },
    { id: 'f-24', type: 'percentage', label: 'Renewal rate', required: true, hidden: false, weight: 20, categoryId: 'c-8', min: 0, max: 100, target: '95%' }]

  }]

},
{
  id: 't-3',
  title: 'Information Security KPI',
  description: 'ISO 27001 aligned scorecard for the security and GRC function.',
  version: 'v1.4',
  status: 'published',
  orgNodeId: 'org-7',
  position: 'Security Analyst',
  scaleId: 's-3',
  workflowId: 'w-1',
  updatedAt: '2026-07-02',
  updatedBy: 'u-7',
  sections: [
  {
    id: 'sec-7',
    title: 'Threat & Vulnerability Management',
    weight: 50,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-30', type: 'percentage', label: 'Critical vulnerabilities remediated in SLA', required: true, hidden: false, weight: 25, categoryId: 'c-10', min: 0, max: 100, target: '100%' },
    { id: 'f-31', type: 'number', label: 'Mean time to detect (hours)', required: true, hidden: false, weight: 25, categoryId: 'c-10', min: 0, max: 200, target: '≤ 4' }]

  },
  {
    id: 'sec-8',
    title: 'Compliance',
    weight: 50,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-32', type: 'percentage', label: 'ISO 27001 control coverage', required: true, hidden: false, weight: 30, categoryId: 'c-11', min: 0, max: 100, target: '98%' },
    { id: 'f-33', type: 'number', label: 'Open audit findings', required: true, hidden: false, weight: 20, categoryId: 'c-11', min: 0, max: 50, target: '0' }]

  }]

},
{
  id: 't-4',
  title: 'HR Business Partner KPI',
  description: 'Draft scorecard for People & Culture partners.',
  version: 'v0.3',
  status: 'draft',
  orgNodeId: 'org-9',
  position: 'HR Manager',
  scaleId: 's-1',
  workflowId: 'w-1',
  updatedAt: '2026-07-20',
  updatedBy: 'u-5',
  sections: [
  {
    id: 'sec-9',
    title: 'Talent Operations',
    weight: 100,
    collapsed: false,
    hidden: false,
    fields: [
    { id: 'f-40', type: 'number', label: 'Time to hire (days)', required: true, hidden: false, weight: 50, categoryId: 'c-2', min: 0, max: 180, target: '≤ 30' },
    { id: 'f-41', type: 'percentage', label: 'Voluntary attrition', required: true, hidden: false, weight: 50, categoryId: 'c-2', min: 0, max: 100, target: '≤ 8%' }]

  }]

},
{
  id: 't-5',
  title: 'Finance Analyst KPI (Archived)',
  description: 'Superseded by the FY2026 finance scorecard.',
  version: 'v1.0',
  status: 'archived',
  orgNodeId: null,
  position: 'Finance Analyst',
  scaleId: 's-1',
  workflowId: 'w-1',
  updatedAt: '2025-12-01',
  updatedBy: 'u-2',
  sections: []
}];


export const assignments: Assignment[] = [
{ id: 'a-1', templateId: 't-1', cycleId: 'cy-1', targetType: 'department', targetLabel: 'Engineering', assigneeCount: 8, dueDate: '2026-10-07', status: 'active', createdAt: '2026-07-01' },
{ id: 'a-2', templateId: 't-2', cycleId: 'cy-1', targetType: 'team', targetLabel: 'Enterprise Sales', assigneeCount: 3, dueDate: '2026-10-07', status: 'active', createdAt: '2026-07-01' },
{ id: 'a-3', templateId: 't-3', cycleId: 'cy-1', targetType: 'department', targetLabel: 'Information Security', assigneeCount: 3, dueDate: '2026-10-07', status: 'active', createdAt: '2026-07-01' },
{ id: 'a-4', templateId: 't-1', cycleId: 'cy-3', targetType: 'position', targetLabel: 'Software Engineer', assigneeCount: 6, dueDate: '2026-08-05', status: 'active', createdAt: '2026-07-01' },
{ id: 'a-5', templateId: 't-1', cycleId: 'cy-2', targetType: 'department', targetLabel: 'Engineering', assigneeCount: 8, dueDate: '2026-07-07', status: 'completed', createdAt: '2026-04-01' },
{ id: 'a-6', templateId: 't-4', cycleId: 'cy-4', targetType: 'employee', targetLabel: 'Sofia Lindqvist', assigneeCount: 1, dueDate: '2027-01-15', status: 'scheduled', createdAt: '2026-07-20' }];


/* ------------------------------------------------------------------ */
/* Assessments                                                         */
/* ------------------------------------------------------------------ */

const standardApprovals = (upTo: number) =>
workflows[0].steps.map((s, i) => ({
  stepId: s.id,
  stepName: s.name,
  approverId: ['u-11', 'u-4', 'u-6', 'u-3', 'u-5', 'u-2'][i],
  status: (i < upTo ? 'approved' : i === upTo ? 'pending' : 'skipped') as
  'approved' |
  'pending' |
  'skipped',
  actedAt: i < upTo ? `2026-07-${String(10 + i).padStart(2, '0')}` : undefined,
  note: i < upTo ? 'Scores validated against delivery data.' : undefined
}));

function makeAssessment(
id: string,
userId: string,
templateId: string,
status: Assessment['status'],
selfScore: number,
managerScore: number | null,
finalScore: number | null,
rating: string | null,
step: number)
: Assessment {
  return {
    id,
    assignmentId: 'a-1',
    userId,
    templateId,
    cycleId: 'cy-1',
    status,
    responses: {
      'f-1': 92,
      'f-2': 88,
      'f-3': 1,
      'f-6': 4,
      'f-7': 4,
      'f-8': 78,
      'f-10': 4,
      'f-11': 3,
      'f-12': true,
      'f-14': true,
      'f-15': 'Full'
    },
    selfAppraisal: {
      achievements:
      'Led the migration of the billing service to the new event pipeline, cutting reconciliation time from 6 hours to 25 minutes.',
      challenges:
      'Coordination with the data platform team slipped twice because ownership of the schema registry was unclear.',
      improvementPlan:
      'Take the distributed systems deep-dive track and drive the schema ownership RFC to a decision by mid-cycle.',
      selfRating: 4
    },
    selfScore,
    managerScore,
    finalScore,
    rating,
    currentStep: step,
    approvals: standardApprovals(step),
    comments: [
    {
      id: `${id}-cm-1`,
      authorId: userId,
      role: 'employee',
      fieldId: 'f-1',
      body: 'Sprint 14 was affected by the incident freeze, so the committed points were re-baselined with the tech lead.',
      createdAt: '2026-07-09T09:24:00Z',
      mentions: ['u-4'],
      replies: [
      {
        id: `${id}-cm-1-r1`,
        authorId: 'u-4',
        role: 'reviewer',
        body: 'Confirmed — I re-baselined that sprint. Attainment stands at 92%.',
        createdAt: '2026-07-09T11:02:00Z',
        mentions: [],
        replies: []
      }]

    },
    {
      id: `${id}-cm-2`,
      authorId: 'u-5',
      role: 'hr',
      body: 'Calibration note: this score sits in the top quartile for the Engineering department this cycle.',
      createdAt: '2026-07-14T14:40:00Z',
      mentions: [],
      replies: []
    }],

    evidence: [
    { id: `${id}-ev-1`, name: 'sprint-report-q3.pdf', type: 'pdf', size: '1.2 MB', uploadedBy: userId, uploadedAt: '2026-07-08', version: 2, fieldId: 'f-5' },
    { id: `${id}-ev-2`, name: 'coverage-dashboard.png', type: 'image', size: '480 KB', uploadedBy: userId, uploadedAt: '2026-07-08', version: 1, fieldId: 'f-8' },
    { id: `${id}-ev-3`, name: 'incident-postmortems.zip', type: 'zip', size: '6.4 MB', uploadedBy: userId, uploadedAt: '2026-07-09', version: 1 }],

    history: [
    { id: `${id}-h-1`, at: '2026-07-08T10:00:00Z', actorId: userId, action: 'Draft saved', detail: '11 of 17 fields completed' },
    { id: `${id}-h-2`, at: '2026-07-09T16:20:00Z', actorId: userId, action: 'Submitted', detail: `Self score ${selfScore}` },
    { id: `${id}-h-3`, at: '2026-07-11T09:12:00Z', actorId: 'u-4', action: 'Score overridden', detail: 'Code review quality 5 → 4' }],

    submittedAt: '2026-07-09',
    updatedAt: '2026-07-14'
  };
}

export const assessments: Assessment[] = [
makeAssessment('as-1', 'u-11', 't-1', 'in-review', 4.2, 4.0, null, null, 3),
makeAssessment('as-2', 'u-8', 't-1', 'approved', 4.6, 4.5, 4.5, 'Outstanding', 6),
makeAssessment('as-3', 'u-13', 't-1', 'submitted', 3.9, null, null, null, 1),
makeAssessment('as-4', 'u-12', 't-1', 'revision-requested', 3.1, 2.8, null, null, 2),
makeAssessment('as-5', 'u-16', 't-1', 'draft', 0, null, null, null, 0),
makeAssessment('as-6', 'u-14', 't-3', 'in-review', 3.6, 3.4, null, null, 2),
makeAssessment('as-7', 'u-10', 't-2', 'approved', 4.1, 4.2, 4.2, 'Exceeds', 6),
makeAssessment('as-8', 'u-17', 't-1', 'not-started', 0, null, null, null, 0)];


/* ------------------------------------------------------------------ */
/* Platform data                                                       */
/* ------------------------------------------------------------------ */

export const auditLogs: AuditLog[] = [
{ id: 'al-1', at: '2026-07-27T08:12:04Z', actorId: 'u-5', action: 'Approved assessment', module: 'KPI Approval', entity: 'as-2 · Tobias Meyer', ip: '103.28.14.9', severity: 'info' },
{ id: 'al-2', at: '2026-07-27T07:58:41Z', actorId: 'u-4', action: 'Overrode score', module: 'KPI Reviews', entity: 'as-1 · f-6 (5 → 4)', ip: '103.28.14.44', severity: 'warning' },
{ id: 'al-3', at: '2026-07-26T17:30:12Z', actorId: 'u-2', action: 'Published template', module: 'KPI Templates', entity: 't-1 · v3.2', ip: '10.4.1.22', severity: 'info' },
{ id: 'al-4', at: '2026-07-26T15:02:55Z', actorId: 'u-3', action: 'Deleted KPI item', module: 'KPI Builder', entity: 't-1 · f-18 Legacy metric', ip: '10.4.1.31', severity: 'critical' },
{ id: 'al-5', at: '2026-07-26T09:41:00Z', actorId: 'u-1', action: 'Login', module: 'Authentication', entity: 'Session started · 2FA verified', ip: '182.253.5.6', severity: 'info' },
{ id: 'al-6', at: '2026-07-25T18:22:19Z', actorId: 'u-5', action: 'Bulk assigned KPI', module: 'KPI Assignment', entity: 'a-1 · 8 employees', ip: '103.28.14.9', severity: 'info' },
{ id: 'al-7', at: '2026-07-25T14:07:33Z', actorId: 'u-18', action: 'Exported report', module: 'Reports', entity: 'Department report · Engineering', ip: '203.9.44.2', severity: 'info' },
{ id: 'al-8', at: '2026-07-25T11:15:48Z', actorId: 'u-2', action: 'Changed role permissions', module: 'Settings', entity: 'r-9 Viewer · +reports.export', ip: '10.4.1.22', severity: 'warning' },
{ id: 'al-9', at: '2026-07-24T20:44:02Z', actorId: 'u-12', action: 'Failed login', module: 'Authentication', entity: '3 consecutive attempts', ip: '118.99.7.201', severity: 'critical' },
{ id: 'al-10', at: '2026-07-24T13:09:27Z', actorId: 'u-6', action: 'Requested revision', module: 'KPI Reviews', entity: 'as-4 · Ibrahim Sesay', ip: '10.4.1.77', severity: 'info' },
{ id: 'al-11', at: '2026-07-23T10:35:14Z', actorId: 'u-5', action: 'Created cycle', module: 'Settings', entity: 'cy-4 · FY2026 Annual Review', ip: '103.28.14.9', severity: 'info' },
{ id: 'al-12', at: '2026-07-22T16:51:39Z', actorId: 'u-3', action: 'Deactivated user', module: 'Users', entity: 'u-15 · Grace Mwangi', ip: '10.4.1.31', severity: 'warning' }];


export const notifications: AppNotification[] = [
{ id: 'n-1', type: 'approval', title: 'Approval required', body: 'Yuki Tanaka’s Q3 assessment is waiting at Manager Review.', at: '12 min ago', read: false },
{ id: 'n-2', type: 'mention', title: 'You were mentioned', body: 'Marcus Feld mentioned you on “Sprint commitment met”.', at: '1 hr ago', read: false },
{ id: 'n-3', type: 'due', title: 'Cycle due in 5 days', body: 'Q3 2026 Performance closes on 7 Oct 2026.', at: '3 hrs ago', read: false },
{ id: 'n-4', type: 'comment', title: 'New reviewer comment', body: 'Priya Nair commented on Elena Costa’s technical craft section.', at: 'Yesterday', read: true },
{ id: 'n-5', type: 'rejected', title: 'Revision requested', body: 'Ibrahim Sesay’s assessment was returned for revision.', at: '2 days ago', read: true },
{ id: 'n-6', type: 'system', title: 'Template published', body: 'Software Engineer KPI v3.2 is now live for Engineering.', at: '3 days ago', read: true }];


export const sessions: LoginSession[] = [
{ id: 'se-1', device: 'MacBook Pro 16"', browser: 'Chrome 141', location: 'Jakarta, ID', ip: '103.28.14.9', lastActive: 'Active now', current: true },
{ id: 'se-2', device: 'iPhone 17 Pro', browser: 'Safari Mobile', location: 'Jakarta, ID', ip: '182.253.5.6', lastActive: '2 hours ago', current: false },
{ id: 'se-3', device: 'Windows Workstation', browser: 'Edge 140', location: 'Singapore, SG', ip: '203.9.44.2', lastActive: '4 days ago', current: false }];


export const scoreTrend = [
{ period: 'Q1 25', company: 3.6, engineering: 3.7, sales: 3.4, security: 3.8 },
{ period: 'Q2 25', company: 3.7, engineering: 3.8, sales: 3.5, security: 3.9 },
{ period: 'Q3 25', company: 3.8, engineering: 3.9, sales: 3.7, security: 3.8 },
{ period: 'Q4 25', company: 3.9, engineering: 4.0, sales: 3.8, security: 4.0 },
{ period: 'Q1 26', company: 4.0, engineering: 4.1, sales: 3.9, security: 4.1 },
{ period: 'Q2 26', company: 4.1, engineering: 4.2, sales: 4.0, security: 4.0 },
{ period: 'Q3 26', company: 4.2, engineering: 4.3, sales: 4.1, security: 4.2 }];


export const distribution = [
{ band: 'Unsatisfactory', count: 1 },
{ band: 'Needs Improvement', count: 3 },
{ band: 'Meets', count: 9 },
{ band: 'Exceeds', count: 12 },
{ band: 'Outstanding', count: 5 }];


export const departmentPerformance = [
{ name: 'Engineering', score: 4.3, completion: 82, headcount: 9 },
{ name: 'Information Security', score: 4.2, completion: 67, headcount: 4 },
{ name: 'Sales', score: 4.1, completion: 74, headcount: 3 },
{ name: 'People & Culture', score: 3.9, completion: 50, headcount: 1 }];


export const competencyRadar = [
{ competency: 'Productivity', team: 4.3, company: 4.0 },
{ competency: 'Technical', team: 4.4, company: 3.9 },
{ competency: 'Leadership', team: 3.6, company: 3.7 },
{ competency: 'Teamwork', team: 4.1, company: 4.0 },
{ competency: 'Communication', team: 3.8, company: 3.9 },
{ competency: 'Security', team: 4.5, company: 4.1 }];