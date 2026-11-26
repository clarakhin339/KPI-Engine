import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-xl">
        
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-fgmuted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="mt-0.5 text-fgsubtle hover:text-fg">
            <XIcon size={16} />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>);

}
