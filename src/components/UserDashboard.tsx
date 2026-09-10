import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { RoomRecord, subscribeToUserRooms, inviteUserToRoom } from '../lib/firestoreService';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar,
  Video,
  Mail,
  ArrowRight,
  UserPlus,
  Send,
  X,
  Clock,
  Plus,
  Terminal,
  ShieldCheck,
  Sparkles,
  Hash,
  ExternalLink,
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onJoinRoom: (roomId: string, password?: string, isHost?: boolean) => void;
  onLogout: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onJoinRoom, onLogout }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUserRooms(user.email, user.id, (fetchedRooms) => {
      setRooms(fetchedRooms);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateNew = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(newRoomId, undefined, true);
  };

  const openInviteModal = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsInviteModalOpen(true);
    setInviteEmail('');
    setInviteMessage(null);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !selectedRoomId) return;
    setIsInviting(true);
    setInviteMessage(null);
    try {
      // 1. Update Firestore
      await inviteUserToRoom(selectedRoomId, inviteEmail);
      
      // 2. Call backend to send real email via Resend
      const roomInfo = rooms.find(r => r.id === selectedRoomId);
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          inviterName: user.name,
          inviteeEmail: inviteEmail,
          roomName: roomInfo?.name
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setInviteMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
    } catch (err: any) {
      setInviteMessage({ type: 'error', text: err.message });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Console Subheader Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono opacity-60 pb-3 mb-6 border-b border-dashed border-slate-300 dark:border-slate-800">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SESSION // AUTHENTICATED_NODE</span>
        </span>
        <span className="font-mono">ID: {user.id.slice(0, 10)}...</span>
        <span className="font-semibold text-indigo-500 dark:text-cyan-400">MEETLY // CONTROL_PANEL</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight mb-1">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>
          </h1>
          <p className={`text-xs sm:text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage active sessions, cryptographic tokens, and team invites.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-mono text-xs sm:text-sm font-bold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW SESSION</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Registered Sessions & Mesh Nodes ({rooms.length})</span>
            </h2>
          </div>
          
          {rooms.length === 0 ? (
            <div className={`p-8 rounded-xl border text-center font-mono ${isDark ? 'bg-[#0f1422] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">[ NO_ACTIVE_SESSIONS ]</p>
              <p className="text-xs mt-1 text-slate-500">Deploy a session above to generate an authenticated link.</p>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {rooms.map(room => {
                const isHost = room.createdBy === user.id;
                return (
                  <div key={room.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDark ? 'bg-[#0f1422] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h3 className="font-bold text-sm truncate">{room.name}</h3>
                        {isHost ? (
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded">Host</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">Invited</span>
                        )}
                      </div>
                      <div className={`text-xs flex items-center space-x-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span>ID: <code className="text-indigo-500 dark:text-cyan-400 font-bold">{room.id}</code></span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                      {isHost && (
                        <button
                          onClick={() => openInviteModal(room.id)}
                          className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      )}
                      <button
                        onClick={() => onJoinRoom(room.id, undefined, isHost)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <span>Connect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Quick Join by Code */}
        <div className={`p-5 rounded-xl border h-fit font-mono ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <span>Join By Session Code</span>
            </h3>
            <span className="text-[10px] text-emerald-500">P2P TUNNEL</span>
          </div>

          <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter an existing room code or secure meeting link to connect instantly.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            const val = (e.currentTarget.elements.namedItem('roomCode') as HTMLInputElement).value;
            if (val) onJoinRoom(val, undefined, false);
          }} className="flex flex-col gap-3">
            <input
              name="roomCode"
              type="text"
              placeholder="e.g. 8XYZ9A"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>CONNECT TO ROOM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>WebCrypto Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Full High-Fidelity Audio / Video</span>
            </div>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className={`w-full max-w-md rounded-xl border shadow-xl p-5 ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>INVITE_PEER // SESSION</span>
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className={`p-1 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteMessage && (
              <div className={`mb-4 p-2.5 rounded-lg text-xs font-mono ${
                inviteMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {inviteMessage.text}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Peer Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <button
                onClick={handleSendInvite}
                disabled={isInviting || !inviteEmail}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
              >
                {isInviting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>DISPATCH EMAIL INVITE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
