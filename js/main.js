'use strict';
/* ДомТех — скрипты: меню, валидация форм, корзина, галерея */
(function () {
  var fmt = new Intl.NumberFormat('ru-RU');
  var rub = function (n) { return fmt.format(n) + ' ₽'; };

  /* ---- Мобильное меню ---- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  /* ---- Валидация форм (Constraint Validation API + свои сообщения) ---- */
  var messages = {
    valueMissing: 'Заполните это поле.',
    typeMismatch: 'Проверьте формат значения.',
    patternMismatch: 'Значение не соответствует требуемому формату.',
    tooShort: 'Слишком короткое значение.',
    rangeUnderflow: 'Значение меньше допустимого.',
    rangeOverflow: 'Значение больше допустимого.',
    stepMismatch: 'Введите целое число.'
  };
  function messageFor(el) {
    if (el.validity.valid) return '';
    if (el.validity.customError) return el.validationMessage;
    if (el.validity.typeMismatch && el.type === 'email') return 'Введите e-mail в формате name@example.com.';
    if (el.validity.tooShort) return 'Минимум символов: ' + el.minLength + '.';
    if (el.validity.rangeUnderflow) return 'Минимальное значение: ' + el.min + '.';
    if (el.validity.rangeOverflow) return 'Максимальное значение: ' + el.max + '.';
    if (el.validity.patternMismatch && el.title) return el.title;
    for (var k in messages) { if (el.validity[k]) return messages[k]; }
    return 'Некорректное значение.';
  }
  function showError(el) {
    var msg = messageFor(el);
    el.setCustomValidity('');
    var holder = el.closest('.field') || el.parentNode;
    var out = holder.querySelector('.err');
    if (!out) {
      out = document.createElement('span');
      out.className = 'err';
      out.setAttribute('role', 'alert');
      el.insertAdjacentElement('afterend', out);
    }
    out.textContent = msg;
    el.classList.toggle('invalid', !!msg);
    el.classList.toggle('valid', !msg && el.value !== '');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  // Доп. правило: пароли / подтверждение, купон и т.д. задаются через data-атрибуты
  function extraRules(el) {
    if (el.dataset.match) {
      var other = document.getElementById(el.dataset.match);
      if (other && el.value !== other.value) el.setCustomValidity('Пароли не совпадают.');
      else el.setCustomValidity('');
    }
  }
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { extraRules(el); showError(el); });
      el.addEventListener('input', function () { if (el.classList.contains('invalid')) { extraRules(el); showError(el); } });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      fields.forEach(function (el) {
        extraRules(el);
        if (!showError(el)) { ok = false; if (!first) first = el; }
      });
      var status = form.querySelector('.status') || (form.parentNode && form.parentNode.querySelector('.status'));
      if (!ok) {
        if (first) first.focus();
        if (status) { status.textContent = 'Исправьте ошибки в форме.'; status.className = 'status bad'; }
        return;
      }
      if (status) { status.textContent = form.dataset.success || 'Готово!'; status.className = 'status ok'; }
      if (form.dataset.redirect) { window.location.href = form.dataset.redirect; }
      else if (form.dataset.reset !== 'no') { form.reset(); fields.forEach(function (f) { f.classList.remove('valid'); }); }
    });
  });

  var sform = document.querySelector('form.search');
  if (sform) sform.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!sform.checkValidity()) { sform.reportValidity(); return; }
    var q = sform.querySelector('input[name=q]').value.trim();
    location.href = 'catalog.html?group=all&q=' + encodeURIComponent(q);
  }, true);

  /* ---- Фильтр цены ---- */
  var pmin = document.getElementById('price-min'), pmax = document.getElementById('price-max');
  function priceOut() {
    var o1 = document.getElementById('out-min'), o2 = document.getElementById('out-max');
    if (!pmin || !pmax) return;
    if (+pmin.value > +pmax.value) { var t = pmin.value; pmin.value = pmax.value; pmax.value = t; }
    o1.textContent = rub(+pmin.value); o2.textContent = rub(+pmax.value);
  }
  if (pmin && pmax) { pmin.addEventListener('input', priceOut); pmax.addEventListener('input', priceOut); priceOut(); }

  /* ---- Корзина: хранение в localStorage (id товара -> количество) ---- */
  var KEY = 'domtech-cart-v2', cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  var cartCount = document.querySelector('.cart-count');
  function total() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k]; }, 0); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    if (cartCount) { cartCount.textContent = total(); cartCount.style.display = total() ? '' : 'none'; }
  }
  window.DomCart = {
    add: function (id, q) { cart[id] = Math.min(10, (cart[id] || 0) + (q || 1)); save(); },
    set: function (id, q) { cart[id] = Math.max(1, Math.min(10, q)); save(); },
    remove: function (id) { delete cart[id]; save(); },
    clear: function () { cart = {}; save(); },
    all: function () { return cart; }
  };
  save();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.add button');
    if (b && b.dataset.id) window.DomCart.add(+b.dataset.id, 1);
  });

  /* ---- Галерея на странице товара ---- */
  var slides = document.querySelectorAll('[data-slides] img');
  var gal = document.querySelector('[data-slides]');
  if (gal) {
    var filters = ['none', 'hue-rotate(160deg) saturate(1.3)', 'grayscale(1) contrast(1.1)'];
    var caps = ['Белый', 'Синий', 'Графитовый'];
    var idx = 0, img = gal.querySelector('img'), cap = gal.querySelector('figcaption');
    var go = function (d) {
      idx = (idx + d + filters.length) % filters.length;
      img.style.filter = filters[idx]; cap.textContent = 'Вариант цвета: ' + caps[idx];
    };
    document.querySelector('.gallery .prev').addEventListener('click', function () { go(-1); });
    document.querySelector('.gallery .next').addEventListener('click', function () { go(1); });
  }

  var bl = document.querySelector('a[href="#billing"]');
  if (bl) bl.addEventListener('click', function () { document.getElementById('billing').open = true; });

  /* ---- Прогресс заполнения шага оформления заказа ---- */
  var ck = document.getElementById('checkout-steps');
  if (ck) {
    var pr = document.getElementById('steps-progress');
    var upd = function () {
      var all = ck.querySelectorAll('details').length, open = ck.querySelectorAll('details[open]').length;
      pr.value = open; pr.max = all;
    };
    ck.addEventListener('toggle', upd, true); upd();
  }
})();
