/* HUKO pets — pesquisa no header
   Mostra os resultados num painel por baixo da barra, sem abrir a página de
   pesquisa. O HTML dos resultados vem da secção "predictive-search" renderizada
   pelo servidor, por isso preços e formatação são os mesmos do resto da loja. */
(function () {
  var wrap = document.querySelector('[data-search]');
  var panel = document.querySelector('[data-search-panel]');
  if (!wrap || !panel) return;

  var header = document.querySelector('.site-header');
  var input = wrap.querySelector('[data-search-input]');
  var clearBtn = wrap.querySelector('[data-search-clear]');
  var results = panel.querySelector('[data-search-results]');
  var overlay = document.querySelector('.search-overlay');
  var suggestUrl = wrap.dataset.suggestUrl || '/search/suggest';

  var MIN_CHARS = 2;
  var DEBOUNCE = 260;
  var timer = null;
  var controller = null;
  var lastQuery = '';
  var isOpen = false;
  var isFocused = false;

  /* ---------- estado visual ---------- */

  function syncActive() {
    wrap.classList.toggle('is-active', isFocused || isOpen);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    input.setAttribute('aria-expanded', 'true');
    if (header) header.classList.add('is-search-open');
    if (overlay) overlay.hidden = false;
    syncActive();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    input.setAttribute('aria-expanded', 'false');
    if (header) header.classList.remove('is-search-open');
    if (overlay) overlay.hidden = true;
    syncActive();
  }

  function showSkeleton() {
    if (results.children.length) return;
    var cells = '';
    for (var i = 0; i < 8; i++) cells += '<div class="search-skeleton__cell"></div>';
    results.innerHTML = '<div class="search-skeleton">' + cells + '</div>';
  }

  /* ---------- pedidos ---------- */

  function search(query) {
    if (controller) controller.abort();
    controller = new AbortController();

    var url = suggestUrl +
      '?q=' + encodeURIComponent(query) +
      '&section_id=predictive-search' +
      '&resources[type]=product,collection' +
      '&resources[limit]=10' +
      '&resources[limit_scope]=each';

    panel.classList.add('is-loading');
    showSkeleton();
    open();

    fetch(url, { signal: controller.signal })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var section = doc.querySelector('[data-search-section]');
        results.innerHTML = section ? section.innerHTML : '';
        panel.classList.remove('is-loading');
        panel.scrollTop = 0;
      })
      .catch(function (err) {
        if (err.name === 'AbortError') return;
        panel.classList.remove('is-loading');
        results.innerHTML = '<div class="search-panel__empty"><p>Não foi possível carregar os resultados.</p></div>';
      });
  }

  function onInput() {
    var query = input.value.trim();
    clearBtn.hidden = query.length === 0;
    wrap.classList.toggle('has-term', query.length > 0);

    clearTimeout(timer);

    if (query.length < MIN_CHARS) {
      if (controller) controller.abort();
      lastQuery = '';
      results.innerHTML = '';
      close();
      return;
    }
    if (query === lastQuery) {
      open();
      return;
    }

    timer = setTimeout(function () {
      lastQuery = query;
      search(query);
    }, DEBOUNCE);
  }

  /* ---------- eventos ---------- */

  input.addEventListener('input', onInput);

  input.addEventListener('focus', function () {
    isFocused = true;
    syncActive();
    if (input.value.trim().length >= MIN_CHARS && results.children.length) open();
  });

  input.addEventListener('blur', function () {
    isFocused = false;
    syncActive();
  });

  clearBtn.addEventListener('click', function () {
    input.value = '';
    lastQuery = '';
    results.innerHTML = '';
    clearBtn.hidden = true;
    wrap.classList.remove('has-term');
    close();
    input.focus();
  });

  document.querySelectorAll('[data-search-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      close();
      input.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!isOpen) return;
    if (e.target.closest('[data-search-panel]') || e.target.closest('[data-search]')) return;
    close();
  });

  /* Estado inicial na página de resultados, onde o campo já vem preenchido. */
  if (input.value.trim().length > 0) {
    clearBtn.hidden = false;
    wrap.classList.add('has-term');
  }
})();
