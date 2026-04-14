(function () {
  const modal = document.getElementById('search-modal');
  const openBtn = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const root = window.__ROOT__ || './';

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

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  async function loadSearch() {
    const res = await fetch(root + 'search.json');
    return await res.json();
  }

  let cache = null;
  async function ensureData() {
    if (!cache) cache = await loadSearch();
    return cache;
  }

  if (input) {
    input.addEventListener('input', async function () {
      const q = input.value.trim().toLowerCase();
      const data = await ensureData();
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
      results.innerHTML = matched.map(item => `
        <a class="search-result-item" href="${root}${item.url}">
          <strong>${item.title}</strong>
          <span>${item.excerpt || ''}</span>
        </a>
      `).join('');
    });
  }
})();