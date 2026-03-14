'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import styles from '../../auth/auth.module.css';

interface Invitation {
  id: string;
  email: string;
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export default function InviteAcceptancePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'register' | 'login' | 'success'>('loading');
  
  const [registerForm, setRegisterForm] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const [loginForm, setLoginForm] = useState({
    password: '',
  });

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      // Use fetch directly since this is a public endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/workspaces/invitations/public/${token}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setInvitation(data.data);
        
        // Check if user is already logged in
        const existingToken = localStorage.getItem('accessToken');
        if (existingToken) {
          // User is logged in, check if they can accept
          try {
            await api.post(`/workspaces/invitations/${token}/accept`);
            setStep('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } catch (err: any) {
            setError(err.message || 'Failed to accept invitation');
            setStep('register');
          }
        } else {
          // Check if user exists (we'll try to login first, if fails show register)
          setStep('register');
        }
      } else {
        setError(data.error || 'Invalid invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/workspaces/invitations/public/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: registerForm.password,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Set tokens and user
        api.setAccessToken(data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Set workspace ID
        if (invitation?.workspace?.id) {
          api.setWorkspaceId(invitation.workspace.id);
        }
        
        setStep('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await api.post<{
        user: any;
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }>('/auth/login', {
        email: invitation?.email || '',
        password: loginForm.password,
      });

      if (loginResponse.success && loginResponse.data) {
        api.setAccessToken(loginResponse.data.tokens.accessToken);
        localStorage.setItem('refreshToken', loginResponse.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

        // Now accept the invitation
        const acceptResponse = await api.post(`/workspaces/invitations/${token}/accept`);
        if (acceptResponse.success) {
          if (invitation?.workspace?.id) {
            api.setWorkspaceId(invitation.workspace.id);
          }
          setStep('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setError(acceptResponse.error || 'Failed to accept invitation');
        }
      } else {
        setError(loginResponse.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
            <p>Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.logo}>WhizSuite</h1>
            <p className={styles.subtitle}>Invitation Error</p>
          </div>
          <div className={styles.error} style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
          <div className={styles.footer}>
            <p>
              <a href="/auth/login" className={styles.link}>Go to Login</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.logo}>WhizSuite</h1>
            <p className={styles.subtitle}>Welcome to the team!</p>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>✅</div>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              You've been successfully added to <strong>{invitation?.workspace.name}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>WhizSuite</h1>
          <p className={styles.subtitle}>You've been invited!</p>
        </div>

        {invitation && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
            <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              Join {invitation.workspace.name}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              You've been invited as <strong>{invitation.role.name}</strong>
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              Email: {invitation.email}
            </p>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => setStep('register')}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              background: step === 'register' ? 'var(--primary-500)' : 'var(--bg-elevated)',
              color: step === 'register' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setStep('login')}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              background: step === 'login' ? 'var(--primary-500)' : 'var(--bg-elevated)',
              color: step === 'login' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Login
          </button>
        </div>

        {step === 'register' && (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                placeholder="John"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account & Join'}
            </button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login & Accept'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}




