import React from 'react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export function StatCard({ label, value, hint, delta, icon, footer }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="mono-label">{label}</span>
        {icon && <span className="text-fgsubtle">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {typeof delta === 'number' &&
        <span
          className={cn(
            'inline-flex items-center gap-1 font-mono text-2xs',
            delta >= 0 ? 'text-positive' : 'text-danger'
          )}>
          
            {delta >= 0 ? <TrendingUpIcon size={12} /> : <TrendingDownIcon size={12} />}
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        }
        {hint && <span className="text-xs text-fgmuted">{hint}</span>}
      </div>
      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </div>);

}