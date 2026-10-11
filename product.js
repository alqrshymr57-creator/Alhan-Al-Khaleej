/* صفحة تفاصيل المنتج: تقرأ البيانات الحية من الخادم، وتعود إلى data.js عند تعذّر الاتصال */
(function () {
  "use strict";

  var C = window.SITE_CONFIG || { products: [], artists: [], menu: { shilat: [], zaffat: [] } };
  var main = document.getElementById("pp-main");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return Number(n || 0).toLocaleString("en-US") + " ر.س"; }
  function catLabel(id) {
    var all = ((C.menu && C.menu.shilat) || []).concat((C.menu && C.menu.zaffat) || []);
    var f = all.filter(function (x) { return x.id === id; })[0];
    return f ? f.label : "";
  }
  function artistOf(id) {
    return (C.artists || []).filter(function (a) { return a.id === id; })[0];
  }
  function setMeta(name, value) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute("content", value);
  }

  function render() {
    var id = new URLSearchParams(location.search).get("id");
    var list = C.products || [];
    var p = list.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      main.innerHTML = '<div class="pp-empty"><h1>هذا المنتج غير متوفر</h1><p class="muted">ربما أُزيل من المتجر. تصفّح المنتجات الأخرى.</p>' +
        '<a class="btn btn-dark" href="index.html#catalog">تصفح المتجر</a></div>';
      return;
    }
    var a = artistOf(p.artist);
    var label = catLabel(p.cat);
    document.title = p.title + " | ألحان الخليج";
    setMeta("description", p.title + " بسعر " + money(p.price) + ". اطلب بأسماء أحبتك مع ألحان الخليج.");

    var media = p.img
      ? '<figure class="pp-media"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" /></figure>'
      : '<figure class="pp-media pp-media-empty" aria-hidden="true"></figure>';

    var similar = list.filter(function (x) { return x.id !== p.id && (x.cat === p.cat || x.artist === p.artist); }).slice(0, 4);
    var rail = similar.map(function (s) {
      return '<a class="pp-card" href="product.html?id=' + encodeURIComponent(s.id) + '">' +
        (s.img ? '<img src="' + esc(s.img) + '" alt="" loading="lazy" />' : '<span class="pp-card-empty" aria-hidden="true"></span>') +
        '<strong>' + esc(s.title) + '</strong><span>' + money(s.price) + '</span></a>';
    }).join("");

    main.innerHTML =
      '<nav class="crumbs" aria-label="مسار التصفح"><a href="index.html">الرئيسية</a> / <a href="index.html#catalog">المتجر</a> / <span>' + esc(p.title) + '</span></nav>' +
      '<div class="pp-grid">' + media +
        '<div class="pp-info">' +
          (label ? '<span class="pp-cat">' + esc(label) + '</span>' : '') +
          '<h1>' + esc(p.title) + '</h1>' +
          (a ? '<p class="pp-artist">أداء: ' + esc(a.name) + '</p>' : '') +
          '<p class="pp-price">' + money(p.price) + '</p>' +
          (p.duration ? '<p class="pp-meta">المدة: ' + esc(p.duration) + '</p>' : '') +
          '<p class="pp-desc">شيلة أو زفة بأداء احترافي. اكتب الأسماء عند الطلب، وسيُنفَّذ بنفس الأداء واللحن.</p>' +
          '<div class="pp-actions">' +
            '<a class="btn btn-dark" href="index.html?add=' + encodeURIComponent(p.id) + '">أضف للسلة</a>' +
            '<a class="btn btn-outline" href="index.html?like=' + encodeURIComponent(p.id) + '#builder">اطلب بأسمائي</a>' +
          '</div>' +
          '<p class="muted pp-note">مدة التسليم وطريقة الدفع تظهر في ملخص الطلب قبل إرساله.</p>' +
        '</div>' +
      '</div>' +
      (similar.length ? '<section class="pp-similar"><h2>منتجات مشابهة</h2><div class="pp-rail">' + rail + '</div></section>' : '');
  }

  function load() {
    if (typeof fetch !== "function") return Promise.resolve();
    return fetch("/api/content", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      if (Array.isArray(d.products)) C.products = d.products;
      if (Array.isArray(d.artists)) C.artists = d.artists;
      if (d.menu) C.menu = d.menu;
    }).catch(function () {});
  }

  load().then(render, render);
})();
