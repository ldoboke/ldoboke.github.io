
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


  function formatBeijingTime() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    let hh = '00';
    let mm = '00';
    parts.forEach(function (p) {
      if (p.type === 'hour') hh = p.value;
      if (p.type === 'minute') mm = p.value;
    });
    return hh + ':' + mm;
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
    setText('gc-today', formatBeijingTime());
    setInterval(function(){ setText('gc-today', formatBeijingTime()); }, 60000);
    const path = normalizedPath();
    
    const total = await fetchCount('TOTAL');
    setText('gc-total', total);
    const current = await fetchCount(path);
    setText('gc-path', current);
    setText('gc-article', current);
    setText('gc-article-legacy', current);
  }


  function setupBackTop() {
    let btn = document.getElementById('back-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'back-top';
      btn.className = 'back-top';
      btn.setAttribute('aria-label', '返回顶部');
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"></path><path d="M6 11l6-6 6 6"></path></svg>';
      document.body.appendChild(btn);
    }
    function update() {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      btn.classList.toggle('show', y > 320);
    }
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function setupReveal() {
    const cards = document.querySelectorAll('.post-card, .article-page, .page-card, .archive-card, .category-card, .tag-card, .message-preview-card, .site-footer');
    cards.forEach(function (el, index) {
      if (el.classList.contains('site-header')) return;
      el.classList.add('reveal-on-scroll');
      el.style.transitionDelay = Math.min(index * 40, 160) + 'ms';
    });
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach(function (el){ io.observe(el); });
  }


  applyTheme(preferredTheme());
  bindTheme();
  bindSearch();
  setupBackTop();
  setupReveal();
  bindGiscusThemeSync();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGoatCounterStats);
  } else {
    applyGoatCounterStats();
  }
})();
