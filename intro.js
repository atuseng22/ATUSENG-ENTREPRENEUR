/* One cinematic opening per document. No scroll hooks, replay, or dependencies. */
(() => {
  'use strict';
  const overlay = document.querySelector('.atuseng-intro');
  if (!overlay || overlay.dataset.initialized) return;
  overlay.dataset.initialized = 'true';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || document.hidden) { overlay.remove(); return; }

  const skip = overlay.querySelector('.skip-intro');
  const soundButton = overlay.querySelector('.intro-sound-toggle');
  let sound = null;
  const canvas = overlay.querySelector('#intro-lightfield');
  const previousFocus = document.activeElement;
  const content = [...document.querySelectorAll('body > header, body > main, body > footer')];
  const savedInert = content.map(node => node.inert);
  let frame = null, safetyTimer = null, sizeObserver = null, closed = false;
  const started = performance.now();
  const clamp = v => Math.min(1, Math.max(0, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const easeOut = v => 1 - Math.pow(1 - clamp(v), 3);

  function close() {
    if (closed) return;
    closed = true;
    sound?.dispose();
    soundButton?.removeEventListener('click', onSound);
    if (frame !== null) cancelAnimationFrame(frame);
    clearTimeout(safetyTimer);
    sizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('keydown', onKey);
    reduced.removeEventListener('change', onReduced);
    overlay.removeEventListener('animationend', onEnd);
    skip?.removeEventListener('click', close);
    const ownsFocus = overlay.contains(document.activeElement);
    content.forEach((node, i) => { node.inert = savedInert[i]; });
    document.documentElement.classList.remove('intro-playing');
    overlay.remove();
    if (ownsFocus) {
      const target = previousFocus && previousFocus !== document.body && previousFocus.isConnected
        ? previousFocus : document.querySelector('.brand');
      target?.focus({preventScroll: true});
    }
  }
  function onVisibility() { if (document.hidden) close(); }
  function onReduced() { if (reduced.matches) close(); }
  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const controls=[soundButton,skip].filter(button=>button&&!button.hidden&&!button.disabled);
      if(!controls.length)return;
      event.preventDefault();
      const index=controls.indexOf(document.activeElement);
      const next=index<0?(event.shiftKey?controls.length-1:0):(index+(event.shiftKey?-1:1)+controls.length)%controls.length;
      controls[next].focus({preventScroll:true});
    }
  }
  function onSound() { sound?.toggle(); }
  function onEnd(event) { if (event.target === overlay && event.animationName === 'intro-dissolve') close(); }
  // Register the exit paths before initializing any drawing, so a rendering failure cannot trap the page.
  skip?.addEventListener('click', close);
  overlay.addEventListener('animationend', onEnd);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onReduced);
  safetyTimer = setTimeout(close, 4950);
  if(soundButton && window.AtusengIntroSound){
    sound=window.AtusengIntroSound({started,onState(value){
      soundButton.hidden=false;
      soundButton.setAttribute('aria-pressed',String(value==='on'));
      soundButton.textContent=({off:'Aktifkan suara',pending:'Mengaktifkan…',on:'Matikan suara',unavailable:'Suara tidak tersedia',finished:'Suara selesai'})[value];
      soundButton.disabled=value==='unavailable'||value==='finished';
    }});
    soundButton.addEventListener('click',onSound);
  }
  content.forEach(node => { node.inert = true; });
  document.documentElement.classList.add('intro-playing');
  skip?.focus({preventScroll: true});

  let ctx = null, width = 1, height = 1;
  // Coordinates follow the two silhouettes of the approved 1536 × 1024 logo.
  const outlines = [
    [[490,647],[734,158],[803,158],[879,314],[814,382],[769,294],[654,534],[777,491],[646,647]],
    [[888,334],[1046,647],[889,647],[927,609],[843,445],[753,476]]
  ].map(points => points.map(([x,y]) => [(x-768)/500,(y-403)/500]));
  const pivots = [[-.1,.04],[.26,.22]];
  let seed = 4701;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const particles = Array.from({length: 460}, (_, i) => {
    const part = i % 2, points = outlines[part], edge = i % points.length;
    const a = points[edge], b = points[(edge+1)%points.length], f = random();
    const angle = random()*Math.PI*2, radius = 1.1+random()*1.5;
    return {part, target:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],
      x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.62,z:(random()-.5)*2.3,
      delay:random()*.25,size:.6+random()*.8,phase:random()*6.28};
  });

  function project(x,y,z) {
    const perspective = 4/(4+z), scale = width/3.072;
    return {x:width*.5+x*scale*perspective,y:height*(403/1024)+y*scale*perspective,z};
  }
  function transform(point, depth, part, time) {
    const progress = easeOut((time-(part ? .8 : .58))/1.55), remaining = 1-progress;
    const pivot = pivots[part], direction = part ? 1 : -1;
    let x=point[0]-pivot[0], y=point[1]-pivot[1], z=depth;
    const yaw=direction*1.22*remaining, roll=direction*.32*remaining, tilt=-.3*remaining;
    const xx=x*Math.cos(yaw)+z*Math.sin(yaw), zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
    const yy=y*Math.cos(tilt)-zz*Math.sin(tilt), zzz=y*Math.sin(tilt)+zz*Math.cos(tilt);
    x=xx*Math.cos(roll)-yy*Math.sin(roll)+pivot[0]+direction*1.12*remaining;
    y=xx*Math.sin(roll)+yy*Math.cos(roll)+pivot[1]+direction*.23*remaining;
    return project(x,y,zzz+1.05*remaining);
  }
  function path(points) {
    ctx.beginPath();
    points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath();
  }
  function fill(points, color, stroke) {
    path(points); ctx.fillStyle=color;ctx.fill();
    if (stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(.5,width/1500);ctx.stroke();}
  }
  function drawPiece(part, time) {
    const points=outlines[part], alpha=smooth((time-(part ? .9 : .68))/.62);
    if(alpha===0)return;
    ctx.save();ctx.globalAlpha=alpha;
    const front=points.map(p=>transform(p,0,part,time));
    const back=points.map(p=>transform(p,.105,part,time));
    const sides=points.map((_,i)=>{
      const j=(i+1)%points.length;
      return {points:[front[i],front[j],back[j],back[i]],depth:(front[i].z+front[j].z+back[i].z+back[j].z)/4,i};
    }).sort((a,b)=>b.depth-a.depth);
    fill(back,part?'#4b3b64':'#2a104c','#9760c970');
    for(const side of sides){
      const gradient=ctx.createLinearGradient(side.points[0].x,side.points[0].y,side.points[2].x+1,side.points[2].y+1);
      gradient.addColorStop(0,part?'#c7b8df':'#a77ae6');gradient.addColorStop(.3,part?'#746080':'#54237f');gradient.addColorStop(1,part?'#3b2d52':'#28103f');
      fill(side.points,gradient,part?'#b7a0d055':'#915fc455');
    }
    const minX=Math.min(...front.map(p=>p.x)),maxX=Math.max(...front.map(p=>p.x));
    const minY=Math.min(...front.map(p=>p.y)),maxY=Math.max(...front.map(p=>p.y));
    const material=ctx.createLinearGradient(minX,minY,maxX,maxY);
    const colors=part?['#fff4ff','#c5b2d6','#9d86b8','#6f537f','#d3bfdc']:['#d9adff','#9853ed','#6930b1','#39166a','#8950be'];
    colors.forEach((color,i)=>material.addColorStop(i/4,color));
    ctx.shadowColor=part?'#cba9ff65':'#a05cff66';ctx.shadowBlur=width*.012;
    fill(front,material,part?'#f0dcffcc':'#d9acffee');ctx.shadowBlur=0;
    ctx.save();path(front);ctx.clip();
    // Fine brushed-metal highlights stay clipped to each solid face.
    ctx.strokeStyle=part?'#f3e6ff13':'#e4bdff16';ctx.lineWidth=.55;
    for(let x=minX-(maxY-minY);x<maxX;x+=Math.max(3,width*.005)){
      ctx.beginPath();ctx.moveTo(x,minY);ctx.lineTo(x+maxY-minY,maxY);ctx.stroke();
    }
    const sweep=smooth((time-2.35)/.82),center=width*(.22+sweep*.55),band=width*.095;
    if(time>2.35&&time<3.2){
      const shine=ctx.createLinearGradient(center-band,0,center+band,0);
      shine.addColorStop(0,'#f3eaff00');shine.addColorStop(.5,'#f3eaff70');shine.addColorStop(1,'#f3eaff00');
      ctx.fillStyle=shine;ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
    }
    ctx.restore();ctx.restore();
  }
  function draw(time) {
    ctx.clearRect(0,0,width,height);
    const nucleus=project(0,.05,0),radius=width*.24;
    const atmosphere=ctx.createRadialGradient(nucleus.x,nucleus.y,0,nucleus.x,nucleus.y,radius);
    atmosphere.addColorStop(0,'#9b55e81b');atmosphere.addColorStop(1,'#9b55e800');
    ctx.fillStyle=atmosphere;ctx.fillRect(nucleus.x-radius,nucleus.y-radius,radius*2,radius*2);
    for(const p of particles){
      const progress=smooth((time-p.delay)/1.48),twist=(1-progress)*time*.65;
      const ox=p.x*Math.cos(twist)-p.y*Math.sin(twist),oy=p.x*Math.sin(twist)+p.y*Math.cos(twist);
      const target=project(ox*(1-progress)+p.target[0]*progress,oy*(1-progress)+p.target[1]*progress,p.z*(1-progress));
      const alpha=(1-smooth((time-1.45)/.75))*(.35+.5*Math.sin(p.phase+time)**2)*smooth(time/.2);
      if(alpha<.005)continue;
      ctx.globalAlpha=alpha;ctx.fillStyle=p.part?'#e1ceff':'#b57bff';
      ctx.beginPath();ctx.arc(target.x,target.y,p.size*Math.min(width/700,1.4),0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;drawPiece(0,time);drawPiece(1,time);
    // Sparse edge glints lead the eye towards the completed mark, without flashing.
    const glintAlpha=smooth((time-1.8)/.5)*(1-smooth((time-3.2)/.6));
    for(let part=0;part<2;part++){
      const points=outlines[part],travel=clamp((time-1.7)/1.6)*(points.length-1),edge=Math.min(points.length-2,Math.floor(travel)),f=travel-edge;
      const a=points[edge],b=points[edge+1];
      const p=transform([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],-.002,part,time);
      const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,width*.011);
      glow.addColorStop(0,'#fff1ff');glow.addColorStop(.16,'#e1b8ffab');glow.addColorStop(1,'#c28dff00');
      ctx.globalAlpha=glintAlpha;ctx.fillStyle=glow;ctx.fillRect(p.x-width*.011,p.y-width*.011,width*.022,width*.022);
    }
    ctx.globalAlpha=1;
  }
  function resize() {
    if (!ctx || closed) return;
    const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function tick(now) {
    frame=null;if(closed)return;
    const time=(now-started)/1000;
    if(time>=4.85){close();return;}
    try { draw(time);overlay.classList.add('intro-rendered'); }
    catch { close();return; }
    frame=requestAnimationFrame(tick);
  }
  try {
    ctx=canvas?.getContext('2d',{alpha:true});
    if(!ctx)return; // The approved-logo CSS fallback still exits on its own.
    resize();
    if('ResizeObserver' in window){sizeObserver=new ResizeObserver(resize);sizeObserver.observe(canvas);}
    else window.addEventListener('resize',resize);
    frame=requestAnimationFrame(tick);
  } catch { close(); }
})();
