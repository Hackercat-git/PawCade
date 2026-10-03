Pawcade.register({
  id: 'fish', title: 'Fish Catcher', emoji: '🧺', tags: 'arcade reflex catch',
  blurb: 'Catch the falling fish. Dodge the boots and do not miss three.',
  mount(el, api) {
    const W = 320, H = 420, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Drag to move · Tap to restart · ⌨️ A / D or arrow keys';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let bx, items, sc, lives, over, spawn, raf, particles = [], comboTimer = 0, combo = 0;

    function reset() { bx = W/2; items = []; sc = 0; lives = 3; over = false; spawn = 0; particles = []; combo = 0; comboTimer = 0; }

    function spawnParticles(px, py, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4;
        particles.push({ x: px, y: py, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color, size: 2+Math.random()*4 });
      }
    }

    function tick() {
      if (!over) {
        if (--spawn <= 0) {
          items.push({ x: 20+Math.random()*(W-40), y: -20, bad: Math.random() < .25, v: 1.6+sc*.05 });
          spawn = Math.max(25, 55-sc);
        }
        if (keys.ArrowLeft||keys.a) bx -= 5;
        if (keys.ArrowRight||keys.d) bx += 5;
        bx = Math.max(34, Math.min(W-34, bx));
        if (comboTimer > 0) comboTimer--;
        else combo = 0;
        items.forEach(i => i.y += i.v);
        items = items.filter(i => {
          if (i.y > H-55 && i.y < H-20 && Math.abs(i.x-bx) < 38) {
            if (i.bad) {
              lives--; api.beep(150,.2,'sawtooth');
              spawnParticles(i.x, i.y, '#ff4444', 12);
              combo = 0; comboTimer = 0;
            } else {
              sc++; combo++; comboTimer = 90;
              api.beep(600+combo*40,.06); api.score(sc);
              spawnParticles(i.x, i.y, combo>=3?'#ffd700':'#7ecaff', combo>=3?16:10);
            }
            return false;
          }
          if (i.y > H) {
            if (!i.bad) { lives--; api.beep(200,.1); spawnParticles(i.x, H-10, '#ff6b9a', 8); }
            return false;
          }
          return true;
        });
        if (lives <= 0) { over = true; api.score(sc); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      // Gradient background
      const sky = x.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d1240'); sky.addColorStop(1,'#12122a');
      x.fillStyle = sky; x.fillRect(0,0,W,H);

      // Subtle grid
      x.strokeStyle='rgba(255,255,255,0.03)'; x.lineWidth=1;
      for (let i=0;i<W;i+=24){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}
      for (let j=0;j<H;j+=24){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke();}

      // Items
      items.forEach(i => {
        const danger = i.y/H;
        if (i.bad) { x.shadowBlur=8; x.shadowColor='#ff4444'; }
        else { x.shadowBlur=6+4*Math.sin(Date.now()/200+i.x); x.shadowColor='#7ecaff'; }
        x.font='28px serif'; x.textAlign='center'; x.textBaseline='middle';
        x.fillText(i.bad?'🥾':'🐟', i.x, i.y);
        x.shadowBlur=0;
      });

      // Particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=0.055;
        x.globalAlpha=p.life; x.fillStyle=p.color;
        x.shadowBlur=8; x.shadowColor=p.color;
        x.beginPath(); x.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); x.fill();
        x.shadowBlur=0;
      }
      x.globalAlpha=1;

      // Basket with glow
      x.shadowBlur=14; x.shadowColor=combo>=3?'#ffd700':'#7ecaff';
      x.font='40px serif'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText('🧺', bx, H-38);
      x.shadowBlur=0;

      // Combo badge
      if (combo >= 3) {
        x.fillStyle='#ffd700'; x.shadowBlur=10; x.shadowColor='#ffd700';
        x.font='bold 12px system-ui'; x.textAlign='center'; x.textBaseline='top';
        x.fillText('x'+combo+' COMBO!', bx, H-60);
        x.shadowBlur=0;
      }

      // HUD pill
      x.fillStyle='rgba(0,0,0,0.5)';
      x.beginPath(); x.roundRect(4,4,W-8,24,8); x.fill();
      x.fillStyle='#fff'; x.font='bold 13px system-ui'; x.textAlign='left'; x.textBaseline='middle';
      x.fillText('🐟 '+sc+'   '+'❤️'.repeat(Math.max(0,lives)), 10, 16);

      if (over) {
        x.fillStyle='rgba(0,0,15,.7)'; x.fillRect(0,0,W,H);
        x.fillStyle='rgba(255,255,255,0.07)';
        x.beginPath(); x.roundRect(W/2-110,H/2-38,220,68,14); x.fill();
        x.strokeStyle='#7ecaff'; x.lineWidth=1.5;
        x.beginPath(); x.roundRect(W/2-110,H/2-38,220,68,14); x.stroke();
        x.shadowBlur=18; x.shadowColor='#7ecaff';
        x.fillStyle='#fff'; x.font='bold 17px system-ui'; x.textAlign='center'; x.textBaseline='middle';
        x.fillText('Score: '+sc, W/2, H/2-14);
        x.shadowBlur=0;
        x.fillStyle='rgba(255,255,255,0.6)'; x.font='13px system-ui';
        x.fillText('Space or tap to restart', W/2, H/2+16);
      }
    }
    const kd = e => {
      keys[e.key]=true;
      if (e.key.startsWith('Arrow')||e.key===' ') e.preventDefault();
      if (e.key===' '&&over) reset();
    };
    const ku = e => keys[e.key]=false;
    const updateBx = e => { const r=c.getBoundingClientRect(); bx=Math.max(34,Math.min(W-34,(e.clientX-r.left)*W/r.width)); };
    c.onpointermove = updateBx;
    c.onpointerdown = e => { if (over){reset();return;} updateBx(e); };
    c.style.touchAction='none';
    document.addEventListener('keydown',kd); document.addEventListener('keyup',ku);
    reset(); tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
  }
});
