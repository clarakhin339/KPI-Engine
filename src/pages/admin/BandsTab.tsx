import { CheckIcon } from 'lucide-react';
import { CrudTable } from '../../components/common/CrudTable';
import { Panel } from '../../components/common/Panel';
import { StatusPill } from '../../components/common/StatusPill';
import { useApp } from '../../lib/store';
import { MAX_SCORE, MIN_SCORE } from '../../lib/scoring';
import type { ScoreBand } from '../../lib/types';
import { uid } from '../../lib/utils';
import { removeById, upsert } from './shared';

const yes = (on: boolean) => on ? <CheckIcon size={14} className="text-positive" /> : <span className="text-fgsubtle">—</span>;

export function BandsTab() {
  const { bands, setBands, logAction } = useApp();

  return (
    <div className="space-y-4">
      <Panel dashed>
        <p className="text-sm text-fgmuted">
          Bands decide the rating and entitlements granted from the final score — KPI reward
          bonus, salary increase, promotion and any extra allowance. The values below follow the
          HR score structure; update them once management confirms changes. Edits apply to
          cycles closed afterwards; already published results keep their band.
        </p>
      </Panel>

      <CrudTable<ScoreBand>
        title="Score bands"
        noun="band"
        rows={[...bands].sort((a, b) => b.minScore - a.minScore)}
        describe={(b) => b.label}
        blank={() => ({
          id: uid('sb'),
          label: '',
          minScore: 0,
          maxScore: 0,
          tone: 'neutral',
          benefit: null,
          kpiBonus: false,
          salaryIncrease: false,
          promotion: false
        })}
        columns={[
        { key: 'label', header: 'Rating', value: (b) => b.label, render: (b) => <StatusPill status={b.label} tone={b.tone} /> },
        { key: 'range', header: 'Score range', value: (b) => b.minScore, render: (b) => <span className="font-mono text-sm text-fg">{b.minScore} – {b.maxScore}</span> },
        { key: 'benefit', header: 'Benefit', value: (b) => b.benefit ?? '', render: (b) => b.benefit ?? <span className="text-fgsubtle">—</span> },
        { key: 'kpi', header: 'KPI bonus', align: 'center', value: (b) => (b.kpiBonus ? 1 : 0), render: (b) => yes(b.kpiBonus) },
        { key: 'salary', header: 'Salary increase', align: 'center', value: (b) => (b.salaryIncrease ? 1 : 0), render: (b) => yes(b.salaryIncrease) },
        { key: 'promotion', header: 'Promotion', align: 'center', value: (b) => (b.promotion ? 1 : 0), render: (b) => yes(b.promotion) }]
        }
        fields={[
        { key: 'label', label: 'Rating name', wide: true },
        { key: 'minScore', label: 'From score', type: 'number' },
        { key: 'maxScore', label: 'To score', type: 'number' },
        {
          key: 'tone',
          label: 'Colour',
          type: 'select',
          wide: true,
          options: [
          { value: 'positive', label: 'Green' },
          { value: 'warning', label: 'Amber' },
          { value: 'danger', label: 'Red' },
          { value: 'info', label: 'Blue' },
          { value: 'neutral', label: 'Grey' }]

        },
        { key: 'benefit', label: 'Benefit / allowance name (leave empty if none)', wide: true },
        { key: 'kpiBonus', label: 'KPI reward bonus allowed', type: 'checkbox' },
        { key: 'salaryIncrease', label: 'Salary increase allowed', type: 'checkbox' },
        { key: 'promotion', label: 'Promotion allowed', type: 'checkbox' }]
        }
        onSave={(band, isNew) => {
          if (!band.label.trim()) return 'Rating name is required.';
          if (!(band.minScore >= MIN_SCORE && band.maxScore <= MAX_SCORE && band.minScore <= band.maxScore)) {
            return `The range must sit within ${MIN_SCORE}–${MAX_SCORE}, with "from" not above "to".`;
          }
          const clash = bands.find(
            (b) => b.id !== band.id && band.minScore <= b.maxScore && band.maxScore >= b.minScore
          );
          if (clash) return `The range overlaps with "${clash.label}" (${clash.minScore}–${clash.maxScore}).`;
          const benefit = band.benefit?.trim() ? band.benefit.trim() : null;
          upsert(setBands, { ...band, label: band.label.trim(), benefit }, isNew);
          logAction(isNew ? 'Created score band' : 'Updated score band', 'Score bands', `${band.label} · ${band.minScore}–${band.maxScore}`, 'warning');
          return null;
        }}
        onDelete={(band) => {
          removeById(setBands, band.id);
          logAction('Deleted score band', 'Score bands', band.label, 'warning');
          return null;
        }} />
      
    </div>);

}
