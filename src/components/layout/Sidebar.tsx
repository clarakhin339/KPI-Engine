import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ActivityIcon,
  BellIcon,
  BuildingIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
  FileBarChartIcon,
  GaugeIcon,
  GitBranchIcon,
  LayersIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  UserCheckIcon,
  UsersIcon,
  XIcon } from
'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../lib/store';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const { assessments, notifications, branding } = useApp();

  const pendingReviews = assessments.filter(
    (a) => a.status === 'in-review' || a.status === 'submitted'
  ).length;
  const unread = notifications.filter((n) => !n.read).length;

  const groups: NavGroup[] = [
  {
    label: 'Insight',
    items: [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboardIcon size={15} /> },
    { to: '/analytics', label: 'Analytics', icon: <GaugeIcon size={15} /> },
    { to: '/reports', label: 'Reports', icon: <FileBarChartIcon size={15} /> }]

  },
  {
    label: 'My work',
    items: [
    { to: '/my-kpi', label: 'My KPIs', icon: <ClipboardCheckIcon size={15} /> },
    { to: '/reviews', label: 'Reviews & Approvals', icon: <UserCheckIcon size={15} />, badge: pendingReviews },
    { to: '/notifications', label: 'Notifications', icon: <BellIcon size={15} />, badge: unread }]

  },
  {
    label: 'KPI engine',
    items: [
    { to: '/templates', label: 'Templates', icon: <LayersIcon size={15} /> },
    { to: '/categories', label: 'Categories', icon: <TagsIcon size={15} /> },
    { to: '/cycles', label: 'Cycles', icon: <CalendarRangeIcon size={15} /> },
    { to: '/assignments', label: 'Assignments', icon: <ClipboardCheckIcon size={15} /> },
    { to: '/scoring', label: 'Scoring & Formula', icon: <SlidersHorizontalIcon size={15} /> },
    { to: '/workflows', label: 'Approval Workflow', icon: <GitBranchIcon size={15} /> }]

  },
  {
    label: 'Administration',
    items: [
    { to: '/users', label: 'Users', icon: <UsersIcon size={15} /> },
    { to: '/roles', label: 'Roles & Permissions', icon: <ShieldCheckIcon size={15} /> },
    { to: '/organization', label: 'Organization', icon: <BuildingIcon size={15} /> },
    { to: '/audit', label: 'Audit Logs', icon: <ScrollTextIcon size={15} /> },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon size={15} /> }]

  }];


  return (
    <>
      {open &&
      <div
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true" />

      }
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}>
        
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-linestrong bg-surface2">
            <ActivityIcon size={15} className="text-fg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-fg">
              {branding.productName}
            </p>
            <p className="truncate font-mono text-2xs uppercase tracking-wider text-fgsubtle">
              {branding.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-fgsubtle hover:text-fg lg:hidden"
            aria-label="Close navigation">
            
            <XIcon size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main">
          {groups.map((group) =>
          <div key={group.label}>
              <p className="mono-label px-2 pb-1.5">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) =>
              <li key={item.to}>
                    <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors',
                    isActive ?
                    'bg-accentsoft font-medium text-fg' :
                    'text-fgmuted hover:bg-surface2 hover:text-fg'
                  )
                  }>
                  
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {!!item.badge &&
                  <span className="rounded-full border border-line bg-surface2 px-1.5 font-mono text-2xs text-fgmuted">
                          {item.badge}
                        </span>
                  }
                    </NavLink>
                  </li>
              )}
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-line p-3">
          <div className="rounded border border-dashed border-linestrong p-3">
            <p className="mono-label">Engine status</p>
            <p className="mt-1 text-xs text-fgmuted">
              Q3 2026 cycle active · locks 14 Oct 2026
            </p>
          </div>
        </div>
      </aside>
    </>);

}