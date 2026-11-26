import type { KpiField, KpiSection, KpiTemplate, RatingScale } from './types';

/** Numeric field types that participate in the weighted scoring engine. */
const SCORED_TYPES = new Set(['kpi', 'number', 'percentage', 'rating', 'score', 'formula']);

export function isScored(field: KpiField): boolean {
  return SCORED_TYPES.has(field.type) && !field.hidden;
}

/** Normalises any raw response onto a 0–5 scale so mixed field types can be combined. */
export function normalise(field: KpiField, raw: unknown): number {
  const value = typeof raw === 'boolean' ? raw ? 1 : 0 : Number(raw);
  if (!Number.isFinite(value)) return 0;
  const min = field.min ?? 0;
  const max = field.max ?? 5;
  if (max === min) return 0;
  const pct = (value - min) / (max - min);
  return Math.max(0, Math.min(1, pct)) * 5;
}

export interface SectionResult {
  sectionId: string;
  title: string;
  weight: number;
  score: number;
  completion: number;
}

export interface ScoreResult {
  total: number;
  average: number;
  weighted: number;
  percentage: number;
  grade: string;
  tone: 'positive' | 'warning' | 'danger' | 'info' | 'neutral';
  passed: boolean;
  completion: number;
  sections: SectionResult[];
}

export function scoreSection(
section: KpiSection,
responses: Record<string, string | number | boolean>)
: SectionResult {
  const scored = section.fields.filter(isScored);
  let weightSum = 0;
  let weightedSum = 0;
  let answered = 0;

  scored.forEach((field) => {
    const weight = field.weight ?? 1;
    const raw = responses[field.id];
    if (raw !== undefined && raw !== '') answered += 1;
    weightSum += weight;
    weightedSum += normalise(field, raw) * weight;
  });

  const requiredCount = section.fields.filter((f) => !f.hidden).length;

  return {
    sectionId: section.id,
    title: section.title,
    weight: section.weight,
    score: weightSum ? Number((weightedSum / weightSum).toFixed(2)) : 0,
    completion: requiredCount ?
    Math.round(
      section.fields.filter(
        (f) => !f.hidden && responses[f.id] !== undefined && responses[f.id] !== ''
      ).length /
      requiredCount *
      100
    ) :
    0
  };
}

export function gradeFor(scale: RatingScale, value: number) {
  const scaled = scale.type === 'percentage' ? value / 5 * 100 : value;
  const level = scale.levels.find((l) => scaled >= l.min && scaled <= l.max);
  return level ?? scale.levels[scale.levels.length - 1];
}

export function calculateScore(
template: KpiTemplate,
responses: Record<string, string | number | boolean>,
scale: RatingScale)
: ScoreResult {
  const sections = template.sections.filter((s) => !s.hidden).map((s) => scoreSection(s, responses));

  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0) || 1;
  const weighted = sections.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight;
  const total = sections.reduce((sum, s) => sum + s.score, 0);
  const average = sections.length ? total / sections.length : 0;
  const percentage = weighted / 5 * 100;
  const level = gradeFor(scale, weighted);
  const completion = sections.length ?
  Math.round(sections.reduce((sum, s) => sum + s.completion, 0) / sections.length) :
  0;

  const passScaled = scale.type === 'percentage' ? percentage : weighted;

  return {
    total: Number(total.toFixed(2)),
    average: Number(average.toFixed(2)),
    weighted: Number(weighted.toFixed(2)),
    percentage: Number(percentage.toFixed(1)),
    grade: level?.label ?? '—',
    tone: level?.tone ?? 'neutral',
    passed: passScaled >= scale.passingScore,
    completion,
    sections
  };
}

/** Very small, safe expression evaluator used by preview of formula fields. */
export function evaluateFormula(
expression: string,
responses: Record<string, string | number | boolean>)
: number | null {
  const resolved = expression.replace(/[a-zA-Z][\w-]*/g, (token) => {
    const raw = responses[token];
    if (raw === undefined) return '0';
    return String(typeof raw === 'boolean' ? raw ? 1 : 0 : raw);
  });
  if (!/^[-+*/()., 0-9]+$/.test(resolved)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${resolved});`)();
    return Number.isFinite(result) ? Number(Number(result).toFixed(2)) : null;
  } catch {
    return null;
  }
}