import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PenTool,
  MessageSquare,
  Users,
  Share2,
  ShieldCheck,
  Settings,
  PhoneOff,
  Smile,
  Sun,
  Moon,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isWhiteboardOpen: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isFilesOpen: boolean;
  unreadCount: number;
  participantsCount: number;
  filesCount: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleFiles: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveMeeting: () => void;
}

const REACTION_LIST = ['👏', '👍', '❤️', '🎉', '🔥', '✋', '💡'];

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isWhiteboardOpen,
  isChatOpen,
  isParticipantsOpen,
  isFilesOpen,
  unreadCount,
  participantsCount,
  filesCount,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleWhiteboard,
  onToggleChat,
  onToggleParticipants,
  onToggleFiles,
  onOpenSecurity,
  onOpenSettings,
  onSendReaction,
  onLeaveMeeting,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
      if (reactionsRef.current && !reactionsRef.current.contains(target)) {
        setShowReactions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setShowReactions(false);
      }
    };
    if (showMoreMenu || showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMoreMenu, showReactions]);

  return (
    <footer className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex flex-col items-center justify-center px-2 sm:px-4 z-40 w-full pointer-events-none">
      
      {/* Expanded Dock */}
      <div className={`transition-all duration-300 transform ${isCollapsed ? 'translate-y-8 opacity-0 pointer-events-none scale-95' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        
        {/* Floating Emoji Reactions Tray */}
        {showReactions && !isCollapsed && (
          <div
            ref={reactionsRef}
            className={`absolute bottom-full mb-3 rounded-2xl p-2 shadow-2xl flex items-center space-x-1.5 border transition-all animate-in fade-in zoom-in-95 duration-150 z-50 ${
              isDark ? 'bg-[#0f1422] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {REACTION_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSendReaction(emoji);
                  setShowReactions(false);
                }}
                className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl transition-transform hover:scale-125 ${
                  isDark ? 'hover:bg-slate-850' : 'hover:bg-slate-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Main Action Bar Dock */}
        <div
          className={`relative flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border shadow-2xl transition-colors max-w-[calc(100vw-1rem)] overflow-visible ${
            isDark ? 'bg-[#0f1422]/95 backdrop-blur-xl border-slate-800' : 'bg-white/95 backdrop-blur-xl border-slate-200'
          }`}
        >
          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className={`w-7 h-10 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isDark ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850' : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
            }`}
            title="Collapse Controls"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className={`w-[1px] h-6 my-auto mx-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Microphone Toggle */}
          <button
            type="button"
            id="control-toggle-mic"
            onClick={onToggleMic}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isMuted
                ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-500'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-emerald-600 border-slate-200'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            id="control-toggle-cam"
            onClick={onToggleVideo}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isVideoOff
                ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-500'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            id="control-toggle-screenshare"
            onClick={onToggleScreenShare}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isScreenSharing
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <MonitorUp className="w-4 h-4" />
          </button>

          {/* Chat */}
          <button
            type="button"
            id="control-toggle-chat"
            onClick={onToggleChat}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isChatOpen
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            type="button"
            id="control-toggle-participants"
            onClick={onToggleParticipants}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isParticipantsOpen
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title="Participants"
          >
            <Users className="w-4 h-4" />
            <span
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full border ${
                isDark ? 'bg-slate-950 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {participantsCount}
            </span>
          </button>

          {/* Whiteboard Direct Button */}
          <button
            type="button"
            id="control-toggle-whiteboard"
            onClick={onToggleWhiteboard}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
              isWhiteboardOpen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title={isWhiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard Canvas'}
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* Reactions Picker */}
          <button
            type="button"
            id="control-toggle-reactions"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactions((prev) => !prev);
              setShowMoreMenu(false);
            }}
            className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all items-center justify-center shrink-0 border ${
              showReactions
                ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title="Send Reaction"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Grouped More Options */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              id="control-more-options"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu((prev) => !prev);
                setShowReactions(false);
              }}
              className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all flex items-center justify-center border ${
                showMoreMenu
                  ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                  : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
              title="More Options (Whiteboard, Files, Settings)"
            >
              <MoreVertical className="w-4 h-4" />
              {(isWhiteboardOpen || isFilesOpen) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Dropup Menu */}
            {showMoreMenu && (
              <div
                id="meeting-more-options-menu"
                className={`absolute bottom-full right-0 mb-3 w-60 rounded-2xl shadow-2xl border overflow-hidden transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-2 z-50 ${
                  isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="p-1.5 space-y-0.5">
                  {/* Whiteboard */}
                  <button
                    type="button"
                    id="more-menu-whiteboard"
                    onClick={() => {
                      onToggleWhiteboard();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors ${
                      isWhiteboardOpen
                        ? isDark ? 'bg-emerald-500/15 text-emerald-400 font-semibold' : 'bg-emerald-50 text-emerald-700 font-semibold'
                        : isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <PenTool className={`w-4 h-4 ${isWhiteboardOpen ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      <span>Whiteboard Canvas</span>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                      isWhiteboardOpen
                        ? 'bg-emerald-500 text-white'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isWhiteboardOpen ? 'OPEN' : 'P2P'}
                    </span>
                  </button>
                  
                  {/* Files */}
                  <button
                    type="button"
                    id="more-menu-files"
                    onClick={() => {
                      onToggleFiles();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors ${
                      isFilesOpen
                        ? isDark ? 'bg-amber-500/15 text-amber-400 font-semibold' : 'bg-amber-50 text-amber-700 font-semibold'
                        : isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Share2 className={`w-4 h-4 ${isFilesOpen ? 'text-amber-400' : 'text-amber-500'}`} />
                      <span>Transfers / Files</span>
                    </div>
                    {filesCount > 0 ? (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold rounded">
                        {filesCount}
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                        isFilesOpen ? 'bg-amber-500/20 text-amber-500 font-bold' : isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {isFilesOpen ? 'OPEN' : 'P2P'}
                      </span>
                    )}
                  </button>

                  <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                  {/* Security Info */}
                  <button
                    type="button"
                    id="more-menu-security"
                    onClick={() => {
                      onOpenSecurity();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2.5 transition-colors ${
                      isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographic Audit</span>
                  </button>

                  {/* Device Settings */}
                  <button
                    type="button"
                    id="more-menu-settings"
                    onClick={() => {
                      onOpenSettings();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2.5 transition-colors ${
                      isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Hardware Settings</span>
                  </button>

                  <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                  {/* Theme Toggle */}
                  <button
                    type="button"
                    id="more-menu-theme"
                    onClick={() => {
                      toggleTheme();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2.5 transition-colors ${
                      isDark ? 'hover:bg-slate-850 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>Theme: Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-slate-600" />
                        <span>Theme: Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`hidden md:block w-[1px] h-6 my-auto mx-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Leave Meeting (Prominent Red End Call Button) */}
          <button
            type="button"
            id="control-leave-meeting"
            onClick={onLeaveMeeting}
            className="h-10 sm:h-11 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-mono uppercase text-xs tracking-wider flex items-center justify-center space-x-1.5 transition-all shrink-0 ml-1 shadow-xs"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Restore Dock Button (When Collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className={`absolute bottom-4 sm:bottom-6 px-4 py-2 rounded-xl shadow-lg border flex items-center space-x-2 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 font-mono text-xs ${
            isDark ? 'bg-[#0f1422] border-slate-800 text-slate-200 hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          <span>RESTORE_DOCK</span>
        </button>
      )}
    </footer>
  );
};
