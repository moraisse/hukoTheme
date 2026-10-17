/* HUKO pets — página inicial v2: carrossel do topo, separadores e cópia do código. */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Carrossel do topo */
  var hero = document.querySelector('[data-hv-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hv-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hv-dot]'));
    var index = 0, timer = null;
    var show = function (n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () { if (reduceMotion || slides.length < 2) return; stop(); timer = setInterval(function () { show(index + 1); }, 6000); };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    /* deslizar no telemóvel */
    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      x0 = null; start();
    });
    show(0);
    start();
  }

  /* Separadores (Cães/Gatos, Natura Diet/Dingo) */
  document.querySelectorAll('[data-hv-tabs]').forEach(function (root) {
    var buttons = root.querySelectorAll('[data-hv-tab]');
    var panels = root.querySelectorAll('[data-hv-panel]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-hv-tab');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-hv-panel') !== key; });
      });
    });
  });

  /* Copiar código promocional */
  document.querySelectorAll('[data-hv-coupon]').forEach(function (el) {
    el.addEventListener('click', function () {
      var code = el.getAttribute('data-code');
      var fb = el.querySelector('[data-hv-coupon-feedback]');
      var done = function () {
        if (fb) fb.textContent = 'Copiado!';
        el.classList.add('is-copied');
        setTimeout(function () { if (fb) fb.textContent = 'Copiar'; el.classList.remove('is-copied'); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
      else done();
    });
  });
})();
