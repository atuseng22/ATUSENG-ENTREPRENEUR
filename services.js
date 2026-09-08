(() => {
  'use strict';
  const canvas = document.getElementById('service-orbits');
  const button = document.getElementById('service-motion');
  const section = document.getElementById('services');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) { if (button) button.hidden = true; return; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, visible = false, frame = 0, last = 0, time = 0, width = 1, height = 1;
  const particles = Array.from({length: 1050}, (_, i) => ({
    angle: i * 2.39996323, ring: i % 3, radius: 1.18 + ((i * 37) % 101) / 450,
    size: .6 + (i % 5) * .22, phase: i * .71
  }));
  function project(x, y, z) {
    const yaw = time * .18, cy = Math.cos(yaw), sy = Math.sin(yaw);
    const xx = x * cy + z * sy, zz = -x * sy + z * cy;
    const tilt = .36, yy = y * Math.cos(tilt) - zz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
    const scale = Math.min(width, height) * .94 / (3.8 + depth);
    return {x: width / 2 + xx * scale, y: height / 2 + yy * scale, depth, scale};
  }
  function position(angle, radius, ring) {
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    const tilt = [.4, 1.3, 2.25][ring];
    return project(x, y * Math.cos(tilt), y * Math.sin(tilt));
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,Math.min(width,height)*.46);
    glow.addColorStop(0,'#9e61ee25'); glow.addColorStop(.55,'#7739ce18'); glow.addColorStop(1,'#7739ce00');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    for(let ring=0;ring<3;ring++) {
      ctx.beginPath();
      for(let j=0;j<=150;j++){const p=position(j/150*Math.PI*2,1.3,ring);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
      ctx.strokeStyle=['#b583f955','#d9c2ff40','#d9ff8335'][ring];ctx.lineWidth=.8;ctx.stroke();
    }
    const points=particles.map(p=>({...position(p.angle + time * (.38 + p.ring * .1),p.radius,p.ring),size:p.size,ring:p.ring,phase:p.phase})).sort((a,b)=>b.depth-a.depth);
    for(const p of points){
      ctx.globalAlpha=(.38+(.5+.5*Math.sin(time*2+p.phase))*.45)*(p.depth>0?.55:1);
      ctx.fillStyle=p.ring===2&&p.phase%7<.7?'#dcffa0':p.depth<0?'#ddc6ff':'#9560d9';
      ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.4,p.size*p.scale/100),0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    for(let ring=0;ring<3;ring++){
      const p=position(time*(.65+ring*.12)+ring*2.1,1.3,ring);
      const flare=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,19);
      flare.addColorStop(0,'#ffffff');flare.addColorStop(.12,ring===2?'#d9ff83':'#dec4ff');flare.addColorStop(.35,'#ba79f899');flare.addColorStop(1,'#aa66ee00');
      ctx.fillStyle=flare;ctx.fillRect(p.x-19,p.y-19,38,38);
    }
  }
  function tick(now){frame=0;if(paused||!visible||document.hidden)return;if(now-last>=30){time+=Math.min((now-last)/1000,.05);last=now;draw();}frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);frame=0;const running=!paused&&visible&&!document.hidden;section.classList.toggle('services-motion-on',running);if(button){button.textContent=paused?'Putar animasi ↗':'Jeda animasi ↗';button.setAttribute('aria-pressed',String(paused));}if(running){last=performance.now();frame=requestAnimationFrame(tick);}}
  function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  button?.addEventListener('click',()=>{paused=!paused;sync();});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(section);else visible=true;
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  resize();sync();
})();
