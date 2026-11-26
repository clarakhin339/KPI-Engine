import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserCogIcon } from
'lucide-react';
import { StatusPill } from '../common/StatusPill';
import { useApp } from '../../lib/store';
import { grantsOf } from '../../lib/permissions';
import { cn, formatDate, formatDateTime, fullName, initials } from '../../lib/utils';

export function Topbar({ onMenu }: {onMenu: () => void;}) {
  const { me, employees, access, activeCycle, theme, toggleTheme, notifications, logout, viewAs } =
  useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read);
  const roleLabel = (employeeId: string) =>
  Array.from(new Set(grantsOf(access, employeeId).map((g) => g.role.name))).join(', ') || 'Employee';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <button
        onClick={onMenu}
        className="rounded p-1.5 text-fgmuted hover:bg-surface2 hover:text-fg lg:hidden"
        aria-label="Open navigation">
        
        <MenuIcon size={18} />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        {activeCycle ?
        <>
            <StatusPill status={activeCycle.name} tone="positive" />
            <span className="hidden truncate text-xs text-fgmuted sm:block">
              Scoring open until {formatDate(activeCycle.endDate)}
            </span>
          </> :

        <StatusPill status="No active cycle" tone="neutral" />
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
                    <p className="mt-1 font-mono text-2xs text-fgsubtle">{formatDateTime(n.at)}</p>
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
              {initials(fullName(me))}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight text-fg">{fullName(me)}</span>
              <span className="block font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                {roleLabel(me.id)}
              </span>
            </span>
            <ChevronDownIcon size={13} className="text-fgsubtle" />
          </button>
          {menuOpen &&
          <div className="absolute right-0 z-30 mt-1 w-72 rounded border border-line bg-surface p-2 shadow-lg">
              <p className="mono-label px-2 pb-1">Demo · view as</p>
              <ul className="max-h-64 overflow-y-auto">
                {employees.
              filter((e) => e.status === 'active').
              map((e) =>
              <li key={e.id}>
                    <button
                  onClick={() => {
                    viewAs(e.id);
                    setMenuOpen(false);
                    navigate('/');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-surface2',
                    e.id === me.id ? 'bg-accentsoft text-fg' : 'text-fgmuted'
                  )}>
                  
                      <UserCogIcon size={13} className="shrink-0" />
                      <span className="flex-1 truncate">{fullName(e)}</span>
                      <span className="shrink-0 font-mono text-2xs text-fgsubtle">{roleLabel(e.id)}</span>
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
