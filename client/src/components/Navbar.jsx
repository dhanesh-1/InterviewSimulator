import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiPlusCircle, FiUser, FiLogOut, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar({ theme, setTheme }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close drawer on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const navLinks = [
    { to: '/dashboard',      icon: <FiHome size={16} />,       label: 'Dashboard' },
    { to: '/interview/setup', icon: <FiPlusCircle size={16} />, label: 'New Interview' },
    { to: '/profile',        icon: <FiUser size={16} />,       label: 'Profile' },
  ];

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="App navigation">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/dashboard" className="navbar-brand" aria-label="InterviewAI Dashboard">
            <div className="navbar-brand-icon" aria-hidden="true">🎯</div>
            InterviewAI
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links" role="list">
            {navLinks.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`navbar-link ${isActive(to)}`}
                aria-current={isActive(to) ? 'page' : undefined}
                role="listitem"
              >
                {icon} {label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="navbar-user">
            {/* Theme toggle */}
            <button
              className="btn-icon-ghost"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              type="button"
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Avatar + name */}
            <div className="navbar-avatar" aria-hidden="true" title={user?.name}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Logout (desktop) */}
            <button
              className="btn-logout"
              onClick={logout}
              aria-label="Log out"
              type="button"
            >
              <FiLogOut size={14} /> Logout
            </button>

            {/* Hamburger (mobile) */}
            <button
              className="btn-icon-ghost navbar-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              type="button"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <div
        id="mobile-drawer"
        className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-title">Menu</span>
          <button
            className="btn-icon-ghost"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-links" role="list">
          {navLinks.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-drawer-link ${isActive(to)}`}
              aria-current={isActive(to) ? 'page' : undefined}
              role="listitem"
            >
              {icon} {label}
            </Link>
          ))}
        </nav>

        <div className="mobile-drawer-footer">
          <button
            className="btn-icon-ghost mobile-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className="btn-logout"
            onClick={logout}
            aria-label="Log out"
            type="button"
          >
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
