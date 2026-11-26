import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  LayoutTemplateIcon,
  PlusIcon,
  RocketIcon,
  SaveIcon,
  Trash2Icon } from
'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FieldRenderer, conditionMet } from '../components/kpi/FieldRenderer';
import { useApp } from '../lib/store';
import type { FieldType, KpiField, KpiSection, KpiTemplate } from '../lib/types';
import { calculateScore } from '../lib/formula';
import { cn, uid } from '../lib/utils';

const PALETTE: {group: string;items: {type: FieldType;label: string;}[];}[] = [
{
  group: 'Layout',
  items: [
  { type: 'group', label: 'Group' },
  { type: 'title', label: 'Title' },
  { type: 'subtitle', label: 'Subtitle' },
  { type: 'description', label: 'Description' }]

},
{
  group: 'Measurement',
  items: [
  { type: 'kpi', label: 'KPI item' },
  { type: 'number', label: 'Number' },
  { type: 'percentage', label: 'Percentage' },
  { type: 'rating', label: 'Rating' },
  { type: 'score', label: 'Score' },
  { type: 'weight', label: 'Weight' },
  { type: 'formula', label: 'Formula' }]

},
{
  group: 'Input',
  items: [
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'radio', label: 'Radio' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Date' },
  { type: 'text', label: 'Text' },
  { type: 'textarea', label: 'Textarea' }]

},
{
  group: 'Collaboration',
  items: [
  { type: 'attachment', label: 'Attachment' },
  { type: 'comment', label: 'Comment' }]

}];


const NEEDS_OPTIONS: FieldType[] = ['dropdown', 'radio'];
const NEEDS_RANGE: FieldType[] = ['kpi', 'number', 'percentage', 'rating', 'score', 'weight'];

function newField(type: FieldType): KpiField {
  return {
    id: uid('f'),
    type,
    label: `New ${type} field`,
    required: false,
    hidden: false,
    weight: NEEDS_RANGE.includes(type) ? 5 : undefined,
    min: NEEDS_RANGE.includes(type) ? 0 : undefined,
    max: type === 'rating' ? 5 : NEEDS_RANGE.includes(type) ? 100 : undefined,
    options: NEEDS_OPTIONS.includes(type) ? ['Option A', 'Option B'] : undefined,
    formula: type === 'formula' ? '0' : undefined
  };
}

type Selection = {kind: 'section';id: string;} | {kind: 'field';sectionId: string;id: string;} | null;

