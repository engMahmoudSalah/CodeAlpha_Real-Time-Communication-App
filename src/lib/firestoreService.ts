import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, ChatMessage, SharedFile, WhiteboardAction } from '../types';

export interface RoomRecord {
  id: string;
  name: string;
  createdBy: string;
  createdByName?: string;
  isProtected: boolean;
  invitees?: string[]; // Array of emails
  participantCount?: number;
  lastActiveAt: number;
  createdAt: number;
}

/**
 * Sync user profile with Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        isGuest: user.isGuest,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore user profile sync error:', error);
  }
}

/**
 * Sign in with Email & Password via Firebase Auth + Firestore
 */
export async function firebaseSignIn(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = cred.user;

  let avatarColor = '#6366f1';
  let displayName = fbUser.displayName || email.split('@')[0];

  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      displayName = data.name || displayName;
      avatarColor = data.avatarColor || avatarColor;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  const appUser: User = {
    id: fbUser.uid,
    name: displayName,
    email: fbUser.email || email,
    avatarColor,
    isGuest: false,
  };

  await syncUserProfile(appUser);
  return appUser;
}

/**
 * Register new user with Email & Password via Firebase Auth + Firestore
 */
export async function firebaseSignUp(
  name: string,
  email: string,
  pass: string,
  avatarColor: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = cred.user;

  if (name) {
    await updateProfile(fbUser, { displayName: name });
  }

  const appUser: User = {
    id: fbUser.uid,
    name: name.trim(),
    email: fbUser.email || email,
    avatarColor: avatarColor || '#6366f1',
    isGuest: false,
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...appUser,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Firestore user registration record failed:', err);
  }

  return appUser;
}

/**
 * Anonymous / Guest Login via Firebase Auth
 */
export async function firebaseGuestSignIn(name: string, avatarColor: string): Promise<User> {
  const cred = await signInAnonymously(auth);
  const fbUser = cred.user;

  const guestName = name?.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
  await updateProfile(fbUser, { displayName: guestName });

  const appUser: User = {
    id: fbUser.uid,
    name: guestName,
    email: `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.local`,
    avatarColor: avatarColor || '#10b981',
    isGuest: true,
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...appUser,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Guest profile write to Firestore warning:', err);
  }

  return appUser;
}

/**
 * Sign in with Google via Firebase Auth + Firestore
 */
export async function firebaseGoogleSignIn(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  const fbUser = cred.user;

  let avatarColor = '#4f46e5';
  let displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User';

  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      displayName = data.name || displayName;
      avatarColor = data.avatarColor || avatarColor;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  const appUser: User = {
    id: fbUser.uid,
    name: displayName,
    email: fbUser.email || `${fbUser.uid}@google.user`,
    avatarColor,
    isGuest: false,
  };

  await syncUserProfile(appUser);
  return appUser;
}

/**
 * Sign out of Firebase Auth
 */
export async function firebaseSignOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Persist room document to Firestore
 */
export async function persistRoomRecord(
  roomId: string,
  createdBy: string,
  createdByName: string,
  isProtected: boolean,
  invitees: string[] = []
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId.toLowerCase());
    const dataToSave: Partial<RoomRecord> = {
      id: roomId.toLowerCase(),
      name: `Room ${roomId.toUpperCase()}`,
      createdBy,
      createdByName,
      isProtected,
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
    };

    if (invitees && invitees.length > 0) {
      dataToSave.invitees = invitees;
    }

    await setDoc(roomRef, dataToSave, { merge: true });
  } catch (e) {
    console.warn('Failed to persist room record to Firestore:', e);
  }
}

export async function inviteUserToRoom(roomId: string, email: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId.toLowerCase());
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const data = snap.data() as RoomRecord;
      const currentInvitees = data.invitees || [];
      if (!currentInvitees.includes(email.toLowerCase())) {
        currentInvitees.push(email.toLowerCase());
        await updateDoc(roomRef, { invitees: currentInvitees });
      }
    }
  } catch (err) {
    console.warn('Failed to update room invitees:', err);
  }
}

export function subscribeToUserRooms(userEmail: string, userId: string, callback: (rooms: RoomRecord[]) => void): Unsubscribe {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const allRooms = snapshot.docs.map(doc => doc.data() as RoomRecord);
      const userRooms = allRooms.filter(r => 
        r.createdBy === userId || (r.invitees && r.invitees.includes(userEmail.toLowerCase()))
      );
      callback(userRooms);
    }, (error) => {
      console.warn('Error fetching user rooms:', error);
    });
  } catch (e) {
    console.warn('Failed to subscribe to user rooms:', e);
    return () => {};
  }
}

/**
 * Real-time subscription to active/recent rooms from Firestore
 */
