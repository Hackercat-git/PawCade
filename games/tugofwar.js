Pawcade.register({
  id: 'tugofwar', title: 'Tug of War', emoji: '🐈', tags: 'arcade multiplayer two-player reflex',
  blurb: 'Two cats fight over a fish! Mash your key or tap your side to pull!',
  mount(el, api) {
    const W = 380, H = 220;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Tap your side to pull!  ⌨️ Z = P1  •  M = P2';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const ROPE_Y = H/2+10, WIN = 100, DECAY = 0.97;
    let pos, p1pwr, p2pwr, state, raf, frame, winner, particles = [];

    function spawnParticles(px, py, color, n) {
      for (let i=0;i<n;i++) {
        const a=Math.random()*Math.PI*2, sp=1.5+Math.random()*4;
        particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color,size:2+Math.random()*3});
      }
    }

    function reset() { pos=0;p1pwr=0;p2pwr=0;state='ready';frame=0;winner='';particles=[]; }

    function press(side) {
      if (state==='over'){reset();return;}
      if (state==='ready') state='play';
      if (side===1){p1pwr=Math.min(p1pwr+14,60);api.beep(400+Math.random()*100,.03);spawnParticles(50,ROPE_Y,'#ff6b9a',3);}
      else{p2pwr=Math.min(p2pwr+14,60);api.beep(600+Math.random()*100,.03);spawnParticles(W-50,ROPE_Y,'#7ecaff',3);}
    }

    function tick() {
      frame++;
      if (state==='play') {
        p1pwr*=DECAY; p2pwr*=DECAY;
        pos+=(p1pwr-p2pwr)*0.04;
        if (pos<=-WIN){pos=-WIN;winner='P1 🐱';state='over';api.score(WIN);api.beep(800,.3);spawnParticles(W*0.2,ROPE_Y,'#ffd700',24);}
        if (pos>=WIN){pos=WIN;winner='P2 😸';state='over';api.score(WIN);api.beep(800,.3);spawnParticles(W*0.8,ROPE_Y,'#ffd700',24);}
      }
      draw(); raf=requestAnimationFrame(tick);
    }

    function draw() {
      // Dark gradient bg
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'#0d1240'); grad.addColorStop(1,'#12122a');
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

      // Ground
      const gg=ctx.createLinearGradient(0,ROPE_Y+24,0,ROPE_Y+30);
      gg.addColorStop(0,'#2a1a4a'); gg.addColorStop(1,'#1a0f33');
      ctx.fillStyle=gg; ctx.fillRect(0,ROPE_Y+22,W,8);

      // Rope shadow
      ctx.shadowBlur=6; ctx.shadowColor='rgba(0,0,0,.5)';
      ctx.strokeStyle='#7a5820'; ctx.lineWidth=6;
      ctx.beginPath(); ctx.moveTo(40,ROPE_Y); ctx.lineTo(W-40,ROPE_Y); ctx.stroke();
      ctx.shadowBlur=0;
      // Rope highlight
      ctx.strokeStyle='#c49a50'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(40,ROPE_Y); ctx.lineTo(W-40,ROPE_Y); ctx.stroke();
      // Rope stripes
      ctx.strokeStyle='rgba(255,200,100,0.4)'; ctx.lineWidth=2;
      for (let rx=44;rx<W-40;rx+=18){ctx.beginPath();ctx.moveTo(rx,ROPE_Y-3);ctx.lineTo(rx+8,ROPE_Y+3);ctx.stroke();}

      // Fish in center
      const cx=W/2+pos*0.9;
      ctx.shadowBlur=14; ctx.shadowColor='#7ecaff';
      ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🐟',cx,ROPE_Y);
      ctx.shadowBlur=0;

      // Left cat P1
      ctx.save(); ctx.translate(30+pos*0.6,ROPE_Y-6);
      const lean1=Math.min(p1pwr/60,1)*0.3;
      ctx.rotate(-lean1);
      ctx.shadowBlur=p1pwr>10?12:0; ctx.shadowColor='#ff6b9a';
      ctx.font='32px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🐱',0,0);
      ctx.shadowBlur=0; ctx.restore();

      // Right cat P2
      ctx.save(); ctx.translate(W-30+pos*0.6,ROPE_Y-6);
      ctx.scale(-1,1);
      const lean2=Math.min(p2pwr/60,1)*0.3;
      ctx.rotate(-lean2);
      ctx.shadowBlur=p2pwr>10?12:0; ctx.shadowColor='#7ecaff';
      ctx.font='32px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('😸',0,0);
      ctx.shadowBlur=0; ctx.restore();

      // Power bars
      const bw=70,bh=10,by=18;
      // P1
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(10,by,bw,bh,3); ctx.fill();
      const p1g=ctx.createLinearGradient(10,by,10+bw,by);
      p1g.addColorStop(0,'#ff6b9a'); p1g.addColorStop(1,'#ffd700');
      ctx.fillStyle=p1g; ctx.shadowBlur=p1pwr>30?8:0; ctx.shadowColor='#ff6b9a';
      ctx.beginPath(); ctx.roundRect(10,by,bw*(p1pwr/60),bh,3); ctx.fill();
      ctx.shadowBlur=0;
      // P2
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(W-10-bw,by,bw,bh,3); ctx.fill();
      const p2g=ctx.createLinearGradient(W-10-bw,by,W-10,by);
      p2g.addColorStop(0,'#7ecaff'); p2g.addColorStop(1,'#4ef07c');
      ctx.fillStyle=p2g; ctx.shadowBlur=p2pwr>30?8:0; ctx.shadowColor='#7ecaff';
      ctx.beginPath(); ctx.roundRect(W-10-bw,by,bw*(p2pwr/60),bh,3); ctx.fill();
      ctx.shadowBlur=0;

      // Labels
      ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='11px system-ui';
      ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText('P1  👆',10,by+14);
      ctx.textAlign='right'; ctx.fillText('👆  P2',W-10,by+14);

      // Tug meter
      const mw=140,mx=(W-mw)/2,my=H-26;
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(mx,my,mw,10,4); ctx.fill();
      const npos=(pos/WIN)*(mw/2-8)+mw/2;
      const ng=ctx.createLinearGradient(mx+npos-5,my,mx+npos+5,my);
      ng.addColorStop(0,'#ff6b9a'); ng.addColorStop(1,'#7ecaff');
      ctx.fillStyle=ng; ctx.shadowBlur=8; ctx.shadowColor='#fff';
      ctx.beginPath(); ctx.roundRect(mx+npos-5,my-2,10,14,3); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='#ff6b9a'; ctx.beginPath(); ctx.arc(mx,my+5,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#7ecaff'; ctx.beginPath(); ctx.arc(mx+mw,my+5,4,0,Math.PI*2); ctx.fill();

      // Particles
      particles=particles.filter(p=>p.life>0);
      for (const p of particles) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=0.05;
        ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.shadowBlur=6; ctx.shadowColor=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1;

      ctx.textAlign='center'; ctx.textBaseline='middle';
      if (state==='ready') {
        ctx.fillStyle='rgba(255,100,150,.06)'; ctx.fillRect(0,0,W/2,H);
        ctx.fillStyle='rgba(100,200,255,.06)'; ctx.fillRect(W/2,0,W/2,H);
        ctx.font='28px serif';
        ctx.fillText('👆',W/4,H/2+20); ctx.fillText('👆',W*3/4,H/2+20);
        ctx.fillStyle='rgba(0,0,0,.5)';
        ctx.beginPath(); ctx.roundRect(W/2-110,H/2-18,220,34,10); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold 14px system-ui';
        ctx.fillText('Tap your side — or mash Z / M!',W/2,H/2);
      }
      if (state==='over') {
        ctx.fillStyle='rgba(0,0,15,.7)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(W/2-110,H/2-30,220,56,14); ctx.fill();
        ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(W/2-110,H/2-30,220,56,14); ctx.stroke();
        ctx.shadowBlur=18; ctx.shadowColor='#ffd700';
        ctx.fillStyle='#fff'; ctx.font='bold 16px system-ui';
        ctx.fillText('🏆 '+winner+' wins the fish!',W/2,H/2-8);
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='13px system-ui';
        ctx.fillText('Tap / press to rematch',W/2,H/2+16);
      }
    }

    const kd=e=>{
      if(e.key==='z'||e.key==='Z'){e.preventDefault();press(1);}
      if(e.key==='m'||e.key==='M'){e.preventDefault();press(2);}
    };
    c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();press(e.clientX-r.left<W/2?1:2);});
    document.addEventListener('keydown',kd);
    reset(); tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);};
  }
});
