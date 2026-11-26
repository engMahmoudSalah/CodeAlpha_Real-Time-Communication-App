// Meetly realtime backend for Cloudflare Workers: auth (HMAC tokens, PBKDF2 users in KV), room check, and a
// Socket.IO v4 (Engine.IO v4, WebSocket only) compatible signaling hub in one Durable Object. Rooms live in memory.
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const rid = (p) => p + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);

async function hmacKey(env) { return crypto.subtle.importKey("raw", enc.encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
async function sign(env, user) {
  const body = b64u(enc.encode(JSON.stringify({ ...user, exp: Date.now() + 7 * 864e5 })));
  const sig = b64u(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(body)));
  return body + "." + sig;
}
async function verify(env, token) {
  try {
    const [body, sig] = token.split(".");
    if (!(await crypto.subtle.verify("HMAC", await hmacKey(env), unb64u(sig), enc.encode(body)))) return null;
    const u = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return u.exp > Date.now() ? u : null;
  } catch { return null; }
}
async function pbkdf2(pw, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return b64u(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256));
}
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, avatarColor: u.avatarColor, isGuest: !!u.isGuest });
const clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

async function limited(req, kind, max, winMs) {
  const ip = req.headers.get("cf-connecting-ip") || "x", win = Math.floor(Date.now() / winMs);
  const key = new Request("https://rl.invalid/" + kind + "/" + encodeURIComponent(ip) + "/" + win);
  try {
    const hit = await caches.default.match(key);
    const n = (hit ? parseInt(await hit.text(), 10) || 0 : 0) + 1;
    await caches.default.put(key, new Response(String(n), { headers: { "cache-control": "max-age=" + Math.ceil(winMs / 1000 + 60) } }));
    return n > max;
  } catch { return false; }
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (p.startsWith("/socket.io")) return env.HUB.get(env.HUB.idFromName("hub")).fetch(req);
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    const hub = () => env.HUB.get(env.HUB.idFromName("hub"));
    if (p === "/api/health") return hub().fetch(new Request("https://hub/health"));
    if (p.startsWith("/api/rooms/check/")) return hub().fetch(new Request("https://hub/check/" + encodeURIComponent(p.split("/").pop().trim().toLowerCase())));
    if (p === "/api/auth/me") {
      const u = await verify(env, (req.headers.get("authorization") || "").replace(/^Bearer /, ""));
      return u ? J({ user: pub(u) }) : J({ error: "Not authenticated" }, 401);
    }
    if (req.method !== "POST") return J({ error: "not_found" }, 404);
    let b = {}; try { b = await req.json(); } catch {}
    if ((p === "/api/auth/login" || p === "/api/auth/register" || p === "/api/auth/guest") && await limited(req, p.split("/").pop(), p.endsWith("guest") ? 40 : 12, 6e5)) return J({ error: "Too many attempts. Wait a few minutes." }, 429);
    if (p === "/api/auth/guest") {
      const name = clip(b.name, 40) || "Guest_" + Math.floor(1000 + Math.random() * 9000);
      const u = { id: rid("gst"), name, email: name.toLowerCase().replace(/\s+/g, "") + "@guest.local", avatarColor: /^#[0-9a-f]{6}$/i.test(b.avatarColor) ? b.avatarColor : "#10b981", isGuest: true };
      return J({ token: await sign(env, u), user: pub(u) });
    }
    if (p === "/api/auth/register") {
      const name = clip(b.name, 40), email = clip(b.email, 120).toLowerCase(), pw = String(b.password || "");
      if (!name || !email || !pw) return J({ error: "Name, email, and password are required" }, 400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || pw.length < 6) return J({ error: "Invalid email or password too short" }, 400);
      if (await env.USERS.get("u:" + email)) return J({ error: "An account with this email already exists" }, 400);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const u = { id: rid("usr"), name, email, avatarColor: /^#[0-9a-f]{6}$/i.test(b.avatarColor) ? b.avatarColor : "#6366f1", isGuest: false, salt: b64u(salt), hash: await pbkdf2(pw, salt) };
      await env.USERS.put("u:" + email, JSON.stringify(u));
      return J({ token: await sign(env, u), user: pub(u) });
    }
    if (p === "/api/auth/login") {
      const email = clip(b.email, 120).toLowerCase(), raw = await env.USERS.get("u:" + email);
      if (!raw || !b.password) return J({ error: "Invalid email or password" }, 401);
      const u = JSON.parse(raw);
      if ((await pbkdf2(String(b.password), unb64u(u.salt))) !== u.hash) return J({ error: "Invalid email or password" }, 401);
      return J({ token: await sign(env, u), user: pub(u) });
    }
    if (p === "/api/invite") return J({ error: "Email invitations are not available on this deployment. Copy the room link instead." }, 501);
    return J({ error: "not_found" }, 404);
  },
};

export class Hub {
  constructor() { this.sockets = new Map(); this.rooms = new Map(); }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.hostname === "hub") {
      if (url.pathname === "/health") return J({ status: "ok", activeRooms: this.rooms.size, timestamp: Date.now() });
      const r = this.rooms.get(decodeURIComponent(url.pathname.split("/").pop()));
      return J(r ? { exists: true, name: r.name, participantCount: r.participants.size, hasPassword: !!r.pw } : { exists: false, participantCount: 0, hasPassword: false });
    }
    if (req.headers.get("upgrade") !== "websocket") return new Response("websocket only", { status: 400 });
    const pair = new WebSocketPair(), ws = pair[1];
    ws.accept();
    const sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    const s = { sid, ws, room: null, user: null };
    this.sockets.set(sid, s);
    ws.send("0" + JSON.stringify({ sid, upgrades: [], pingInterval: 25000, pingTimeout: 60000, maxPayload: 5e7 }));
    ws.addEventListener("message", (e) => { try { this.onMsg(s, typeof e.data === "string" ? e.data : ""); } catch (err) { /* keep socket alive */ } });
    s.timer = setInterval(() => { try { ws.send("2"); } catch {} }, 25000);
    const gone = () => { clearInterval(s.timer); this.onClose(s); };
    ws.addEventListener("close", gone); ws.addEventListener("error", gone);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  send(s, ev, data) { try { s.ws.send("42" + JSON.stringify([ev, data])); } catch {} }
  toRoom(roomId, ev, data, exceptSid) { const r = this.rooms.get(roomId); if (!r) return; for (const sid of r.participants.keys()) if (sid !== exceptSid) { const t = this.sockets.get(sid); if (t) this.send(t, ev, data); } }
  onMsg(s, m) {
    if (m === "2") return s.ws.send("3");
    if (m === "3" || m === "1") { if (m === "1") s.ws.close(); return; }
    if (m === "40" || m.startsWith("40{") || m.startsWith("40,")) return s.ws.send("40" + JSON.stringify({ sid: s.sid }));
    if (!m.startsWith("42")) return;
    const rest = m.slice(2), i = rest.indexOf("["), ackId = i > 0 ? rest.slice(0, i) : null;
    const [ev, a, b] = JSON.parse(rest.slice(i));
    const ack = (d) => { if (ackId != null) s.ws.send("43" + ackId + JSON.stringify([d])); };
    this.handle(s, ev, a, typeof a === "function" ? null : b, ack);
  }
  async handle(s, ev, d, _b, ack) {
    d = d || {};
    const room = s.room && this.rooms.get(s.room);
    switch (ev) {
      case "room:join": {
        const roomId = String(d.roomId || "").trim().toLowerCase().slice(0, 64), user = d.user;
        if (!roomId || !user || !user.id) return ack({ success: false, error: "Invalid room or user info" });
        let r = this.rooms.get(roomId);
        if (r && r.pw) {
          if (!d.password) return ack({ success: false, error: "Room password required" });
          if ((await pbkdf2(String(d.password), r.salt)) !== r.pw) return ack({ success: false, error: "Incorrect room password" });
        }
        if (!r) {
          r = { id: roomId, name: "Meeting " + roomId, createdBy: user.id, participants: new Map(), wb: [], chat: [], files: [] };
          if (d.password) { r.salt = crypto.getRandomValues(new Uint8Array(16)); r.pw = await pbkdf2(String(d.password), r.salt); }
          this.rooms.set(roomId, r);
        }
        const isHost = r.participants.size === 0 || r.createdBy === user.id;
        const part = { socketId: s.sid, userId: String(user.id), name: String(user.name || "Guest").slice(0, 40), avatarColor: user.avatarColor || "#6366f1", isHost, isMuted: false, isVideoOff: false, isScreenSharing: false, joinedAt: Date.now() };
        r.participants.set(s.sid, part); s.room = roomId; s.user = part;
        this.toRoom(roomId, "user:joined", { participant: part }, s.sid);
        return ack({ success: true, isHost, participants: [...r.participants.values()].filter((x) => x.socketId !== s.sid), whiteboardHistory: r.wb, chatHistory: r.chat.slice(-50),
          sharedFiles: r.files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, senderId: f.senderId, senderName: f.senderName, isEncrypted: f.isEncrypted, iv: f.iv, timestamp: f.timestamp, hasDataUrl: !!f.dataUrl })) });
      }
      case "signal:offer": { const t = this.sockets.get(d.toSocketId); if (t && s.room && t.room === s.room) this.send(t, ev, { fromSocketId: s.sid, fromUserId: s.user && s.user.userId, offer: d.offer }); return; }
      case "signal:answer": { const t = this.sockets.get(d.toSocketId); if (t && s.room && t.room === s.room) this.send(t, ev, { fromSocketId: s.sid, fromUserId: s.user && s.user.userId, answer: d.answer }); return; }
      case "signal:ice-candidate": { const t = this.sockets.get(d.toSocketId); if (t && s.room && t.room === s.room) this.send(t, ev, { fromSocketId: s.sid, candidate: d.candidate }); return; }
      case "media:toggle": {
        if (!room || !s.user) return;
        for (const k of ["isMuted", "isVideoOff", "isScreenSharing"]) if (typeof d[k] === "boolean") s.user[k] = d[k];
        return this.toRoom(s.room, "media:state-change", { socketId: s.sid, userId: s.user.userId, isMuted: s.user.isMuted, isVideoOff: s.user.isVideoOff, isScreenSharing: s.user.isScreenSharing });
      }
      case "whiteboard:action": {
        if (!room) return;
        if (d.type === "clear") room.wb = []; else { room.wb.push(d); if (room.wb.length > 2000) room.wb.shift(); }
        return this.toRoom(s.room, ev, d, s.sid);
      }
      case "whiteboard:cursor": if (room && s.user) this.toRoom(s.room, ev, { socketId: s.sid, userId: s.user.userId, userName: s.user.name, color: s.user.avatarColor, x: d.x, y: d.y }, s.sid); return;
      case "chat:message": {
        if (!room || !s.user) return;
        const rec = { id: rid("msg"), roomId: s.room, senderId: s.user.userId, senderName: s.user.name, avatarColor: s.user.avatarColor, text: String(d.text || "").slice(0, 20000), isEncrypted: !!d.isEncrypted, iv: d.iv, timestamp: Date.now() };
        room.chat.push(rec); if (room.chat.length > 300) room.chat.shift();
        this.toRoom(s.room, ev, rec); return ack({ success: true, message: rec });
      }
      case "file:share": {
        if (!room || !s.user) return;
        const f = { id: rid("file"), name: String(d.name || "file").slice(0, 200), size: d.size, type: d.type, senderId: s.user.userId, senderName: s.user.name, dataUrl: d.dataUrl, isEncrypted: !!d.isEncrypted, iv: d.iv, timestamp: Date.now() };
        room.files.push(f); if (room.files.length > 50) room.files.shift();
        this.toRoom(s.room, "file:shared", { id: f.id, name: f.name, size: f.size, type: f.type, senderId: f.senderId, senderName: f.senderName, dataUrl: f.dataUrl, isEncrypted: f.isEncrypted, iv: f.iv, timestamp: f.timestamp });
        return ack({ success: true, fileId: f.id });
      }
      case "file:download-request": { const f = room && room.files.find((x) => x.id === d.fileId); return ack(f && f.dataUrl ? { success: true, dataUrl: f.dataUrl } : { success: false, error: "File data unavailable" }); }
      case "reaction:send": if (room && s.user) this.toRoom(s.room, "reaction:received", { senderName: s.user.name, emoji: String(d.emoji || "").slice(0, 8), timestamp: Date.now() }); return;
      case "host:action": {
        if (!room || !s.user || !s.user.isHost) return;
        const t = this.sockets.get(d.targetSocketId);
        if (t && t.room === s.room) { if (d.action === "mute") this.send(t, "host:muted-you"); else if (d.action === "kick") this.send(t, "host:kicked-you"); }
        return;
      }
    }
  }
  onClose(s) {
    if (!this.sockets.delete(s.sid)) return;
    const r = s.room && this.rooms.get(s.room);
    if (r) {
      r.participants.delete(s.sid);
      this.toRoom(s.room, "user:left", { socketId: s.sid, userId: s.user && s.user.userId, name: s.user && s.user.name });
      if (!r.participants.size) setTimeout(() => { const c = this.rooms.get(s.room); if (c && !c.participants.size) this.rooms.delete(s.room); }, 15 * 60 * 1000);
    }
  }
}
