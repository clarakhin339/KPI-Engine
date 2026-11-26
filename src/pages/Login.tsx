import React, { useState } from 'react';
import {
  ActivityIcon,
  ArrowLeftIcon,
  KeyRoundIcon,
  MailCheckIcon,
  ShieldCheckIcon } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useApp } from '../lib/store';
import { sessions } from '../lib/mockData';
import { cn } from '../lib/utils';

type Screen = 'login' | 'twofa' | 'forgot' | 'sent' | 'reset';

export function LoginPage() {
  const { login } = useApp();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('daniel.reyes@northwind.io');
  const [password, setPassword] = useState('••••••••••');
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid work email address.');
      return;
    }
    setError('');
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setScreen('twofa');
    }, 600);
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setError('');
    setLoading(true);
    window.setTimeout(() => login(email), 500);
  };

  return (
    <div className="flex min-h-full w-full bg-canvas">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-linestrong bg-surface">
              <ActivityIcon size={16} className="text-fg" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-fg">KPI Engine</p>
              <p className="font-mono text-2xs uppercase tracking-wider text-fgsubtle">
                One Cloud Next Gen
              </p>
            </div>
          </div>

          {screen === 'login' &&
          <form onSubmit={submitCredentials} noValidate>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in</h1>
              <p className="mt-1 text-sm text-fgmuted">
                Use your corporate account. Sessions are protected by JWT and two-factor
                authentication.
              </p>

              <div className="mt-6 space-y-4">
                <Input
                label="Work email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error && !email.includes('@') ? error : undefined}
                autoComplete="email" />
              
                <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" />
              
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-fgmuted">
                    <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5" />
                  
                    Remember this device for 30 days
                  </label>
                  <button
                  type="button"
                  onClick={() => setScreen('forgot')}
                  className="text-sm text-fg underline underline-offset-2">
                  
                    Forgot?
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="mt-6 w-full">
                Continue
              </Button>

              <p className="mt-4 text-center text-xs text-fgmuted">
                No account?{' '}
                <button type="button" className="text-fg underline underline-offset-2">
                  Request access
                </button>
              </p>
            </form>
          }

          {screen === 'twofa' &&
          <form onSubmit={submitCode} noValidate>
              <button
              type="button"
              onClick={() => setScreen('login')}
              className="mb-4 flex items-center gap-1 text-sm text-fgmuted hover:text-fg">
              
                <ArrowLeftIcon size={14} /> Back
              </button>
              <ShieldCheckIcon size={22} className="mb-3 text-fg" />
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Two-factor code</h1>
              <p className="mt-1 text-sm text-fgmuted">
                Enter the 6-digit code generated for <span className="font-mono">{email}</span>.
              </p>
              <div className="mt-6">
                <Input
                label="Authentication code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                error={error || undefined}
                helperText="Codes rotate every 30 seconds." />
              
              </div>
              <Button type="submit" loading={loading} className="mt-6 w-full">
                Verify & sign in
              </Button>
              <button
              type="button"
              onClick={() => login(email)}
              className="mt-3 w-full text-center text-xs text-fgmuted underline underline-offset-2 hover:text-fg">
              
                Use a recovery code instead
              </button>
            </form>
          }

          {screen === 'forgot' &&
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setScreen('sent');
            }}>
            
              <button
              type="button"
              onClick={() => setScreen('login')}
              className="mb-4 flex items-center gap-1 text-sm text-fgmuted hover:text-fg">
              
                <ArrowLeftIcon size={14} /> Back to sign in
              </button>
              <KeyRoundIcon size={22} className="mb-3 text-fg" />
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Reset password</h1>
              <p className="mt-1 text-sm text-fgmuted">
                We will email a signed, single-use reset link valid for 30 minutes.
              </p>
              <div className="mt-6">
                <Input
                label="Work email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} />
              
              </div>
              <Button type="submit" className="mt-6 w-full">
                Send reset link
              </Button>
            </form>
          }

          {screen === 'sent' &&
          <div>
              <MailCheckIcon size={22} className="mb-3 text-positive" />
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Check your inbox</h1>
              <p className="mt-1 text-sm text-fgmuted">
                If an account exists for <span className="font-mono">{email}</span>, a reset link is
                on its way. Verification also confirms your email address.
              </p>
              <Button variant="secondary" className="mt-6 w-full" onClick={() => setScreen('login')}>
                Back to sign in
              </Button>
            </div>
          }
        </div>
      </div>

      {/* <aside className="hidden flex-1 border-l border-line bg-surface p-10 lg:block">
        <div className="mx-auto max-w-lg">
          <p className="mono-label">Session security</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg">
            Every sign-in is recorded
          </h2>
          <p className="mt-1 text-sm text-fgmuted">
            Login history and active devices are part of the audit trail. Administrators can revoke
            any session instantly.
          </p>

          <div className="mt-6 space-y-2">
            {sessions.map((s) =>
            <div
              key={s.id}
              className={cn(
                'flex items-center justify-between rounded border p-3',
                s.current ? 'border-linestrong bg-surface2' : 'border-dashed border-line'
              )}>
              
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{s.device}</p>
                  <p className="truncate font-mono text-2xs text-fgsubtle">
                    {s.browser} · {s.location} · {s.ip}
                  </p>
                </div>
                <span className="ml-3 shrink-0 font-mono text-2xs uppercase tracking-wider text-fgmuted">
                  {s.lastActive}
                </span>
              </div>
            )}
          </div>

          <div className="mt-8 rounded border border-dashed border-linestrong p-4">
            <p className="mono-label">Demo access</p>
            <p className="mt-1 text-sm text-fgmuted">
              Continue with any email to enter the workspace. You can switch between roles from the
              account menu once inside.
            </p>
          </div>
        </div>
      </aside> */}
    </div>);

}