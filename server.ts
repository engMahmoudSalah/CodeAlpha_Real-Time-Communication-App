import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-replace-in-production';

// Lazy initialized email sender
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatarColor: string;
  isGuest: boolean;
  createdAt: number;
}

interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

interface WhiteboardAction {
  id: string;
  type: 'draw' | 'line' | 'rect' | 'circle' | 'arrow' | 'text' | 'clear';
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  userId: string;
  userName: string;
  timestamp: number;
}

interface ChatMessageRecord {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  text: string; // Encrypted or plain
  isEncrypted: boolean;
  iv?: string;
  timestamp: number;
}

interface SharedFileRecord {
  id: string;
  roomId: string;
  name: string;
  size: number;
  type: string;
  senderId: string;
  senderName: string;
  dataUrl?: string; // Stored for small/medium files in room
  isEncrypted: boolean;
  iv?: string;
  timestamp: number;
}

// In-memory data structures (live runtime state)
const users = new Map<string, UserRecord>(); // email or id -> user
const rooms = new Map<string, {
  id: string;
  name: string;
  passwordHash?: string;
  createdBy: string;
  createdAt: number;
  participants: Map<string, RoomParticipant>; // socketId -> participant
  whiteboardActions: WhiteboardAction[];
  chatMessages: ChatMessageRecord[];
  sharedFiles: SharedFileRecord[];
}>();

