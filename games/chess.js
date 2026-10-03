Pawcade.register({
  id: 'chess', title: 'Cat Chess', emoji: '♟️', tags: 'puzzle brain',
  blurb: 'Chess with cat pieces! You play white 🐱, AI plays black 🐟. Checkmate the enemy king!',
  mount(el, api) {
    const N = 8, CS = 42;
    const CW = N * CS + 2, CH = N * CS + 44;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Click a piece, then click a square to move.';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    // Pieces: uppercase = white, lowercase = black
    // K/k=king, Q/q=queen, R/r=rook, B/b=bishop, N/n=knight, P/p=pawn
    const W_EMOJI = { K:'😻', Q:'🐱', R:'🏠', B:'🧶', N:'🐈', P:'🐾' };
    const B_EMOJI = { k:'😾', q:'🐟', r:'⚓', b:'🎣', n:'🐠', p:'🐡' };

    let board, sel, state, msg, raf, turn, moveCount;
    let enPassant, castling, promoted;

    function startBoard() {
      return [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R'],
      ];
    }

    function reset() {
      board = startBoard();
      sel = null; state = 'play'; turn = 'w'; msg = 'Your turn (white)';
      enPassant = null;
      castling = { wK: true, wR0: true, wR7: true, bK: true, bR0: true, bR7: true };
      moveCount = 0;
    }

    function isWhite(p) { return p && p === p.toUpperCase(); }
    function isBlack(p) { return p && p === p.toLowerCase(); }
    function isEnemy(a, b2) { return a && b2 && isWhite(a) !== isWhite(b2); }
    function isEmpty(r, c2) { return !board[r][c2]; }
    function inBounds(r, c2) { return r >= 0 && r < N && c2 >= 0 && c2 < N; }

    function rawMoves(r, c2, b, ep) {
      const p = b[r][c2]; if (!p) return [];
      const moves = [];
      const t = p.toUpperCase();
      const white = isWhite(p);
      const dir = white ? -1 : 1;

      const slide = (drs, dcs) => {
        for (let i = 0; i < drs.length; i++) {
          let nr = r + drs[i], nc = c2 + dcs[i];
          while (inBounds(nr, nc)) {
            if (b[nr][nc]) { if (isEnemy(p, b[nr][nc])) moves.push([nr, nc]); break; }
            moves.push([nr, nc]);
            nr += drs[i]; nc += dcs[i];
          }
        }
      };

      if (t === 'P') {
        const nr = r + dir;
        if (inBounds(nr, c2) && !b[nr][c2]) {
          moves.push([nr, c2]);
          const start = white ? 6 : 1;
          if (r === start && !b[r + dir * 2][c2]) moves.push([r + dir * 2, c2]);
        }
        for (const dc of [-1, 1]) {
          const nc = c2 + dc;
          if (inBounds(nr, nc)) {
            if (b[nr][nc] && isEnemy(p, b[nr][nc])) moves.push([nr, nc]);
            if (ep && ep[0] === nr && ep[1] === nc) moves.push([nr, nc]); // en passant
          }
        }
      }
      if (t === 'N') {
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
          const nr = r + dr, nc = c2 + dc;
          if (inBounds(nr, nc) && !(!isEnemy(p, b[nr][nc]) && b[nr][nc])) moves.push([nr, nc]);
        }
      }
      if (t === 'B') slide([-1,-1,1,1],[-1,1,-1,1]);
      if (t === 'R') slide([-1,1,0,0],[0,0,-1,1]);
      if (t === 'Q') { slide([-1,-1,1,1],[-1,1,-1,1]); slide([-1,1,0,0],[0,0,-1,1]); }
      if (t === 'K') {
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          const nr = r + dr, nc = c2 + dc;
          if (inBounds(nr, nc) && !(b[nr][nc] && !isEnemy(p, b[nr][nc]))) moves.push([nr, nc]);
        }
      }
      return moves;
    }

    function findKing(b2, white) {
      const k = white ? 'K' : 'k';
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) if (b2[r][c2] === k) return [r, c2];
      return null;
    }

    function isAttacked(b2, r, c2, byWhite) {
      for (let pr = 0; pr < N; pr++) for (let pc = 0; pc < N; pc++) {
        const p = b2[pr][pc];
        if (!p) continue;
        if (isWhite(p) !== byWhite) continue;
        if (rawMoves(pr, pc, b2, null).some(([mr, mc]) => mr === r && mc === c2)) return true;
      }
      return false;
    }

    function inCheck(b2, white) {
      const kpos = findKing(b2, white);
      return kpos && isAttacked(b2, kpos[0], kpos[1], !white);
    }

    function applyMove(b2, fr, fc, tr, tc, ep) {
      const nb = b2.map(r => [...r]);
      const p = nb[fr][fc];
      nb[tr][tc] = p; nb[fr][fc] = 0;
      // promotion
      if (p === 'P' && tr === 0) nb[tr][tc] = 'Q';
      if (p === 'p' && tr === 7) nb[tr][tc] = 'q';
      // en passant capture
      if (p === 'P' && ep && tr === ep[0] && tc === ep[1]) nb[tr + 1][tc] = 0;
      if (p === 'p' && ep && tr === ep[0] && tc === ep[1]) nb[tr - 1][tc] = 0;
      return nb;
    }

    function legalMoves(r, c2) {
      const p = board[r][c2]; if (!p) return [];
      const white = isWhite(p);
      return rawMoves(r, c2, board, enPassant).filter(([tr, tc]) => {
        const nb = applyMove(board, r, c2, tr, tc, enPassant);
        return !inCheck(nb, white);
      });
    }

    function allLegal(white) {
      const moves = [];
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) {
        const p = board[r][c2];
        if (p && isWhite(p) === white) {
          legalMoves(r, c2).forEach(([tr, tc]) => moves.push({ fr: r, fc: c2, tr, tc }));
        }
      }
      return moves;
    }

    function doMove(fr, fc, tr, tc) {
      const p = board[fr][fc];
      const white = isWhite(p);
      const newEP = (p === 'P' && fr - tr === 2) ? [fr - 1, fc] :
                    (p === 'p' && tr - fr === 2) ? [fr + 1, fc] : null;
      board = applyMove(board, fr, fc, tr, tc, enPassant);
      enPassant = newEP;
      moveCount++;
    }

    function evalBoard(b2) {
      const VAL = { P: 1, N: 3, B: 3.2, R: 5, Q: 9, K: 100 };
      let s = 0;
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) {
        const p = b2[r][c2]; if (!p) continue;
        const v = VAL[p.toUpperCase()] || 0;
        s += isWhite(p) ? -v : v;
      }
      return s;
    }

    function minimax(b2, depth, alpha, beta, maxing, ep) {
      const white = !maxing;
      const moves = [];
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) {
        const p = b2[r][c2];
        if (!p || isWhite(p) !== !white) continue;
        rawMoves(r, c2, b2, ep).forEach(([tr, tc]) => {
          const nb = applyMove(b2, r, c2, tr, tc, ep);
          if (!inCheck(nb, !white)) moves.push({ fr: r, fc: c2, tr, tc, nb });
        });
      }
      if (!moves.length) return maxing ? -999 : 999;
      if (depth === 0) return evalBoard(b2);
      let best = maxing ? -Infinity : Infinity;
      for (const m of moves) {
        const v = minimax(m.nb, depth - 1, alpha, beta, !maxing, null);
        if (maxing) { if (v > best) best = v; if (v > alpha) alpha = v; }
        else { if (v < best) best = v; if (v < beta) beta = v; }
        if (alpha >= beta) break;
      }
      return best;
    }

    function aiTurn() {
      if (state !== 'play') return;
      const moves = [];
      for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) {
        const p = board[r][c2];
        if (!p || isWhite(p)) continue;
        rawMoves(r, c2, board, enPassant).forEach(([tr, tc]) => {
          const nb = applyMove(board, r, c2, tr, tc, enPassant);
          if (!inCheck(nb, false)) moves.push({ fr: r, fc: c2, tr, tc, nb });
        });
      }
      if (!moves.length) {
        msg = inCheck(board, false) ? '🏆 Checkmate! You win!' : 'Stalemate! Draw.';
        state = 'over'; api.score(moveCount > 0 ? Math.max(1, 40 - moveCount) : 1);
        return;
      }
      let best = -Infinity, bestM = null;
      for (const m of moves) {
        const v = minimax(m.nb, 2, -Infinity, Infinity, false, null);
        if (v > best) { best = v; bestM = m; }
      }
      if (bestM) {
        doMove(bestM.fr, bestM.fc, bestM.tr, bestM.tc);
        api.beep(board[bestM.tr][bestM.tc] ? 320 : 260, .05);
      }
      const wMoves = allLegal(true);
      if (!wMoves.length) {
        msg = inCheck(board, true) ? '😿 Checkmate! AI wins.' : 'Stalemate! Draw.';
        state = 'over';
      } else {
        msg = inCheck(board, true) ? 'Check! Your turn.' : 'Your turn';
      }
      turn = 'w';
    }

    function click(r, c2) {
      if (state === 'over') { reset(); return; }
      if (turn !== 'w') return;
      if (sel) {
        const [sr, sc] = sel;
        const moves = legalMoves(sr, sc);
        const m = moves.find(([mr, mc]) => mr === r && mc === c2);
        if (m) {
          const captured = board[r][c2];
          doMove(sr, sc, r, c2);
          api.beep(captured ? 600 : 420, .06);
          sel = null;
          const bMoves = allLegal(false);
          if (!bMoves.length) {
            msg = inCheck(board, false) ? '🏆 Checkmate! You win!' : 'Stalemate! Draw.';
            state = 'over'; api.score(Math.max(1, 40 - moveCount));
          } else {
            turn = 'b'; msg = 'AI thinking…';
            setTimeout(aiTurn, 350);
          }
          return;
        }
        sel = null;
      }
      const p = board[r][c2];
      if (p && isWhite(p)) {
        const moves = legalMoves(r, c2);
        if (moves.length) { sel = [r, c2]; api.beep(480, .03); }
      }
    }

    c.addEventListener('pointerdown', e => {
      const br = c.getBoundingClientRect();
      const cx2 = (e.clientX - br.left) * (CW / br.width);
      const cy2 = (e.clientY - br.top) * (CH / br.height) - 4;
      const col = Math.floor(cx2 / CS), row = Math.floor(cy2 / CS);
      if (row >= 0 && row < N && col >= 0 && col < N) click(row, col);
      else if (state === 'over') reset();
    });

    function draw() {
      const cs2 = getComputedStyle(el);
      const bg = cs2.getPropertyValue('--bg').trim();
      const accent = cs2.getPropertyValue('--accent').trim();
      const ink = cs2.getPropertyValue('--ink').trim();

      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

      const selMoves = sel ? legalMoves(sel[0], sel[1]) : [];

      for (let r = 0; r < N; r++) {
        for (let c2 = 0; c2 < N; c2++) {
          const x = c2 * CS + 1, y = r * CS + 4;
          const light = (r + c2) % 2 === 0;
          ctx.fillStyle = light ? '#f0d9b5' : '#b58863';
          ctx.fillRect(x, y, CS, CS);

          if (sel && sel[0] === r && sel[1] === c2) {
            ctx.fillStyle = 'rgba(255,230,0,.4)'; ctx.fillRect(x, y, CS, CS);
          }
          if (selMoves.some(([mr, mc]) => mr === r && mc === c2)) {
            ctx.fillStyle = 'rgba(0,200,0,.3)'; ctx.fillRect(x, y, CS, CS);
            ctx.strokeStyle = '#080'; ctx.lineWidth = 1.5;
            ctx.strokeRect(x+1, y+1, CS-2, CS-2);
          }

          const p = board[r][c2];
          if (p) {
            const emoji = isWhite(p) ? W_EMOJI[p] : B_EMOJI[p];
            ctx.font = `${CS - 10}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + CS/2, y + CS/2);
          }
        }
      }

      // coord labels
      ctx.fillStyle = '#888'; ctx.font = '9px system-ui';
      'abcdefgh'.split('').forEach((l, i) => {
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(l, i * CS + CS/2 + 1, N * CS + 6);
      });
      for (let i = 0; i < N; i++) {
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(N - i, 2, i * CS + CS/2 + 4);
      }

      // status
      ctx.fillStyle = ink; ctx.font = '12px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(msg, CW / 2, N * CS + 18);

      raf = requestAnimationFrame(draw);
    }

    reset(); draw();
    return () => cancelAnimationFrame(raf);
  }
});