export function subscribeToRecentRooms(callback: (rooms: RoomRecord[]) => void): Unsubscribe {
  try {
    const roomsCol = collection(db, 'rooms');
    const q = query(roomsCol, orderBy('lastActiveAt', 'desc'), limit(10));
    return onSnapshot(
      q,
      (snapshot) => {
        const rooms: RoomRecord[] = [];
        snapshot.forEach((d) => {
          rooms.push(d.data() as RoomRecord);
        });
        callback(rooms);
      },
      (err) => {
        console.warn('Firestore recent rooms listener warning:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore query error:', e);
    return () => {};
  }
}

/**
 * Save chat message to Firestore room subcollection
 */
export async function persistChatMessage(roomId: string, message: ChatMessage): Promise<void> {
  try {
    const msgRef = doc(db, 'rooms', roomId.toLowerCase(), 'messages', message.id);
    await setDoc(msgRef, {
      id: message.id,
      roomId: roomId.toLowerCase(),
      senderId: message.senderId,
      senderName: message.senderName,
      avatarColor: message.avatarColor,
      text: message.text,
      isEncrypted: message.isEncrypted,
      iv: message.iv || null,
      timestamp: message.timestamp || Date.now(),
    });

    // Update room's lastActiveAt
    await updateDoc(doc(db, 'rooms', roomId.toLowerCase()), {
      lastActiveAt: Date.now(),
    }).catch(() => {});
  } catch (e) {
    console.warn('Failed to persist chat message in Firestore:', e);
  }
}

/**
 * Real-time subscription to room chat messages in Firestore
 */
export function subscribeToRoomMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  try {
    const messagesCol = collection(db, 'rooms', roomId.toLowerCase(), 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          msgs.push(d.data() as ChatMessage);
        });
        callback(msgs);
      },
      (err) => {
        console.warn('Firestore messages listener warning:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribeToRoomMessages error:', e);
    return () => {};
  }
}

/**
 * Save file metadata to Firestore room subcollection
 */
export async function persistSharedFileMetadata(roomId: string, file: SharedFile): Promise<void> {
  try {
    const fileRef = doc(db, 'rooms', roomId.toLowerCase(), 'files', file.id);
    await setDoc(fileRef, {
      id: file.id,
      roomId: roomId.toLowerCase(),
      name: file.name,
      size: file.size,
      type: file.type,
      senderId: file.senderId,
      senderName: file.senderName,
      isEncrypted: file.isEncrypted,
      iv: file.iv || null,
      timestamp: file.timestamp || Date.now(),
    });

    await updateDoc(doc(db, 'rooms', roomId.toLowerCase()), {
      lastActiveAt: Date.now(),
    }).catch(() => {});
  } catch (e) {
    console.warn('Failed to persist shared file in Firestore:', e);
  }
}

/**
 * Real-time subscription to room shared files in Firestore
 */
export function subscribeToRoomFiles(
  roomId: string,
  callback: (files: SharedFile[]) => void
): Unsubscribe {
  try {
    const filesCol = collection(db, 'rooms', roomId.toLowerCase(), 'files');
    const q = query(filesCol, orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: SharedFile[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SharedFile);
        });
        callback(list);
      },
      (err) => {
        console.warn('Firestore files listener warning:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribeToRoomFiles error:', e);
    return () => {};
  }
}

/**
 * Save whiteboard action to Firestore
 */
export async function persistWhiteboardAction(roomId: string, action: WhiteboardAction): Promise<void> {
  try {
    if (action.type === 'clear') {
      // Clear all strokes for this room in Firestore
      const wbCol = collection(db, 'rooms', roomId.toLowerCase(), 'whiteboard');
      const snaps = await getDocs(wbCol);
      for (const d of snaps.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      return;
    }

    if (action.isDeleted || action.type === 'delete') {
      const strokeRef = doc(db, 'rooms', roomId.toLowerCase(), 'whiteboard', action.id);
      await deleteDoc(strokeRef).catch(() => {});
      return;
    }

    const strokeRef = doc(db, 'rooms', roomId.toLowerCase(), 'whiteboard', action.id);
    await setDoc(strokeRef, {
      ...action,
      timestamp: action.timestamp || Date.now(),
    });
  } catch (e) {
    console.warn('Failed to persist whiteboard action in Firestore:', e);
  }
}

/**
 * Real-time subscription to room whiteboard in Firestore
 */
export function subscribeToRoomWhiteboard(
  roomId: string,
  callback: (actions: WhiteboardAction[]) => void
): Unsubscribe {
  try {
    const wbCol = collection(db, 'rooms', roomId.toLowerCase(), 'whiteboard');
    const q = query(wbCol, orderBy('timestamp', 'asc'), limit(500));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: WhiteboardAction[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as WhiteboardAction);
        });
        callback(list);
      },
      (err) => {
        console.warn('Firestore whiteboard listener warning:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribeToRoomWhiteboard error:', e);
    return () => {};
  }
}
