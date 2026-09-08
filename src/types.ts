export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  isGuest: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  isSpeaking?: boolean;
  audioLevel?: number;
  connectionState?: RTCPeerConnectionState;
}

export interface MediaDeviceSettings {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
  resolution: '720p' | '1080p' | '360p';
  noiseSuppression: boolean;
  echoCancellation: boolean;
  virtualBackgroundBlur: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  text: string;
  decryptedText?: string;
  isEncrypted: boolean;
  iv?: string;
  timestamp: number;
}

export interface SharedFile {
  id: string;
  roomId?: string;
  name: string;
  size: number;
  type: string;
  senderId: string;
  senderName: string;
  dataUrl?: string;
  progress?: number; // 0-100
  status?: 'ready' | 'downloading' | 'uploading' | 'completed' | 'error';
  isEncrypted: boolean;
  iv?: string;
  timestamp: number;
}

export type WhiteboardTool =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'laser';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface WhiteboardAction {
  id: string;
  type: 'draw' | 'line' | 'rect' | 'circle' | 'arrow' | 'text' | 'sticky' | 'clear' | 'delete' | 'update';
  color: string;
  fillColor?: string;
  isFilled?: boolean;
  size: number;
  points?: DrawPoint[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  stickyBg?: string;
  isHighlighter?: boolean;
  userId: string;
  userName: string;
  timestamp: number;
  isDeleted?: boolean;
  boardId?: string;
}

export interface WhiteboardCursor {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export interface RoomSecurityInfo {
  roomId: string;
  encryptionAlgorithm: string;
  passphraseHash: string;
  fingerprint: string;
  verificationWords: string[];
  isE2EEActive: boolean;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number; // percentage across screen
  timestamp: number;
}

export type Theme = 'dark' | 'light';
