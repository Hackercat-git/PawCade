Pawcade.register({
  id: 'snake', title: 'Cat Snake', emoji: '🐟', tags: 'classic arcade reflex',
  blurb: 'Eat fish, grow longer, never bite your own tail.',
  mount(el, api) {
    const N = 18, S = 20, c = document.createElement('canvas');
    c.width = c.height = N * S; c.className = 'board';
    const row = document.createElement('div'); row.className = 'row';
    const msg = document.createElement('p'); msg.className = 'hint';
    msg.textContent = '📱 Swipe to steer · Tap to restart · ⌨️ WASD / arrows · P = pause';
    const wrapBtn = document.createElement('button');
    wrapBtn.textContent = 'Walls: On'; wrapBtn.title = 'Toggle wall-wrap mode';
    wrapBtn.onclick = () => { wrap = !wrap; wrapBtn.textContent = wrap ? 'Walls: Off' : 'Walls: On'; draw(); };
    row.append(wrapBtn); el.append(c, row, msg);
    const x = c.getContext('2d');
    let s, d, nd, f, sc, t, over, sp, pz, wrap = false, combo = 0, lastEat = 0;
    let particles = [], foodPulse = 0;
    const same = (a, b) => a[0] == b[0] && a[1] == b[1];
    function food() { do f = [Math.random() * N | 0, Math.random() * N | 0]; while (s.some(p => same(p, f))); }
    function reset() { s = [[9,9],[8,9],[7,9]]; d = nd = [1,0]; sc = 0; over = false; combo = 0; particles = []; food(); clearInterval(t); sp = 110; pz = false; t = setInterval(step, sp); draw(); }

    function spawnParticles(gx, gy, color, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({ x: gx * S + S/2, y: gy * S + S/2, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 1, color, size: 2 + Math.random() * 3 });
      }
    }

    function step() {
      d = nd;
      let h = [s[0][0]+d[0], s[0][1]+d[1]];
      if (wrap) { h[0]=(h[0]+N)%N; h[1]=(h[1]+N)%N; }
      if (!wrap&&(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N)){over=true;clearInterval(t);api.score(sc);api.beep(150,.3,'sawtooth');spawnParticles(s[0][0],s[0][1],'#ff4444',20);draw();return;}
      if (s.some(p=>same(p,h))){over=true;clearInterval(t);api.score(sc);api.beep(150,.3,'sawtooth');spawnParticles(s[0][0],s[0][1],'#ff4444',20);draw();return;}
      s.unshift(h);
      if (same(h,f)){
        const now=Date.now();combo=now-lastEat<3000?combo+1:1;lastEat=now;
        const pts=combo>=3?2:1;sc+=pts;
        spawnParticles(f[0],f[1],combo>=3?'#ffd700':'#7ecaff',combo>=3?16:10);
        food();api.beep(combo>=3?880:660,.06);api.score(sc);
        if(sc%4==0){sp=Math.max(55,sp-10);clearInterval(t);t=setInterval(step,sp);}
      } else { s.pop(); }
      draw();
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg=cs.getPropertyValue('--bg').trim(), accent=cs.getPropertyValue('--accent').trim();
      const ink=cs.getPropertyValue('--ink').trim();
      foodPulse = (foodPulse + 0.08) % (Math.PI * 2);

      const grad = x.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, bg); grad.addColorStop(1, '#0d1b3e');
      x.fillStyle = grad; x.fillRect(0, 0, c.width, c.height);

      x.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) {
        x.beginPath(); x.arc(i*S, j*S, 1.5, 0, Math.PI*2); x.fill();
      }

      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.06;
        x.globalAlpha = p.life; x.fillStyle = p.color;
        x.shadowBlur = 8; x.shadowColor = p.color;
        x.beginPath(); x.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); x.fill();
        x.shadowBlur = 0;
      }
      x.globalAlpha = 1;

      for (let i = s.length-1; i >= 1; i--) {
        const p = s[i];
        const t2 = i / s.length;
        x.globalAlpha = 1 - t2 * 0.35;
        const r = Math.round(0x7e * (1-t2) + 0x1a * t2);
        const g2 = Math.round(0xca * (1-t2) + 0x7a * t2);
        const b2 = Math.round(0xff * (1-t2) + 0xb0 * t2);
        x.fillStyle = `rgb(${r},${g2},${b2})`;
        if (i < 4) { x.shadowBlur = 8; x.shadowColor = accent; }
        x.beginPath(); x.roundRect(p[0]*S+2, p[1]*S+2, S-4, S-4, 5); x.fill();
        x.shadowBlur = 0;
      }
      x.globalAlpha = 1;

      x.shadowBlur = 14; x.shadowColor = accent;
      Sprites.draw(x, 'cat', s[0][0]*S+S/2, s[0][1]*S+S/2, 2, d[0]===-1);
      x.shadowBlur = 0;

      const pulse = 0.6 + 0.4 * Math.sin(foodPulse);
      x.shadowBlur = 14 * pulse; x.shadowColor = '#7ecaff';
      Sprites.draw(x, 'fish', f[0]*S+S/2, f[1]*S+S/2, 2, false);
      x.shadowBlur = 0;

      if (combo >= 3) {
        x.fillStyle = '#ffd700'; x.shadowBlur = 10; x.shadowColor = '#ffd700';
        x.font = 'bold 12px system-ui'; x.textBaseline = 'top'; x.textAlign = 'right';
        x.fillText('x' + combo + ' COMBO!', c.width-6, 4);
        x.shadowBlur = 0;
      }

      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(4, 4, 140, 20, 6); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 12px system-ui'; x.textBaseline = 'middle'; x.textAlign = 'left';
      x.fillText('🐟 ' + sc + '  ⚡ ' + Math.round(100*110/sp) + '%' + (wrap ? '  🔄' : ''), 10, 14);

      if (!over && !pz && sc === 0) {
        x.save(); x.globalAlpha = 0.18;
        x.fillStyle = '#fff'; x.font = 'bold 20px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('↑', c.width/2, 18); x.fillText('↓', c.width/2, c.height-16);
        x.fillText('←', 16, c.height/2); x.fillText('→', c.width-16, c.height/2);
        x.restore();
      }

      if (pz) {
        x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0,0,c.width,c.height);
        x.fillStyle = '#fff'; x.shadowBlur = 20; x.shadowColor = accent;
        x.font = 'bold 22px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('⏸ Paused', c.width/2, c.height/2);
        x.shadowBlur = 0;
      }

      if (over) {
        x.fillStyle = 'rgba(0,0,15,.7)'; x.fillRect(0,0,c.width,c.height);
        x.fillStyle = 'rgba(255,255,255,0.07)';
        x.beginPath(); x.roundRect(c.width/2-110, c.height/2-54, 220, 100, 16); x.fill();
        x.strokeStyle = accent; x.lineWidth = 1.5;
        x.beginPath(); x.roundRect(c.width/2-110, c.height/2-54, 220, 100, 16); x.stroke();
        x.shadowBlur = 20; x.shadowColor = accent;
        x.fillStyle = '#fff'; x.font = 'bold 20px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('😿 Game Over!', c.width/2, c.height/2-28);
        x.shadowBlur = 0;
        x.fillStyle = accent; x.font = 'bold 16px system-ui';
        x.fillText('Score: ' + sc, c.width/2, c.height/2-4);
        x.fillStyle = 'rgba(255,255,255,0.6)'; x.font = '13px system-ui';
        x.fillText('Tap or Space to restart', c.width/2, c.height/2+24);
      }
    }

    const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0]};
    const kd=e=>{
      if(e.key==='p'||e.key==='P'){if(!over){pz=!pz;if(!pz)draw();}return;}
      if(e.key===' '){e.preventDefault();if(over||pz){pz=false;reset();}return;}
      const ndir=dirs[e.key];if(!ndir)return;e.preventDefault();
      if(pz)return;if(ndir[0]!==-d[0]||ndir[1]!==-d[1])nd=ndir;
    };
    let tx0,ty0;
    c.addEventListener('touchstart',e=>{const t2=e.touches[0];tx0=t2.clientX;ty0=t2.clientY;},{passive:true});
    c.addEventListener('touchend',e=>{
      if(over){reset();return;}
      const t2=e.changedTouches[0],dx=t2.clientX-tx0,dy=t2.clientY-ty0;
      if(Math.abs(dx)<10&&Math.abs(dy)<10){if(over)reset();return;}
      if(Math.abs(dx)>Math.abs(dy))nd=dx>0?[1,0]:[-1,0];else nd=dy>0?[0,1]:[0,-1];
    },{passive:true});
    c.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&over)reset();});
    document.addEventListener('keydown',kd);
    reset();
    return ()=>{clearInterval(t);document.removeEventListener('keydown',kd);};
  }
});
