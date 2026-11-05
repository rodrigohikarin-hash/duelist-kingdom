export const GAMES={
 yugioh:{name:'Yu-Gi-Oh!',formats:['Advanced','Traditional'],minutes:50,link:'https://www.yugioh-card.com/en/events/organizedplay/'},
 pokemon:{name:'Pokémon',formats:['Standard','Expanded','Livre'],minutes:50,link:'https://play.pokemon.com/en-us/resources/rules/'},
 onepiece:{name:'One Piece',formats:['Construído','Livre'],minutes:35,link:'https://en.onepiece-cardgame.com/rules/'},
 lorcana:{name:'Lorcana',formats:['Core Constructed','Infinity Constructed','Livre'],minutes:50,link:'https://www.disneylorcana.com/en-US/resources'},
 digimon:{name:'Digimon',formats:['Construído','Livre'],minutes:50,link:'https://world.digimoncard.com/rule/'}
};
export const gameOf=e=>e.game??'yugioh';
export const isSwiss=e=>gameOf(e)!=='yugioh';
export function matchPoints(e,m,id){if(m.result==='bye')return m.a===id?3:0;if(m.result==='draw')return isSwiss(e)?1:0;return (m.a===id&&m.result==='a'||m.b===id&&m.result==='b')?3:0;}
export function swissStandings(event){
 const rows=event.players.map(p=>({...p,points:0,wins:0,draws:0,losses:0,byes:0,played:0,buchholz:0,sb:0,opponents:[]}));const map=new Map(rows.map(p=>[p.id,p]));
 for(const m of event.matches){
  if(m.result==='bye'){const a=map.get(m.a);if(a){a.points+=3;a.wins++;a.byes++;a.played++;}continue;}
  if(!['a','b','draw','double'].includes(m.result))continue;
  for(const [id,other,side] of [[m.a,m.b,'a'],[m.b,m.a,'b']]){const p=map.get(id);if(!p)continue;p.played++;p.opponents.push({id:other,weight:m.result===side?1:m.result==='draw'?.5:0});p.points+=matchPoints(event,m,id);if(m.result===side)p.wins++;else if(m.result==='draw')p.draws++;else p.losses++;}
 }
 rows.forEach(p=>{for(const op of p.opponents){const pts=map.get(op.id)?.points??0;p.buchholz+=pts;p.sb+=pts*op.weight;}p.key=[p.points,p.buchholz,p.sb].join('/');});
 rows.sort((a,b)=>b.points-a.points||b.buchholz-a.buchholz||b.sb-a.sb||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
 const counts=new Map();rows.forEach(p=>counts.set(p.key,(counts.get(p.key)||0)+1));rows.forEach((p,i)=>{p.rank=i&&p.key===rows[i-1].key?rows[i-1].rank:i+1;p.tied=counts.get(p.key)>1;});return rows;
}
export function nextSwissRound(event,random=Math.random){
 if(!isSwiss(event))throw new Error('A geração automática está disponível nas abas de suíço tradicional.');
 if(event.status!=='live')throw new Error('Inicie o torneio antes de gerar a rodada.');
 if(event.players.length<2)throw new Error('Cadastre pelo menos dois participantes.');
 if(event.matches.some(m=>!m.result))throw new Error('Finalize todos os resultados antes de gerar outra rodada.');
 const last=Math.max(0,...event.matches.map(m=>m.round)),round=last+1;
 if(round>event.rounds)throw new Error('Todas as rodadas anunciadas já foram geradas.');
 if(last){for(let r=1;r<=last;r++){const ids=new Set(event.matches.filter(m=>m.round===r).flatMap(m=>m.b?[m.a,m.b]:[m.a]));if(ids.size!==event.players.length)throw new Error('Complete as mesas da rodada anterior antes de gerar outra.');}}
 const rows=swissStandings(event).map(p=>({...p,draw:random()}));rows.sort((a,b)=>b.points-a.points||a.draw-b.draw);
 const history=new Set(event.matches.filter(m=>m.b).map(m=>JSON.stringify([m.a,m.b].sort()))),hadBye=new Set(event.matches.filter(m=>m.result==='bye').map(m=>m.a));let nodes=0;
 function pair(pool){if(!pool.length)return [];if(++nodes>60000)return null;const a=pool[0];const candidates=pool.slice(1).filter(b=>!history.has(JSON.stringify([a.id,b.id].sort()))).sort((b,c)=>Math.abs(a.points-b.points)-Math.abs(a.points-c.points)||b.draw-c.draw);for(const b of candidates){const rest=pair(pool.filter(p=>p.id!==a.id&&p.id!==b.id));if(rest)return [[a.id,b.id],...rest];}return null;}
 let pairs=null,bye=null;
 if(rows.length%2){for(const p of [...rows].reverse().filter(p=>!hadBye.has(p.id))){pairs=pair(rows.filter(x=>x.id!==p.id));if(pairs){bye=p.id;break;}}}else pairs=pair(rows);
 if(!pairs)throw new Error('Não foi possível gerar a rodada sem revanche ou bye repetido. Confira o número de rodadas e os confrontos. Nenhuma mesa foi alterada.');
 const matches=pairs.map(([a,b],i)=>({round,table:i+1,a,b,result:''}));if(bye)matches.push({round,table:matches.length+1,a:bye,b:null,result:'bye'});return matches;
}
