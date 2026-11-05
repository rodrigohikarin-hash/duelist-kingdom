/* Apply before styles paint; appearance preferences never touch tournament data. */
(function(){
  const key='duel-arena-theme';
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  let saved=null;
  try{saved=localStorage.getItem(key);}catch{}
  let manual=saved==='light'||saved==='dark';
  function apply(theme){
    document.documentElement.dataset.theme=theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme));
    });
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=theme==='dark'?'#161321':'#f6f1e5';
  }
  apply(manual?saved:media.matches?'dark':'light');
  document.addEventListener('DOMContentLoaded',()=>{
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-choice]').forEach(button=>{
      button.addEventListener('click',()=>{
        manual=true;const theme=button.dataset.themeChoice;apply(theme);
        try{localStorage.setItem(key,theme);}catch{}
      });
    });
  });
  media.addEventListener('change',event=>{if(!manual)apply(event.matches?'dark':'light');});
})();
