import assert from 'node:assert/strict';
import { monthlyRanking, validateEvent } from '../lib/ranking.mjs';
const make = (id, date, status = 'done') => ({
  id,
  name: 'Copa ' + id,
  date,
  time: '14:00',
  location: 'Arena',
  capacity: 4,
  rounds: 2,
  format: 'Advanced',
  status,
  players: [
    { id: 'a', name: 'Ana', rankingId: 'arena-001' },
    { id: 'b', name: 'Bia', rankingId: 'ARENA-002' },
  ],
  matches: [
    { round: 1, table: 1, a: 'a', b: 'b', result: 'a' },
    { round: 2, table: 1, a: 'a', b: 'b', result: 'double' },
  ],
});
const one = make('one', '2026-11-02'),
  two = make('two', '2026-11-20');
two.players[0].name = 'Ana Silva';
two.players[0].rankingId = 'ARENA-001';
const previous = make('previous', '2026-10-31'),
  future = make('future', '2026-12-01'),
  ongoing = make('ongoing', '2026-11-03', 'live');
const r = monthlyRanking([one, two, previous, future, ongoing], '2026-11');
assert.equal(r.eventCount, 2);
assert.equal(r.standings.length, 2);
assert.equal(r.standings[0].points, 6);
assert.equal(r.standings[0].events, 2);
assert.equal(r.standings[0].wins, 2);
assert.equal(r.standings[0].losses, 2);
assert.equal(r.standings[0].doubleLosses, 2);
assert.equal(r.standings[0].winRate, 50);
assert.equal(r.standings[0].name, 'Ana Silva');
const correction = structuredClone(two);
correction.matches[0].result = 'b';
const corrected = monthlyRanking([one, correction], '2026-11');
assert.equal(corrected.standings[0].rank, corrected.standings[1].rank);
assert.equal(corrected.standings[0].points, 3);
const legacy = structuredClone(one);
legacy.id = 'legacy';
delete legacy.players[0].rankingId;
const l = monthlyRanking([one, legacy], '2026-11');
assert.equal(l.unlinked, 1);
assert.equal(l.standings.length, 3);
validateEvent(one);
const duplicate = structuredClone(one);
duplicate.players[1].rankingId = 'ARENA-001';
assert.throws(() => validateEvent(duplicate), /repetido/);
const bad = structuredClone(one);
bad.matches.push({ ...bad.matches[0], table: 2 });
assert.throws(() => validateEvent(bad), /duas mesas/);
const pending = structuredClone(one);
pending.matches[0].result = '';
assert.throws(() => validateEvent(pending), /pendentes/);
const invalidDate = structuredClone(one);
invalidDate.date = '2026-02-31';
assert.throws(() => validateEvent(invalidDate), /Data/);
console.log(
  'PASS: month boundaries, closed events, identity across events, double loss, corrections, tied ranks, legacy entries, server validation.',
);
