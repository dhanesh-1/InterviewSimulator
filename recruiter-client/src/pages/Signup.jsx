import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ui/ErrorAlert';
import Logo from '../components/Logo';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiBriefcase } from 'react-icons/fi';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f43f5e', '#f59e0b', '#3b82f6', '#10b981'];
  return { score, label: labels[score], color: colors[score] };
}

export default function Signup() {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [company,         setCompany]         = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError,      setLocalError]      = useState('');
  const [loading,         setLoading]         = useState(false);
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const displayError = localError || error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!company.trim()) {
      setLocalError('Company name is required.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password, company);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  const dismiss = () => { setLocalError(''); clearError(); };

  return (
    <div className="auth-page">
      <div className="animated-bg" />
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <a href="http://localhost:5173/" className="auth-back-link" aria-label="Back to home page">
          <FiArrowLeft size={14} /> Back to Home
        </a>

        <div className="auth-logo" aria-hidden="true">
          <Logo height={32} />
        </div>

        <div className="auth-header">
          <div className="role-badge-sm" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)' }}>
            <FiBriefcase size={13} />
            Recruiter Account
          </div>
          <h1>Create Account</h1>
          <p>Set up your recruiter profile to start hiring</p>
        </div>

        <ErrorAlert message={displayError} onDismiss={dismiss} style={{ marginBottom: '1.25rem' }} />

        <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Recruiter sign up form">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              <FiUser size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              className="form-input"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); dismiss(); }}
              required
              minLength={2}
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-company">
              <FiBriefcase size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Company Name
            </label>
            <input
              id="signup-company"
              type="text"
              className="form-input"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => { setCompany(e.target.value); dismiss(); }}
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              <FiMail size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Work Email
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); dismiss(); }}
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              <FiLock size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); dismiss(); }}
              required
              minLength={6}
              autoComplete="new-password"
              aria-required="true"
              aria-describedby="password-strength"
            />
            {password && (
              <div id="password-strength" className="password-strength" aria-live="polite">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="strength-bar"
                      style={{
                        background: n <= strength.score ? strength.color : undefined,
                        opacity: n <= strength.score ? 1 : 0.2,
                      }}
                    />
                  ))}
                </div>
                <span style={{ color: strength.color, fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">
              <FiLock size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); }}
              required
              minLength={6}
              autoComplete="new-password"
              aria-required="true"
            />
            {confirmPassword && password && (
              <div className="password-match" aria-live="polite">
                {confirmPassword === password
                  ? <><FiCheckCircle size={13} color="#10b981" /> <span style={{ color: '#10b981', fontSize: 'var(--font-xs)' }}>Passwords match</span></>
                  : <span style={{ color: '#f43f5e', fontSize: 'var(--font-xs)' }}>Passwords don&apos;t match</span>
                }
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="signup-submit-btn"
            aria-busy={loading}
          >
            {loading ? 'Creating account...' : 'Create Recruiter Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" aria-label="Sign in to your account">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
