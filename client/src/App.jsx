import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));
const SessionReview  = lazy(() => import('./pages/SessionReview'));
const Profile        = lazy(() => import('./pages/Profile'));

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
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="xl" label="Loading InterviewAI..." center />;
  }

  return (
    <>
      <div className="animated-bg" />
      <div className="app-container">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" replace /> : <Home />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
            />

            {/* Protected routes with Navbar */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navbar theme={theme} setTheme={setTheme} />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/interview/setup" element={
              <ProtectedRoute>
                <Navbar theme={theme} setTheme={setTheme} />
                <InterviewSetup />
              </ProtectedRoute>
            } />
            <Route path="/interview/:sessionId" element={
              <ProtectedRoute>
                <Navbar theme={theme} setTheme={setTheme} />
                <InterviewSession />
              </ProtectedRoute>
            } />
            <Route path="/session/:sessionId" element={
              <ProtectedRoute>
                <Navbar theme={theme} setTheme={setTheme} />
                <SessionReview />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Navbar theme={theme} setTheme={setTheme} />
                <Profile />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
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