export function BuilderPage() {
  const { id } = useParams();
  const { templates, setTemplates, categories, scales, pushToast, logAction } = useApp();
  const template = templates.find((t) => t.id === id) ?? templates[0];

  const [selection, setSelection] = useState<Selection>(null);
  const [preview, setPreview] = useState(false);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const patch = (updater: (t: KpiTemplate) => KpiTemplate) => {
    setTemplates((prev) => prev.map((t) => t.id === template.id ? updater(t) : t));
  };

  const patchSection = (sectionId: string, updater: (s: KpiSection) => KpiSection) =>
  patch((t) => ({ ...t, sections: t.sections.map((s) => s.id === sectionId ? updater(s) : s) }));

  const patchField = (sectionId: string, fieldId: string, updater: (f: KpiField) => KpiField) =>
  patchSection(sectionId, (s) => ({
    ...s,
    fields: s.fields.map((f) => f.id === fieldId ? updater(f) : f)
  }));

  const addSection = () =>
  patch((t) => ({
    ...t,
    sections: [
    ...t.sections,
    {
      id: uid('sec'),
      title: 'New section',
      weight: 0,
      collapsed: false,
      hidden: false,
      fields: []
    }]

  }));

  const insertField = (sectionId: string, field: KpiField, index?: number) =>
  patchSection(sectionId, (s) => {
    const fields = [...s.fields];
    fields.splice(index ?? fields.length, 0, field);
    return { ...s, fields };
  });

  const removeField = (sectionId: string, fieldId: string) =>
  patchSection(sectionId, (s) => ({ ...s, fields: s.fields.filter((f) => f.id !== fieldId) }));

  const handleDrop = (sectionId: string, index?: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload.kind === 'new') {
        insertField(sectionId, newField(payload.type as FieldType), index);
      } else if (payload.kind === 'move') {
        const source = template.sections.find((s) => s.id === payload.sectionId);
        const field = source?.fields.find((f) => f.id === payload.fieldId);
        if (!field) return;
        removeField(payload.sectionId, payload.fieldId);
        insertField(sectionId, field, index);
      }
    } catch {

      /* ignore malformed payloads */}
  };

  const scale = scales.find((s) => s.id === template.scaleId) ?? scales[0];
  const result = useMemo(() => calculateScore(template, responses, scale), [template, responses, scale]);

  const selectedSection =
  selection?.kind === 'section' ? template.sections.find((s) => s.id === selection.id) : undefined;
  const selectedField =
  selection?.kind === 'field' ?
  template.sections.
  find((s) => s.id === selection.sectionId)?.
  fields.find((f) => f.id === selection.id) :
  undefined;

  const allFields = template.sections.flatMap((s) => s.fields);
  const totalWeight = template.sections.reduce((sum, s) => sum + s.weight, 0);

  return (
    <>
      <PageHeader
        breadcrumb={['KPI engine', 'Templates', 'Builder']}
        title={template.title}
        description={template.description}
        meta={
        <>
            <StatusPill status={template.status} />
            <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
              {template.version} · {template.sections.length} sections · {allFields.length} items ·
              total weight {totalWeight}%
            </span>
            {totalWeight !== 100 && template.sections.length > 0 &&
          <StatusPill status="weights must total 100" tone="warning" />
          }
          </>
        }
        actions={
        <>
            <Link to="/templates">
              <Button variant="tertiary" size="small">
                All templates
              </Button>
            </Link>
            <Button
            variant="secondary"
            size="small"
            leftIcon={preview ? <LayoutTemplateIcon size={14} /> : <EyeIcon size={14} />}
            onClick={() => setPreview((p) => !p)}>
            
              {preview ? 'Edit structure' : 'Preview'}
            </Button>
            <Button
            variant="secondary"
            size="small"
            leftIcon={<SaveIcon size={14} />}
            onClick={() => {
              logAction('Saved template draft', 'KPI Builder', `${template.title} ${template.version}`);
              pushToast({ title: 'Draft saved', tone: 'success' });
            }}>
            
              Save draft
            </Button>
            <Button
            size="small"
            leftIcon={<RocketIcon size={14} />}
            onClick={() => {
              const next = `v${(parseFloat(template.version.replace('v', '')) + 0.1).toFixed(1)}`;
              patch((t) => ({ ...t, status: 'published', version: next }));
              logAction('Published template', 'KPI Templates', `${template.title} ${next}`);
              pushToast({ title: `Published ${next}`, description: 'Existing cycles keep their pinned version.', tone: 'success' });
            }}>
            
              Publish
            </Button>
          </>
        } />
      

      {preview ?
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <Panel title="Form preview" description="Exactly what the employee sees">
            <div className="space-y-6">
              {template.sections.
            filter((s) => !s.hidden).
            map((section) =>
            <section key={section.id}>
                    <div className="mb-3 border-b border-line pb-2">
                      <h3 className="text-sm font-semibold text-fg">{section.title}</h3>
                      {section.subtitle && <p className="text-xs text-fgmuted">{section.subtitle}</p>}
                    </div>
                    <div className="space-y-5">
                      {section.fields.
                filter((f) => !f.hidden && conditionMet(f, responses)).
                map((field) =>
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={responses[field.id]}
                  responses={responses}
                  onChange={(v) => setResponses((r) => ({ ...r, [field.id]: v }))} />

                )}
                    </div>
                  </section>
            )}
              {template.sections.length === 0 &&
            <p className="py-10 text-center text-sm text-fgmuted">
                  Nothing to preview yet — add a section first.
                </p>
            }
            </div>
          </Panel>

          <Panel title="Live calculation" description={scale.name}>
            <dl className="space-y-2 text-sm">
              {[
            ['Total score', result.total],
            ['Average score', result.average],
            ['Weighted score', result.weighted],
            ['Percentage', `${result.percentage}%`],
            ['Final grade', result.grade],
            ['Completion', `${result.completion}%`]].
            map(([k, v]) =>
            <div key={String(k)} className="flex items-center justify-between">
                  <dt className="text-fgmuted">{k}</dt>
                  <dd className="font-mono text-fg">{String(v)}</dd>
                </div>
            )}
            </dl>
            <div className="mt-3 border-t border-line pt-3">
              <StatusPill status={result.passed ? 'passed' : 'below passing score'} tone={result.passed ? 'positive' : 'danger'} />
              <p className="mt-2 font-mono text-2xs text-fgsubtle">{scale.formula}</p>
            </div>
          </Panel>
        </div> :

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[210px_1fr_320px]">
          {/* Palette */}
          <Panel title="Components" description="Drag onto a section" bodyClassName="p-3">
            <div className="space-y-4">
              {PALETTE.map((group) =>
            <div key={group.group}>
                  <p className="mono-label mb-1.5">{group.group}</p>
                  <div className="space-y-1">
                    {group.items.map((item) =>
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) =>
                  e.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify({ kind: 'new', type: item.type })
                  )
                  }
                  className="flex cursor-grab items-center gap-1.5 rounded border border-dashed border-line px-2 py-1.5 text-xs text-fgmuted hover:border-linestrong hover:text-fg active:cursor-grabbing">
                  
                        <GripVerticalIcon size={11} />
                        {item.label}
                      </div>
                )}
                  </div>
                </div>
            )}
            </div>
          </Panel>

          {/* Canvas */}
          <div className="space-y-3">
            {template.sections.map((section) =>
          <div
            key={section.id}
            className={cn(
              'rounded-lg border bg-surface',
              selection?.kind === 'section' && selection.id === section.id ?
              'border-linestrong' :
              'border-line',
              section.hidden && 'opacity-60'
            )}>
            
                <header
              className="flex items-center gap-2 border-b border-line px-3 py-2"
              onClick={() => setSelection({ kind: 'section', id: section.id })}>
              
                  <button
                onClick={(e) => {
                  e.stopPropagation();
                  patchSection(section.id, (s) => ({ ...s, collapsed: !s.collapsed }));
                }}
                aria-label={section.collapsed ? 'Expand section' : 'Collapse section'}
                className="text-fgsubtle hover:text-fg">
                
                    {section.collapsed ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{section.title}</p>
                    <p className="truncate font-mono text-2xs text-fgsubtle">
                      {section.fields.length} items · weight {section.weight}%
                    </p>
                  </div>
                  <button
                onClick={(e) => {
                  e.stopPropagation();
                  patchSection(section.id, (s) => ({ ...s, hidden: !s.hidden }));
                }}
                aria-label={section.hidden ? 'Show section' : 'Hide section'}
                className="text-fgsubtle hover:text-fg">
                
                    {section.hidden ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                  </button>
                  <button
                onClick={(e) => {
                  e.stopPropagation();
                  patch((t) => ({
                    ...t,
                    sections: [
                    ...t.sections,
                    {
                      ...section,
                      id: uid('sec'),
                      title: `${section.title} (copy)`,
                      fields: section.fields.map((f) => ({ ...f, id: uid('f') }))
                    }]

                  }));
                }}
                aria-label="Duplicate section"
                className="text-fgsubtle hover:text-fg">
                
                    <CopyIcon size={14} />
                  </button>
                  <button
                onClick={(e) => {
                  e.stopPropagation();
                  patch((t) => ({ ...t, sections: t.sections.filter((s) => s.id !== section.id) }));
                  setSelection(null);
                }}
                aria-label="Delete section"
                className="text-fgsubtle hover:text-danger">
                
                    <Trash2Icon size={14} />
                  </button>
                </header>

                {!section.collapsed &&
            <div
              className="space-y-1.5 p-3"
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(section.id);
              }}
              onDrop={handleDrop(section.id)}>
              
                    {section.fields.map((field, index) =>
              <div
                key={field.id}
                draggable
                onDragStart={(e) =>
                e.dataTransfer.setData(
                  'text/plain',
                  JSON.stringify({ kind: 'move', sectionId: section.id, fieldId: field.id })
                )
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTarget(field.id);
                }}
                onDrop={handleDrop(section.id, index)}
                onClick={() => setSelection({ kind: 'field', sectionId: section.id, id: field.id })}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2',
                  selection?.kind === 'field' && selection.id === field.id ?
                  'border-linestrong bg-surface2' :
                  'border-line hover:bg-surface2',
                  dropTarget === field.id && 'border-t-2 border-t-fg',
                  field.hidden && 'opacity-50'
                )}>
                
                        <GripVerticalIcon size={12} className="shrink-0 cursor-grab text-fgsubtle" />
                        <span className="shrink-0 rounded border border-line bg-surface px-1.5 font-mono text-[9px] uppercase tracking-wider text-fgmuted">
                          {field.type}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-fg">{field.label}</span>
                        {field.required && <span className="shrink-0 text-danger">*</span>}
                        {field.condition &&
                <span className="shrink-0 font-mono text-[9px] uppercase text-fgsubtle">
                            conditional
                          </span>
                }
                        {typeof field.weight === 'number' &&
                <span className="shrink-0 font-mono text-2xs text-fgsubtle">{field.weight}%</span>
                }
                        <button
                  onClick={(e) => {
                    e.stopPropagation();
                    insertField(section.id, { ...field, id: uid('f'), label: `${field.label} (copy)` }, index + 1);
                  }}
                  aria-label="Duplicate field"
                  className="shrink-0 text-fgsubtle opacity-0 hover:text-fg group-hover:opacity-100">
                  
                          <CopyIcon size={12} />
                        </button>
                        <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(section.id, field.id);
                    setSelection(null);
                  }}
                  aria-label="Delete field"
                  className="shrink-0 text-fgsubtle opacity-0 hover:text-danger group-hover:opacity-100">
                  
                          <Trash2Icon size={12} />
                        </button>
                      </div>
              )}

                    <div
                className={cn(
                  'rounded border border-dashed px-3 py-4 text-center font-mono text-2xs uppercase tracking-wider',
                  dropTarget === section.id ?
                  'border-fg text-fg' :
                  'border-line text-fgsubtle'
                )}>
                
                      Drop components here
                    </div>
                  </div>
            }
              </div>
          )}

            <button
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-linestrong py-4 text-sm text-fgmuted hover:text-fg">
            
              <PlusIcon size={14} /> Add section
            </button>
          </div>

          {/* Inspector */}
          <Panel title="Properties" description={selection ? 'Configure the selected element' : 'Select an element'}>
            {!selection &&
          <p className="py-8 text-center text-sm text-fgmuted">
                Click a section or field on the canvas to configure it.
              </p>
          }

            {selectedSection &&
          <div className="space-y-3">
                <Input
              label="Section title"
              value={selectedSection.title}
              onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, title: e.target.value }))} />
            
                <Input
              label="Subtitle"
              value={selectedSection.subtitle ?? ''}
              onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, subtitle: e.target.value }))} />
            
                <Input
              label="Description"
              value={selectedSection.description ?? ''}
              onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, description: e.target.value }))} />
            
                <Input
              label="Weight (%)"
              type="number"
              value={String(selectedSection.weight)}
              onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, weight: Number(e.target.value) }))} />
            
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={selectedSection.collapsed}
                  onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, collapsed: e.target.checked }))} />
                
                    Collapsed
                  </label>
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={selectedSection.hidden}
                  onChange={(e) => patchSection(selectedSection.id, (s) => ({ ...s, hidden: e.target.checked }))} />
                
                    Hidden
                  </label>
                </div>
              </div>
          }

            {selectedField && selection?.kind === 'field' &&
          <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-line bg-surface2 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wider text-fgmuted">
                    {selectedField.type}
                  </span>
                  <span className="font-mono text-2xs text-fgsubtle">{selectedField.id}</span>
                </div>
                <Input
              label="Label"
              value={selectedField.label}
              onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, label: e.target.value }))} />
            
                <Input
              label="Help text"
              value={selectedField.helpText ?? ''}
              onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, helpText: e.target.value }))} />
            

                {NEEDS_RANGE.includes(selectedField.type) &&
            <>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                  label="Min"
                  type="number"
                  value={String(selectedField.min ?? 0)}
                  onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, min: Number(e.target.value) }))} />
                
                      <Input
                  label="Max"
                  type="number"
                  value={String(selectedField.max ?? 100)}
                  onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, max: Number(e.target.value) }))} />
                
                    </div>
                    <Input
                label="Weight (%)"
                type="number"
                value={String(selectedField.weight ?? 0)}
                onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, weight: Number(e.target.value) }))} />
              
                    <Input
                label="Target"
                value={selectedField.target ?? ''}
                onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, target: e.target.value }))} />
              
                    <Select
                label="Category"
                options={[{ value: '', label: 'Uncategorised' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                value={selectedField.categoryId ?? ''}
                onChange={(v) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, categoryId: v as string }))} />
              
                    <Select
                label="Rating scale"
                options={[{ value: '', label: 'Inherit from template' }, ...scales.map((s) => ({ value: s.id, label: s.name }))]}
                value={selectedField.scaleId ?? ''}
                onChange={(v) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, scaleId: v as string }))} />
              
                  </>
            }

                {NEEDS_OPTIONS.includes(selectedField.type) &&
            <div>
                    <label className="mono-label" htmlFor="options">
                      Options (one per line)
                    </label>
                    <textarea
                id="options"
                rows={4}
                value={(selectedField.options ?? []).join('\n')}
                onChange={(e) =>
                patchField(selection.sectionId, selectedField.id, (f) => ({
                  ...f,
                  options: e.target.value.split('\n')
                }))
                }
                className="mt-1 w-full rounded border border-line bg-surface p-2 text-sm text-fg" />
              
                  </div>
            }

                {selectedField.type === 'formula' &&
            <Input
              label="Formula expression"
              value={selectedField.formula ?? ''}
              helperText="Reference other fields by id, e.g. (f-1 * 0.6) + (f-2 * 0.4)"
              onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, formula: e.target.value }))} />

            }

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={selectedField.required}
                  onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, required: e.target.checked }))} />
                
                    Required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={selectedField.hidden}
                  onChange={(e) => patchField(selection.sectionId, selectedField.id, (f) => ({ ...f, hidden: e.target.checked }))} />
                
                    Hidden
                  </label>
                </div>

                <div className="rounded border border-dashed border-line p-2.5">
                  <p className="mono-label mb-2">Conditional logic</p>
                  <Select
                options={[
                { value: '', label: 'Always visible' },
                ...allFields.
                filter((f) => f.id !== selectedField.id).
                map((f) => ({ value: f.id, label: `When “${f.label}”` }))]
                }
                value={selectedField.condition?.fieldId ?? ''}
                onChange={(v) =>
                patchField(selection.sectionId, selectedField.id, (f) => ({
                  ...f,
                  condition: v ?
                  { fieldId: v as string, operator: f.condition?.operator ?? 'equals', value: f.condition?.value ?? '' } :
                  undefined
                }))
                } />
              
                  {selectedField.condition &&
              <div className="mt-2 grid grid-cols-2 gap-2">
                      <Select
                  options={[
                  { value: 'equals', label: 'equals' },
                  { value: 'not-equals', label: 'not equals' },
                  { value: 'greater-than', label: 'greater than' },
                  { value: 'less-than', label: 'less than' }]
                  }
                  value={selectedField.condition.operator}
                  onChange={(v) =>
                  patchField(selection.sectionId, selectedField.id, (f) => ({
                    ...f,
                    condition: { ...f.condition!, operator: v as 'equals' }
                  }))
                  } />
                
                      <Input
                  value={selectedField.condition.value}
                  placeholder="value"
                  onChange={(e) =>
                  patchField(selection.sectionId, selectedField.id, (f) => ({
                    ...f,
                    condition: { ...f.condition!, value: e.target.value }
                  }))
                  } />
                
                    </div>
              }
                </div>
              </div>
          }
          </Panel>
        </div>
      }
    </>);

}