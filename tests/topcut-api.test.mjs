import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db, sqlite, store } from './retail.test.mjs';
import { saveEvent } from '../lib/events-service.js';
import { fixtures } from './top-cut.test.mjs';
const route = { PUT: (request) => saveEvent(db, request) };
const e = structuredClone(fixtures[1]);
e.id = 'api-top-cut';
const put = async (event, revision, user = 'owner-account') => {
  const r = await route.PUT(
    new Request('https://test.local/api/events', {
      method: 'PUT',
      headers: {
        'oai-authenticated-user-id': user,
        'X-Kingdom-Store': store,
        'Content-Type': 'application/json',
        Origin: 'https://test.local',
      },
      body: JSON.stringify({ event, revision }),
    }),
  );
  return { status: r.status, data: await r.json() };
};
const open = { ...e, status: 'open', matches: [] };
delete open.cutSeeds;
delete open.cutApproval;
assert.equal((await put(open, 0)).status, 200);
open.status = 'live';
assert.equal((await put(open, 1)).status, 200);
assert.equal((await put({ ...open, rounds: 7 }, 2)).status, 400);
assert.equal((await put({ ...open, status: 'open' }, 2)).status, 400);
assert.equal((await put({ ...open, players: open.players.slice(1) }, 2)).status, 400);
const running = { ...e, status: 'live' };
assert.equal((await put(running, 2)).status, 200);
const changed = structuredClone(running);
changed.matches[0].result = changed.matches[0].result === 'a' ? 'b' : 'a';
assert.equal((await put(changed, 3)).status, 400);
const judge = structuredClone(running);
judge.matches.at(-1).result = 'b';
assert.equal((await put(judge, 3, 'judge-user')).status, 200);
judge.status = 'done';
assert.equal((await put(judge, 4)).status, 200);
assert.equal(
  JSON.parse(
    sqlite
      .prepare('SELECT data FROM tournaments WHERE owner_id=? AND id=?')
      .get(store, e.id).data,
  ).status,
  'done',
);
console.log(
  'PASS: Top Cut API persistence, frozen plans, closed registration, fixed roster, Swiss freeze after seeding, judge final correction, and completion.',
);
