import { useState } from 'react';
import * as api from '../api.js';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || (isRegister && !form.name)) {
      setError('Please fill in every field.');
      return;
    }
    if (isRegister && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const data = isRegister ? await api.register(payload) : await api.login(payload);

      api.saveToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-panel__brand">
          <span className="auth-panel__mark">✦</span>
          <h1>Waypoint</h1>
          <p>Plan the trip, track the spend, remember the stops.</p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form__heading">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-form__sub">
            {isRegister ? 'Start your travel journal.' : 'Log in to pick up where you left off.'}
          </p>

          {isRegister && (
            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="auth-form__switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={switchMode}>
              {isRegister ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
