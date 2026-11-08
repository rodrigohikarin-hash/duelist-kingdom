/* Ranking conventions are described beside the table, not presented as KTS internals. */
(function (root) {
  function calculateStandings(event) {
    const rows = event.players.map((p) => ({
      ...p,
      wins: 0,
      losses: 0,
      played: 0,
      points: 0,
      ddd: 0,
      opponents: [],
    }));
    const byId = new Map(rows.map((p) => [p.id, p]));
    for (const m of event.matches) {
      if (m.phase === 'cut') continue;
      if (m.result === 'bye') {
        const a = byId.get(m.a);
        if (a) {
          a.played++;
          a.wins++;
          a.points += 3;
        }
        continue;
      }
      if (!['a', 'b', 'double'].includes(m.result)) continue;
      const a = byId.get(m.a),
        b = byId.get(m.b);
      if (!a || !b) continue;
      for (const [p, op, side] of [
        [a, b, 'a'],
        [b, a, 'b'],
      ]) {
        p.played++;
        p.opponents.push(op.id);
        if (m.result === side) {
          p.wins++;
          p.points += 3;
        } else {
          p.losses++;
          p.ddd += m.round * m.round;
        }
      }
    }
    const mean = (values) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    rows.forEach((p) => (p.mwp = p.played ? p.wins / p.played : 0));
    rows.forEach((p) => (p.omw = mean(p.opponents.map((id) => byId.get(id).mwp))));
    rows.forEach((p) => {
      p.oomw = mean(p.opponents.map((id) => byId.get(id).omw));
      p.bbb = Math.round(p.omw * 1000);
      p.ccc = Math.round(p.oomw * 1000);
      p.key = [p.points, p.bbb, p.ccc, p.ddd].join('/');
      p.code =
        String(p.points).padStart(2, '0') +
        String(p.bbb).padStart(3, '0') +
        String(p.ccc).padStart(3, '0') +
        String(p.ddd).padStart(3, '0');
    });
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.bbb - a.bbb ||
        b.ccc - a.ccc ||
        b.ddd - a.ddd ||
        a.name.localeCompare(b.name, 'pt-BR') ||
        String(a.id).localeCompare(String(b.id)),
    );
    const counts = new Map();
    rows.forEach((p) => counts.set(p.key, (counts.get(p.key) || 0) + 1));
    rows.forEach((p, i) => {
      p.rank = i && p.key === rows[i - 1].key ? rows[i - 1].rank : i + 1;
      p.tied = counts.get(p.key) > 1;
    });
    return rows;
  }
  root.calculateStandings = calculateStandings;
  if (typeof module !== 'undefined') module.exports = { calculateStandings };
})(typeof globalThis !== 'undefined' ? globalThis : this);
