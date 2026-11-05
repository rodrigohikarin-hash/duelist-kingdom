import {GAMES,gameOf,isSwiss,matchPoints} from './swiss-core.mjs';
import {monthlyTitle} from './monthly-titles.mjs';
export function normalizeRankingId(value){return typeof value==='string'?value.trim().toUpperCase():'';}
export function monthlyRanking(events,month,game='yugioh'){
  const totals=new Map();let unlinked=0;
  const eligible=events.filter(e=>e.status==='done'&&e.date.slice(0,7)===month&&gameOf(e)===game);
  for(const e of eligible){
    const rows=new Map();
    for(const p of e.players){
      const rankingId=normalizeRankingId(p.rankingId),key=rankingId||`unlinked:${e.id}:${p.id}`;
      if(!rankingId)unlinked++;
      let row=totals.get(key);
      if(!row){row={key,rankingId,name:p.name,points:0,wins:0,draws:0,losses:0,byes:0,played:0,events:0,doubleLosses:0,unlinked:!rankingId};totals.set(key,row);}
      row.name=p.name;row.events++;rows.set(p.id,row);
    }
    for(const m of e.matches){
      if(!['a','b','double','draw','bye'].includes(m.result))continue;
      for(const [id,side] of [[m.a,'a'],[m.b,'b']]){
        const row=rows.get(id);if(!row)continue;row.played++;row.points+=matchPoints(e,m,id);
        if(m.result===side||m.result==='bye'){row.wins++;if(m.result==='bye')row.byes++;}else if(m.result==='draw'){row.draws++;}else{row.losses++;if(m.result==='double')row.doubleLosses++;}
      }
    }
  }
  const limitedTitles=game==='pokemon'||game==='onepiece';
  const titleTiebreak=(a,b)=>b.wins-a.wins||((b.played?b.wins/b.played:0)-(a.played?a.wins/a.played:0))||a.losses-b.losses||a.key.localeCompare(b.key);
  const standings=[...totals.values()].sort((a,b)=>b.points-a.points||(limitedTitles?titleTiebreak(a,b):a.name.localeCompare(b.name,'pt-BR')||a.key.localeCompare(b.key)));
  standings.forEach((p,i)=>{p.rank=i&&p.points===standings[i-1].points?standings[i-1].rank:i+1;p.winRate=p.played?Math.round(p.wins/p.played*1000)/10:0;});
  if(['yugioh','pokemon','onepiece'].includes(game))standings.forEach((p,i)=>{p.monthlyTitle=monthlyTitle(game,limitedTitles?i+1:p.rank);if(limitedTitles)p.titlePosition=i+1;});
  return {month,game,eventCount:eligible.length,unlinked,standings};
}
export function validateEvent(e){
  const fail=message=>{throw new Error(message);};const text=(x,min,max)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
  if(!e||!text(e.id,1,100)||!text(e.name,1,100)||!text(e.location,1,120))fail('Nome, local ou identificador inválido.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time))fail('Data ou horário inválido.');
  if(!Object.hasOwn(GAMES,gameOf(e))||!['open','live','done'].includes(e.status)||!GAMES[gameOf(e)].formats.includes(e.format))fail('Jogo, estado ou formato inválido.');
  if(e.roundMinutes!==undefined&&(!Number.isInteger(e.roundMinutes)||e.roundMinutes<5||e.roundMinutes>180))fail('Duração inválida.');
  if(!Number.isInteger(e.capacity)||e.capacity<4||e.capacity>2048||!Number.isInteger(e.rounds)||e.rounds<1||e.rounds>20)fail('Capacidade ou rodadas inválidas.');
  if(!Array.isArray(e.players)||e.players.length>e.capacity||!Array.isArray(e.matches)||e.matches.length>20480)fail('Participantes ou partidas inválidos.');
  const ids=new Set(),rankingIds=new Set();
  for(const p of e.players){
    if(!p||!text(p.id,1,100)||ids.has(p.id)||!text(p.name,1,80))fail('Cadastro de duelista inválido.');ids.add(p.id);
    const rid=normalizeRankingId(p.rankingId);if(p.rankingId!==undefined&&(typeof p.rankingId!=='string'||rid.length>40||rid&&!/^[A-Z0-9_-]+$/.test(rid)))fail('Use letras, números, hífen ou sublinhado no ID do ranking.');
    if(rid&&rankingIds.has(rid))fail('ID do ranking repetido no mesmo torneio.');if(rid)rankingIds.add(rid);
  }
  const seenPlayers=new Set(),tables=new Set(),byes=new Set();
  for(const m of e.matches){
    const bye=m?.result==='bye'&&isSwiss(e)&&m.b===null;
    if(!m||!ids.has(m.a)||(!bye&&!ids.has(m.b))||m.a===m.b||!Number.isInteger(m.round)||m.round<1||m.round>e.rounds||!Number.isInteger(m.table)||m.table<1||m.table>1024||!(isSwiss(e)?['','a','b','draw','bye']:['','a','b','double']).includes(m.result)||m.result==='bye'&&!bye)fail('Partida inválida.');
    if(bye){if(byes.has(m.a))fail('Bye repetido para o mesmo participante.');byes.add(m.a);}
    for(const id of bye?[m.a]:[m.a,m.b]){const key=JSON.stringify([m.round,id]);if(seenPlayers.has(key))fail('Duelista em duas mesas da rodada.');seenPlayers.add(key);}
    const table=`${m.round}/${m.table}`;if(tables.has(table))fail('Mesa repetida na rodada.');tables.add(table);
  }
  if(e.status==='done'&&e.matches.some(m=>!m.result))fail('Resolva as partidas pendentes antes de encerrar.');
  return e;
}
