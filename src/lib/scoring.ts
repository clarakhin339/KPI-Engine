import type { Evaluation, ID, ReviewSummary, ScoreBand } from './types';

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

export function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= MIN_SCORE && score <= MAX_SCORE;
}

export function bandFor(bands: ScoreBand[], score: number | null): ScoreBand | undefined {
  if (score === null) return undefined;
  return [...bands].sort((a, b) => b.minScore - a.minScore).find((b) => score >= b.minScore);
}

/**
 * Final score for one employee in one cycle.
 * Policy placeholder: the plain average of all submitted evaluator scores.
 * Deductions are counted and flagged, not subtracted. Replace this single
 * function when management confirms the weighting rule.
 */
export function summarise(
cycleId: ID,
employeeId: ID,
evaluations: Evaluation[],
bands: ScoreBand[])
: ReviewSummary {
  const submitted = evaluations.filter(
    (e) => e.cycleId === cycleId && e.evaluateeId === employeeId && e.status === 'submitted'
  );
  const finalScore = submitted.length ?
  Math.round(submitted.reduce((sum, e) => sum + e.score, 0) / submitted.length * 10) / 10 :
  null;
  return {
    cycleId,
    employeeId,
    finalScore,
    bandId: bandFor(bands, finalScore)?.id ?? null,
    evaluationCount: submitted.length,
    deductionCount: submitted.filter((e) => e.isDeduction).length
  };
}
