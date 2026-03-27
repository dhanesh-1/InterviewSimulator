import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiPlusCircle, FiClock, FiUser, FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">🎯</div>
          InterviewAI
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
            <FiHome size={16} /> Dashboard
          </Link>
          <Link to="/interview/setup" className={`navbar-link ${isActive('/interview/setup')}`}>
            <FiPlusCircle size={16} /> New Interview
          </Link>
          <Link to="/profile" className={`navbar-link ${isActive('/profile')}`}>
            <FiUser size={16} /> Profile
          </Link>
        </div>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <button className="btn-logout" onClick={logout}>
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
