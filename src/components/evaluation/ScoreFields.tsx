import { StatusPill } from '../common/StatusPill';
import { useApp } from '../../lib/store';
import { bandFor, isValidScore, MAX_SCORE, MIN_SCORE } from '../../lib/scoring';
import type { Evaluation } from '../../lib/types';
import { formatDate, today } from '../../lib/utils';

export interface ScoreForm {
  score: string;
  comment: string;
  isDeduction: boolean;
}

export function toForm(evaluation?: Evaluation): ScoreForm {
  return {
    score: evaluation ? String(evaluation.score) : '',
    comment: evaluation?.comment ?? '',
    isDeduction: evaluation?.isDeduction ?? false
  };
}

export function toInput(form: ScoreForm) {
  return {
    score: form.score.trim() === '' ? NaN : Number(form.score),
    comment: form.comment,
    isDeduction: form.isDeduction
  };
}

export function ScoreFields({
  idPrefix,
  form,
  onChange
}: {idPrefix: string;form: ScoreForm;onChange: (form: ScoreForm) => void;}) {
  const { bands } = useApp();
  const score = toInput(form).score;
  const band = isValidScore(score) ? bandFor(bands, score) : undefined;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-score`} className="text-sm font-medium text-fg">
          Score ({MIN_SCORE}–{MAX_SCORE})
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            id={`${idPrefix}-score`}
            type="number"
            inputMode="decimal"
            min={MIN_SCORE}
            max={MAX_SCORE}
            value={form.score}
            onChange={(e) => onChange({ ...form, score: e.target.value })}
            className="h-10 w-28 rounded border border-line bg-surface px-2.5 font-mono text-lg text-fg" />
          
          {band ?
          <StatusPill status={band.label} tone={band.tone} /> :

          <span className="text-xs text-fgsubtle">Band preview appears here</span>
          }
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-comment`} className="text-sm font-medium text-fg">
          Comment
        </label>
        <textarea
          id={`${idPrefix}-comment`}
          rows={4}
          value={form.comment}
          onChange={(e) => onChange({ ...form, comment: e.target.value })}
          placeholder="What supports this score?"
          className="mt-1 w-full rounded border border-line bg-surface p-2.5 text-sm text-fg placeholder:text-fgsubtle" />
        
        <p className="mt-1 font-mono text-2xs text-fgsubtle">
          Comment date: {formatDate(today())} (recorded automatically)
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded border border-line p-2.5 text-sm text-fg">
        <input
          type="checkbox"
          className="mt-0.5 h-3.5 w-3.5"
          checked={form.isDeduction}
          onChange={(e) => onChange({ ...form, isDeduction: e.target.checked })} />
        
        <span>
          Mark as deduction
          <span className="block text-xs text-fgmuted">
            Flags this comment as a negative remark in the record and in the management summary.
          </span>
        </span>
      </label>
    </div>);

}
