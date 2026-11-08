(function () {
  const selectedStore = localStorage.getItem('kingdom-store') || '';
  const pendingKey =
    'duel-arena-cloud-pending-v1' + (selectedStore ? ':' + selectedStore : '');
  const revisions = new Map(),
    known = new Map();
  let pending = Object.create(null),
    ready = false,
    running = false,
    timer = null,
    callbacks = null,
    conflict = false;
  try {
    pending = Object.assign(
      Object.create(null),
      JSON.parse(localStorage.getItem(pendingKey) || '{}'),
    );
  } catch {}
  const conflicts = new Set();
  let activeId = null;
  const status = (message, error = false) => {
    const el = document.getElementById('cloudStatus');
    if (el) {
      el.textContent = message;
      el.classList.toggle('sync-error', error);
    }
    const retry = document.getElementById('cloudRetry');
    if (retry) retry.hidden = !error;
    const recovery = document.getElementById('cloudRecover');
    if (recovery) recovery.hidden = !conflict;
  };
  function persist() {
    try {
      localStorage.setItem(pendingKey, JSON.stringify(pending));
    } catch {
      status('Não foi possível manter a cópia local. Exporte um backup.', true);
    }
  }
  async function request(url, options) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          ...(selectedStore ? { 'X-Kingdom-Store': selectedStore } : {}),
        },
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error('Sem conexão. Há dados aguardando envio.');
    }
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('Servidor indisponível. Tente novamente.');
    }
    if (!response.ok) {
      const error = new Error(body.error || 'Não foi possível salvar.');
      error.status = response.status;
      throw error;
    }
    return body;
  }
  async function flush() {
    if (!ready || running || conflict) return;
    if (!Object.keys(pending).length) {
      status('Todos os torneios salvos na nuvem');
      return;
    }
    running = true;
    try {
      while (Object.keys(pending).length) {
        const id = Object.keys(pending)[0],
          entry = pending[id],
          payload = JSON.stringify(entry.event);
        activeId = id;
        status('Salvando no banco de dados…');
        const data = await request('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: entry.event, revision: entry.revision }),
        });
        revisions.set(id, data.revision);
        known.set(id, payload);
        if (pending[id] && JSON.stringify(pending[id].event) === payload)
          delete pending[id];
        else if (pending[id]) pending[id].revision = data.revision;
        persist();
      }
      status('Todos os torneios salvos na nuvem');
      document.dispatchEvent(new Event('arena-synced'));
    } catch (error) {
      if (error.status === 409) {
        conflict = true;
        conflicts.add(activeId);
      }
      status(error.message, true);
    } finally {
      running = false;
    }
  }
  function queue(events) {
    if (!ready) return;
    for (const event of events) {
      const payload = JSON.stringify(event);
      if (payload !== known.get(event.id) || pending[event.id])
        pending[event.id] = {
          event: JSON.parse(payload),
          revision: pending[event.id]?.revision ?? revisions.get(event.id) ?? 0,
        };
    }
    persist();
    if (Object.keys(pending).length) {
      status('Alterações aguardando envio…');
      clearTimeout(timer);
      timer = setTimeout(flush, 400);
    }
  }
  async function start(config) {
    callbacks = config;
    status('Conectando ao banco de dados…');
    try {
      const data = await request('/api/events');
      const cloud = new Map();
      for (const row of data.events) {
        cloud.set(row.event.id, row.event);
        revisions.set(row.event.id, row.revision);
        known.set(row.event.id, JSON.stringify(row.event));
      }
      for (const entry of Object.values(pending)) {
        const id = entry.event.id,
          rev = revisions.get(id) ?? 0;
        if (entry.revision !== rev) {
          if (JSON.stringify(cloud.get(id)) === JSON.stringify(entry.event)) {
            delete pending[id];
            continue;
          }
          conflict = true;
          conflicts.add(id);
        }
        cloud.set(id, entry.event);
      }
      for (const event of config.getEvents())
        if (!cloud.has(event.id)) cloud.set(event.id, event);
      const merged = [...cloud.values()];
      ready = true;
      config.replaceEvents(merged);
      queue(merged);
      if (conflict)
        status('Conflito entre sessões. Exporte um backup antes de recarregar.', true);
      else await flush();
    } catch (error) {
      status(error.message + ' Use Tentar novamente.', true);
    }
  }
  function block(event) {
    if (ready) return;
    const t = event.target;
    if (event.type === 'submit' || t.matches?.('[data-status],[data-match],#import')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      status('Aguarde a conexão antes de editar os torneios.', true);
    }
  }
  document.addEventListener('submit', block, true);
  document.addEventListener('change', block, true);
  document.addEventListener('click', block, true);
  window.addEventListener('online', () =>
    ready ? flush() : callbacks && start(callbacks),
  );
  window.addEventListener('beforeunload', (event) => {
    if (running || Object.keys(pending).length) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cloudRetry').onclick = () => {
      if (conflict)
        return alert(
          'Use Carregar versão do banco. Sua versão local será exportada como backup antes da atualização.',
        );
      return ready ? flush() : callbacks && start(callbacks);
    };
    document.getElementById('cloudRecover').onclick = () => {
      if (!conflict || !callbacks) return;
      const url = URL.createObjectURL(
        new Blob(
          [JSON.stringify({ version: 1, events: callbacks.getEvents() }, null, 2)],
          { type: 'application/json' },
        ),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'duelist-kingdom-antes-de-resolver-conflito.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      for (const id of conflicts) delete pending[id];
      conflicts.clear();
      conflict = false;
      ready = false;
      persist();
      start(callbacks);
    };
  });
  window.arenaCloud = {
    start,
    queue,
    flush,
    isReady: () => ready,
    hasPending: () => Object.keys(pending).length > 0,
  };
})();
