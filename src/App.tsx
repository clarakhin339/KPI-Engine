import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './lib/store';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AnalyticsPage } from './pages/Analytics';
import { ReportsPage } from './pages/Reports';
import { MyKpiPage } from './pages/MyKpi';
import { ReviewsPage } from './pages/Reviews';
import { AssessmentDetailPage } from './pages/AssessmentDetail';
import { NotificationsPage } from './pages/Notifications';
import { TemplatesPage } from './pages/Templates';
import { BuilderPage } from './pages/Builder';
import { CategoriesPage } from './pages/Categories';
import { CyclesPage } from './pages/Cycles';
import { AssignmentsPage } from './pages/Assignments';
import { ScoringPage } from './pages/Scoring';
import { WorkflowsPage } from './pages/Workflows';
import { UsersPage } from './pages/Users';
import { RolesPage } from './pages/Roles';
import { OrganizationPage } from './pages/Organization';
import { AuditLogsPage } from './pages/AuditLogs';
import { SettingsPage } from './pages/Settings';

function Routed() {
  const { authenticated } = useApp();

  if (!authenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>);

  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/my-kpi" element={<MyKpiPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id/builder" element={<BuilderPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/cycles" element={<CyclesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/scoring" element={<ScoringPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>);

}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </AppProvider>);

}