import React, { useState } from 'react';
import { BellIcon, BellRingIcon, CalendarRangeIcon, CheckCheckIcon, TrophyIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { TabBar } from '../components/common/TabBar';
import { Button } from '../components/ui/Button';
import { useApp } from '../lib/store';
import type { AppNotification } from '../lib/types';
import { cn, formatDateTime } from '../lib/utils';

const ICONS: Record<AppNotification['type'], React.ReactNode> = {
  cycle: <CalendarRangeIcon size={14} />,
  reminder: <BellRingIcon size={14} />,
  result: <TrophyIcon size={14} />,
  system: <BellIcon size={14} />
};

export function NotificationsPage() {
  const { notifications, markNotificationsRead, pushToast } = useApp();
  const [tab, setTab] = useState('all');

  const unread = notifications.filter((n) => !n.read);
  const filtered = tab === 'unread' ? unread : notifications;

  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'Notifications']}
        title="Notifications"
        description="Cycle openings, scoring reminders and published results."
        actions={
        <Button
          variant="secondary"
          size="small"
          leftIcon={<CheckCheckIcon size={14} />}
          disabled={unread.length === 0}
          onClick={() => {
            markNotificationsRead();
            pushToast({ title: 'All notifications marked as read', tone: 'success' });
          }}>
          
            Mark all read
          </Button>
        } />
      

      <TabBar
        tabs={[
        { id: 'all', label: 'All', count: notifications.length },
        { id: 'unread', label: 'Unread', count: unread.length }]
        }
        active={tab}
        onChange={setTab} />
      
      {filtered.length === 0 ?
      <Panel>
          <p className="py-10 text-center text-sm text-fgmuted">Nothing here.</p>
        </Panel> :

      <ul className="max-w-3xl space-y-2">
          {filtered.map((n) =>
        <li
          key={n.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3',
            n.read ? 'border-line bg-surface' : 'border-linestrong bg-surface2'
          )}>
          
              <span className="mt-0.5 text-fgsubtle">{ICONS[n.type]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{n.title}</span>
                <span className="mt-0.5 block text-sm text-fgmuted">{n.body}</span>
              </span>
              <span className="shrink-0 font-mono text-2xs text-fgsubtle">{formatDateTime(n.at)}</span>
            </li>
        )}
        </ul>
      }
    </>);

}
