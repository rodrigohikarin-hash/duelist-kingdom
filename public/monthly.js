import { MONTHLY_TIERS } from './monthly-titles.mjs';
(function () {
  let requestVersion = 0,
    lastData = null;
  const input = document.getElementById('rankingMonth');
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  input.value = `${today.find((p) => p.type === 'year').value}-${today.find((p) => p.type === 'month').value}`;
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  async function load() {
    const version = ++requestVersion,
      month = input.value;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
    const status = document.getElementById('rankingStatus');
    status.textContent = 'Consultando resultados salvos…';
    try {
      await window.arenaCloud.flush();
      const res = await fetch(
        '/api/ranking?month=' +
          encodeURIComponent(month) +
          '&game=' +
          encodeURIComponent(window.arenaGame || 'yugioh') +
          '&store=' +
          encodeURIComponent(window.kingdomStore || ''),
      );
      const data = await res.json();
      if (version !== requestVersion) return;
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar.');
      lastData = data;
      document.getElementById('monthEvents').textContent = data.eventCount;
      document.getElementById('monthPlayers').textContent = data.standings.length;
      document.getElementById('monthPoints').textContent = data.standings.reduce(
        (s, p) => s + p.points,
        0,
      );
      status.textContent = window.arenaCloud.hasPending()
        ? 'Há alterações locais pendentes. A tabela mostra somente o que já foi salvo no banco.'
        : data.eventCount
          ? 'Ranking atualizado com os torneios encerrados.'
          : 'Nenhum torneio encerrado neste mês.';
      document.getElementById('rankingUnlinked').hidden = !data.unlinked;
      document.getElementById('rankingUnlinked').textContent =
        `${data.unlinked} inscrição(ões) sem ID do ranking. Elas aparecem separadas; cadastre o mesmo ID na aba Duelistas para reunir os resultados.`;
      document.getElementById('rankingHistory').innerHTML = data.months.length
        ? data.months
            .map(
              (m) => /* HTML */ `
                <button class="secondary" data-history-month="${esc(m)}">
                  ${esc(m.slice(5) + '/' + m.slice(0, 4))}
                </button>
              `,
            )
            .join('')
        : '<p>O histórico aparecerá ao encerrar seu primeiro torneio.</p>';
      document.querySelectorAll('[data-history-month]').forEach(
        (b) =>
          (b.onclick = () => {
            input.value = b.dataset.historyMonth;
            load();
          }),
      );
      const yugioh = data.game === 'yugioh';
      const tiers = MONTHLY_TIERS[data.game];
      let honors = document.getElementById('monthlyHonors');
      if (!honors) {
        honors = document.createElement('section');
        honors.id = 'monthlyHonors';
        honors.setAttribute('aria-label', 'Elos e títulos do mês');
        document.getElementById('monthlyTable').before(honors);
      }
      honors.hidden = !tiers || !data.standings.length;
      honors.innerHTML =
        tiers && data.standings.length
          ? /* HTML */ `
              <div class="honors-heading">
                <span class="eyebrow">
                  ELOS DO MÊS · ${esc(month.slice(5) + '/' + month.slice(0, 4))}
                </span>
                <h2>Os destaques da temporada</h2>
                <p>
                  Títulos por colocação no ranking mensal. O mês em andamento tem títulos
                  provisórios; eles acompanham os resultados salvos.
                </p>
              </div>
              <div class="honors-grid">
                ${tiers
                  .map((t) => {
                    const members = data.standings.filter(
                      (p) => p.monthlyTitle?.id === t.id,
                    );
                    return /* HTML */ `
                      <article class="honor-card tier-${t.id}">
                        <span class="honor-range">${esc(t.range)}</span>
                        <h3>${esc(t.label)}</h3>
                        <p>
                          ${t.max === 1
                            ? members.length
                              ? members.map((p) => esc(p.name)).join(' · ')
                              : 'Sem ocupante'
                            : `${members.length} jogador${members.length === 1 ? '' : 'es'}`}
                        </p>
                      </article>
                    `;
                  })
                  .join('')}
              </div>
              <p class="honors-note">
                ${data.game === 'yugioh'
                  ? 'Os elos usam a colocação do mês. Empates em pontos compartilham posição e título.'
                  : 'Um campeão e até quatro integrantes na Elite 4 ou nos 4 Imperadores. Os títulos usam pontos, vitórias, aproveitamento, menos derrotas e ID do ranking em ordem crescente (ou chave da inscrição sem ID). As posições por pontos continuam compartilhadas em caso de empate; os títulos usam esse desempate para respeitar as quatro vagas.'}
              </p>
            `
          : '';
      document.getElementById('monthlyTable').innerHTML = data.standings.length
        ? '<div class="ranking-scroll"><table><thead><tr><th>Pos.</th><th>Duelista</th><th>ID do ranking</th><th>Pontos</th><th>Torneios</th><th>V–E–D</th><th>Vitórias %</th><th>' +
          (yugioh ? 'Derrotas duplas' : 'Byes') +
          '</th></tr></thead><tbody>' +
          data.standings
            .map(
              (p) => /* HTML */ `
                <tr>
                  <td>${p.rank}</td>
                  <td>${esc(p.name)}</td>
                  <td>${esc(p.rankingId || 'Sem vínculo')}</td>
                  <td><b>${p.points}</b></td>
                  <td>${p.events}</td>
                  <td>${p.wins}–${p.draws || 0}–${p.losses}</td>
                  <td>${p.winRate.toLocaleString('pt-BR')}%</td>
                  <td>${yugioh ? p.doubleLosses || 0 : p.byes || 0}</td>
                </tr>
              `,
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty"><div class="empty-icon">♜</div><h3>Uma nova temporada começa aqui</h3><p>Encerre um torneio com resultados registrados para alimentar o ranking deste mês.</p></div>';
      document.getElementById('rankingDownload').disabled = !data.standings.length;
      if (tiers && data.standings.length) {
        const table = document.querySelector('#monthlyTable table');
        const th = document.createElement('th');
        th.textContent = 'Elo do mês';
        table.tHead.rows[0].insertBefore(th, table.tHead.rows[0].cells[2]);
        [...table.tBodies[0].rows].forEach((tr, i) => {
          const td = document.createElement('td'),
            title = data.standings[i].monthlyTitle;
          td.innerHTML = title
            ? /* HTML */ `
                <span class="monthly-tier tier-${esc(title.id)}">
                  ${esc(title.label)}
                </span>
              `
            : '<span class="tier-unranked">—</span>';
          tr.insertBefore(td, tr.cells[2]);
        });
      }
    } catch (error) {
      if (version === requestVersion) {
        status.textContent = 'Não foi possível atualizar: ' + error.message;
        document.getElementById('monthlyTable').innerHTML = '';
        document.getElementById('monthlyHonors')?.setAttribute('hidden', '');
        lastData = null;
        document.getElementById('rankingDownload').disabled = true;
      }
    }
  }
  document.addEventListener('arena-game-changed', () => {
    lastData = null;
    requestVersion++;
    document.getElementById('monthlyHonors')?.setAttribute('hidden', '');
    document.getElementById('monthlyTable').innerHTML = '';
    document.getElementById('rankingHistory').innerHTML = '';
    document.getElementById('rankingDownload').disabled = true;
    if (!document.getElementById('monthly').hidden) load();
  });
  input.onchange = load;
  document.getElementById('rankingRefresh').onclick = load;
  document.querySelector('[data-view="monthly"]').addEventListener('click', load);
  document.addEventListener('arena-synced', () => {
    if (!document.getElementById('monthly').hidden) load();
  });
  document.getElementById('rankingDownload').onclick = () => {
    if (!lastData) return;
    const blob = new Blob([JSON.stringify(lastData, null, 2)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `ranking-${lastData.game}-${lastData.month}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})();
