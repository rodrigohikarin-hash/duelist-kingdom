import { env } from 'cloudflare:workers';
import { monthlyRanking } from '../../../lib/ranking.mjs';
import { GAMES,gameOf } from '../../../lib/swiss-core.mjs';
import {storeAccess} from '../../../lib/store-access';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  let context;try{context=await storeAccess(env.DB,req);}catch(e:any){return Response.json({error:e.message},{status:e.status||500});}const owner=context.scope;
  const month=new URL(req.url).searchParams.get('month')||'';
  const game=new URL(req.url).searchParams.get('game')||'yugioh';
  if(!Object.hasOwn(GAMES,game))return Response.json({error:'Jogo inválido.'},{status:400});
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return Response.json({error:'Mês inválido.'},{status:400});
  const rows=await env.DB!.prepare("SELECT data FROM tournaments WHERE owner_id=? AND status='done' AND event_date >= ? AND event_date <= ? ORDER BY event_date ASC,id ASC").bind(owner,month+'-01',month+'-31').all<{data:string}>();
  const months=await env.DB!.prepare("SELECT DISTINCT substr(event_date,1,7) AS month FROM tournaments WHERE owner_id=? AND status='done' AND coalesce(json_extract(data,'$.game'),'yugioh')=? ORDER BY month DESC").bind(owner,game).all<{month:string}>();
  return Response.json({...monthlyRanking(rows.results.map(row=>JSON.parse(row.data)),month,game),months:months.results.map(r=>r.month)},{headers:{'Cache-Control':'no-store'}});
}
