import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Login    = lazy(() => import('./pages/Login'));
const Signup   = lazy(() => import('./pages/Signup'));
const Profile  = lazy(() => import('./pages/Profile'));

// ── Recruiter pages ───────────────────────────────────────────────────────────
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'));
const PostJob            = lazy(() => import('./pages/recruiter/PostJob'));
const MyListings         = lazy(() => import('./pages/recruiter/MyListings'));
const ApplicantList      = lazy(() => import('./pages/recruiter/ApplicantList'));
const ApplicantDetail    = lazy(() => import('./pages/recruiter/ApplicantDetail'));

function PageLoader() {
  return <LoadingSpinner size="lg" label="Loading..." center />;
}

// ── Theme initialiser ─────────────────────────────────────────────────────────
function useThemeInit() {
  const [theme, setTheme] = useState(() => {
    // Sync theme from query parameter if transitioning from candidate portal
    const params = new URLSearchParams(window.location.search);
    const paramTheme = params.get('theme');
    if (paramTheme === 'light' || paramTheme === 'dark') {
      localStorage.setItem('theme', paramTheme);
      return paramTheme;
    }
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

// ── Inner layout ──────────────────────────────────────────────────────────────
function AppLayout({ theme, setTheme }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="xl" label="Loading HireReady..." center />;
  }

  const withNav = (element) => (
    <ProtectedRoute>
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
            <Route path="/"       element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

            {/* ── Protected recruiter routes ── */}
            <Route path="/dashboard"                          element={withNav(<RecruiterDashboard />)} />
            <Route path="/post-job"                           element={withNav(<PostJob />)} />
            <Route path="/listings"                           element={withNav(<MyListings />)} />
            <Route path="/listings/:jobId/applicants"         element={withNav(<ApplicantList />)} />
            <Route path="/applicants/:applicationId"          element={withNav(<ApplicantDetail />)} />
            <Route path="/profile"                            element={withNav(<Profile />)} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
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
