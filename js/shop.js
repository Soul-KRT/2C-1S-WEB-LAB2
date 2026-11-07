'use strict';
/* ДомТех — каталог: фильтры, сортировка, пагинация; страница товара по ?id= */
(function () {
  var D = window.PRODUCTS || [];
  var fmt = new Intl.NumberFormat('ru-RU');
  var rub = function (n) { return fmt.format(n).replace(/\s/g, ' ') + ' ₽'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var GROUPS = { all: 'Все товары', big: 'Крупная техника', kitchen: 'Кухня', clean: 'Уборка', climate: 'Климат', hit: 'Хиты продаж', sale: 'Акции' };
  var params = new URLSearchParams(location.search);

  function card(p) {
    var old = p.old ? '<del>' + rub(p.old) + '</del>' : '';
    return '<li><article class="product"><div class="thumb"><a href="product.html?id=' + p.id + '"><img src="img/photos/' + p.id + '.jpg" onerror="this.onerror=null;this.src=\'img/p-' + p.img + '.svg\'" alt="' + esc(p.name) + '" width="400" height="420" loading="lazy"></a>' +
      '<span class="add"><button type="button" data-id="' + p.id + '"><img src="img/i-cart.svg" alt="" width="20" height="18">В корзину</button></span></div>' +
      '<div class="product-info"><h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><p class="price">' + rub(p.price) + old + '</p></div></article></li>';
  }

  /* ================= КАТАЛОГ ================= */
  var page = document.getElementById('catalog-page');
  if (page) {
    var st = { group: params.get('group') || 'all', cat: params.get('cat') || '', q: (params.get('q') || '').trim().toLowerCase(),
               brand: [], series: [], cls: [], tags: [], min: 0, max: 100000, sort: 'name', show: 9, page: 1 };
    if (!GROUPS[st.group]) st.group = 'all';
    var list = document.getElementById('products'), pager = document.getElementById('pager');
    var found = document.getElementById('found'), empty = document.getElementById('empty');
    var pmin = document.getElementById('price-min'), pmax = document.getElementById('price-max');

    var checked = function (name) {
      return Array.prototype.map.call(page.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
    };
    function filtered() {
      return D.filter(function (p) {
        if (st.group === 'hit' && !p.hit) return false;
        if (st.group === 'sale' && !p.old) return false;
        if (['big', 'kitchen', 'clean', 'climate'].indexOf(st.group) > -1 && p.groups.indexOf(st.group) < 0) return false;
        if (st.cat && p.cat !== st.cat) return false;
        if (st.q && (p.name + ' ' + p.cat + ' ' + p.brand).toLowerCase().indexOf(st.q) < 0) return false;
        if (st.brand.length && st.brand.indexOf(p.brand) < 0) return false;
        if (st.series.length && st.series.indexOf(p.series) < 0) return false;
        if (st.cls.length && st.cls.indexOf(p.cls) < 0) return false;
        if (st.tags.length && !st.tags.every(function (t) { return p.tags.indexOf(t) > -1; })) return false;
        return p.price >= st.min && p.price <= st.max;
      });
    }
    function sorted(a) {
      var s = a.slice();
      if (st.sort === 'asc') s.sort(function (x, y) { return x.price - y.price; });
      else if (st.sort === 'desc') s.sort(function (x, y) { return y.price - x.price; });
      else if (st.sort === 'disc') s.sort(function (x, y) { return (y.old ? 1 - y.price / y.old : 0) - (x.old ? 1 - x.price / x.old : 0); });
      else s.sort(function (x, y) { return x.name.localeCompare(y.name, 'ru'); });
      return s;
    }
    function render() {
      var all = sorted(filtered()), per = st.show, pages = Math.max(1, Math.ceil(all.length / per));
      if (st.page > pages) st.page = pages;
      var slice = all.slice((st.page - 1) * per, st.page * per);
      list.innerHTML = slice.map(card).join('');
      empty.hidden = all.length > 0;
      found.textContent = 'Найдено: ' + all.length;
      var h = '<li><a href="#" data-p="' + Math.max(1, st.page - 1) + '" aria-label="Назад">&lsaquo;</a></li>';
      for (var i = 1; i <= pages; i++) h += '<li><a href="#" data-p="' + i + '"' + (i === st.page ? ' aria-current="page"' : '') + '>' + i + '</a></li>';
      h += '<li><a href="#" data-p="' + Math.min(pages, st.page + 1) + '" aria-label="Вперёд">&rsaquo;</a></li>';
      pager.innerHTML = h;
      pager.parentNode.parentNode.hidden = pages < 2 && st.show < 1000 && all.length <= per ? false : false;
      // заголовок, крошки, активные пункты меню
      var title = st.cat || GROUPS[st.group] || 'Все товары';
      if (st.q) title = 'Поиск: «' + params.get('q') + '»';
      document.querySelector('.page-title h1').textContent = title;
      var bc = document.querySelectorAll('.breadcrumbs li');
      bc[1].innerHTML = '<a href="catalog.html?group=' + st.group + '">' + GROUPS[st.group] + '</a>';
      bc[2].textContent = title;
      document.title = title + ' — ДомТех';
      document.querySelectorAll('#cat-list a').forEach(function (a) {
        a.classList.toggle('on', a.dataset.cat === st.cat);
      });
      document.querySelectorAll('.main-nav a').forEach(function (a) {
        var g = (a.getAttribute('href').match(/group=(\w+)/) || [])[1];
        if (g && g === st.group && !st.cat) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    }
    function read() {
      st.brand = checked('brand'); st.series = checked('series'); st.cls = checked('cls');
      st.tags = Array.prototype.map.call(page.querySelectorAll('[data-tag].on'), function (a) { return a.dataset.tag; });
      st.min = +pmin.value; st.max = +pmax.value; if (st.min > st.max) { var t = st.min; st.min = st.max; st.max = t; }
      st.sort = document.getElementById('sort').value; st.show = +document.getElementById('show').value;
      st.page = 1; render();
    }
    page.addEventListener('change', read);
    pmin.addEventListener('input', read); pmax.addEventListener('input', read);
    document.getElementById('filters').addEventListener('submit', function (e) { e.preventDefault(); });
    page.addEventListener('click', function (e) {
      var tag = e.target.closest('[data-tag]');
      if (tag) { e.preventDefault(); tag.classList.toggle('on'); read(); return; }
      var cat = e.target.closest('#cat-list a');
      if (cat) {
        e.preventDefault(); st.cat = cat.dataset.cat; if (!st.cat) st.group = 'all'; st.q = ''; params.delete('q'); st.page = 1;
        history.replaceState(null, '', st.cat ? '?cat=' + encodeURIComponent(st.cat) : '?group=all'); render(); return;
      }
      var pg = e.target.closest('#pager a');
      if (pg) { e.preventDefault(); st.page = +pg.dataset.p; render(); window.scrollTo({ top: list.offsetTop - 160, behavior: 'smooth' }); return; }
      if (e.target.id === 'show-all') { var sh = document.getElementById('show'); st.show = 1000; st.page = 1; sh.value = '12'; render(); return; }
      if (e.target.id === 'reset' || e.target.id === 'reset2') reset();
    });
    function reset() {
      page.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = false; });
      page.querySelectorAll('[data-tag]').forEach(function (a) { a.classList.remove('on'); });
      pmin.value = 0; pmax.value = 100000; pmin.dispatchEvent(new Event('input'));
      document.getElementById('sort').value = 'name'; document.getElementById('show').value = '9';
      st.group = 'all'; st.cat = ''; st.q = ''; params.delete('q'); history.replaceState(null, '', 'catalog.html?group=all');
      read();
    }
    // поиск из шапки уже на странице каталога
    var sf = document.querySelector('.search');
    if (sf) { sf.addEventListener('submit', function () { /* перенаправление обработает main.js через ?q= */ }); }
    render();
  }

  /* ================= СТРАНИЦА ТОВАРА ================= */
  var pp = document.getElementById('product-page');
  if (pp) {
    var id = +params.get('id') || 1, p = D.filter(function (x) { return x.id === id; })[0];
    if (p) {
      var gr = p.groups[0];
      document.title = p.name + ' — ДомТех';
      document.querySelector('.page-title h1').textContent = p.name;
      var bc2 = document.querySelectorAll('.breadcrumbs li');
      bc2[1].innerHTML = '<a href="catalog.html?cat=' + encodeURIComponent(p.cat) + '">' + esc(p.cat) + '</a>'; bc2[2].textContent = p.name;
      document.querySelector('.card-tab').textContent = p.cat;
      pp.querySelector('h2').textContent = p.name;
      pp.querySelector('.big-price').innerHTML = rub(p.price) + (p.old ? ' <del style="color:#aaa;font-size:14px;font-weight:400">' + rub(p.old) + '</del>' : '');
      pp.querySelector('.desc').textContent = 'Серия «' + p.series + '» от бренда ' + p.brand + '. Класс энергопотребления ' + p.cls + (p.tags.length ? ', особенности: ' + p.tags.join(', ') : '') + '. Официальная гарантия 3 года, бесплатная доставка и установка при заказе от 15 000 ₽.';
      pp.querySelector('.meta').innerHTML = '<div><dt>Бренд: </dt><dd>' + esc(p.brand) + '</dd></div> <div><dt>Класс: </dt><dd>' + esc(p.cls) + '</dd></div> <div><dt>Гарантия: </dt><dd>3 года</dd></div>';
      var im = document.querySelector('.gallery img'); im.onerror = function () { im.onerror = null; im.src = 'img/p-' + p.img + '.svg'; }; im.src = 'img/photos/' + p.id + '.jpg'; im.alt = p.name;
      var rel = D.filter(function (x) { return x.id !== p.id && (x.groups.indexOf(gr) > -1 || x.brand === p.brand); }).slice(0, 4);
      pp.querySelector('.buy-form').addEventListener('submit', function (e) {
        var f = e.currentTarget;
        if (f.checkValidity()) window.DomCart.add(p.id, +f.querySelector('#qty').value || 1);
      });
      document.getElementById('related').innerHTML = '<ul class="products">' + rel.map(card).join('') + '</ul>';
    }
  }

  /* ================= КОРЗИНА ================= */
  var table = document.getElementById('cart-table');
  var order = document.getElementById('order-total');
  function sumCart() {
    var c = window.DomCart.all();
    return Object.keys(c).reduce(function (s, id) {
      var p = D.filter(function (x) { return x.id === +id; })[0];
      return s + (p ? p.price * c[id] : 0);
    }, 0);
  }
  if (order) order.textContent = rub(sumCart());
  if (table) {
    var tbody = table.querySelector('tbody');
    var draw = function () {
      var c = window.DomCart.all(), ids = Object.keys(c), h = '', total = 0;
      ids.forEach(function (id) {
        var p = D.filter(function (x) { return x.id === +id; })[0]; if (!p) return;
        var sub = p.price * c[id]; total += sub;
        h += '<tr data-id="' + p.id + '" data-price="' + p.price + '"><td class="pd"><img src="img/photos/' + p.id + '.jpg" onerror="this.onerror=null;this.src=\'img/p-' + p.img + '.svg\'" alt="' + esc(p.name) + '" width="70" height="74"><div><h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><p>Бренд: <b>' + esc(p.brand) + '</b><br>Гарантия: <b>3 года</b></p></div></td>' +
          '<td data-label="Цена">' + rub(p.price) + '</td><td data-label="Кол-во"><label class="sr-only" for="q' + p.id + '">Количество</label><input id="q' + p.id + '" type="number" min="1" max="10" step="1" value="' + c[id] + '" required></td>' +
          '<td data-label="Доставка">Бесплатно</td><td data-label="Сумма" class="sub">' + rub(sub) + '</td>' +
          '<td data-label=""><button class="remove" type="button" aria-label="Удалить ' + esc(p.name) + '">&#10005;</button></td></tr>';
      });
      tbody.innerHTML = h || '<tr><td colspan="6" class="empty">Корзина пуста. <a href="catalog.html?group=all" style="color:var(--pink)">Перейти в каталог</a></td></tr>';
      document.getElementById('sub-total').textContent = rub(total);
      document.getElementById('grand-total').textContent = rub(total);
      var go = document.getElementById('go-checkout'); if (go) go.style.opacity = total ? '' : '.4';
    };
    table.addEventListener('input', function (e) {
      var v = e.target; if (!v.matches('input[type=number]')) return;
      if (v.value === '') return;
      var q = Math.max(1, Math.min(10, Math.round(+v.value) || 1));
      window.DomCart.set(+v.closest('tr').dataset.id, q);
      var tr = v.closest('tr'); tr.querySelector('.sub').textContent = rub(q * +tr.dataset.price);
      var t = sumCart(); document.getElementById('sub-total').textContent = rub(t); document.getElementById('grand-total').textContent = rub(t);
    });
    table.addEventListener('change', function (e) {
      var v = e.target; if (v.matches('input[type=number]')) v.value = Math.max(1, Math.min(10, Math.round(+v.value) || 1));
    });
    table.addEventListener('click', function (e) {
      var b = e.target.closest('.remove'); if (b) { window.DomCart.remove(+b.closest('tr').dataset.id); draw(); }
    });
    document.getElementById('clear-cart').addEventListener('click', function () { window.DomCart.clear(); draw(); });
    var go2 = document.getElementById('go-checkout');
    if (go2) go2.addEventListener('click', function (e) { if (!sumCart()) e.preventDefault(); });
    draw();
  }
})();
