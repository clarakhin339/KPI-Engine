import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { TabBar } from '../components/common/TabBar';
import { useApp } from '../lib/store';
import { AuditTab } from './admin/AuditTab';
import { BandsTab } from './admin/BandsTab';
import { EmployeesTab } from './admin/EmployeesTab';
import { OrgTab } from './admin/OrgTab';
import { RanksTab } from './admin/RanksTab';
import { RolesTab } from './admin/RolesTab';
import { SettingsTab } from './admin/SettingsTab';

const TABS = [
{ id: 'employees', label: 'Employees' },
{ id: 'organization', label: 'Branches & teams' },
{ id: 'ranks', label: 'Ranks & positions' },
{ id: 'roles', label: 'Roles & assignments' },
{ id: 'bands', label: 'Score bands' },
{ id: 'audit', label: 'Audit log' },
{ id: 'settings', label: 'Settings' }];


export function AdminPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { employees, roles, auditLogs } = useApp();

  const active = TABS.some((t) => t.id === tab) ? (tab as string) : 'employees';
  if (!tab) return <Navigate to="/admin/employees" replace />;

  const counts: Record<string, number> = {
    employees: employees.length,
    roles: roles.length,
    audit: auditLogs.length
  };

  return (
    <>
      <PageHeader
        breadcrumb={['Administration', TABS.find((t) => t.id === active)?.label ?? '']}
        title="Admin"
        description="Reference data and configuration for the evaluation process. All changes are audited." />
      

      <TabBar
        tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
        active={active}
        onChange={(id) => navigate(`/admin/${id}`)} />
      

      {active === 'employees' && <EmployeesTab />}
      {active === 'organization' && <OrgTab />}
      {active === 'ranks' && <RanksTab />}
      {active === 'roles' && <RolesTab />}
      {active === 'bands' && <BandsTab />}
      {active === 'audit' && <AuditTab />}
      {active === 'settings' && <SettingsTab />}
    </>);

}
