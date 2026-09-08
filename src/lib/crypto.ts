/**
 * End-to-End Encryption (E2EE) utilities using standard Web Crypto API (AES-GCM-256 & PBKDF2)
 */

// Cache derived CryptoKey in memory
const keyCache = new Map<string, CryptoKey>();

/**
 * Derives an AES-GCM 256-bit CryptoKey from a roomId and optional passphrase using PBKDF2
 */
export async function deriveRoomKey(roomId: string, passphrase: string = ''): Promise<CryptoKey> {
  const cacheKey = `${roomId}:${passphrase}`;
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  const encoder = new TextEncoder();
  const secretMaterial = `${roomId}-fakka-e2ee-secret-${passphrase || 'default-room-key'}`;
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secretMaterial),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Deterministic salt based on roomId
  const salt = encoder.encode(`salt-e2ee-${roomId.padEnd(16, '0')}`);

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, key);
  return key;
}

/**
 * Encrypts a plaintext string with AES-GCM-256
 */
export async function encryptData(
  text: string,
  key: CryptoKey
): Promise<{ cipherText: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  const cipherText = bufferToBase64(new Uint8Array(encryptedBuffer));
  const ivString = bufferToBase64(iv);

  return { cipherText, iv: ivString };
}

/**
 * Decrypts AES-GCM-256 ciphertext using IV and key
 */
export async function decryptData(
  cipherText: string,
  ivString: string,
  key: CryptoKey
): Promise<string> {
  try {
    const iv = base64ToBuffer(ivString);
    const encryptedBuffer = base64ToBuffer(cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Failed to decrypt data payload (possibly different key):', err);
    return '[Encrypted content - Key mismatch]';
  }
}

/**
 * Generates cryptographic fingerprint and security words for the room
 */
export async function generateSecurityFingerprint(
  roomId: string,
  passphrase: string = ''
): Promise<{
  fingerprint: string;
  verificationWords: string[];
}> {
  const encoder = new TextEncoder();
  const combined = `${roomId}:${passphrase || 'open'}:e2ee-v1`;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(combined));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Human readable safety words (similar to Signal/WhatsApp safety verification)
  const wordList = [
    'Falcon', 'Cipher', 'Shield', 'Nexus', 'Vertex', 'Quartz', 'Beacon', 'Zenith',
    'Echo', 'Apex', 'Matrix', 'Orbit', 'Pulse', 'Prism', 'Vortex', 'Starlight',
    'Horizon', 'Aurora', 'Titan', 'Cosmos', 'Helios', 'Vector', 'Solace', 'Aegis'
  ];

  const words: string[] = [];
  for (let i = 0; i < 4; i++) {
    const byte = hashArray[i * 4] % wordList.length;
    words.push(wordList[byte]);
  }

  // Format fingerprint as 4-character blocks: 82a1 94bc ...
  const formattedFingerprint = hex.match(/.{1,4}/g)?.slice(0, 8).join(' ') || hex.slice(0, 32);

  return {
    fingerprint: formattedFingerprint.toUpperCase(),
    verificationWords: words,
  };
}

// Helpers for buffer to base64 conversions
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
