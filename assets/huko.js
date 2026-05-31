/* HUKO pets — Shopify theme behaviour
   Header scroll · mobile menu · cart drawer · tabs · gallery · qty · AJAX cart */
(function(){
  'use strict';

  /* ---- sticky header ---- */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function(){ header.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  /* ---- open / close drawers & menu ---- */
  function setOpen(id, open){
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open', open);
    var scrim = document.getElementById(el.getAttribute('data-scrim'));
    if (scrim) scrim.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  window.hukoOpenCart = function(){ setOpen('cart', true); };

  document.addEventListener('click', function(e){
    var o = e.target.closest('[data-open]');
    if (o){ e.preventDefault(); setOpen(o.getAttribute('data-open'), true); return; }
    var c = e.target.closest('[data-close]');
    if (c){ e.preventDefault(); setOpen(c.getAttribute('data-close'), false); return; }
    if (e.target.classList && e.target.classList.contains('scrim')){
      document.querySelectorAll('.drawer.open,.mmenu.open').forEach(function(d){ d.classList.remove('open'); });
      e.target.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      document.querySelectorAll('.drawer.open,.mmenu.open,.scrim.open').forEach(function(d){ d.classList.remove('open'); });
      document.body.style.overflow = '';
    }
  });

  /* ---- product tabs ---- */
  document.querySelectorAll('[data-tabs]').forEach(function(group){
    var btns = group.querySelectorAll('.tabnav button');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-tab');
        btns.forEach(function(b){ b.classList.toggle('active', b === btn); });
        group.querySelectorAll('.tabpane').forEach(function(p){ p.classList.toggle('active', p.id === id); });
      });
    });
  });

  /* ---- gallery thumbnails ---- */
  document.addEventListener('click', function(e){
    var t = e.target.closest('.gallery-thumbs [data-thumb]');
    if (!t) return;
    var main = document.querySelector('.gallery-main img');
    if (main) main.src = t.getAttribute('data-full') || t.querySelector('img').src;
    t.parentElement.querySelectorAll('[data-thumb]').forEach(function(x){ x.classList.remove('active'); });
    t.classList.add('active');
  });

  /* ---- single-select button groups (color / size) ---- */
  document.querySelectorAll('[data-select]').forEach(function(group){
    group.querySelectorAll('button:not(.soldout)').forEach(function(btn){
      btn.addEventListener('click', function(){
        group.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b === btn); });
        var labelSel = group.getAttribute('data-sel-label');
        if (labelSel){ var t = document.querySelector(labelSel); if (t) t.textContent = btn.getAttribute('data-val') || btn.textContent; }
        // keep a hidden input in sync for variant selection if present
        var input = group.parentElement.querySelector('input[name="'+ (group.getAttribute('data-option') || '') +'"]');
        if (input) input.value = btn.getAttribute('data-val');
        if (typeof window.hukoUpdateVariant === 'function') window.hukoUpdateVariant();
      });
    });
  });

  /* ---- quantity steppers ---- */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-stepper] button');
    if (!b) return;
    var st = b.closest('[data-stepper]');
    var val = st.querySelector('[data-qty]');
    var isInput = val && val.tagName === 'INPUT';
    var n = parseInt(isInput ? val.value : val.textContent, 10) || 1;
    n += (b.getAttribute('data-step') === '-' ? -1 : 1);
    if (n < 1) n = 1;
    if (isInput) { val.value = n; } else { val.textContent = n; }
    // line-item quantity change in cart
    var key = st.getAttribute('data-line-key');
    if (key) changeLine(key, n);
  });

  /* ---- AJAX cart via Section Rendering API ---- */
  var DRAWER_SECTION = 'huko-cart-drawer';

  function refreshDrawer(html){
    var wrap = document.getElementById('shopify-section-' + DRAWER_SECTION);
    if (wrap && html){ wrap.innerHTML = html; }
  }
  function updateCount(count){
    document.querySelectorAll('[data-cart-count]').forEach(function(el){
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  function postJSON(url, body){
    return fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  function changeLine(key, qty){
    postJSON((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart/change.js',
      { id:key, quantity:qty, sections:[DRAWER_SECTION], sections_url: window.location.pathname })
      .then(function(cart){
        if (cart.sections && cart.sections[DRAWER_SECTION]) refreshDrawer(cart.sections[DRAWER_SECTION]);
        updateCount(cart.item_count);
      });
  }

  // add-to-cart forms (product form + quick-add)
  document.addEventListener('submit', function(e){
    var form = e.target.closest('form[action$="/cart/add"], form[data-cart-form]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    if (btn){ btn.setAttribute('aria-busy','true'); btn.dataset.label = btn.textContent; btn.textContent = 'A adicionar…'; }
    var data = new FormData(form);
    var body = {};
    data.forEach(function(v,k){ body[k] = v; });
    body.sections = [DRAWER_SECTION];
    body.sections_url = window.location.pathname;
    fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart/add.js', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(body)
    }).then(function(r){ return r.json(); }).then(function(){
      return fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart.js').then(function(r){return r.json();});
    }).then(function(cart){
      // re-fetch drawer section to reflect new state
      return fetch(window.location.pathname + '?section_id=' + DRAWER_SECTION).then(function(r){return r.text();}).then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var inner = doc.getElementById('shopify-section-' + DRAWER_SECTION);
        refreshDrawer(inner ? inner.innerHTML : html);
        updateCount(cart.item_count);
        setOpen('cart', true);
      });
    }).catch(function(){ /* fail silently, fall back to default form post */ })
      .then(function(){ if (btn){ btn.removeAttribute('aria-busy'); btn.textContent = btn.dataset.label || 'Adicionar ao carrinho'; } });
  });

  // remove line
  document.addEventListener('click', function(e){
    var rm = e.target.closest('[data-remove-key]');
    if (!rm) return;
    e.preventDefault();
    changeLine(rm.getAttribute('data-remove-key'), 0);
  });

  /* ---- product variant selection ---- */
  window.hukoUpdateVariant = function(){
    var form = document.getElementById('huko-product-form');
    if (!form) return;
    var select = document.getElementById('huko-variant-select');
    if (!select) return;
    // collect selected option values in order
    var chosen = [];
    form.querySelectorAll('[data-select][data-option-index]').forEach(function(g){
      var active = g.querySelector('button.active');
      chosen[parseInt(g.getAttribute('data-option-index'),10)] = active ? active.getAttribute('data-val') : null;
    });
    var key = chosen.join(' / ');
    var match = null;
    Array.prototype.forEach.call(select.options, function(opt){
      if (opt.getAttribute('data-options') === key) match = opt;
    });
    if (match){
      select.value = match.value;
      var priceEl = document.querySelector('[data-price]');
      if (priceEl && match.getAttribute('data-price')) priceEl.textContent = match.getAttribute('data-price');
      var submit = form.querySelector('[type="submit"]');
      if (submit){
        if (match.disabled){ submit.setAttribute('disabled','disabled'); submit.textContent = 'Esgotado'; }
        else { submit.removeAttribute('disabled'); submit.textContent = 'Adicionar ao carrinho'; }
      }
    }
  };

  /* ---- related products via Recommendations API (progressive enhancement) ---- */
  var rel = document.getElementById('related-products');
  if (rel && window.Shopify){
    var url = (window.Shopify.routes.root || '/') + 'recommendations/products?section_id=&product_id=' +
              rel.getAttribute('data-product-id') + '&limit=' + (rel.getAttribute('data-limit') || 4);
    fetch(url).then(function(r){ return r.text(); }).then(function(html){
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var cards = doc.querySelectorAll('.pcard');
      if (cards.length){
        var grid = rel.parentElement;
        // clear server-rendered fallback siblings, keep nothing duplicated
        grid.querySelectorAll('.pcard').forEach(function(c){ c.remove(); });
        cards.forEach(function(c){ grid.appendChild(c); });
      }
    }).catch(function(){});
  }
})();
