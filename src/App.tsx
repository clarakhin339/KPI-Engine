import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './lib/store';
import type { Capability } from './lib/types';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ScoreTeamPage } from './pages/ScoreTeam';
import { MyResultsPage } from './pages/MyResults';
import { NotificationsPage } from './pages/Notifications';
import { CyclesPage } from './pages/Cycles';
import { ReportsPage } from './pages/Reports';
import { AdminPage } from './pages/Admin';

function Home() {
  const { me, can } = useApp();
  if (me.external) return <Navigate to={can('score') ? '/score' : '/notifications'} replace />;
  if (can('score') || can('manage')) return <DashboardPage />;
  return <Navigate to={can('view_reports') ? '/reports' : '/my-results'} replace />;
}

function Require({ capability, children }: {capability: Capability;children: React.ReactElement;}) {
  const { can } = useApp();
  return can(capability) ? children : <Navigate to="/" replace />;
}

function StaffOnly({ children }: {children: React.ReactElement;}) {
  const { me } = useApp();
  return me.external ? <Navigate to="/" replace /> : children;
}

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
        <Route path="/" element={<Home />} />
        <Route path="/score" element={<Require capability="score"><ScoreTeamPage /></Require>} />
        <Route path="/my-results" element={<StaffOnly><MyResultsPage /></StaffOnly>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/cycles" element={<Require capability="manage"><CyclesPage /></Require>} />
        <Route path="/reports" element={<Require capability="view_reports"><ReportsPage /></Require>} />
        <Route path="/admin" element={<Require capability="manage"><AdminPage /></Require>} />
        <Route path="/admin/:tab" element={<Require capability="manage"><AdminPage /></Require>} />
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
