Pawcade.register({
  id: 'stack', title: 'Cat Stack', emoji: '📦', tags: 'arcade reflex one-button',
  blurb: 'Stack cat boxes as high as you can! Tap to drop each layer.',
  mount(el, api) {
    const W = 300, H = 420, BASE_H = 18, SPEED_START = 2.2, SPEED_INC = 0.18;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Tap / Space / click to drop the box';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    let layers, moving, score, state, raf, frame, particles = [];
    const EMOJIS = ['📦','🐱','🧶','🐾','🐟','🛖','🪣'];
    const COLORS = ['#7ecaff','#ff6b9a','#ffd600','#4ef07c','#ff9a3c','#b06cff','#4ec4ff'];

    function spawnParticles(px, py, color, n) {
      for (let i=0;i<n;i++) {
        const a=Math.random()*Math.PI*2, sp=1+Math.random()*3;
        particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color,size:2+Math.random()*3});
      }
    }

    function reset() {
      score=0; frame=0; state='ready'; particles=[];
      const bw=160;
      layers=[{x:(W-bw)/2,w:bw,y:H-BASE_H,h:BASE_H,emoji:'🏠',color:'#3a3a6a'}];
      spawnMoving();
    }

    function spawnMoving() {
      const prev=layers[layers.length-1];
      const spd=Math.min(SPEED_START+score*SPEED_INC,9);
      moving={x:0,w:prev.w,y:prev.y-BASE_H-2,h:BASE_H,vx:spd,emoji:EMOJIS[score%EMOJIS.length],color:COLORS[score%COLORS.length]};
    }

    function drop() {
      if (state==='ready'){state='play';return;}
      if (state!=='play'){reset();return;}
      const prev=layers[layers.length-1];
      const ox1=Math.max(moving.x,prev.x), ox2=Math.min(moving.x+moving.w,prev.x+prev.w);
      const overlap=ox2-ox1;
      if (overlap<=0) {
        api.beep(150,.3,'sawtooth'); state='over'; api.score(score);
        spawnParticles(moving.x+moving.w/2, moving.y, '#ff6b9a', 16);
        return;
      }
      api.beep(overlap<prev.w*0.6?440:600,.06);
      spawnParticles(ox1+overlap/2, moving.y, moving.color, 10);
      const trimmed={x:ox1,w:overlap,y:moving.y,h:moving.h,emoji:moving.emoji,color:moving.color};
      layers.push(trimmed); score++;
      spawnMoving();
    }

    function tick() {
      frame++;
      if (state==='play') {
        moving.x+=moving.vx;
        if (moving.x+moving.w>W){moving.x=W-moving.w;moving.vx=-Math.abs(moving.vx);}
        if (moving.x<0){moving.x=0;moving.vx=Math.abs(moving.vx);}
      }
      draw(); raf=requestAnimationFrame(tick);
    }

    function draw() {
      // Gradient background
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'#0d1240'); grad.addColorStop(1,'#12122a');
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

      const topY=layers.length>1?layers[layers.length-1].y:H-BASE_H;
      const scroll=Math.max(0,H-topY-H*0.55);
      ctx.save(); ctx.translate(0,scroll);

      layers.forEach((l,i) => {
        ctx.shadowBlur=i===layers.length-1?12:4;
        ctx.shadowColor=l.color;
        const lg=ctx.createLinearGradient(l.x,l.y,l.x+l.w,l.y);
        lg.addColorStop(0,l.color); lg.addColorStop(1,l.color+'88');
        ctx.fillStyle=i===0?'#3a3a6a':lg;
        ctx.globalAlpha=0.9;
        ctx.beginPath(); ctx.roundRect(l.x,l.y,l.w,l.h,4); ctx.fill();
        ctx.globalAlpha=1; ctx.shadowBlur=0;
        if (l.w>22) {
          ctx.font=`${Math.min(14,l.h-2)}px serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(l.emoji,l.x+l.w/2,l.y+l.h/2);
        }
      });

      if (state==='play') {
        ctx.shadowBlur=16; ctx.shadowColor=moving.color;
        const mg=ctx.createLinearGradient(moving.x,moving.y,moving.x+moving.w,moving.y);
        mg.addColorStop(0,moving.color); mg.addColorStop(1,moving.color+'88');
        ctx.fillStyle=mg; ctx.globalAlpha=0.92;
        ctx.beginPath(); ctx.roundRect(moving.x,moving.y,moving.w,moving.h,4); ctx.fill();
        ctx.globalAlpha=1; ctx.shadowBlur=0;
        if (moving.w>22) {
          ctx.font=`${Math.min(14,moving.h-2)}px serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(moving.emoji,moving.x+moving.w/2,moving.y+moving.h/2);
        }
      }

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

      ctx.restore();

      // HUD pill
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(4,4,W-8,24,8); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 13px system-ui'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.shadowBlur=8; ctx.shadowColor='#7ecaff';
      ctx.fillText('📦 '+score, 10, 16);
      ctx.shadowBlur=0;

      if (state==='ready') {
        ctx.fillStyle='rgba(0,0,0,.5)';
        ctx.beginPath(); ctx.roundRect(W/2-100,H/2-18,200,34,10); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold 15px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('Tap to start stacking!',W/2,H/2);
      }
      if (state==='over') {
        ctx.fillStyle='rgba(0,0,15,.7)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(W/2-100,H/2-38,200,68,14); ctx.fill();
        ctx.strokeStyle='#7ecaff'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(W/2-100,H/2-38,200,68,14); ctx.stroke();
        ctx.shadowBlur=18; ctx.shadowColor='#7ecaff';
        ctx.fillStyle='#fff'; ctx.font='bold 18px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('Stack: '+score+(score>=10?' 🐾':''),W/2,H/2-14);
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='13px system-ui';
        ctx.fillText('Tap to try again',W/2,H/2+16);
      }
    }

    const kd=e=>{if(e.key===' '){e.preventDefault();drop();}};
    document.addEventListener('keydown',kd);
    c.addEventListener('pointerdown',()=>drop());
    reset(); tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);};
  }
});
