import React, { useState } from 'react';
import { Participant, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  MonitorUp,
  X,
  Copy,
  Check,
  VolumeX,
  UserX,
  Share2,
  Users
} from 'lucide-react';

interface ParticipantsPanelProps {
  currentUser: User;
  roomId: string;
  localParticipant: Participant;
  remoteParticipants: Participant[];
  onClose: () => void;
  onHostAction?: (action: 'mute' | 'kick', targetSocketId: string) => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  currentUser,
  roomId,
  localParticipant,
  remoteParticipants,
  onClose,
  onHostAction,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const allParticipants = [localParticipant, ...remoteParticipants];
  const isDark = theme === 'dark';

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`absolute sm:relative inset-y-0 right-0 sm:right-auto z-50 sm:z-30 w-full sm:w-80 md:w-96 h-full flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-lg'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2">
            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>PARTICIPANTS</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                isDark ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {allParticipants.length} NODES
            </span>
          </h3>
          <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Connected peers in cryptographic room
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850' : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
          }`}
          title="Close Participants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meeting Invite Link Box */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>ROOM_KEY:</span>
          <span
            className={`font-mono px-2 py-0.5 rounded-md font-bold border ${
              isDark ? 'bg-slate-950 text-emerald-400 border-slate-800' : 'bg-white text-emerald-700 border-slate-200'
            }`}
          >
            {roomId}
          </span>
        </div>
        <button
          type="button"
          id="copy-invite-link-btn"
          onClick={handleCopyInvite}
          className="w-full py-2.5 px-4 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Invite Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Copy Invite URL</span>
            </>
          )}
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 font-mono">
        {allParticipants.map((p) => {
          const isMe = p.socketId === localParticipant.socketId;

          return (
            <div
              key={p.socketId}
              className={`p-2.5 rounded-xl flex items-center justify-between space-x-3 transition-all border ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Avatar and Name */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs font-mono"
                  style={{ backgroundColor: p.avatarColor }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs font-mono font-semibold truncate ${
                      isMe
                        ? (isDark ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold')
                        : (isDark ? 'text-slate-200' : 'text-slate-800')
                    }`}>
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">(YOU)</span>
                    )}
                    {p.isHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Host" />
                    )}
                  </div>
                  {p.isScreenSharing && (
                    <span className="text-[10px] font-mono text-cyan-500 flex items-center space-x-1 mt-0.5">
                      <MonitorUp className="w-3 h-3" />
                      <span>PRESENTING</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Icons & Host Controls */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Mic Status */}
                <div
                  className={`p-1.5 rounded-lg border ${
                    p.isMuted
                      ? 'bg-red-500/10 text-red-500 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}
                  title={p.isMuted ? 'Muted' : 'Microphone on'}
                >
                  {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </div>

                {/* Video Status */}
                <div
                  className={`p-1.5 rounded-lg border ${
                    p.isVideoOff
                      ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }`}
                  title={p.isVideoOff ? 'Camera off' : 'Camera on'}
                >
                  {p.isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                </div>

                {/* Host Moderation Actions */}
                {localParticipant.isHost && !isMe && onHostAction && (
                  <div className="flex items-center space-x-1 ml-1 pl-1 border-l border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => onHostAction('mute', p.socketId)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Mute Participant"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onHostAction('kick', p.socketId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove Participant"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
