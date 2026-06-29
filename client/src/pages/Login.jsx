import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ui/ErrorAlert';
import Logo from '../components/Logo';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      // Read the stored user to determine role-based redirect
      const stored = localStorage.getItem('user');
      const userData = stored ? JSON.parse(stored) : null;
      navigate(userData?.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="animated-bg" />
      <div className="auth-card">
        {/* Back to home */}
        <Link to="/" className="auth-back-link" aria-label="Back to home page">
          <FiArrowLeft size={14} /> Back to Home
        </Link>

        <div className="auth-logo" aria-hidden="true">
          <Logo height={32} />
        </div>
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue your interview preparation</p>
        </div>

        <ErrorAlert
          message={error}
          onDismiss={clearError}
          style={{ marginBottom: '1.25rem' }}
        />

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Login form"
        >
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <FiMail size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              autoComplete="email"
              aria-required="true"
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <FiLock size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              minLength={6}
              autoComplete="current-password"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email || !password}
            id="login-submit-btn"
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" aria-label="Create a new account">Create one</Link>
        </div>
      </div>
    </div>
  );
}
