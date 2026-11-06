// Shared by the API and browser. Cut matches have globally unique round numbers.
export const hasCut=e=>e.structure==='swiss-cut';
export const swissMatches=e=>e.matches.filter(m=>m.phase!=='cut');
export const cutMatches=e=>e.matches.filter(m=>m.phase==='cut');
export const CUT_RULES={
 yugioh:{label:'KDE-US v2.5 · Tier 1/2',url:'https://img.yugioh-card.com/en/downloads/penalty_guide/YGOTCG_Tournament_Policy_v_2_5.pdf',swiss:50,cut:50,final:0,note:'Melhor de 3. Final sem limite de tempo. Derrota dupla no corte elimina ambos e deixa bye na fase seguinte. Ops Doc/FAQ específico prevalece.'},
 pokemon:{label:'Pokémon TCG · regulamento do evento',url:'https://play.pokemon.com/en-us/resources/documents/',swiss:50,cut:75,final:75,note:'Um torneio por divisão etária. Informe rodadas, corte fixo e tempos do regulamento vigente. Regionais com corte assimétrico não usam este perfil de corte fixo.'},
 onepiece:{label:'ONE PIECE · manual 16/01/2026',url:'https://en.onepiece-cardgame.com/pdf/tournament_rules_manual.pdf?20260116=',swiss:30,cut:60,final:0,note:'Suíço Bo1: 30 min + 5 extras; Top Cut Bo3: 60 min + 10 extras; final sem limite. Rodadas fixas anunciadas; não encerra automaticamente com um invicto.'},
 digimon:{label:'Digimon · manual 06/06/2024',url:'https://world.digimoncard.com/event/online_event/pdf/tournament_rules.pdf?20240606=',swiss:45,cut:55,final:0,note:'Perfil Bo3: suíço 45 min + 5 extras; Top Cut 55 min + 5 extras. Final sem limite neste perfil. Anuncie os procedimentos específicos do evento.'},
 lorcana:{label:'Lorcana · regras 14/07/2026',url:'https://files.disneylorcana.com/Tournament-Rules-7.14.2026_Update_EN.pdf',swiss:50,cut:0,final:0,note:'Perfil Bo3, eliminatórias sem limite de tempo (recomendado). Se houver limite por disponibilidade do local, anuncie no regulamento específico: mínimo 70 min. Melhor seed escolhe jogar/comprar primeiro no jogo 1. Fim de rodada: seção 3.4.'}
};
export function recommendedCut(game,n){
 if(!Number.isInteger(n)||n<4||n>2048)throw Error('Informe de 4 a 2048 participantes.');
 if(game==='pokemon')return null; // Event/division-specific; never guess a current Pokémon policy.
 if(game==='lorcana'){
  if(n<8)throw Error('O perfil competitivo de Lorcana exige ao menos 8 participantes.');
  return n===8?{rounds:3,size:0}:n<=16?{rounds:4,size:4}:n<=32?{rounds:5,size:8}:n<=64?{rounds:6,size:8}:n<=128?{rounds:7,size:8}:n<=226?{rounds:8,size:8}:{rounds:9,size:8};
 }
 if(game==='digimon'&&n>1024)throw Error('A tabela publicada de Digimon cobre até 1024 participantes. Use o regulamento específico acima disso.');
 const rounds=n<=8?3:Math.ceil(Math.log2(n));
 const size=n<=8?0:game==='yugioh'?(n<=32?4:8):n<=16?2:n<=32?4:n<=128?8:n<=512?16:32;
 return {rounds,size};
}
export function checkCutPlan(e){
 if(!hasCut(e))return;
 const p=e.cutPlan;
 if(!p||!['base','event'].includes(p.profile)||!Number.isInteger(p.size)||![0,2,4,8,16,32].includes(p.size)||!Number.isInteger(p.expectedPlayers)||p.expectedPlayers<4||p.expectedPlayers>e.capacity)throw Error('Plano do Top Cut inválido.');
 if(!Number.isInteger(p.minutes)||p.minutes<0||p.minutes>180||!Number.isInteger(p.finalMinutes)||p.finalMinutes<0||p.finalMinutes>180)throw Error('Tempo do Top Cut inválido.');
 if(p.profile==='event'){
  if(typeof p.reference!=='string'||p.reference.trim().length<8||p.reference.length>500)throw Error('Informe o regulamento específico que define o corte.');
 }else{
  const r=recommendedCut(e.game??'yugioh',p.expectedPlayers);
  if(!r||r.rounds!==e.rounds||r.size!==p.size)throw Error('Rodadas e corte não correspondem à tabela do jogo.');
  const rule=CUT_RULES[e.game??'yugioh'];
  if(e.roundMinutes!==rule.swiss||p.minutes!==rule.cut||p.finalMinutes!==rule.final)throw Error('Tempos diferentes da tabela exigem regulamento específico.');
 }
 if(p.size>p.expectedPlayers)throw Error('O corte excede o número de participantes.');
 if(e.status!=='open'&&e.players.length!==p.expectedPlayers)throw Error('Confirme o plano com a quantidade real de inscritos antes de iniciar.');
}
export function swissComplete(e){
 const matches=swissMatches(e);
 return Array.from({length:e.rounds},(_,i)=>i+1).every(r=>{
  const ms=matches.filter(m=>m.round===r);
  return ms.length>0&&ms.every(m=>m.result)&&new Set(ms.flatMap(m=>m.b?[m.a,m.b]:[m.a])).size===e.players.length;
 });
}
// A fixed bracket keeps seed 1 and 2 on opposite sides (8: 1/8,4/5,2/7,3/6).
export function seedOrder(size){let order=[1,2];while(order.length<size){const sum=order.length*2+1;order=order.flatMap(s=>[s,sum-s]);}return order;}
export function firstCutRound(e,seeds){
 if(!hasCut(e)||!e.cutPlan?.size)throw Error('Este evento não tem corte eliminatório.');
 if(e.status!=='live'||!swissComplete(e))throw Error('Conclua todas as rodadas suíças antes de abrir o Top Cut.');
 if(cutMatches(e).length||e.cutSeeds)throw Error('O Top Cut já foi iniciado.');
 if(!Array.isArray(seeds)||seeds.length!==e.cutPlan.size||new Set(seeds).size!==seeds.length||seeds.some(id=>!e.players.some(p=>p.id===id)))throw Error('Confirme todos os classificados, sem repetições, na ordem oficial.');
 const order=seedOrder(seeds.length),matches=[];
 for(let i=0;i<order.length;i+=2)matches.push({phase:'cut',round:e.rounds+1,table:i/2+1,a:seeds[order[i]-1],b:seeds[order[i+1]-1],result:''});
 return matches;
}
export function nextCutRound(e){
 const all=cutMatches(e),last=Math.max(0,...all.map(m=>m.round)),prev=all.filter(m=>m.round===last).sort((a,b)=>a.table-b.table);
 if(e.status!=='live'||!prev.length)throw Error('Abra o Top Cut primeiro.');
 if(prev.some(m=>!['a','b','double','bye','void'].includes(m.result)))throw Error('Registre os resultados de todas as mesas do corte.');
 if(prev.length===1)throw Error('A final já foi concluída.');
 return Array.from({length:prev.length/2},(_,i)=>{
  let a=cutWinner(prev[i*2]),b=cutWinner(prev[i*2+1]);if(!a&&b){a=b;b=null;}
  return {phase:'cut',round:last+1,table:i+1,a,b,result:a?b?'':'bye':'void'};
 });
}
export const cutWinner=m=>m.result==='bye'?m.a:['a','b'].includes(m.result)?m[m.result]:null;
export function cutFinal(e){return cutMatches(e).find(m=>m.round===e.rounds+Math.log2(e.cutPlan?.size||1));}
export function champion(e){const final=cutFinal(e);return final?cutWinner(final):null;}
export function cutComplete(e){return !!cutFinal(e)?.result;}
export function matchLabel(e,m){if(m.phase!=='cut')return 'Suíço · R'+m.round;const remaining=(e.cutPlan?.size||2)/2**(m.round-e.rounds-1);return remaining===2?'Final':remaining===4?'Semifinal':remaining===8?'Quartas de final':'Top '+remaining;}
export function matchMinutes(e,m){return m?.phase==='cut'?(m.round===e.rounds+Math.log2(e.cutPlan.size)?e.cutPlan.finalMinutes:e.cutPlan.minutes):e.roundMinutes;}
export function validateCut(e){
 const all=cutMatches(e);checkCutPlan(e);
 if(!hasCut(e)){if(all.length||e.cutSeeds)throw Error('Partidas eliminatórias exigem a modalidade Suíço + Top Cut.');return;}
 if(!all.length){if(e.cutSeeds)throw Error('Classificados sem chave eliminatória.');if(e.status==='done'&&(e.cutPlan.size||!swissComplete(e)))throw Error('Conclua o suíço e o Top Cut antes de encerrar.');return;}
 if(!swissComplete(e)||!Array.isArray(e.cutSeeds)||e.cutSeeds.length!==e.cutPlan.size||typeof e.cutApproval!=='string'||e.cutApproval.trim().length<3||e.cutApproval.length>500)throw Error('A chave exige suíço completo e classificação homologada.');
 const shell={...e,matches:swissMatches(e)};delete shell.cutSeeds;
 let expected=firstCutRound({...shell,status:'live'},e.cutSeeds),round=e.rounds+1;
 const last=Math.max(...all.map(m=>m.round));
 for(;round<=last;round++){
  const actual=all.filter(m=>m.round===round).sort((a,b)=>a.table-b.table);
  if(actual.length!==expected.length||actual.some((m,i)=>m.a!==expected[i].a||m.b!==expected[i].b||m.table!==expected[i].table||(expected[i].result?m.result!==expected[i].result:!['','a','b',...((e.game??'yugioh')==='yugioh'&&round<e.rounds+Math.log2(e.cutPlan.size)?['double']:[])].includes(m.result))))throw Error('Chave inconsistente: confira seeds, vencedores e progressão.');
  if(round<last)expected=nextCutRound({...e,status:'live',matches:e.matches.filter(m=>m.phase!=='cut'||m.round<=round)});
 }
 if(e.status==='done'&&!cutComplete(e))throw Error('Conclua a final antes de encerrar.');
}
