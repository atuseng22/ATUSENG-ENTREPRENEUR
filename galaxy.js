/* A depth-projected spiral star system. Every star orbits in 3D space;
   small in-memory light sprites provide bloom without external textures. */
(() => {
  const canvas=document.querySelector('#nebula-stars');
  const visual=document.querySelector('.nebula-visual');
  const button=document.querySelector('.cosmos-toggle');
  if(!canvas||!visual)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx){if(button)button.hidden=true;return}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches,visible=false,frame=0,last=null,clock=0,width=1,height=1;
  let seed=7117;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(random(),.00001)))*Math.cos(random()*Math.PI*2);
  function sprite(color){
    const tile=document.createElement('canvas');tile.width=tile.height=64;
    const c=tile.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba('+color+',1)');g.addColorStop(.08,'rgba('+color+',.85)');
    g.addColorStop(.24,'rgba('+color+',.24)');g.addColorStop(.58,'rgba('+color+',.045)');g.addColorStop(1,'rgba('+color+',0)');
    c.fillStyle=g;c.fillRect(0,0,64,64);return tile;
  }
  const lights=[sprite('139,70,255'),sprite('187,133,255'),sprite('236,217,255')];
  const stars=[],dust=[];
  // Four logarithmic spiral arms, sparse outer disc, dense central bulge.
  for(let i=0;i<5100;i++){
    const r=.08+Math.pow(random(),.8)*1.72;
    const arm=i%4;
    const angle=arm*Math.PI*.5+Math.log(r+.2)*2.4+gaussian()*(.09+.1*r);
    stars.push({r,angle,z:gaussian()*.045*(1.5-r*.4),size:.7+random()*1.5,phase:random()*6.28,power:.3+random()*.6,color:random()>.74?2:1});
  }
  for(let i=0;i<950;i++){
    const r=.12+random()*1.65;
    dust.push({r,angle:(i%4)*Math.PI*.5+Math.log(r+.2)*2.4+gaussian()*.16,z:gaussian()*.04,size:13+random()*22,phase:0,power:.016+random()*.018,color:i%3===0?1:0});
  }
  for(let i=0;i<750;i++){
    const r=Math.pow(random(),1.5)*.43;
    stars.push({r,angle:random()*6.28,z:gaussian()*.07,size:.6+random()*1.3,phase:random()*6.28,power:.32,color:2});
  }
  const background=Array.from({length:90},()=>({x:random(),y:random(),size:.35+random()*.7,phase:random()*6.28}));
  function resize(){
    const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);
    resume();
  }
  function updateButton(){if(button){button.textContent=paused?'Putar animasi galaksi':'Jeda animasi galaksi';button.setAttribute('aria-pressed',String(paused))}}
  function render(now){
    frame=0;if(!visible||document.hidden)return;
    if(last!==null&&!paused&&now-last<32){frame=requestAnimationFrame(render);return}
    if(!paused&&last!==null)clock+=Math.min(now-last,100)/1000;
    last=now;
    ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    for(const s of background){ctx.fillStyle='rgba(209,183,255,'+(.2+.3*(.5+.5*Math.sin(clock*.6+s.phase)))+')';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.size,0,Math.PI*2);ctx.fill()}
    const scale=Math.min(width,height)*1.13;
    const tilt=.69+.045*Math.sin(clock*.13),ct=Math.cos(tilt),st=Math.sin(tilt);
    const roll=-.42,cr=Math.cos(roll),sr=Math.sin(roll);
    const cx=width*.5,cy=height*.48;
    ctx.globalCompositeOperation='lighter';
    function paint(p,isDust){
      const a=p.angle+clock*.18;
      const x=Math.cos(a)*p.r,y=Math.sin(a)*p.r;
      const vy=y*ct-p.z*st,vz=y*st+p.z*ct;
      const perspective=scale/(4+vz);
      const sx=cx+(x*cr-vy*sr)*perspective,sy=cy+(x*sr+vy*cr)*perspective;
      const size=p.size*(isDust?1:3.5)*4/(4+vz);
      ctx.globalAlpha=p.power*(isDust?1:(.78+.22*Math.sin(clock*1.2+p.phase)));
      ctx.drawImage(lights[p.color],sx-size*.5,sy-size*.5,size,size);
    }
    for(const p of dust)paint(p,true);
    for(const p of stars)paint(p,false);
    // Broad low-intensity halo plus a compact pearly nucleus, not a solid disc.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(roll);ctx.scale(1,.74);ctx.globalAlpha=.7;
    const halo=ctx.createRadialGradient(0,0,0,0,0,scale*.15);
    halo.addColorStop(0,'rgba(237,220,255,.45)');halo.addColorStop(.14,'rgba(194,147,255,.22)');halo.addColorStop(.4,'rgba(121,53,245,.08)');halo.addColorStop(1,'rgba(94,38,180,0)');ctx.fillStyle=halo;ctx.fillRect(-scale*.15,-scale*.15,scale*.3,scale*.3);
    ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';visual.classList.add('nebula-ready');
    if(!paused)frame=requestAnimationFrame(render);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;last=null}
  function resume(){if(visible&&!document.hidden&&!frame){last=null;frame=requestAnimationFrame(render)}}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop()}).observe(visual);
  document.addEventListener('visibilitychange',()=>{stop();resume()});
  reduced.addEventListener('change',()=>{paused=reduced.matches;stop();updateButton();resume()});
  button?.addEventListener('click',()=>{paused=!paused;stop();updateButton();resume()});
  updateButton();
})();
