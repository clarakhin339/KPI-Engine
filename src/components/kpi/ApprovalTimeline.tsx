import React from 'react';
import { CheckIcon, ClockIcon, MinusIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import type { ApprovalRecord } from '../../lib/types';
import { useApp } from '../../lib/store';
import { cn, formatDate } from '../../lib/utils';

const ICONS: Record<ApprovalRecord['status'], React.ReactNode> = {
  approved: <CheckIcon size={12} />,
  pending: <ClockIcon size={12} />,
  rejected: <XIcon size={12} />,
  revision: <RotateCcwIcon size={12} />,
  skipped: <MinusIcon size={12} />
};

const STYLES: Record<ApprovalRecord['status'], string> = {
  approved: 'border-positive bg-positivesoft text-positive',
  pending: 'border-warning bg-warningsoft text-warning',
  rejected: 'border-danger bg-dangersoft text-danger',
  revision: 'border-warning bg-warningsoft text-warning',
  skipped: 'border-line bg-surface2 text-fgsubtle'
};

export function ApprovalTimeline({ approvals }: {approvals: ApprovalRecord[];}) {
  const { userById } = useApp();

  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute left-[11px] top-2 h-[calc(100%-16px)] w-px bg-line" aria-hidden="true" />
      {approvals.map((step) => {
        const approver = userById(step.approverId);
        return (
          <li key={step.stepId} className="relative">
            <span
              className={cn(
                'absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border',
                STYLES[step.status]
              )}>
              
              {ICONS[step.status]}
            </span>
            <div className="pl-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-medium text-fg">{step.stepName}</p>
              <p className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                {step.status}
              </p>
            </div>
            <p className="text-xs text-fgmuted">
              {approver?.name}
              {step.actedAt ? ` · ${formatDate(step.actedAt)}` : ' · awaiting action'}
            </p>
            {step.note &&
            <p className="mt-1 rounded border border-dashed border-line p-2 text-xs text-fgmuted">
                {step.note}
              </p>
            }
            </div>
          </li>);

      })}
    </ol>);

}