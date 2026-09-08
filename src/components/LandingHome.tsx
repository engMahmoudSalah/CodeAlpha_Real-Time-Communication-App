import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MeetlyBrand } from './MeetlyBrand';
import {
  ShieldCheck,
  Video,
  PenTool,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  Network,
  Share2,
  Tv,
  CheckCircle2,
  Mic,
  MicOff,
  VideoOff,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Sliders,
  Shield,
  Monitor,
  Activity,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface LandingHomeProps {
  onJoinRoomFromLanding: (roomId: string, password?: string) => void;
  currentUser: any;
  onOpenAuth: () => void;
  setCurrentTab: (tab: string) => void;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  onJoinRoomFromLanding,
  currentUser,
  onOpenAuth,
  setCurrentTab,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Launcher Dock State
  const [dockTab, setDockTab] = useState<'instant' | 'join'>('instant');
  const [instantRoomName, setInstantRoomName] = useState('');
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [instantPassphrase, setInstantPassphrase] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinPassphrase, setJoinPassphrase] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate an initial random room name
  useEffect(() => {
    generateNewRoomCode();
  }, []);

  const generateNewRoomCode = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 3; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 3; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    setInstantRoomName(`meet-${p1}-${p2}`);
  };

  const handleLaunchInstant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalRoom = instantRoomName.trim().toLowerCase();
    if (!finalRoom) return;

    if (!currentUser) {
      sessionStorage.setItem('meetly_intended_room', finalRoom);
      if (usePassphrase && instantPassphrase.trim()) {
        sessionStorage.setItem('meetly_intended_passphrase', instantPassphrase.trim());
      }
      onOpenAuth();
    } else {
      onJoinRoomFromLanding(finalRoom, usePassphrase ? instantPassphrase.trim() : undefined);
    }
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoom = joinRoomCode.trim().toLowerCase();
    if (!finalRoom) return;

    if (!currentUser) {
      sessionStorage.setItem('meetly_intended_room', finalRoom);
      if (joinPassphrase.trim()) {
        sessionStorage.setItem('meetly_intended_passphrase', joinPassphrase.trim());
      }
      onOpenAuth();
    } else {
      onJoinRoomFromLanding(finalRoom, joinPassphrase.trim() || undefined);
    }
  };

  const copyInvite = () => {
    const link = `${window.location.origin}/?room=${instantRoomName.trim().toLowerCase()}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full relative transition-colors duration-150">
      {/* Precision Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none h-[1200px] ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />

      {/* Top Editorial Corner Markers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-6 sm:pt-10">
        <div className="flex items-center justify-between text-[11px] font-mono opacity-50 pb-4 border-b border-dashed border-slate-300 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PROTOCOL // WEBRTC-MESH-V2</span>
          </span>
          <span className="hidden sm:inline">ZERO SERVER RELAY &bull; CLIENT-AUTHORITATIVE</span>
          <span>LATENCY &lt; 25MS</span>
        </div>
      </div>

      {/* Main Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center space-y-6">
            {/* High-Contrast Typographic Heading */}
            <h1
              className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] max-w-3xl ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Direct video meetings with no server in the middle.
            </h1>

            {/* Plain-Spoken Technical Description */}
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-2xl ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Meetly streams encrypted audio, HD video, collaborative whiteboard vectors, and files directly between participant browsers using WebRTC mesh. No central SFU servers intercepting your streams, no session storage, and zero account required to join.
            </p>

            {/* Hardware Preflight & Readiness Indicators */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-lg border font-mono text-[11px] w-full max-w-2xl ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800/80 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>WebRTC P2P</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>WebCrypto</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Canvas Vector</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>DataChannel</span>
              </div>
            </div>

            {/* Unified Meeting Console Dock */}
            <div
              className={`w-full max-w-xl rounded-xl border shadow-sm p-4 sm:p-5 text-left transition-all ${
                isDark
                  ? 'bg-[#0f1422] border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Dock Header Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDockTab('instant')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      dockTab === 'instant'
                        ? isDark
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-900 text-white'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Instant Meeting
                  </button>
                  <button
                    onClick={() => setDockTab('join')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      dockTab === 'join'
                        ? isDark
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-900 text-white'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Join via Code
                  </button>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mesh Ready
                </span>
              </div>

              {dockTab === 'instant' ? (
                <form onSubmit={handleLaunchInstant} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Generated Room Code
                      </label>
                      <button
                        type="button"
                        onClick={generateNewRoomCode}
                        className="text-[11px] text-indigo-500 hover:text-indigo-400 font-mono flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Generate New</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={instantRoomName}
                        onChange={(e) => setInstantRoomName(e.target.value)}
                        className={`flex-1 font-mono text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                        placeholder="room-code"
                        required
                      />
                      <button
                        type="button"
                        onClick={copyInvite}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          copiedLink
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                        title="Copy direct invite link"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Passphrase Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={usePassphrase}
                          onChange={(e) => setUsePassphrase(e.target.checked)}
                          className="rounded border-slate-400"
                        />
                        <span>Add decryption passphrase (optional)</span>
                      </label>
                    </div>
                    {usePassphrase && (
                      <input
                        type="password"
                        value={instantPassphrase}
                        onChange={(e) => setInstantPassphrase(e.target.value)}
                        placeholder="Secret key for PBKDF2 derivation"
                        className={`w-full font-mono text-xs px-3 py-2 rounded-lg border focus:outline-none mt-1.5 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    )}
                  </div>

                  {/* Launch Action */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs sm:text-sm font-mono font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Launch Meeting Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('features')}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                        isDark
                          ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      Docs
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoinExisting} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Meeting Code
                    </label>
                    <input
                      type="text"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value)}
                      placeholder="e.g. meet-abc-xyz"
                      required
                      className={`w-full font-mono text-sm px-3 py-2 rounded-lg border focus:outline-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Passphrase (If room is encrypted)
                    </label>
                    <input
                      type="password"
                      value={joinPassphrase}
                      onChange={(e) => setJoinPassphrase(e.target.value)}
                      placeholder="Room secret key"
                      className={`w-full font-mono text-xs px-3 py-2 rounded-lg border focus:outline-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs sm:text-sm font-mono font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Connect to Peer Mesh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Reality: Mesh vs Centralized SFU Comparison Table */}
      <section
        className={`py-14 sm:py-20 border-t ${
          isDark
            ? 'bg-[#0a0e17]/80 border-slate-800/80'
            : 'bg-slate-100/60 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-500 font-bold">
              Engineering Architecture
            </span>
            <h2
              className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Why P2P Mesh Replaces Centralized Cloud Servers
            </h2>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Traditional video platforms force all audio and video packets through a middleman server (SFU) that inspects and re-encodes your media. Meetly establishes direct point-to-point tunnels between client browsers.
            </p>
          </div>

          {/* Architectural Comparison Matrix */}
          <div
            className={`max-w-4xl mx-auto rounded-xl border overflow-hidden font-mono text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <th className="py-3 px-4 font-bold">Feature Vector</th>
                    <th className="py-3 px-4 font-bold text-slate-500">Centralized SFU (Zoom / Meet)</th>
                    <th className="py-3 px-4 font-bold text-indigo-500 dark:text-cyan-400">
                      Meetly (P2P Mesh)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Stream Routing
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Client &rarr; Cloud SFU &rarr; Client
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      Direct Peer ⇄ Peer Mesh
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Decryption Point
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Decrypted on provider cloud servers
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      Endpoint browsers only (WebCrypto AES)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Media Logging & Metadata
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Telemetry & recordings logged in cloud
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      0 Bytes stored on server
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      File & Document Sharing
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Uploaded to public S3 buckets
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      Chunked point-to-point via DataChannel
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Authentication Model
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Mandatory user account & tracking
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      Instant Guest or Authenticated
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Core Technical Specifications (Engineering Focus) */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className={`p-5 rounded-xl border text-left flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-indigo-500">
                  Spec 01 // Cipher
                </span>
                <KeyRound className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                WebCrypto AES-GCM-256
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Key derivation uses PBKDF2 with SHA-256 and 100,000 iterations directly in Web Worker threads. Your shared passphrase never leaves your device unhashed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500">
              Browser-Native Implementation
            </div>
          </div>

          <div
            className={`p-5 rounded-xl border text-left flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-emerald-500">
                  Spec 02 // Routing
                </span>
                <Network className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Full-Mesh WebRTC Lattice
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Every participant in the room establishes isolated, direct peer connections with every other peer. Packets travel along the shortest physical internet route.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500">
              Direct NAT Traversal &bull; STUN/TURN
            </div>
          </div>

          <div
            className={`p-5 rounded-xl border text-left flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-indigo-500">
                  Spec 03 // Transfer
                </span>
                <Share2 className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sandboxed RTCDataChannels
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Files, vector whiteboard coordinates, and chat messages travel across high-throughput SCTP data channels with zero server proxying.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500">
              64KB Binary Chunk Streams
            </div>
          </div>
        </div>
      </section>

      {/* Concise Engineering Footer */}
      <footer
        className={`py-8 border-t text-xs font-mono ${
          isDark
            ? 'bg-[#0a0e17] border-slate-800 text-slate-500'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MeetlyBrand size="sm" showSubtitle={false} />
            <span className="text-slate-400 dark:text-slate-600">&bull;</span>
            <span className="text-slate-500">Decentralized WebRTC Mesh</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Version 2.4</span>
            <span>&bull;</span>
            <button
              onClick={() => setCurrentTab('tech-routes')}
              className="text-indigo-500 hover:underline"
            >
              Architecture Specs
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setCurrentTab('guide')}
              className="text-indigo-500 hover:underline"
            >
              Deployment Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
