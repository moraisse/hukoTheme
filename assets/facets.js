/* HUKO pets — filtros
   O formulário dos filtros é um GET normal. Este ficheiro só adiciona
   conveniências: a barra deslizante de preço, aplicar assim que se mexe num
   campo (o botão deixa de ser preciso), listas longas e abrir/fechar em telemóvel. */
(function () {
  var form = document.querySelector('[data-facets]');
  if (!form) return;

  /* ---------- barra de preço ---------- */

  function setupRange(range) {
    var from = range.querySelector('[data-facet-range-from]');
    var to = range.querySelector('[data-facet-range-to]');
    var fill = range.querySelector('[data-facet-range-fill]');
    var body = range.closest('.facet__body');
    var priceFrom = body.querySelector('[data-facet-price-from]');
    var priceTo = body.querySelector('[data-facet-price-to]');
    var max = parseFloat(range.dataset.max) || 0;
    if (!max) return;

    function paint() {
      var a = Math.min(+from.value, +to.value);
      var b = Math.max(+from.value, +to.value);
      fill.style.left = (a / max) * 100 + '%';
      fill.style.right = 100 - (b / max) * 100 + '%';
    }

    /* Nos extremos o campo fica vazio, para não pôr no URL um filtro que não filtra nada. */
    function syncFields() {
      var a = Math.min(+from.value, +to.value);
      var b = Math.max(+from.value, +to.value);
      priceFrom.value = a > 0 ? a : '';
      priceTo.value = b < max ? b : '';
    }

    function syncHandles() {
      from.value = priceFrom.value === '' ? 0 : Math.max(0, Math.min(max, parseFloat(priceFrom.value)));
      to.value = priceTo.value === '' ? max : Math.max(0, Math.min(max, parseFloat(priceTo.value)));
      paint();
    }

    [from, to].forEach(function (handle) {
      handle.addEventListener('input', function () {
        paint();
        syncFields();
      });
    });

    [priceFrom, priceTo].forEach(function (field) {
      field.addEventListener('input', syncHandles);
    });

    paint();
  }

  form.querySelectorAll('[data-facet-range]').forEach(setupRange);

  /* ---------- aplicar ---------- */

  /* Com JS o botão "Aplicar filtros" é redundante — sem JS continua lá. */
  form.classList.add('is-auto');

  form.addEventListener('change', function (e) {
    if (e.target.matches('input')) form.submit();
  });

  /* ---------- listas longas e painel em telemóvel ---------- */

  form.querySelectorAll('[data-facet-more]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var body = btn.closest('.facet__body');
      var expanded = body.classList.toggle('is-expanded');
      btn.textContent = expanded ? btn.dataset.labelLess : btn.dataset.labelMore;
    });
  });

  var toggle = document.querySelector('[data-facets-toggle]');
  var sidebar = document.getElementById('FacetsSidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();
