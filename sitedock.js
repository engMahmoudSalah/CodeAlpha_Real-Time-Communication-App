/* Personal footer strip: LinkedIn, GitHub, portfolio + link to /by-mahmoud.html */
(function () {
  if (window.__siteDock) return; window.__siteDock = 1;
  var L = [
    ["LinkedIn", "https://www.linkedin.com/in/mahmod-salah", '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.5H3zM10 9.75h3.8v1.6h.06c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.66 4.8 6.13v5.77h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.32-1.96 2.69v5.19h-4z"/>'],
    ["GitHub", "https://github.com/engMahmoudSalah", '<path d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/>'],
    ["Portfolio", "https://md.mahmodsalah.workers.dev/", '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3.1a15 15 0 0 0-1.2-5.2A8 8 0 0 1 18.9 11zM12 4c.9 1.2 1.7 3.2 1.8 7h-3.6C10.3 7.2 11.1 5.2 12 4zM9.4 5.8A15 15 0 0 0 8.2 11H5.1a8 8 0 0 1 4.3-5.2zM5.1 13h3.1c.1 1.9.5 3.7 1.2 5.2A8 8 0 0 1 5.1 13zm5.1 0h3.6c-.1 3.8-.9 5.8-1.8 7-.9-1.2-1.7-3.2-1.8-7zm4.4 5.2c.7-1.5 1.1-3.3 1.2-5.2h3.1a8 8 0 0 1-4.3 5.2z"/>']
  ];
  function lum(c) { var m = c.match(/\d+(\.\d+)?/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; }
  function dark() {
    var els = [document.body, document.documentElement];
    for (var i = 0; i < els.length; i++) { var l = lum(getComputedStyle(els[i]).backgroundColor); if (l !== null) return l < 0.5; }
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function build() {
    if (document.querySelector("[data-sitedock]")) return;
    var d = dark(), bg = d ? "#0b1220" : "#f1f5f9", fg = d ? "#e2e8f0" : "#1e293b", br = d ? "#334155" : "#cbd5e1", chip = d ? "#172033" : "#ffffff";
    var n = document.createElement("div"); n.setAttribute("data-sitedock", "1");
    n.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 18px;box-sizing:border-box;width:100%;padding:16px;background:" + bg + ";border-top:1px solid " + br + ";font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;direction:ltr;";
    var row = document.createElement("div"); row.style.cssText = "display:flex;gap:10px;";
    L.forEach(function (x) {
      var a = document.createElement("a"); a.href = x[1]; a.target = "_blank"; a.rel = "noopener"; a.title = x[0]; a.setAttribute("aria-label", x[0]);
      a.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' + x[2] + "</svg>";
      a.style.cssText = "display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;border:1px solid " + br + ";background:" + chip + ";color:" + fg + ";text-decoration:none;box-sizing:border-box;";
      row.appendChild(a);
    });
    var more = document.createElement("a"); more.href = "/by-mahmoud"; more.textContent = "By Mahmoud: all projects";
    more.style.cssText = "color:" + fg + ";text-decoration:underline;text-underline-offset:3px;";
    n.appendChild(row); n.appendChild(more); document.body.appendChild(n);
    function pad() {
      var need = 0, all = document.body.querySelectorAll("*");
      for (var i = 0; i < all.length && i < 3000; i++) { var e = all[i]; if (n.contains(e)) continue; var cs = getComputedStyle(e); if (cs.position === "fixed" && cs.display !== "none") { var r = e.getBoundingClientRect(); if (r.height > 0 && r.height < 300 && innerHeight - r.bottom < 140) need = Math.max(need, r.height + 40); } }
      n.style.paddingBottom = (16 + need) + "px";
    }
    function last() { if (document.body.lastElementChild !== n && !(document.body.lastElementChild && document.body.lastElementChild.tagName === "SCRIPT" && document.body.lastElementChild.previousElementSibling === n)) document.body.appendChild(n); }
    pad(); setTimeout(pad, 2500); setTimeout(pad, 6000);
    new MutationObserver(function () { last(); }).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(build, 300); }); else setTimeout(build, 300);
})();

/* Ambient 3D visuals: drifting particles plus a slowly rotating wireframe solid. Canvas only, no assets. */
(function () {
  if (window.__vis) return; window.__vis = 1;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function lum(c) { var m = c && c.match(/\d+(\.\d+)?/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; }
  function isDark() { var l = [document.body, document.documentElement, document.querySelector("#root>*"), document.querySelector("main")]; for (var i = 0; i < l.length; i++) { if (!l[i]) continue; var v = lum(getComputedStyle(l[i]).backgroundColor); if (v !== null) return v < 0.5; } return matchMedia("(prefers-color-scheme: dark)").matches; }
  function accent() {
    var els = document.querySelectorAll("a[class],button[class]"), best = null, bs = 0;
    for (var i = 0; i < els.length && i < 60; i++) { var c = getComputedStyle(els[i]).backgroundColor, m = c.match(/\d+(\.\d+)?/g); if (!m || (m.length > 3 && +m[3] < 0.6)) continue; var mx = Math.max(m[0], m[1], m[2]), mn = Math.min(m[0], m[1], m[2]), s = mx - mn; if (s > bs) { bs = s; best = [+m[0], +m[1], +m[2]]; } }
    return bs > 50 ? best : [99, 102, 241];
  }
  function start() {
    var cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true"); cv.setAttribute("data-vis", "1");
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:.55";
    document.body.appendChild(cv);
    var x = cv.getContext("2d"), W, H, dpr = Math.min(devicePixelRatio || 1, 2), dark = isDark(), ac = accent();
    function rgba(a) { return "rgba(" + ac[0] + "," + ac[1] + "," + ac[2] + "," + a + ")"; }
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener("resize", size);
    var N = W < 600 ? 22 : 42, P = [];
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * .8 + .2, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
    var t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    var E = []; for (var a = 0; a < 12; a++) for (var b = a + 1; b < 12; b++) { var d = Math.hypot(V[a][0] - V[b][0], V[a][1] - V[b][1], V[a][2] - V[b][2]); if (Math.abs(d - 2) < .01) E.push([a, b]); }
    var ang = 0, mx = 0, my = 0;
    addEventListener("pointermove", function (e) { mx = e.clientX / W - .5; my = e.clientY / H - .5; }, { passive: true });
    function frame() {
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) { var p = P[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        for (var j = i + 1; j < N; j++) { var q = P[j], dx = p.x - q.x, dy = p.y - q.y, dd = dx * dx + dy * dy; if (dd < 11000) { x.strokeStyle = rgba(.16 * (1 - dd / 11000)); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); } }
        x.fillStyle = rgba(.5 * p.z); x.beginPath(); x.arc(p.x, p.y, 1.6 * p.z, 0, 6.283); x.fill(); }
      var R = W < 600 ? 46 : 78, cx = W - R - 22, cy = H - R - 90 - (W < 600 ? 40 : 0), ay = ang + mx * 1.2, ax = ang * .6 + my * 1.2, sy = Math.sin(ay), cy2 = Math.cos(ay), sx = Math.sin(ax), cx2 = Math.cos(ax);
      var pr = V.map(function (v) { var X = v[0] * cy2 + v[2] * sy, Z = -v[0] * sy + v[2] * cy2, Y = v[1] * cx2 - Z * sx; Z = v[1] * sx + Z * cx2; var s = 3.2 / (3.2 + Z * .3); return [cx + X * s * R / 1.9, cy + Y * s * R / 1.9, Z]; });
      x.lineWidth = 1.1;
      E.forEach(function (e) { var A = pr[e[0]], B = pr[e[1]], dz = (A[2] + B[2]) / 2; x.strokeStyle = rgba(.28 + .22 * (1 - (dz + 2) / 4)); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); });
      pr.forEach(function (v) { x.fillStyle = rgba(.75); x.beginPath(); x.arc(v[0], v[1], 2, 0, 6.283); x.fill(); });
      x.lineWidth = 1; ang += .006;
    }
    if (reduce) { frame(); return; }
    var run = true; document.addEventListener("visibilitychange", function () { run = !document.hidden; if (run) loop(); });
    function loop() { if (!run) return; frame(); requestAnimationFrame(loop); }
    loop();
  }
  function go() { (window.requestIdleCallback || function (f) { setTimeout(f, 800); })(start); }
  if (document.readyState === "complete") go(); else addEventListener("load", go);
})();
