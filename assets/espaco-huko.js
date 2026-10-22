/* HUKO pets — espaco-huko.js
   Artigo do Espaço HUKO: índice automático, barra de leitura, tabelas e copiar ligação. */
(function () {
  'use strict';
  var body = document.querySelector('[data-eh-body]');
  if (!body || body.dataset.ready) return;
  body.dataset.ready = 'true';

  var slug = function (t) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'secao';
  };

  /* Índice a partir dos H2 (exceto os da chamada final) */
  var headings = Array.prototype.filter.call(body.querySelectorAll('h2'), function (h) {
    return h.textContent.trim() && !h.closest('.cta');
  });
  headings.forEach(function (h, i) {
    if (!h.id) {
      var id = slug(h.textContent);
      if (document.getElementById(id)) id += '-' + (i + 1);
      h.id = id;
    }
  });

  if (headings.length >= 2) {
    document.querySelectorAll('[data-eh-toc]').forEach(function (wrap) {
      var list = wrap.querySelector('[data-eh-toc-list]');
      headings.forEach(function (h) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.trim();
        a.setAttribute('data-target', h.id);
        li.appendChild(a);
        list.appendChild(li);
      });
      wrap.hidden = false;
      if (wrap.tagName === 'DETAILS') {
        list.addEventListener('click', function (e) { if (e.target.closest('a')) wrap.open = false; });
      }
    });

    var links = document.querySelectorAll('[data-eh-toc-list] a');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-target') === entry.target.id); });
        });
      }, { rootMargin: '-140px 0px -65% 0px' });
      headings.forEach(function (h) { io.observe(h); });
    }
  }

  /* Tabelas deslizáveis em ecrãs pequenos */
  body.querySelectorAll('table').forEach(function (table) {
    if (table.parentElement.classList.contains('eh-table')) return;
    var wrap = document.createElement('div');
    wrap.className = 'eh-table';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    var prev = table.previousElementSibling;
    wrap.setAttribute('aria-label', prev && /^H[2-4]$/.test(prev.tagName) ? prev.textContent.trim() : 'Tabela');
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  /* Barra de progresso de leitura */
  var bar = document.querySelector('[data-eh-progress]');
  if (bar) {
    var ticking = false;
    var update = function () {
      var r = body.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var read = Math.min(1, Math.max(0, -r.top / (total || 1)));
      bar.style.setProperty('--read', read.toFixed(4));
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* Copiar ligação */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-eh-copy]');
    if (!btn) return;
    var url = btn.getAttribute('data-eh-copy');
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      navigator.share({ title: document.title, url: url }).catch(function () {});
      return;
    }
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(function () {
      var t = document.createElement('div');
      t.className = 'eh-toast';
      t.setAttribute('role', 'status');
      t.textContent = 'Ligação copiada';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    });
  });
})();
