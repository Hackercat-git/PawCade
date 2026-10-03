Pawcade.register({
  id: 'chess', title: 'Cat Chess', emoji: '♟️', tags: 'puzzle brain multiplayer two-player',
  blurb: 'Chess with cat pieces! Play solo vs AI or challenge a friend in pass-and-play.',
  mount(el, api) {
    if (!document.getElementById('chess-mode-styles')) {
      const s = document.createElement('style');
      s.id = 'chess-mode-styles';
      s.textContent = `
        .chess-mode-bar { display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
        .chess-mode-bar button { background:#1c1c3d; color:#aaa; border:1px solid #3a3a6a; border-radius:20px; padding:5px 16px; cursor:pointer; font-size:.85rem; font-weight:700; transition:background .15s,color .15s; }
        .chess-mode-bar button.active { background:linear-gradient(135deg,#2a1a4a,#3a2a6a); color:#c0a0ff; border-color:#7a5aaa; }
      `;
      document.head.appendChild(s);
    }

    const N = 8, CS = 42;
    const CW = N * CS + 2, CH = N * CS + 44;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Click a piece, then click a square to move.';

    const modeBar = document.createElement('div');
    modeBar.className = 'chess-mode-bar';
    modeBar.innerHTML = '<button class="active" data-m="1p">👤 vs AI</button><button data-m="2p">🆚 2 Players</button>';
    el.append(modeBar, c, hint);

    const ctx = c.getContext('2d');

    const W_EMOJI = { K:'😻', Q:'🐱', R:'🏠', B:'🧶', N:'🐈', P:'🐾' };
    const B_EMOJI = { k:'😾', q:'🐟', r:'⚓', b:'🎣', n:'🐠', p:'🐡' };

    let board, sel, state, msg, raf, turn, moveCount;
    let enPassant, castling, particles = [], lastCapture = null;
    let mode = '1p';

    function setMode(m) {
      mode = m;
      modeBar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
      reset();
    }
    modeBar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });

    function startBoard() {
      return [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R'],
      ];
    }

    function reset() {
      board = startBoard(); sel = null; state = 'play'; turn = 'w';
      msg = mode === '2p' ? '🔵 Player 1 (white) — your turn' : 'Your turn (white)';
      enPassant = null;
      castling = { wK: true, wR0: true, wR7: true, bK: true, bR0: true, bR7: true };
      moveCount = 0; particles = []; lastCapture = null;
    }

    function spawnParticles(px, py, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4;
        particles.push({ x: px, y: py, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color, size: 2+Math.random()*4 });
      }
    }

    function isWhite(p) { return p && p === p.toUpperCase(); }
    function isBlack(p) { return p && p === p.toLowerCase(); }
    function isEnemy(a, b2) { return a && b2 && isWhite(a) !== isWhite(b2); }
    function inBounds(r, c2) { return r >= 0 && r < N && c2 >= 0 && c2 < N; }

    function rawMoves(r, c2, b, ep) {
      const p = b[r][c2]; if (!p) return [];
      const moves = [], t = p.toUpperCase(), white = isWhite(p), dir = white ? -1 : 1;
      const slide = (drs, dcs) => {
        for (let i = 0; i < drs.length; i++) {
          let nr = r+drs[i], nc = c2+dcs[i];
          while (inBounds(nr, nc)) {
            if (b[nr][nc]) { if (isEnemy(p, b[nr][nc])) moves.push([nr,nc]); break; }
            moves.push([nr,nc]); nr+=drs[i]; nc+=dcs[i];
          }
        }
      };
      if (t==='P') {
        const nr = r+dir;
        if (inBounds(nr,c2) && !b[nr][c2]) {
          moves.push([nr,c2]);
          const start = white?6:1;
          if (r===start && !b[r+dir*2][c2]) moves.push([r+dir*2,c2]);
        }
        for (const dc of [-1,1]) {
          const nc = c2+dc;
          if (inBounds(nr,nc)) {
            if (b[nr][nc] && isEnemy(p,b[nr][nc])) moves.push([nr,nc]);
            if (ep && ep[0]===nr && ep[1]===nc) moves.push([nr,nc]);
          }
        }
      }
      if (t==='N') for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr=r+dr,nc=c2+dc;
        if (inBounds(nr,nc) && !(!isEnemy(p,b[nr][nc])&&b[nr][nc])) moves.push([nr,nc]);
      }
      if (t==='B') slide([-1,-1,1,1],[-1,1,-1,1]);
      if (t==='R') slide([-1,1,0,0],[0,0,-1,1]);
      if (t==='Q') { slide([-1,-1,1,1],[-1,1,-1,1]); slide([-1,1,0,0],[0,0,-1,1]); }
      if (t==='K') for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr=r+dr,nc=c2+dc;
        if (inBounds(nr,nc)&&!(b[nr][nc]&&!isEnemy(p,b[nr][nc]))) moves.push([nr,nc]);
      }
      return moves;
    }

    function findKing(b2, white) {
      const k = white ? 'K' : 'k';
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) if (b2[r][c2]===k) return [r,c2];
      return null;
    }
    function isAttacked(b2, r, c2, byWhite) {
      for (let pr=0;pr<N;pr++) for (let pc=0;pc<N;pc++) {
        const p=b2[pr][pc]; if (!p||isWhite(p)!==byWhite) continue;
        if (rawMoves(pr,pc,b2,null).some(([mr,mc])=>mr===r&&mc===c2)) return true;
      }
      return false;
    }
    function inCheck(b2, white) { const kpos=findKing(b2,white); return kpos&&isAttacked(b2,kpos[0],kpos[1],!white); }

    function applyMove(b2, fr, fc, tr, tc, ep) {
      const nb = b2.map(r=>[...r]);
      const p = nb[fr][fc];
      nb[tr][tc]=p; nb[fr][fc]=0;
      if (p==='P'&&tr===0) nb[tr][tc]='Q';
      if (p==='p'&&tr===7) nb[tr][tc]='q';
      if (p==='P'&&ep&&tr===ep[0]&&tc===ep[1]) nb[tr+1][tc]=0;
      if (p==='p'&&ep&&tr===ep[0]&&tc===ep[1]) nb[tr-1][tc]=0;
      return nb;
    }

    function legalMoves(r, c2) {
      const p=board[r][c2]; if (!p) return [];
      const white=isWhite(p);
      return rawMoves(r,c2,board,enPassant).filter(([tr,tc])=>!inCheck(applyMove(board,r,c2,tr,tc,enPassant),white));
    }

    function doMove(fr, fc, tr, tc) {
      const p=board[fr][fc];
      const newEP = (p==='P'&&fr-tr===2)?[fr-1,fc]:(p==='p'&&tr-fr===2)?[fr+1,fc]:null;
      board=applyMove(board,fr,fc,tr,tc,enPassant);
      enPassant=newEP; moveCount++;
    }

    function evalBoard(b2) {
      const VAL={P:1,N:3,B:3.2,R:5,Q:9,K:100}; let s=0;
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
        const p=b2[r][c2]; if (!p) continue;
        const v=VAL[p.toUpperCase()]||0;
        s+=isWhite(p)?-v:v;
      }
      return s;
    }

    function minimax(b2, depth, alpha, beta, maxing, ep) {
      const white=!maxing, moves=[];
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
        const p=b2[r][c2];
        if (!p||isWhite(p)!==!white) continue;
        rawMoves(r,c2,b2,ep).forEach(([tr,tc])=>{
          const nb=applyMove(b2,r,c2,tr,tc,ep);
          if (!inCheck(nb,!white)) moves.push({fr:r,fc:c2,tr,tc,nb});
        });
      }
      if (!moves.length) return maxing?-999:999;
      if (depth===0) return evalBoard(b2);
      let best=maxing?-Infinity:Infinity;
      for (const m of moves) {
        const v=minimax(m.nb,depth-1,alpha,beta,!maxing,null);
        if (maxing){if(v>best)best=v;if(v>alpha)alpha=v;}
        else{if(v<best)best=v;if(v<beta)beta=v;}
        if (alpha>=beta) break;
      }
      return best;
    }

    function aiTurn() {
      if (state!=='play' || mode==='2p') return;
      const moves=[];
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
        const p=board[r][c2];
        if (!p||isWhite(p)) continue;
        rawMoves(r,c2,board,enPassant).forEach(([tr,tc])=>{
          const nb=applyMove(board,r,c2,tr,tc,enPassant);
          if (!inCheck(nb,false)) moves.push({fr:r,fc:c2,tr,tc,nb});
        });
      }
      if (!moves.length) { msg=inCheck(board,false)?'🏆 Checkmate! You win!':'Stalemate! Draw.'; state='over'; api.score(moveCount>0?Math.max(1,40-moveCount):1); return; }
      let best=-Infinity,bestM=null;
      for (const m of moves) { const v=minimax(m.nb,2,-Infinity,Infinity,false,null); if (v>best){best=v;bestM=m;} }
      if (bestM) {
        const captured=board[bestM.tr][bestM.tc];
        if (captured) {
          const px=bestM.tc*CS+CS/2+1, py=bestM.tr*CS+CS/2+4;
          spawnParticles(px,py,'#ff6b9a',14); spawnParticles(px,py,'#7ecaff',6);
        }
        doMove(bestM.fr,bestM.fc,bestM.tr,bestM.tc);
        api.beep(captured?320:260,.05);
      }
      const wMoves=[];
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) { const p=board[r][c2]; if (p&&isWhite(p)) legalMoves(r,c2).forEach(m=>wMoves.push(m)); }
      if (!wMoves.length) { msg=inCheck(board,true)?'😿 Checkmate! AI wins.':'Stalemate! Draw.'; state='over'; }
      else msg=inCheck(board,true)?'Check! Your turn.':'Your turn';
      turn='w';
    }

    function afterWhiteMove() {
      // Check if black has any moves
      const bMoves=[];
      for (let br=0;br<N;br++) for (let bc=0;bc<N;bc++) { const p=board[br][bc]; if (p&&isBlack(p)) legalMoves(br,bc).forEach(mv=>bMoves.push(mv)); }
      if (!bMoves.length) {
        msg=inCheck(board,false)?'🏆 Checkmate! You win!':'Stalemate! Draw.';
        state='over'; api.score(Math.max(1,40-moveCount)); return;
      }
      turn='b';
      if (mode==='2p') {
        msg = inCheck(board,false) ? '🩷 Player 2 (black) — Check! Your turn' : '🩷 Player 2 (black) — your turn';
      } else {
        msg='AI thinking…'; setTimeout(aiTurn,350);
      }
    }

    function afterBlackMove() {
      const wMoves=[];
      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) { const p=board[r][c2]; if (p&&isWhite(p)) legalMoves(r,c2).forEach(m=>wMoves.push(m)); }
      if (!wMoves.length) {
        msg=inCheck(board,true)?'😿 Checkmate! Black wins.':'Stalemate! Draw.';
        state='over'; return;
      }
      turn='w';
      msg = mode==='2p'
        ? (inCheck(board,true) ? '🔵 Player 1 (white) — Check! Your turn' : '🔵 Player 1 (white) — your turn')
        : (inCheck(board,true) ? 'Check! Your turn.' : 'Your turn');
    }

    function click(r, c2) {
      if (state==='over') { reset(); return; }
      const isMine = mode === '1p'
        ? (turn === 'w' && isWhite(board[r][c2]))
        : (turn === 'w' ? isWhite(board[r][c2]) : isBlack(board[r][c2]));

      if (turn === 'b' && mode === '1p') return; // AI turn in 1P

      if (sel) {
        const [sr,sc]=sel, moves=legalMoves(sr,sc), m=moves.find(([mr,mc])=>mr===r&&mc===c2);
        if (m) {
          const captured=board[r][c2];
          if (captured) { spawnParticles(c2*CS+CS/2+1,r*CS+CS/2+4,'#ffd700',16); }
          doMove(sr,sc,r,c2); api.beep(captured?600:420,.06); sel=null;
          if (turn === 'w') afterWhiteMove();
          else afterBlackMove();
          return;
        }
        sel=null;
      }
      const p=board[r][c2];
      if (p && isMine) { const moves=legalMoves(r,c2); if (moves.length){sel=[r,c2];api.beep(480,.03);} }
    }

    c.style.touchAction='none';
    c.addEventListener('contextmenu',e=>e.preventDefault());
    c.addEventListener('pointerdown', e => {
      const br=c.getBoundingClientRect();
      const cx2=(e.clientX-br.left)*(CW/br.width);
      const cy2=(e.clientY-br.top)*(CH/br.height)-4;
      const col=Math.floor(cx2/CS), row=Math.floor(cy2/CS);
      if (row>=0&&row<N&&col>=0&&col<N) click(row,col);
      else if (state==='over') reset();
    });

    function draw() {
      // Gradient background
      const grad = ctx.createLinearGradient(0,0,0,CH);
      grad.addColorStop(0,'#0d1240'); grad.addColorStop(1,'#12122a');
      ctx.fillStyle=grad; ctx.fillRect(0,0,CW,CH);

      // Board shadow
      ctx.shadowBlur=20; ctx.shadowColor='#3a2a6a';
      ctx.fillStyle='#1a1040';
      ctx.beginPath(); ctx.roundRect(0,4,CW,N*CS,8); ctx.fill();
      ctx.shadowBlur=0;

      const selMoves=sel?legalMoves(sel[0],sel[1]):[];

      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
        const x=c2*CS+1, y=r*CS+4;
        const light=(r+c2)%2===0;
        if (light) {
          const lg=ctx.createLinearGradient(x,y,x,y+CS);
          lg.addColorStop(0,'#f0d9b5'); lg.addColorStop(1,'#d4b896');
          ctx.fillStyle=lg;
        } else {
          const dg=ctx.createLinearGradient(x,y,x,y+CS);
          dg.addColorStop(0,'#c49a6c'); dg.addColorStop(1,'#8a6040');
          ctx.fillStyle=dg;
        }
        ctx.fillRect(x,y,CS,CS);

        if (sel&&sel[0]===r&&sel[1]===c2) {
          ctx.shadowBlur=16; ctx.shadowColor='#ffd600';
          ctx.fillStyle='rgba(255,220,0,.4)'; ctx.fillRect(x,y,CS,CS);
          ctx.shadowBlur=0;
        }
        if (selMoves.some(([mr,mc])=>mr===r&&mc===c2)) {
          ctx.fillStyle='rgba(80,255,100,.25)'; ctx.fillRect(x,y,CS,CS);
          ctx.shadowBlur=8; ctx.shadowColor='#4ef07c';
          ctx.fillStyle='rgba(78,240,124,.8)';
          ctx.beginPath(); ctx.arc(x+CS/2,y+CS/2,8,0,Math.PI*2); ctx.fill();
          ctx.shadowBlur=0;
        }

        const p=board[r][c2];
        if (p) {
          const emoji=isWhite(p)?W_EMOJI[p]:B_EMOJI[p];
          const isKing=p==='K'||p==='k';
          if (isKing){ctx.shadowBlur=14;ctx.shadowColor='#ffd700';}
          ctx.font=`${CS-10}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(emoji,x+CS/2,y+CS/2);
          ctx.shadowBlur=0;
        }
      }

      // Coord labels
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px system-ui';
      'abcdefgh'.split('').forEach((l,i)=>{
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText(l,i*CS+CS/2+1,N*CS+6);
      });

      // Particles
      particles=particles.filter(p=>p.life>0);
      for (const p of particles) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=0.055;
        ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.shadowBlur=8; ctx.shadowColor=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1;

      // HUD pill
      const hudColor = mode==='2p' ? (turn==='w'?'#7ecaff':'#ff6b9a') : (turn==='w'?'#ffd700':'rgba(255,255,255,0.6)');
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(0,N*CS+4,CW,40,0); ctx.fill();
      ctx.fillStyle=hudColor;
      ctx.font='bold 13px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowBlur=8; ctx.shadowColor=hudColor;
      ctx.fillText(msg,CW/2,N*CS+24);
      ctx.shadowBlur=0;

      if (state==='over') {
        ctx.fillStyle='rgba(0,0,15,.7)'; ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle='rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(CW/2-105,CH/2-34,210,62,14); ctx.fill();
        ctx.strokeStyle='#7ecaff'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(CW/2-105,CH/2-34,210,62,14); ctx.stroke();
        ctx.shadowBlur=18; ctx.shadowColor='#7ecaff';
        ctx.fillStyle='#fff'; ctx.font='bold 15px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(msg,CW/2,CH/2-12);
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='12px system-ui';
        ctx.fillText('Tap to play again',CW/2,CH/2+16);
      }

      raf=requestAnimationFrame(draw);
    }

    reset(); draw();
    return ()=>cancelAnimationFrame(raf);
  }
});
