/* HUKO pets — filtros
   O formulário dos filtros é um GET normal. Este ficheiro só adiciona
   conveniências: aplicar assim que se mexe num campo (o botão deixa de ser
   preciso), mostrar listas longas por inteiro e abrir/fechar em telemóvel. */
(function () {
  var form = document.querySelector('[data-facets]');
  if (!form) return;

  /* Com JS o botão "Aplicar filtros" é redundante — sem JS continua lá. */
  form.classList.add('is-auto');

  form.addEventListener('change', function (e) {
    if (e.target.matches('input')) form.submit();
  });

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
