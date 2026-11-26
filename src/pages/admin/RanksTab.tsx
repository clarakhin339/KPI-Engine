import { CrudTable } from '../../components/common/CrudTable';
import { useApp } from '../../lib/store';
import type { Position, Rank } from '../../lib/types';
import { uid } from '../../lib/utils';
import { nameTaken, removeById, upsert } from './shared';

export function RanksTab() {
  const { ranks, positions, employees, setRanks, setPositions, logAction } = useApp();

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <CrudTable<Rank>
        title="Ranks"
        description="Job levels, ordered from lowest to highest."
        noun="rank"
        rows={[...ranks].sort((a, b) => a.level - b.level)}
        describe={(r) => r.name}
        blank={() => ({ id: uid('rk'), name: '', level: Math.max(0, ...ranks.map((r) => r.level)) + 1 })}
        columns={[
        { key: 'level', header: 'Level', sortable: true, value: (r) => r.level, width: '80px' },
        { key: 'name', header: 'Rank', sortable: true, value: (r) => r.name },
        { key: 'people', header: 'Employees', align: 'right', value: (r) => employees.filter((e) => e.rankId === r.id).length }]
        }
        fields={[
        { key: 'name', label: 'Rank name' },
        { key: 'level', label: 'Level (order)', type: 'number' }]
        }
        onSave={(rank, isNew) => {
          if (!rank.name.trim()) return 'Rank name is required.';
          if (!Number.isFinite(rank.level)) return 'Level must be a number.';
          if (nameTaken(ranks, rank, (r) => r.name)) return 'A rank with this name already exists.';
          upsert(setRanks, { ...rank, name: rank.name.trim() }, isNew);
          logAction(isNew ? 'Created rank' : 'Updated rank', 'Ranks & positions', rank.name);
          return null;
        }}
        onDelete={(rank) => {
          if (employees.some((e) => e.rankId === rank.id)) return 'Employees still hold this rank.';
          removeById(setRanks, rank.id);
          logAction('Deleted rank', 'Ranks & positions', rank.name, 'warning');
          return null;
        }} />
      

      <CrudTable<Position>
        title="Positions"
        description="Job titles. Independent of rank."
        noun="position"
        rows={positions}
        describe={(p) => p.title}
        blank={() => ({ id: uid('p'), title: '' })}
        columns={[
        { key: 'title', header: 'Position', sortable: true, value: (p) => p.title },
        { key: 'people', header: 'Employees', align: 'right', value: (p) => employees.filter((e) => e.positionId === p.id).length }]
        }
        fields={[{ key: 'title', label: 'Position title' }]}
        onSave={(position, isNew) => {
          if (!position.title.trim()) return 'Position title is required.';
          if (nameTaken(positions, position, (p) => p.title)) return 'This position already exists.';
          upsert(setPositions, { ...position, title: position.title.trim() }, isNew);
          logAction(isNew ? 'Created position' : 'Updated position', 'Ranks & positions', position.title);
          return null;
        }}
        onDelete={(position) => {
          if (employees.some((e) => e.positionId === position.id)) return 'Employees still hold this position.';
          removeById(setPositions, position.id);
          logAction('Deleted position', 'Ranks & positions', position.title, 'warning');
          return null;
        }} />
      
    </div>);

}
