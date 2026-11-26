import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';
import * as seed from './mockData';
import type {
  AppNotification,
  Assessment,
  Assignment,
  AuditLog,
  KpiCategory,
  KpiCycle,
  KpiTemplate,
  ModuleKey,
  OrgNode,
  PermissionAction,
  RatingScale,
  Role,
  User,
  Workflow } from
'./types';
import { uid } from './utils';

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
  density: 'comfortable' | 'compact';
}

interface AppState {
  /* auth */
  authenticated: boolean;
  currentUser: User;
  login: (email: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;

  /* theme */
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  /* data */
  users: User[];
  roles: Role[];
  orgNodes: OrgNode[];
  categories: KpiCategory[];
  cycles: KpiCycle[];
  templates: KpiTemplate[];
  assignments: Assignment[];
  assessments: Assessment[];
  scales: RatingScale[];
  workflows: Workflow[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  branding: Branding;

  /* mutations */
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setOrgNodes: React.Dispatch<React.SetStateAction<OrgNode[]>>;
  setCategories: React.Dispatch<React.SetStateAction<KpiCategory[]>>;
  setCycles: React.Dispatch<React.SetStateAction<KpiCycle[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<KpiTemplate[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  setAssessments: React.Dispatch<React.SetStateAction<Assessment[]>>;
  setScales: React.Dispatch<React.SetStateAction<RatingScale[]>>;
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  setBranding: React.Dispatch<React.SetStateAction<Branding>>;
  markNotificationsRead: () => void;
  logAction: (action: string, module: string, entity: string, severity?: AuditLog['severity']) => void;

  /* rbac */
  can: (module: ModuleKey, action: PermissionAction) => boolean;

  /* helpers */
  userById: (id: string | null | undefined) => User | undefined;
  orgById: (id: string | null | undefined) => OrgNode | undefined;

  /* toasts */
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('u-2');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [users, setUsers] = useState<User[]>(seed.users);
  const [roles, setRoles] = useState<Role[]>(seed.roles);
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(seed.orgNodes);
  const [categories, setCategories] = useState<KpiCategory[]>(seed.categories);
  const [cycles, setCycles] = useState<KpiCycle[]>(seed.cycles);
  const [templates, setTemplates] = useState<KpiTemplate[]>(seed.templates);
  const [assignments, setAssignments] = useState<Assignment[]>(seed.assignments);
  const [assessments, setAssessments] = useState<Assessment[]>(seed.assessments);
  const [scales, setScales] = useState<RatingScale[]>(seed.scales);
  const [workflows, setWorkflows] = useState<Workflow[]>(seed.workflows);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seed.auditLogs);
  const [notifications, setNotifications] = useState<AppNotification[]>(seed.notifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [branding, setBranding] = useState<Branding>({
    companyName: 'One Cloud Next Gen',
    productName: 'KPI Engine',
    locale: 'en-GB',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD MMM YYYY',
    density: 'comfortable'
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0];

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logAction = useCallback(
    (action: string, module: string, entity: string, severity: AuditLog['severity'] = 'info') => {
      setAuditLogs((prev) => [
      {
        id: uid('al'),
        at: new Date().toISOString(),
        actorId: currentUserId,
        action,
        module,
        entity,
        ip: '103.28.14.9',
        severity
      },
      ...prev]
      );
    },
    [currentUserId]
  );

  const can = useCallback(
    (module: ModuleKey, action: PermissionAction) => {
      const role = roles.find((r) => r.id === currentUser?.roleId);
      if (!role) return false;
      return (role.permissions[module] ?? []).includes(action);
    },
    [roles, currentUser]
  );

  const value = useMemo<AppState>(
    () => ({
      authenticated,
      currentUser,
      login: (email: string) => {
        const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) setCurrentUserId(match.id);
        setAuthenticated(true);
      },
      logout: () => setAuthenticated(false),
      switchUser: (id: string) => setCurrentUserId(id),
      theme,
      toggleTheme: () => setTheme((t) => t === 'light' ? 'dark' : 'light'),
      users,
      roles,
      orgNodes,
      categories,
      cycles,
      templates,
      assignments,
      assessments,
      scales,
      workflows,
      auditLogs,
      notifications,
      branding,
      setUsers,
      setRoles,
      setOrgNodes,
      setCategories,
      setCycles,
      setTemplates,
      setAssignments,
      setAssessments,
      setScales,
      setWorkflows,
      setBranding,
      markNotificationsRead: () =>
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      logAction,
      can,
      userById: (id) => users.find((u) => u.id === id),
      orgById: (id) => orgNodes.find((o) => o.id === id),
      toasts,
      pushToast,
      dismissToast
    }),
    [
    authenticated,
    currentUser,
    theme,
    users,
    roles,
    orgNodes,
    categories,
    cycles,
    templates,
    assignments,
    assessments,
    scales,
    workflows,
    auditLogs,
    notifications,
    branding,
    toasts,
    logAction,
    can,
    pushToast,
    dismissToast]

  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}