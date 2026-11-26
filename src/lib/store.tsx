import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as seed from './mockData';
import {
  canEditEvaluation,
  hasCapability,
  scorableEmployees,
  scoringGrant,
  type AccessData } from
'./permissions';
import { isValidScore, summarise } from './scoring';
import type {
  AppNotification,
  AuditLog,
  Branch,
  Capability,
  Employee,
  Evaluation,
  EvaluationCycle,
  ID,
  Position,
  Rank,
  ReviewSummary,
  Role,
  RoleAssignment,
  ScoreBand,
  Team } from
'./types';
import { fullName, uid } from './utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: 'default' | 'success' | 'danger';
}

interface Branding {
  companyName: string;
  productName: string;
  locale: string;
  timezone: string;
  dateFormat: string;
}

export interface EvaluationInput {
  score: number;
  comment: string;
  isDeduction: boolean;
}

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

interface AppState {
  /* auth */
  authenticated: boolean;
  me: Employee;
  login: (email: string) => boolean;
  logout: () => void;
  viewAs: (employeeId: ID) => void;

  /* theme */
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  /* data */
  branches: Branch[];
  teams: Team[];
  ranks: Rank[];
  positions: Position[];
  employees: Employee[];
  roles: Role[];
  assignments: RoleAssignment[];
  cycles: EvaluationCycle[];
  evaluations: Evaluation[];
  bands: ScoreBand[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  branding: Branding;

  /* configuration (admin screens) */
  setBranches: Setter<Branch[]>;
  setTeams: Setter<Team[]>;
  setRanks: Setter<Rank[]>;
  setPositions: Setter<Position[]>;
  setEmployees: Setter<Employee[]>;
  setRoles: Setter<Role[]>;
  setAssignments: Setter<RoleAssignment[]>;
  setBands: Setter<ScoreBand[]>;
  setBranding: Setter<Branding>;

  /* access */
  access: AccessData;
  can: (capability: Capability) => boolean;
  activeCycle: EvaluationCycle | undefined;
  scorable: Employee[];

  /* evaluation & cycle actions — each returns an error message, or null on success */
  saveEvaluation: (evaluateeId: ID, input: EvaluationInput, submit: boolean) => string | null;
  reviseEvaluation: (evaluationId: ID, input: EvaluationInput, reason: string) => string | null;
  createCycle: (half: 'H1' | 'H2', year: number) => string | null;
  activateCycle: (cycleId: ID) => string | null;
  closeCycle: (cycleId: ID) => string | null;
  summaryFor: (cycleId: ID, employeeId: ID) => ReviewSummary;

  /* platform */
  notify: (n: Pick<AppNotification, 'type' | 'title' | 'body' | 'employeeId'>) => void;
  markNotificationsRead: () => void;
  logAction: (action: string, module: string, entity: string, severity?: AuditLog['severity']) => void;

  /* lookups */
  employeeById: (id: ID | null | undefined) => Employee | undefined;
  nameOf: (id: ID | null | undefined) => string;
  teamById: (id: ID | null | undefined) => Team | undefined;
  branchById: (id: ID | null | undefined) => Branch | undefined;
  rankById: (id: ID | null | undefined) => Rank | undefined;
  positionById: (id: ID | null | undefined) => Position | undefined;
  roleById: (id: ID | null | undefined) => Role | undefined;
  bandById: (id: ID | null | undefined) => ScoreBand | undefined;

  /* toasts */
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('e-1');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [branches, setBranches] = useState<Branch[]>(seed.branches);
  const [teams, setTeams] = useState<Team[]>(seed.teams);
  const [ranks, setRanks] = useState<Rank[]>(seed.ranks);
  const [positions, setPositions] = useState<Position[]>(seed.positions);
  const [employees, setEmployees] = useState<Employee[]>(seed.employees);
  const [roles, setRoles] = useState<Role[]>(seed.roles);
  const [assignments, setAssignments] = useState<RoleAssignment[]>(seed.assignments);
  const [cycles, setCycles] = useState<EvaluationCycle[]>(seed.cycles);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(seed.evaluations);
  const [bands, setBands] = useState<ScoreBand[]>(seed.bands);
  const [summaries, setSummaries] = useState<ReviewSummary[]>(seed.summaries);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seed.auditLogs);
  const [allNotifications, setNotifications] = useState<AppNotification[]>(seed.notifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [branding, setBranding] = useState<Branding>({
    companyName: 'One Cloud Next Gen',
    productName: 'KPI Evaluation',
    locale: 'en-GB',
    timezone: 'Asia/Yangon',
    dateFormat: 'DD MMM YYYY'
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const me = employees.find((e) => e.id === currentUserId) ?? employees[0];
  const access: AccessData = { employees, roles, assignments };
  const activeCycle = cycles.find((c) => c.status === 'active');
  const can = (capability: Capability) => hasCapability(access, me.id, capability);

  const employeeById = (id: ID | null | undefined) => employees.find((e) => e.id === id);
  const nameOf = (id: ID | null | undefined) => fullName(employeeById(id));

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logAction: AppState['logAction'] = (action, module, entity, severity = 'info') => {
    setAuditLogs((prev) => [
    { id: uid('al'), at: new Date().toISOString(), actorId: me.id, action, module, entity, severity },
    ...prev]
    );
  };

  const notify: AppState['notify'] = (n) => {
    setNotifications((prev) => [
    { ...n, id: uid('n'), at: new Date().toISOString(), read: false },
    ...prev]
    );
  };

  const validate = (input: EvaluationInput, requireComment: boolean) => {
    if (!isValidScore(input.score)) return 'Enter a score between 0 and 100.';
    if (requireComment && !input.comment.trim()) return 'A comment is required.';
    return null;
  };

  const saveEvaluation: AppState['saveEvaluation'] = (evaluateeId, input, submit) => {
    if (!activeCycle) return 'There is no active cycle.';
    const grant = scoringGrant(access, me.id, employeeById(evaluateeId));
    if (!grant) return 'You are not allowed to score this employee.';
    const invalid = validate(input, submit);
    if (invalid) return invalid;

    const existing = evaluations.find(
      (e) =>
      e.cycleId === activeCycle.id && e.evaluateeId === evaluateeId && e.evaluatorId === me.id
    );
    if (existing && !canEditEvaluation(access, me.id, existing, activeCycle)) {
      return 'This entry is final and can no longer be changed.';
    }

    const now = new Date().toISOString();
    const comment = input.comment.trim();
    const status = submit || existing?.status === 'submitted' ? 'submitted' : 'draft';
    const next: Evaluation = {
      id: existing?.id ?? uid('ev'),
      cycleId: activeCycle.id,
      evaluateeId,
      evaluatorId: me.id,
      roleId: existing?.roleId ?? grant.role.id,
      score: input.score,
      isDeduction: input.isDeduction,
      comment,
      commentDate: existing && existing.comment === comment ? existing.commentDate : now,
      lastModified: now,
      status
    };
    setEvaluations((prev) =>
    existing ? prev.map((e) => e.id === existing.id ? next : e) : [next, ...prev]
    );
    logAction(
      status === 'draft' ? 'Saved draft evaluation' : existing?.status === 'submitted' ? 'Updated evaluation' : 'Submitted evaluation',
      'Evaluations',
      `${activeCycle.name} · ${nameOf(evaluateeId)}`
    );
    return null;
  };

  const reviseEvaluation: AppState['reviseEvaluation'] = (evaluationId, input, reason) => {
    const existing = evaluations.find((e) => e.id === evaluationId);
    if (!existing) return 'Entry not found.';
    const cycle = cycles.find((c) => c.id === existing.cycleId);
    if (existing.evaluatorId === me.id || !canEditEvaluation(access, me.id, existing, cycle)) {
      return 'You are not allowed to revise this entry.';
    }
    const invalid = validate(input, true);
    if (invalid) return invalid;
    if (!reason.trim()) return 'A reason is required when revising another evaluator’s entry.';

    const now = new Date().toISOString();
    const comment = input.comment.trim();
    setEvaluations((prev) =>
    prev.map((e) =>
    e.id === evaluationId ?
    {
      ...e,
      score: input.score,
      isDeduction: input.isDeduction,
      comment,
      commentDate: e.comment === comment ? e.commentDate : now,
      lastModified: now,
      revisedById: me.id
    } :
    e
    )
    );
    logAction(
      'Revised evaluation',
      'Evaluations',
      `${cycle?.name} · ${nameOf(existing.evaluateeId)} (entry by ${nameOf(existing.evaluatorId)}) · ${existing.score} → ${input.score} · Reason: ${reason.trim()}`,
      'warning'
    );
    return null;
  };

  const createCycle: AppState['createCycle'] = (half, year) => {
    if (!can('manage')) return 'Only HR can manage cycles.';
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return 'Enter a valid year.';
    if (cycles.some((c) => c.half === half && c.year === year)) return `${half} ${year} already exists.`;
    const cycle: EvaluationCycle = {
      id: uid('cy'),
      name: `${half} ${year}`,
      half,
      year,
      startDate: half === 'H1' ? `${year}-01-01` : `${year}-07-01`,
      endDate: half === 'H1' ? `${year}-06-30` : `${year}-12-31`,
      status: 'upcoming'
    };
    setCycles((prev) => [...prev, cycle]);
    logAction('Created cycle', 'Cycles', cycle.name);
    return null;
  };

  const activateCycle: AppState['activateCycle'] = (cycleId) => {
    if (!can('manage')) return 'Only HR can manage cycles.';
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle || cycle.status !== 'upcoming') return 'Only an upcoming cycle can be opened.';
    if (activeCycle) return `Close ${activeCycle.name} before opening another cycle.`;
    setCycles((prev) => prev.map((c) => c.id === cycleId ? { ...c, status: 'active' } : c));
    logAction('Activated cycle', 'Cycles', cycle.name);
    notify({
      type: 'cycle',
      title: `${cycle.name} is open for scoring`,
      body: 'The evaluation cycle is active. Scores and comments can be entered until HR closes the cycle.',
      employeeId: null
    });
    return null;
  };

  const closeCycle: AppState['closeCycle'] = (cycleId) => {
    if (!can('manage')) return 'Only HR can manage cycles.';
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle || cycle.status !== 'active') return 'Only the active cycle can be closed.';
    const closedAt = new Date().toISOString();
    const published = employees.
    filter((e) => !e.external && e.status === 'active').
    map((e) => summarise(cycleId, e.id, evaluations, bands));
    setSummaries((prev) => [...prev.filter((s) => s.cycleId !== cycleId), ...published]);
    setCycles((prev) =>
    prev.map((c) => c.id === cycleId ? { ...c, status: 'closed', closedAt } : c)
    );
    logAction('Closed cycle', 'Cycles', `${cycle.name} · results published`, 'critical');
    notify({
      type: 'result',
      title: `${cycle.name} results published`,
      body: `Your final score and comments for ${cycle.name} are available under My Results.`,
      employeeId: null
    });
    return null;
  };

  const summaryFor: AppState['summaryFor'] = (cycleId, employeeId) =>
  summaries.find((s) => s.cycleId === cycleId && s.employeeId === employeeId) ??
  summarise(cycleId, employeeId, evaluations, bands);

  const value: AppState = {
    authenticated,
    me,
    login: (email) => {
      const match = employees.find(
        (e) => e.status === 'active' && e.email.toLowerCase() === email.trim().toLowerCase()
      );
      /* Demo mode: a recognised employee email signs in as that person; any other
         email signs in as the default account, like the original prototype. */
      setCurrentUserId(match?.id ?? employees[0].id);
      setAuthenticated(true);
      return true;
    },
    logout: () => setAuthenticated(false),
    viewAs: setCurrentUserId,
    theme,
    toggleTheme: () => setTheme((t) => t === 'light' ? 'dark' : 'light'),
    branches,
    teams,
    ranks,
    positions,
    employees,
    roles,
    assignments,
    cycles,
    evaluations,
    bands,
    auditLogs,
    notifications: allNotifications.filter((n) => n.employeeId === null || n.employeeId === me.id),
    branding,
    setBranches,
    setTeams,
    setRanks,
    setPositions,
    setEmployees,
    setRoles,
    setAssignments,
    setBands,
    setBranding,
    access,
    can,
    activeCycle,
    scorable: activeCycle ? scorableEmployees(access, me.id) : [],
    saveEvaluation,
    reviseEvaluation,
    createCycle,
    activateCycle,
    closeCycle,
    summaryFor,
    notify,
    markNotificationsRead: () =>
    setNotifications((prev) =>
    prev.map((n) => n.employeeId === null || n.employeeId === me.id ? { ...n, read: true } : n)
    ),
    logAction,
    employeeById,
    nameOf,
    teamById: (id) => teams.find((t) => t.id === id),
    branchById: (id) => branches.find((b) => b.id === id),
    rankById: (id) => ranks.find((r) => r.id === id),
    positionById: (id) => positions.find((p) => p.id === id),
    roleById: (id) => roles.find((r) => r.id === id),
    bandById: (id) => bands.find((b) => b.id === id),
    toasts,
    pushToast,
    dismissToast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
