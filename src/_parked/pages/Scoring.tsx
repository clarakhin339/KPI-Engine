import React, { useState } from 'react';
import { PlusIcon, SigmaIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusPill, type Tone } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import type { RatingScale, ScaleType } from '../lib/types';
import { cn, uid } from '../lib/utils';

const SCALE_TYPES: ScaleType[] = [
'numeric',
'percentage',
'letter',
'five-star',
'traffic-light',
'custom'];


const TONES: Tone[] = ['positive', 'info', 'warning', 'danger', 'neutral'];

const FORMULAS = [
{ key: 'total', label: 'Total score', expression: 'SUM(item.score)' },
{ key: 'average', label: 'Average score', expression: 'SUM(item.score) / COUNT(item)' },
{ key: 'weighted', label: 'Weighted score', expression: 'SUM(item.score × item.weight) / SUM(item.weight)' },
{ key: 'percentage', label: 'Percentage', expression: '(weighted / scale.max) × 100' },
{ key: 'grade', label: 'Final grade', expression: 'LOOKUP(weighted, scale.levels)' },
{ key: 'rating', label: 'Final rating', expression: 'LABEL(grade)' }];


export function ScoringPage() {
  const { scales, setScales, pushToast, logAction } = useApp();
  const [selectedId, setSelectedId] = useState(scales[0].id);
  const scale = scales.find((s) => s.id === selectedId) ?? scales[0];

  const patch = (updater: (s: RatingScale) => RatingScale) =>
  setScales((prev) => prev.map((s) => s.id === scale.id ? updater(s) : s));

  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Scoring & formula']}
        title="Scoring engine"
        description="Rating scales, score ranges, passing thresholds, colours and the formulas that roll everything up."
        actions={
        <Button
          size="small"
          leftIcon={<PlusIcon size={14} />}
          onClick={() => {
            const created: RatingScale = {
              id: uid('s'),
              name: 'New scale',
              type: 'numeric',
              min: 0,
              max: 5,
              passingScore: 3,
              formula: 'SUM(item.score * item.weight) / SUM(item.weight)',
              levels: [{ label: 'Level 1', min: 0, max: 5, tone: 'neutral' }]
            };
            setScales((prev) => [...prev, created]);
            setSelectedId(created.id);
          }}>
          
            New scale
          </Button>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Panel title="Rating scales" bodyClassName="p-2">
          <ul className="space-y-0.5">
            {scales.map((s) =>
            <li key={s.id}>
                <button
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  'w-full rounded px-2 py-2 text-left',
                  s.id === selectedId ? 'bg-accentsoft' : 'hover:bg-surface2'
                )}>
                
                  <span className="block text-sm font-medium text-fg">{s.name}</span>
                  <span className="block font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                    {s.type} · {s.min}–{s.max} · pass {s.passingScore}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Scale configuration" description="Applies to every template referencing this scale">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Name" value={scale.name} onChange={(e) => patch((s) => ({ ...s, name: e.target.value }))} />
              <Select
                label="Type"
                options={SCALE_TYPES.map((t) => ({ value: t, label: t }))}
                value={scale.type}
                onChange={(v) => patch((s) => ({ ...s, type: v as ScaleType }))} />
              
              <Input label="Minimum" type="number" value={String(scale.min)} onChange={(e) => patch((s) => ({ ...s, min: Number(e.target.value) }))} />
              <Input label="Maximum" type="number" value={String(scale.max)} onChange={(e) => patch((s) => ({ ...s, max: Number(e.target.value) }))} />
              <Input
                label="Passing score"
                type="number"
                value={String(scale.passingScore)}
                onChange={(e) => patch((s) => ({ ...s, passingScore: Number(e.target.value) }))} />
              
              <Input
                label="Aggregation formula"
                value={scale.formula}
                onChange={(e) => patch((s) => ({ ...s, formula: e.target.value }))} />
              
            </div>
          </Panel>

          <Panel
            title="Score bands"
            description="Ranges, labels and colours resolved into the final rating"
            actions={
            <Button
              size="small"
              variant="secondary"
              leftIcon={<PlusIcon size={13} />}
              onClick={() =>
              patch((s) => ({ ...s, levels: [...s.levels, { label: 'New band', min: 0, max: 1, tone: 'neutral' }] }))
              }>
              
                Add band
              </Button>
            }
            bodyClassName="p-0">
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface2">
                  <th className="px-3 py-2 text-left mono-label">Label</th>
                  <th className="px-3 py-2 text-left mono-label">Min</th>
                  <th className="px-3 py-2 text-left mono-label">Max</th>
                  <th className="px-3 py-2 text-left mono-label">Colour</th>
                  <th className="px-3 py-2 text-left mono-label">Preview</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {scale.levels.map((level, index) =>
                <tr key={index} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">
                      <input
                      value={level.label}
                      aria-label="Band label"
                      onChange={(e) =>
                      patch((s) => ({
                        ...s,
                        levels: s.levels.map((l, i) => i === index ? { ...l, label: e.target.value } : l)
                      }))
                      }
                      className="h-8 w-full rounded border border-line bg-surface px-2 text-sm text-fg" />
                    
                    </td>
                    {(['min', 'max'] as const).map((key) =>
                  <td key={key} className="px-3 py-2">
                        <input
                      type="number"
                      step="0.01"
                      aria-label={`Band ${key}`}
                      value={level[key]}
                      onChange={(e) =>
                      patch((s) => ({
                        ...s,
                        levels: s.levels.map((l, i) =>
                        i === index ? { ...l, [key]: Number(e.target.value) } : l
                        )
                      }))
                      }
                      className="h-8 w-20 rounded border border-line bg-surface px-2 font-mono text-sm text-fg" />
                    
                      </td>
                  )}
                    <td className="px-3 py-2">
                      <select
                      aria-label="Band colour"
                      value={level.tone}
                      onChange={(e) =>
                      patch((s) => ({
                        ...s,
                        levels: s.levels.map((l, i) =>
                        i === index ? { ...l, tone: e.target.value as Tone } : l
                        )
                      }))
                      }
                      className="h-8 rounded border border-line bg-surface px-2 text-sm text-fg">
                      
                        {TONES.map((t) =>
                      <option key={t} value={t}>
                            {t}
                          </option>
                      )}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={level.label} tone={level.tone} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                      onClick={() =>
                      patch((s) => ({ ...s, levels: s.levels.filter((_, i) => i !== index) }))
                      }
                      aria-label={`Delete band ${level.label}`}
                      className="text-fgsubtle hover:text-danger">
                      
                        <Trash2Icon size={14} />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-line p-3">
              <Button
                size="small"
                onClick={() => {
                  logAction('Updated rating scale', 'Settings', scale.name, 'warning');
                  pushToast({ title: 'Scale saved', description: scale.name, tone: 'success' });
                }}>
                
                Save scale
              </Button>
            </div>
          </Panel>

          <Panel
            title="Formula engine"
            description="Derived values computed on every save and recalculated on override"
            actions={<SigmaIcon size={15} className="text-fgsubtle" />}>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FORMULAS.map((f) =>
              <div key={f.key} className="rounded border border-dashed border-line p-3">
                  <p className="text-sm font-medium text-fg">{f.label}</p>
                  <p className="mt-1 font-mono text-2xs text-fgmuted">{f.expression}</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>);

}