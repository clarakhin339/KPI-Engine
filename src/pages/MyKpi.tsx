import React, { useMemo, useState } from 'react';
import { SaveIcon, SendIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { TabBar } from '../components/common/TabBar';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { FieldRenderer, conditionMet } from '../components/kpi/FieldRenderer';
import { CommentThread } from '../components/kpi/CommentThread';
import { ApprovalTimeline } from '../components/kpi/ApprovalTimeline';
import { EvidenceList } from '../components/kpi/EvidenceList';
import { useApp } from '../lib/store';
import { calculateScore } from '../lib/formula';
import type { Assessment, Evidence } from '../lib/types';
import { formatDate, formatDateTime, uid } from '../lib/utils';

export function MyKpiPage() {
  const {
    assessments,
    setAssessments,
    templates,
    cycles,
    scales,
    currentUser,
    userById,
    pushToast,
    logAction
  } = useApp();

  const assessment =
  assessments.find((a) => a.userId === currentUser.id) ?? assessments[0];
  const template = templates.find((t) => t.id === assessment.templateId) ?? templates[0];
  const cycle = cycles.find((c) => c.id === assessment.cycleId);
  const scale = scales.find((s) => s.id === template.scaleId) ?? scales[0];
  const [tab, setTab] = useState('assessment');

  const locked = ['approved', 'submitted', 'in-review'].includes(assessment.status);
  const result = useMemo(
    () => calculateScore(template, assessment.responses, scale),
    [template, assessment.responses, scale]
  );

  const patch = (updater: (a: Assessment) => Assessment) =>
  setAssessments((prev) => prev.map((a) => a.id === assessment.id ? updater(a) : a));

  const setResponse = (fieldId: string, value: string | number | boolean) =>
  patch((a) => ({ ...a, responses: { ...a.responses, [fieldId]: value } }));

  const tabs = [
  { id: 'assessment', label: 'Assessment' },
  { id: 'self', label: 'Self appraisal' },
  { id: 'evidence', label: 'Evidence', count: assessment.evidence.length },
  { id: 'comments', label: 'Comments', count: assessment.comments.length },
  { id: 'approval', label: 'Approval' },
  { id: 'history', label: 'History', count: assessment.history.length }];


  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'My KPIs']}
        title={template.title}
        description={template.description}
        meta={
        <>
            <StatusPill status={assessment.status} />
            <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
              {cycle?.name} · due {formatDate(cycle?.dueDate ?? '')} · {template.version}
            </span>
          </>
        }
        actions={
        <>
            <Button
            variant="secondary"
            size="small"
            leftIcon={<SaveIcon size={14} />}
            disabled={locked}
            onClick={() => {
              patch((a) => ({
                ...a,
                status: 'draft',
                updatedAt: new Date().toISOString(),
                history: [
                { id: uid('h'), at: new Date().toISOString(), actorId: currentUser.id, action: 'Draft saved', detail: `${result.completion}% complete` },
                ...a.history]

              }));
              pushToast({ title: 'Draft saved', description: `${result.completion}% complete`, tone: 'success' });
            }}>
            
              Save draft
            </Button>
            <Button
            size="small"
            leftIcon={<SendIcon size={14} />}
            disabled={locked}
            onClick={() => {
              patch((a) => ({
                ...a,
                status: 'submitted',
                selfScore: result.weighted,
                submittedAt: new Date().toISOString(),
                currentStep: 1,
                approvals: a.approvals.map((s, i) =>
                i === 0 ? { ...s, status: 'approved', actedAt: new Date().toISOString() } : i === 1 ? { ...s, status: 'pending' } : s
                ),
                history: [
                { id: uid('h'), at: new Date().toISOString(), actorId: currentUser.id, action: 'Submitted', detail: `Self score ${result.weighted}` },
                ...a.history]

              }));
              logAction('Submitted assessment', 'KPI Reviews', `${template.title} · ${currentUser.name}`);
              pushToast({ title: 'Assessment submitted', description: 'Routed to your team leader.', tone: 'success' });
            }}>
            
              Submit for review
            </Button>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'assessment' &&
          <div className="space-y-4">
              {template.sections.
            filter((s) => !s.hidden).
            map((section) => {
              const sectionResult = result.sections.find((s) => s.sectionId === section.id);
              return (
                <Panel
                  key={section.id}
                  title={section.title}
                  description={section.subtitle}
                  actions={
                  <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                          weight {section.weight}% · {sectionResult?.completion ?? 0}% complete
                        </span>
                  }>
                  
                      {section.description &&
                  <p className="mb-4 text-sm text-fgmuted">{section.description}</p>
                  }
                      <div className="space-y-5">
                        {section.fields.
                    filter((f) => !f.hidden && conditionMet(f, assessment.responses)).
                    map((field) =>
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={assessment.responses[field.id]}
                      responses={assessment.responses}
                      onChange={(v) => setResponse(field.id, v)}
                      readOnly={locked} />

                    )}
                      </div>
                    </Panel>);

            })}
            </div>
          }

          {tab === 'self' &&
          <Panel title="Self appraisal" description="Your own account of the cycle">
              <div className="space-y-4">
                {(
              [
              ['achievements', 'Key achievements'],
              ['challenges', 'Challenges faced'],
              ['improvementPlan', 'Improvement plan']] as
              const).
              map(([key, label]) =>
              <div key={key}>
                    <label htmlFor={key} className="text-sm font-medium text-fg">
                      {label}
                    </label>
                    <textarea
                  id={key}
                  rows={4}
                  disabled={locked}
                  value={assessment.selfAppraisal[key]}
                  onChange={(e) =>
                  patch((a) => ({
                    ...a,
                    selfAppraisal: { ...a.selfAppraisal, [key]: e.target.value }
                  }))
                  }
                  className="mt-1.5 w-full rounded border border-line bg-surface p-2.5 text-sm text-fg" />
                
                  </div>
              )}
                <div>
                  <span className="text-sm font-medium text-fg">Self rating</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((v) =>
                  <button
                    key={v}
                    disabled={locked}
                    onClick={() =>
                    patch((a) => ({ ...a, selfAppraisal: { ...a.selfAppraisal, selfRating: v } }))
                    }
                    className={
                    'h-9 w-9 rounded border font-mono text-sm ' + (
                    assessment.selfAppraisal.selfRating === v ?
                    'border-linestrong bg-accentsoft text-fg' :
                    'border-line text-fgmuted')
                    }>
                    
                        {v}
                      </button>
                  )}
                    <span className="ml-2 font-mono text-xs text-fgmuted">
                      Computed self score {result.weighted}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          }

          {tab === 'evidence' &&
          <Panel title="Evidence" description="Supporting files with version history">
              <EvidenceList
              evidence={assessment.evidence}
              readOnly={locked}
              onUpload={() => {
                const file: Evidence = {
                  id: uid('ev'),
                  name: `evidence-${assessment.evidence.length + 1}.pdf`,
                  type: 'pdf',
                  size: '820 KB',
                  uploadedBy: currentUser.id,
                  uploadedAt: new Date().toISOString().slice(0, 10),
                  version: 1
                };
                patch((a) => ({ ...a, evidence: [file, ...a.evidence] }));
                pushToast({ title: 'Evidence uploaded', description: file.name, tone: 'success' });
              }} />
            
            </Panel>
          }

          {tab === 'comments' &&
          <Panel title="Comments & collaboration" description="Threaded discussion visible to your reviewers">
              <CommentThread
              comments={assessment.comments}
              onAdd={(body) =>
              patch((a) => ({
                ...a,
                comments: [
                ...a.comments,
                {
                  id: uid('cm'),
                  authorId: currentUser.id,
                  role: 'employee',
                  body,
                  createdAt: new Date().toISOString(),
                  mentions: [],
                  replies: []
                }]

              }))
              } />
            
            </Panel>
          }

          {tab === 'approval' &&
          <Panel title="Approval chain" description="Where your assessment currently sits">
              <ApprovalTimeline approvals={assessment.approvals} />
            </Panel>
          }

          {tab === 'history' &&
          <Panel title="History" description="Immutable record of every change">
              <ul className="space-y-2">
                {assessment.history.map((h) =>
              <li key={h.id} className="flex items-start gap-3 rounded border border-line p-3">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-linestrong" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg">{h.action}</span>
                      <span className="block text-xs text-fgmuted">{h.detail}</span>
                    </span>
                    <span className="shrink-0 font-mono text-2xs text-fgsubtle">
                      {userById(h.actorId)?.name.split(' ')[0]} · {formatDateTime(h.at)}
                    </span>
                  </li>
              )}
              </ul>
            </Panel>
          }
        </div>

        <div className="space-y-4">
          <Panel title="Live score" description={scale.name}>
            <p className="font-mono text-3xl text-fg">{result.weighted.toFixed(2)}</p>
            <p className="mt-1 text-xs text-fgmuted">
              {result.percentage}% · grade {result.grade}
            </p>
            <div className="mt-3">
              <StatusPill
                status={result.passed ? 'passing' : 'below passing'}
                tone={result.passed ? 'positive' : 'danger'} />
              
            </div>
            <div className="mt-4 space-y-3 border-t border-line pt-3">
              {result.sections.map((s) =>
              <div key={s.sectionId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-fgmuted">{s.title}</span>
                    <span className="font-mono text-fgsubtle">{s.weight}%</span>
                  </div>
                  <div className="mt-1">
                    <ScoreBar value={s.score} tone={s.score >= 3.5 ? 'positive' : 'warning'} />
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Completion">
            <ScoreBar value={result.completion} max={100} tone="info" showValue={false} />
            <p className="mt-2 font-mono text-2xs text-fgsubtle">
              {result.completion}% of fields answered
            </p>
          </Panel>
        </div>
      </div>
    </>);

}