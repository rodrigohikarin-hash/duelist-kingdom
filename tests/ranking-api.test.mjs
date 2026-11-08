import assert from 'node:assert/strict';
import { db, store } from './retail.test.mjs';
import { fixtures } from './top-cut.test.mjs';
import { getRanking } from '../lib/ranking-service.js';

for (const original of fixtures) {
  const event = { ...original, id: `ranking-api-${original.game}` };
  await db
    .prepare(
      `
      INSERT INTO tournaments
        (owner_id, id, name, event_date, status, data, updated_at, revision)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    )
    .bind(
      store,
      event.id,
      event.name,
      event.date,
      'done',
      JSON.stringify(event),
      event.date,
    )
    .run();
}

function request(game, month = '2026-11', user = 'owner-account') {
  return new Request(`https://test.local/api/ranking?game=${game}&month=${month}`, {
    headers: {
      ...(user ? { 'oai-authenticated-user-id': user } : {}),
      'X-Kingdom-Store': store,
    },
  });
}

assert.equal((await getRanking(db, request('pokemon', '2026-11', null))).status, 401);
assert.equal(
  (await getRanking(db, request('pokemon', '2026-11', 'stranger'))).status,
  403,
);
assert.equal((await getRanking(db, request('invalid'))).status, 400);
assert.equal((await getRanking(db, request('pokemon', '2026-13'))).status, 400);

for (const game of ['yugioh', 'pokemon', 'onepiece', 'lorcana', 'digimon']) {
  const response = await getRanking(db, request(game));
  assert.equal(response.status, 200);
  const ranking = await response.json();
  assert.equal(ranking.game, game);
  assert.equal(ranking.eventCount, 1);
  assert.equal(ranking.standings.length, 50);
  assert.ok(ranking.months.includes('2026-11'));
}

console.log(
  'PASS: ranking API authentication, store isolation, parameters, months and all games.',
);
