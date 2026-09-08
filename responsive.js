/* Match anchor offsets to the real navigation height, including rotation/zoom. */
(() => {
  const header=document.querySelector('.topbar');
  const root=document.documentElement;
  function measureHeader(){
    if(!header)return;
    const height=Math.ceil(header.getBoundingClientRect().height);
    if(height>0)root.style.setProperty('--header-height',height+'px');
  }
  function measureViewport(){
    const height=window.visualViewport?.height||window.innerHeight;
    if(height>0)root.style.setProperty('--available-height',Math.floor(height)+'px');
  }
  if(header&&'ResizeObserver'in window)new ResizeObserver(measureHeader).observe(header);
  window.addEventListener('resize',()=>{measureHeader();measureViewport();});
  window.visualViewport?.addEventListener('resize',measureViewport);
  measureHeader();measureViewport();
})();
