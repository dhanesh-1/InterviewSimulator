import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));
const SessionReview = lazy(() => import('./pages/SessionReview'));
const Profile = lazy(() => import('./pages/Profile'));
const ResumeATS = lazy(() => import('./pages/ResumeATS'));

// ── Candidate: Job Board pages ────────────────────────────────────────────────
const JobBoard = lazy(() => import('./pages/jobs/JobBoard'));
const JobDetail = lazy(() => import('./pages/jobs/JobDetail'));
const MyApplications = lazy(() => import('./pages/jobs/MyApplications'));



// ── Page-level suspense fallback ──────────────────────────────────────────────
function PageLoader() {
  return <LoadingSpinner size="lg" label="Loading..." center />;
}

// ── Theme initialiser — runs before first render ──────────────────────────────
function useThemeInit() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

// ── Inner layout (needs AuthContext) ─────────────────────────────────────────
function AppLayout({ theme, setTheme }) {
  const { user, loading, isRecruiter } = useAuth();

  if (loading) {
    return <LoadingSpinner size="xl" label="Loading HireReady..." center />;
  }

  const defaultDash = '/dashboard';

  // Helper: wraps route with Navbar (any logged-in user)
  const withNav = (element) => (
    <ProtectedRoute>
      <Navbar theme={theme} setTheme={setTheme} />
      {element}
    </ProtectedRoute>
  );

  // Helper: candidate-only routes
  const candidateOnly = (element) => (
    <ProtectedRoute requiredRole="candidate">
      <Navbar theme={theme} setTheme={setTheme} />
      {element}
    </ProtectedRoute>
  );


  return (
    <>
      <div className="animated-bg" />
      <div className="app-container">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={user ? <Navigate to={defaultDash} replace /> : <Home theme={theme} setTheme={setTheme} />} />
            <Route path="/login" element={user ? <Navigate to={defaultDash} replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to={defaultDash} replace /> : <Signup />} />

            {/* ── Shared protected ── */}
            <Route path="/profile" element={withNav(<Profile />)} />

            {/* ── Candidate-only routes ── */}
            <Route path="/dashboard" element={candidateOnly(<Dashboard />)} />
            <Route path="/interview/setup" element={candidateOnly(<InterviewSetup />)} />
            <Route path="/interview/:sessionId" element={candidateOnly(<InterviewSession />)} />
            <Route path="/session/:sessionId" element={candidateOnly(<SessionReview />)} />
            <Route path="/jobs" element={candidateOnly(<JobBoard />)} />
            <Route path="/jobs/:jobId" element={candidateOnly(<JobDetail />)} />
            <Route path="/my-applications" element={candidateOnly(<MyApplications />)} />
            <Route path="/ats-checker" element={candidateOnly(<ResumeATS />)} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to={user ? defaultDash : '/'} replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useThemeInit();

  return (
    <Router>
      <AuthProvider>
        <AppLayout theme={theme} setTheme={setTheme} />
      </AuthProvider>
    </Router>
  );
}
