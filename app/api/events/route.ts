import { env } from 'cloudflare:workers';
import { validateEvent } from '../../../lib/ranking.mjs';
import {storeAccess} from '../../../lib/store-access';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
  let context;try{context=await storeAccess(env.DB,req);}catch(e:any){return json({error:e.message},e.status||500);}const owner=context.scope;
  const rows=await env.DB!.prepare('SELECT data, revision FROM tournaments WHERE owner_id = ? ORDER BY event_date DESC, id ASC').bind(owner).all<{data:string,revision:number}>();
  return json({events:rows.results.map(row=>({event:JSON.parse(row.data),revision:row.revision}))});
}
export async function PUT(req:Request){
  let context;try{context=await storeAccess(env.DB,req,true);}catch(e:any){return json({error:e.message},e.status||500);}const owner=context.scope;
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origem inválida.'},403);
  let body:any;try{const raw=await req.text();if(new TextEncoder().encode(raw).length>1800000)return json({error:'Torneio excede o limite de 1,8 MB.'},413);body=JSON.parse(raw);validateEvent(body.event);}catch(error){return json({error:error instanceof Error?error.message:'Dados inválidos.'},400);}
  const e=body.event,revision=body.revision;
  if(context.store&&context.role!=='judge'){
    const regs=await env.DB!.prepare("SELECT ranking_id FROM registrations WHERE store=? AND event=? AND status IN ('confirmed','checked')").bind(context.store,e.id).all<{ranking_id:string}>();
    const reserved=new Set(regs.results.map(r=>r.ranking_id));
    if(reserved.size+e.players.filter((p:any)=>!reserved.has(p.rankingId)).length>e.capacity)return json({error:'A capacidade precisa comportar os inscritos confirmados e os participantes manuais.'},409);
    if(e.status!=='open'&&regs.results.some(r=>!e.players.some((p:any)=>p.rankingId===r.ranking_id)))return json({error:'Importe todos os inscritos confirmados na página da loja antes de iniciar.'},409);
  }
  if(context.role==='judge'){
    const old=await env.DB!.prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?').bind(owner,e.id).first<{data:string}>();
    if(!old)return json({error:'Juiz pode corrigir resultados de torneios existentes.'},403);
    const before=JSON.parse(old.data),after=structuredClone(e);const results=new Map(e.matches.map((m:any)=>[`${m.round}/${m.table}`,m.result]));
    before.matches.forEach((m:any)=>{m.result=results.get(`${m.round}/${m.table}`)??m.result;});
    if(JSON.stringify(before)!==JSON.stringify(after))return json({error:'Juiz pode alterar apenas os resultados das mesas existentes.'},403);
  }
  if(!Number.isInteger(revision)||revision<0)return json({error:'Revisão inválida.'},400);
  const args=[e.name,e.date,e.status,JSON.stringify(e),new Date().toISOString()];
  const result=revision===0
    ?await env.DB!.prepare('INSERT INTO tournaments (name,event_date,status,data,updated_at,owner_id,id,revision) VALUES (?,?,?,?,?,?,?,1) ON CONFLICT(owner_id,id) DO NOTHING').bind(...args,owner,e.id).run()
    :await env.DB!.prepare('UPDATE tournaments SET name=?,event_date=?,status=?,data=?,updated_at=?,revision=revision+1 WHERE owner_id=? AND id=? AND revision=?').bind(...args,owner,e.id,revision).run();
  if(!result.meta.changes)return json({error:'Este torneio mudou em outra sessão. Exporte um backup antes de recarregar para conferir as alterações.'},409);
  return json({revision:revision+1});
}
