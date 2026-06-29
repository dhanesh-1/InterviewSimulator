import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ui/ErrorAlert';
import Logo from '../components/Logo';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiBriefcase, FiCode } from 'react-icons/fi';

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
  const [step,            setStep]            = useState(1); // 1 = role pick, 2 = form
  const [role,            setRole]            = useState('');
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError,      setLocalError]      = useState('');
  const [loading,         setLoading]         = useState(false);
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const displayError = localError || error;

  const handleRoleSelect = (r) => {
    if (r === 'recruiter') {
      window.location.href = 'http://localhost:5174/signup?theme=' + (localStorage.getItem('theme') || 'dark');
    } else {
      setRole(r);
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password, 'candidate');
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const dismiss = () => { setLocalError(''); clearError(); };

  return (
    <div className="auth-page">
      <div className="animated-bg" />
      <div className="auth-card" style={{ maxWidth: step === 1 ? '520px' : '440px' }}>
        <Link to="/" className="auth-back-link" aria-label="Back to home page">
          <FiArrowLeft size={14} /> Back to Home
        </Link>

        <div className="auth-logo" aria-hidden="true">
          <Logo height={32} />
        </div>

        {/* ── Step 1: Role Selection ───────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="auth-header">
              <h1>Join HireReady</h1>
              <p>Choose how you&apos;ll be using the platform</p>
            </div>
            <div className="role-picker" role="group" aria-label="Choose your role">
              <button
                className="role-card"
                onClick={() => handleRoleSelect('candidate')}
                id="role-candidate-btn"
                type="button"
              >
                <div className="role-card-icon candidate">
                  <FiCode size={28} />
                </div>
                <div className="role-card-content">
                  <h3>I&apos;m a Candidate</h3>
                  <p>Practice AI-powered mock interviews, apply to jobs, and track your growth</p>
                </div>
                <div className="role-card-arrow">→</div>
              </button>

              <button
                className="role-card"
                onClick={() => handleRoleSelect('recruiter')}
                id="role-recruiter-btn"
                type="button"
              >
                <div className="role-card-icon recruiter">
                  <FiBriefcase size={28} />
                </div>
                <div className="role-card-content">
                  <h3>I&apos;m a Recruiter</h3>
                  <p>Post jobs, let AI screen candidates, and review scored interview transcripts</p>
                </div>
                <div className="role-card-arrow">→</div>
              </button>
            </div>
            <div className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" aria-label="Sign in to your account">Sign in</Link>
            </div>
          </>
        )}

        {/* ── Step 2: Account Details Form ────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="auth-header">
              <div className="role-badge-sm" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' }}>
                <FiCode size={13} />
                Candidate Account
              </div>
              <h1>Create Account</h1>
              <p>Ace your next interview</p>
            </div>

            <ErrorAlert message={displayError} onDismiss={dismiss} style={{ marginBottom: '1.25rem' }} />

            <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Sign up form">
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
                <label className="form-label" htmlFor="signup-email">
                  <FiMail size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
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

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    style={{ flex: '0 0 auto' }}
                  >
                    <FiArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    id="signup-submit-btn"
                    aria-busy={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
        </form>

        <div className="auth-footer">
          Changed your mind?{' '}
          <button className="btn-link" onClick={() => setStep(1)} aria-label="Go back to role selection" type="button">
            Go back
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
