import React from 'react';
import { PaperclipIcon, StarIcon } from 'lucide-react';
import type { KpiField } from '../../lib/types';
import { cn } from '../../lib/utils';
import { evaluateFormula } from '../../lib/formula';

type Value = string | number | boolean | undefined;

interface FieldRendererProps {
  field: KpiField;
  value: Value;
  responses: Record<string, string | number | boolean>;
  onChange: (value: string | number | boolean) => void;
  readOnly?: boolean;
}

const inputClass =
'h-9 w-full rounded border border-line bg-surface px-2.5 text-sm text-fg placeholder:text-fgsubtle disabled:opacity-60';

export function FieldRenderer({
  field,
  value,
  responses,
  onChange,
  readOnly = false
}: FieldRendererProps) {
  const id = `field-${field.id}`;

  if (field.type === 'title') return <h3 className="text-base font-semibold text-fg">{field.label}</h3>;
  if (field.type === 'subtitle') return <h4 className="text-sm font-medium text-fg">{field.label}</h4>;
  if (field.type === 'description')
  return <p className="text-sm text-fgmuted">{field.helpText || field.label}</p>;

  const label =
  <label htmlFor={id} className="flex items-baseline gap-1.5">
      <span className="text-sm font-medium text-fg">{field.label}</span>
      {field.required && <span className="text-danger">*</span>}
      {typeof field.weight === 'number' &&
    <span className="font-mono text-2xs text-fgsubtle">weight {field.weight}</span>
    }
      {field.target &&
    <span className="font-mono text-2xs text-fgsubtle">target {field.target}</span>
    }
    </label>;


  let control: React.ReactNode = null;

  switch (field.type) {
    case 'kpi':
    case 'number':
    case 'percentage':
    case 'score':
    case 'weight':
      control =
      <div className="flex items-center gap-2">
          <input
          id={id}
          type="number"
          disabled={readOnly}
          min={field.min}
          max={field.max}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className={cn(inputClass, 'max-w-[160px]')} />
        
          {field.type === 'percentage' && <span className="font-mono text-xs text-fgmuted">%</span>}
          {(field.min !== undefined || field.max !== undefined) &&
        <span className="font-mono text-2xs text-fgsubtle">
              range {field.min ?? 0}–{field.max ?? '∞'}
            </span>
        }
        </div>;

      break;

    case 'rating':
      control =
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label={field.label}>
          {Array.from({ length: (field.max ?? 5) - (field.min ?? 1) + 1 }).map((_, i) => {
          const v = (field.min ?? 1) + i;
          const active = Number(value) >= v;
          return (
            <button
              key={v}
              type="button"
              disabled={readOnly}
              aria-label={`${v} of ${field.max ?? 5}`}
              aria-pressed={Number(value) === v}
              onClick={() => onChange(v)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded border',
                active ? 'border-linestrong bg-accentsoft text-fg' : 'border-line text-fgsubtle',
                !readOnly && 'hover:border-linestrong'
              )}>
              
                <StarIcon size={14} className={active ? 'fill-current' : ''} />
              </button>);

        })}
          <span className="ml-1 font-mono text-xs text-fgmuted">
            {value === undefined ? '—' : `${value} / ${field.max ?? 5}`}
          </span>
        </div>;

      break;

    case 'formula':{
        const computed = field.formula ? evaluateFormula(field.formula, responses) : null;
        control =
        <div className="rounded border border-dashed border-linestrong bg-surface2 px-3 py-2">
          <p className="font-mono text-xs text-fgmuted">{field.formula}</p>
          <p className="mt-1 font-mono text-lg text-fg">{computed ?? '—'}</p>
        </div>;

        break;
      }

    case 'dropdown':
      control =
      <select
        id={id}
        disabled={readOnly}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'max-w-sm')}>
        
          <option value="">Select an option…</option>
          {(field.options ?? []).map((o) =>
        <option key={o} value={o}>
              {o}
            </option>
        )}
        </select>;

      break;

    case 'radio':
      control =
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={field.label}>
          {(field.options ?? []).map((o) =>
        <label key={o} className="flex cursor-pointer items-center gap-1.5 text-sm text-fg">
              <input
            type="radio"
            name={id}
            disabled={readOnly}
            checked={value === o}
            onChange={() => onChange(o)}
            className="h-3.5 w-3.5" />
          
              {o}
            </label>
        )}
        </div>;

      break;

    case 'checkbox':
      control =
      <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
          <input
          id={id}
          type="checkbox"
          disabled={readOnly}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5" />
        
          Confirmed
        </label>;

      break;

    case 'date':
      control =
      <input
        id={id}
        type="date"
        disabled={readOnly}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'max-w-[200px]')} />;


      break;

    case 'textarea':
    case 'comment':
      control =
      <textarea
        id={id}
        rows={3}
        disabled={readOnly}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === 'comment' ? 'Add a comment…' : 'Write your response…'}
        className="w-full rounded border border-line bg-surface p-2.5 text-sm text-fg placeholder:text-fgsubtle" />;


      break;

    case 'attachment':
      control =
      <div className="flex items-center gap-2 rounded border border-dashed border-linestrong px-3 py-3">
          <PaperclipIcon size={14} className="text-fgsubtle" />
          <span className="text-sm text-fgmuted">
            Drop PDF, image, Word, Excel or ZIP evidence here
          </span>
        </div>;

      break;

    default:
      control =
      <input
        id={id}
        type="text"
        disabled={readOnly}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass} />;


  }

  return (
    <div className="space-y-1.5">
      {label}
      {field.helpText && field.type !== 'description' &&
      <p className="text-xs text-fgmuted">{field.helpText}</p>
      }
      {control}
    </div>);

}

export function conditionMet(
field: KpiField,
responses: Record<string, string | number | boolean>)
: boolean {
  if (!field.condition) return true;
  const actual = responses[field.condition.fieldId];
  const expected = field.condition.value;
  switch (field.condition.operator) {
    case 'equals':
      return String(actual) === expected;
    case 'not-equals':
      return String(actual) !== expected;
    case 'greater-than':
      return Number(actual) > Number(expected);
    case 'less-than':
      return Number(actual) < Number(expected);
    default:
      return true;
  }
}