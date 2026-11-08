import { validateEvent } from './ranking.mjs';
import { storeAccess } from './store-access.js';
const json = (value, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function getEvents(db, req) {
  let context;
  try {
    context = await storeAccess(db, req);
  } catch (e) {
    return json({ error: e.message }, e.status || 500);
  }
  const owner = context.scope;
  const rows = await db
    .prepare(
      'SELECT data, revision FROM tournaments WHERE owner_id = ? ORDER BY event_date DESC, id ASC',
    )
    .bind(owner)
    .all();
  return json({
    events: rows.results.map((row) => ({
      event: JSON.parse(row.data),
      revision: row.revision,
    })),
  });
}
export async function saveEvent(db, req) {
  let context;
  try {
    context = await storeAccess(db, req, true);
  } catch (e) {
    return json({ error: e.message }, e.status || 500);
  }
  const owner = context.scope;
  if (req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin)
    return json({ error: 'Origem inválida.' }, 403);
  let body;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 1800000)
      return json({ error: 'Torneio excede o limite de 1,8 MB.' }, 413);
    body = JSON.parse(raw);
    validateEvent(body.event);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Dados inválidos.' },
      400,
    );
  }
  const e = body.event,
    revision = body.revision;
  const previous = await db
    .prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?')
    .bind(owner, e.id)
    .first();
  if (previous) {
    const before = JSON.parse(previous.data);
    if (before.structure === 'swiss-cut' && before.status !== 'open') {
      if (e.status === 'open')
        return json(
          {
            error:
              'Um torneio iniciado pode ser reaberto para correções, sem reabrir as inscrições.',
          },
          400,
        );
      for (const key of ['structure', 'rounds', 'roundMinutes', 'cutPlan'])
        if (JSON.stringify(before[key]) !== JSON.stringify(e[key]))
          return json(
            { error: 'O plano anunciado fica fixo após o início do torneio.' },
            400,
          );
      if (
        JSON.stringify(before.players.map((p) => p.id)) !==
        JSON.stringify(e.players.map((p) => p.id))
      )
        return json({ error: 'A lista de participantes fica fixa após o início.' }, 400);
      if (
        before.cutSeeds &&
        e.cutSeeds &&
        JSON.stringify(before.matches.filter((m) => m.phase !== 'cut')) !==
          JSON.stringify(e.matches.filter((m) => m.phase !== 'cut'))
      )
        return json(
          { error: 'Reabra a classificação e remova o corte antes de corrigir o suíço.' },
          400,
        );
    }
  }
  if (context.store && context.role !== 'judge') {
    const regs = await db
      .prepare(
        "SELECT ranking_id FROM registrations WHERE store=? AND event=? AND status IN ('confirmed','checked')",
      )
      .bind(context.store, e.id)
      .all();
    const reserved = new Set(regs.results.map((r) => r.ranking_id));
    if (
      reserved.size + e.players.filter((p) => !reserved.has(p.rankingId)).length >
      e.capacity
    )
      return json(
        {
          error:
            'A capacidade precisa comportar os inscritos confirmados e os participantes manuais.',
        },
        409,
      );
    if (
      e.status !== 'open' &&
      regs.results.some((r) => !e.players.some((p) => p.rankingId === r.ranking_id))
    )
      return json(
        {
          error:
            'Importe todos os inscritos confirmados na página da loja antes de iniciar.',
        },
        409,
      );
  }
  if (context.role === 'judge') {
    const old = await db
      .prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?')
      .bind(owner, e.id)
      .first();
    if (!old)
      return json(
        { error: 'Juiz pode corrigir resultados de torneios existentes.' },
        403,
      );
    const before = JSON.parse(old.data),
      after = structuredClone(e);
    const results = new Map(e.matches.map((m) => [`${m.round}/${m.table}`, m.result]));
    before.matches.forEach((m) => {
      m.result = results.get(`${m.round}/${m.table}`) ?? m.result;
    });
    if (JSON.stringify(before) !== JSON.stringify(after))
      return json(
        { error: 'Juiz pode alterar apenas os resultados das mesas existentes.' },
        403,
      );
  }
  if (!Number.isInteger(revision) || revision < 0)
    return json({ error: 'Revisão inválida.' }, 400);
  const args = [e.name, e.date, e.status, JSON.stringify(e), new Date().toISOString()];
  const result =
    revision === 0
      ? await db
          .prepare(
            `INSERT INTO tournaments
(name,event_date,status,data,updated_at,owner_id,id,revision) VALUES
(?,?,?,?,?,?,?,1) ON CONFLICT(owner_id,id) DO NOTHING`,
          )
          .bind(...args, owner, e.id)
          .run()
      : await db
          .prepare(
            `UPDATE tournaments SET
name=?,event_date=?,status=?,data=?,updated_at=?,revision=revision+1 WHERE
owner_id=? AND id=? AND revision=?`,
          )
          .bind(...args, owner, e.id, revision)
          .run();
  if (!result.meta.changes)
    return json(
      {
        error:
          'Este torneio mudou em outra sessão. Exporte um backup antes de recarregar para conferir as alterações.',
      },
      409,
    );
  return json({ revision: revision + 1 });
}
