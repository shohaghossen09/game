'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(json.error ?? 'Request failed.');
        return;
      }
      if (mode === 'register') {
        setMsg('Account created. Logging you in…');
      }
      router.push('/');
      router.refresh();
    } catch {
      setMsg('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">BANGLADESH LIFE SIMULATOR</h1>
        <div className="auth-sub">
          {mode === 'login' ? 'Sign in for cloud saves' : 'Create your account'}
        </div>

        <input
          className="auth-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder={mode === 'register' ? 'Password (min 8 chars)' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required
        />

        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Sign In' : 'Register'}
        </button>

        <button
          className="auth-switch"
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }}
        >
          {mode === 'login' ? 'No account? Register' : 'Have an account? Sign in'}
        </button>

        {msg && <div className="auth-msg">{msg}</div>}
        <button className="auth-skip" type="button" onClick={() => router.push('/')}>
          Play without an account (local saves only)
        </button>
      </form>
    </main>
  );
}