(function () {
  const id = localStorage.getItem('kingdom-store');
  window.kingdomStore = id || '';
  const playerLink = document.querySelector('.space-switch a:last-child');
  if (playerLink)
    playerLink.href =
      '/lojas.html?mode=player' + (id ? '&store=' + encodeURIComponent(id) : '');
  const banner = document.createElement('div');
  banner.className = 'notice';
  banner.style.margin = '22px 40px 0';
  document.querySelector('.game-tabs').before(banner);
  if (!id) {
    banner.textContent =
      'Espaço pessoal anterior · seus torneios antigos permanecem aqui.';
    return;
  }
  banner.textContent = 'Conectando à loja…';
  fetch('/api/league?store=' + encodeURIComponent(id))
    .then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      banner.textContent =
        d.store.name +
        ' · ' +
        ({ owner: 'Proprietário', staff: 'Funcionário', judge: 'Juiz' }[d.role] ||
          'Sem permissão de gestão');
      document.body.dataset.storeRole = d.role;
      if (d.role === 'judge') {
        document.getElementById('new').hidden = true;
        document.querySelector('[data-view="players"]').hidden = true;
      }
    })
    .catch((e) => {
      banner.textContent = e.message + ' Escolha sua loja em Minha loja.';
    });
})();
