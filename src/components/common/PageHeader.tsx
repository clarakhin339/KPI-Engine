import React from 'react';
import { ChevronRightIcon } from 'lucide-react';

interface PageHeaderProps {
  breadcrumb: string[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export function PageHeader({ breadcrumb, title, description, actions, meta }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1">
        {breadcrumb.map((crumb, i) =>
        <span key={crumb} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon size={11} className="text-fgsubtle" />}
            <span className="mono-label">{crumb}</span>
          </span>
        )}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-fgmuted">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>);

}