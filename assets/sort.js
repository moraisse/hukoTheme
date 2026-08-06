/* HUKO pets — ordenação
   Painel de opções próprio, em vez da lista nativa do sistema. O valor vive num
   campo escondido: escolher uma opção escreve-o e submete o formulário a que
   pertence — o dos filtros, quando a página os tem, para não se perder nada. */
(function () {
  var root = document.querySelector('[data-sort]');
  if (!root) return;

  var trigger = root.querySelector('[data-sort-trigger]');
  var panel = root.querySelector('[data-sort-panel]');
  var field = root.querySelector('[data-sort-input]');
  var label = root.querySelector('[data-sort-label]');
  var options = root.querySelectorAll('[data-sort-option]');

  function open() {
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    root.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', function () {
    if (root.classList.contains('is-open')) close();
    else open();
  });

  options.forEach(function (option) {
    option.addEventListener('click', function () {
      field.value = option.dataset.value;
      label.textContent = option.textContent.trim();
      options.forEach(function (o) { o.setAttribute('aria-selected', o === option ? 'true' : 'false'); });
      close();
      /* field.form resolve o formulário próprio ou o dos filtros, conforme o atributo form=. */
      if (field.form) field.form.submit();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) {
      close();
      trigger.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!root.classList.contains('is-open')) return;
    if (e.target.closest('[data-sort]')) return;
    close();
  });
})();
