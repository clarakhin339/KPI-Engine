import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import {
  ClipboardListIcon,
  ClockIcon,
  GaugeIcon,
  TrophyIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Panel } from '../components/common/Panel';
import { ScoreBar, StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { useApp } from '../lib/store';
import { departmentPerformance, distribution, scoreTrend } from '../lib/mockData';
import { formatDate, initials } from '../lib/utils';

const axisProps = {
  stroke: 'var(--fg-subtle)',
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: 'var(--line)' }
};

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  fontSize: 12,
  color: 'var(--fg)'
};

const heatmap = [
{ name: 'Amara Okafor', scores: [4.4, 4.5, 4.6, 4.6, 4.7] },
{ name: 'Priya Nair', scores: [4.0, 4.2, 4.3, 4.4, 4.5] },
{ name: 'Marcus Feld', scores: [3.8, 3.9, 4.1, 4.2, 4.3] },
{ name: 'Tobias Meyer', scores: [4.2, 4.3, 4.4, 4.5, 4.6] },
{ name: 'Yuki Tanaka', scores: [3.4, 3.6, 3.8, 4.0, 4.2] },
{ name: 'Ibrahim Sesay', scores: [2.9, 3.0, 3.1, 2.8, 3.1] }];


function heatTone(v: number) {
  if (v >= 4.4) return 'var(--positive)';
  if (v >= 3.8) return 'var(--info)';
  if (v >= 3.2) return 'var(--warning)';
  return 'var(--danger)';
}

