Pawcade.register({
  id: 'seabattle', title: 'Sea Battle', emoji: '⚓', tags: 'puzzle brain',
  blurb: 'Sink the enemy cat fleet! Classic battleship vs the AI.',
  mount(el, api) {
    const N = 8, CS = 32; // 8x8 grid, cell size
    const SHIPS = [4, 3, 3, 2, 2]; // ship lengths

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px;';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.style.margin = '0';
    hint.textContent = 'Click enemy grid to fire. Sink all 5 ships to win!';

    const c = document.createElement('canvas');
    const CW = (N * CS + 8) * 2 + 40, CH = N * CS + 80;
    c.width = CW; c.height = CH; c.className = 'board';
    wrap.append(c, hint);
    el.append(wrap);
    const ctx = c.getContext('2d');

    const OX1 = 4, OX2 = N * CS + 44, OY = 44;

    let playerGrid, aiGrid, playerShips, aiShips, playerShots, aiShots;
    let state, message, raf, frame;

    function makeGrid() {
      return Array.from({ length: N }, () => Array(N).fill(0));
    }

    function placeShips(grid) {
      const ships = [];
      for (const len of SHIPS) {
        let placed = false, tries = 0;
        while (!placed && tries++ < 200) {
          const horiz = Math.random() < 0.5;
          const row = Math.floor(Math.random() * (horiz ? N : N - len + 1));
          const col = Math.floor(Math.random() * (horiz ? N - len + 1 : N));
          let ok = true;
          for (let i = 0; i < len; i++) {
            const r = horiz ? row : row + i;
            const c2 = horiz ? col + i : col;
            if (grid[r][c2]) { ok = false; break; }
          }
          if (ok) {
            const cells = [];
            for (let i = 0; i < len; i++) {
              const r = horiz ? row : row + i;
              const c2 = horiz ? col + i : col;
              grid[r][c2] = 1;
              cells.push([r, c2]);
            }
            ships.push({ cells, sunk: false });
            placed = true;
          }
        }
      }
      return ships;
    }

    function reset() {
      playerGrid = makeGrid(); aiGrid = makeGrid();
      playerShots = makeGrid(); aiShots = makeGrid();
      playerShips = placeShips(playerGrid);
      aiShips = placeShips(aiGrid);
      message = 'Your turn — click the enemy waters!';
      state = 'play'; frame = 0;
    }

    function checkSunk(ships, shots, r, c) {
      for (const s of ships) {
        if (s.sunk) continue;
        if (s.cells.some(([sr, sc]) => sr === r && sc === c)) {
          if (s.cells.every(([sr, sc]) => shots[sr][sc] === 1)) {
            s.sunk = true; return true;
          }
        }
      }
      return false;
    }

    function allSunk(ships) { return ships.every(s => s.sunk); }

    function aiMove() {
      let r, c, tries = 0;
      // simple hunt: try adjacent to last hit
      do {
        r = Math.floor(Math.random() * N);
        c = Math.floor(Math.random() * N);
        tries++;
      } while (aiShots[r][c] !== 0 && tries < 200);
      if (aiShots[r][c] !== 0) return; // grid full
      const hit = playerGrid[r][c] === 1;
      aiShots[r][c] = hit ? 2 : 1;
      if (hit) {
        checkSunk(playerShips, aiShots, r, c);
        api.beep(250, .2, 'sawtooth');
        if (allSunk(playerShips)) { message = 'The enemy sunk your fleet! 😿'; state = 'over'; api.score(1); }
        else message = 'Enemy hit your ship! 😾';
      } else {
        api.beep(180, .1);
        message = 'Enemy missed.';
      }
    }

    function playerFire(r, c) {
      if (state !== 'play') { reset(); return; }
      if (playerShots[r][c] !== 0) return;
      const hit = aiGrid[r][c] === 1;
      playerShots[r][c] = hit ? 2 : 1;
      if (hit) {
        const sunk = checkSunk(aiShips, playerShots, r, c);
        api.beep(sunk ? 800 : 600, .1);
        if (allSunk(aiShips)) {
          const remaining = SHIPS.reduce((a, l) => a + l, 0) - countHits(aiShots);
          message = '🏆 You sunk the enemy fleet! 🐾'; state = 'over';
          api.score(SHIPS.length * 10 + countMisses(playerShots) === 0 ? 100 : 50);
          return;
        }
        message = sunk ? 'Direct hit — enemy ship sunk! 💥🐱' : 'Hit! Keep firing!';
      } else {
        api.beep(280, .08);
        message = 'Miss... 💧';
        setTimeout(() => { if (state === 'play') { aiMove(); } }, 400);
      }
    }

    function countHits(shots) {
      let h = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (shots[r][c] === 2) h++;
      return h;
    }
    function countMisses(shots) {
      let m = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (shots[r][c] === 1) m++;
      return m;
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();
      const panel = cs.getPropertyValue('--panel').trim();

      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

      // labels
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Your fleet', OX1 + N * CS / 2, 8);
      ctx.fillText('Enemy waters', OX2 + N * CS / 2, 8);
      ctx.font = '11px system-ui';
      ctx.fillText('(ships shown)', OX1 + N * CS / 2, 24);
      ctx.fillText('(shoot here!)', OX2 + N * CS / 2, 24);

      // draw both grids
      drawGrid(OX1, OY, playerGrid, aiShots, playerShips, false);
      drawGrid(OX2, OY, aiGrid, playerShots, aiShips, true);

      // message bar
      ctx.fillStyle = panel; ctx.fillRect(0, OY + N * CS + 6, CW, 28);
      ctx.fillStyle = ink; ctx.font = '13px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(message, CW / 2, OY + N * CS + 20);

      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, OY + N * CS + 6, CW, 28);
        ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui';
        ctx.fillText(message + '  Tap to play again!', CW / 2, OY + N * CS + 20);
      }
    }

    function drawGrid(ox, oy, grid, shots, ships, hideShips) {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim();
      const line = cs.getPropertyValue('--line').trim();
      const bg = cs.getPropertyValue('--bg').trim();

      // water background
      ctx.fillStyle = '#1a4070';
      ctx.fillRect(ox, oy, N * CS, N * CS);

      for (let r = 0; r < N; r++) {
        for (let c2 = 0; c2 < N; c2++) {
          const x = ox + c2 * CS, y = oy + r * CS;
          // ship
          if (!hideShips && grid[r][c2] === 1) {
            ctx.fillStyle = '#4a7aaa';
            ctx.fillRect(x + 1, y + 1, CS - 2, CS - 2);
          }
          // hit / miss
          if (shots[r][c2] === 2) {
            ctx.fillStyle = '#e44';
            ctx.beginPath(); ctx.arc(x + CS/2, y + CS/2, CS/2 - 3, 0, Math.PI*2); ctx.fill();
            ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('💥', x + CS/2, y + CS/2);
          } else if (shots[r][c2] === 1) {
            ctx.fillStyle = 'rgba(255,255,255,.3)';
            ctx.beginPath(); ctx.arc(x + CS/2, y + CS/2, 4, 0, Math.PI*2); ctx.fill();
          }
          // grid lines
          ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CS, CS);
        }
      }

      // show sunk ships as cats
      for (const ship of ships) {
        if (!ship.sunk) continue;
        ship.cells.forEach(([r, c2]) => {
          ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🐱', ox + c2 * CS + CS/2, oy + r * CS + CS/2);
        });
      }

      // border
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, N * CS, N * CS);
    }

    c.addEventListener('pointerdown', e => {
      const r2 = c.getBoundingClientRect();
      const cx2 = (e.clientX - r2.left) * (CW / r2.width);
      const cy2 = (e.clientY - r2.top) * (CH / r2.height);
      const col = Math.floor((cx2 - OX2) / CS);
      const row = Math.floor((cy2 - OY) / CS);
      if (col >= 0 && col < N && row >= 0 && row < N) {
        playerFire(row, col);
      } else if (state === 'over') {
        reset();
      }
    });

    function tick() { draw(); raf = requestAnimationFrame(tick); }
    reset(); tick();
    return () => cancelAnimationFrame(raf);
  }
});
