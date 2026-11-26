import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, MonitorIcon, ShieldIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { TabBar } from '../components/common/TabBar';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useApp } from '../lib/store';
import { sessions } from '../lib/mockData';
import { cn } from '../lib/utils';

const CONFIG_LINKS = [
{ to: '/templates', label: 'KPI templates', description: 'Versioned scorecards per department and position.' },
{ to: '/categories', label: 'KPI categories', description: 'Unlimited grouping used for weighting and analytics.' },
{ to: '/cycles', label: 'KPI cycles', description: 'Weekly through yearly periods with lock dates.' },
{ to: '/scoring', label: 'Rating scales & formulas', description: 'Score ranges, passing thresholds, colours, aggregation.' },
{ to: '/workflows', label: 'Approval workflow', description: 'Unlimited approval levels with SLA and override rights.' },
{ to: '/organization', label: 'Departments, teams & positions', description: 'Hierarchy and reporting lines.' },
{ to: '/roles', label: 'Roles & permissions', description: 'Module, action and data-scope permissions.' },
{ to: '/users', label: 'Users', description: 'Directory, import/export and bulk actions.' },
{ to: '/notifications', label: 'Notification templates', description: 'Per-channel delivery settings.' }];


export function SettingsPage() {
  const { branding, setBranding, theme, toggleTheme, pushToast, logAction } = useApp();
  const [tab, setTab] = useState('configuration');

  return (
    <>
      <PageHeader
        breadcrumb={['Administration', 'Settings']}
        title="Admin settings"
        description="Everything in the KPI engine is configurable here — nothing is hardcoded." />
      

      <TabBar
        tabs={[
        { id: 'configuration', label: 'Configuration' },
        { id: 'company', label: 'Company & branding' },
        { id: 'localization', label: 'Localization & theme' },
        { id: 'security', label: 'Security & sessions' }]
        }
        active={tab}
        onChange={setTab} />
      

      {tab === 'configuration' &&
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONFIG_LINKS.map((link) =>
        <Link
          key={link.to}
          to={link.to}
          className="group rounded-lg border border-line bg-surface p-4 hover:bg-surface2">
          
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-fg">{link.label}</p>
                <ChevronRightIcon size={14} className="mt-0.5 shrink-0 text-fgsubtle group-hover:text-fg" />
              </div>
              <p className="mt-1 text-xs text-fgmuted">{link.description}</p>
            </Link>
        )}
        </div>
      }

      {tab === 'company' &&
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Company profile">
            <div className="space-y-3">
              <Input
              label="Company name"
              value={branding.companyName}
              onChange={(e) => setBranding({ ...branding, companyName: e.target.value })} />
            
              <Input
              label="Product name"
              value={branding.productName}
              onChange={(e) => setBranding({ ...branding, productName: e.target.value })}
              helperText="Shown in the sidebar and on exported reports." />
            
            </div>
          </Panel>
          <Panel title="Branding" description="Logo and identity used across the app and PDF exports">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-linestrong text-fgsubtle">
                Logo
              </div>
              <div>
                <Button variant="secondary" size="small">
                  Upload logo
                </Button>
                <p className="mt-1.5 text-xs text-fgmuted">SVG or PNG, minimum 256×256.</p>
              </div>
            </div>
          </Panel>
        </div>
      }

      {tab === 'localization' &&
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Localization">
            <div className="space-y-3">
              <Select
              label="Locale"
              options={[
              { value: 'en-GB', label: 'English (United Kingdom)' },
              { value: 'en-US', label: 'English (United States)' },
              { value: 'id-ID', label: 'Bahasa Indonesia' },
              { value: 'ja-JP', label: '日本語' }]
              }
              value={branding.locale}
              onChange={(v) => setBranding({ ...branding, locale: v as string })} />
            
              <Select
              label="Timezone"
              options={[
              { value: 'Asia/Jakarta', label: 'Asia/Jakarta (GMT+7)' },
              { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
              { value: 'Europe/London', label: 'Europe/London (GMT+1)' },
              { value: 'America/New_York', label: 'America/New_York (GMT-4)' }]
              }
              value={branding.timezone}
              onChange={(v) => setBranding({ ...branding, timezone: v as string })} />
            
              <Select
              label="Date format"
              options={[
              { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }]
              }
              value={branding.dateFormat}
              onChange={(v) => setBranding({ ...branding, dateFormat: v as string })} />
            
            </div>
          </Panel>

          <Panel title="Theme & density" actions={<MonitorIcon size={15} className="text-fgsubtle" />}>
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map((mode) =>
            <button
              key={mode}
              onClick={() => {
                if (theme !== mode) toggleTheme();
              }}
              className={cn(
                'rounded border p-3 text-left',
                theme === mode ? 'border-linestrong bg-surface2' : 'border-line'
              )}>
              
                  <span className="block text-sm font-medium capitalize text-fg">{mode} mode</span>
                  <span
                className="mt-2 block h-10 rounded border border-line"
                style={{ backgroundColor: mode === 'light' ? '#f5f5f7' : '#101215' }} />
              
                </button>
            )}
            </div>
            <div className="mt-3">
              <Select
              label="Table density"
              options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' }]
              }
              value={branding.density}
              onChange={(v) => setBranding({ ...branding, density: v as 'comfortable' | 'compact' })} />
            
            </div>
            <div className="mt-4 flex justify-end border-t border-line pt-3">
              <Button
              size="small"
              onClick={() => {
                logAction('Updated workspace settings', 'Settings', 'Localization & theme');
                pushToast({ title: 'Settings saved', tone: 'success' });
              }}>
              
                Save settings
              </Button>
            </div>
          </Panel>
        </div>
      }

      {tab === 'security' &&
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Authentication" actions={<ShieldIcon size={15} className="text-fgsubtle" />}>
            <ul className="space-y-3">
              {[
            ['Two-factor authentication', 'Required for Admin, HR and Auditor roles', true],
            ['Email verification', 'New users must verify before first sign-in', true],
            ['Remember device', 'Trusted devices skip 2FA for 30 days', true],
            ['Self-registration', 'Anyone with a company domain may request access', false]].
            map(([label, hint, on]) =>
            <li key={String(label)} className="flex items-start justify-between gap-3 rounded border border-line p-3">
                  <span className="min-w-0">
                    <span className="block text-sm text-fg">{label}</span>
                    <span className="block text-xs text-fgmuted">{hint}</span>
                  </span>
                  <StatusPill status={on ? 'enabled' : 'disabled'} tone={on ? 'positive' : 'neutral'} />
                </li>
            )}
            </ul>
          </Panel>

          <Panel title="Active devices" description="Login history and session management">
            <ul className="space-y-2">
              {sessions.map((s) =>
            <li key={s.id} className="flex items-center justify-between gap-3 rounded border border-line p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">{s.device}</span>
                    <span className="block truncate font-mono text-2xs text-fgsubtle">
                      {s.browser} · {s.location} · {s.ip} · {s.lastActive}
                    </span>
                  </span>
                  {s.current ?
              <StatusPill status="this device" tone="info" /> :

              <Button
                size="small"
                variant="tertiary"
                onClick={() => pushToast({ title: 'Session revoked', description: s.device, tone: 'success' })}>
                
                      Revoke
                    </Button>
              }
                </li>
            )}
            </ul>
          </Panel>
        </div>
      }
    </>);

}