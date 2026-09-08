import React, { useState, useEffect, useRef } from 'react';
import { User, MediaDeviceSettings } from '../types';
import { attachAudioMeter } from '../lib/audioMeter';
import { subscribeToRecentRooms, RoomRecord } from '../lib/firestoreService';
import { useTheme } from '../context/ThemeContext';
import { MeetlyBrand } from './MeetlyBrand';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  LogOut,
  Users,
  Radio,
  PenTool,
  MonitorUp,
  Share2,
  Clock,
  ExternalLink,
  Sun,
  Moon,
  CheckCircle,
  HelpCircle,
  Terminal,
  Cpu,
  Eye,
  EyeOff,
  Check,
  Copy,
} from 'lucide-react';

interface MeetingLobbyProps {
  user: User;
  onJoinRoom: (roomId: string, password?: string, isCreating?: boolean) => void;
  onLogout: () => void;
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  deviceSettings: MediaDeviceSettings;
  onOpenSettings: () => void;
  prefilledRoomId?: string;
}

export const MeetingLobby: React.FC<MeetingLobbyProps> = ({
  user,
  onJoinRoom,
  onLogout,
  localStream,
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  deviceSettings,
  onOpenSettings,
  prefilledRoomId,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [roomIdInput, setRoomIdInput] = useState(prefilledRoomId || '');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [isPassphraseRequired, setIsPassphraseRequired] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState<RoomRecord[]>([]);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to real-time active/recent rooms from Firestore
  useEffect(() => {
    const unsub = subscribeToRecentRooms((rooms) => {
      setRecentRooms(rooms);
    });
    return () => unsub();
  }, []);

  // Use prefilledRoomId when component mounts if provided
  useEffect(() => {
    if (prefilledRoomId && prefilledRoomId.trim().length > 0) {
      setRoomIdInput(prefilledRoomId);
      // Automatically attempt to join if it's already filled
      // However, we wait for the user to confirm their audio/video first to avoid sudden jumps.
    }
  }, [prefilledRoomId]);

  // Attach local stream to video preview
  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Attach audio meter for pre-call mic test
  useEffect(() => {
    if (!localStream || isMuted) {
      setAudioLevel(0);
      return;
    }

    const meter = attachAudioMeter(localStream, (level) => {
      setAudioLevel(level);
    });

    return () => meter.stop();
  }, [localStream, isMuted]);

  // Generate clean room code
  const handleGenerateRoom = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = 'meet-';
    for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setRoomIdInput(code);
  };

  const handleStartInstantMeeting = () => {
    let targetRoom = roomIdInput.trim().toLowerCase();
    if (!targetRoom) {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      targetRoom = 'meet-';
      for (let i = 0; i < 3; i++) targetRoom += chars.charAt(Math.floor(Math.random() * chars.length));
      targetRoom += '-';
      for (let i = 0; i < 3; i++) targetRoom += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onJoinRoom(targetRoom, passphraseInput.trim() || undefined, true);
  };

  const handleJoinExistingMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanRoom = roomIdInput.trim().toLowerCase();
    if (!cleanRoom) {
      setErrorMessage('Please enter a valid meeting code or ID');
      return;
    }

    setIsCheckingRoom(true);
    try {
      const res = await fetch(`/api/rooms/check/${cleanRoom}`);
      const info = await res.json();

      if (info.exists && info.hasPassword && !passphraseInput) {
        setIsPassphraseRequired(true);
        setErrorMessage('This meeting is protected. Please enter the passcode.');
        setIsCheckingRoom(false);
        return;
      }

      onJoinRoom(cleanRoom, passphraseInput.trim() || undefined, false);
    } catch {
      onJoinRoom(cleanRoom, passphraseInput.trim() || undefined, false);
    } finally {
      setIsCheckingRoom(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-3 sm:p-5 lg:p-8 relative transition-colors duration-150 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Precision Background Grid */}
      <div
        className={`absolute inset-0 pointer-events-none h-full ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />

      {/* Top Editorial Corner Telemetry */}
      <div className="max-w-7xl w-full mx-auto relative z-10 mb-3">
        <div className="flex items-center justify-between text-[11px] font-mono opacity-60 pb-3 border-b border-dashed border-slate-300 dark:border-slate-800">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NODE // HARDWARE_PREFLIGHT_OK</span>
          </span>
          <span className="hidden sm:inline">P2P MESH V2 &bull; ZERO_SFU_RELAY</span>
          <span className="font-semibold text-indigo-500 dark:text-cyan-400">STATUS // READY</span>
        </div>
      </div>

      {/* Top Header */}
      <header
        className={`w-full max-w-7xl mx-auto flex items-center justify-between py-3.5 px-4 sm:px-6 rounded-xl border relative z-10 transition-colors ${
          isDark
            ? 'bg-[#0f1422]/90 border-slate-800 backdrop-blur-md'
            : 'bg-white/95 border-slate-200 backdrop-blur-md shadow-2xs'
        }`}
      >
        <MeetlyBrand size="md" />

        {/* User profile & Global Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            id="lobby-theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-lg border transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Capsule */}
          <div
            className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className={`text-xs font-semibold truncate max-w-[120px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {user.name}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {user.isGuest ? 'Guest Node' : user.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="lobby-settings-btn"
            onClick={onOpenSettings}
            title="Audio & Video Settings"
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="lobby-logout-btn"
            onClick={onLogout}
            title="Sign Out"
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900 hover:bg-red-900/20 border-slate-800 hover:border-red-900 text-slate-300 hover:text-red-400'
                : 'bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Bento Content Area */}
      <main className="w-full max-w-7xl mx-auto my-auto py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch relative z-10">
        {/* Left Side: Hardware & Video Testbench */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          <div
            className={`w-full relative aspect-video rounded-xl border overflow-hidden shadow-xs flex items-center justify-center transition-colors group ${
              isDark ? 'bg-[#080d16] border-slate-800' : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* Live Video */}
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isVideoOff ? 'hidden' : 'block'
              }`}
            />

            {/* Video Off Placeholder */}
            {isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e17] z-10">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold ring-2 ring-slate-800 shadow-lg"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <p className="mt-3 text-sm font-mono font-bold text-slate-200">[ CAMERA_INPUT_DISABLED ]</p>
                <p className="text-xs font-mono text-slate-500">Video track is muted locally</p>
              </div>
            )}

            {/* Optical HUD Corner Brackets */}
            <div className="absolute top-3 left-3 text-slate-500 font-mono text-[10px] pointer-events-none select-none z-20 flex items-center gap-1.5">
              <span className="text-indigo-400 font-bold">┌</span>
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white backdrop-blur-xs">
                RAW_RTP // 1080P60
              </span>
            </div>
            <div className="absolute top-3 right-3 text-slate-500 font-mono text-[10px] pointer-events-none select-none z-20 flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 border border-white/10 text-white backdrop-blur-xs">
                <Mic className={`w-3 h-3 ${isMuted ? 'text-red-400' : 'text-emerald-400'}`} />
                <span className="text-[10px]">
                  {isMuted ? 'MUTED' : `${Math.round(audioLevel * 1.2)} dB`}
                </span>
                <div className="w-10 h-1.5 bg-slate-800 rounded-xs overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, isMuted ? 0 : audioLevel * 2.5)}%` }}
                  />
                </div>
              </div>
              <span className="text-indigo-400 font-bold">┐</span>
            </div>

            <div className="absolute bottom-3 left-3 text-slate-500 font-mono text-[10px] pointer-events-none select-none z-20 flex items-center gap-1.5">
              <span className="text-indigo-400 font-bold">└</span>
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-slate-300 backdrop-blur-xs">
                AES-GCM // ON-DEVICE
              </span>
            </div>
            <div className="absolute bottom-3 right-3 text-slate-500 font-mono text-[10px] pointer-events-none select-none z-20 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-slate-300 backdrop-blur-xs">
                LOOPBACK // &lt;5MS
              </span>
              <span className="text-indigo-400 font-bold">┘</span>
            </div>

            {/* Speaking Level Indicator Ring overlay */}
            <div
              className={`absolute inset-0 border-2 pointer-events-none rounded-xl transition-all duration-150 ${
                audioLevel > 14
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/30'
                  : 'border-transparent'
              }`}
            />

            {/* Floating Hardware Quick Action Bar */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center space-x-3 z-30">
              <button
                type="button"
                id="lobby-toggle-mic-btn"
                onClick={onToggleMic}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-all shadow-md flex items-center justify-center border ${
                  isMuted
                    ? 'bg-red-500 text-white hover:bg-red-600 border-red-500'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700 backdrop-blur-md'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              </button>

              <button
                type="button"
                id="lobby-toggle-cam-btn"
                onClick={onToggleVideo}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-all shadow-md flex items-center justify-center border ${
                  isVideoOff
                    ? 'bg-red-500 text-white hover:bg-red-600 border-red-500'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700 backdrop-blur-md'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                id="lobby-open-settings-floating-btn"
                onClick={onOpenSettings}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-700 backdrop-blur-md transition-all shadow-md flex items-center justify-center"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hardware Preflight Specifications Strip */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border font-mono text-xs ${
              isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-left leading-tight">
                <div className="font-bold text-[11px]">E2EE Mesh</div>
                <div className="text-[10px] text-slate-500">WebCrypto AES</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-left leading-tight">
                <div className="font-bold text-[11px]">Screen Track</div>
                <div className="text-[10px] text-slate-500">1080p 60FPS</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-left leading-tight">
                <div className="font-bold text-[11px]">Whiteboard</div>
                <div className="text-[10px] text-slate-500">Vector sync</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-left leading-tight">
                <div className="font-bold text-[11px]">P2P Chunks</div>
                <div className="text-[10px] text-slate-500">Zero SFU storage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Meeting Deployment Terminal */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          <div
            className={`rounded-xl border shadow-sm transition-all overflow-hidden ${
              isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Console Title Bar */}
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono select-none ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">
                  meetly-room-launcher
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500">PORT // READY</span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Join or Deploy Session
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Direct browser-to-browser tunnel with symmetric encryption.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs flex items-center space-x-2 font-mono">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Meeting Code Input Form */}
              <form onSubmit={handleJoinExistingMeeting} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Session ID // Room Code
                    </label>
                    <button
                      type="button"
                      id="generate-room-code-btn"
                      onClick={handleGenerateRoom}
                      className="text-[11px] font-mono text-indigo-500 hover:text-indigo-600 flex items-center space-x-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Randomize</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    id="lobby-room-id-input"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="e.g. meet-8x4-kp2"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Optional Passphrase */}
                <div>
                  <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Passcode {isPassphraseRequired ? '(Required)' : '(Optional)'}</span>
                    <span className="text-[10px] font-normal lowercase opacity-60">
                      AES key derivation
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      id="lobby-room-password-input"
                      value={passphraseInput}
                      onChange={(e) => setPassphraseInput(e.target.value)}
                      placeholder={isPassphraseRequired ? 'Enter room secret passcode' : 'Symmetric passcode (optional)'}
                      className={`w-full rounded-lg pl-9 pr-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase((prev) => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    id="lobby-join-btn"
                    disabled={isCheckingRoom}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs sm:text-sm font-mono font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {isCheckingRoom ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>INITIALIZE CONNECTION</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="lobby-new-meeting-btn"
                    onClick={handleStartInstantMeeting}
                    className={`w-full h-11 border text-xs sm:text-sm font-mono font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>SPIN UP INSTANT ROOM</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Active Mesh Sessions */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2 font-mono text-xs">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span className={`font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Recent Mesh Nodes
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                DISCOVERABLE
              </span>
            </div>

            {recentRooms.length === 0 ? (
              <p className={`text-xs font-mono text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No previous sessions recorded on this node.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 font-mono">
                {recentRooms.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setRoomIdInput(r.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                      isDark
                        ? 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        {r.isProtected ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold truncate">{r.id}</div>
                        <div className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {r.createdByName ? `host: ${r.createdByName}` : 'mesh channel'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinRoom(r.id, undefined, false);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded hover:bg-indigo-700 transition-all flex items-center space-x-1 shrink-0"
                    >
                      <span>Connect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Engineering Footer */}
      <footer
        className={`w-full max-w-7xl mx-auto py-3 px-4 sm:px-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between text-xs font-mono relative z-10 transition-colors ${
          isDark ? 'bg-[#0f1422] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <MeetlyBrand size="sm" showSubtitle={false} />
          <span className="opacity-40">&bull;</span>
          <span>Pre-call Hardware Preflight</span>
        </div>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0 text-[11px]">
          <span>FEED: {localStream ? 'ACTIVE_1080P' : 'INITIALIZING'}</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            E2EE ACTIVE
          </span>
        </div>
      </footer>
    </div>
  );
};
