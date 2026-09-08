import React, { useEffect, useRef, useState } from 'react';
import { Participant } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Mic,
  MicOff,
  Crown,
  MonitorUp,
  Pin,
  Maximize2,
  Minimize2,
  Volume2
} from 'lucide-react';

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream;
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  virtualBlur?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  stream,
  isLocal = false,
  isPinned = false,
  onTogglePin,
  virtualBlur = false,
}) => {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark';

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, participant.isVideoOff]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
  const showVideo = !participant.isVideoOff && hasVideoTrack;

  return (
    <div
      ref={containerRef}
      id={`video-tile-${participant.socketId}`}
      className={`relative w-full h-full min-h-[140px] sm:min-h-[180px] rounded-xl overflow-hidden transition-all duration-200 group flex items-center justify-center select-none shadow-sm border ${
        participant.isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/40'
          : isPinned
          ? 'border-indigo-500 ring-2 ring-indigo-500/40'
          : isDark
          ? 'bg-[#080d16] border-slate-800'
          : 'bg-slate-950 border-slate-800'
      }`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Local video is muted to prevent audio feedback
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal && !participant.isScreenSharing ? 'transform -scale-x-100' : ''
        } ${showVideo ? 'opacity-100' : 'opacity-0'} ${virtualBlur ? 'blur-[1px]' : ''}`}
      />

      {/* Cinematic subtle dark gradient overlay for crystal clear text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Optical HUD Corner Markings */}
      <div className="absolute top-2 left-2 text-slate-500/60 font-mono text-[9px] pointer-events-none select-none z-10 hidden group-hover:block">
        ┌ P2P_STREAM
      </div>
      <div className="absolute bottom-2 right-2 text-slate-500/60 font-mono text-[9px] pointer-events-none select-none z-10 hidden group-hover:block">
        AES // ┘
      </div>

      {/* Video Off / Fallback Avatar */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e17]">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold transition-transform duration-200 ${
              participant.isSpeaking ? 'scale-110 ring-4 ring-emerald-500/80 shadow-lg' : 'ring-2 ring-slate-800'
            }`}
            style={{ backgroundColor: participant.avatarColor }}
          >
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <span className="mt-2.5 text-xs sm:text-sm font-mono font-bold text-slate-200">
            {participant.name} {isLocal ? '(You)' : ''}
          </span>
          {participant.isVideoOff && (
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">[ FEED_MUTED ]</span>
          )}
        </div>
      )}

      {/* Speaking Glow Ring */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-150 border-2 ${
          participant.isSpeaking ? 'opacity-100 border-emerald-400' : 'opacity-0 border-transparent'
        }`}
      />

      {/* Top Left: Presenting & Host Badges */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center space-x-1.5 z-10">
        {participant.isScreenSharing && (
          <span className="px-2 py-0.5 bg-cyan-500/90 text-white rounded-md text-[10px] font-semibold flex items-center space-x-1 shadow-sm">
            <MonitorUp className="w-3 h-3" />
            <span>Sharing</span>
          </span>
        )}
        {participant.isHost && (
          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[10px] font-bold flex items-center space-x-1 shadow-sm">
            <Crown className="w-3 h-3" />
            <span>Host</span>
          </span>
        )}
      </div>

      {/* Top Right: HD Badge & Pin/Fullscreen Quick Actions */}
      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center space-x-1.5 z-10">
        <span className="bg-black/60 backdrop-blur-md text-slate-200 px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/10 hidden sm:inline-block">
          HD
        </span>

        {/* Hover Quick Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-black/60 backdrop-blur-md p-1 rounded-md border border-white/10 pointer-events-auto">
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1 rounded transition-colors ${
                isPinned ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-300 hover:text-white'
              }`}
              title={isPinned ? 'Unpin' : 'Pin to main view'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 text-slate-300 hover:text-white rounded transition-colors"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Bar: Name & Mic Status */}
      <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 flex items-center justify-between z-10 pointer-events-none">
        {/* Name Pill */}
        <div className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-white text-xs font-mono font-semibold flex items-center space-x-1.5 border border-white/10 max-w-[75%] truncate">
          <span className="truncate">{participant.name} {isLocal ? '(Local Node)' : ''}</span>
        </div>

        {/* Microphone Status Pill */}
        <div
          className={`p-1.5 rounded-lg border shadow-xs backdrop-blur-md ${
            participant.isMuted
              ? 'bg-red-500/90 text-white border-red-500/40'
              : participant.isSpeaking
              ? 'bg-emerald-500/90 text-white border-emerald-400/40 animate-pulse'
              : 'bg-black/75 text-slate-300 border-white/10'
          }`}
        >
          {participant.isMuted ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
};
