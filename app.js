/* ===================================================
   ألحان الخليج — منطق الموقع
   يعتمد على data.js فقط، بدون مكتبات خارجية.
   =================================================== */
(function () {
  "use strict";

  var C = window.SITE_CONFIG;
  if (!C) { console.error("ملف data.js غير محمّل"); return; }

  /* ---------- أيقونات SVG (بدون رموز تعبيرية) ---------- */
  var ICON = {
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.1C1 8.9 3 5.5 6.5 5.5c2 0 3.5 1.2 5.5 3.2 2-2 3.5-3.2 5.5-3.2 3.5 0 5.5 3.4 4.1 6.4C19.5 16.4 12 21 12 21z"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    starOff: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    wave: '<svg class="wave-svg" viewBox="0 0 120 40" width="120" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 20v0M18 12v16M30 6v28M42 14v12M54 3v34M66 10v20M78 6v28M90 13v14M102 9v22M114 19v2"/></svg>'
  };

  /* ---------- أدوات مساعدة ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) { return Number(n).toLocaleString("en-US") + " " + C.brand.currency; };
  var num = function (n) { return Number(n).toLocaleString("en-US"); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  var labelOf = function (list, id) { var x = byId(list, id); return x ? (x.label || x.name) : ""; };
  var ALL_CATS = [];
  C.menu.shilat.concat(C.menu.zaffat, C.menu.tunes).forEach(function (c) { ALL_CATS.push(c); });
  var catLabel = function (id) { var c = byId(ALL_CATS, id); return c ? c.label : ""; };
  var artistOf = function (id) { return byId(C.artists, id); };
  var toast = function (text) {
    var old = $(".toast"); if (old) old.remove();
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500);
  };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* تجاهل */ } }
  };

  /* ---------- العلامة والروابط ---------- */
  function fillBrand() {
    $$("[data-currency]").forEach(function (el) { el.textContent = C.brand.currency; });
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    var wa = "https://wa.me/" + C.whatsapp;
    $("#contactWa").href = wa;
    $("#waFloat").href = wa;
    $("#contactPhone").textContent = "+" + C.whatsapp;
    renderSocial();
    document.title = C.brand.name + " | زفات وشيلات مخصصة بأسمائكم";
    setMeta("og:url", location.origin + "/");
    setMeta("og:image", location.origin + "/assets/hero.jpg");
    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = location.origin + "/";
  }

  var SOCIAL_LABEL = { instagram: "إنستغرام", tiktok: "تيك توك", snapchat: "سناب شات", youtube: "يوتيوب", x: "منصة X", facebook: "فيسبوك" };
  function renderSocial() {
    var box = $("#socialLinks"); if (!box) return;
    var links = Object.keys(SOCIAL_LABEL).filter(function (k) { return C.social && /^https?:\/\//i.test(C.social[k] || ""); });
    box.innerHTML = links.map(function (k) {
      return '<a href="' + esc(C.social[k]) + '" target="_blank" rel="noopener" aria-label="' + SOCIAL_LABEL[k] + '">' + SOCIAL_LABEL[k] + '</a>';
    }).join("");
    box.hidden = !links.length;
  }

  function setMeta(prop, value) {
    var el = document.querySelector('meta[property="' + prop + '"]');
    if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
    el.setAttribute("content", value);
  }

  /* ---------- القائمة الجانبية والقوائم المنسدلة ---------- */
  function renderMenus() {
    function items(list) {
      return list.map(function (c) { return '<a href="#catalog" data-cat="' + c.id + '">' + esc(c.label) + '</a>'; }).join("");
    }
    $('[data-menu="shilat"]').innerHTML = items(C.menu.shilat);
    $('[data-menu="zaffat"]').innerHTML = items(C.menu.zaffat);
    $('[data-menu="tunes"]').innerHTML = items(C.menu.tunes);

    $("#catalogCat").innerHTML = '<option value="">كل التصنيفات</option>' +
      ALL_CATS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.label) + '</option>'; }).join("");

    $$(".dropdown-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var dd = btn.parentElement, open = !dd.classList.contains("open");
        $$(".dropdown").forEach(function (d) { d.classList.remove("open"); });
        $$(".dropdown-btn").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
        if (open) { dd.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
      });
    });
    document.addEventListener("click", function () {
      $$(".dropdown").forEach(function (d) { d.classList.remove("open"); });
      $$(".dropdown-btn").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    });

    $$("[data-menu]").forEach(function (m) {
      m.addEventListener("click", function (e) {
        var a = e.target.closest("[data-cat]");
        if (!a) return;
        e.stopPropagation();
        setCatFilter(a.getAttribute("data-cat"));
        closeMobileMenu();
      });
    });

    // قائمة الجوال
    var btn = $("#menuToggle"), nav = $("#nav");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    });
    $$("#nav > a").forEach(function (a) { a.addEventListener("click", closeMobileMenu); });
  }
  function closeMobileMenu() {
    var nav = $("#nav"), btn = $("#menuToggle");
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "فتح القائمة");
  }

  /* ---------- الشرائح ---------- */
  var slideIndex = 0, slideTimer = null;
  function renderSlider() {
    $("#slides").innerHTML = C.slides.map(function (s, i) {
      return '<div class="slide' + (i === 0 ? ' active' : '') + '" style="--slide-img:url(\'' + s.img + '\')" role="group" aria-roledescription="شريحة" aria-label="' + (i + 1) + ' من ' + C.slides.length + '">' +
        '<div class="slide-content"><h1>' + esc(s.title) + '</h1><p>' + esc(s.sub) + '</p>' +
        '<a class="btn btn-light" href="' + esc(s.target) + '">' + esc(s.cta) + '</a></div></div>';
    }).join("");
    $("#dots").innerHTML = C.slides.map(function (s, i) {
      return '<button type="button" data-dot="' + i + '" aria-label="الشريحة ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
    }).join("");
    $("#slidePrev").addEventListener("click", function () { goSlide(slideIndex - 1); restartSlider(); });
    $("#slideNext").addEventListener("click", function () { goSlide(slideIndex + 1); restartSlider(); });
    $("#dots").addEventListener("click", function (e) {
      var b = e.target.closest("[data-dot]"); if (!b) return;
      goSlide(Number(b.getAttribute("data-dot"))); restartSlider();
    });
    restartSlider();
  }
  function goSlide(i) {
    var n = C.slides.length;
    slideIndex = (i + n) % n;
    $$(".slide").forEach(function (s, k) { s.classList.toggle("active", k === slideIndex); });
    $$("#dots button").forEach(function (b, k) { b.setAttribute("aria-current", k === slideIndex ? "true" : "false"); });
  }
  function restartSlider() {
    clearInterval(slideTimer);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    slideTimer = setInterval(function () { goSlide(slideIndex + 1); }, 6000);
  }

  /* ---------- روابط سريعة ---------- */
  function renderQuick() {
    var counts = {};
    C.products.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
    $("#quickList").innerHTML = C.menu.shilat.concat(C.menu.zaffat).slice(0, 8).map(function (c) {
      if (!counts[c.id]) return ""; // التصنيفات الفارغة لا تظهر، وبدون أرقام
      return '<a href="#catalog" data-cat="' + c.id + '">' + esc(c.label) + '</a>';
    }).join("");
    $("#quickList").addEventListener("click", function (e) {
      var a = e.target.closest("[data-cat]"); if (!a) return;
      setCatFilter(a.getAttribute("data-cat"));
    });
  }

  /* ---------- المناسبات ---------- */
  var PLAIN_OCC = {};
  function renderCategories() {
    $("#catGrid").innerHTML = C.occasions.map(function (o) {
      var cls = "cat-card" + (o.img ? " has-img" : " plain");
      var style = o.img ? ' style="background-image:url(\'' + o.img + '\')"' : '';
      return '<button type="button" class="' + cls + '" data-occasion="' + o.id + '"' + style + '>' +
        '<strong>' + esc(o.label) + '</strong><small>اطلب الآن ←</small></button>';
    }).join("");
    $("#catGrid").addEventListener("click", function (e) {
      var card = e.target.closest("[data-occasion]"); if (!card) return;
      selectOccasion(card.getAttribute("data-occasion"));
      goToStep(1);
      $("#builder").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- الفنانون ---------- */
  var ARTIST_PREVIEW = 8, artistsExpanded = false, artistsBound = false;
  function artistCard(a) {
    return '<button type="button" class="artist" data-artist="' + esc(a.id) + '" aria-label="عرض منتجات ' + esc(a.name) + '">' +
      '<span class="artist-avatar" aria-hidden="true">' + (a.photo ? '<img src="' + esc(a.photo) + '" alt="" loading="lazy" />' : esc(a.initials || a.name.charAt(0))) + '</span>' +
      '<span class="name">' + esc(a.name) + '</span></button>';
  }
  function renderArtists() {
    var all = C.artists || [];
    var featured = all.filter(function (a) { return a.featured; });
    var rest = featured.length ? all.filter(function (a) { return !a.featured; }) : all;
    $("#artistFeaturedWrap").hidden = !featured.length;
    $("#artistFeatured").innerHTML = featured.map(artistCard).join("");
    $("#artistAllTitle").hidden = !featured.length;
    var shown = artistsExpanded ? rest : rest.slice(0, ARTIST_PREVIEW);
    $("#artistGrid").innerHTML = shown.map(artistCard).join("") || '<p class="empty">لا يوجد منشدون بعد.</p>';
    var more = $("#artistMore");
    more.hidden = rest.length <= ARTIST_PREVIEW;
    more.textContent = artistsExpanded ? "عرض أقل" : "المزيد من الأصوات";
    more.setAttribute("aria-expanded", String(artistsExpanded));
    if (artistsBound) return;
    artistsBound = true;
    $("#artists").addEventListener("click", function (e) {
      if (e.target.closest("#artistMore")) { artistsExpanded = !artistsExpanded; renderArtists(); return; }
      var b = e.target.closest("[data-artist]"); if (!b) return;
      state.artist = b.getAttribute("data-artist");
      state.cat = "";
      $("#catalogCat").value = "";
      renderCatalog();
      $("#catalog").scrollIntoView({ behavior: "smooth" });
      var art = artistOf(state.artist);
      toast("يعرض الآن منتجات " + (art ? art.name : ""));
    });
  }

  /* ---------- بطاقة المنتج ---------- */
  function productTags(p) {
    // أولوية الشارات: الأكثر طلباً > جديد > حصري > قابل للتعديل، ولا تُعرض أكثر من شارتين
    var t = [];
    if (p.tags.indexOf("الأكثر طلباً") !== -1) t.push('<span class="tag best">الأكثر طلباً</span>');
    if (p.isNew) t.push('<span class="tag new">جديد</span>');
    if (p.tags.indexOf("حصري") !== -1) t.push('<span class="tag exclusive">حصري</span>');
    if (p.tags.indexOf("قابل للتعديل") !== -1) t.push('<span class="tag edit">قابل للتعديل</span>');
    t = t.slice(0, 2);
    return t.length ? '<div class="tag-row">' + t.join("") + '</div>' : "";
  }
  function discountOf(p) { return p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }
  function productCard(p) {
    var d = discountOf(p), a = artistOf(p.artist);
    return '<article class="product-card">' +
      '<div class="product-thumb' + (p.img ? ' has-img' : '') + '"' + (p.img ? ' style="background-image:url(\'' + esc(p.img) + '\')"' : '') + ' data-open="' + p.id + '" role="button" tabindex="0" aria-label="معاينة ' + esc(p.title) + '">' +
        '<span class="play" aria-hidden="true">' + ICON.play + '</span>' +
        '<span class="dur">' + esc(p.duration) + '</span>' +
      '</div>' +
      '<div class="product-body">' +
        productTags(p) +
        '<h3 class="product-title" data-open="' + p.id + '">' + esc(p.title) + '</h3>' +
        '<p class="product-artist">أداء: ' + esc(a ? a.name : "") + '</p>' +
        '<div class="price-row"><span class="price">' + money(p.price) + '</span></div>' +
        '<div class="product-actions">' +
          '<button type="button" class="btn btn-dark" data-add="' + p.id + '">أضف للسلة</button>' +
          '<button type="button" class="btn btn-outline" data-like="' + p.id + '">اطلب بأسمائي</button>' +
        '</div>' +
      '</div></article>';
  }
  function renderRails() {
    var newest = C.products.filter(function (p) { return p.isNew; });
    if (newest.length < 4) newest = C.products.slice(0, 4);
    $("#newRail").innerHTML = newest.slice(0, 4).map(productCard).join("");
    var best = C.products.slice().sort(function (a, b) { return b.sales - a.sales; }).slice(0, 4);
    $("#bestRail").innerHTML = best.map(productCard).join("");
  }

  /* ---------- الكتالوج ---------- */
  var state = { cat: "", artist: "", q: "", sort: "popular" };
  function filteredProducts() {
    var list = C.products.filter(function (p) {
      if (state.cat && p.cat !== state.cat) return false;
      if (state.artist && p.artist !== state.artist) return false;
      if (state.q) {
        var hay = (p.title + " " + catLabel(p.cat) + " " + (artistOf(p.artist) || {}).name).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
    if (state.sort === "priceAsc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "priceDesc") list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "new") list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });
    else list.sort(function (a, b) { return b.sales - a.sales; });
    return list;
  }
  function renderCatalog() {
    var list = filteredProducts();
    $("#productGrid").innerHTML = list.length ? list.map(productCard).join("") :
      '<p class="empty">لا توجد منتجات تطابق بحثك. جرّب تصنيفاً آخر، أو اطلب شيلة مخصصة من نموذج الطلب.</p>';
    var extra = state.artist ? " · " + (artistOf(state.artist) || {}).name : "";
    $("#resultCount").textContent = "عدد النتائج: " + num(list.length) + extra;
  }
  function setCatFilter(id) {
    state.cat = id; state.artist = "";
    $("#catalogCat").value = id;
    renderCatalog();
    var el = document.getElementById("catalog"); if (el) el.scrollIntoView({ behavior: "smooth" });
  }
  function setupCatalog() {
    $("#catalogSearch").addEventListener("input", function (e) { state.q = e.target.value.trim(); renderCatalog(); });
    $("#catalogCat").addEventListener("change", function (e) { state.cat = e.target.value; state.artist = ""; renderCatalog(); });
    $("#catalogSort").addEventListener("change", function (e) { state.sort = e.target.value; renderCatalog(); });
  }

  /* ---------- أحداث المنتجات (معاينة / سلة / طلب مثلها) ---------- */
  function setupProductEvents() {
    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) { addToCart(add.getAttribute("data-add"), 1); return; }
      var like = e.target.closest("[data-like]");
      if (like) { orderLike(like.getAttribute("data-like")); return; }
      var open = e.target.closest("[data-open]");
      if (open) {
        if (open.closest("#searchOverlay")) closeOverlay("searchOverlay");
        openProduct(open.getAttribute("data-open"));
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.matches && e.target.matches("[data-open]")) openProduct(e.target.getAttribute("data-open"));
    });
  }

  function occasionFromCat(cat) {
    var map = {
      "zaffa-groom": "wedding-groom", "shilat-groom": "wedding-groom", "shilat-wedding": "wedding-groom",
      "zaffa-bride": "wedding-bride", "shilat-bride": "wedding-bride",
      "zaffa-mother": "mother-bride", "koshah": "koshah", "talla": "talla",
      "shilat-grad-girls": "graduation", "shilat-grad-boys": "graduation",
      "zaffa-birth": "birth", "shilat-birth": "birth", "shilat-retire": "retirement"
    };
    return map[cat] || "other";
  }
  function orderLike(pid) {
    var p = byId(C.products, pid); if (!p) return;
    selectOccasion(occasionFromCat(p.cat));
    goToStep(1);
    $("#builder").scrollIntoView({ behavior: "smooth" });
    toast("تم تجهيز نموذج الطلب على نمط: " + p.title);
  }

  /* ---------- نافذة تفاصيل المنتج ---------- */
  var lastFocus = null;
  function openOverlay(id) { lastFocus = document.activeElement; var o = $("#" + id); o.hidden = false; var f = o.querySelector("input,button"); if (f) f.focus(); }
  function closeOverlay(id) { var o = $("#" + id); if (o) o.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function openProduct(pid) {
    var p = byId(C.products, pid); if (!p) return;
    location.href = "product.html?id=" + encodeURIComponent(p.id); return; // صفحة منتج منفصلة
    var a = artistOf(p.artist), d = discountOf(p);
    var similar = C.products.filter(function (x) { return x.id !== p.id && (x.cat === p.cat || x.artist === p.artist); }).slice(0, 3);
    $("#productPanel").innerHTML =
      '<button class="close-btn" data-close="productOverlay" aria-label="إغلاق">' + ICON.close + '</button>' +
      '<div class="big-play"><span class="play" aria-hidden="true">' + ICON.play + '</span><small>المعاينة الكاملة بعد الطلب · ' + esc(p.duration) + '</small></div>' +
      productTags(p) +
      '<h2 style="font-size:1.8rem;margin:8px 0 4px">' + esc(p.title) + '</h2>' +
      '<p class="product-artist">أداء: ' + esc(a ? a.name : "") + ' · ' + esc(catLabel(p.cat)) + '</p>' +
      '<p class="desc">شيلة أو زفة بأداء احترافي. اكتب الأسماء لاحقاً عند الطلب، وسيتم التنفيذ بنفس الأداء واللحن.</p>' +
      '<div class="price-row"><span class="price" style="font-size:1.6rem">' + money(p.price) + '</span>' +
        (p.oldPrice > p.price ? '<span class="old-price">' + money(p.oldPrice) + '</span>' : '') +
        (d ? '<span class="disc" style="position:static">-' + d + '%</span>' : '') + '</div>' +
      '<div class="product-actions">' +
        '<button type="button" class="btn btn-dark" data-add="' + p.id + '" data-close-after="productOverlay">أضف للسلة</button>' +
        '<button type="button" class="btn btn-outline" data-like="' + p.id + '" data-close-after="productOverlay">اطلب بأسمائي</button>' +
      '</div>' +
      (similar.length ? '<h3 style="margin-top:22px">منتجات مشابهة</h3><div class="product-rail" style="grid-template-columns:1fr 1fr">' +
        similar.map(function (s) { return '<button type="button" class="search-item" data-open="' + s.id + '"><span>' + esc(s.title) + '</span><strong>' + money(s.price) + '</strong></button>'; }).join("") + '</div>' : '');
    openOverlay("productOverlay");
  }

  /* ---------- البحث ---------- */
  function renderSearch(q) {
    var t = (q || "").trim().toLowerCase();
    var res = !t ? [] : C.products.filter(function (p) {
      return (p.title + " " + catLabel(p.cat) + " " + ((artistOf(p.artist) || {}).name || "")).toLowerCase().indexOf(t) !== -1;
    });
    $("#searchResults").innerHTML = !t ? '<p class="muted">ابدأ بالكتابة لعرض النتائج.</p>' :
      (res.length ? res.map(function (p) {
        return '<button type="button" class="search-item" data-open="' + p.id + '"><span>' + esc(p.title) + '</span><strong>' + money(p.price) + '</strong></button>';
      }).join("") : '<p class="muted">لا توجد نتائج. جرّب كلمة أخرى.</p>');
  }
  function setupSearch() {
    $("#searchBtn").addEventListener("click", function () { renderSearch(""); $("#searchInput").value = ""; openOverlay("searchOverlay"); });
    $("#searchInput").addEventListener("input", function (e) { renderSearch(e.target.value); });
  }

  /* ---------- السلة ---------- */
  function getCart() { return store.get("nh_cart", []); }
  function saveCart(c) { store.set("nh_cart", c); renderCart(); }
  function addToCart(pid, qty) {
    var c = getCart(), found = null;
    c.forEach(function (x) { if (x.id === pid) found = x; });
    if (found) found.qty += qty; else c.push({ id: pid, qty: qty });
    saveCart(c);
    var p = byId(C.products, pid);
    toast("أُضيفت للسلة: " + (p ? p.title : ""));
    closeOverlay("productOverlay");
  }
  function cartTotal(c) {
    return c.reduce(function (s, x) { var p = byId(C.products, x.id); return s + (p ? p.price * x.qty : 0); }, 0);
  }
  function renderCart() {
    var c = getCart().filter(function (x) { return byId(C.products, x.id); });
    var count = c.reduce(function (s, x) { return s + x.qty; }, 0);
    $("#cartCount").textContent = count;
    $("#cartTotal").textContent = num(cartTotal(c));
    $("#cartItems").innerHTML = c.length ? c.map(function (x) {
      var p = byId(C.products, x.id);
      return '<div class="cart-item"><div><strong>' + esc(p.title) + '</strong><small>' + money(p.price) + '</small></div>' +
        '<div style="display:grid;gap:6px;justify-items:end"><div class="qty">' +
        '<button type="button" data-qty="-1" data-id="' + p.id + '" aria-label="إنقاص">−</button><span>' + x.qty + '</span>' +
        '<button type="button" data-qty="1" data-id="' + p.id + '" aria-label="زيادة">+</button></div>' +
        '<button type="button" class="remove-link" data-remove="' + p.id + '">إزالة</button></div></div>';
    }).join("") : '<p class="muted">السلة فارغة. أضف شيلة أو زفة من المتجر.</p>';
  }
  function setupCart() {
    $("#cartBtn").addEventListener("click", function () { renderCart(); openOverlay("cartOverlay"); });
    $("#cartItems").addEventListener("click", function (e) {
      var q = e.target.closest("[data-qty]"), r = e.target.closest("[data-remove]");
      var c = getCart();
      if (q) {
        var id = q.getAttribute("data-id"), delta = Number(q.getAttribute("data-qty"));
        c.forEach(function (x) { if (x.id === id) x.qty += delta; });
        saveCart(c.filter(function (x) { return x.qty > 0; }));
      } else if (r) {
        saveCart(c.filter(function (x) { return x.id !== r.getAttribute("data-remove"); }));
      }
    });
    $("#clearCartBtn").addEventListener("click", function () { saveCart([]); });
    $("#checkoutBtn").addEventListener("click", function () {
      var c = getCart().filter(function (x) { return byId(C.products, x.id); });
      if (!c.length) { toast("السلة فارغة"); return; }
      var lines = ["*طلب شراء من ألحان الخليج*", ""];
      c.forEach(function (x) {
        var p = byId(C.products, x.id);
        lines.push("• " + p.title + " × " + x.qty + " = " + money(p.price * x.qty));
      });
      lines.push("", "*الإجمالي:* " + money(cartTotal(c)));
      lines.push("", "يرجى تزويدي بالأسماء المطلوب ذكرها داخل الشيلة/الزفة.");
      var total = cartTotal(c);
      var win = window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(lines.join("\n")), "_blank");
      if (win) { try { win.opener = null; } catch (err) { /* تجاهل */ } }
      api("/api/orders", { method: "POST", timeout: 8000, body: {
        kind: "cart", total: total,
        items: c.map(function (x) { return { id: x.id, qty: x.qty }; })
      } }).then(function (d) { toast("تم حفظ طلب السلة برقم " + d.id); })
        .catch(function () { toast("تم فتح واتساب لإرسال الطلب، لكن تعذّر حفظه على الخادم"); });
    });
  }

  /* ---------- الباقات ---------- */
  function renderPackages() {
    $("#pkgGrid").innerHTML = C.packages.map(function (p) {
      return '<article class="pkg' + (p.popular ? ' popular' : '') + '">' +
        (p.popular ? '<span class="badge">الأكثر طلباً</span>' : '') +
        '<h3 class="pkg-name">' + esc(p.name) + '</h3>' +
        '<p class="pkg-desc">' + esc(p.desc) + '</p>' +
        '<div class="pkg-price">' + num(p.price) + ' <small>' + C.brand.currency + '</small></div>' +
        '<ul>' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul>' +
        '<button type="button" class="btn ' + (p.popular ? 'btn-light' : 'btn-dark') + '" data-pkg="' + p.id + '">اختر ' + esc(p.name) + '</button>' +
        '</article>';
    }).join("");
    $("#pkgGrid").addEventListener("click", function (e) {
      var b = e.target.closest("[data-pkg]"); if (!b) return;
      selectPackage(b.getAttribute("data-pkg"));
      goToStep(3);
      $("#builder").scrollIntoView({ behavior: "smooth" });
    });
  }

  var RATING_TEXT = { 5: "ممتاز", 4: "جيد جداً", 3: "جيد", 2: "مقبول", 1: "ضعيف" };
  function reviewCard(r) {
    var stars = new Array(r.stars + 1).join(ICON.star) + new Array(6 - r.stars).join(ICON.starOff);
    return '<figure class="review"><div class="stars" aria-label="' + r.stars + ' من 5">' + stars + '</div>' +
      '<p>' + esc(r.text) + '</p>' +
      '<figcaption><strong>' + esc(r.name) + '</strong>' + (r.role ? ' · ' + esc(r.role) : '') +
      (r.verified ? ' <span class="verified">طلب موثّق</span>' : '') + '</figcaption></figure>';
  }
  function renderReviews() {
    var list = C.reviews || [], st = C.reviewStats || { count: list.length, average: 0 };
    $("#reviewSummary").textContent = list.length ? "متوسط التقييم " + st.average + " من 5 · " + num(st.count) + " تقييم منشور" : "";
    $("#reviewGrid").innerHTML = list.map(reviewCard).join("");
    $("#reviewGrid").hidden = list.length === 0;
  }
  function setupReviewToggle() {
    var btn = $("#reviewToggle"), wrap = $("#reviewFormWrap");
    if (!btn || !wrap) return;
    btn.addEventListener("click", function () {
      var open = wrap.hidden;
      wrap.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "إغلاق النموذج" : "اكتب تقييمك";
      if (open) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  // زر واتساب العائم يختفي أثناء وجود قسم الطلب في الشاشة حتى لا يغطي الحقول
  function setupWaFloat() {
    var fab = $("#waFloat"), builder = $("#builder");
    if (!fab || !builder || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { document.body.classList.toggle("wa-hidden", en.isIntersecting); });
    }, { threshold: 0.15 }).observe(builder);
  }
  function setupReviewForm() {
    $("#ratingOptions").innerHTML = [5, 4, 3, 2, 1].map(function (n) {
      return '<label class="rating-opt"><input type="radio" name="rating" value="' + n + '" /><span>' + n + ' ' + (n === 1 ? 'نجمة' : 'نجوم') + ' · ' + RATING_TEXT[n] + '</span></label>';
    }).join("");
    $("#reviewForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget, btn = $("#reviewSubmit"), st = $("#reviewStatus");
      $$("#reviewForm [data-error-for]").forEach(function (el) { el.textContent = ""; });
      var checked = f.querySelector('input[name="rating"]:checked');
      var v = {
        name: f.elements.name.value.trim(), role: f.elements.role.value.trim(),
        orderId: f.elements.orderId.value.trim().toUpperCase(), text: f.elements.text.value.trim(),
        website: f.elements.website.value, rating: checked ? Number(checked.value) : 0
      };
      var errs = {};
      if (v.name.length < 2) errs.name = "أدخل اسمك (حرفان على الأقل)";
      if (!v.rating) errs.rating = "اختر عدد النجوم";
      if (v.orderId && !/^NH-[A-Z0-9]{6,12}$/.test(v.orderId)) errs.orderId = "صيغة رقم الطلب: NH-XXXXXXXX";
      if (v.text.length < 10) errs.text = "اكتب تقييمك بتفصيل أكثر (10 أحرف على الأقل)";
      Object.keys(errs).forEach(function (k) { var el = $('[data-error-for="' + k + '"]'); if (el) el.textContent = errs[k]; });
      if (Object.keys(errs).length) { st.className = "form-status error"; st.textContent = "يرجى تصحيح الحقول المعلّمة"; return; }
      btn.disabled = true; st.className = "form-status"; st.textContent = "جارٍ إرسال تقييمك...";
      api("/api/reviews", { method: "POST", body: v, timeout: 8000 }).then(function () {
        f.reset(); st.className = "form-status ok";
        st.textContent = "شكراً لك! استلمنا تقييمك، وسيظهر في الموقع بعد اعتماده.";
      }).catch(function (err) {
        st.className = "form-status error";
        st.textContent = (err instanceof TypeError) ? "تعذّر الاتصال بالخادم. حاول مرة أخرى بعد قليل." : (err.message || "تعذّر إرسال التقييم");
      }).then(function () { btn.disabled = false; });
    });
  }

  function renderFaq() {
    $("#faqList").innerHTML = C.faqs.map(function (f, i) {
      return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    }).join("");
  }

  /* ---------- نموذج الطلب ---------- */
  var currentStep = 1, TOTAL_STEPS = 5;
  function renderChoices() {
    $("#occasionChoices").innerHTML = C.occasions.map(function (o) {
      return '<label class="choice"><input type="radio" name="occasion" value="' + o.id + '" /><span>' + esc(o.label) + '</span></label>';
    }).join("");
    $("#packageChoices").innerHTML = C.packages.map(function (p) {
      return '<label class="choice"><input type="radio" name="package" value="' + p.id + '" /><span><strong>' + esc(p.name) + '</strong><small>' + money(p.price) + '</small></span></label>';
    }).join("");
    $("#addonList").innerHTML = C.addons.map(function (a) {
      return '<label class="check"><span class="label-main"><input type="checkbox" name="addons" value="' + a.id + '" /> ' + esc(a.label) + '</span><span class="price">+' + money(a.price) + '</span></label>';
    }).join("");
  }
  function selectOccasion(id) { var r = $('input[name="occasion"][value="' + id + '"]'); if (r) r.checked = true; updateSummary(); }
  function selectPackage(id) { var r = $('input[name="package"][value="' + id + '"]'); if (r) r.checked = true; updateSummary(); }

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, n));
    $("#progressBar").style.width = (currentStep / TOTAL_STEPS * 100) + "%";
    $("#stepLabel").textContent = "الخطوة " + currentStep + " من " + TOTAL_STEPS;
    $$(".step").forEach(function (s) { s.hidden = Number(s.getAttribute("data-step")) !== currentStep; });
    $("#prevBtn").hidden = currentStep === 1;
    $("#nextBtn").hidden = currentStep === TOTAL_STEPS;
    $("#submitBtn").hidden = currentStep !== TOTAL_STEPS;
    $("#formStatus").textContent = ""; $("#formStatus").className = "form-status";
  }
  function setError(name, msg) {
    var el = $('[data-error-for="' + name + '"]');
    var input = $('[name="' + name + '"]') || $("#" + name);
    if (el) el.textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function clearErrors() {
    $$("[data-error-for]").forEach(function (el) { el.textContent = ""; });
    $$("[aria-invalid]").forEach(function (el) { el.setAttribute("aria-invalid", "false"); });
  }
  function isValidPhone(p) { return /^\+?\d{8,15}$/.test(String(p || "").replace(/[\s\-()]/g, "")); }
  function getValues() {
    var pkgEl = $('input[name="package"]:checked'), occEl = $('input[name="occasion"]:checked');
    return {
      occasion: occEl ? occEl.value : "", names: $("#names").value || "", names2: $("#names2").value.trim(),
      notes: $("#notes").value.trim(), eventDate: $("#eventDate").value, duration: $("#duration").value,
      pkg: pkgEl ? pkgEl.value : "", addons: $$('input[name="addons"]:checked').map(function (x) { return x.value; }),
      customerName: $("#customerName").value.trim(), phone: $("#phone").value.trim(), email: $("#email").value.trim(),
      agree: $("#agree").checked
    };
  }
  function validateStep(step) {
    var ok = true, v = getValues();
    if (step === 1) { if (!v.occasion) { setError("occasion", "يرجى اختيار المناسبة"); ok = false; } else setError("occasion", ""); }
    if (step === 2) {
      if (v.names.trim().length < 2) { setError("names", "أدخل الاسم بوضوح (حرفان على الأقل)"); ok = false; } else setError("names", "");
      if (v.eventDate) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (new Date(v.eventDate + "T00:00:00") < today) {
          ok = false; $("#eventDate").setAttribute("aria-invalid", "true");
          $("#formStatus").textContent = "تاريخ المناسبة لا يمكن أن يكون في الماضي"; $("#formStatus").className = "form-status error";
        } else $("#eventDate").setAttribute("aria-invalid", "false");
      }
    }
    if (step === 3) { if (!v.pkg) { setError("package", "يرجى اختيار الباقة"); ok = false; } else setError("package", ""); }
    if (step === 5) {
      if (v.customerName.length < 3) { setError("customerName", "أدخل اسمك الكامل"); ok = false; } else setError("customerName", "");
      if (!isValidPhone(v.phone)) { setError("phone", "أدخل رقم جوال صحيح (8 إلى 15 رقماً)"); ok = false; } else setError("phone", "");
      if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { setError("email", "البريد الإلكتروني غير صحيح"); ok = false; } else setError("email", "");
      if (!v.agree) { setError("agree", "يجب الموافقة على الشروط للمتابعة"); ok = false; } else setError("agree", "");
    }
    return ok;
  }
  function calcTotal(v) {
    var pkg = byId(C.packages, v.pkg), addons = 0;
    v.addons.forEach(function (id) { var a = byId(C.addons, id); if (a) addons += a.price; });
    return { pkg: pkg, addons: addons, total: (pkg ? pkg.price : 0) + addons };
  }
  function deliveryHours(v) { return v.addons.indexOf("express") !== -1 ? C.deliveryHours.express : C.deliveryHours.standard; }
  function updateSummary() {
    var v = getValues(), t = calcTotal(v);
    $("#sumOccasion").textContent = labelOf(C.occasions, v.occasion) || "—";
    $("#sumPackage").textContent = t.pkg ? t.pkg.name : "—";
    $("#sumAddons").textContent = v.addons.length ? v.addons.map(function (id) { return labelOf(C.addons, id); }).join("، ") : "لا توجد";
    $("#sumDelivery").textContent = "خلال " + deliveryHours(v) + " ساعة";
    $("#sumTotal").textContent = t.pkg ? num(t.total) : "—";
  }
  function buildOrderId() { return "NH-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  function buildMessage(order) {
    var v = order.values, t = order.totals;
    var lines = [
      "*طلب جديد من ألحان الخليج*", "رقم الطلب: " + order.id, "",
      "*المناسبة:* " + labelOf(C.occasions, v.occasion),
      "*الأسماء:* " + v.names + (v.names2 ? " و " + v.names2 : ""),
      "*المدة:* " + ({ short: "قصيرة", normal: "متوسطة", long: "طويلة" })[v.duration],
      "*الباقة:* " + (t.pkg ? t.pkg.name : "") + " (" + money(t.pkg ? t.pkg.price : 0) + ")"
    ];
    if (v.addons.length) lines.push("*الإضافات:* " + v.addons.map(function (id) { return labelOf(C.addons, id); }).join("، "));
    if (v.eventDate) lines.push("*تاريخ المناسبة:* " + v.eventDate);
    if (v.notes) lines.push("*ملاحظات:* " + v.notes);
    lines.push("", "*الإجمالي:* " + money(t.total), "*مدة التسليم:* خلال " + deliveryHours(v) + " ساعة", "",
      "*الاسم:* " + v.customerName, "*الجوال:* " + v.phone);
    if (v.email) lines.push("*البريد:* " + v.email);
    return lines.join("\n");
  }
  var submitting = false;
  function setStatus(cls, text, linkUrl) {
    var status = $("#formStatus");
    status.className = "form-status " + (cls || "");
    status.textContent = text || "";
    if (linkUrl) {
      var a = document.createElement("a"); a.href = linkUrl; a.target = "_blank"; a.rel = "noopener";
      a.className = "btn btn-wa btn-sm"; a.style.marginInlineStart = "8px"; a.textContent = "افتح واتساب لإرسال الطلب";
      status.appendChild(document.createTextNode(" ")); status.appendChild(a);
    }
  }
  function onSubmit(e) {
    e.preventDefault(); clearErrors();
    if (submitting) return;
    for (var s = 1; s <= TOTAL_STEPS; s++) {
      if (!validateStep(s)) { goToStep(s); setStatus("error", "يرجى تصحيح الحقول المعلّمة"); return; }
    }
    var v = getValues(), order = { id: buildOrderId(), createdAt: new Date().toISOString(), values: v, totals: calcTotal(v) };
    var list = store.get("nh_orders", []); list.push(order); store.set("nh_orders", list.slice(-50));
    var url = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(buildMessage(order));
    // يُفتح واتساب مباشرة أثناء نقرة المستخدم لتجنّب حظر النوافذ المنبثقة
    var win = window.open(url, "_blank"); if (win) { try { win.opener = null; } catch (err) { /* تجاهل */ } }
    submitting = true;
    setStatus("", "جارٍ تسجيل طلبك لدى الخادم...", win ? null : url);
    api("/api/orders", { method: "POST", body: { id: order.id, kind: "custom", total: order.totals.total, values: v } })
      .then(function (d) {
        submitting = false;
        order.id = d.id; order.saved = true;
        list = store.get("nh_orders", []).map(function (x) { return x.createdAt === order.createdAt ? order : x; });
        store.set("nh_orders", list);
        setStatus("ok", "تم تسجيل طلبك رقم " + d.id + " بنجاح. أرسل رسالة واتساب لتأكيد الطلب ومتابعة التنفيذ.", win ? null : url);
        toast("تم تسجيل طلبك: " + d.id);
      })
      .catch(function (err) {
        submitting = false;
        setStatus("error", "تعذّر حفظ الطلب على الخادم (" + err.message + "). احتفظنا به على هذا الجهاز؛ أرسل رسالة واتساب لتأكيده برقم " + order.id + ".", win ? null : url);
      });
  }
  function setupBuilder() {
    $("#nextBtn").addEventListener("click", function () {
      clearErrors();
      if (validateStep(currentStep)) goToStep(currentStep + 1);
    });
    $("#prevBtn").addEventListener("click", function () { goToStep(currentStep - 1); });
    $("#orderForm").addEventListener("submit", onSubmit);
    $("#orderForm").addEventListener("change", updateSummary);
    $("#orderForm").addEventListener("input", updateSummary);
    $("#orderForm").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && currentStep < TOTAL_STEPS) { e.preventDefault(); $("#nextBtn").click(); }
    });
    goToStep(1); updateSummary();
  }

  /* ---------- التتبّع ---------- */
  var STATUS_LABEL = { received: "تم الاستلام", reviewing: "قيد المراجعة", in_progress: "قيد التنفيذ", delivered: "تم التسليم", cancelled: "ملغي" };
  function renderTrack(o, source) {
    var out = $("#trackResult");
    var pkg = byId(C.packages, o.pkg);
    var addons = (o.addons || []).map(function (id) { return labelOf(C.addons, id); }).filter(Boolean);
    var express = (o.addons || []).indexOf("express") !== -1;
    var rows = [
      ["رقم الطلب", o.id],
      ["المناسبة", labelOf(C.occasions, o.occasion) || (o.kind === "cart" ? "طلب من السلة" : "—")],
      ["الباقة", pkg ? pkg.name : "—"],
      ["الإضافات", addons.length ? addons.join("، ") : "لا توجد"],
      ["الإجمالي", money(o.total || 0)],
      ["تاريخ الطلب", new Date(o.createdAt).toLocaleDateString("ar-SA")],
      ["التسليم المتوقع", "خلال " + (express ? C.deliveryHours.express : C.deliveryHours.standard) + " ساعة من التأكيد"]
    ];
    out.innerHTML = '<div class="track-card"><span class="track-status">' + esc(STATUS_LABEL[o.status] || "قيد المراجعة") + '</span><dl>' +
      rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join("") +
      '</dl><p class="fine" style="margin-top:12px">' + (source === "local" ? "هذا الطلب محفوظ على هذا الجهاز فقط، ولم يصل الخادم بعد. أرسل رقمه على واتساب للتأكيد." : "لتحديث الحالة أو الاستفسار تواصل معنا على واتساب مع ذكر رقم الطلب.") + '</p></div>';
  }
  function setupTracking() {
    $("#trackForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $("#trackResult"), id = $("#trackInput").value.trim().toUpperCase();
      if (!/^NH-[A-Z0-9]{6,12}$/.test(id)) { out.innerHTML = '<p class="field-error" role="alert">أدخل رقم طلب صحيح بصيغة NH-XXXXXXXX</p>'; return; }
      out.innerHTML = '<p class="muted">جارٍ البحث عن الطلب...</p>';
      api("/api/orders/" + encodeURIComponent(id), { timeout: 6000 }).then(function (d) {
        renderTrack(d.order, "server");
      }).catch(function (err) {
        var list = store.get("nh_orders", []), o = null;
        for (var i = list.length - 1; i >= 0; i--) if (list[i].id === id) { o = list[i]; break; }
        if (o) {
          var t = o.totals || {}, v = o.values || {};
          renderTrack({ id: o.id, status: "received", createdAt: o.createdAt, occasion: v.occasion, pkg: v.pkg, addons: v.addons, total: t.total }, "local");
        } else if (err.status === 404) {
          out.innerHTML = '<p class="field-error" role="alert">لم نجد طلباً بهذا الرقم. تأكد من الرقم، أو راسلنا على واتساب.</p>';
        } else {
          out.innerHTML = '<p class="field-error" role="alert">تعذّر الاتصال بالخادم الآن. حاول مرة أخرى بعد قليل.</p>';
        }
      });
    });
  }

  /* ---------- النوافذ: الإغلاق ---------- */
  function setupOverlays() {
    $$(".overlay").forEach(function (o) {
      o.addEventListener("click", function (e) { if (e.target === o) o.hidden = true; });
    });
    document.addEventListener("click", function (e) {
      var c = e.target.closest("[data-close]");
      if (c) closeOverlay(c.getAttribute("data-close"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") $$(".overlay").forEach(function (o) { o.hidden = true; });
    });
    watchOverlays();
  }

  /* ---------- الخادم (واجهة برمجية) مع احتياطي data.js ---------- */
  var API = { online: false };
  function api(path, opts) {
    opts = opts || {};
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || 8000) : null;
    var init = { method: opts.method || "GET", headers: {}, cache: "no-store" };
    if (ctrl) init.signal = ctrl.signal;
    if (opts.body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opts.body); }
    if (opts.token) init.headers["X-Admin-Token"] = opts.token;
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (timer) clearTimeout(timer);
        if (!r.ok || data.ok === false) { var err = new Error(data.error || ("خطأ " + r.status)); err.status = r.status; throw err; }
        return data;
      });
    }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  function loadContent() {
    return api("/api/content", { timeout: 4000 }).then(function (d) {
      ["artists", "works", "products", "packages", "addons", "occasions", "reviews", "faqs"].forEach(function (k) {
        if (Array.isArray(d[k])) C[k] = d[k];
      });
      if (d.menu) C.menu = d.menu;
      if (d.reviewStats) C.reviewStats = d.reviewStats;
      if (d.social) C.social = d.social;
      if (d.whatsapp) C.whatsapp = d.whatsapp;
      if (d.deliveryHours) C.deliveryHours = d.deliveryHours;
      API.online = true;
    }).catch(function () { API.online = false; });
  }

  /* ---------- أعمالنا: صور وصوتيات وفيديوهات ---------- */
  var worksState = { kind: "all", artist: "", occ: "", sort: "new" };
  var KIND_LABEL = { audio: "صوتية", video: "فيديو", image: "صورة" };
  var MEDIA_ERR = "تعذّر تحميل هذا الملف حالياً. حاول لاحقاً أو راسلنا على واتساب.";
  function worksList() { return C.works || []; }
  function filteredWorks() {
    var list = worksList().filter(function (w) {
      return (worksState.kind === "all" || w.type === worksState.kind) &&
        (!worksState.artist || w.artist === worksState.artist) &&
        (!worksState.occ || w.occasion === worksState.occ);
    });
    if (worksState.sort === "plays") list = list.slice().sort(function (a, b) { return (b.plays || 0) - (a.plays || 0); });
    return list;
  }
  function workMedia(w) {
    var cover = w.cover ? '<img class="cover" src="' + esc(w.cover) + '" alt="" loading="lazy" />' : "";
    if (w.type === "image") {
      return '<div class="work-media"><span class="kind">' + KIND_LABEL.image + '</span>' +
        '<button type="button" class="zoom" data-view="' + esc(w.id) + '" aria-label="تكبير: ' + esc(w.title) + '"></button>' +
        '<img src="' + esc(w.src) + '" alt="' + esc(w.title) + '" loading="lazy" /></div>';
    }
    if (w.type === "audio") {
      return '<div class="work-media is-audio"><span class="kind">' + KIND_LABEL.audio + '</span><div class="work-audio">' + cover +
        '<div class="wave" aria-hidden="true">' + ICON.wave + '</div>' +
        '<audio controls preload="none" src="' + esc(w.src) + '" data-work="' + esc(w.id) + '" aria-label="مشغّل: ' + esc(w.title) + '"></audio></div></div>';
    }
    return '<div class="work-media"><span class="kind">' + KIND_LABEL.video + '</span>' +
      '<video controls preload="metadata" playsinline src="' + esc(w.src) + '"' + (w.cover ? ' poster="' + esc(w.cover) + '"' : '') +
      ' data-work="' + esc(w.id) + '" aria-label="مشغّل: ' + esc(w.title) + '"></video></div>';
  }
  function workCard(w) {
    var a = artistOf(w.artist), occ = labelOf(C.occasions, w.occasion);
    var liked = !!store.get("nh_liked", {})[w.id];
    return '<article class="work-card">' + workMedia(w) +
      '<div class="work-body"><h3 class="work-title">' + esc(w.title) + '</h3>' +
      '<p class="work-meta">' + (a ? esc(a.name) + ' · ' : '') + esc(occ || "") + ' · <span data-plays="' + esc(w.id) + '">' + num(w.plays || 0) + '</span> استماع/مشاهدة</p>' +
      (w.description ? '<p class="work-desc">' + esc(w.description) + '</p>' : '') +
      '<div class="work-actions">' +
      '<button type="button" class="like-btn" data-like-work="' + esc(w.id) + '" aria-pressed="' + liked + '"' + (liked ? ' disabled' : '') + '>' + ICON.heart + ' أعجبني (<span data-likes="' + esc(w.id) + '">' + num(w.likes || 0) + '</span>)</button>' +
      '<button type="button" class="btn btn-dark btn-sm" data-order-like="' + esc(w.occasion) + '">اطلب بأسمائي</button>' +
      '</div></div></article>';
  }
  function renderWorks() {
    var grid = $("#worksGrid"); if (!grid) return;
    var hasWorks = worksList().length > 0;
    $("#works").hidden = !hasWorks;
    $$('a[href="#works"]').forEach(function (a) { a.hidden = !hasWorks; });
    var list = filteredWorks();
    grid.innerHTML = list.map(workCard).join("");
    $("#worksEmpty").hidden = list.length > 0;
    $("#worksCount").textContent = "عرض " + num(list.length) + " من أصل " + num(worksList().length) + " عملاً";
  }
  function setupWorks() {
    var artistSel = $("#worksArtist"), occSel = $("#worksOcc");
    artistSel.innerHTML += C.artists.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join("");
    occSel.innerHTML += C.occasions.map(function (o) { return '<option value="' + esc(o.id) + '">' + esc(o.label) + '</option>'; }).join("");
    $("#worksTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-kind]"); if (!b) return;
      worksState.kind = b.getAttribute("data-kind");
      $$("#worksTabs [data-kind]").forEach(function (x) {
        var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderWorks();
    });
    artistSel.addEventListener("change", function () { worksState.artist = artistSel.value; renderWorks(); });
    occSel.addEventListener("change", function () { worksState.occ = occSel.value; renderWorks(); });
    var sortSel = $("#worksSort");
    if (sortSel) sortSel.addEventListener("change", function () { worksState.sort = sortSel.value; renderWorks(); });
    $("#worksGrid").addEventListener("click", function (e) {
      var v = e.target.closest("[data-view]");
      if (v) { var w = findWork(v.getAttribute("data-view")); if (w) openMedia(w); return; }
      var l = e.target.closest("[data-like-work]");
      if (l) { likeWork(l); return; }
    });
    document.addEventListener("click", function (e) {
      var o = e.target.closest("[data-order-like]");
      if (o) orderFromWork(o.getAttribute("data-order-like"));
    });
    // تشغيل الصوت والفيديو يُسجَّل على الخادم
    document.addEventListener("play", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute || !t.getAttribute("data-work")) return;
      var id = t.getAttribute("data-work");
      if (t.dataset.counted === "1") return;
      t.dataset.counted = "1";
      setTimeout(function () { t.dataset.counted = ""; }, 4000);
      api("/api/works/" + encodeURIComponent(id) + "/play", { method: "POST", timeout: 5000 }).then(function (d) {
        var w = findWork(id); if (w) w.plays = d.plays;
        $$("[data-plays]").forEach(function (el) { if (el.getAttribute("data-plays") === id) el.textContent = num(d.plays); });
      }).catch(function () { /* التشغيل نفسه لا يتأثر */ });
    }, true);
    // أي ملف مفقود أو تالف يُعرض برسالة واضحة بدل خطأ صامت
    document.addEventListener("error", function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.closest("#worksGrid, #mediaPanel")) return;
      var holder = t.closest(".work-media, .mp-media");
      if (holder) holder.innerHTML = '<p class="media-note" style="padding:14px;color:#fff;background:#121212;margin:0;width:100%">' + MEDIA_ERR + '</p>';
    }, true);
    renderWorks();
  }
  function findWork(id) { return worksList().filter(function (w) { return w.id === id; })[0] || null; }
  function likeWork(btn) {
    var id = btn.getAttribute("data-like-work");
    var liked = store.get("nh_liked", {});
    if (liked[id]) { toast("سجّلنا إعجابك بهذا العمل من قبل"); return; }
    btn.disabled = true;
    api("/api/works/" + encodeURIComponent(id) + "/like", { method: "POST", timeout: 5000 }).then(function (d) {
      liked[id] = true; store.set("nh_liked", liked);
      var w = findWork(id); if (w) w.likes = d.likes;
      $$("[data-likes]").forEach(function (el) { if (el.getAttribute("data-likes") === id) el.textContent = num(d.likes); });
      $$("[data-like-work]").forEach(function (b) { if (b.getAttribute("data-like-work") === id) { b.setAttribute("aria-pressed", "true"); b.disabled = true; } });
      toast("شكراً! تم تسجيل إعجابك");
    }).catch(function () { btn.disabled = false; toast("تعذّر تسجيل الإعجاب الآن، حاول مرة أخرى"); });
  }
  function orderFromWork(occ) {
    if (occ && byId(C.occasions, occ)) selectOccasion(occ);
    goToStep(1);
    $("#builder").scrollIntoView({ behavior: "smooth" });
    toast("تم تجهيز نموذج الطلب على نمط هذه المناسبة");
  }
  function openMedia(w) {
    var panel = $("#mediaPanel");
    var a = artistOf(w.artist);
    var body;
    if (w.type === "image") body = '<img src="' + esc(w.src) + '" alt="' + esc(w.title) + '" />';
    else if (w.type === "audio") body = (w.cover ? '<img src="' + esc(w.cover) + '" alt="" style="max-height:220px;object-fit:cover;margin-bottom:12px" />' : '') +
      '<audio controls autoplay preload="auto" src="' + esc(w.src) + '" data-work="' + esc(w.id) + '"></audio>';
    else body = '<video controls playsinline preload="auto" src="' + esc(w.src) + '"' + (w.cover ? ' poster="' + esc(w.cover) + '"' : '') + ' data-work="' + esc(w.id) + '"></video>';
    panel.innerHTML = '<button class="close-btn" data-close="mediaOverlay" aria-label="إغلاق">' + ICON.close + '</button>' +
      '<div class="mp-media">' + body + '</div>' +
      '<h3>' + esc(w.title) + '</h3>' +
      '<p class="muted" style="margin:0">' + (a ? esc(a.name) + ' · ' : '') + esc(labelOf(C.occasions, w.occasion) || "") + '</p>' +
      (w.description ? '<p class="product-panel desc" style="margin:8px 0 0">' + esc(w.description) + '</p>' : '') +
      '<div class="product-actions" style="margin-top:16px"><button class="btn btn-dark" type="button" data-order-like="' + esc(w.occasion) + '" data-close="mediaOverlay">اطلب مثلها</button></div>';
    openOverlay("mediaOverlay");
  }

  /* ---------- قفل تمرير الصفحة خلف النوافذ المفتوحة ---------- */
  function syncScrollLock() {
    var open = $$(".overlay").some(function (o) { return !o.hidden; });
    document.documentElement.classList.toggle("scroll-lock", open);
  }
  function watchOverlays() {
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(syncScrollLock);
    $$(".overlay").forEach(function (o) { mo.observe(o, { attributes: true, attributeFilter: ["hidden"] }); });
    syncScrollLock();
  }

  /* ---------- التشغيل ---------- */
  function init() {
    fillBrand();
    renderMenus();
    renderSlider();
    renderQuick();
    renderCategories();
    renderArtists();
    renderRails();
    setupCatalog();
    renderCatalog();
    setupProductEvents();
    setupSearch();
    setupCart();
    renderCart();
    renderChoices();
    setupBuilder();
    renderPackages();
    renderReviews();
    renderFaq();
    setupTracking();
    setupWorks();
    setupOverlays();
    setupReviewForm();
    setupReviewToggle();
    setupWaFloat();
    renderSupport();
    handleDeepLink();
    var nav = $("#nav");
    document.addEventListener("click", function (e) { if (!e.target.closest("#nav") && !e.target.closest("#menuToggle")) closeMobileMenu(); });
  }

  /* ---------- حالة الرد حسب ساعات الرد بتوقيت عدن ---------- */
  function renderSupport() {
    var hrs = C.replyHours || { from: 9, to: 23 }, h = hrs.from;
    try { h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Aden", hour: "numeric", hour12: false }).format(new Date())); } catch (e) {}
    var open = h >= hrs.from && h < hrs.to;
    var txt = open ? "فريق الرد متاح الآن" : "فريق الرد يعود صباحاً الساعة " + hrs.from + ":00";
    $$(".support-status").forEach(function (el) { el.textContent = txt; });
  }

  /* ---------- روابط قادمة من صفحة المنتج: ?add=pN أو ?like=pN ---------- */
  function handleDeepLink() {
    var q = new URLSearchParams(location.search);
    var add = q.get("add"), like = q.get("like");
    if (add && byId(C.products, add)) addToCart(add, 1);
    if (like && byId(C.products, like)) setTimeout(function () { orderLike(like); }, 250);
    if (add || like) history.replaceState(null, "", location.pathname + location.hash);
  }

  function boot() { loadContent().then(init, init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
