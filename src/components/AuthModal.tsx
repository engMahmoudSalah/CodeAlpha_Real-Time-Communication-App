import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MeetlyBrand } from './MeetlyBrand';
import {
  Lock,
  Mail,
  User as UserIcon,
  LogIn,
  UserPlus,
  ArrowRight,
  Radio,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { firebaseSignIn, firebaseSignUp, firebaseGuestSignIn, firebaseGoogleSignIn } from '../lib/firestoreService';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const AVATAR_COLORS = [
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#d97706', // Amber
  '#db2777', // Pink
  '#7c3aed', // Purple
  '#dc2626', // Red
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, isOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      try {
        const user = await firebaseSignIn(email, password);
        localStorage.setItem('meetly_auth_token', `fb_${user.id}`);
        localStorage.setItem('meetly_current_user', JSON.stringify(user));
        localStorage.setItem('fakka_auth_token', `fb_${user.id}`);
        localStorage.setItem('fakka_current_user', JSON.stringify(user));
        onSuccess(user, `fb_${user.id}`);
        return;
      } catch (fbErr: any) {
        console.warn('Firebase auth fallback:', fbErr);
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || fbErr.message || 'Failed to sign in');
        }

        localStorage.setItem('meetly_auth_token', data.token);
        localStorage.setItem('meetly_current_user', JSON.stringify(data.user));
        localStorage.setItem('fakka_auth_token', data.token);
        localStorage.setItem('fakka_current_user', JSON.stringify(data.user));
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      try {
        const user = await firebaseSignUp(name, email, password, selectedColor);
        localStorage.setItem('meetly_auth_token', `fb_${user.id}`);
        localStorage.setItem('meetly_current_user', JSON.stringify(user));
        localStorage.setItem('fakka_auth_token', `fb_${user.id}`);
        localStorage.setItem('fakka_current_user', JSON.stringify(user));
        onSuccess(user, `fb_${user.id}`);
        return;
      } catch (fbErr: any) {
        console.warn('Firebase signup fallback:', fbErr);
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, avatarColor: selectedColor }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || fbErr.message || 'Failed to create account');
        }

        localStorage.setItem('meetly_auth_token', data.token);
        localStorage.setItem('meetly_current_user', JSON.stringify(data.user));
        localStorage.setItem('fakka_auth_token', data.token);
        localStorage.setItem('fakka_current_user', JSON.stringify(data.user));
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      try {
        const user = await firebaseGuestSignIn(name, selectedColor);
        localStorage.setItem('meetly_auth_token', `fb_guest_${user.id}`);
        localStorage.setItem('meetly_current_user', JSON.stringify(user));
        localStorage.setItem('fakka_auth_token', `fb_guest_${user.id}`);
        localStorage.setItem('fakka_current_user', JSON.stringify(user));
        onSuccess(user, `fb_guest_${user.id}`);
        return;
      } catch (fbErr) {
        console.warn('Firebase guest sign-in fallback:', fbErr);
        const res = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name || 'Guest User', avatarColor: selectedColor }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Guest login failed');
        }

        localStorage.setItem('meetly_auth_token', data.token);
        localStorage.setItem('meetly_current_user', JSON.stringify(data.user));
        localStorage.setItem('fakka_auth_token', data.token);
        localStorage.setItem('fakka_current_user', JSON.stringify(data.user));
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to continue as guest');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const user = await firebaseGoogleSignIn();
      localStorage.setItem('meetly_auth_token', `fb_${user.id}`);
      localStorage.setItem('meetly_current_user', JSON.stringify(user));
      localStorage.setItem('fakka_auth_token', `fb_${user.id}`);
      localStorage.setItem('fakka_current_user', JSON.stringify(user));
      onSuccess(user, `fb_${user.id}`);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup, silently ignore instead of showing an error.
        setError(null);
      } else {
        console.error('Google Sign-In Error:', err);
        if (err.code === 'auth/popup-blocked') {
          setError('Pop-up blocked by browser. Please allow popups or try again.');
        } else {
          setError(err.message || 'Failed to sign in with Google');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-md rounded-xl border shadow-xl p-6 sm:p-8 relative transition-colors ${
          isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Telemetry Line */}
        <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pb-3 mb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ACCESS // IDENTITY PROTOCOL</span>
          </span>
          <span>E2EE AUTH</span>
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <MeetlyBrand size="md" />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                type="button"
                id="auth-modal-close-btn"
                onClick={onClose}
                className={`p-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title="إغلاق (Close)"
                aria-label="Close Authentication Modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-mono font-medium transition-all flex items-center justify-center space-x-3 mb-4 shadow-2xs active:scale-[0.99] disabled:opacity-50 ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-200 hover:border-slate-700'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className={`px-2 ${isDark ? 'bg-[#0f1422] text-slate-500' : 'bg-white text-slate-400'}`}>
              or choose identity mode
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className={`flex p-1 rounded-xl border mb-5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            type="button"
            id="tab-signin-btn"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-signup-btn"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            id="tab-guest-btn"
            onClick={() => setMode('guest')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'guest'
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Guest
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  id="auth-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                PASSWORD
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="password"
                  id="auth-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 mt-2 shadow-xs"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                FULL_NAME
              </label>
              <div className="relative">
                <UserIcon className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  id="auth-signup-name-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sara Ahmed"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  id="auth-signup-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                PASSWORD
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="password"
                  id="auth-signup-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                AVATAR_HUE
              </label>
              <div className="flex items-center space-x-2">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor === col ? 'scale-125 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="auth-signup-submit-btn"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 mt-2 shadow-xs"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Credentials</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest Form */}
        {mode === 'guest' && (
          <form onSubmit={handleGuestJoin} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                CALLSIGN / ALIAS
              </label>
              <div className="relative">
                <UserIcon className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  id="auth-guest-name-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                AVATAR_HUE
              </label>
              <div className="flex items-center space-x-2">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor === col ? 'scale-125 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="auth-guest-submit-btn"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 mt-2 shadow-xs"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Ephemeral Guest</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
