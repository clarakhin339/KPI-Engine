import { useState } from 'react';
import { LockIcon } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { StatusPill } from '../common/StatusPill';
import { Button } from '../ui/Button';
import { EntryCard } from './EntryCard';
import { ScoreFields, toForm, toInput, type ScoreForm } from './ScoreFields';
import { useApp } from '../../lib/store';
import { canEditEvaluation, canViewEvaluation } from '../../lib/permissions';
import type { Employee } from '../../lib/types';
import { fullName } from '../../lib/utils';

export function EvaluationDrawer({
  employee,
  onClose
}: {employee: Employee | null;onClose: () => void;}) {
  const { rankById, positionById, teamById } = useApp();
  return (
    <Drawer
      open={!!employee}
      onClose={onClose}
      title={fullName(employee ?? undefined)}
      subtitle={
      employee ?
      [rankById(employee.rankId)?.name, positionById(employee.positionId)?.title, teamById(employee.teamId)?.name].
      filter(Boolean).
      join(' · ') :
      undefined
      }>
      
      {employee && <DrawerBody key={employee.id} employee={employee} onClose={onClose} />}
    </Drawer>);

}

function DrawerBody({ employee, onClose }: {employee: Employee;onClose: () => void;}) {
  const {
    me,
    access,
    can,
    activeCycle,
    cycles,
    evaluations,
    saveEvaluation,
    reviseEvaluation,
    summaryFor,
    bandById,
    pushToast
  } = useApp();

  const forEmployee = evaluations.filter((e) => e.evaluateeId === employee.id);
  const mine = forEmployee.find((e) => e.cycleId === activeCycle?.id && e.evaluatorId === me.id);
  const editable = !!activeCycle && (!mine || canEditEvaluation(access, me.id, mine, activeCycle));
  const others = forEmployee.filter(
    (e) =>
    e.cycleId === activeCycle?.id &&
    e.evaluatorId !== me.id &&
    canViewEvaluation(access, me.id, e, activeCycle)
  );
  const closed = cycles.
  filter((c) => c.status === 'closed').
  sort((a, b) => b.startDate.localeCompare(a.startDate));
  const myPast = closed.flatMap((cycle) => {
    const entry = forEmployee.find((e) => e.cycleId === cycle.id && e.evaluatorId === me.id);
    return entry ? [{ cycle, entry }] : [];
  });

  const [form, setForm] = useState<ScoreForm>(toForm(mine));
  const [error, setError] = useState('');
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [reviseForm, setReviseForm] = useState<ScoreForm>(toForm());
  const [reason, setReason] = useState('');
  const [reviseError, setReviseError] = useState('');

  const save = (submit: boolean) => {
    const failure = saveEvaluation(employee.id, toInput(form), submit);
    if (failure) {
      setError(failure);
      return;
    }
    setError('');
    pushToast({
      title: submit ? 'Evaluation submitted' : mine?.status === 'submitted' ? 'Evaluation updated' : 'Draft saved',
      description: fullName(employee),
      tone: 'success'
    });
    if (submit || mine?.status === 'submitted') onClose();
  };

  const revise = () => {
    if (!revisingId) return;
    const failure = reviseEvaluation(revisingId, toInput(reviseForm), reason);
    if (failure) {
      setReviseError(failure);
      return;
    }
    setRevisingId(null);
    pushToast({ title: 'Entry revised', description: 'The change is recorded in the audit log.', tone: 'success' });
  };

  return (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="mono-label">Your evaluation · {activeCycle?.name}</h3>
          <StatusPill status={mine?.status ?? 'not-started'} />
        </div>
        {editable ?
        <>
            <ScoreFields idPrefix="own" form={form} onChange={setForm} />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              {mine?.status === 'submitted' ?
            <Button size="small" onClick={() => save(false)}>
                  Update evaluation
                </Button> :

            <>
                  <Button size="small" variant="secondary" onClick={() => save(false)}>
                    Save draft
                  </Button>
                  <Button size="small" onClick={() => save(true)}>
                    Submit
                  </Button>
                </>
            }
            </div>
          </> :

        <>
            {mine && <EntryCard evaluation={mine} />}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-fgmuted">
              <LockIcon size={12} /> This entry is final and can no longer be changed.
            </p>
          </>
        }
      </section>

      {others.length > 0 &&
      <section>
          <h3 className="mono-label mb-2">Other evaluators · {activeCycle?.name}</h3>
          <ul className="space-y-2">
            {others.map((entry) =>
          <li key={entry.id}>
                {revisingId === entry.id ?
            <div className="rounded border border-linestrong p-3">
                    <ScoreFields idPrefix={`rev-${entry.id}`} form={reviseForm} onChange={setReviseForm} />
                    <label htmlFor="revise-reason" className="mt-3 block text-sm font-medium text-fg">
                      Reason for revision
                    </label>
                    <input
                id="revise-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recorded in the audit log"
                className="mt-1 h-9 w-full rounded border border-line bg-surface px-2.5 text-sm text-fg placeholder:text-fgsubtle" />
              
                    {reviseError && <p className="mt-2 text-sm text-danger">{reviseError}</p>}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button size="small" variant="secondary" onClick={() => setRevisingId(null)}>
                        Cancel
                      </Button>
                      <Button size="small" onClick={revise}>
                        Save revision
                      </Button>
                    </div>
                  </div> :

            <EntryCard
              evaluation={entry}
              actions={
              canEditEvaluation(access, me.id, entry, activeCycle) &&
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  setRevisingId(entry.id);
                  setReviseForm(toForm(entry));
                  setReason('');
                  setReviseError('');
                }}>
                
                        Revise as HR
                      </Button>

              } />

            }
              </li>
          )}
          </ul>
        </section>
      }

      {can('view_reports') ?
      closed.length > 0 &&
      <section>
            <h3 className="mono-label mb-2">Published results</h3>
            <ul className="space-y-1.5">
              {closed.map((cycle) => {
            const summary = summaryFor(cycle.id, employee.id);
            const band = bandById(summary.bandId);
            return (
              <li key={cycle.id} className="flex items-center gap-2 rounded border border-line px-3 py-2">
                    <span className="text-sm text-fg">{cycle.name}</span>
                    <span className="ml-auto font-mono text-sm text-fg">{summary.finalScore ?? '—'}</span>
                    {band && <StatusPill status={band.label} tone={band.tone} />}
                  </li>);

          })}
            </ul>
          </section> :

      myPast.length > 0 &&
      <section>
            <h3 className="mono-label mb-2">Your previous scores</h3>
            <ul className="space-y-1.5">
              {myPast.map(({ cycle, entry }) =>
          <li key={cycle.id} className="flex items-center gap-2 rounded border border-line px-3 py-2">
                  <span className="text-sm text-fg">{cycle.name}</span>
                  {entry.isDeduction && <StatusPill status="Deduction" tone="danger" />}
                  <span className="ml-auto font-mono text-sm text-fg">{entry.score}</span>
                </li>
          )}
            </ul>
          </section>
      }
    </>);

}
