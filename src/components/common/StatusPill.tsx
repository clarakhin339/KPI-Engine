import { cn } from '../../lib/utils';

export type Tone = 'positive' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClass: Record<Tone, string> = {
  positive: 'bg-positivesoft text-positive border-positive/30',
  warning: 'bg-warningsoft text-warning border-warning/30',
  danger: 'bg-dangersoft text-danger border-danger/30',
  info: 'bg-infosoft text-info border-info/30',
  neutral: 'bg-accentsoft text-fgmuted border-line'
};

export const statusTone: Record<string, Tone> = {
  active: 'positive',
  approved: 'positive',
  published: 'positive',
  completed: 'positive',
  passed: 'positive',
  draft: 'neutral',
  'not-started': 'neutral',
  archived: 'neutral',
  inactive: 'neutral',
  skipped: 'neutral',
  scheduled: 'info',
  upcoming: 'info',
  submitted: 'info',
  'in-review': 'info',
  invited: 'info',
  pending: 'warning',
  'revision-requested': 'warning',
  revision: 'warning',
  locked: 'warning',
  rejected: 'danger',
  closed: 'neutral'
};

export function StatusPill({
  status,
  tone,
  className




}: {status: string;tone?: Tone;className?: string;}) {
  const resolved = tone ?? statusTone[status] ?? 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 font-mono text-2xs uppercase tracking-wide',
        toneClass[resolved],
        className
      )}>
      
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.replace(/-/g, ' ')}
    </span>);

}

export function ScoreBar({
  value,
  max = 5,
  tone = 'info',
  showValue = true





}: {value: number;max?: number;tone?: Tone;showValue?: boolean;}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fill: Record<Tone, string> = {
    positive: 'bg-positive',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-linestrong'
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-[64px] overflow-hidden rounded-full bg-accentsoft">
        <div className={cn('h-full rounded-full', fill[tone])} style={{ width: `${pct}%` }} />
      </div>
      {showValue &&
      <span className="w-9 shrink-0 text-right font-mono text-xs text-fgmuted">
          {value.toFixed(1)}
        </span>
      }
    </div>);

}