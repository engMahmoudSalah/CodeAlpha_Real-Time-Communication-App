import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MeetlyBrand } from './MeetlyBrand';
import {
  Radio,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  Sparkles,
  Cpu,
  BookOpen,
  Target,
  ArrowRight,
  LogOut,
  AppWindow,
  LayoutDashboard,
  Video,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

interface NavigationHeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeRoomId: string | null;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onLogout,
  activeRoomId,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isDark = theme === 'dark';
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    ...(currentUser ? [{ id: 'app', label: activeRoomId ? 'Active Call' : 'Workspace', icon: LayoutDashboard }] : []),
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'tech-routes', label: 'Architecture', icon: Cpu },
    { id: 'guide', label: 'User Guide', icon: BookOpen },
    { id: 'target', label: 'Mission', icon: Target },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  // Listen to window scroll to toggle navbar background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        id="global-platform-header"
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? isDark
              ? 'bg-[#0a0e17]/95 border-b border-slate-800/90 text-slate-100 backdrop-blur-md shadow-xs'
              : 'bg-white/95 border-b border-slate-200/90 text-slate-900 backdrop-blur-md shadow-xs'
            : isDark
              ? 'bg-[#0a0e17] border-b border-slate-800/20 text-slate-100'
              : 'bg-[#fafafc] border-b border-slate-200/20 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Architecture Version */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => handleTabClick('home')}
              className="group flex items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg text-left"
              aria-label="Meetly Home"
            >
              <MeetlyBrand size="md" />
            </button>

            {/* Live Active Call Indicator */}
            {activeRoomId && (
              <button
                onClick={() => handleTabClick('app')}
                className={`hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-all ${
                  isDark
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Return to your active meeting"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Room: {activeRoomId}</span>
              </button>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {menuItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-900 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Call Pill on Mobile */}
            {activeRoomId && (
              <button
                onClick={() => handleTabClick('app')}
                className="inline-flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold bg-emerald-600 text-white"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Desktop Auth State / Room Actions */}
            <div className="hidden sm:flex items-center gap-2">
              {currentUser ? (
                <>
                  {/* Profile Capsule */}
                  <div
                    className={`h-9 flex items-center gap-2 px-2.5 rounded-lg border text-xs font-mono transition-colors ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`max-w-[140px] truncate font-semibold text-xs transition-colors ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {currentUser.name}
                    </span>
                    <button
                      onClick={onLogout}
                      className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                      title="Logout"
                      aria-label="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenAuth}
                    className={`h-9 px-4 rounded-lg border text-xs font-mono font-medium transition-colors ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onOpenAuth}
                    className={`h-9 inline-flex items-center gap-1.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                      isDark
                        ? 'bg-white hover:bg-slate-100 text-slate-950'
                        : 'bg-black hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Instant Meeting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
              aria-label={mobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className={`fixed inset-x-0 top-[3.75rem] sm:top-16 z-50 max-h-[calc(100vh-3.75rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto border-b px-4 py-5 space-y-4 shadow-2xl lg:hidden transition-all animate-in slide-in-from-top-3 duration-200 ${
            isDark
              ? 'bg-slate-950/95 border-slate-800/90 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          {/* Active Call Quick Bar on Mobile Drawer */}
          {activeRoomId && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <p className="text-xs font-bold leading-none">Meeting In Progress</p>
                  <p className="text-[11px] font-mono opacity-80 mt-0.5">{activeRoomId}</p>
                </div>
              </div>
              <button
                onClick={() => handleTabClick('app')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                Return
              </button>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="flex flex-col space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Navigation
            </p>
            {menuItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 font-semibold'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              );
            })}
          </div>

          <hr className={isDark ? 'border-slate-800/80' : 'border-slate-200'} />

          {/* User Profile & Actions Section */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Workspace & Account
            </p>

            {currentUser ? (
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white font-bold shadow-xs"
                    style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {currentUser.name}
                      </p>
                      {currentUser.isGuest && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                          Guest
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate text-slate-500 dark:text-slate-400">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className={`py-3 px-3 rounded-xl border text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-red-400 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-red-600 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className={`py-3 px-3 rounded-xl border text-xs font-mono font-medium transition-colors text-center ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="py-3 px-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-mono font-bold uppercase tracking-wider rounded-xl text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <span>Start Meeting</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

