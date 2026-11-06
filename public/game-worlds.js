/* Visual-only game identities; tournament data and appearance preferences remain separate. */
(function(){
 const worlds={yugioh:true,pokemon:true,digimon:true,lorcana:true,onepiece:true};
 const root=document.documentElement;
 function selected(){const query=new URLSearchParams(location.search).get('game');if(worlds[query])return query;try{const stored=localStorage.getItem('duel-arena-game');if(worlds[stored])return stored;}catch{}return 'yugioh';}
 root.dataset.game=selected();
 window.applyGameWorld=function(game){
  if(!worlds[game])return;const entry=document.body?.classList.contains('entry-body');
  if(entry){delete root.dataset.game;return;}
  root.dataset.game=game;
  const hero=document.querySelector('.hero');if(hero){const number=hero.querySelector('.hero-number');if(number)number.hidden=true;}
  let banner=document.getElementById('gameWorldBanner');
  if(!hero&&!banner){const main=document.querySelector('main');if(main){banner=document.createElement('div');banner.id='gameWorldBanner';banner.className='world-banner';banner.setAttribute('aria-hidden','true');const anchor=main.querySelector('#storePicker')||main.firstElementChild;main.insertBefore(banner,anchor);}}
  const credit=document.querySelector('.ubw-credit');if(credit)credit.textContent='Duelist Kingdom · Ilustrações originais. Projeto independente.';
 };
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.entry-games a').forEach(card=>{const game=new URL(card.href).searchParams.get('game');if(worlds[game])card.dataset.worldCard=game;});
  window.applyGameWorld(document.getElementById('leagueGame')?.value||window.arenaGame||selected());
 });
 document.addEventListener('click',e=>{const tab=e.target.closest('[data-game]');if(tab)window.applyGameWorld(tab.dataset.game);});
 document.addEventListener('change',e=>{if(e.target.id==='leagueGame')window.applyGameWorld(e.target.value);});
 document.addEventListener('arena-game-changed',()=>window.applyGameWorld(window.arenaGame));
})();
