import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { TabBar } from '../components/common/TabBar';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog';
import { FieldRenderer, conditionMet } from '../components/kpi/FieldRenderer';
import { CommentThread } from '../components/kpi/CommentThread';
import { ApprovalTimeline } from '../components/kpi/ApprovalTimeline';
import { EvidenceList } from '../components/kpi/EvidenceList';
import { useApp } from '../lib/store';
import { calculateScore } from '../lib/formula';
import type { Assessment } from '../lib/types';
import { formatDate, formatDateTime, initials, uid } from '../lib/utils';

export function AssessmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    assessments,
    setAssessments,
    templates,
    cycles,
    scales,
    currentUser,
    userById,
    orgById,
    pushToast,
    logAction
  } = useApp();

  const assessment = assessments.find((a) => a.id === id) ?? assessments[0];
  const template = templates.find((t) => t.id === assessment.templateId) ?? templates[0];
  const cycle = cycles.find((c) => c.id === assessment.cycleId);
  const scale = scales.find((s) => s.id === template.scaleId) ?? scales[0];
  const employee = userById(assessment.userId);

  const [tab, setTab] = useState('review');
  const [overrides, setOverrides] = useState<Record<string, string | number | boolean>>({});
  const [decision, setDecision] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [note, setNote] = useState('');

  const merged = { ...assessment.responses, ...overrides };
  const employeeResult = useMemo(
    () => calculateScore(template, assessment.responses, scale),
    [template, assessment.responses, scale]
  );
  const reviewerResult = useMemo(
    () => calculateScore(template, merged, scale),
    [template, merged, scale]
  );

  const patch = (updater: (a: Assessment) => Assessment) =>
  setAssessments((prev) => prev.map((a) => a.id === assessment.id ? updater(a) : a));

  const applyDecision = () => {
    if (!decision) return;
    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      revision: 'revision-requested'
    } as const;
    const approvalStatus = {
      approve: 'approved',
      reject: 'rejected',
      revision: 'revision'
    } as const;

    patch((a) => ({
      ...a,
      status: statusMap[decision],
      responses: merged,
      managerScore: reviewerResult.weighted,
      finalScore: decision === 'approve' ? reviewerResult.weighted : null,
      rating: decision === 'approve' ? reviewerResult.grade : null,
      currentStep: decision === 'approve' ? Math.min(a.currentStep + 1, a.approvals.length) : a.currentStep,
      approvals: a.approvals.map((s, i) =>
      i === a.currentStep ?
      { ...s, status: approvalStatus[decision], actedAt: new Date().toISOString(), note: note || undefined } :
      i === a.currentStep + 1 && decision === 'approve' ?
      { ...s, status: 'pending' as const } :
      s
      ),
      history: [
      {
        id: uid('h'),
        at: new Date().toISOString(),
        actorId: currentUser.id,
        action:
        decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Revision requested',
        detail: note || `Reviewer score ${reviewerResult.weighted}`
      },
      ...a.history]

    }));

    logAction(
      decision === 'approve' ? 'Approved assessment' : decision === 'reject' ? 'Rejected assessment' : 'Requested revision',
      'KPI Approval',
      `${assessment.id} · ${employee?.name}`,
      decision === 'reject' ? 'warning' : 'info'
    );
    pushToast({
      title:
      decision === 'approve' ?
      'Approved and routed onward' :
      decision === 'reject' ?
      'Assessment rejected' :
      'Returned for revision',
      tone: decision === 'reject' ? 'danger' : 'success'
    });
    setDecision(null);
    setNote('');
  };

  const tabs = [
  { id: 'review', label: 'Review & score' },
  { id: 'self', label: 'Self appraisal' },
  { id: 'evidence', label: 'Evidence', count: assessment.evidence.length },
  { id: 'comments', label: 'Comments', count: assessment.comments.length },
  { id: 'approval', label: 'Approval chain' },
  { id: 'history', label: 'History', count: assessment.history.length }];


  const overridden = Object.keys(overrides).length;

  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'Reviews', employee?.name ?? '']}
        title={`${employee?.name} · ${template.title}`}
        description={`${employee?.position} · ${orgById(employee?.orgNodeId)?.name} · reports to ${
        userById(employee?.managerId)?.name ?? '—'}`
        }
        meta={
        <>
            <StatusPill status={assessment.status} />
            <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
              {cycle?.name} · submitted {formatDate(assessment.submittedAt ?? '')}
            </span>
          </>
        }
        actions={
        <>
            <Button variant="tertiary" size="small" leftIcon={<ArrowLeftIcon size={14} />} onClick={() => navigate('/reviews')}>
              Back
            </Button>
            <Button variant="secondary" size="small" leftIcon={<RotateCcwIcon size={14} />} onClick={() => setDecision('revision')}>
              Request revision
            </Button>
            <Button variant="destructive" size="small" leftIcon={<XIcon size={14} />} onClick={() => setDecision('reject')}>
              Reject
            </Button>
            <Button size="small" leftIcon={<CheckIcon size={14} />} onClick={() => setDecision('approve')}>
              Approve
            </Button>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'review' &&
          <div className="space-y-4">
              {overridden > 0 &&
            <div className="rounded border border-warning/40 bg-warningsoft p-3">
                  <p className="text-sm text-warning">
                    {overridden} score{overridden > 1 ? 's' : ''} overridden. The original employee
                    values are preserved in history.
                  </p>
                </div>
            }
              {template.sections.
            filter((s) => !s.hidden).
            map((section) =>
            <Panel
              key={section.id}
              title={section.title}
              description={section.subtitle}
              actions={
              <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                        weight {section.weight}%
                      </span>
              }>
              
                    <div className="space-y-5">
                      {section.fields.
                filter((f) => !f.hidden && conditionMet(f, merged)).
                map((field) =>
                <div key={field.id} className="rounded border border-dashed border-line p-3">
                            <FieldRenderer
                    field={field}
                    value={merged[field.id]}
                    responses={merged}
                    onChange={(v) => setOverrides((o) => ({ ...o, [field.id]: v }))} />
                  
                            {overrides[field.id] !== undefined &&
                  overrides[field.id] !== assessment.responses[field.id] &&
                  <p className="mt-2 font-mono text-2xs text-warning">
                                  employee value: {String(assessment.responses[field.id] ?? '—')} → reviewer:{' '}
                                  {String(overrides[field.id])}
                                </p>
                  }
                          </div>
                )}
                    </div>
                  </Panel>
            )}
            </div>
          }

          {tab === 'self' &&
          <Panel title="Self appraisal" description={`Written by ${employee?.name}`}>
              <dl className="space-y-4">
                {(
              [
              ['Achievements', assessment.selfAppraisal.achievements],
              ['Challenges', assessment.selfAppraisal.challenges],
              ['Improvement plan', assessment.selfAppraisal.improvementPlan]] as
              const).
              map(([label, body]) =>
              <div key={label}>
                    <dt className="mono-label">{label}</dt>
                    <dd className="mt-1 text-sm text-fg">{body}</dd>
                  </div>
              )}
                <div>
                  <dt className="mono-label">Self rating</dt>
                  <dd className="mt-1 font-mono text-sm text-fg">
                    {assessment.selfAppraisal.selfRating} / 5
                  </dd>
                </div>
              </dl>
            </Panel>
          }

          {tab === 'evidence' &&
          <Panel title="Evidence" description="Files submitted by the employee">
              <EvidenceList evidence={assessment.evidence} readOnly />
            </Panel>
          }

          {tab === 'comments' &&
          <Panel title="Comments & collaboration">
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
                  role: 'reviewer',
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
          <Panel title="Approval chain" description="Multi-level routing with SLA per step">
              <ApprovalTimeline approvals={assessment.approvals} />
            </Panel>
          }

          {tab === 'history' &&
          <Panel title="History" description="Score changes, rating changes and approval actions">
              <ul className="space-y-2">
                {assessment.history.map((h) =>
              <li key={h.id} className="flex items-start gap-3 rounded border border-line p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-[9px] text-fg">
                      {initials(userById(h.actorId)?.name ?? '?')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg">{h.action}</span>
                      <span className="block text-xs text-fgmuted">{h.detail}</span>
                    </span>
                    <span className="shrink-0 font-mono text-2xs text-fgsubtle">
                      {formatDateTime(h.at)}
                    </span>
                  </li>
              )}
              </ul>
            </Panel>
          }
        </div>

        <div className="space-y-4">
          <Panel title="Score comparison" description={scale.name}>
            <div className="space-y-3">
              <div>
                <p className="mono-label">Employee self score</p>
                <p className="font-mono text-xl text-fgmuted">{employeeResult.weighted.toFixed(2)}</p>
              </div>
              <div>
                <p className="mono-label">Reviewer score</p>
                <p className="font-mono text-3xl text-fg">{reviewerResult.weighted.toFixed(2)}</p>
                <p className="mt-1 text-xs text-fgmuted">
                  {reviewerResult.percentage}% · grade {reviewerResult.grade}
                </p>
              </div>
              <StatusPill
                status={reviewerResult.passed ? 'passing' : 'below passing'}
                tone={reviewerResult.passed ? 'positive' : 'danger'} />
              
            </div>
            <div className="mt-4 space-y-3 border-t border-line pt-3">
              {reviewerResult.sections.map((s) =>
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

          <Panel title="Current step">
            <p className="text-sm text-fg">
              {assessment.approvals[assessment.currentStep]?.stepName ?? 'Chain complete'}
            </p>
            <p className="mt-1 font-mono text-2xs text-fgsubtle">
              Step {Math.min(assessment.currentStep + 1, assessment.approvals.length)} of{' '}
              {assessment.approvals.length}
            </p>
            <div className="mt-3">
              <ScoreBar
                value={assessment.currentStep / assessment.approvals.length * 100}
                max={100}
                tone="info"
                showValue={false} />
              
            </div>
          </Panel>
        </div>
      </div>

      <Dialog isOpen={decision !== null} onClose={() => setDecision(null)} size="md">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">
            {decision === 'approve' ?
            'Approve assessment' :
            decision === 'reject' ?
            'Reject assessment' :
            'Request revision'}
          </h2>
          <p className="text-xs text-fgmuted">
            {employee?.name} · reviewer score {reviewerResult.weighted.toFixed(2)}
          </p>
        </DialogHeader>
        <DialogContent>
          <label htmlFor="decision-note" className="text-sm font-medium text-fg">
            Note {decision !== 'approve' && <span className="text-danger">*</span>}
          </label>
          <textarea
            id="decision-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain your decision. This is visible to the employee and stored in the audit trail."
            className="mt-1.5 w-full rounded border border-line bg-surface p-2.5 text-sm text-fg" />
          
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDecision(null)}>
            Cancel
          </Button>
          <Button
            variant={decision === 'reject' ? 'destructive' : 'primary'}
            disabled={decision !== 'approve' && !note.trim()}
            onClick={applyDecision}>
            
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </>);

}