function generateToken(user: { id: string; name: string; email: string; avatarColor: string; isGuest: boolean }): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      isGuest: user.isGuest,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyAuthHeader(req: express.Request): { id: string; name: string; email: string; avatarColor: string; isGuest: boolean } | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      timestamp: Date.now(),
    });
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, avatarColor } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const lowerEmail = email.toLowerCase().trim();
      if (users.has(lowerEmail)) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: lowerEmail,
        passwordHash,
        avatarColor: avatarColor || '#6366f1',
        isGuest: false,
        createdAt: Date.now(),
      };

      users.set(lowerEmail, user);
      users.set(user.id, user);

      const token = generateToken(user);
      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
          isGuest: false,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Unknown error') });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const lowerEmail = email.toLowerCase().trim();
      const user = users.get(lowerEmail);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user);
      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
          isGuest: false,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // Invite endpoint
  app.post('/api/invite', async (req, res) => {
    try {
      const { roomId, inviterName, inviteeEmail, roomName } = req.body;
      if (!roomId || !inviteeEmail) {
        return res.status(400).json({ error: 'Room ID and Invitee Email are required' });
      }

      const host = req.headers.host || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : `${protocol}://${host}`);
      const joinLink = `${origin}/?room=${encodeURIComponent(roomId)}`;
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 22px;">Meetly Video Conference</h2>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            <strong>${inviterName || 'A colleague'}</strong> has invited you to join an end-to-end encrypted video conference session.
          </p>
          ${roomName ? `<p style="color: #475569; font-size: 15px; margin: 12px 0;"><strong>Meeting:</strong> ${roomName}</p>` : ''}
          <div style="margin: 28px 0;">
            <a href="${joinLink}" style="background-color: #000000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Join Meeting Now
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            Or copy and paste this link into your browser:<br>
            <a href="${joinLink}" style="color: #4f46e5; word-break: break-all;">${joinLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Secured with WebRTC P2P Mesh & WebCrypto</p>
        </div>
      `;

      const client = getResendClient();
      if (client) {
        try {
          await client.emails.send({
            from: 'Meetly Meetings <onboarding@resend.dev>',
            to: inviteeEmail,
            subject: `${inviterName || 'Someone'} invited you to a Meetly session`,
            html: emailHtml,
          });
          return res.json({ success: true, message: 'Invitation email dispatched successfully' });
        } catch (err: any) {
          console.error('Resend error:', err);
          return res.json({ success: true, message: 'Invite registered. (Email service warning: ' + err.message + ')', joinLink });
        }
      } else {
        // Return success with direct joinLink when external mailer is not configured
        return res.json({ success: true, message: 'Invitation link ready', joinLink });
      }
    } catch (err: any) {
      console.error('Invite error:', err);
      return res.status(500).json({ error: 'Failed to process invitation' });
    }
  });

  // Auth: Guest Join
  app.post('/api/auth/guest', (req, res) => {
    const { name, avatarColor } = req.body;
    const guestName = (name && name.trim()) || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const guestUser: UserRecord = {
      id: `gst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: guestName,
      email: `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.local`,
      avatarColor: avatarColor || '#10b981',
      isGuest: true,
      createdAt: Date.now(),
    };

    users.set(guestUser.id, guestUser);
    const token = generateToken(guestUser);

    return res.json({
      token,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        email: guestUser.email,
        avatarColor: guestUser.avatarColor,
        isGuest: true,
      },
    });
  });

  // Auth: Me
  app.get('/api/auth/me', (req, res) => {
    const authUser = verifyAuthHeader(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: authUser });
  });

  // Rooms: check status
  app.get('/api/rooms/check/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.json({
        exists: false,
        participantCount: 0,
        hasPassword: false,
      });
    }
    return res.json({
      exists: true,
      name: room.name,
      participantCount: room.participants.size,
      hasPassword: !!room.passwordHash,
    });
  });

  // Setup Socket.IO Signaling and Real-time Communication
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 5e7, // 50MB for data transfer fallback
  });

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null;
    let currentUser: { id: string; name: string; avatarColor: string } | null = null;

    // Join room
    socket.on('room:join', async ({ roomId, user, password }, callback) => {
      try {
        if (!roomId || !user) {
          if (callback) callback({ success: false, error: 'Invalid room or user info' });
          return;
        }

        const cleanRoomId = roomId.trim().toLowerCase();
        let room = rooms.get(cleanRoomId);

        // Verify password if protected
        if (room && room.passwordHash) {
          if (!password) {
            if (callback) callback({ success: false, error: 'Room password required' });
            return;
          }
          const valid = await bcrypt.compare(password, room.passwordHash);
          if (!valid) {
            if (callback) callback({ success: false, error: 'Incorrect room password' });
            return;
          }
        }

        // Create room if new
        if (!room) {
          let passwordHash: string | undefined = undefined;
          if (password) {
            passwordHash = await bcrypt.hash(password, 10);
          }
          room = {
            id: cleanRoomId,
            name: `Meeting ${cleanRoomId}`,
            passwordHash,
            createdBy: user.id,
            createdAt: Date.now(),
            participants: new Map(),
            whiteboardActions: [],
            chatMessages: [],
            sharedFiles: [],
          };
          rooms.set(cleanRoomId, room);
        }

        const isHost = room.participants.size === 0 || room.createdBy === user.id;

        const participant: RoomParticipant = {
          socketId: socket.id,
          userId: user.id,
          name: user.name,
          avatarColor: user.avatarColor || '#6366f1',
          isHost,
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
          joinedAt: Date.now(),
        };

        room.participants.set(socket.id, participant);
        currentRoomId = cleanRoomId;
        currentUser = user;

        socket.join(cleanRoomId);

        // Notify existing members
        socket.to(cleanRoomId).emit('user:joined', {
          participant,
        });

        // Send room state to the joiner
        const existingParticipants = Array.from(room.participants.values()).filter(
          (p) => p.socketId !== socket.id
        );

        if (callback) {
          callback({
            success: true,
            isHost,
            participants: existingParticipants,
            whiteboardHistory: room.whiteboardActions,
            chatHistory: room.chatMessages.slice(-50),
            sharedFiles: room.sharedFiles.map(f => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              senderId: f.senderId,
              senderName: f.senderName,
              isEncrypted: f.isEncrypted,
              iv: f.iv,
              timestamp: f.timestamp,
              hasDataUrl: !!f.dataUrl
            })),
          });
        }
      } catch (err: any) {
        console.error('Error joining room:', err);
        if (callback) callback({ success: false, error: 'Failed to join room: ' + err.message });
      }
    });

    // WebRTC Signaling: Offer
    socket.on('signal:offer', ({ toSocketId, offer }) => {
      io.to(toSocketId).emit('signal:offer', {
        fromSocketId: socket.id,
        fromUserId: currentUser?.id,
        offer,
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal:answer', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('signal:answer', {
        fromSocketId: socket.id,
        fromUserId: currentUser?.id,
        answer,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal:ice-candidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('signal:ice-candidate', {
        fromSocketId: socket.id,
        candidate,
      });
    });

    // Media toggle (mic, camera, screen share)
    socket.on('media:toggle', ({ isMuted, isVideoOff, isScreenSharing }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        if (typeof isMuted === 'boolean') participant.isMuted = isMuted;
        if (typeof isVideoOff === 'boolean') participant.isVideoOff = isVideoOff;
        if (typeof isScreenSharing === 'boolean') participant.isScreenSharing = isScreenSharing;

        io.to(currentRoomId).emit('media:state-change', {
          socketId: socket.id,
          userId: participant.userId,
          isMuted: participant.isMuted,
          isVideoOff: participant.isVideoOff,
          isScreenSharing: participant.isScreenSharing,
        });
      }
    });

    // Whiteboard drawing stroke
    socket.on('whiteboard:action', (action: WhiteboardAction) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (action.type === 'clear') {
        room.whiteboardActions = [];
      } else {
        room.whiteboardActions.push(action);
        // Cap history to prevent unbounded growth
        if (room.whiteboardActions.length > 2000) {
          room.whiteboardActions.shift();
        }
      }

      socket.to(currentRoomId).emit('whiteboard:action', action);
    });

    // Whiteboard cursor pointer coordinate tracking
    socket.on('whiteboard:cursor', ({ x, y }) => {
      if (!currentRoomId || !currentUser) return;
      socket.to(currentRoomId).emit('whiteboard:cursor', {
        socketId: socket.id,
        userId: currentUser.id,
        userName: currentUser.name,
        color: currentUser.avatarColor,
        x,
        y,
      });
    });

    // Chat message (E2EE encrypted or standard)
    socket.on('chat:message', (msg: { text: string; isEncrypted: boolean; iv?: string }, callback) => {
      if (!currentRoomId || !currentUser) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const chatRecord: ChatMessageRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roomId: currentRoomId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatarColor: currentUser.avatarColor,
        text: msg.text,
        isEncrypted: !!msg.isEncrypted,
        iv: msg.iv,
        timestamp: Date.now(),
      };

      room.chatMessages.push(chatRecord);
      if (room.chatMessages.length > 300) {
        room.chatMessages.shift();
      }

      io.to(currentRoomId).emit('chat:message', chatRecord);
      if (callback) callback({ success: true, message: chatRecord });
    });

    // File sharing metadata & fallback transfer
    socket.on('file:share', (fileData: { name: string; size: number; type: string; dataUrl?: string; isEncrypted: boolean; iv?: string }, callback) => {
      if (!currentRoomId || !currentUser) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const fileRecord: SharedFileRecord = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roomId: currentRoomId,
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        senderId: currentUser.id,
        senderName: currentUser.name,
        dataUrl: fileData.dataUrl,
        isEncrypted: !!fileData.isEncrypted,
        iv: fileData.iv,
        timestamp: Date.now(),
      };

      room.sharedFiles.push(fileRecord);
      if (room.sharedFiles.length > 50) {
        room.sharedFiles.shift();
      }

      // Broadcast to room
      io.to(currentRoomId).emit('file:shared', {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        type: fileRecord.type,
        senderId: fileRecord.senderId,
        senderName: fileRecord.senderName,
        dataUrl: fileRecord.dataUrl,
        isEncrypted: fileRecord.isEncrypted,
        iv: fileRecord.iv,
        timestamp: fileRecord.timestamp,
      });

      if (callback) callback({ success: true, fileId: fileRecord.id });
    });

    // Request full file data (if needed on demand)
    socket.on('file:download-request', ({ fileId }, callback) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const file = room.sharedFiles.find((f) => f.id === fileId);
      if (file && file.dataUrl) {
        if (callback) callback({ success: true, dataUrl: file.dataUrl });
      } else {
        if (callback) callback({ success: false, error: 'File data unavailable' });
      }
    });

    // Live emoji reactions (flying reactions)
    socket.on('reaction:send', ({ emoji }) => {
      if (!currentRoomId || !currentUser) return;
      io.to(currentRoomId).emit('reaction:received', {
        senderName: currentUser.name,
        emoji,
        timestamp: Date.now(),
      });
    });

    // Host controls: Mute participant or kick
    socket.on('host:action', ({ action, targetSocketId }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const requester = room.participants.get(socket.id);
      if (!requester || !requester.isHost) return;

      if (action === 'mute' && targetSocketId) {
        io.to(targetSocketId).emit('host:muted-you');
      } else if (action === 'kick' && targetSocketId) {
        io.to(targetSocketId).emit('host:kicked-you');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const participant = room.participants.get(socket.id);
          room.participants.delete(socket.id);

          io.to(currentRoomId).emit('user:left', {
            socketId: socket.id,
            userId: participant?.userId,
            name: participant?.name,
          });

          // Clean up empty rooms after 15 minutes of inactivity
          if (room.participants.size === 0) {
            setTimeout(() => {
              const currentCheck = rooms.get(currentRoomId!);
              if (currentCheck && currentCheck.participants.size === 0) {
                rooms.delete(currentRoomId!);
              }
            }, 15 * 60 * 1000);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Real-Time Conference Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
