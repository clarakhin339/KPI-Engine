import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserCogIcon } from
'lucide-react';
import { useApp } from '../../lib/store';
import { cn, initials } from '../../lib/utils';

const SEARCH_TARGETS = [
{ label: 'Dashboard', to: '/' },
{ label: 'Software Engineer KPI template', to: '/templates' },
{ label: 'KPI Builder', to: '/templates' },
{ label: 'Q3 2026 Performance cycle', to: '/cycles' },
{ label: 'Users directory', to: '/users' },
{ label: 'Roles & permissions', to: '/roles' },
{ label: 'Approval workflow', to: '/workflows' },
{ label: 'Audit logs', to: '/audit' },
{ label: 'Reports', to: '/reports' }];


export function Topbar({ onMenu }: {onMenu: () => void;}) {
  const { currentUser, users, roles, theme, toggleTheme, notifications, logout, switchUser } =
  useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read);
  const role = roles.find((r) => r.id === currentUser.roleId);
  const results = query ?
  SEARCH_TARGETS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())) :
  [];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <button
        onClick={onMenu}
        className="rounded p-1.5 text-fgmuted hover:bg-surface2 hover:text-fg lg:hidden"
        aria-label="Open navigation">
        
        <MenuIcon size={18} />
      </button>

      <div className="relative w-full max-w-md">
        <SearchIcon
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fgsubtle" />
        
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees, templates, cycles…"
          aria-label="Global search"
          className="h-8 w-full rounded border border-line bg-surface2 pl-8 pr-3 text-sm text-fg placeholder:text-fgsubtle" />
        
        {results.length > 0 &&
        <ul className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded border border-line bg-surface shadow-lg">
            {results.map((r) =>
          <li key={r.label}>
                <button
              onClick={() => {
                navigate(r.to);
                setQuery('');
              }}
              className="block w-full px-3 py-2 text-left text-sm text-fg hover:bg-surface2">
              
                  {r.label}
                </button>
              </li>
          )}
          </ul>
        }
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded p-1.5 text-fgmuted hover:bg-surface2 hover:text-fg"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          
          {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded p-1.5 text-fgmuted hover:bg-surface2 hover:text-fg"
            aria-label={`Notifications, ${unread.length} unread`}
            aria-expanded={notifOpen}>
            
            <BellIcon size={16} />
            {unread.length > 0 &&
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
            }
          </button>
          {notifOpen &&
          <div className="absolute right-0 z-30 mt-1 w-80 rounded border border-line bg-surface shadow-lg">
              <p className="border-b border-line px-3 py-2 mono-label">Notifications</p>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.slice(0, 5).map((n) =>
              <li
                key={n.id}
                className={cn('border-b border-line px-3 py-2 last:border-0', !n.read && 'bg-surface2')}>
                
                    <p className="text-sm font-medium text-fg">{n.title}</p>
                    <p className="mt-0.5 text-xs text-fgmuted">{n.body}</p>
                    <p className="mt-1 font-mono text-2xs text-fgsubtle">{n.at}</p>
                  </li>
              )}
              </ul>
              <button
              onClick={() => {
                navigate('/notifications');
                setNotifOpen(false);
              }}
              className="w-full border-t border-line px-3 py-2 text-xs text-fgmuted hover:text-fg">
              
                View all notifications
              </button>
            </div>
          }
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-surface2"
            aria-expanded={menuOpen}
            aria-label="Account menu">
            
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-2xs text-fg">
              {initials(currentUser.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight text-fg">
                {currentUser.name}
              </span>
              <span className="block font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                {role?.name}
              </span>
            </span>
            <ChevronDownIcon size={13} className="text-fgsubtle" />
          </button>
          {menuOpen &&
          <div className="absolute right-0 z-30 mt-1 w-64 rounded border border-line bg-surface p-2 shadow-lg">
              <p className="mono-label px-2 pb-1">Simulate role</p>
              <ul className="max-h-56 overflow-y-auto">
                {users.slice(0, 10).map((u) =>
              <li key={u.id}>
                    <button
                  onClick={() => {
                    switchUser(u.id);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-surface2',
                    u.id === currentUser.id ? 'text-fg' : 'text-fgmuted'
                  )}>
                  
                      <UserCogIcon size={13} />
                      <span className="flex-1 truncate">{u.name}</span>
                      <span className="font-mono text-2xs text-fgsubtle">
                        {roles.find((r) => r.id === u.roleId)?.name}
                      </span>
                    </button>
                  </li>
              )}
              </ul>
              <div className="mt-1 border-t border-line pt-1">
                <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-danger hover:bg-surface2">
                
                  <LogOutIcon size={13} /> Sign out
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>);

}