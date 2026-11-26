import { Link } from 'react-router-dom';
import { BellRingIcon, ClipboardListIcon, GaugeIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Panel } from '../components/common/Panel';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { useApp } from '../lib/store';
import { expectedEvaluations, grantsOf, scoringLabel } from '../lib/permissions';
import { formatDate, fullName } from '../lib/utils';

export function DashboardPage() {
  const {
    me,
    can,
    access,
    activeCycle,
    evaluations,
    scorable,
    teams,
    roles,
    nameOf,
    notify,
    pushToast
  } = useApp();

  const inCycle = evaluations.filter((e) => e.cycleId === activeCycle?.id);
  const submittedKeys = new Set(
    inCycle.filter((e) => e.status === 'submitted').map((e) => `${e.evaluatorId}:${e.evaluateeId}`)
  );
  const isDone = (evaluatorId: string, evaluateeId: string) =>
  submittedKeys.has(`${evaluatorId}:${evaluateeId}`);

  const mineDone = scorable.filter((e) => isDone(me.id, e.id));
  const mineTodo = scorable.filter((e) => !isDone(me.id, e.id));

  const expected = can('manage') ? expectedEvaluations(access) : [];
  const done = expected.filter((p) => isDone(p.evaluatorId, p.evaluateeId));
  const completion = expected.length ? Math.round(done.length / expected.length * 100) : 0;
  const scoringRoles = roles.filter((r) => expected.some((p) => p.roleId === r.id));
  const teamRows = teams.filter((t) => expected.some((p) => p.teamId === t.id));
  const waiting = Array.from(new Set(expected.map((p) => p.evaluatorId))).
  map((evaluatorId) => ({
    evaluatorId,
    pending: expected.filter((p) => p.evaluatorId === evaluatorId && !isDone(p.evaluatorId, p.evaluateeId)).length
  })).
  filter((w) => w.pending > 0).
  sort((a, b) => b.pending - a.pending);

  const remind = (targets: typeof waiting) => {
    targets.forEach((w) =>
    notify({
      type: 'reminder',
      title: 'Reminder: finish your evaluations',
      body: `${w.pending} evaluation${w.pending === 1 ? ' is' : 's are'} still waiting for you in ${activeCycle?.name}.`,
      employeeId: w.evaluatorId
    })
    );
    pushToast({
      title: targets.length === 1 ? `Reminder sent to ${nameOf(targets[0].evaluatorId)}` : `Reminder sent to ${targets.length} evaluators`,
      tone: 'success'
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'Dashboard']}
        title={`Welcome, ${me.firstName}`}
        description={
        activeCycle ?
        `${activeCycle.name} is open for scoring until ${formatDate(activeCycle.endDate)}.` :
        'No evaluation cycle is open right now.'
        }
        meta={activeCycle && <StatusPill status={`${activeCycle.name} · active`} tone="positive" />} />
      

      {!activeCycle &&
      <Panel dashed>
          <p className="py-6 text-center text-sm text-fgmuted">
            Scoring is closed.{' '}
            {can('manage') ?
          <Link to="/cycles" className="text-fg underline underline-offset-2">
                Open the next cycle
              </Link> :

          'You will be notified when HR opens the next cycle.'
          }
          </p>
        </Panel>
      }

      {activeCycle && can('score') &&
      <Panel
        title="Your scoring"
        description={scoringLabel(access, me)}
        className="mb-4"
        actions={
        <Link to="/score">
              <Button size="small">{mineTodo.length > 0 ? 'Continue scoring' : 'Review my scores'}</Button>
            </Link>
        }>
        
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-sm text-fg">
              <span className="font-mono text-2xl font-semibold">{mineDone.length}</span>
              <span className="text-fgmuted"> / {scorable.length} submitted</span>
            </p>
            <div className="min-w-[160px] flex-1">
              <ScoreBar
              value={mineDone.length}
              max={Math.max(1, scorable.length)}
              tone={mineTodo.length === 0 ? 'positive' : 'info'}
              showValue={false} />
            
            </div>
          </div>
          {mineTodo.length > 0 &&
        <p className="mt-3 text-sm text-fgmuted">
              Still to submit: {mineTodo.slice(0, 6).map(fullName).join(', ')}
              {mineTodo.length > 6 && ` and ${mineTodo.length - 6} more`}
            </p>
        }
        </Panel>
      }

      {activeCycle && can('manage') &&
      <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
            label="People being evaluated"
            value={String(new Set(expected.map((p) => p.evaluateeId)).size)}
            hint={`across ${teamRows.length} teams`}
            icon={<UsersIcon size={15} />} />
          
            <StatCard
            label="Evaluations submitted"
            value={`${done.length} / ${expected.length}`}
            hint="all evaluators"
            icon={<ClipboardListIcon size={15} />} />
          
            <StatCard
            label="Cycle completion"
            value={`${completion}%`}
            hint={`closes ${formatDate(activeCycle.endDate)}`}
            icon={<GaugeIcon size={15} />} />
          
            <StatCard
            label="Deductions flagged"
            value={String(inCycle.filter((e) => e.status === 'submitted' && e.isDeduction).length)}
            hint="in submitted evaluations"
            icon={<TriangleAlertIcon size={15} />} />
          
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel
            title="Progress by team"
            description="Submitted evaluations per evaluator role"
            className="xl:col-span-2"
            bodyClassName="p-0">
            
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface2">
                      <th className="px-4 py-2 text-left mono-label">Team</th>
                      {scoringRoles.map((r) =>
                    <th key={r.id} className="px-4 py-2 text-left mono-label">
                          {r.name}
                        </th>
                    )}
                    </tr>
                  </thead>
                  <tbody>
                    {teamRows.map((team) =>
                  <tr key={team.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5 text-sm text-fg">{team.name}</td>
                        {scoringRoles.map((role) => {
                      const cell = expected.filter((p) => p.teamId === team.id && p.roleId === role.id);
                      const cellDone = cell.filter((p) => isDone(p.evaluatorId, p.evaluateeId)).length;
                      return (
                        <td key={role.id} className="px-4 py-2.5">
                              {cell.length === 0 ?
                          <span className="text-sm text-fgsubtle">—</span> :

                          <>
                                  <p className="font-mono text-xs text-fgmuted">
                                    {cellDone} / {cell.length}
                                  </p>
                                  <ScoreBar
                              value={cellDone}
                              max={cell.length}
                              tone={cellDone === cell.length ? 'positive' : 'info'}
                              showValue={false} />
                            
                                </>
                          }
                            </td>);

                    })}
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
            title="Waiting on"
            description="Evaluators with entries still to submit"
            actions={
            waiting.length > 0 &&
            <Button size="small" variant="secondary" leftIcon={<BellRingIcon size={13} />} onClick={() => remind(waiting)}>
                    Remind all
                  </Button>

            }>
            
              {waiting.length === 0 ?
            <p className="py-6 text-center text-sm text-fgmuted">Every evaluator has finished.</p> :

            <ul className="space-y-2">
                  {waiting.map((w) =>
              <li key={w.evaluatorId} className="flex items-center gap-2.5 rounded border border-line p-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{nameOf(w.evaluatorId)}</span>
                        <span className="block truncate font-mono text-2xs text-fgsubtle">
                          {Array.from(new Set(grantsOf(access, w.evaluatorId).map((g) => g.role.name))).join(', ')} · {w.pending} pending
                        </span>
                      </span>
                      <Button size="small" variant="tertiary" onClick={() => remind([w])}>
                        Remind
                      </Button>
                    </li>
              )}
                </ul>
            }
            </Panel>
          </div>
        </>
      }
    </>);

}
