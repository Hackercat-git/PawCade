Pawcade.register({
  id: 'flappy', title: 'Flappy Cat', emoji: '🐈', tags: 'arcade reflex one-button',
  blurb: 'Tap or press Space to flap. Squeeze between the scratching posts.',
  mount(el, api) {
    const W=320,H=480,c=document.createElement('canvas');
    c.width=W;c.height=H;c.className='board';
    const hint=document.createElement('p');hint.className='hint';hint.textContent='Tap, click or press Space to flap.';
    el.append(c,hint);
    const x=c.getContext('2d'),G=.30,J=-5.4,PW=48;
    let y,v,ps,sc,best,state,raf,frame,GAP;
    best=0;
    function medal(n){return n>=20?'Gold':n>=10?'Silver':n>=4?'Bronze':'';}
    function reset(){y=H/2;v=0;ps=[];sc=0;frame=0;GAP=145;state='ready';}
    function die(){state='over';best=Math.max(best,sc);api.score(sc);api.beep(140,.3,'sawtooth');}
    function flap(){if(state=='over'){reset();return;}if(state=='ready')state='play';v=J;api.beep(520,.05);}
    function tick(){
      if(state=='play'){
        v+=G;y+=v;frame++;
        if(frame%90==1){GAP=Math.max(90,145-Math.floor(sc/5)*5);ps.push({x:W,top:60+Math.random()*(H-GAP-120),ok:false});}
        const spd=2.2+sc*.04;
        ps.forEach(p=>p.x-=spd);ps=ps.filter(p=>p.x>-PW);
        for(const p of ps){
          if(!p.ok&&p.x+PW<68){p.ok=true;sc++;api.beep(800,.05);}
          if(92>p.x&&68<p.x+PW&&(y-12<p.top||y+12>p.top+GAP))die();
        }
        if(y>H-12||y<0)die();
      }else if(state=='ready')y=H/2+Math.sin(Date.now()/200)*8;
      draw();raf=requestAnimationFrame(tick);
    }
    function draw(){
      const cs=getComputedStyle(el);
      const bg=cs.getPropertyValue('--bg').trim(),accent=cs.getPropertyValue('--accent').trim();
      const ink=cs.getPropertyValue('--ink').trim(),line=cs.getPropertyValue('--line').trim();
      x.fillStyle=bg;x.fillRect(0,0,W,H);
      // pipes (scratching posts — textured look)
      ps.forEach(p=>{
        x.fillStyle=accent;
        x.beginPath();x.roundRect(p.x,0,PW,p.top,[0,0,8,8]);x.fill();
        x.beginPath();x.roundRect(p.x,p.top+GAP,PW,H-p.top-GAP,[8,8,0,0]);x.fill();
        // rope-wrap lines on post
        x.strokeStyle=line;x.lineWidth=2;x.globalAlpha=.25;
        for(let yy=8;yy<p.top-2;yy+=12){x.beginPath();x.moveTo(p.x,yy);x.lineTo(p.x+PW,yy);x.stroke();}
        for(let yy=p.top+GAP+8;yy<H;yy+=12){x.beginPath();x.moveTo(p.x,yy);x.lineTo(p.x+PW,yy);x.stroke();}
        x.globalAlpha=1;
        // cap
        x.fillStyle=line;
        x.fillRect(p.x-4,p.top-10,PW+8,10);
        x.fillRect(p.x-4,p.top+GAP,PW+8,10);
      });
      // cat sprite — tilt with velocity
      x.save();x.translate(80,y);
      x.rotate(Math.max(-0.4,Math.min(0.4,v*0.06)));
      Sprites.draw(x,'cat',0,0,2,false);
      x.restore();
      // score
      x.fillStyle=ink;x.font='bold 22px system-ui';x.textAlign='center';x.textBaseline='top';
      x.fillText(sc,W/2,14);
      x.font='15px system-ui';
      if(state=='ready'){
        x.textBaseline='middle';
        x.fillText('Tap to start',W/2,H/2+55);
        if(best>0){x.font='13px system-ui';x.fillText('Best: '+best+(medal(best)?' ('+medal(best)+')':''),W/2,H/2+78);}
      }
      if(state=='over'){
        x.fillStyle='rgba(0,0,0,.6)';x.fillRect(W/2-110,H/2-60,220,110);
        x.fillStyle='#fff';x.font='bold 20px system-ui';x.textAlign='center';x.textBaseline='middle';
        const m=medal(sc);
        x.fillText(m?m+' — Score: '+sc:'Score: '+sc,W/2,H/2-28);
        x.font='14px system-ui';
        if(sc>=best&&sc>0){x.fillStyle=accent;x.fillText('New best!',W/2,H/2-4);x.fillStyle='#fff';}
        else if(best>0)x.fillText('Best: '+best+(medal(best)?' ('+medal(best)+')':''),W/2,H/2-4);
        x.fillText('Tap or Space to retry',W/2,H/2+24);
        x.fillText('Bronze 4+   Silver 10+   Gold 20+',W/2,H/2+46);
      }
    }
    const key=e=>{if(e.key==' '||e.key==='ArrowUp'){e.preventDefault();flap();}};
    c.onpointerdown=flap;document.addEventListener('keydown',key);
    reset();tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',key);};
  }
});
