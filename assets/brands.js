/* HUKO pets — diretório de marcas
   Filtra a lista por letra e por texto escrito. É tudo local: as marcas já estão
   todas na página, por isso não há pedidos ao servidor enquanto se procura. */
(function () {
  var dir = document.querySelector('[data-brands-dir]');
  if (!dir) return;

  var search = dir.querySelector('[data-brand-search]');
  var empty = dir.querySelector('[data-brand-empty]');
  var letters = dir.querySelectorAll('[data-brand-letter]');
  var groups = dir.querySelectorAll('[data-brand-group]');
  var activeLetter = '';

  function apply() {
    var term = search.value.trim().toLowerCase();
    var total = 0;

    groups.forEach(function (group) {
      var matchesLetter = !activeLetter || group.dataset.brandGroup === activeLetter;
      var shown = 0;

      group.querySelectorAll('[data-brand-name]').forEach(function (item) {
        var visible = matchesLetter && (!term || item.dataset.brandName.indexOf(term) !== -1);
        item.hidden = !visible;
        if (visible) shown++;
      });

      group.hidden = shown === 0;
      total += shown;
    });

    empty.hidden = total > 0;
  }

  letters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeLetter = btn.dataset.brandLetter;
      letters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      apply();
    });
  });

  /* Escrever procura em todas as marcas, por isso a letra escolhida deixa de fazer sentido. */
  search.addEventListener('input', function () {
    if (search.value.trim() !== '' && activeLetter !== '') {
      activeLetter = '';
      letters.forEach(function (b) { b.classList.toggle('is-active', b.dataset.brandLetter === ''); });
    }
    apply();
  });
})();
