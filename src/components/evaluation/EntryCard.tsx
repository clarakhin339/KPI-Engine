import React from 'react';
import { StatusPill } from '../common/StatusPill';
import { useApp } from '../../lib/store';
import type { Evaluation } from '../../lib/types';
import { cn, formatDate } from '../../lib/utils';

export function EntryCard({
  evaluation,
  actions
}: {evaluation: Evaluation;actions?: React.ReactNode;}) {
  const { roleById, nameOf } = useApp();
  return (
    <div
      className={cn(
        'rounded border border-line p-3',
        evaluation.isDeduction && 'border-l-4 border-l-danger'
      )}>
      
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-fgmuted">
          {roleById(evaluation.roleId)?.name ?? 'Evaluator'}
        </span>
        <span className="truncate text-xs text-fgmuted">{nameOf(evaluation.evaluatorId)}</span>
        {evaluation.isDeduction && <StatusPill status="Deduction" tone="danger" />}
        {evaluation.status === 'draft' && <StatusPill status="draft" />}
        <span className="ml-auto font-mono text-base font-medium text-fg">{evaluation.score}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-fg">{evaluation.comment || '—'}</p>
      <p className="mt-1.5 font-mono text-2xs text-fgsubtle">
        {formatDate(evaluation.commentDate)}
        {evaluation.revisedById &&
        ` · revised by ${nameOf(evaluation.revisedById)} on ${formatDate(evaluation.lastModified)}`}
      </p>
      {actions && <div className="mt-2">{actions}</div>}
    </div>);

}
