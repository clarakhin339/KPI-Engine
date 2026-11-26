import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
  competencyRadar,
  departmentPerformance,
  distribution,
  scoreTrend } from
'../lib/mockData';

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

const pieColors = ['var(--danger)', 'var(--warning)', 'var(--info)', 'var(--positive)', 'var(--fg-muted)'];

function Gauge({ value, label }: {value: number;label: string;}) {
  const pct = Math.min(100, value / 5 * 100);
  const radius = 52;
  const circumference = Math.PI * radius;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 80" className="w-full max-w-[200px]">
        <path
          d="M 18 74 A 52 52 0 0 1 122 74"
          fill="none"
          stroke="var(--accent-soft)"
          strokeWidth="12"
          strokeLinecap="round" />
        
        <path
          d="M 18 74 A 52 52 0 0 1 122 74"
          fill="none"
          stroke="var(--positive)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${pct / 100 * circumference} ${circumference}`} />
        
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-current text-fg"
          style={{ fontSize: 20, fontWeight: 600 }}>
          
          {value.toFixed(2)}
        </text>
      </svg>
      <p className="mono-label mt-1">{label}</p>
    </div>);

}

export function AnalyticsPage() {
  const [scope, setScope] = useState('company');
  const [cycle, setCycle] = useState('cy-1');

  return (
    <>
      <PageHeader
        breadcrumb={['Insight', 'Analytics']}
        title="Analytics"
        description="Trend, distribution and competency analysis across every dimension of the engine."
        actions={
        <>
            <div className="w-44">
              <Select
              options={[
              { value: 'company', label: 'Company' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'sales', label: 'Sales' },
              { value: 'security', label: 'Information Security' }]
              }
              value={scope}
              onChange={(v) => setScope(v as string)} />
            
            </div>
            <div className="w-44">
              <Select
              options={[
              { value: 'cy-1', label: 'Q3 2026' },
              { value: 'cy-2', label: 'Q2 2026' },
              { value: 'cy-5', label: 'H1 2026' }]
              }
              value={cycle}
              onChange={(v) => setCycle(v as string)} />
            
            </div>
            <Button variant="secondary" size="small">
              Export
            </Button>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Composite score" description="Weighted across all active templates">
          <Gauge value={4.18} label="Company weighted score" />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            {[
            ['Passing', '92%'],
            ['Submitted', '87%'],
            ['Approved', '46%']].
            map(([k, v]) =>
            <div key={k}>
                <p className="font-mono text-sm text-fg">{v}</p>
                <p className="mono-label">{k}</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Competency radar" description="Team versus company baseline" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyRadar} outerRadius="75%">
                <PolarGrid stroke="var(--line)" />
                <PolarAngleAxis dataKey="competency" tick={{ fill: 'var(--fg-muted)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'var(--fg-subtle)', fontSize: 9 }} />
                <Radar name="Team" dataKey="team" stroke="var(--fg)" fill="var(--fg)" fillOpacity={0.12} />
                <Radar
                  name="Company"
                  dataKey="company"
                  stroke="var(--info)"
                  fill="var(--info)"
                  fillOpacity={0.08} />
                
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--fg-muted)' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Trend analysis" description="Rolling seven-cycle weighted average">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" {...axisProps} />
                <YAxis domain={[3, 4.6]} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--fg-muted)' }} />
                <Line type="monotone" dataKey="company" stroke="var(--fg)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="engineering" stroke="var(--info)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Rating distribution" description="Share of employees per band">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="band"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}>
                  
                  {distribution.map((d, i) =>
                  <Cell key={d.band} fill={pieColors[i]} stroke="var(--surface)" />
                  )}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--fg-muted)' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Department comparison" description="Score against cycle completion" className="mt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentPerformance} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--accent-soft)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--fg-muted)' }} />
              <Bar dataKey="score" name="Weighted score" fill="var(--fg)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completion" name="Completion %" fill="var(--info)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>);

}