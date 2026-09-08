/* Original synthesized sonic identity. No recordings, downloads, or autoplay. */
(() => {
  'use strict';
  const DURATION = 4.85;
  function compose(context) {
    const rate=context.sampleRate, length=Math.ceil(rate*DURATION);
    const buffer=context.createBuffer(2,length,rate),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
    const tau=Math.PI*2;
    let seed=2217,air=0,lowAir=0;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    const envelope=(t,start,end,attack=.1)=>t<start||t>end?0:smooth((t-start)/attack)*smooth((end-t)/.35);
    const chime=(t,start,freq)=>{
      const age=t-start;if(age<0||age>1.8)return 0;
      return (1-Math.exp(-age*80))*Math.exp(-age*2.8)*(
        Math.sin(tau*freq*age)+.24*Math.sin(tau*freq*2.003*age)*Math.exp(-age*2));
    };
    for(let i=0;i<length;i++){
      const t=i/rate;
      seed=(seed*1664525+1013904223)>>>0;
      const noise=seed/4294967296*2-1;
      air+=.1*(noise-air);lowAir+=.012*(noise-lowAir);
      const sweep=envelope(t,.05,2.6,.55)*(.3+.7*Math.sin(Math.min(t/2.6,1)*Math.PI)**2);
      const wind=(air-lowAir)*sweep*.3;
      const pad=envelope(t,.12,4.7,.75)*(.026*Math.sin(tau*130.8128*t)+.019*Math.sin(tau*196*t)+.012*Math.sin(tau*261.6256*t));
      const assemble=t-2.12;
      const impact=assemble<0?0:.14*(1-Math.exp(-assemble*65))*Math.exp(-assemble*4.2)*Math.sin(tau*(73.416*assemble+5*(1-Math.exp(-assemble*9))));
      const bell=chime(t,2.38,523.251)*.07+chime(t,2.67,783.991)*.053+chime(t,2.94,1046.502)*.036;
      const shimmer=envelope(t,2.4,3.95,.16)*.012*Math.sin(tau*1567.98*t)*(.5+.5*Math.sin(tau*3.1*t));
      const pan=Math.sin(t*.8)*.24,fade=smooth(t/.035)*smooth((4.8-t)/.5);
      left[i]=(pad+impact+bell+shimmer+wind*(1-pan))*fade;
      right[i]=(pad+impact+bell+shimmer+wind*(1+pan))*fade;
    }
    // Quiet stereo echoes, calculated once; no feedback network remains running.
    const dryLeft=left.slice(),dryRight=right.slice();
    for(const [seconds,gain] of [[.117,.12],[.233,.07]]){
      const offset=Math.floor(seconds*rate);
      for(let i=offset;i<length;i++){
        const tail=smooth((4.8-i/rate)/.4);
        left[i]+=dryRight[i-offset]*gain*tail;right[i]+=dryLeft[i-offset]*gain*tail;
      }
    }
    return buffer;
  }
  window.AtusengIntroSound = ({started,onState=()=>{}}) => {
    const Audio=window.AudioContext||window.webkitAudioContext;
    let context=null,buffer=null,current=null,pending=false,disposed=false,ticket=0;
    const elapsed=()=>Math.max(0,(performance.now()-started)/1000);
    const state=value=>{if(!disposed)onState(value);};
    function release(playback){
      if(!playback)return;
      const {source,gain}=playback,now=context.currentTime;
      try{
        gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);
        gain.gain.linearRampToValueAtTime(0,now+.035);source.stop(now+.04);
      }catch{source.disconnect();gain.disconnect();}
    }
    async function toggle(){
      if(disposed||!Audio)return;
      if(current||pending){ticket++;pending=false;const old=current;current=null;release(old);state('off');return;}
      if(elapsed()>=4.6){state('finished');return;}
      const token=++ticket;pending=true;state('pending');
      try{
        // Construct/resume only inside this explicit click/keyboard activation.
        if(!context)context=new Audio();
        await context.resume();
        if(disposed||token!==ticket)return;
        if(!buffer)buffer=compose(context);
        pending=false;
        const offset=elapsed();
        if(offset>=4.6){state('finished');return;}
        if(context.state!=='running'){state('unavailable');return;}
        const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
        source.buffer=buffer;source.connect(gain);gain.connect(context.destination);
        gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.5,now+.025);
        const playback={source,gain};current=playback;
        source.onended=()=>{source.disconnect();gain.disconnect();if(current===playback){current=null;state('finished');}};
        source.start(now,offset,DURATION-offset);state('on');
      }catch{
        if(disposed||token!==ticket)return;
        pending=false;release(current);current=null;state('unavailable');
      }
    }
    function dispose(){
      if(disposed)return;
      disposed=true;ticket++;pending=false;release(current);current=null;buffer=null;
      if(context){const closing=context;setTimeout(()=>{closing.close().catch(()=>{});},50);}
    }
    state(Audio?'off':'unavailable');
    return {toggle,dispose};
  };
})();
