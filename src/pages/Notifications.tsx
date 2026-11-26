import React, { useState } from 'react';
import {
  AtSignIcon,
  BellIcon,
  CheckCheckIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
  XCircleIcon } from
'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { TabBar } from '../components/common/TabBar';
import { Button } from '../components/ui/Button';
import { useApp } from '../lib/store';
import type { AppNotification } from '../lib/types';
import { cn } from '../lib/utils';

const ICONS: Record<AppNotification['type'], React.ReactNode> = {
  due: <ClockIcon size={14} />,
  approval: <UserCheckIcon size={14} />,
  comment: <MessageSquareIcon size={14} />,
  mention: <AtSignIcon size={14} />,
  rejected: <XCircleIcon size={14} />,
  system: <BellIcon size={14} />
};

const CHANNELS = [
{ key: 'due', label: 'Due date reminder', description: 'Sent 5 and 1 days before the cycle due date.' },
{ key: 'approval', label: 'Approval reminder', description: 'Sent when an assessment reaches your approval step.' },
{ key: 'comment', label: 'Comment notification', description: 'Someone comments on an assessment you own or review.' },
{ key: 'mention', label: 'Mention notification', description: 'You are @mentioned in a thread.' },
{ key: 'rejected', label: 'Rejection notification', description: 'An assessment is rejected or returned for revision.' }];


export function NotificationsPage() {
  const { notifications, markNotificationsRead, pushToast } = useApp();
  const [tab, setTab] = useState('all');
  const [prefs, setPrefs] = useState<Record<string, {inApp: boolean;email: boolean;}>>(
    Object.fromEntries(CHANNELS.map((c) => [c.key, { inApp: true, email: c.key !== 'comment' }]))
  );

  const filtered =
  tab === 'all' ? notifications : notifications.filter((n) => tab === 'unread' ? !n.read : n.type === tab);

  return (
    <>
      <PageHeader
        breadcrumb={['My work', 'Notifications']}
        title="Notifications"
        description="In-app and email notifications driven by cycle deadlines, approvals and collaboration."
        actions={
        <Button
          variant="secondary"
          size="small"
          leftIcon={<CheckCheckIcon size={14} />}
          onClick={() => {
            markNotificationsRead();
            pushToast({ title: 'All notifications marked as read', tone: 'success' });
          }}>
          
            Mark all read
          </Button>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <TabBar
            tabs={[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: notifications.filter((n) => !n.read).length },
            { id: 'approval', label: 'Approvals' },
            { id: 'mention', label: 'Mentions' },
            { id: 'due', label: 'Deadlines' }]
            }
            active={tab}
            onChange={setTab} />
          
          {filtered.length === 0 ?
          <Panel>
              <p className="py-10 text-center text-sm text-fgmuted">Nothing here.</p>
            </Panel> :

          <ul className="space-y-2">
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
                  <span className="shrink-0 font-mono text-2xs text-fgsubtle">{n.at}</span>
                </li>
            )}
            </ul>
          }
        </div>

        <Panel title="Notification templates" description="Per-channel delivery settings">
          <ul className="space-y-3">
            {CHANNELS.map((c) =>
            <li key={c.key} className="rounded border border-line p-3">
                <p className="text-sm font-medium text-fg">{c.label}</p>
                <p className="mt-0.5 text-xs text-fgmuted">{c.description}</p>
                <div className="mt-2 flex gap-4">
                  {(['inApp', 'email'] as const).map((channel) =>
                <label key={channel} className="flex items-center gap-2 text-xs text-fg">
                      <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={prefs[c.key][channel]}
                    onChange={(e) =>
                    setPrefs((p) => ({ ...p, [c.key]: { ...p[c.key], [channel]: e.target.checked } }))
                    } />
                  
                      {channel === 'inApp' ? 'In-app' : 'Email'}
                    </label>
                )}
                </div>
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </>);

}