Pawcade.register({
  id: 'checkers', title: 'Cat Checkers', emoji: '🔴', tags: 'puzzle brain',
  blurb: 'Classic draughts with cats vs fish! You are 🐱, AI is 🐟. Capture all enemy pieces.',
  mount(el, api) {
    const N = 8, CS = 38;
    const CW = N * CS + 2, CH = N * CS + 40;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Click a piece then click a square to move. You = 🐱 (bottom), AI = 🐟 (top)';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    let board, sel, state, msg, raf, turn, particles = [], captureFlash = 0;

    function newBoard() {
      board = Array.from({ length: N }, () => Array(N).fill(0));
      for (let r = 0; r < 3; r++)
        for (let c2 = 0; c2 < N; c2++)
          if ((r + c2) % 2 === 1) board[r][c2] = 2;
      for (let r = 5; r < 8; r++)
        for (let c2 = 0; c2 < N; c2++)
          if ((r + c2) % 2 === 1) board[r][c2] = 1;
    }

    function count(v) {
      let n = 0;
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) if (board[r][c2] === v || board[r][c2] === v + 2) n++;
      return n;
    }

    function reset() {
      newBoard(); sel = null; state = 'play'; turn = 1; msg = 'Your turn'; particles = []; captureFlash = 0;
    }

    function spawnParticles(gx, gy, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4;
        particles.push({ x: gx, y: gy, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color, size: 2+Math.random()*4 });
      }
    }

    function dirs(piece) {
      if (piece === 1) return [[-1, -1], [-1, 1]];
      if (piece === 2) return [[1, -1], [1, 1]];
      return [[-1,-1],[-1,1],[1,-1],[1,1]];
    }

    function getMoves(r, c2, b) {
      const piece = b[r][c2];
      if (!piece) return [];
      const moves = [], captures = [];
      for (const [dr, dc] of dirs(piece)) {
        const nr = r + dr, nc = c2 + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        if (b[nr][nc] === 0) moves.push({ r: nr, c: nc, capture: null });
        else {
          const enemy = b[nr][nc];
          const pr = turn === 1 ? (enemy === 2 || enemy === 4) : (enemy === 1 || enemy === 3);
          if (pr) {
            const jr = nr + dr, jc = nc + dc;
            if (jr >= 0 && jr < N && jc >= 0 && jc < N && b[jr][jc] === 0) {
              captures.push({ r: jr, c: jc, capture: [nr, nc] });
            }
          }
        }
      }
      return captures.length ? captures : moves;
    }

    function allMoves(player, b) {
      const all = [];
      for (let r = 0; r < N; r++)
        for (let c2 = 0; c2 < N; c2++) {
          const p = b[r][c2];
          if ((player === 1 && (p === 1 || p === 3)) || (player === 2 && (p === 2 || p === 4))) {
            getMoves(r, c2, b).forEach(m => all.push({ from: [r, c2], to: m }));
          }
        }
      const caps = all.filter(m => m.to.capture);
      return caps.length ? caps : all;
    }

    function applyMove(b, fr, fc, to) {
      const nb = b.map(r => [...r]);
      const piece = nb[fr][fc];
      nb[to.r][to.c] = piece;
      nb[fr][fc] = 0;
      if (to.capture) nb[to.capture[0]][to.capture[1]] = 0;
      if (piece === 1 && to.r === 0) nb[to.r][to.c] = 3;
      if (piece === 2 && to.r === N - 1) nb[to.r][to.c] = 4;
      return nb;
    }

    function tryMove(toR, toC) {
      if (!sel) return;
      const [sr, sc] = sel;
      const moves = getMoves(sr, sc, board);
      const m = moves.find(m => m.r === toR && m.c === toC);
      if (!m) { sel = null; return; }
      if (m.capture) {
        const cx = m.capture[1] * CS + CS/2 + 1;
        const cy = m.capture[0] * CS + CS/2 + 4;
        spawnParticles(cx, cy, '#ff6b9a', 18);
        spawnParticles(cx, cy, '#ffd700', 8);
        captureFlash = 8;
      }
      board = applyMove(board, sr, sc, m);
      api.beep(m.capture ? 500 : 380, .05);
      sel = null;
      if (count(2) === 0) { msg = '🏆 You win! All fish eaten!'; state = 'over'; api.score(count(1) * 10); return; }
      turn = 2; msg = 'AI thinking…';
      setTimeout(aiTurn, 400);
    }

    function scoreBoard(b) {
      let s = 0;
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) {
        const p = b[r][c2];
        if (p === 2) s += 10; else if (p === 4) s += 16;
        else if (p === 1) s -= 10; else if (p === 3) s -= 16;
      }
      return s;
    }

    function minimax(b, depth, max) {
      const moves = allMoves(max ? 2 : 1, b);
      if (depth === 0 || !moves.length) return { s: scoreBoard(b) };
      let best = max ? -Infinity : Infinity;
      let bestMove = null;
      for (const m of moves) {
        const nb = applyMove(b, m.from[0], m.from[1], m.to);
        const val = minimax(nb, depth - 1, !max).s;
        if (max && val > best) { best = val; bestMove = m; }
        if (!max && val < best) { best = val; bestMove = m; }
      }
      return { s: best, m: bestMove };
    }

    function aiTurn() {
      if (state !== 'play') return;
      const result = minimax(board, 3, true);
      if (!result.m) { msg = '🐱 AI has no moves — You win!'; state = 'over'; api.score(count(1) * 10); return; }
      const { from: [fr, fc], to } = result.m;
      if (to.capture) {
        const cx = to.capture[1] * CS + CS/2 + 1;
        const cy = to.capture[0] * CS + CS/2 + 4;
        spawnParticles(cx, cy, '#7ecaff', 18);
        captureFlash = 8;
      }
      board = applyMove(board, fr, fc, to);
      api.beep(to.capture ? 350 : 280, .05);
      if (count(1) === 0) { msg = '😿 All your cats were eaten! Try again.'; state = 'over'; return; }
      turn = 1; msg = 'Your turn';
    }

    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('pointerdown', e => {
      if (state === 'over') { reset(); return; }
      if (turn !== 1) return;
      const r2 = c.getBoundingClientRect();
      const cx2 = (e.clientX - r2.left) * (CW / r2.width);
      const cy2 = (e.clientY - r2.top) * (CH / r2.height) - 4;
      const col = Math.floor(cx2 / CS), row = Math.floor(cy2 / CS);
      if (row < 0 || row >= N || col < 0 || col >= N) return;
      if (sel) {
        tryMove(row, col);
      } else {
        const p = board[row][col];
        if (p === 1 || p === 3) {
          const moves = getMoves(row, col, board);
          if (moves.length) { sel = [row, col]; api.beep(460, .03); }
        }
      }
    });

    function draw() {
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, CH);
      grad.addColorStop(0, '#0d1240');
      grad.addColorStop(1, '#12122a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, CW, CH);

      // Outer board glow
      ctx.shadowBlur = 24; ctx.shadowColor = '#3a2a6a';
      ctx.fillStyle = '#1a1040';
      ctx.beginPath(); ctx.roundRect(0, 4, CW, N*CS, 8); ctx.fill();
      ctx.shadowBlur = 0;

      if (captureFlash > 0) captureFlash--;
      const selMoves = sel ? getMoves(sel[0], sel[1], board) : [];

      for (let r = 0; r < N; r++) {
        for (let c2 = 0; c2 < N; c2++) {
          const x = c2 * CS + 1, y = r * CS + 4;
          const light = (r + c2) % 2 === 0;
          // Board squares with subtle gradient
          if (light) {
            const lg = ctx.createLinearGradient(x, y, x, y+CS);
            lg.addColorStop(0, '#d4ae7a'); lg.addColorStop(1, '#b8903e');
            ctx.fillStyle = lg;
          } else {
            const dg = ctx.createLinearGradient(x, y, x, y+CS);
            dg.addColorStop(0, '#7a4a30'); dg.addColorStop(1, '#4a2518');
            ctx.fillStyle = dg;
          }
          ctx.fillRect(x, y, CS, CS);

          // selected highlight
          if (sel && sel[0] === r && sel[1] === c2) {
            ctx.shadowBlur = 16; ctx.shadowColor = '#ffd600';
            ctx.fillStyle = 'rgba(255,214,0,.4)';
            ctx.fillRect(x, y, CS, CS);
            ctx.shadowBlur = 0;
          }
          // valid move dots
          if (selMoves.some(m => m.r === r && m.c === c2)) {
            ctx.fillStyle = 'rgba(80,255,120,.3)';
            ctx.fillRect(x, y, CS, CS);
            ctx.shadowBlur = 8; ctx.shadowColor = '#4ef07c';
            ctx.fillStyle = 'rgba(78,240,124,.8)';
            ctx.beginPath(); ctx.arc(x+CS/2, y+CS/2, 7, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          }

          const p = board[r][c2];
          if (p) {
            const emoji = p === 1 ? '🐱' : p === 2 ? '🐟' : p === 3 ? '😻' : '🐠';
            const isKing = p === 3 || p === 4;
            if (isKing) { ctx.shadowBlur = 14; ctx.shadowColor = '#ffd700'; }
            else if (captureFlash > 0 && !light) { ctx.shadowBlur = 10; ctx.shadowColor = '#ff6b9a'; }
            ctx.font = `${CS - 10}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + CS/2, y + CS/2);
            ctx.shadowBlur = 0;
          }
        }
      }

      // Particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.055;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // HUD pill
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(0, N*CS+4, CW, 36, 0); ctx.fill();

      // Piece counts
      ctx.font = 'bold 13px system-ui'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7ecaff'; ctx.textAlign = 'left';
      ctx.shadowBlur = 8; ctx.shadowColor = '#7ecaff';
      ctx.fillText(`🐱 ×${count(1)}`, 8, N*CS+22);
      ctx.fillStyle = '#ff6b9a';
      ctx.shadowColor = '#ff6b9a';
      ctx.textAlign = 'right';
      ctx.fillText(`${count(2)}× 🐟`, CW-8, N*CS+22);
      ctx.shadowBlur = 0;

      // Message
      ctx.fillStyle = turn === 1 ? '#ffd700' : 'rgba(255,255,255,0.7)';
      ctx.font = '12px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(msg, CW/2, N*CS+22);

      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,15,.7)'; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(CW/2-100, CH/2-34, 200, 60, 14); ctx.fill();
        ctx.strokeStyle = '#7ecaff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(CW/2-100, CH/2-34, 200, 60, 14); ctx.stroke();
        ctx.shadowBlur = 18; ctx.shadowColor = '#7ecaff';
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(msg, CW/2, CH/2-12);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '12px system-ui';
        ctx.fillText('Tap to play again', CW/2, CH/2+16);
      }

      raf = requestAnimationFrame(draw);
    }

    reset(); draw();
    return () => cancelAnimationFrame(raf);
  }
});
