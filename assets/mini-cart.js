/* HUKO pets — mini-carrinho
   Adiciona produtos por AJAX a partir dos cartões de produto e mostra o painel
   por baixo do ícone do carrinho, sem navegar para fora da listagem. */
(function () {
  var cfg = window.HukoCart || {};
  var panel = document.getElementById('mini-cart');
  if (!panel) return;

  var backdrop = document.querySelector('.mini-cart-backdrop');
  var cartLink = document.querySelector('.cart-link');
  var countEl = document.querySelector('.cart-count');
  var itemsEl = panel.querySelector('[data-mini-cart-items]');
  var emptyEl = panel.querySelector('[data-mini-cart-empty]');
  var footEl = panel.querySelector('[data-mini-cart-foot]');
  var totalEl = panel.querySelector('[data-mini-cart-total]');
  var shipMsgEl = panel.querySelector('[data-mini-cart-ship-msg]');
  var barEl = panel.querySelector('[data-mini-cart-bar]');

  var threshold = (cfg.freeShippingThreshold || 45) * 100;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  /* ---------- formatação ---------- */

  function group(value, decimals, thousands, decimalSep) {
    var parts = value.toFixed(decimals).split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    return parts[1] ? int + decimalSep + parts[1] : int;
  }

  function formatMoney(cents) {
    var value = (cents || 0) / 100;
    var fmt = cfg.moneyFormat || '{{amount_with_comma_separator}}€';
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_match, name) {
      switch (name) {
        case 'amount': return group(value, 2, ',', '.');
        case 'amount_no_decimals': return group(value, 0, ',', '.');
        case 'amount_with_apostrophe_separator': return group(value, 2, "'", '.');
        case 'amount_no_decimals_with_comma_separator': return group(value, 0, '.', ',');
        default: return group(value, 2, '.', ',');
      }
    });
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function thumb(url, width) {
    if (typeof url !== 'string' || !url) return '';
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'width=' + width;
  }

  /* O JSON do carrinho expõe a imagem em sítios diferentes conforme a origem
     (Liquid `cart | json` vs. /cart.js), por isso testam-se as duas formas. */
  function itemImage(item) {
    if (item.featured_image && typeof item.featured_image.url === 'string') return item.featured_image.url;
    if (typeof item.image === 'string') return item.image;
    if (item.image && typeof item.image.src === 'string') return item.image.src;
    return '';
  }

  function linePrice(item) {
    if (typeof item.final_line_price === 'number') return item.final_line_price;
    if (typeof item.line_price === 'number') return item.line_price;
    return (item.price || 0) * (item.quantity || 0);
  }

  /* ---------- desenho do painel ---------- */

  function itemHTML(item, line) {
    var variant = '';
    if (item.variant_title && item.variant_title !== 'Default Title') {
      variant = '<span class="mini-cart__variant">' + esc(item.variant_title) + '</span>';
    }
    var image = itemImage(item);
    return '' +
      '<div class="mini-cart__item" data-line="' + line + '">' +
        '<a class="mini-cart__thumb" href="' + esc(item.url) + '">' +
          (image ? '<img src="' + esc(thumb(image, 160)) + '" alt="' + esc(item.product_title) + '" loading="lazy">' : '') +
        '</a>' +
        '<div class="mini-cart__info">' +
          '<a class="mini-cart__name" href="' + esc(item.url) + '">' + esc(item.product_title) + '</a>' +
          variant +
          '<div class="mini-cart__qty">' +
            '<button type="button" class="mini-cart__qty-btn" data-qty="' + (item.quantity - 1) + '" aria-label="Diminuir quantidade">&minus;</button>' +
            '<span class="mini-cart__qty-val">' + item.quantity + '</span>' +
            '<button type="button" class="mini-cart__qty-btn" data-qty="' + (item.quantity + 1) + '" aria-label="Aumentar quantidade">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="mini-cart__side">' +
          '<button type="button" class="mini-cart__remove" data-qty="0" aria-label="Remover ' + esc(item.product_title) + '">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>' +
          '</button>' +
          '<span class="mini-cart__price">' + formatMoney(linePrice(item)) + '</span>' +
        '</div>' +
      '</div>';
  }

  function renderShipping(total) {
    var missing = threshold - total;
    if (missing <= 0) {
      shipMsgEl.innerHTML = 'Parabéns, tens <strong>Portes Grátis!</strong>';
      barEl.style.width = '100%';
      panel.classList.add('has-free-shipping');
    } else {
      shipMsgEl.innerHTML = 'Faltam <strong>' + formatMoney(missing) + '</strong> para portes grátis';
      barEl.style.width = Math.max(2, (total / threshold) * 100) + '%';
      panel.classList.remove('has-free-shipping');
    }
  }

  function render(cart) {
    var count = cart.item_count || 0;

    if (countEl) {
      countEl.textContent = count;
      countEl.classList.toggle('is-visible', count > 0);
    }

    itemsEl.innerHTML = (cart.items || []).map(function (item, i) {
      return itemHTML(item, i + 1);
    }).join('');

    emptyEl.hidden = count > 0;
    footEl.hidden = count === 0;

    totalEl.textContent = formatMoney(cart.total_price);
    if (count > 0) renderShipping(cart.total_price);
  }

  /* ---------- abrir / fechar ---------- */

  function open() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.hidden = false;
  }

  function close() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.hidden = true;
  }

  function bumpCart() {
    if (!cartLink || reduceMotion) return;
    cartLink.classList.remove('is-bumping');
    void cartLink.offsetWidth;
    cartLink.classList.add('is-bumping');
  }

  /* Clona a imagem do produto e faz voar até ao ícone do carrinho. */
  function flyToCart(img) {
    if (!img || !cartLink || reduceMotion) return;
    var from = img.getBoundingClientRect();
    var to = cartLink.getBoundingClientRect();
    var ghost = img.cloneNode();
    ghost.className = 'atc-ghost';
    ghost.style.left = from.left + 'px';
    ghost.style.top = from.top + 'px';
    ghost.style.width = from.width + 'px';
    ghost.style.height = from.height + 'px';
    document.body.appendChild(ghost);

    requestAnimationFrame(function () {
      var dx = to.left + to.width / 2 - (from.left + from.width / 2);
      var dy = to.top + to.height / 2 - (from.top + from.height / 2);
      ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.12)';
      ghost.style.opacity = '0';
    });
    setTimeout(function () { ghost.remove(); }, 760);
  }

  /* ---------- pedidos ao carrinho ---------- */

  function fetchCart() {
    return fetch(cfg.routes.cart + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); });
  }

  function changeLine(line, quantity) {
    if (busy) return;
    busy = true;
    panel.classList.add('is-busy');
    fetch(cfg.routes.cartChange, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {})
      .then(function () {
        busy = false;
        panel.classList.remove('is-busy');
      });
  }

  function addFromForm(form) {
    var btn = form.querySelector('.btn--atc');
    var card = form.closest('.prod-card');
    var img = card ? card.querySelector('.prod-card__img img') : null;

    if (btn) {
      if (btn.classList.contains('is-loading')) return;
      btn.classList.remove('is-done');
      btn.classList.add('is-loading');
      btn.disabled = true;
    }
    flyToCart(img);

    fetch(cfg.routes.cartAdd, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.description || data.message || 'Erro');
          return data;
        });
      })
      .then(fetchCart)
      .then(function (cart) {
        render(cart);
        bumpCart();
        open();
        if (btn) {
          btn.classList.remove('is-loading');
          btn.classList.add('is-done');
          setTimeout(function () { btn.classList.remove('is-done'); }, 1600);
        }
      })
      .catch(function (err) {
        if (btn) {
          btn.classList.remove('is-loading');
          btn.classList.add('is-error');
          var label = btn.querySelector('.btn--atc__label');
          var original = label ? label.textContent : '';
          if (label) label.textContent = err.message || 'Indisponível';
          setTimeout(function () {
            btn.classList.remove('is-error');
            if (label) label.textContent = original;
          }, 2600);
        }
      })
      .then(function () {
        if (btn) btn.disabled = false;
      });
  }

  /* ---------- eventos ---------- */

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-atc-form]');
    if (!form) return;
    e.preventDefault();
    addFromForm(form);
  });

  if (cartLink) {
    cartLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (panel.classList.contains('is-open')) close();
      else open();
    });
  }

  panel.addEventListener('click', function (e) {
    if (e.target.closest('[data-mini-cart-close]')) {
      close();
      return;
    }
    var btn = e.target.closest('[data-qty]');
    if (!btn) return;
    var item = btn.closest('.mini-cart__item');
    if (!item) return;
    changeLine(parseInt(item.dataset.line, 10), parseInt(btn.dataset.qty, 10));
  });

  if (backdrop) backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });

  document.addEventListener('click', function (e) {
    if (!panel.classList.contains('is-open')) return;
    if (e.target.closest('#mini-cart') || e.target.closest('.cart-link')) return;
    close();
  });

  /* Estado inicial (o carrinho pode ter sido alterado noutro separador/página). */
  if (cfg.cart) render(cfg.cart);
})();