export function DashboardPage() {
  const { assessments, userById, cycles, currentUser } = useApp();

  const activeCycle = cycles.find((c) => c.status === 'active');
  const pending = assessments.filter((a) => ['submitted', 'in-review'].includes(a.status));
  const completed = assessments.filter((a) => a.status === 'approved');
  const avg =
  assessments.filter((a) => a.selfScore > 0).reduce((s, a) => s + a.selfScore, 0) /
  Math.max(1, assessments.filter((a) => a.selfScore > 0).length);

  const ranked = [...assessments].
  filter((a) => a.selfScore > 0).
  sort((a, b) => b.selfScore - a.selfScore);

  return (
    <>
      <PageHeader
        breadcrumb={['Workspace', 'Dashboard']}
        title={`Good morning, ${currentUser.name.split(' ')[0]}`}
        description="Live view of the active KPI cycle across the organization."
        meta={
        activeCycle &&
        <>
              <StatusPill status={activeCycle.status} />
              <span className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                {activeCycle.name} · due {formatDate(activeCycle.dueDate)}
              </span>
            </>

        }
        actions={
        <>
            <Link to="/reports">
              <Button variant="secondary" size="small">
                Export summary
              </Button>
            </Link>
            <Link to="/assignments">
              <Button size="small">Assign KPI</Button>
            </Link>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average score"
          value={avg.toFixed(2)}
          hint="of 5.00 weighted"
          delta={2.4}
          icon={<GaugeIcon size={15} />} />
        
        <StatCard
          label="Pending reviews"
          value={String(pending.length)}
          hint="awaiting action"
          icon={<ClockIcon size={15} />} />
        
        <StatCard
          label="Completed"
          value={String(completed.length)}
          hint={`${Math.round(completed.length / assessments.length * 100)}% of assessments`}
          delta={12}
          icon={<ClipboardListIcon size={15} />} />
        
        <StatCard
          label="Employees in cycle"
          value={String(assessments.length)}
          hint="across 4 departments"
          icon={<UsersIcon size={15} />} />
        
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="Score trend"
          description="Weighted average by function over the last seven cycles"
          className="xl:col-span-2">
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" {...axisProps} />
                <YAxis domain={[3, 4.6]} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="company" stroke="var(--fg)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="engineering" stroke="var(--info)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="sales" stroke="var(--warning)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="security" stroke="var(--positive)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            {[
            ['Company', 'var(--fg)'],
            ['Engineering', 'var(--info)'],
            ['Sales', 'var(--warning)'],
            ['Security', 'var(--positive)']].
            map(([label, color]) =>
            <span key={label} className="flex items-center gap-1.5 font-mono text-2xs text-fgmuted">
                <span className="h-0.5 w-4" style={{ backgroundColor: color }} />
                {label}
              </span>
            )}
          </div>
        </Panel>

        <Panel title="Score distribution" description="Employees per rating band">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="band" {...axisProps} tick={{ fontSize: 9 }} interval={0} angle={-20} dy={8} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {distribution.map((d, i) =>
                  <Cell
                    key={d.band}
                    fill={
                    [
                    'var(--danger)',
                    'var(--warning)',
                    'var(--info)',
                    'var(--positive)',
                    'var(--positive)'][
                    i]
                    } />

                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Department performance">
          <ul className="space-y-3">
            {departmentPerformance.map((d) =>
            <li key={d.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg">{d.name}</span>
                  <span className="font-mono text-xs text-fgmuted">{d.headcount} people</span>
                </div>
                <div className="mt-1.5">
                  <ScoreBar value={d.score} tone={d.score >= 4.2 ? 'positive' : 'info'} />
                </div>
                <p className="mt-1 font-mono text-2xs text-fgsubtle">
                  {d.completion}% cycle completion
                </p>
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title="Leaderboard"
          description="Top and lowest performers this cycle"
          actions={<TrophyIcon size={15} className="text-fgsubtle" />}>
          
          <ol className="space-y-2">
            {ranked.slice(0, 4).map((a, i) => {
              const user = userById(a.userId);
              return (
                <li key={a.id} className="flex items-center gap-2.5">
                  <span className="w-4 font-mono text-2xs text-fgsubtle">{i + 1}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-2xs text-fg">
                    {initials(user?.name ?? '')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{user?.name}</span>
                    <span className="block truncate font-mono text-2xs text-fgsubtle">
                      {user?.position}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-fg">{a.selfScore.toFixed(1)}</span>
                </li>);

            })}
          </ol>
          <div className="mt-3 border-t border-dashed border-line pt-3">
            <p className="mono-label mb-2">Needs attention</p>
            {ranked.slice(-2).map((a) => {
              const user = userById(a.userId);
              return (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <span className="truncate text-sm text-fgmuted">{user?.name}</span>
                  <span className="font-mono text-sm text-danger">{a.selfScore.toFixed(1)}</span>
                </div>);

            })}
          </div>
        </Panel>

        <Panel title="Pending your action" description="Items waiting at your approval step">
          {pending.length === 0 ?
          <p className="py-6 text-center text-sm text-fgmuted">Nothing waiting. You are clear.</p> :

          <ul className="space-y-2">
              {pending.map((a) => {
              const user = userById(a.userId);
              return (
                <li key={a.id}>
                    <Link
                    to={`/assessments/${a.id}`}
                    className="flex items-center gap-2.5 rounded border border-line p-2.5 hover:bg-surface2">
                    
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-2xs text-fg">
                        {initials(user?.name ?? '')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{user?.name}</span>
                        <span className="block truncate font-mono text-2xs text-fgsubtle">
                          Step {a.currentStep + 1} of 6 · {a.approvals[a.currentStep]?.stepName}
                        </span>
                      </span>
                      <StatusPill status={a.status} />
                    </Link>
                  </li>);

            })}
            </ul>
          }
        </Panel>
      </div>

      <Panel
        title="Performance heat map"
        description="Individual weighted score across the last five cycles"
        className="mt-4">
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left mono-label">Employee</th>
                {['Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26'].map((p) =>
                <th key={p} className="px-2 py-1.5 text-center mono-label">
                    {p}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) =>
              <tr key={row.name}>
                  <td className="whitespace-nowrap px-2 py-1.5 text-sm text-fg">{row.name}</td>
                  {row.scores.map((s, i) =>
                <td key={i} className="px-1 py-1">
                      <div
                    className="flex h-8 items-center justify-center rounded font-mono text-2xs text-white"
                    style={{ backgroundColor: heatTone(s) }}
                    title={`${row.name}: ${s.toFixed(1)}`}>
                    
                        {s.toFixed(1)}
                      </div>
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>);

}