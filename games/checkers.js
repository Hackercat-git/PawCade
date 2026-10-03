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

    // 0=empty, 1=player, 2=AI, 3=player king, 4=AI king
    let board, sel, state, msg, raf, turn, playerPcs, aiPcs;

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
      newBoard(); sel = null; state = 'play'; turn = 1; msg = 'Your turn';
    }

    function dirs(piece) {
      if (piece === 1) return [[-1, -1], [-1, 1]];
      if (piece === 2) return [[1, -1], [1, 1]];
      return [[-1,-1],[-1,1],[1,-1],[1,1]]; // king
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
          const isEnemy = (piece <= 2 && enemy && enemy !== piece && !(enemy === piece + 2) && !(enemy + 2 === piece)) ||
                          (piece >= 3 && enemy && enemy !== piece);
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
      // force captures
      const caps = all.filter(m => m.to.capture);
      return caps.length ? caps : all;
    }

    function applyMove(b, fr, fc, to) {
      const nb = b.map(r => [...r]);
      const piece = nb[fr][fc];
      nb[to.r][to.c] = piece;
      nb[fr][fc] = 0;
      if (to.capture) nb[to.capture[0]][to.capture[1]] = 0;
      // king
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
      board = applyMove(board, sr, sc, m);
      api.beep(m.capture ? 500 : 380, .05);
      sel = null;
      if (count(2) === 0) { msg = '🏆 You win! All fish eaten!'; state = 'over'; api.score(count(1) * 10); return; }
      turn = 2; msg = 'AI thinking…';
      setTimeout(aiTurn, 400);
    }

    function score(b) {
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
      if (depth === 0 || !moves.length) return { s: score(b) };
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
      board = applyMove(board, fr, fc, to);
      api.beep(to.capture ? 350 : 280, .05);
      if (count(1) === 0) { msg = '😿 All your cats were eaten! Try again.'; state = 'over'; return; }
      turn = 1; msg = 'Your turn';
    }

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
      const cs2 = getComputedStyle(el);
      const bg = cs2.getPropertyValue('--bg').trim();
      const accent = cs2.getPropertyValue('--accent').trim();
      const ink = cs2.getPropertyValue('--ink').trim();
      const line = cs2.getPropertyValue('--line').trim();

      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

      const selMoves = sel ? getMoves(sel[0], sel[1], board) : [];

      for (let r = 0; r < N; r++) {
        for (let c2 = 0; c2 < N; c2++) {
          const x = c2 * CS + 1, y = r * CS + 4;
          const light = (r + c2) % 2 === 0;
          ctx.fillStyle = light ? '#c8a46e' : '#6b3e2a';
          ctx.fillRect(x, y, CS, CS);

          // highlight selected
          if (sel && sel[0] === r && sel[1] === c2) {
            ctx.fillStyle = 'rgba(255,230,0,.35)';
            ctx.fillRect(x, y, CS, CS);
          }
          // highlight valid moves
          if (selMoves.some(m => m.r === r && m.c === c2)) {
            ctx.fillStyle = 'rgba(100,255,100,.35)';
            ctx.fillRect(x, y, CS, CS);
            ctx.strokeStyle = '#4c4'; ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, CS - 2, CS - 2);
          }

          const p = board[r][c2];
          if (p) {
            const emoji = p === 1 ? '🐱' : p === 2 ? '🐟' : p === 3 ? '😻' : '🐠';
            ctx.font = `${CS - 8}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + CS/2, y + CS/2);
          }
        }
      }

      // counts & message
      ctx.fillStyle = ink; ctx.font = '12px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`🐱 ×${count(1)}`, 4, N * CS + 10);
      ctx.textAlign = 'right';
      ctx.fillText(`${count(2)}× 🐟`, CW - 4, N * CS + 10);
      ctx.textAlign = 'center';
      ctx.fillText(msg, CW / 2, N * CS + 10);

      raf = requestAnimationFrame(draw);
    }

    reset(); draw();
    return () => cancelAnimationFrame(raf);
  }
});
