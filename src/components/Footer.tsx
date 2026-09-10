import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MeetlyBrand } from './MeetlyBrand';
import { User } from '../types';
import {
  Shield,
  Zap,
  ArrowUp,
  Cpu,
  Sparkles,
  BookOpen,
  Target,
  Home,
  Lock,
  Radio,
  ArrowRight,
  Github,
  CheckCircle2,
} from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  setCurrentTab,
  currentUser,
  onOpenAuth,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'features', label: 'Platform Features', icon: Sparkles },
    { id: 'tech-routes', label: 'Mesh Architecture', icon: Cpu },
    { id: 'guide', label: 'Deployment Guide', icon: BookOpen },
    { id: 'target', label: 'Mission & Targets', icon: Target },
  ];

  return (
    <footer
      className={`w-full border-t transition-colors duration-200 text-xs ${
        isDark
          ? 'bg-[#0a0e17] border-slate-800/80 text-slate-400'
          : 'bg-[#fafafc] border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-3 md:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2">
              <MeetlyBrand size="md" showSubtitle={true} />
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Decentralized peer-to-peer WebRTC video mesh platform. Direct browser-to-browser encryption with zero central media relays or tracking.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mesh Signaling Online</span>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              Navigation
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.id}>
                    <button
                      onClick={() => {
                        setCurrentTab(link.id);
                        scrollToTop();
                      }}
                      className="group flex items-center gap-2 hover:text-indigo-500 transition-colors text-left py-0.5"
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-500/80 group-hover:scale-110 transition-transform" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Security & Architecture */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              Security Specs
            </h4>
            <ul className="space-y-2.5 font-mono text-[11px] opacity-85">
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>DTLS-SRTP 256-bit AES</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ephemeral SCTP Channels</span>
              </li>
              <li className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>STUN/TURN NAT Traversal</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero SFU Data Harvesting</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Meeting Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <h4
                className={`text-xs font-bold font-mono uppercase tracking-wider ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                Instant Session
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              Launch a zero-setup room or join with a 6-digit mesh passphrase immediately.
            </p>
            {currentUser ? (
              <button
                onClick={() => {
                  setCurrentTab('app');
                  scrollToTop();
                }}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  scrollToTop();
                }}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>Start Secure Meeting</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] opacity-75">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Meetly Peer Mesh Engine</span>
            <span>&bull;</span>
            <span>Version 2.4.0</span>
            <span>&bull;</span>
            <span className="text-emerald-500 font-bold">End-To-End Encrypted</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollToTop}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
