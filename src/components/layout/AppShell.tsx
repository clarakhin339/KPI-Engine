import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle2Icon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../lib/store';
import { cn } from '../../lib/utils';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { toasts, dismissToast } = useApp();

  return (
    <div className="flex h-full w-full bg-canvas">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) =>
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded border bg-surface p-3 shadow-lg',
            t.tone === 'danger' ? 'border-danger/40' : 'border-line'
          )}>
          
            {t.tone === 'danger' ?
          <TriangleAlertIcon size={15} className="mt-0.5 shrink-0 text-danger" /> :

          <CheckCircle2Icon size={15} className="mt-0.5 shrink-0 text-positive" />
          }
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-fgmuted">{t.description}</p>}
            </div>
            <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="text-fgsubtle hover:text-fg">
            
              <XIcon size={13} />
            </button>
          </div>
        )}
      </div>
    </div>);

}