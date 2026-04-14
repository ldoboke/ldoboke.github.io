
(function () {
  const storageKey = 'theme-mode';

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(storageKey, theme); } catch (e) {}
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  function bindTheme() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('#theme-toggle');
      if (!btn) return;
      e.preventDefault();
      toggleTheme();
    });
  }

  function syncGiscusTheme() {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return;
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    iframe.contentWindow.postMessage({
      giscus: { setConfig: { theme: theme } }
    }, 'https://giscus.app');
  }

  function bindGiscusThemeSync() {
    window.addEventListener('themechange', function () {
      setTimeout(syncGiscusTheme, 80);
      setTimeout(syncGiscusTheme, 400);
    });
    window.addEventListener('load', function () {
      setTimeout(syncGiscusTheme, 300);
      setTimeout(syncGiscusTheme, 1000);
    });
    window.addEventListener('message', function () {
      setTimeout(syncGiscusTheme, 120);
    });
  }

  const modal = document.getElementById('search-modal');
  const openBtn = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (input) setTimeout(() => input.focus(), 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindSearch() {
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  let searchCache = null;
  async function loadSearchData() {
    if (searchCache) return searchCache;
    const res = await fetch('/search.json', { cache: 'no-store' });
    searchCache = await res.json();
    return searchCache;
  }

  if (input) {
    input.addEventListener('input', async function () {
      const q = input.value.trim().toLowerCase();
      const data = await loadSearchData();
      if (!q) {
        results.innerHTML = '<p class="search-empty">开始输入后会实时筛选文章。</p>';
        return;
      }
      const matched = data.filter(item => {
        return [item.title, item.excerpt, item.content, (item.tags || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q);
      }).slice(0, 10);
      if (!matched.length) {
        results.innerHTML = '<p class="search-empty">没有找到相关内容。</p>';
        return;
      }
      results.innerHTML = matched.map(item => {
        const href = item.url && item.url.startsWith('/') ? item.url : '/' + String(item.url || '').replace(/^\.\//, '');
        return `
          <a class="search-result-item" href="${href}">
            <strong>${item.title}</strong>
            <span>${item.excerpt || ''}</span>
          </a>
        `;
      }).join('');
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function normalizedPath() {
    let path = location.pathname || '/';
    if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length);
    if (!path.endsWith('/')) path += '/';
    return path || '/';
  }

  function counterUrl(path) {
    return 'https://ldoboke.goatcounter.com/counter/' + encodeURIComponent(path) + '.json';
  }

  async function fetchCount(path) {
    try {
      const res = await fetch(counterUrl(path), { mode: 'cors', cache: 'no-store' });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      if (typeof data.count === 'string') return data.count;
      if (typeof data.count === 'number') return String(data.count);
      return '0';
    } catch (e) {
      return '—';
    }
  }

  async function applyGoatCounterStats() {
    const path = normalizedPath();
    setText('gc-today', '后台查看');
    const total = await fetchCount('TOTAL');
    setText('gc-total', total);
    const current = await fetchCount(path);
    setText('gc-path', current);
    setText('gc-article', current);
    setText('gc-article-legacy', current);
  }

  applyTheme(preferredTheme());
  bindTheme();
  bindSearch();
  bindGiscusThemeSync();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGoatCounterStats);
  } else {
    applyGoatCounterStats();
  }
})();
