import assert from 'node:assert/strict';
import { manualSwissMatch, nextSwissRound, GAMES } from '../lib/swiss-core.mjs';
import { validateEvent } from '../lib/ranking.mjs';
for (const game of Object.keys(GAMES)) {
  const e = {
    id: game,
    name: 'Manual ' + game,
    game,
    format: GAMES[game].formats[0],
    date: '2026-11-06',
    time: '14:00',
    location: 'QA',
    capacity: 8,
    rounds: 3,
    status: 'live',
    players: Array.from({ length: 5 }, (_, i) => ({ id: 'p' + i, name: 'Jogador ' + i })),
    matches: [],
  };
  // The legacy Yu-Gi-Oh! profile has no bye; use an even roster there.
  if (game === 'yugioh') e.players.pop();
  const add = (a, b, round = 1) => {
    e.matches.push(manualSwissMatch(e, { a, b, round }));
    validateEvent(e);
  };
  assert.throws(() =>
    manualSwissMatch({ ...e, status: 'open' }, { a: 'p0', b: 'p1', round: 1 }),
  );
  add('p0', 'p1');
  assert.throws(() => manualSwissMatch(e, { a: 'p0', b: 'p2', round: 1 }));
  assert.throws(() => manualSwissMatch(e, { a: 'p2', b: 'p2', round: 1 }));
  assert.throws(() => manualSwissMatch(e, { a: 'p2', b: 'p3', round: 2 }));
  add('p2', 'p3');
  if (game !== 'yugioh') add('p4', null);
  e.matches.forEach((m) => {
    if (!m.result) m.result = 'a';
  });
  assert.throws(() => manualSwissMatch(e, { a: 'p0', b: 'p1', round: 2 }));
  assert.throws(() => manualSwissMatch(e, { a: 'p0', b: 'p1', round: 4 }));
  if (game !== 'yugioh') {
    assert.throws(() => manualSwissMatch(e, { a: 'p4', b: null, round: 2 }));
    e.matches.push(...nextSwissRound(e, () => 0.4));
    validateEvent(e);
  } else {
    add('p0', 'p2', 2);
    add('p1', 'p3', 2);
  }
  assert.throws(() => manualSwissMatch(e, { a: 'p0', b: 'p1', round: 1 }));
  assert.throws(() =>
    manualSwissMatch(
      {
        ...e,
        matches: [
          ...e.matches,
          { phase: 'cut', round: 4, table: 1, a: 'p0', b: 'p1', result: '' },
        ],
      },
      { a: 'p0', b: 'p3', round: 3 },
    ),
  );
}
console.log(
  'PASS: manual matches in all five games; byes; duplicate players, rematches, repeated byes, incomplete rounds, invalid rounds and Top Cut protected; automatic pairing after a manual round.',
);
