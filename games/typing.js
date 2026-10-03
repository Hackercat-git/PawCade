Pawcade.register({
  id: 'typing', title: 'Typing Cat', emoji: '⌨️', tags: 'typing words speed reflex',
  blurb: 'Type the falling cat words before they hit the floor. Three misses.',
  mount(el, api) {
    const W = 340, H = 360, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const inp = document.createElement('input');
    inp.type='text'; inp.autocomplete='off'; inp.autocapitalize='off';
    inp.spellcheck=false; inp.placeholder='Type here…';
    inp.style.cssText='width:100%;margin-top:8px;';
    const hint = document.createElement('p'); hint.className='hint';
    hint.textContent='📱 Tap the text field to type · 3 misses = game over · Enter to restart';
    el.append(c, inp, hint);
    const ctx = c.getContext('2d');

    const WORDS='cat paw fur meow purr claw tail yarn kitten tabby whisker nap pounce scratch feline chase mouse bird sleep cozy hunt prowl sprint leap groom stalk catnip fluffy stretch yawn twitch hiss boop sniff curl nuzzle chirp trill mrrp pawprint mew catfish wildcat tomcat calico tortie bobcat ocelot cougar lynx prowler mouser ratter slink swagger tiptoe lunge swipe dart bolt lope'.split(' ');
    let words, sc, lives, state, raf, frame, spawnInterval, startTime, wordsDone, particles=[];

    function reset() {
      words=[]; sc=0; lives=3; state='play'; frame=0; wordsDone=0; particles=[];
      startTime=Date.now(); spawnInterval=90;
      inp.value=''; inp.disabled=false; inp.focus();
    }
    function wpm() { const mins=(Date.now()-startTime)/60000; return mins<.05?0:Math.round(wordsDone/mins); }

    function spawnWord() {
      const w=WORDS[Math.random()*WORDS.length|0];
      const wx=20+Math.random()*(W-120);
      const spd=.4+sc*.015;
      words.push({w,x:wx,y:-16,spd,typed:0});
    }

    function spawnParticles(px, py, color, n) {
      for (let i=0;i<n;i++) {
        const a=Math.random()*Math.PI*2, sp=1+Math.random()*3;
        particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color,size:2+Math.random()*3});
      }
    }

    function tick() {
      if (state==='play') {
        frame++;
        spawnInterval=Math.max(45,90-sc*2);
        if (frame%spawnInterval===0) spawnWord();
        words.forEach(wo=>wo.y+=wo.spd);
        const hit=words.filter(wo=>wo.y>H-10);
        if (hit.length) {
          hit.forEach(wo=>{lives--;api.beep(180,.2,'sawtooth');spawnParticles(wo.x,H-10,'#ff4444',8);});
          words=words.filter(wo=>wo.y<=H-10);
          if (lives<=0){state='over';inp.disabled=true;api.score(sc);}
        }
      }
      draw(); raf=requestAnimationFrame(tick);
    }

    function draw() {
      // Gradient bg
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d1240'); sky.addColorStop(1,'#12122a');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      // Subtle grid
      ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
      for (let i=0;i<W;i+=24){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
      for (let j=0;j<H;j+=24){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j);ctx.stroke();}

      // Danger line
      ctx.strokeStyle='rgba(255,80,80,0.3)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0,H-10); ctx.lineTo(W,H-10); ctx.stroke();
      ctx.setLineDash([]);

      // Words
      words.forEach(wo => {
        const pct=wo.y/(H-10);
        const danger=pct>0.75;
        ctx.font='bold 17px system-ui';
        const done=wo.w.slice(0,wo.typed), rest=wo.w.slice(wo.typed);
        const wFull=ctx.measureText(wo.w).width;

        // Pill bg
        ctx.fillStyle=danger?'rgba(255,60,60,0.15)':'rgba(126,202,255,0.1)';
        ctx.shadowBlur=danger?10:6; ctx.shadowColor=danger?'#ff4444':'#7ecaff';
        ctx.beginPath(); ctx.roundRect(wo.x-6,wo.y-13,wFull+12,24,6); ctx.fill();
        ctx.shadowBlur=0;

        // Typed chars (accent)
        ctx.fillStyle='#7ecaff'; ctx.shadowBlur=8; ctx.shadowColor='#7ecaff';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(done,wo.x,wo.y);
        ctx.shadowBlur=0;

        // Remaining chars
        ctx.fillStyle=danger?'#ff6b6b':'#f0f0ff';
        ctx.fillText(rest,wo.x+ctx.measureText(done).width,wo.y);
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

      // Current input preview
      const cur=inp.value;
      if (cur) {
        ctx.font='bold 14px system-ui'; ctx.textAlign='left'; ctx.fillStyle='#7ecaff';
        ctx.shadowBlur=6; ctx.shadowColor='#7ecaff';
        ctx.fillText('→ '+cur, 8, H-28);
        ctx.shadowBlur=0;
      }

      // HUD pill
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(4,4,W-8,24,8); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 12px system-ui'; ctx.textAlign='left'; ctx.textBaseline='middle';
      const w=wpm();
      ctx.fillText('Score '+sc+'   '+'❤️'.repeat(Math.max(0,lives))+(w>0?'   '+w+' wpm':''), 8, 16);

      if (state==='over') {
        ctx.fillStyle='rgba(0,0,15,.7)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(W/2-115,H/2-38,230,68,14); ctx.fill();
        ctx.strokeStyle='#7ecaff'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(W/2-115,H/2-38,230,68,14); ctx.stroke();
        ctx.shadowBlur=18; ctx.shadowColor='#7ecaff';
        ctx.fillStyle='#fff'; ctx.font='bold 15px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(sc+' words, '+wpm()+' wpm',W/2,H/2-14);
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='13px system-ui';
        ctx.fillText('Click canvas or press Enter to restart',W/2,H/2+16);
      }
    }

    inp.addEventListener('input', () => {
      if (state!=='play') return;
      const v=inp.value.toLowerCase().trim();
      words.forEach(wo=>{
        if (wo.w.startsWith(v)) wo.typed=v.length;
        else if (wo.typed>0&&!wo.w.startsWith(v)) wo.typed=0;
      });
      const idx=words.findIndex(wo=>wo.w===v);
      if (idx!==-1) {
        sc++; wordsDone++; api.score(sc); api.beep(700+sc*8,.07);
        spawnParticles(words[idx].x,words[idx].y,'#7ecaff',12);
        spawnParticles(words[idx].x,words[idx].y,'#ffd700',6);
        words.splice(idx,1); inp.value='';
        words.forEach(wo=>wo.typed=0);
      }
    });
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&state==='over')reset();});
    c.addEventListener('pointerdown',()=>{if(state==='over')reset();inp.focus();});
    reset(); tick();
    return ()=>{cancelAnimationFrame(raf);};
  }
});
