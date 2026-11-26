import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusPill } from '../components/common/StatusPill';
import { EntryCard } from '../components/evaluation/EntryCard';
import { useApp } from '../lib/store';
import { canViewEvaluation } from '../lib/permissions';
import { formatDate } from '../lib/utils';

export function MyResultsPage() {
  const { me, access, cycles, activeCycle, evaluations, summaryFor, bandById } = useApp();

  const published = cycles.
  filter((c) => c.status === 'closed' && me.hireDate <= c.endDate).
  sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'My results']}
        title="My results"
        description="Your final score, bonus band and evaluator comments for each six-month cycle. Only you and HR can see this page." />
      

      {activeCycle &&
      <Panel dashed className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={activeCycle.name} tone="info" />
            <p className="text-sm text-fgmuted">
              Your evaluation for this cycle is in progress. Results are published here after HR
              closes the cycle on or after {formatDate(activeCycle.endDate)}.
            </p>
          </div>
        </Panel>
      }

      {published.length === 0 &&
      <Panel>
          <p className="py-8 text-center text-sm text-fgmuted">No published results yet.</p>
        </Panel>
      }

      <div className="space-y-4">
        {published.map((cycle) => {
          const summary = summaryFor(cycle.id, me.id);
          const band = bandById(summary.bandId);
          const entries = evaluations.filter(
            (e) =>
            e.cycleId === cycle.id &&
            e.evaluateeId === me.id &&
            canViewEvaluation(access, me.id, e, cycle)
          );
          return (
            <Panel
              key={cycle.id}
              title={cycle.name}
              description={`${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`}
              actions={band && <StatusPill status={band.label} tone={band.tone} />}>
              
              <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                <div>
                  <p className="mono-label">Final score</p>
                  <p className="mt-1 font-mono text-3xl font-semibold text-fg">
                    {summary.finalScore ?? '—'}
                    <span className="text-base font-normal text-fgsubtle"> / 100</span>
                  </p>
                </div>
                <p className="pb-1 text-sm text-fgmuted">
                  {summary.evaluationCount} evaluation{summary.evaluationCount === 1 ? '' : 's'}
                  {summary.deductionCount > 0 &&
                  <span className="text-danger">
                      {' '}· {summary.deductionCount} deduction{summary.deductionCount === 1 ? '' : 's'}
                    </span>
                  }
                </p>
              </div>

              {entries.length > 0 &&
              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {entries.map((entry) =>
                <li key={entry.id}>
                      <EntryCard evaluation={entry} />
                    </li>
                )}
                </ul>
              }
            </Panel>);

        })}
      </div>
    </>);

}
