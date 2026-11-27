import { useState, type ChangeEvent } from 'react';
import { MonitorIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useApp } from '../../lib/store';
import { cn } from '../../lib/utils';

export function SettingsTab() {
  const { branding, setBranding, theme, toggleTheme, pushToast, logAction, resetData } = useApp();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel
        title="Company profile"
        description="Names shown in the app header and on exported reports.">
        
        <div className="space-y-3">
          <Input
            label="Company name"
            value={branding.companyName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBranding({ ...branding, companyName: e.target.value })} />
          
          <Input
            label="Product name"
            value={branding.productName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBranding({ ...branding, productName: e.target.value })}
            helperText="Shown in the sidebar and on exported reports." />
          
        </div>
      </Panel>

      <Panel title="Localization">
        <div className="space-y-3">
          <Select
            label="Locale"
            options={[
            { value: 'en-GB', label: 'English (United Kingdom)' },
            { value: 'en-US', label: 'English (United States)' },
            { value: 'my-MM', label: 'မြန်မာ' },
            { value: 'th-TH', label: 'ไทย' },
            { value: 'ja-JP', label: '日本語' }]
            }
            value={branding.locale}
            onChange={(v: string) => setBranding({ ...branding, locale: v })} />
          
          <Select
            label="Timezone"
            options={[
            { value: 'Asia/Yangon', label: 'Asia/Yangon (GMT+6:30)' },
            { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
            { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
            { value: 'Europe/London', label: 'Europe/London (GMT+1)' }]
            }
            value={branding.timezone}
            onChange={(v: string) => setBranding({ ...branding, timezone: v })} />
          
          <Select
            label="Date format"
            options={[
            { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }]
            }
            value={branding.dateFormat}
            onChange={(v: string) => setBranding({ ...branding, dateFormat: v })} />
          
        </div>
      </Panel>

      <Panel title="Theme" actions={<MonitorIcon size={15} className="text-fgsubtle" />}>
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
      </Panel>

      <Panel title="About this workspace" dashed>
        <p className="text-sm text-fgmuted">
          This prototype keeps data in this browser using localStorage, so changes survive refreshes
          on this device. Data is not shared with other browsers or users. When the NestJS backend
          is connected, sign-in, permissions and audit records will be enforced by the server instead.
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button size="small" variant="secondary" onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
          <Button
            size="small"
            onClick={() => {
              logAction('Updated workspace settings', 'Settings', 'Company profile & localization');
              pushToast({ title: 'Settings saved', tone: 'success' });
            }}>
            
            Save settings
          </Button>
        </div>
      </Panel>

      <Dialog isOpen={resetOpen} onClose={() => setResetOpen(false)} size="sm">
        <DialogHeader>
          <h2 className="text-base font-semibold text-fg">Reset demo data?</h2>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-fgmuted">
            All changes saved in this browser will be removed and the original employees, roles,
            cycles, evaluations and settings will be restored. This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetData();
              setResetOpen(false);
              pushToast({ title: 'Demo data reset', tone: 'success' });
            }}>
            Reset all data
          </Button>
        </DialogFooter>
      </Dialog>
    </div>);

}
