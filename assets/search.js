/* HUKO pets — barra de pesquisa do header
   A pesquisa em si é o submit normal do formulário, que leva à página de
   resultados. Aqui trata-se só do comportamento da barra: cresce ao ser clicada
   e mostra o botão de limpar assim que há termo escrito. */
(function () {
  var wrap = document.querySelector('[data-search]');
  if (!wrap) return;

  var input = wrap.querySelector('[data-search-input]');
  var clearBtn = wrap.querySelector('[data-search-clear]');

  function syncTerm() {
    var hasTerm = input.value.trim().length > 0;
    clearBtn.hidden = !hasTerm;
    wrap.classList.toggle('has-term', hasTerm);
  }

  input.addEventListener('input', syncTerm);
  input.addEventListener('focus', function () { wrap.classList.add('is-active'); });
  input.addEventListener('blur', function () { wrap.classList.remove('is-active'); });

  clearBtn.addEventListener('click', function () {
    input.value = '';
    syncTerm();
    input.focus();
  });

  /* Estado inicial na página de resultados, onde o campo já vem preenchido. */
  syncTerm();
})();
