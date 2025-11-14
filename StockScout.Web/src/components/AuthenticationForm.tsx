import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../AuthenticationContext';
import { Button, Input, Spinner } from '@fluentui/react-components';

export const AuthenticationForm: React.FC = () => {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          Signed in as <strong>{user.email}</strong>
        </div>
        <Button appearance="secondary" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 340 }}
    >
      <h3 style={{ margin: 0 }}>{mode === 'login' ? 'Login' : 'Sign Up'}</h3>
      <Input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(_, v) => setEmail(v.value)}
      />
      <Input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        value={password}
        onChange={(_, v) => setPassword(v.value)}
      />
      {error && <div style={{ color: '#d13438', fontSize: '0.85rem' }}>{error}</div>}
      <Button appearance="primary" type="submit" disabled={loading}>
        {loading ? <Spinner size="tiny" /> : mode === 'login' ? 'Login' : 'Create Account'}
      </Button>
      <Button
        type="button"
        appearance="transparent"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
        }}
      >
        {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
      </Button>
    </form>
  );
};
