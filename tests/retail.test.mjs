import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { league } from '../lib/league-service.js';
import { getEvents, saveEvent } from '../lib/events-service.js';
const src = fileURLToPath(new URL('../', import.meta.url)).replace(/\\/g, '/');
const sqlite = new DatabaseSync(':memory:');
for (const file of (await fs.readdir(src + '/drizzle'))
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  for (const sql of (await fs.readFile(src + '/drizzle/' + file, 'utf8')).split(
    '--> statement-breakpoint',
  ))
    if (sql.trim()) sqlite.exec(sql);
}
class Stmt {
  constructor(sql, args = []) {
    this.sql = sql;
    this.args = args;
  }
  bind(...args) {
    return new Stmt(this.sql, args);
  }
  async first() {
    return sqlite.prepare(this.sql).get(...this.args) || null;
  }
  async all() {
    return { results: sqlite.prepare(this.sql).all(...this.args) };
  }
  async run() {
    const r = sqlite.prepare(this.sql).run(...this.args);
    return { meta: { changes: Number(r.changes) } };
  }
}
const db = {
  prepare: (sql) => new Stmt(sql),
  batch: async (statements) => {
    sqlite.exec('BEGIN');
    try {
      const r = [];
      for (const s of statements) r.push(await s.run());
      sqlite.exec('COMMIT');
      return r;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  },
};
let checks = 0;
async function call(user, store, action, b = {}, expect = 200) {
  const req = new Request(
    'https://test.local/api/league' +
      (store ? '?store=' + store + '&game=pokemon&month=2026-12' : ''),
    {
      method: action ? 'POST' : 'GET',
      headers: {
        ...(user ? { 'oai-authenticated-user-id': user } : {}),
        'Content-Type': 'application/json',
        Origin: 'https://test.local',
      },
      ...(action ? { body: JSON.stringify({ action, ...b }) } : {}),
    },
  );
  const res = await league(db, req),
    data = await res.json();
  assert.equal(res.status, expect, JSON.stringify(data));
  checks++;
  return data;
}
const owner = 'owner-account',
  p1 = 'player-account-1',
  p2 = 'player-account-2';
await call(null, null, null, {}, 401);
const store = (await call(owner, null, 'create-store', { name: 'Loja de teste' })).id;
const other = (await call('other-owner', null, 'create-store', { name: 'Outra loja' }))
  .id;
await call(p1, store, null, {}, 403);
await call('other-owner', store, 'event-settings', { event: 'test' }, 403);
let d = await call(owner, store);
assert.equal(d.role, 'owner');
const config = {
  ...d.store,
  revision: d.store.revision,
  published: true,
  attendancePoints: 10,
  firstVisitBonus: 5,
  rewards: [{ id: 'reward', name: 'Sleeves', cost: 10 }],
  monthlyCents: 19900,
  eventCredits: 12,
};
await call(owner, store, 'save-store', config);
await call(p1, store, 'join');
await call(p2, store, 'join');
await call(p1, store, 'invite', { role: 'owner' }, 403);
d = await call(p1, store);
assert.equal(d.store.subscription, undefined);
assert.equal(d.team.length, 0);
assert.equal(
  (await call(p1, null)).stores.find((s) => s.id === store).subscription,
  undefined,
);
const inv = await call(owner, store, 'invite', { role: 'judge' });
await call('judge-user', null, 'accept-invite', { token: inv.token });
await call('unwanted-user', null, 'accept-invite', { token: inv.token }, 404);
await call('judge-user', store, 'save-store', config, 403);
await call('judge-user', store, 'event-settings', { event: 'cup' }, 403);
const e = {
  id: 'cup',
  name: 'Cup',
  location: 'Loja',
  date: '2026-12-06',
  time: '14:00',
  status: 'open',
  game: 'pokemon',
  format: 'Standard',
  capacity: 4,
  rounds: 2,
  players: [],
  matches: [],
  roundMinutes: 50,
};
sqlite
  .prepare(
    'INSERT INTO tournaments(owner_id,id,name,event_date,status,data,updated_at) VALUES(?,?,?,?,?,?,?)',
  )
  .run(
    store,
    e.id,
    e.name,
    e.date,
    e.status,
    JSON.stringify(e),
    new Date().toISOString(),
  );
for (let i = 1; i <= 6; i++) {
  const u = 'player-account-' + i;
  if (i > 2) await call(u, store, 'join');
  await call(u, store, 'register', { event: e.id, name: 'Jogador ' + i });
}
await call(p1, store, 'register', { event: e.id, name: 'Duplicado' }, 400);
d = await call(owner, store);
assert.equal(d.registrations.filter((r) => r.status === 'confirmed').length, 4);
assert.equal(d.registrations.filter((r) => r.status === 'waitlisted').length, 2);
assert.equal((await call(p1, store)).registrations.length, 1);
await call(p1, store, 'promote', { event: e.id, user: 'player-account-5' }, 403);
await call(owner, store, 'promote', { event: e.id, user: 'player-account-5' }, 409);
await call('player-account-4', store, 'cancel-registration', { event: e.id });
await call(owner, store, 'promote', { event: e.id, user: 'player-account-6' }, 409);
await call(owner, store, 'promote', { event: e.id, user: 'player-account-5' });
await call(owner, store, 'import-registrations', { event: e.id });
let event = JSON.parse(
  sqlite
    .prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?')
    .get(store, e.id).data,
);
assert.equal(event.players.length, 4);
await call(p1, store, 'checkin', { event: e.id, code: 'wrong' }, 403);
const qr = await call(owner, store, 'checkin-code', { event: e.id });
await call(p1, store, 'checkin', { event: e.id, code: qr.code });
await call(p1, store, 'checkin', { event: e.id, code: qr.code });
assert.equal((await call(p1, store)).balance, 15);
await call(p1, store, 'redeem', { reward: 'reward', requestId: 'request-one' });
await call(p1, store, 'redeem', { reward: 'reward', requestId: 'request-one' });
assert.equal((await call(p1, store)).balance, 5);
await call(p1, store, 'redeem', { reward: 'reward', requestId: 'request-two' }, 400);
await call(p1, store, 'payment', { event: e.id, user: p1, paidCents: 2500 }, 403);
await call(owner, store, 'payment', { event: e.id, user: p1, paidCents: 2500 });
await call(owner, store, 'event-settings', {
  event: e.id,
  feeCents: 2500,
  prizeCents: 3000,
  otherCents: 200,
  organizingMinutes: 30,
});
d = await call(p1, store);
assert.equal(d.settings[0].feeCents, 2500);
assert.equal(d.settings[0].prizeCents, undefined);
await call(owner, other, null, {}, 403);
assert.equal((await call('other-owner', other)).events.length, 0);
const [a, b] = [p1, p2].map((u) =>
  event.players.find(
    (p) => p.rankingId === 'DK-' + u.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
  ),
);
event.matches = [{ round: 1, table: 1, a: a.id, b: b.id, result: '' }];
event.status = 'live';
sqlite
  .prepare('UPDATE tournaments SET data=?,status=? WHERE owner_id=? AND id=?')
  .run(JSON.stringify(event), 'live', store, e.id);
await call(
  'player-account-3',
  store,
  'report-result',
  { event: e.id, round: 1, table: 1, result: 'a' },
  403,
);
await call(p1, store, 'report-result', { event: e.id, round: 1, table: 1, result: 'a' });
await call(
  p1,
  store,
  'report-result',
  { event: e.id, round: 1, table: 1, result: 'b' },
  400,
);
await call(p2, store, 'report-result', { event: e.id, round: 1, table: 1, result: 'a' });
event = JSON.parse(
  sqlite
    .prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?')
    .get(store, e.id).data,
);
assert.equal(event.matches[0].result, 'a');
event.matches.push({ round: 2, table: 1, a: a.id, b: b.id, result: '' });
sqlite
  .prepare('UPDATE tournaments SET data=? WHERE owner_id=? AND id=?')
  .run(JSON.stringify(event), store, e.id);
await call(p1, store, 'report-result', { event: e.id, round: 2, table: 1, result: 'a' });
await call(p2, store, 'report-result', { event: e.id, round: 2, table: 1, result: 'b' });
d = await call(owner, store);
assert.equal(d.reports.find((r) => r.round === 2).status, 'conflict');
await call('judge-user', store, 'resolve-report', {
  event: e.id,
  round: 2,
  table: 1,
  result: 'draw',
});
assert.equal(
  (await call(owner, store)).reports.find((r) => r.round === 2).status,
  'applied',
);
const route = {
  GET: (request) => getEvents(db, request),
  PUT: (request) => saveEvent(db, request),
};
const authReq = (u, s, body) =>
  new Request('https://test.local/api/events', {
    method: body ? 'PUT' : 'GET',
    headers: {
      'oai-authenticated-user-id': u,
      'X-Kingdom-Store': s,
      Origin: 'https://test.local',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
assert.equal((await route.GET(authReq(p1, store))).status, 403);
assert.equal((await route.GET(authReq('other-owner', store))).status, 403);
assert.equal((await route.GET(authReq('judge-user', store))).status, 200);
const record = sqlite
    .prepare('SELECT data,revision FROM tournaments WHERE owner_id=? AND id=?')
    .get(store, e.id),
  copy = JSON.parse(record.data);
copy.location = 'Alteração proibida';
assert.equal(
  (
    await route.PUT(
      authReq('judge-user', store, { event: copy, revision: record.revision }),
    )
  ).status,
  403,
);
copy.location = 'Loja';
copy.matches[0].result = 'b';
assert.equal(
  (
    await route.PUT(
      authReq('judge-user', store, { event: copy, revision: record.revision }),
    )
  ).status,
  200,
);
assert.equal(
  (await route.PUT(authReq(p1, store, { event: copy, revision: record.revision + 1 })))
    .status,
  403,
);
const claim = (await call(owner, store)).redemptions[0];
await call(p1, store, 'refund-redemption', { id: claim.id }, 403);
await call(owner, store, 'refund-redemption', { id: claim.id });
await call(owner, store, 'refund-redemption', { id: claim.id });
assert.equal((await call(p1, store)).balance, 15);
await call(owner, store, 'fulfill', { id: claim.id }, 409);
console.log(
  'PASS: ' +
    (checks + 6) +
    ' API checks — authentication, store isolation, owner/staff/judge/player permissions, single-use invitations, capacity/waitlist, cancellation/promotion, imports, QR check-in, idempotent points, redemption and refunds, privacy, finance, dual confirmation and dispute resolution.',
);
export { db, league, store, sqlite };
