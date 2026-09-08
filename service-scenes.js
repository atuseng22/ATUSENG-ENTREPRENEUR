(() => {
  'use strict';
  const elements = [...document.querySelectorAll('[data-service-scene]')];
  const control = document.getElementById('service-motion');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = 0, time = 0;
  const scenes = elements.map(canvas => ({canvas, ctx: canvas.getContext('2d'), kind: canvas.dataset.serviceScene, visible: false, width: 1, height: 1})).filter(s => s.ctx);
  const tau = Math.PI * 2;
  function project(s,x,y,z) {
    const scale = Math.min(s.width / 3.4, s.height / 2.6) * 4.7 / (4.7 + z);
    return {x:s.width/2+x*scale,y:s.height/2+y*scale,z};
  }
  function polygon(s,points,fill,stroke) {
    const c=s.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.stroke();}
  }
  function plane(s,x,y,z,w,h,yaw,fill,stroke) {
    const cy=Math.cos(yaw),sy=Math.sin(yaw);
    const pts=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([dx,dy])=>project(s,x+dx*cy,y+dy,z+dx*sy));
    polygon(s,pts,fill,stroke);
  }
  function glow(s,x,y,r,color) {
    const c=s.ctx,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#9855ed00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  function website(s,t) {
    const yaw=-.24+Math.sin(t*.7)*.16;
    const expand=(1-Math.cos(t*1.05))*.5;
    // Three separate depth planes converge into a single website, then unfold.
    for(let layer=2;layer>=0;layer--) {
      const z=layer*(.12+expand*.34),x=(layer-1)*expand*.27,y=(layer-1)*expand*.22;
      plane(s,x,y,z,2.25,1.48,yaw,layer===0?'#291441ed':'#44236188','#b584ef70');
      if(layer===0){
        for(let i=0;i<3;i++)plane(s,x-.88+i*.11,y-.58,z-.01,.045,.045,yaw,'#ddc0ff');
        plane(s,x-.48,y-.25,z-.02,.84,.1,yaw,'#e9d9ff');
        plane(s,x-.61,y-.07,z-.02,.58,.06,yaw,'#ab86d4');
        plane(s,x+.56,y-.16,z-.03,.62,.48,yaw,'#8850c9','#c795fa');
        for(let i=0;i<3;i++){
          const lift=Math.sin(t*1.6-i*.75)*.06;
          plane(s,x-.68+i*.68,y+.37+lift,z-.07-expand*.12,.53,.33,yaw,['#8752bb','#67349b','#a46ed9'][i],'#c89bf47a');
        }
        const scanY=y-.49+((t*.38)%1)*1.09;
        plane(s,x,scanY,z-.09,2.07,.016,yaw,'#d9ff83aa');
      }else{
        for(let i=0;i<3;i++)plane(s,x-.45,y-.3+i*.25,z-.02,1.02,.07,yaw,'#b58ce844');
      }
    }
  }
  function ribbon(s,t) {
    const faces=[],n=160;
    // A continuous twisted ribbon, not a star, logo, or orbit emblem.
    function point(u,edge){
      const twist=u*1.5+t*.9, radius=.83+edge*.21*Math.cos(twist);
      let x=radius*Math.cos(u),y=radius*Math.sin(u),z=edge*.26*Math.sin(twist);
      const tilt=.7, yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt);
      const spin=t*.48;return project(s,x*Math.cos(spin)+zz*Math.sin(spin),yy,-x*Math.sin(spin)+zz*Math.cos(spin));
    }
    for(let i=0;i<n;i++){
      const u=i/n*tau,pts=[point(u,-1),point(u,1),point(u+tau/n,1),point(u+tau/n,-1)];
      faces.push({pts,z:pts.reduce((v,p)=>v+p.z,0)/4,u});
    }
    faces.sort((a,b)=>b.z-a.z);
    for(const f of faces){const light=46+25*(.5+.5*Math.sin(f.u*2-t*1.8));polygon(s,f.pts,`hsl(269 75% ${light}%)`,'#d8bcff26');}
    for(let k=0;k<18;k++){
      const p=point(t*.85+k*.026,1),a=1-k/18;s.ctx.globalAlpha=a;
      glow(s,p.x,p.y,k===0?10:3,k===0?'#f9f0ff':'#d7b2ff');
    }s.ctx.globalAlpha=1;
  }
  function catalog(s,t) {
    const cards=Array.from({length:3},(_,i)=>{const a=t*.75+i*tau/3;return {i,x:Math.sin(a)*.87,z:Math.cos(a)*.75,y:Math.sin(a*2)*.08};}).sort((a,b)=>b.z-a.z);
    for(const card of cards){
      const {x,y,z,i}=card,yaw=-x*.35;
      plane(s,x,y,z,.93,1.39,yaw,'#28183af5','#c194edaa');
      plane(s,x,y-.2,z-.02,.74,.64,yaw,['#653496','#8354a8','#483078'][i],'#c49af044');
      // Product silhouettes: bottle, shopping bag, and a jar.
      if(i===0){plane(s,x,y-.19,z-.06,.21,.37,yaw,'#e1bfff');plane(s,x,y-.42,z-.06,.1,.1,yaw,'#c697f3');}
      else if(i===1){plane(s,x,y-.15,z-.06,.37,.34,yaw,'#ccb2e9');plane(s,x,y-.37,z-.06,.18,.08,yaw,'#aa7fd0');}
      else{plane(s,x,y-.17,z-.06,.33,.28,yaw,'#b491d4');plane(s,x,y-.34,z-.06,.38,.06,yaw,'#ecdfff');}
      plane(s,x-.06,y+.25,z-.04,.53,.045,yaw,'#dec9f3');
      plane(s,x-.12,y+.36,z-.04,.4,.03,yaw,'#9677b4');
      plane(s,x,y+.53,z-.04,.65,.12,yaw,i===1?'#d9ff83':'#9567c2');
    }
  }
  function particle(s,p,size,color){const c=s.ctx;c.fillStyle=color;c.beginPath();c.arc(p.x,p.y,size,0,tau);c.fill();}
  function seed(s,t){
    const points=[];
    for(let i=0;i<360;i++){
      const y=1-2*(i+.5)/360,r=Math.sqrt(1-y*y),a=i*2.399963+t*.65;
      const breath=.83+.1*Math.sin(t*1.6+y*3);
      const x=r*Math.cos(a)*breath,z=r*Math.sin(a)*breath;
      points.push(project(s,x,y*breath,z));
    }
    points.sort((a,b)=>b.z-a.z);
    for(const p of points)particle(s,p,p.z<0?1.5:.8,p.z<0?'#d9b5ff':'#78519c');
    glow(s,s.width/2,s.height/2,30,'#c49bff7a');
  }
  function helix(s,t){
    const points=[];
    for(let i=0;i<95;i++)for(let arm=0;arm<2;arm++){
      const y=i/94*1.95-.975,a=y*5-t*1.5+arm*Math.PI;
      points.push({...project(s,Math.cos(a)*.6,y,Math.sin(a)*.6),i,arm});
    }
    const c=s.ctx;
    for(let i=0;i<95;i+=5){const a=points[i*2],b=points[i*2+1];c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#b48de844';c.lineWidth=1;c.stroke();}
    points.sort((a,b)=>b.z-a.z);
    for(const p of points)particle(s,p,p.z<0?2.1:1,p.arm?'#d4b0ff':'#9960df');
    const a=t*1.7;const p=project(s,Math.cos(a)*.6,Math.sin(t*.7)*.8,Math.sin(a)*.6);glow(s,p.x,p.y,13,'#f1dcff');
  }
  function portal(s,t){
    // A shaded trefoil sculpture: real tube geometry and depth-sorted surfaces.
    const segments=128,sides=10,faces=[],vertices=[];
    const normalize=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length);};
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const center=u=>{const r=.64+.23*Math.cos(3*u);return [r*Math.cos(2*u),r*Math.sin(2*u),.28*Math.sin(3*u)];};
    function rotate(v){
      const yaw=t*.48,tilt=.65+Math.sin(t*.37)*.22;
      const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);
      return [x,v[1]*Math.cos(tilt)-z*Math.sin(tilt),v[1]*Math.sin(tilt)+z*Math.cos(tilt)];
    }
    for(let i=0;i<=segments;i++){
      const u=i/segments*tau,p=center(u),next=center(u+.001);
      const tangent=normalize(next.map((n,j)=>n-p[j]));
      const normal=normalize(cross(tangent,[0,0,1])),binormal=cross(tangent,normal);
      const row=[];
      for(let j=0;j<=sides;j++){
        const a=j/sides*tau,n=normal.map((v,k)=>v*Math.cos(a)+binormal[k]*Math.sin(a));
        const v=rotate(p.map((v,k)=>v+n[k]*.115));
        row.push({point:project(s,...v),normal:rotate(n),u});
      }vertices.push(row);
    }
    for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
      const corners=[vertices[i][j],vertices[i+1][j],vertices[i+1][j+1],vertices[i][j+1]];
      const n=normalize(corners.reduce((sum,v)=>sum.map((k,a)=>k+v.normal[a]),[0,0,0]));
      const diffuse=Math.max(0,n[0]*-.35+n[1]*-.55-n[2]*.76);
      const specular=Math.pow(Math.max(0,n[0]*-.22+n[1]*-.35-n[2]*.91),24);
      const light=24+diffuse*40+specular*30;
      faces.push({points:corners.map(v=>v.point),z:corners.reduce((v,p)=>v+p.point.z,0)/4,color:`hsl(${269+diffuse*8} ${65-specular*43}% ${light}%)`});
    }
    faces.sort((a,b)=>b.z-a.z);
    for(const f of faces)polygon(s,f.points,f.color,f.color);
    // Small comet trails follow the sculpture, never form a star-shaped logo.
    for(let stream=0;stream<3;stream++)for(let k=20;k>=0;k--){
      const u=t*.65+stream*tau/3-k*.012,p=rotate(center(u));
      const point=project(s,p[0]*1.16,p[1]*1.16,p[2]*1.16);
      s.ctx.globalAlpha=(1-k/21)*.8;
      particle(s,point,k===0?2.2:1.1,stream===1?'#ddffab':'#ead9ff');
      if(k===0)glow(s,point.x,point.y,9,'#e8d1ffbb');
    }
    s.ctx.globalAlpha=1;
  }
  function network(s,t){
    const nodes=[],blend=(1-Math.cos(t*.48))*.5,spin=t*.27,c=s.ctx;
    for(let i=0;i<100;i++){
      const y=1-2*(i+.5)/100,a=i*2.399963,r=Math.sqrt(1-y*y);
      const u=i/100*tau,v=i*2.399963;
      const ring=.85+.27*Math.cos(v);
      const x=r*Math.cos(a)*(1-blend)+ring*Math.cos(u)*blend;
      const yy=y*(1-blend)+.27*Math.sin(v)*blend;
      const z=r*Math.sin(a)*(1-blend)+ring*Math.sin(u)*blend;
      const xx=x*Math.cos(spin)+z*Math.sin(spin),zz=-x*Math.sin(spin)+z*Math.cos(spin);
      nodes.push({x:xx,y:yy*.88-zz*.35,z:yy*.35+zz*.88});
    }
    const projected=nodes.map(n=>project(s,n.x,n.y,n.z));
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
      if(distance>.49)continue;
      const p=projected[i],q=projected[j];c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.strokeStyle=`rgba(181,128,247,${(.12+.5*(1-distance/.49))*(p.z>0?.5:1)})`;c.lineWidth=.8;c.stroke();
      if((i+j)%13===0){const f=(t*.5+i*.17)%1;particle(s,{x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f},1.5,'#e9d3ff');}
    }
    projected.sort((a,b)=>b.z-a.z).forEach((p,i)=>{particle(s,p,p.z<0?2.3:1.2,i%17===0?'#d9ff83':'#d4b0fa');if(i%17===0)glow(s,p.x,p.y,11,'#bd85ff85');});
  }
  function signal(s,t){
    const points=[],c=s.ctx;
    // A flowing volumetric wave field. Each stream has depth, not a moving image.
    for(let row=0;row<27;row++){
      const lane=(row/26-.5)*1.25,path=[];
      for(let col=0;col<85;col++){
        const x=col/84*2.7-1.35,phase=x*3-t*1.45+lane*2;
        const envelope=Math.cos(x*.75);
        const y=Math.sin(phase)*(.22+envelope*.24)+lane*.65;
        const z=Math.cos(phase+lane)*.32+lane*.65;
        const p=project(s,x,y,z);path.push(p);
        if(col%3===0)points.push({...p,power:.3+.7*(.5+.5*Math.sin(phase+row*.23))});
      }
      c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=`rgba(178,105,247,${.09+.12*Math.sin(row/26*Math.PI)})`;c.lineWidth=.65;c.stroke();
      const head=(t*.22+row*.071)%1,index=Math.floor(head*84),p=path[index];
      if(row%5===0)glow(s,p.x,p.y,8,row%10===0?'#d7ff9588':'#ead5ff99');
    }
    points.sort((a,b)=>b.z-a.z).forEach(p=>{c.globalAlpha=p.power;particle(s,p,p.z<0?1.5:.85,p.z<0?'#e1bfff':'#9f61e5');});c.globalAlpha=1;
  }
  function draw(s){s.ctx.clearRect(0,0,s.width,s.height);glow(s,s.width/2,s.height*.54,Math.min(s.width,s.height)*.46,'#8748c92a');({website,ribbon,catalog,seed,helix,portal,network,signal}[s.kind]||website)(s,time);}
  function paused(){return document.hidden || (control ? control.getAttribute('aria-pressed')==='true' : reduced.matches);}
  function tick(now){frame=0;if(paused()||!scenes.some(s=>s.visible))return;if(now-last>=30){time+=Math.min((now-last)/1000,.06);last=now;scenes.filter(s=>s.visible).forEach(draw);}frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);frame=0;if(!paused()&&scenes.some(s=>s.visible)){last=performance.now();frame=requestAnimationFrame(tick);}}
  function resize(s){const rect=s.canvas.getBoundingClientRect();s.width=Math.max(1,rect.width);s.height=Math.max(1,rect.height);const dpr=Math.min(window.devicePixelRatio||1,1.5);s.canvas.width=Math.round(s.width*dpr);s.canvas.height=Math.round(s.height*dpr);s.ctx.setTransform(dpr,0,0,dpr,0,0);draw(s);}
  for(const s of scenes){
    resize(s);
    if('ResizeObserver' in window)new ResizeObserver(()=>resize(s)).observe(s.canvas);else window.addEventListener('resize',()=>resize(s));
    if('IntersectionObserver' in window)new IntersectionObserver(entries=>{s.visible=entries[0].isIntersecting;sync();}).observe(s.canvas);else s.visible=true;
  }
  if(control)new MutationObserver(sync).observe(control,{attributes:true,attributeFilter:['aria-pressed']});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
})();
