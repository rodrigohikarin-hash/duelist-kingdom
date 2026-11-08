import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  recommendedCut,
  CUT_RULES,
  firstCutRound,
  nextCutRound,
  cutMatches,
  swissMatches,
  champion,
  cutComplete,
  validateCut,
  seedOrder,
} from '../lib/top-cut.mjs';
import { nextSwissRound, swissStandings } from '../lib/swiss-core.mjs';
import { validateEvent, monthlyRanking } from '../lib/ranking.mjs';
let count = 0;
const ok = (x) => {
    assert.ok(x);
    count++;
  },
  reject = (e) => {
    assert.throws(() => validateEvent(e));
    count++;
  };
assert.deepEqual(recommendedCut('yugioh', 32), { rounds: 5, size: 4 });
assert.deepEqual(recommendedCut('lorcana', 32), { rounds: 5, size: 8 });
assert.deepEqual(recommendedCut('onepiece', 16), { rounds: 4, size: 2 });
assert.deepEqual(recommendedCut('digimon', 256), { rounds: 8, size: 16 });
assert.deepEqual(recommendedCut('yugioh', 8), { rounds: 3, size: 0 });
assert.equal(recommendedCut('pokemon', 50), null);
count += 6;
assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
count++;
const fixtures = [];
let state = 51;
const rng = () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;
for (const game of Object.keys(CUT_RULES)) {
  const rule = CUT_RULES[game],
    n = 50,
    config = recommendedCut(game, n) || { rounds: 6, size: 8 };
  const e = {
    id: 'cut-' + game,
    name: 'Top Cut ' + game,
    game,
    structure: 'swiss-cut',
    date: '2026-11-06',
    time: '14:00',
    location: 'Loja QA',
    capacity: 64,
    rounds: config.rounds,
    roundMinutes: rule.swiss,
    format:
      game === 'yugioh'
        ? 'Advanced'
        : game === 'pokemon'
          ? 'Standard'
          : game === 'lorcana'
            ? 'Core Constructed'
            : 'Construído',
    status: 'live',
    cutPlan: {
      profile: game === 'pokemon' ? 'event' : 'base',
      expectedPlayers: n,
      size: config.size,
      minutes: rule.cut,
      finalMinutes: rule.final,
      reference:
        game === 'pokemon' ? 'Regulamento específico QA: corte fixo por divisão' : '',
    },
    players: Array.from({ length: n }, (_, i) => ({
      id: 'p' + i,
      name: 'Jogador ' + (i + 1),
      rankingId: 'ID-' + i,
    })),
    matches: [],
  };
  for (let r = 1; r <= e.rounds; r++) {
    const ms = nextSwissRound(e, rng);
    ms.forEach((m, i) => {
      if (!m.result)
        m.result =
          game === 'yugioh' && r === 2 && i === 0
            ? 'double'
            : game !== 'yugioh' && i === 2
              ? 'draw'
              : rng() < 0.5
                ? 'a'
                : 'b';
    });
    e.matches.push(...ms);
    validateEvent(e);
    count++;
  }
  const seeds = swissStandings(e)
      .slice(0, config.size)
      .map((p) => p.id),
    swissTotals = monthlyRanking(
      [{ ...e, structure: 'swiss', status: 'done' }],
      '2026-11',
      game,
    ).standings;
  const cut = firstCutRound(e, seeds);
  e.cutSeeds = seeds;
  e.cutApproval = 'Classificação homologada na simulação';
  e.matches.push(...cut);
  validateEvent(e);
  count++;
  const invalid = structuredClone(e);
  invalid.matches.at(-1).result = 'draw';
  reject(invalid);
  invalid.matches.at(-1).result = 'double';
  if (game !== 'yugioh') reject(invalid);
  while (!cutComplete(e)) {
    const last = Math.max(...cutMatches(e).map((m) => m.round));
    cutMatches(e)
      .filter((m) => m.round === last)
      .forEach((m) => {
        if (!m.result) m.result = 'a';
      });
    validateEvent(e);
    count++;
    if (!cutComplete(e)) e.matches.push(...nextCutRound(e));
  }
  ok(champion(e) === seeds[0]);
  e.status = 'done';
  validateEvent(e);
  count++;
  const actual = monthlyRanking([e], '2026-11', game).standings;
  assert.deepEqual(actual, swissTotals);
  count++;
  const corrupt = structuredClone(e);
  corrupt.matches.at(-1).a = 'p49';
  reject(corrupt);
  const partial = structuredClone(e);
  partial.matches = partial.matches.filter((m) => m.round !== 1);
  reject(partial);
  assert.throws(() => nextCutRound(e));
  count++;
  fixtures.push(e);
}
// KONAMI double losses remove both players; empty branches generate byes, never random winners.
const y = structuredClone(fixtures[0]);
y.status = 'live';
y.matches = swissMatches(y);
delete y.cutSeeds;
delete y.cutApproval;
const seeds = y.players.slice(0, 8).map((p) => p.id);
y.matches.push(...firstCutRound(y, seeds));
y.cutSeeds = seeds;
y.cutApproval = 'Juiz confirma';
cutMatches(y).forEach((m, i) => (m.result = i === 0 ? 'double' : 'a'));
validateEvent(y);
count++;
y.matches.push(...nextCutRound(y));
ok(cutMatches(y).filter((m) => m.round === 8)[0].result === 'bye');
validateEvent(y);
count++;
// Entire empty bracket can finish without inventing a champion.
const z = structuredClone(y);
z.matches = swissMatches(z).concat(
  cutMatches(z)
    .filter((m) => m.round === 7)
    .map((m) => ({ ...m, result: 'double' })),
);
z.matches.push(...nextCutRound(z));
validateEvent(z);
z.matches.push(...nextCutRound(z));
z.status = 'done';
validateEvent(z);
ok(cutComplete(z) && champion(z) === null);
// Odd attendance: byes in all games including the new Yu-Gi-Oh! format.
for (const game of ['yugioh', 'digimon']) {
  const odd = structuredClone(fixtures.find((e) => e.game === game));
  odd.id += 'odd';
  odd.status = 'live';
  odd.players = odd.players.slice(0, 49);
  odd.cutPlan.expectedPlayers = 49;
  odd.matches = [];
  delete odd.cutSeeds;
  delete odd.cutApproval;
  for (let i = 0; i < odd.rounds; i++) {
    const ms = nextSwissRound(odd, rng);
    ms.forEach((m) => {
      if (!m.result) m.result = 'a';
    });
    odd.matches.push(...ms);
    validateEvent(odd);
    count++;
  }
  ok(
    new Set(odd.matches.filter((m) => m.result === 'bye').map((m) => m.a)).size ===
      odd.rounds,
  );
}
for (const name of ['top-cut.mjs', 'swiss-core.mjs'])
  assert.equal(
    fs.readFileSync('lib/' + name, 'utf8'),
    fs.readFileSync('public/' + name, 'utf8'),
  );
console.log(
  `PASS: ${count} checks — all 5 games / 50 players, rule tables, complete Swiss, seeded brackets, progression, final, invalid draws/double losses, empty branches and byes, monthly points unchanged, validation and shared browser/server source.`,
);

export { fixtures };
