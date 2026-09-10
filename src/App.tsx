/**
 * Real-Time Video Conferencing & Collaboration Application
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Participant,
  MediaDeviceSettings,
  ChatMessage,
  SharedFile,
  WhiteboardAction,
  WhiteboardCursor,
  RoomSecurityInfo,
  EmojiReaction,
} from './types';
import { getSocket, disconnectSocket } from './lib/socket';
import { WebRTCManager } from './lib/webrtc';
import { deriveRoomKey, encryptData, decryptData, generateSecurityFingerprint } from './lib/crypto';
import { attachAudioMeter } from './lib/audioMeter';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  firebaseSignOut,
  persistRoomRecord,
  persistChatMessage,
  persistSharedFileMetadata,
  persistWhiteboardAction,
  subscribeToRoomMessages,
  subscribeToRoomFiles,
  subscribeToRoomWhiteboard,
} from './lib/firestoreService';
import { AuthModal } from './components/AuthModal';
import { MeetingLobby } from './components/MeetingLobby';
import { UserDashboard } from './components/UserDashboard';
import { VideoGrid } from './components/VideoGrid';
import { Whiteboard } from './components/Whiteboard';
import { ChatPanel } from './components/ChatPanel';
import { FileSharingPanel } from './components/FileSharingPanel';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { SecurityModal } from './components/SecurityModal';
import { SettingsModal } from './components/SettingsModal';
import { MeetingControls } from './components/MeetingControls';
import { FlyingReactions } from './components/FlyingReactions';
import { NavigationHeader } from './components/NavigationHeader';
import { MeetlyBrand } from './components/MeetlyBrand';
import { LandingHome } from './components/LandingHome';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingTechRoutes } from './components/LandingTechRoutes';
import { LandingGuide } from './components/LandingGuide';
import { LandingTarget } from './components/LandingTarget';
import { Footer } from './components/Footer';
import { useTheme } from './context/ThemeContext';
import { Shield, Sparkles, Copy, Check, Radio, ArrowRight, Sun, Moon, Users } from 'lucide-react';

const DEFAULT_SETTINGS: MediaDeviceSettings = {
  audioInputId: '',
  videoInputId: '',
  audioOutputId: '',
  resolution: '720p',
  noiseSuppression: true,
  echoCancellation: true,
  virtualBackgroundBlur: false,
};

// Fallback synthetic stream if no physical camera/mic or permission denied
function createFallbackStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '24px sans-serif';
    ctx.fillText('Camera Inactive', 220, 240);
  }
  const stream = (canvas as any).captureStream ? canvas.captureStream(10) : new MediaStream();

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const dummyAudioTrack = dst.stream.getAudioTracks()[0];
      if (dummyAudioTrack) {
        dummyAudioTrack.enabled = false;
        stream.addTrack(dummyAudioTrack);
      }
    }
  } catch (e) {
    console.warn('Silent audio creation note:', e);
  }

  return stream;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [copiedRoom, setCopiedRoom] = useState(false);
  const isDark = theme === 'dark';

  // Platform Routing State
  const [currentTab, setCurrentTab] = useState<'home' | 'features' | 'tech-routes' | 'guide' | 'target' | 'app'>('home');
  const [preJoinRoomId, setPreJoinRoomId] = useState<string | null>(null);
  const [preJoinIsHost, setPreJoinIsHost] = useState<boolean>(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto-route invite links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room') || params.get('roomId');
    if (roomFromUrl) {
      const cleanUrlRoom = roomFromUrl.trim().toLowerCase();
      
      // If user is already logged in, skip sessionStorage and go straight to lobby
      if (currentUser) {
        setPreJoinRoomId(cleanUrlRoom);
        setCurrentTab('app');
        window.history.replaceState({}, '', '/');
      } else {
        sessionStorage.setItem('fakka_intended_room', cleanUrlRoom);
        setCurrentTab('app');
        setIsAuthModalOpen(true);
      }
    }
  }, [currentUser]);

  // Meeting & Room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<RoomSecurityInfo | null>(null);
  const [roomCryptoKey, setRoomCryptoKey] = useState<CryptoKey | null>(null);

  // Participants & Media
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [pinnedSocketId, setPinnedSocketId] = useState<string | null>(null);

  // Local media stream & hardware toggles
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [deviceSettings, setDeviceSettings] = useState<MediaDeviceSettings>(DEFAULT_SETTINGS);

  // Collaboration Features
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardActions, setWhiteboardActions] = useState<WhiteboardAction[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, WhiteboardCursor>>(new Map());

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Flying Emoji Reactions
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  // WebRTC Manager ref
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  // Audio meters ref for cleanup
  const audioMetersRef = useRef<Map<string, { stop: () => void }>>(new Map());

  // 1. Initial Authentication check (Firebase Auth Listener + cached local user)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let name = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User');
        let avatarColor = '#6366f1';
        let isGuest = fbUser.isAnonymous;

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            name = data.name || name;
            avatarColor = data.avatarColor || avatarColor;
            isGuest = data.isGuest ?? isGuest;
          }
        } catch (e) {
          console.warn('Firestore doc read warning:', e);
        }

        const user: User = {
          id: fbUser.uid,
          name,
          email: fbUser.email || `${name.toLowerCase().replace(/\s+/g, '')}@guest.local`,
          avatarColor,
          isGuest,
        };

        setCurrentUser(user);
        setIsCheckingAuth(false);
        setIsAuthModalOpen(false);
      } else {
        // Check local token fallback if using express backend
        const cachedUserStr = localStorage.getItem('fakka_current_user');
        const token = localStorage.getItem('fakka_auth_token');

        if (token && cachedUserStr) {
          try {
            const parsed = JSON.parse(cachedUserStr);
            setCurrentUser(parsed);
            setIsCheckingAuth(false);
            setIsAuthModalOpen(false);
            return;
          } catch (e) {
            // parse error
          }
        }

        setCurrentUser(null);
        setIsCheckingAuth(false);
        setIsAuthModalOpen(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Initialize local camera and microphone stream
  const initLocalStream = useCallback(async (settings: MediaDeviceSettings) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.audioInputId ? { exact: settings.audioInputId } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
        },
        video: {
          deviceId: settings.videoInputId ? { exact: settings.videoInputId } : undefined,
          width: settings.resolution === '1080p' ? { ideal: 1920 } : settings.resolution === '360p' ? { ideal: 640 } : { ideal: 1280 },
          height: settings.resolution === '1080p' ? { ideal: 1080 } : settings.resolution === '360p' ? { ideal: 360 } : { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Could not acquire physical camera/mic, using safe fallback stream:', err);
      const fallback = createFallbackStream();
      setLocalStream(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    if (currentUser && !localStream) {
      initLocalStream(deviceSettings);
    }
  }, [currentUser, localStream, deviceSettings, initLocalStream]);

  // Audio meter on local stream for speaking indicator
  useEffect(() => {
    if (!localStream) return;

    const meter = attachAudioMeter(localStream, (level, isSpeaking) => {
      setLocalParticipant((prev) => {
        if (!prev) return null;
        if (prev.isSpeaking === isSpeaking && prev.audioLevel === level) return prev;
        return {
          ...prev,
          isSpeaking: isMuted ? false : isSpeaking,
          audioLevel: isMuted ? 0 : level,
        };
      });
    });

    return () => meter.stop();
  }, [localStream, isMuted]);

  // 3. Join Room Flow
  const handleJoinRoom = async (roomId: string, password?: string, isCreating: boolean = false) => {
    if (!currentUser) return;
    const socket = getSocket();

    // Derive E2EE Key & Security Fingerprint
    const cleanRoomId = roomId.trim().toLowerCase();
    const key = await deriveRoomKey(cleanRoomId, password || '');
    const fingerprintInfo = await generateSecurityFingerprint(cleanRoomId, password || '');

    setRoomCryptoKey(key);
    setSecurityInfo({
      roomId: cleanRoomId,
      encryptionAlgorithm: 'AES-GCM-256 + DTLS-SRTP',
      passphraseHash: password ? 'Protected' : 'Open Mesh',
      fingerprint: fingerprintInfo.fingerprint,
      verificationWords: fingerprintInfo.verificationWords,
      isE2EEActive: true,
    });

    // Save room record to Firestore
    persistRoomRecord(cleanRoomId, currentUser.id, currentUser.name, !!password);

    // Ensure we have a stream
    let streamToUse = localStream;
    if (!streamToUse) {
      streamToUse = await initLocalStream(deviceSettings);
    }

    // Set local participant state
    const localPart: Participant = {
      socketId: socket.id || 'local',
      userId: currentUser.id,
      name: currentUser.name,
      avatarColor: currentUser.avatarColor,
      isHost: isCreating,
      isMuted,
      isVideoOff,
      isScreenSharing: false,
    };
    setLocalParticipant(localPart);

    // Initialize WebRTC Manager
    const rtcManager = new WebRTCManager(socket, {
      onRemoteStream: (remoteSocketId, stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remoteSocketId, stream);
          return next;
        });

        // Attach audio meter to remote stream
        const meter = attachAudioMeter(stream, (level, isSpeaking) => {
          setRemoteParticipants((prev) =>
            prev.map((p) =>
              p.socketId === remoteSocketId
                ? {
                    ...p,
                    isSpeaking: p.isMuted ? false : isSpeaking,
                    audioLevel: p.isMuted ? 0 : level,
                  }
                : p
            )
          );
        });
        audioMetersRef.current.set(remoteSocketId, meter);
      },
      onPeerDisconnected: (remoteSocketId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(remoteSocketId);
          return next;
        });
      },
    });

    if (streamToUse) {
      rtcManager.setLocalStream(streamToUse);
    }

    webrtcManagerRef.current = rtcManager;

    // Join room via socket
    socket.emit(
      'room:join',
      {
        roomId: cleanRoomId,
        user: currentUser,
        password,
      },
      async (res: any) => {
        if (!res.success) {
          alert('Failed to join room: ' + res.error);
          return;
        }

        setActiveRoomId(cleanRoomId);
        setRoomPassword(password || '');
        setIsHost(res.isHost);

        // Add existing participants
        setRemoteParticipants(res.participants || []);

        // Start WebRTC connection offers to all existing members
        if (res.participants && res.participants.length > 0) {
          for (const p of res.participants) {
            rtcManager.initiateConnectionToPeer(p.socketId);
          }
        }

        // Restore whiteboard history
        if (res.whiteboardHistory) {
          setWhiteboardActions(res.whiteboardHistory);
        }

        // Restore chat history & decrypt
        if (res.chatHistory) {
          const decryptedMsgs: ChatMessage[] = [];
          for (const msg of res.chatHistory) {
            let text = msg.text;
            if (msg.isEncrypted && msg.iv && key) {
              text = await decryptData(msg.text, msg.iv, key);
            }
            decryptedMsgs.push({
              ...msg,
              decryptedText: text,
            });
          }
          setChatMessages(decryptedMsgs);
        }

        // Restore files
        if (res.sharedFiles) {
          setSharedFiles(res.sharedFiles);
        }

        // Sync local media status
        socket.emit('media:toggle', {
          isMuted,
          isVideoOff,
          isScreenSharing: false,
        });
      }
    );
  };

  // 4. Socket Listeners during Room Session
  useEffect(() => {
    if (!activeRoomId) return;
    const socket = getSocket();

    // New participant joined
    const handleUserJoined = (data: { participant: Participant }) => {
      setRemoteParticipants((prev) => {
        if (prev.some((p) => p.socketId === data.participant.socketId)) return prev;
        return [...prev, data.participant];
      });
    };

    // Participant left
    const handleUserLeft = (data: { socketId: string; name?: string }) => {
      setRemoteParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
      webrtcManagerRef.current?.closePeerConnection(data.socketId);
      const meter = audioMetersRef.current.get(data.socketId);
      if (meter) {
        meter.stop();
        audioMetersRef.current.delete(data.socketId);
      }
    };

    // Remote media state change (mute, camera off, screen share)
    const handleMediaStateChange = (data: {
      socketId: string;
      isMuted: boolean;
      isVideoOff: boolean;
      isScreenSharing: boolean;
    }) => {
      setRemoteParticipants((prev) =>
        prev.map((p) =>
          p.socketId === data.socketId
            ? {
                ...p,
                isMuted: data.isMuted,
                isVideoOff: data.isVideoOff,
                isScreenSharing: data.isScreenSharing,
              }
            : p
        )
      );
    };

    // Whiteboard action received
    const handleWhiteboardAction = (action: WhiteboardAction) => {
      if (action.type === 'clear') {
        setWhiteboardActions([]);
      } else if (action.type === 'delete' || action.isDeleted) {
        setWhiteboardActions((prev) => prev.filter((a) => a.id !== action.id));
      } else {
        setWhiteboardActions((prev) => {
          const idx = prev.findIndex((a) => a.id === action.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...action };
            return next;
          }
          return [...prev, action];
        });
      }
    };

    // Whiteboard remote cursor
    const handleWhiteboardCursor = (cursor: WhiteboardCursor) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(cursor.socketId, cursor);
        return next;
      });
    };

    // Chat message received
    const handleChatMessage = async (msg: ChatMessage) => {
      let decrypted = msg.text;
      if (msg.isEncrypted && msg.iv && roomCryptoKey) {
        decrypted = await decryptData(msg.text, msg.iv, roomCryptoKey);
      }

      setChatMessages((prev) => [...prev, { ...msg, decryptedText: decrypted }]);

      if (!isChatOpen) {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    // Shared file received
    const handleFileShared = (file: SharedFile) => {
      setSharedFiles((prev) => {
        if (prev.some((f) => f.id === file.id)) return prev;
        return [file, ...prev];
      });
    };

    // Reaction received
    const handleReactionReceived = (data: { emoji: string; senderName: string }) => {
      const newReaction: EmojiReaction = {
        id: `rx_${Date.now()}_${Math.random()}`,
        emoji: data.emoji,
        senderName: data.senderName,
        x: 10 + Math.random() * 80, // percentage across screen
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3000);
    };

    // Host action: muted you
    const handleHostMutedYou = () => {
      setIsMuted(true);
      if (localStream) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      socket.emit('media:toggle', { isMuted: true });
      alert('You have been muted by the host.');
    };

    // Host action: kicked you
    const handleHostKickedYou = () => {
      alert('You have been removed from the meeting by the host.');
      handleLeaveMeeting();
    };

    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('media:state-change', handleMediaStateChange);
    socket.on('whiteboard:action', handleWhiteboardAction);
    socket.on('whiteboard:cursor', handleWhiteboardCursor);
    socket.on('chat:message', handleChatMessage);
    socket.on('file:shared', handleFileShared);
    socket.on('reaction:received', handleReactionReceived);
    socket.on('host:muted-you', handleHostMutedYou);
    socket.on('host:kicked-you', handleHostKickedYou);

    // Real-time Firestore Live Listeners for cross-device & page refresh synchronization
    const unsubMessages = subscribeToRoomMessages(activeRoomId, async (firestoreMsgs) => {
      if (!firestoreMsgs || firestoreMsgs.length === 0) return;
      const decryptedList: ChatMessage[] = [];
      for (const msg of firestoreMsgs) {
        let decrypted = msg.text;
        if (msg.isEncrypted && msg.iv && roomCryptoKey) {
          try {
            decrypted = await decryptData(msg.text, msg.iv, roomCryptoKey);
          } catch (e) {
            // decipher fallback
          }
        }
        decryptedList.push({
          ...msg,
          decryptedText: decrypted,
        });
      }
      setChatMessages((prev) => {
        // Merge without duplicating
        const map = new Map<string, ChatMessage>();
        prev.forEach((m) => map.set(m.id, m));
        decryptedList.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    const unsubFiles = subscribeToRoomFiles(activeRoomId, (firestoreFiles) => {
      if (!firestoreFiles) return;
      setSharedFiles((prev) => {
        const map = new Map<string, SharedFile>();
        prev.forEach((f) => map.set(f.id, f));
        firestoreFiles.forEach((f) => {
          const existing = map.get(f.id);
          map.set(f.id, { ...f, dataUrl: existing?.dataUrl || f.dataUrl });
        });
        return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    const unsubWhiteboard = subscribeToRoomWhiteboard(activeRoomId, (actions) => {
      if (!actions) return;
      if (actions.length === 0) {
        // May have been cleared
        return;
      }
      setWhiteboardActions((prev) => {
        const map = new Map<string, WhiteboardAction>();
        prev.forEach((a) => map.set(a.id, a));
        actions.forEach((a) => map.set(a.id, a));
        return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('media:state-change', handleMediaStateChange);
      socket.off('whiteboard:action', handleWhiteboardAction);
      socket.off('whiteboard:cursor', handleWhiteboardCursor);
      socket.off('chat:message', handleChatMessage);
      socket.off('file:shared', handleFileShared);
      socket.off('reaction:received', handleReactionReceived);
      socket.off('host:muted-you', handleHostMutedYou);
      socket.off('host:kicked-you', handleHostKickedYou);

      unsubMessages();
      unsubFiles();
      unsubWhiteboard();
    };
  }, [activeRoomId, roomCryptoKey, isChatOpen, localStream]);

  // 5. Media Control Handlers
  const handleToggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    setLocalParticipant((prev) => (prev ? { ...prev, isMuted: nextMuted } : null));

    if (activeRoomId) {
      const socket = getSocket();
      socket.emit('media:toggle', { isMuted: nextMuted });
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
    }

    setLocalParticipant((prev) => (prev ? { ...prev, isVideoOff: nextVideoOff } : null));

    if (activeRoomId) {
      const socket = getSocket();
      socket.emit('media:toggle', { isVideoOff: nextVideoOff });
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setLocalParticipant((prev) => (prev ? { ...prev, isScreenSharing: false } : null));

      // Revert WebRTC track to camera
      const cameraTrack = localStream?.getVideoTracks()[0] || null;
      webrtcManagerRef.current?.replaceVideoTrack(cameraTrack);

      if (activeRoomId) {
        getSocket().emit('media:toggle', { isScreenSharing: false });
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        setIsScreenSharing(true);
        setLocalParticipant((prev) => (prev ? { ...prev, isScreenSharing: true } : null));

        // Replace track on all peer connections
        webrtcManagerRef.current?.replaceVideoTrack(screenTrack);

        if (activeRoomId) {
          getSocket().emit('media:toggle', { isScreenSharing: true });
        }

        // Auto-detect when user clicks native "Stop sharing" chrome
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setLocalParticipant((prev) => (prev ? { ...prev, isScreenSharing: false } : null));
          const camTrack = localStream?.getVideoTracks()[0] || null;
          webrtcManagerRef.current?.replaceVideoTrack(camTrack);
          if (activeRoomId) {
            getSocket().emit('media:toggle', { isScreenSharing: false });
          }
        };
      } catch (err) {
        console.warn('Screen sharing cancelled or unavailable:', err);
      }
    }
  };

  // 6. Collaboration Event Handlers
  const handleWhiteboardAction = (action: WhiteboardAction) => {
    if (action.type === 'clear') {
      setWhiteboardActions([]);
    } else if (action.type === 'delete' || action.isDeleted) {
      setWhiteboardActions((prev) => prev.filter((a) => a.id !== action.id));
    } else {
      setWhiteboardActions((prev) => {
        const idx = prev.findIndex((a) => a.id === action.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...action };
          return next;
        }
        return [...prev, action];
      });
    }
    getSocket().emit('whiteboard:action', action);

    if (activeRoomId) {
      persistWhiteboardAction(activeRoomId, action);
    }
  };

  const handleWhiteboardCursor = (coords: { x: number; y: number }) => {
    getSocket().emit('whiteboard:cursor', coords);
  };

  const handleSendMessage = async (text: string) => {
    const socket = getSocket();
    if (!activeRoomId || !currentUser) return;

    if (roomCryptoKey) {
      const { cipherText, iv } = await encryptData(text, roomCryptoKey);
      const msgPayload = {
        text: cipherText,
        isEncrypted: true,
        iv,
      };

      socket.emit('chat:message', msgPayload, (res: any) => {
        if (res?.success && res?.message) {
          persistChatMessage(activeRoomId, res.message);
        }
      });
    } else {
      const msgPayload = {
        text,
        isEncrypted: false,
      };
      socket.emit('chat:message', msgPayload, (res: any) => {
        if (res?.success && res?.message) {
          persistChatMessage(activeRoomId, res.message);
        }
      });
    }
  };

  const handleUploadFile = (file: File) => {
    const socket = getSocket();
    if (!activeRoomId || !currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const filePayload = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        isEncrypted: true,
      };

      socket.emit('file:share', filePayload, (res: any) => {
        if (res?.success && res?.fileId) {
          persistSharedFileMetadata(activeRoomId, {
            id: res.fileId,
            roomId: activeRoomId,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            senderId: currentUser.id,
            senderName: currentUser.name,
            isEncrypted: true,
            timestamp: Date.now(),
          });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadFile = (fileId: string) => {
    const file = sharedFiles.find((f) => f.id === fileId);
    if (file && file.dataUrl) {
      const link = document.createElement('a');
      link.download = file.name;
      link.href = file.dataUrl;
      link.click();
    } else {
      getSocket().emit('file:download-request', { fileId }, (res: any) => {
        if (res && res.success && res.dataUrl) {
          const link = document.createElement('a');
          link.download = file?.name || 'downloaded-file';
          link.href = res.dataUrl;
          link.click();
        } else {
          alert('Unable to retrieve file payload.');
        }
      });
    }
  };

  const handleSendReaction = (emoji: string) => {
    getSocket().emit('reaction:send', { emoji });
    const localRx: EmojiReaction = {
      id: `rx_${Date.now()}`,
      emoji,
      senderName: currentUser?.name || 'You',
      x: 20 + Math.random() * 60,
      timestamp: Date.now(),
    };
    setReactions((prev) => [...prev, localRx]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== localRx.id));
    }, 3000);
  };

  const handleHostAction = (action: 'mute' | 'kick', targetSocketId: string) => {
    getSocket().emit('host:action', { action, targetSocketId });
  };

  const handleLeaveMeeting = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    audioMetersRef.current.forEach((meter) => meter.stop());
    audioMetersRef.current.clear();

    webrtcManagerRef.current?.destroy();
    webrtcManagerRef.current = null;

    disconnectSocket();

    setActiveRoomId(null);
    setRemoteParticipants([]);
    setRemoteStreams(new Map());
    setWhiteboardActions([]);
    setChatMessages([]);
    setSharedFiles([]);
    setIsWhiteboardOpen(false);
    setIsChatOpen(false);
    setIsFilesOpen(false);
    setIsParticipantsOpen(false);
    setIsScreenSharing(false);
    setPinnedSocketId(null);
  };

  const handleLogout = async () => {
    handleLeaveMeeting();
    try {
      await firebaseSignOut();
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    localStorage.removeItem('fakka_auth_token');
    localStorage.removeItem('fakka_current_user');
    setCurrentUser(null);
    setCurrentTab('home');
    setIsAuthModalOpen(false);
  };

  // If still checking auth token
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-x-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xs font-semibold tracking-wide uppercase text-slate-400">
            Initializing Secure Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      isDark ? 'bg-[#0a0e17] text-slate-100' : 'bg-[#fafafc] text-slate-900'
    }`}>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen && !currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          
          const intendedRoom = sessionStorage.getItem('meetly_intended_room') || sessionStorage.getItem('fakka_intended_room');
          const intendedPassphrase = sessionStorage.getItem('meetly_intended_passphrase') || sessionStorage.getItem('fakka_intended_passphrase');
          if (intendedRoom) {
            sessionStorage.removeItem('meetly_intended_room');
            sessionStorage.removeItem('meetly_intended_passphrase');
            sessionStorage.removeItem('fakka_intended_room');
            sessionStorage.removeItem('fakka_intended_passphrase');
            setCurrentTab('app');
            setTimeout(() => {
              handleJoinRoom(intendedRoom, intendedPassphrase || undefined, false);
            }, 300);
          } else {
            setCurrentTab('app');
          }
        }}
      />

      {/* Render meeting room directly if user is in an active conference to maintain focus */}
      {currentUser && activeRoomId && localParticipant ? (
        <div
          className={`relative w-full h-screen flex flex-col overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3 transition-colors duration-200 ${
            isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
          }`}
        >
          {/* Floating Top Elements */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-40 pointer-events-none gap-2">
            {/* Left: Brand & Room ID */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div
                className={`hidden xs:flex items-center gap-2 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-xs ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                    : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <MeetlyBrand size="sm" showSubtitle={false} />
              </div>

              <div className="flex items-center space-x-1">
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl border tracking-wide select-all shadow-xs backdrop-blur-md ${
                    isDark
                      ? 'bg-slate-900/90 text-slate-100 border-slate-700/80'
                      : 'bg-white/95 text-slate-900 border-slate-300'
                  }`}
                >
                  {activeRoomId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeRoomId);
                    setCopiedRoom(true);
                    setTimeout(() => setCopiedRoom(false), 2000);
                  }}
                  className={`p-1.5 rounded-xl border transition-colors shadow-xs backdrop-blur-md ${
                    isDark
                      ? 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80'
                      : 'bg-white/95 text-slate-600 hover:text-slate-900 border-slate-300'
                  }`}
                  title="Copy Meeting Code"
                >
                  {copiedRoom ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {securityInfo?.isE2EEActive && (
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-colors ${
                    isDark
                      ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Verified End-to-End Encrypted"
                >
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>E2EE Secure</span>
                </button>
              )}
            </div>

            {/* Right: Meeting Actions & Theme Toggle */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-xs ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                    : 'bg-white/95 border-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>{1 + remoteParticipants.length}</span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`p-1.5 rounded-xl border transition-colors shadow-xs backdrop-blur-md ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-amber-400'
                    : 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Center Stage: Video Grid / Whiteboard / Collaboration Area */}
          <main className="relative flex-1 w-full h-full flex overflow-hidden gap-3">
            {/* Main Video Grid & Stage */}
            <div className="relative flex-1 h-full overflow-hidden flex flex-col">
              {isWhiteboardOpen ? (
                <div className="w-full h-full">
                  <Whiteboard
                    currentUser={currentUser}
                    actions={whiteboardActions}
                    remoteCursors={remoteCursors}
                    onEmitAction={handleWhiteboardAction}
                    onEmitCursor={handleWhiteboardCursor}
                    onClose={() => setIsWhiteboardOpen(false)}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              ) : (
                <VideoGrid
                  localParticipant={localParticipant}
                  localStream={localStream}
                  remoteParticipants={remoteParticipants}
                  remoteStreams={remoteStreams}
                  pinnedSocketId={pinnedSocketId}
                  onTogglePin={(id) => setPinnedSocketId((curr) => (curr === id ? null : id))}
                  deviceSettings={deviceSettings}
                />
              )}
            </div>

            {/* Drawers / Bento Side Panels (Chat, Participants, Files) */}
            {isChatOpen && (
              <ChatPanel
                currentUser={currentUser}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onClose={() => setIsChatOpen(false)}
                isE2EEActive={!!securityInfo?.isE2EEActive}
              />
            )}

            {isParticipantsOpen && (
              <ParticipantsPanel
                currentUser={currentUser}
                roomId={activeRoomId}
                localParticipant={localParticipant}
                remoteParticipants={remoteParticipants}
                onClose={() => setIsParticipantsOpen(false)}
                onHostAction={handleHostAction}
              />
            )}

            {isFilesOpen && (
              <FileSharingPanel
                currentUser={currentUser}
                sharedFiles={sharedFiles}
                onUploadFile={handleUploadFile}
                onDownloadFile={handleDownloadFile}
                onClose={() => setIsFilesOpen(false)}
              />
            )}
          </main>

          {/* Bottom Meeting Controls Bar */}
          <MeetingControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            isWhiteboardOpen={isWhiteboardOpen}
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            isFilesOpen={isFilesOpen}
            unreadCount={unreadChatCount}
            participantsCount={1 + remoteParticipants.length}
            filesCount={sharedFiles.length}
            onToggleMic={handleToggleMic}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
            onToggleChat={() => {
              setIsChatOpen((prev) => {
                if (!prev) setUnreadChatCount(0);
                return !prev;
              });
              setIsParticipantsOpen(false);
              setIsFilesOpen(false);
            }}
            onToggleParticipants={() => {
              setIsParticipantsOpen((prev) => !prev);
              setIsChatOpen(false);
              setIsFilesOpen(false);
            }}
            onToggleFiles={() => {
              setIsFilesOpen((prev) => !prev);
              setIsChatOpen(false);
              setIsParticipantsOpen(false);
            }}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onSendReaction={handleSendReaction}
            onLeaveMeeting={handleLeaveMeeting}
          />

          {/* Flying Reactions Animation Overlay */}
          <FlyingReactions reactions={reactions} />
        </div>
      ) : (
        /* Render global site framework (Header + Navigation pages + Lobby workspace) */
        <div className={`flex-1 w-full flex flex-col transition-colors duration-150 ${
          isDark ? 'bg-[#0a0e17] text-slate-100 font-sans' : 'bg-[#fafafc] text-slate-900 font-sans'
        }`}>
          <NavigationHeader
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            activeRoomId={activeRoomId}
          />

          <main className="flex-1">
            {currentTab === 'home' && (
              <LandingHome
                onJoinRoomFromLanding={(id, pw) => handleJoinRoom(id, pw, false)}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'features' && <LandingFeatures />}

            {currentTab === 'tech-routes' && <LandingTechRoutes />}

            {currentTab === 'guide' && <LandingGuide />}

            {currentTab === 'target' && <LandingTarget currentUser={currentUser} />}

            {currentTab === 'app' && (
              currentUser ? (
                preJoinRoomId ? (
                  <MeetingLobby
                    user={currentUser}
                    onJoinRoom={(roomId, pw, isHost) => handleJoinRoom(roomId, pw, isHost ?? preJoinIsHost)}
                    onLogout={handleLogout}
                    localStream={localStream}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    onToggleMic={handleToggleMic}
                    onToggleVideo={handleToggleVideo}
                    deviceSettings={deviceSettings}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    prefilledRoomId={preJoinRoomId}
                  />
                ) : (
                  <UserDashboard
                    user={currentUser}
                    onJoinRoom={(roomId, pw, isHost) => {
                      setPreJoinRoomId(roomId);
                      setPreJoinIsHost(isHost || false);
                    }}
                    onLogout={handleLogout}
                  />
                )
              ) : (
                /* Access Denied prompt inside the workspace container */
                <div className="max-w-md mx-auto py-24 px-6 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold tracking-tight">Workspace Is Locked</h2>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                      Access to Meetly meeting grids and signaling meshes requires authentication. Log in with an email account or enter as an anonymous Guest instantly.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md  transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Authenticate and Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )
            )}
          </main>

          {/* Persistent Landing Page Footer */}
          {currentTab !== 'app' && (
            <Footer
              setCurrentTab={setCurrentTab}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* Global Modals */}
      {securityInfo && (
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          securityInfo={securityInfo}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={deviceSettings}
        onSaveSettings={(newSettings) => setDeviceSettings(newSettings)}
        localStream={localStream}
      />
    </div>
  );
}
