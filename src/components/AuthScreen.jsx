import { useState } from 'react';
import { addAccount, getAccounts } from '../lib/storage.js';
import { passwordChecks, validatePassword } from '../lib/password.js';

export default function AuthScreen({ onSignIn }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setError('');
  }
  function submit(event) {
    event.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const accounts = getAccounts();
    if (mode === 'signup') {
      if (!name.trim()) return setError('Enter your name.');
      const passwordError = validatePassword(password, cleanEmail);
      if (passwordError) return setError(passwordError);
      if (password !== confirmPassword) return setError('Passwords do not match.');
      if (accounts.some((account) => account.email === cleanEmail)) {
        return setError('That email already has a demo profile. Choose Log In.');
      }
      // Demo only: never persist the password, only a nonsecure display profile.
      const account = { name: name.trim(), email: cleanEmail };
      addAccount(account);
      onSignIn(account);
    } else {
      const account = accounts.find((item) => item.email === cleanEmail);
      if (!account) return setError('No demo profile found. Choose Sign Up first.');
      // This demo deliberately does NOT check passwords when logging in.
      onSignIn(account);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">▣ StudyPlanner</div>
        <h1 id="auth-title">{mode === 'login' ? 'Log In' : 'Create Account'}</h1>
        <p className="muted">Plan your courses. Keep track of your deadlines.</p>
        <form onSubmit={submit} className="stack-form">
          {mode === 'signup' && (
            <label>Full name
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" required placeholder="Jamie Doe" />
            </label>
          )}
          <label>Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <label>Password <span className="muted small">(demo only; don't use a real password)</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required
              placeholder={mode === 'signup' ? '10+ characters' : 'Demo password'} />
          </label>
          {mode === 'signup' && (
            <>
              <div className="password-requirements" aria-label="Password requirements">
                {passwordChecks(password, email).map((check) => (
                  <div key={check.label} className={check.passed ? 'check-pass' : 'check-pending'}>
                    <span aria-hidden="true">{check.passed ? '✓' : '○'}</span> {check.label}
                  </div>
                ))}
              </div>
              <label>Confirm password
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password"
                  autoComplete="new-password" required placeholder="Enter the same demo password" />
              </label>
            </>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button type="submit" className="primary full">{mode === 'login' ? 'Log In' : 'Sign Up'}</button>
        </form>
        <p className="switch-auth">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="text-button" type="button" onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
        <p className="demo-notice"><strong>Classroom demo only.</strong> Signing up checks the 10-character minimum, but passwords are not stored or verified when logging in. Anyone with access to this browser can view its demo profiles and data. Use a fictional account and throwaway password. Real authentication requires a service such as Amazon Cognito.</p>
      </section>
    </main>
  );
}
