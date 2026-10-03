// thumbnails.js — mini canvas scenes for PawCade game cards
// Drawn after Sprites loads; each scene receives (ctx, W, H)
window.Thumbs = (() => {

  const SCENES = {};
  function reg(id, fn) { SCENES[id] = fn; }

  // ── tiny helpers ──────────────────────────────────────────────────────
  function bg(ctx, W, H, c0, c1) {
    if (c1) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g;
    } else { ctx.fillStyle = c0; }
    ctx.fillRect(0, 0, W, H);
  }
  function box(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function dot(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function glow(ctx, col, blur) { ctx.shadowColor = col; ctx.shadowBlur = blur; }
  function noGlow(ctx) { ctx.shadowBlur = 0; }
  function spr(name, ctx, x, y, px, flip) {
    if (window.Sprites) Sprites.draw(ctx, name, x, y, px, flip);
  }
  function stars(ctx, W, H, n) {
    for (let i = 0; i < n; i++) {
      const sx = Math.abs(Math.sin(i * 127.1 + 1)) * W;
      const sy = Math.abs(Math.sin(i * 311.7 + 2)) * H;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.abs(Math.sin(i * 73.9)) * 0.5})`;
      ctx.fillRect(sx, sy, Math.abs(Math.sin(i * 53.3)) > 0.7 ? 2 : 1, Math.abs(Math.sin(i * 53.3)) > 0.7 ? 2 : 1);
    }
  }

  // ── snake ─────────────────────────────────────────────────────────────
  reg('snake', (ctx, W, H) => {
    bg(ctx, W, H, '#0d1228', '#111828');
    stars(ctx, W, H, 22);
    ctx.fillStyle = '#1e2a3a';
    for (let x = 0; x < W; x += 14) for (let y = 0; y < H; y += 14) ctx.fillRect(x, y, 13, 13);
    const body = [[3,4],[2,4],[1,4],[0,4]];
    glow(ctx, '#44ee66', 6);
    body.forEach(([c, r]) => { box(ctx, c*14+2, r*14+2, 10, 10, '#2a9e44'); });
    noGlow(ctx);
    spr('cat', ctx, 3*14+7, 4*14+7, 1, false);
    spr('fish', ctx, 7*14+7, 3*14+7, 1, true);
    glow(ctx, '#44cc66', 8);
    ctx.fillStyle = '#44cc66'; ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('× 3', W - 6, 5);
    noGlow(ctx);
  });

  // ── flappy ────────────────────────────────────────────────────────────
  reg('flappy', (ctx, W, H) => {
    bg(ctx, W, H, '#080820', '#12122a');
    stars(ctx, W, H, 28);
    const neb = ctx.createRadialGradient(W*0.5, H*0.3, 0, W*0.5, H*0.3, H*0.5);
    neb.addColorStop(0, 'rgba(78,100,255,.12)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
    box(ctx, 0, H - 18, W, 18, '#2a3a1a');
    box(ctx, 0, H - 20, W, 4, '#1a2a0a');
    const px = W * 0.62, pw = 26, top = H * 0.35, gap = 40;
    glow(ctx, '#44ff88', 8);
    box(ctx, px, 0, pw, top, '#1e5a10');
    box(ctx, px - 3, top - 10, pw + 6, 12, '#164208');
    box(ctx, px, top + gap, pw, H, '#1e5a10');
    box(ctx, px - 3, top + gap - 2, pw + 6, 12, '#164208');
    noGlow(ctx);
    spr('cat', ctx, W * 0.28, H * 0.42, 2, false);
  });

  // ── whack ─────────────────────────────────────────────────────────────
  reg('whack', (ctx, W, H) => {
    bg(ctx, W, H, '#5a3520', '#3a2010');
    for (let y = 0; y < H; y += 18) { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, y, W, 9); }
    [[0.18, 0.3], [0.5, 0.3], [0.82, 0.3], [0.18, 0.7], [0.5, 0.7], [0.82, 0.7]].forEach(([fx, fy], i) => {
      const cx = fx * W, cy = fy * H;
      ctx.fillStyle = '#2a1008'; ctx.beginPath(); ctx.ellipse(cx, cy, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      if (i % 3 !== 1) {
        ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('🐭', cx, cy + 2);
      }
    });
    ctx.fillStyle = '#c8824a'; ctx.fillRect(W * 0.5 - 3, 2, 6, 22);
    box(ctx, W * 0.5 - 10, 2, 20, 12, '#8a4a20');
  });

  // ── memory ────────────────────────────────────────────────────────────
  reg('memory', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    const cols = 4, rows = 3;
    const cw = (W - 10) / cols - 4, ch = (H - 8) / rows - 4;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * (cw + 4) + 6, y = r * (ch + 4) + 4;
      const up = (r === 0 && c === 0) || (r === 1 && c === 2);
      if (up) glow(ctx, '#7ecaff', 8);
      ctx.fillStyle = up ? '#2e2e60' : '#252550';
      ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 4); ctx.fill();
      noGlow(ctx);
      if (up) {
        ctx.font = `${Math.min(cw, ch) * 0.6}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐱', x + cw / 2, y + ch / 2 + 1);
      } else {
        ctx.strokeStyle = '#3a3a66'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x + 3, y + 3, cw - 6, ch - 6, 2); ctx.stroke();
      }
    }
  });

  // ── g2048 ─────────────────────────────────────────────────────────────
  reg('g2048', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e28', '#1b1840');
    const vals = [[2048, 256, 64, 16], [128, 32, 8, 4], [512, 64, 32, 2], [1024, 4, 8, 0]];
    const COLS = { 2: '#ffe8b0', 4: '#ffd27a', 8: '#ffb347', 16: '#ff9a5c', 32: '#ff7e6b',
                   64: '#ff6b9a', 128: '#e07bd8', 256: '#b58cf5', 512: '#8fa2ff',
                   1024: '#6cc1ff', 2048: '#6df0c2' };
    const S = (Math.min(W, H) - 10) / 4 - 3;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = vals[r][c];
      const x = c * (S + 3) + 5, y = r * (S + 3) + 5;
      if (v === 2048) glow(ctx, COLS[v] || '#fff', 10);
      box(ctx, x, y, S, S, v ? (COLS[v] || '#333') : '#2a2860');
      noGlow(ctx);
      if (v) {
        ctx.fillStyle = v >= 8 ? '#1a1030' : '#5a5080';
        ctx.font = `bold ${S * (v >= 1000 ? 0.28 : 0.36)}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v, x + S / 2, y + S / 2);
      }
    }
  });

  // ── wordcat ───────────────────────────────────────────────────────────
  reg('wordcat', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    const rows = [
      { word: 'MEOW', cols: ['#2f9e44', '#e0a100', '#2f9e44', '#e0a100'], glows: ['#44ff66', '#ffcc00', '#44ff66', '#ffcc00'] },
      { word: 'MROW', cols: ['#e0a100', '#2f9e44', '#444', '#444'], glows: ['#ffcc00', '#44ff66', null, null] },
      { word: 'CATS', cols: ['#2f9e44', '#2f9e44', '#2f9e44', '#444'], glows: ['#44ff66', '#44ff66', '#44ff66', null] },
    ];
    const S = 22, gap = 5, ox = (W - (S + gap) * 4 + gap) / 2;
    rows.forEach(({ word, cols, glows }, ri) => {
      const oy = ri * (S + gap) + (H - (S + gap) * 3 + gap) / 2;
      word.split('').forEach((ch, ci) => {
        const x = ci * (S + gap) + ox, y = oy;
        if (glows[ci]) glow(ctx, glows[ci], 8);
        ctx.fillStyle = cols[ci];
        ctx.beginPath(); ctx.roundRect(x, y, S, S, 4); ctx.fill();
        noGlow(ctx);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ch, x + S / 2, y + S / 2);
      });
    });
  });

  // ── zen ───────────────────────────────────────────────────────────────
  reg('zen', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    stars(ctx, W, H, 18);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6);
    g.addColorStop(0, 'rgba(255,179,71,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glow(ctx, '#ffb347', 12);
    spr('cat', ctx, W / 2, H / 2 + 4, 3, false);
    noGlow(ctx);
    [['❤️', 0.2, 0.14], ['💛', 0.76, 0.1], ['🌸', 0.5, 0.08]].forEach(([e, fx, fy]) => {
      ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e, fx * W, fy * H);
    });
  });

  // ── fish ──────────────────────────────────────────────────────────────
  reg('fish', (ctx, W, H) => {
    bg(ctx, W, H, '#04091a', '#08132a');
    for (let y = 0; y < H; y += 16) {
      ctx.fillStyle = y % 32 === 0 ? 'rgba(68,136,232,.12)' : 'rgba(30,74,170,.08)';
      ctx.fillRect(0, y, W, 8);
    }
    [[0.1, 0.5], [0.45, 0.2], [0.82, 0.6]].forEach(([fx, fy]) => dot(ctx, fx * W, fy * H, 3, 'rgba(100,180,255,.4)'));
    glow(ctx, '#7ecaff', 8);
    spr('fish', ctx, W * 0.25, H * 0.28, 2, true);
    spr('fish', ctx, W * 0.72, H * 0.55, 2, false);
    noGlow(ctx);
    spr('cat', ctx, W * 0.48, H - 14, 2, false);
  });

  // ── pong ──────────────────────────────────────────────────────────────
  reg('pong', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#2a2a50'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    glow(ctx, '#ffb347', 8);
    box(ctx, 6, H / 2 - 20, 8, 40, '#ffb347');
    box(ctx, W - 14, H * 0.3 - 20, 8, 40, '#ffb347');
    noGlow(ctx);
    glow(ctx, '#fff', 6);
    dot(ctx, W * 0.62, H * 0.52, 5, '#fff');
    noGlow(ctx);
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('3', W * 0.3, H * 0.18);
    ctx.fillText('2', W * 0.7, H * 0.18);
  });

  // ── breakout ──────────────────────────────────────────────────────────
  reg('breakout', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    const bw = (W - 10) / 7 - 2;
    [['#ff6b9a', '#ff9a5c', '#ffb347', '#6cc1ff', '#44cc88'],
     ['#e07bd8', '#ff6b9a', '#ff9a5c', '#ffb347', '#6cc1ff']
    ].forEach((row, ri) => {
      for (let c = 0; c < 7; c++) {
        if (ri === 0 && c === 3) continue;
        const col = row[c % 5];
        glow(ctx, col, 5);
        box(ctx, c * (bw + 2) + 6, ri * 14 + 6, bw, 10, col);
      }
    });
    for (let c = 0; c < 7; c++) {
      glow(ctx, '#8fa2ff', 5);
      box(ctx, c * (bw + 2) + 6, 2 * 14 + 6, bw, 10, '#8fa2ff');
    }
    noGlow(ctx);
    glow(ctx, '#fff', 6);
    dot(ctx, W * 0.44, H * 0.52, 5, '#fff');
    noGlow(ctx);
    box(ctx, W * 0.28, H - 14, W * 0.44, 7, '#ffb347');
  });

  // ── dash ──────────────────────────────────────────────────────────────
  reg('dash', (ctx, W, H) => {
    bg(ctx, W, H, '#080820', '#12122a');
    stars(ctx, W, H, 24);
    box(ctx, 0, H * 0.75, W, H * 0.25, '#1a2a0a');
    box(ctx, 0, H * 0.75, W, 3, '#0a1a00');
    [[0.12, 0.6], [0.88, 0.55]].forEach(([fx, fy]) => {
      box(ctx, fx * W - 3, fy * H, 6, H * 0.17, '#3a2a0a');
      glow(ctx, '#2d7a20', 6);
      dot(ctx, fx * W, fy * H - 4, 12, '#1d5a10');
      noGlow(ctx);
    });
    spr('cat', ctx, W * 0.22, H * 0.7, 2, false);
    spr('dog', ctx, W * 0.65, H * 0.7, 2, false);
    glow(ctx, '#ffd700', 8);
    spr('coin', ctx, W * 0.44, H * 0.52, 2, false);
    noGlow(ctx);
  });

  // ── simon ─────────────────────────────────────────────────────────────
  reg('simon', (ctx, W, H) => {
    bg(ctx, W, H, '#0a0a0a', '#111');
    const cols = ['#c0392b', '#27ae60', '#2980b9', '#f39c12'];
    const pos = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const S = Math.min(W, H) / 2 - 8;
    pos.forEach(([c, r], i) => {
      const x = c * (S + 8) + (W - S * 2 - 8) / 2;
      const y = r * (S + 8) + (H - S * 2 - 8) / 2;
      if (i === 2) glow(ctx, cols[i], 14);
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.roundRect(x, y, S, S, 6); ctx.fill();
      noGlow(ctx);
      if (i === 2) { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.roundRect(x, y, S, S, 6); ctx.fill(); }
    });
    dot(ctx, W / 2, H / 2, 16, '#111');
    spr('paw', ctx, W / 2, H / 2, 1, false);
  });

  // ── asteroids ─────────────────────────────────────────────────────────
  reg('asteroids', (ctx, W, H) => {
    bg(ctx, W, H, '#020210', '#040412');
    [[0.08,0.08],[0.3,0.05],[0.52,0.18],[0.72,0.06],[0.9,0.22],[0.14,0.42],[0.6,0.32],[0.84,0.48],
     [0.22,0.7],[0.45,0.82],[0.78,0.74]].forEach(([fx, fy]) => {
      ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(fx * 31.7) * 0.3})`; ctx.fillRect(fx * W, fy * H, 2, 2);
    });
    [[0.2, 0.28, 14], [0.76, 0.22, 18], [0.58, 0.68, 11]].forEach(([fx, fy, r]) => {
      ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fx * W, fy * H, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx * W - r * 0.3, fy * H - r * 0.2, r * 0.6, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.save(); ctx.translate(W / 2, H / 2 + 4); ctx.rotate(-0.15);
    glow(ctx, '#ffb347', 10);
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-10, 10); ctx.lineTo(10, 10); ctx.closePath(); ctx.stroke();
    glow(ctx, '#ff6b9a', 8);
    ctx.strokeStyle = '#ff6b9a';
    ctx.beginPath(); ctx.moveTo(-5, 10); ctx.lineTo(0, 18); ctx.lineTo(5, 10); ctx.stroke();
    noGlow(ctx);
    ctx.restore();
  });

  // ── typing ────────────────────────────────────────────────────────────
  reg('typing', (ctx, W, H) => {
    bg(ctx, W, H, '#0d0d1e', '#16162b');
    stars(ctx, W, H, 14);
    [['CAT', 0.5, 0.12, '#ff9a5c'],
     ['FISH', 0.25, 0.32, '#ffb347'],
     ['MEOW', 0.72, 0.28, '#ff6b9a'],
     ['PAW', 0.4, 0.52, '#6cc1ff'],
    ].forEach(([w, fx, fy, col]) => {
      const tw = w.length * 8 + 10;
      ctx.fillStyle = 'rgba(20,20,50,0.7)';
      ctx.beginPath(); ctx.roundRect(fx * W - tw / 2, fy * H - 9, tw, 18, 9); ctx.fill();
      glow(ctx, col, 8);
      ctx.fillStyle = col; ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(w, fx * W, fy * H);
      noGlow(ctx);
    });
    box(ctx, W * 0.04, H * 0.76, W * 0.92, 22, '#1a1a3a');
    const keys = 'QWERTYUIOP'.split('');
    const kw = (W * 0.92 - 8) / keys.length;
    keys.forEach((k, i) => {
      box(ctx, W * 0.04 + 4 + i * kw, H * 0.76 + 3, kw - 2, 16, '#2a2a5a');
      ctx.fillStyle = '#aaa7cf'; ctx.font = '7px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k, W * 0.04 + 4 + i * kw + kw / 2, H * 0.76 + 11);
    });
  });

  // ── slide ─────────────────────────────────────────────────────────────
  reg('slide', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    const vals = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 0, 15]];
    const S = (Math.min(W, H) - 10) / 4 - 3;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = vals[r][c];
      const x = c * (S + 3) + 5, y = r * (S + 3) + 5;
      if (!v) continue;
      const tg = ctx.createLinearGradient(x, y, x + S, y + S);
      tg.addColorStop(0, '#252550'); tg.addColorStop(1, '#1c1c3d');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.roundRect(x, y, S, S, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(126,202,255,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, S, S, 3); ctx.stroke();
      ctx.fillStyle = '#f3f0ff'; ctx.font = `bold ${S * 0.42}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(v, x + S / 2, y + S / 2);
    }
  });

  // ── pong2p ────────────────────────────────────────────────────────────
  reg('pong2p', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#2a2a50'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    glow(ctx, '#ffb347', 8);
    box(ctx, 6, H / 2 - 22, 8, 44, '#ffb347');
    noGlow(ctx);
    glow(ctx, '#ff6b9a', 8);
    box(ctx, W - 14, H / 2 - 18, 8, 36, '#ff6b9a');
    noGlow(ctx);
    glow(ctx, '#fff', 6);
    dot(ctx, W * 0.55, H * 0.42, 5, '#fff');
    noGlow(ctx);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('P1  vs  P2', W / 2, H - 4);
  });

  // ── yarnduel ──────────────────────────────────────────────────────────
  reg('yarnduel', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    box(ctx, 0, H * 0.72, W, H * 0.28, '#1a1a3a');
    box(ctx, 0, H * 0.72, W, 3, '#2a2a5a');
    glow(ctx, '#7ecaff', 8);
    spr('cat', ctx, W * 0.2, H * 0.62, 2, false);
    noGlow(ctx);
    glow(ctx, '#ff6b9a', 8);
    spr('catGray', ctx, W * 0.8, H * 0.62, 2, true);
    noGlow(ctx);
    glow(ctx, '#ff80cc', 10);
    spr('yarn', ctx, W / 2, H * 0.5, 2, false);
    noGlow(ctx);
    ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ff80cc'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W * 0.32, H * 0.6); ctx.lineTo(W * 0.68, H * 0.6); ctx.stroke();
    ctx.setLineDash([]);
  });

  // ── stack ─────────────────────────────────────────────────────────────
  reg('stack', (ctx, W, H) => {
    bg(ctx, W, H, '#080818', '#0e0e20');
    for (let y = 0; y < H; y += 12) { ctx.fillStyle = 'rgba(60,60,120,.2)'; ctx.fillRect(0, y, W, 1); }
    const blocks = [
      { w: 0.82, x: 0.09, y: 0.74, c: '#4ec0f0' },
      { w: 0.66, x: 0.17, y: 0.61, c: '#44cc88' },
      { w: 0.52, x: 0.24, y: 0.48, c: '#ffb347' },
      { w: 0.38, x: 0.31, y: 0.35, c: '#ff6b9a' },
      { w: 0.26, x: 0.37, y: 0.22, c: '#b58cf5' },
    ];
    blocks.forEach(b => {
      glow(ctx, b.c, 8);
      const bg2 = ctx.createLinearGradient(b.x * W, b.y * H, b.x * W, b.y * H + H * 0.11);
      bg2.addColorStop(0, b.c); bg2.addColorStop(1, b.c + '88');
      ctx.fillStyle = bg2;
      ctx.fillRect(b.x * W, b.y * H, b.w * W, H * 0.11);
      noGlow(ctx);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(b.x * W, b.y * H, b.w * W, 3);
    });
    glow(ctx, '#e07bd8', 10);
    box(ctx, W * 0.42, H * 0.08, W * 0.24, H * 0.1, '#e07bd8');
    noGlow(ctx);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px system-ui';
    ctx.textAlign = 'center'; ctx.fillText('→', W * 0.7, H * 0.12);
  });

  // ── darts ─────────────────────────────────────────────────────────────
  reg('darts', (ctx, W, H) => {
    bg(ctx, W, H, '#100e20', '#1a1a2e');
    const cx = W * 0.44, cy = H / 2;
    [{ r: 30, c: '#e03131' }, { r: 23, c: '#f5f5f5' }, { r: 17, c: '#e03131' },
     { r: 11, c: '#f5f5f5' }, { r: 6, c: '#27ae60' }].forEach(({ r, c }) => dot(ctx, cx, cy, r, c));
    glow(ctx, '#27ae60', 8);
    dot(ctx, cx, cy, 3, '#27ae60');
    noGlow(ctx);
    [[cx + 5, cy - 4], [cx + 3, cy + 6], [cx - 10, cy - 12]].forEach(([dx, dy]) => {
      ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + 14, dy + 7); ctx.stroke();
      dot(ctx, dx, dy, 2.5, '#ccc');
    });
    glow(ctx, '#ffb347', 8);
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('50', W * 0.78, cy - 8);
    ctx.fillText('pts', W * 0.78, cy + 8);
    noGlow(ctx);
  });

  // ── tugofwar ──────────────────────────────────────────────────────────
  reg('tugofwar', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    box(ctx, 0, H * 0.72, W, H * 0.28, '#1e3a0a');
    box(ctx, 0, H * 0.72, W, 3, '#1a3a0a');
    const rg = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
    rg.addColorStop(0, '#ff6b9a'); rg.addColorStop(0.5, '#c8824a'); rg.addColorStop(1, '#7ecaff');
    ctx.strokeStyle = rg; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.62); ctx.lineTo(W * 0.9, H * 0.62); ctx.stroke();
    box(ctx, W / 2 - 2, H * 0.55, 4, H * 0.1, '#fff');
    ctx.fillStyle = '#e03131'; ctx.beginPath();
    ctx.moveTo(W / 2 + 2, H * 0.55); ctx.lineTo(W / 2 + 14, H * 0.59); ctx.lineTo(W / 2 + 2, H * 0.63); ctx.fill();
    glow(ctx, '#ff6b9a', 8);
    spr('cat', ctx, W * 0.14, H * 0.6, 2, true);
    noGlow(ctx);
    glow(ctx, '#7ecaff', 8);
    spr('catGray', ctx, W * 0.86, H * 0.6, 2, false);
    noGlow(ctx);
    spr('fish', ctx, W / 2, H * 0.35, 2, false);
  });

  // ── seabattle ─────────────────────────────────────────────────────────
  reg('seabattle', (ctx, W, H) => {
    bg(ctx, W, H, '#04091a', '#07122a');
    const S = (Math.min(W, H) - 8) / 8 - 1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const sg = ctx.createLinearGradient(c*(S+1)+4, r*(S+1)+4, c*(S+1)+4+S, r*(S+1)+4+S);
      if ((r + c) % 2 === 0) { sg.addColorStop(0,'#0d2a5a'); sg.addColorStop(1,'#0a1e3d'); }
      else { sg.addColorStop(0,'#0a1e3d'); sg.addColorStop(1,'#070f22'); }
      ctx.fillStyle = sg; ctx.fillRect(c * (S + 1) + 4, r * (S + 1) + 4, S, S);
    }
    glow(ctx, '#4488e8', 8);
    ctx.fillStyle = 'rgba(68,136,232,.55)';
    [[1, 2], [2, 2], [3, 2], [4, 2]].forEach(([c, r]) => ctx.fillRect(c * (S + 1) + 4, r * (S + 1) + 4, S, S));
    noGlow(ctx);
    [[2, 2, true], [3, 2, true], [5, 1, false], [1, 5, false], [4, 4, true]].forEach(([c, r, hit]) => {
      const cx2 = c * (S + 1) + 4 + S / 2, cy2 = r * (S + 1) + 4 + S / 2;
      if (hit) {
        glow(ctx, '#e03131', 8);
        ctx.strokeStyle = '#e03131'; ctx.lineWidth = 1.5; const d = S * 0.32;
        ctx.beginPath(); ctx.moveTo(cx2-d, cy2-d); ctx.lineTo(cx2+d, cy2+d);
        ctx.moveTo(cx2+d, cy2-d); ctx.lineTo(cx2-d, cy2+d); ctx.stroke();
        noGlow(ctx);
      } else {
        dot(ctx, cx2, cy2, S * 0.28, 'rgba(100,160,255,.5)');
      }
    });
  });

  // ── checkers ──────────────────────────────────────────────────────────
  reg('checkers', (ctx, W, H) => {
    const S = Math.min(W, H) / 8;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const x = c * S, y = r * S;
      const sg = ctx.createLinearGradient(x, y, x + S, y + S);
      if ((r + c) % 2 === 0) { sg.addColorStop(0,'#d4ae7a'); sg.addColorStop(1,'#b8903e'); }
      else { sg.addColorStop(0,'#7a4a30'); sg.addColorStop(1,'#4a2518'); }
      ctx.fillStyle = sg; ctx.fillRect(x, y, S, S);
    }
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      if (r < 3) {
        glow(ctx, '#4488e8', 6);
        dot(ctx, c * S + S / 2, r * S + S / 2, S * 0.38, '#1e4aaa');
        dot(ctx, c * S + S / 2, r * S + S / 2, S * 0.24, '#4488e8');
        noGlow(ctx);
      } else if (r > 4) {
        glow(ctx, '#ffb347', 6);
        dot(ctx, c * S + S / 2, r * S + S / 2, S * 0.38, '#e89038');
        dot(ctx, c * S + S / 2, r * S + S / 2, S * 0.24, '#ffb347');
        noGlow(ctx);
      }
    }
  });

  // ── chess ─────────────────────────────────────────────────────────────
  reg('chess', (ctx, W, H) => {
    const S = Math.min(W, H) / 8;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const x = c * S, y = r * S;
      const sg = ctx.createLinearGradient(x, y, x + S, y + S);
      if ((r + c) % 2 === 0) { sg.addColorStop(0,'#f0d9b5'); sg.addColorStop(1,'#d4b896'); }
      else { sg.addColorStop(0,'#c49a6c'); sg.addColorStop(1,'#8a6040'); }
      ctx.fillStyle = sg; ctx.fillRect(x, y, S, S);
    }
    [['♜',0,0],['♛',3,0],['♚',4,0],['♜',7,0],
     ['♟',0,1],['♟',3,1],['♟',7,1],
     ['♙',0,6],['♙',4,6],['♙',7,6],
     ['♖',0,7],['♕',3,7],['♔',4,7],['♖',7,7]].forEach(([p,c,r]) => {
      if (p === '♔' || p === '♚') glow(ctx, '#ffd700', 10);
      ctx.font = `${S * 0.78}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p, c * S + S / 2, r * S + S / 2 + 1);
      if (p === '♔' || p === '♚') noGlow(ctx);
    });
  });

  // ── catjump ───────────────────────────────────────────────────────────
  reg('catjump', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0828', '#1a1040');
    stars(ctx, W, H, 20);
    [[W/2-24,H*0.75,'#2f9e44'],[W*0.2,H*0.55,'#2f9e44'],[W*0.7,H*0.38,'#e0a100'],[W/2-20,H*0.22,'#ff6b9a']].forEach(([px,py,c])=>{
      glow(ctx, c, 8);
      ctx.fillStyle=c; ctx.beginPath(); ctx.roundRect(px,py,48,8,4); ctx.fill();
      noGlow(ctx);
    });
    for(let i=0;i<8;i++){ctx.fillStyle='rgba(255,255,200,0.6)';ctx.beginPath();ctx.arc(Math.sin(i*2.3)*W*0.4+W/2,i*H/9+10,1.5,0,Math.PI*2);ctx.fill();}
    if(window.Sprites)Sprites.draw(ctx,'cat',W/2,H*0.65,3,false);
  });

  // ── balloon ───────────────────────────────────────────────────────────
  reg('balloon', (ctx, W, H) => {
    bg(ctx, W, H, '#040e1e', '#0d1a2e');
    stars(ctx, W, H, 20);
    [[W*0.25,H*0.35,'#ff6b9a',22],[W*0.65,H*0.22,'#ffb347',18],[W*0.5,H*0.55,'#6cc1ff',20],[W*0.15,H*0.6,'#e07bd8',14]].forEach(([bx,by,col,r])=>{
      glow(ctx, col, 10);
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(bx,by,r,r*1.3,0,0,Math.PI*2); ctx.fill();
      noGlow(ctx);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx,by+r*1.3); ctx.lineTo(bx,by+r*1.3+12); ctx.stroke();
    });
    ctx.font='14px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('\u{1F43E}', W*0.25, H*0.35);
  });

  // ── fishslap ──────────────────────────────────────────────────────────
  reg('fishslap', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0828', '#1a1040');
    ctx.fillStyle = 'rgba(255,179,71,0.12)'; ctx.fillRect(0,0,W,H/2);
    ctx.fillStyle = 'rgba(100,160,255,0.12)'; ctx.fillRect(0,H/2,W,H/2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
    glow(ctx, '#7ecaff', 10);
    if(window.Sprites)Sprites.draw(ctx,'fish',W/2,H/2,3,false);
    noGlow(ctx);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='11px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('P1',W/2,H*0.18); ctx.fillText('P2',W/2,H*0.82);
  });

  // ── gravcat ───────────────────────────────────────────────────────────
  reg('gravcat', (ctx, W, H) => {
    bg(ctx, W, H, '#080814', '#0e0e1e');
    stars(ctx, W, H, 16);
    for(let i=0;i<4;i++){
      const sx=W*0.15+i*(W*0.22); const sh=18+i*8;
      glow(ctx, '#e03131', 8);
      ctx.fillStyle='#e03131';
      ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx+12,sh);ctx.lineTo(sx-12,sh);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(sx,H);ctx.lineTo(sx+12,H-sh);ctx.lineTo(sx-12,H-sh);ctx.closePath();ctx.fill();
      noGlow(ctx);
    }
    if(window.Sprites)Sprites.draw(ctx,'cat',W*0.7,H/2,3,false);
  });

  // ── catpinball ────────────────────────────────────────────────────────
  reg('catpinball', (ctx, W, H) => {
    bg(ctx, W, H, '#0e0e22', '#16162b');
    [[W/2,H*0.32,14,'#ffb347'],[W*0.28,H*0.55,10,'#ff6b9a'],[W*0.72,H*0.55,10,'#6cc1ff']].forEach(([bx,by,r,c])=>{
      glow(ctx, c, 12);
      ctx.fillStyle=c; ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2); ctx.fill();
      noGlow(ctx);
    });
    glow(ctx, '#ffb347', 6);
    ctx.strokeStyle='#ffb347'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(W*0.22,H*0.88); ctx.lineTo(W*0.45,H*0.83); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.78,H*0.88); ctx.lineTo(W*0.55,H*0.83); ctx.stroke();
    noGlow(ctx);
    glow(ctx, '#fff', 8);
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(W/2,H*0.5,7,0,Math.PI*2); ctx.fill();
    noGlow(ctx);
  });

  // ── public ────────────────────────────────────────────────────────────
  function draw(ctx, id, w, h) {
    const fn = SCENES[id];
    const dg = ctx.createLinearGradient(0, 0, 0, h);
    dg.addColorStop(0, '#0e0e22'); dg.addColorStop(1, '#16162b');
    ctx.fillStyle = dg; ctx.fillRect(0, 0, w, h);
    if (fn) fn(ctx, w, h);
  }

  return { draw };
})();
