import { CrudTable } from '../../components/common/CrudTable';
import { Panel } from '../../components/common/Panel';
import { StatusPill } from '../../components/common/StatusPill';
import { useApp } from '../../lib/store';
import { MAX_SCORE, MIN_SCORE } from '../../lib/scoring';
import type { ScoreBand } from '../../lib/types';
import { uid } from '../../lib/utils';
import { removeById, upsert } from './shared';

export function BandsTab() {
  const { bands, setBands, logAction } = useApp();

  return (
    <div className="space-y-4">
      <Panel dashed>
        <p className="text-sm text-fgmuted">
          Bands decide bonus eligibility from the final score. The values below are the examples
          from the HR draft — update them once management confirms the policy. Changes apply to
          cycles closed afterwards; already published results keep their band.
        </p>
      </Panel>

      <CrudTable<ScoreBand>
        title="Score bands"
        noun="band"
        rows={[...bands].sort((a, b) => a.minScore - b.minScore)}
        describe={(b) => b.label}
        blank={() => ({ id: uid('sb'), label: '', minScore: 0, maxScore: 0, tone: 'neutral' })}
        columns={[
        { key: 'label', header: 'Band', value: (b) => b.label, render: (b) => <StatusPill status={b.label} tone={b.tone} /> },
        { key: 'range', header: 'Score range', value: (b) => b.minScore, render: (b) => <span className="font-mono text-sm text-fg">{b.minScore} – {b.maxScore}</span> }]
        }
        fields={[
        { key: 'label', label: 'Band name', wide: true },
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

        }]
        }
        onSave={(band, isNew) => {
          if (!band.label.trim()) return 'Band name is required.';
          if (!(band.minScore >= MIN_SCORE && band.maxScore <= MAX_SCORE && band.minScore <= band.maxScore)) {
            return `The range must sit within ${MIN_SCORE}–${MAX_SCORE}, with "from" not above "to".`;
          }
          const clash = bands.find(
            (b) => b.id !== band.id && band.minScore <= b.maxScore && band.maxScore >= b.minScore
          );
          if (clash) return `The range overlaps with "${clash.label}" (${clash.minScore}–${clash.maxScore}).`;
          upsert(setBands, { ...band, label: band.label.trim() }, isNew);
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
