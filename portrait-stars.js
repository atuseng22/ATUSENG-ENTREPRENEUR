/* Two depth layers around the portrait; the photograph itself stays still. */
(() => {
  const scene=document.querySelector('.about-portrait-scene');
  if(!scene)return;
  const back=scene.querySelector('.portrait-meteors-back'),front=scene.querySelector('.portrait-meteors-front');
  if(!back||!front)return;
  const bg=back.getContext('2d'),fg=front.getContext('2d');
  if(!bg||!fg)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,visible=false,frame=null,last=0,time=0;
  let seed=221;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=Array.from({length:115},()=>({x:random(),y:random(),z:random(),phase:random()*6.28}));
  function halo(c,x,y,size,alpha){
    const g=c.createRadialGradient(x,y,0,x,y,size);g.addColorStop(0,'#efe2ff');g.addColorStop(.12,'#cca0ffa0');g.addColorStop(.4,'#9250d93a');g.addColorStop(1,'#9250d900');
    c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-size,y-size,size*2,size*2);c.globalAlpha=1;
  }
  function meteor(c,progress,index,isFront){
    // Foreground paths stay below 43% of the scene, clear of the face.
    const startY=isFront?.43+index*.075:.07+index*.16;
    const x=(-.24+progress*1.55)*width,y=(startY+progress*.29)*height;
    const tail=width*(isFront?.27:.18),dy=tail*.29*height/(1.55*width);
    const opacity=Math.sin(progress*Math.PI)*(isFront?.82:.5);
    const trail=c.createLinearGradient(x-tail,y-dy,x,y);
    trail.addColorStop(0,'#ab6cff00');trail.addColorStop(.55,'#ab6cff38');trail.addColorStop(1,'#ead8ff');
    c.globalAlpha=opacity;c.strokeStyle=trail;c.lineWidth=isFront?1.8:.85;c.beginPath();c.moveTo(x-tail,y-dy);c.lineTo(x,y);c.stroke();
    halo(c,x,y,isFront?12:7,opacity);
    for(let j=1;j<13;j++){
      const spread=Math.sin(index*3+j*2.7+time)*2;
      c.globalAlpha=opacity*(1-j/13)*.6;c.fillStyle='#c3a1ef';c.beginPath();c.arc(x-tail*j/16,y-dy*j/16+spread,.7,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
  }
  function draw(){
    bg.clearRect(0,0,width,height);fg.clearRect(0,0,width,height);
    for(const s of stars){
      const x=(s.x+Math.sin(time*.13+s.phase)*.013)*width,y=((s.y-time*(.005+s.z*.006))%1+1)%1*height;
      const opacity=.2+(.5+.5*Math.sin(time*1.1+s.phase))*.45;
      bg.globalAlpha=opacity;bg.fillStyle=s.z>.7?'#e1c8ff':'#aa7fd6';bg.beginPath();bg.arc(x,y,.45+s.z,0,Math.PI*2);bg.fill();
      if(s.z>.91&&y>height*.48)halo(fg,x,y,4,opacity*.3);
    }
    bg.globalAlpha=1;
    if(reduced.matches)return;
    // Staggered passes leave breathing room: no shower of flashes.
    for(let i=0;i<3;i++){
      const phase=(time+i*1.75)%5.8;if(phase<1.65)meteor(bg,phase/1.65,i,false);
    }
    for(let i=0;i<2;i++){
      const phase=(time+.65+i*2.7)%6.8;if(phase<1.85)meteor(fg,phase/1.85,i,true);
    }
  }
  function tick(now){frame=null;if(!visible||document.hidden||reduced.matches)return;if(now-last>=30){time+=Math.min((now-last)/1000,.06);last=now;draw();}frame=requestAnimationFrame(tick);}
  function sync(){if(frame!==null)cancelAnimationFrame(frame);frame=null;if(visible&&!document.hidden&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}else if(reduced.matches)draw();}
  function resize(){const rect=scene.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(window.devicePixelRatio||1,1.5);for(const [canvas,c]of [[back,bg],[front,fg]]){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);}draw();}
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(scene);else visible=true;
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(scene);else window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);resize();sync();
})();
