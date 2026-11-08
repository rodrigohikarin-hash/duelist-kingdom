import { monthlyRanking } from './ranking.mjs';
import { GAMES } from './swiss-core.mjs';
import { storeAccess } from './store-access.js';
export async function getRanking(db, req) {
  let context;
  try {
    context = await storeAccess(db, req);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
  const owner = context.scope;
  const month = new URL(req.url).searchParams.get('month') || '';
  const game = new URL(req.url).searchParams.get('game') || 'yugioh';
  if (!Object.hasOwn(GAMES, game))
    return Response.json({ error: 'Jogo inválido.' }, { status: 400 });
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return Response.json({ error: 'Mês inválido.' }, { status: 400 });
  const rows = await db
    .prepare(
      `SELECT data FROM tournaments WHERE owner_id=? AND status='done' AND event_date
>= ? AND event_date <= ? ORDER BY event_date ASC,id ASC`,
    )
    .bind(owner, month + '-01', month + '-31')
    .all();
  const months = await db
    .prepare(
      `SELECT DISTINCT substr(event_date,1,7) AS month FROM tournaments WHERE
owner_id=? AND status='done' AND
coalesce(json_extract(data,'$.game'),'yugioh')=? ORDER BY month DESC`,
    )
    .bind(owner, game)
    .all();
  return Response.json(
    {
      ...monthlyRanking(
        rows.results.map((row) => JSON.parse(row.data)),
        month,
        game,
      ),
      months: months.results.map((r) => r.month),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
