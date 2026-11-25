// usage: node deploy-assets.mjs <workerName> <distDir> [spa|404]  (env CF_TOKEN, CF_ACCOUNT)
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [name, dir, mode = 'spa'] = process.argv.slice(2);
const T = process.env.CF_TOKEN, A = process.env.CF_ACCOUNT, B = `https://api.cloudflare.com/client/v4/accounts/${A}`;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.mp4':'video/mp4','.gif':'image/gif' };
const files = {}; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : (files['/' + path.relative(dir, p).split(path.sep).join('/')] = p); } })(dir);
const manifest = {}, byHash = {};
for (const [url, p] of Object.entries(files)) { const buf = fs.readFileSync(p); const ext = path.extname(p).slice(1); const hash = crypto.createHash('sha256').update(buf.toString('base64') + ext).digest('hex').slice(0, 32); manifest[url] = { hash, size: buf.length }; byHash[hash] = { p, type: mime[path.extname(p)] || 'application/octet-stream' }; }
const j = async (r) => { const t = await r.json(); if (!t.success && !t.jwt) { console.error(JSON.stringify(t.errors || t)); process.exit(1); } return t; };
const s = await j(await fetch(`${B}/workers/scripts/${name}/assets-upload-session`, { method: 'POST', headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ manifest }) }));
let jwt = s.result.jwt;
for (const bucket of s.result.buckets || []) {
  const fd = new FormData();
  for (const h of bucket) fd.append(h, new Blob([fs.readFileSync(byHash[h].p).toString('base64')], { type: byHash[h].type }), h);
  const u = await j(await fetch(`${B}/workers/assets/upload?base64=true`, { method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body: fd }));
  if (u.result && u.result.jwt) jwt = u.result.jwt;
}
const meta = { main_module: 'worker.js', assets: { jwt, config: { not_found_handling: 'single-page-application', run_worker_first: ['/api/*', '/socket.io/*'] } }, compatibility_date: '2026-06-30', compatibility_flags: ['nodejs_compat'], keep_bindings: ['secret_text'],
  bindings: [{ type: 'assets', name: 'ASSETS' }, { type: 'durable_object_namespace', name: 'HUB', class_name: 'Hub' }, { type: 'kv_namespace', name: 'USERS', namespace_id: process.env.KV_ID }].concat(process.env.JWT_FILE ? [{ type: 'secret_text', name: 'JWT_SECRET', text: fs.readFileSync(process.env.JWT_FILE, 'utf8') }] : []),
  migrations: { tag: 'v1', new_sqlite_classes: ['Hub'] } };
const fd = new FormData(); fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' })); fd.append('worker.js', new Blob([fs.readFileSync(process.env.WORKER_JS)], { type: 'application/javascript+module' }), 'worker.js');
const r = await j(await fetch(`${B}/workers/scripts/${name}`, { method: 'PUT', headers: { Authorization: `Bearer ${T}` }, body: fd }));
console.log('deployed', name, Object.keys(files).length, 'files', r.result && r.result.deployment_id);
