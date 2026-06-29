import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

// Use recruiter-prefixed localStorage keys to avoid conflicts with candidate client
const TOKEN_KEY = 'recruiter_token';
const USER_KEY  = 'recruiter_user';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.get('/auth/me')
        .then(res => {
          // Enforce recruiter role — kick non-recruiters back to login
          if (res.data.role !== 'recruiter') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            dispatch({ type: 'AUTH_ERROR', payload: 'Access denied. This portal is for recruiters only.' });
            return;
          }
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data, token }
          });
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          dispatch({ type: 'AUTH_ERROR', payload: null });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const res = await api.post('/auth/login', { email, password });
      // Enforce recruiter-only login
      if (res.data.user?.role !== 'recruiter') {
        dispatch({ type: 'AUTH_ERROR', payload: 'Access denied. This portal is for recruiters only. Please use the candidate portal.' });
        return false;
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: msg });
      return false;
    }
  };

  const signup = async (name, email, password, company = '') => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      // Always sign up as recruiter on this portal
      const res = await api.post('/auth/signup', { name, email, password, role: 'recruiter', company });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: msg });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (data) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      signup,
      logout,
      clearError,
      updateUser,
      isRecruiter: true
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
