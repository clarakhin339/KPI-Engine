import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function TabBar({
  tabs,
  active,
  onChange




}: {tabs: TabItem[];active: string;onChange: (id: string) => void;}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) =>
      <button
        key={tab.id}
        role="tab"
        aria-selected={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm',
          active === tab.id ?
          'border-fg font-medium text-fg' :
          'border-transparent text-fgmuted hover:text-fg'
        )}>
        
          {tab.label}
          {typeof tab.count === 'number' &&
        <span className="ml-1.5 font-mono text-2xs text-fgsubtle">{tab.count}</span>
        }
        </button>
      )}
    </div>);

}