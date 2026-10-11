/* ===================================================
   ألحان الخليج — الخادم
   بدون مكتبات خارجية (Node.js 18+).
   التشغيل:  node server.js
   كلمة مرور الإدارة:  ADMIN_PASSWORD=كلمة_سرك node server.js
   =================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = __dirname;
const DB_FILE = path.join(ROOT, "data", "db.json");
const UPLOADS = path.join(ROOT, "uploads");
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "alhan2026";
const MAX_BODY = 45 * 1024 * 1024;
const MAX_FILE = 30 * 1024 * 1024;
const SESSION_MS = 12 * 60 * 60 * 1000;
const STATUSES = ["received", "reviewing", "in_progress", "delivered", "cancelled"];
const sessions = new Map(); // token -> وقت الانتهاء
const REVIEW_DAILY_LIMIT = 3;  // أقصى عدد تقييمات لكل عميل (حسب عنوان الاتصال) في اليوم
const reviewHits = new Map();  // مفتاح العميل -> أوقات الإرسال
const SOCIAL_KEYS = ["instagram", "tiktok", "snapchat", "youtube", "x", "facebook"];
const REVIEW_STATUSES = ["pending", "approved", "rejected"];
const loginFails = new Map(); // مفتاح العميل -> أوقات المحاولات الفاشلة
const LOGIN_MAX_FAILS = 5, LOGIN_WINDOW_MS = 15 * 60 * 1000;
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(String(pw), salt, 64).toString("hex");
}
function passwordOk(pw) {
  const stored = db.settings && db.settings.adminPassword;
  if (!stored) return String(pw) === ADMIN_PASSWORD;
  const parts = stored.split(":");
  const got = crypto.scryptSync(String(pw), parts[0], 64);
  return crypto.timingSafeEqual(got, Buffer.from(parts[1], "hex"));
}
function clientKey(req) { return crypto.createHash("sha256").update(String(req.socket.remoteAddress || "")).digest("hex").slice(0, 16); }

/* ---------- الإعدادات الأولية من data.js (تُستخدم للبذر فقط) ---------- */
function loadConfig() {
  const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.SITE_CONFIG;
}
const CONFIG = loadConfig();

/* ---------- قاعدة البيانات (ملف JSON) ---------- */
let db = {};
function saveDb() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
// أعمالنا: لا توجد عينات. تُضاف الأعمال الحقيقية من لوحة الإدارة.
const SEED_WORKS = [];
function loadDb() {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { db = {}; }
  if (!db || typeof db !== "object") db = {};
  const now = new Date().toISOString();
  const seed = {
    artists: () => CONFIG.artists.map(a => ({ id: a.id, name: a.name, initials: a.initials, bio: "", photo: "", createdAt: now })),
    products: () => CONFIG.products.map(p => ({ id: p.id, title: p.title, cat: p.cat, img: p.img || "", artist: p.artist, price: p.price, oldPrice: p.oldPrice || 0, duration: p.duration, sales: p.sales || 0, tags: p.tags || [], isNew: !!p.isNew, createdAt: now })),
    packages: () => CONFIG.packages.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, features: p.features, popular: !!p.popular })),
    addons: () => CONFIG.addons.map(a => ({ id: a.id, label: a.label, price: a.price })),
    occasions: () => CONFIG.occasions.map(o => ({ id: o.id, label: o.label, img: o.img || "" })),
    reviews: () => [],
    faqs: () => CONFIG.faqs.map((f, i) => ({ id: "f" + (i + 1), q: f.q, a: f.a })),
    works: () => SEED_WORKS.map(w => Object.assign({ likes: 0, plays: 0, createdAt: now }, w)),
    orders: () => []
  };
  let changed = false;
  // تقييمات تجريبية قديمة (بدون مصدر) تُزال: لا نعرض إلا تقييمات العملاء الحقيقيين
  if (Array.isArray(db.reviews) && db.reviews.some(r => !r.source)) { db.reviews = db.reviews.filter(r => r.source); changed = true; }
  Object.keys(seed).forEach(function (k) { if (!Array.isArray(db[k])) { db[k] = seed[k](); changed = true; } });
  if (!db.settings) {
    db.settings = { whatsapp: CONFIG.whatsapp, deliveryHours: { standard: CONFIG.deliveryHours.standard, express: CONFIG.deliveryHours.express }, social: {} };
    changed = true;
  }
  if (!db.settings.social || typeof db.settings.social !== "object") { db.settings.social = {}; changed = true; }
  if (changed) saveDb();
}

/* ---------- أدوات مساعدة ---------- */
const newId = (prefix) => (prefix || "") + crypto.randomBytes(4).toString("hex");
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store" });
  res.end(body);
}
function readBody(req, max) {
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on("data", function (c) {
      size += c.length;
      if (size > max) { reject(fail("الطلب أكبر من الحد المسموح", 413)); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}
async function readJson(req, max) {
  const raw = await readBody(req, max || 1024 * 1024);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { throw fail("صيغة البيانات غير صحيحة", 400); }
}
function fail(msg, status) { return Object.assign(new Error(msg), { status: status || 400 }); }
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

const MIME_EXT = {
  "image/jpeg": ["jpg", "image"], "image/png": ["png", "image"], "image/webp": ["webp", "image"], "image/gif": ["gif", "image"],
  "audio/mpeg": ["mp3", "audio"], "audio/wav": ["wav", "audio"], "audio/x-wav": ["wav", "audio"], "audio/ogg": ["ogg", "audio"],
  "audio/mp4": ["m4a", "audio"], "audio/aac": ["aac", "audio"],
  "video/mp4": ["mp4", "video"], "video/webm": ["webm", "video"]
};
function saveDataUrl(dataUrl, expectType) {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(dataUrl || ""));
  if (!m) throw fail("الملف غير صالح");
  const meta = MIME_EXT[m[1].toLowerCase()];
  if (!meta) throw fail("نوع الملف غير مدعوم: " + m[1]);
  if (expectType && meta[1] !== expectType) throw fail("نوع الملف لا يطابق نوع العمل المختار");
  const buf = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  if (!buf.length) throw fail("الملف فارغ");
  if (buf.length > MAX_FILE) throw fail("حجم الملف يتجاوز 30 ميغابايت");
  const name = Date.now().toString(36) + "-" + crypto.randomBytes(3).toString("hex") + "." + meta[0];
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  return { url: "uploads/" + name, type: meta[1] };
}
function removeUpload(url) {
  if (typeof url !== "string" || url.indexOf("uploads/") !== 0) return;
  const p = path.normalize(path.join(ROOT, url));
  if (p.indexOf(UPLOADS) === 0) { try { fs.unlinkSync(p); } catch (e) { /* غير موجود */ } }
}
function requireAdmin(req) {
  const t = String(req.headers["x-admin-token"] || "");
  const exp = sessions.get(t);
  if (!t || !exp) throw fail("يجب تسجيل الدخول للإدارة", 401);
  if (exp < Date.now()) { sessions.delete(t); throw fail("انتهت الجلسة، سجّل الدخول مجدداً", 401); }
  sessions.set(t, Date.now() + SESSION_MS); // تمديد الجلسة عند النشاط
}
const artistIds = () => db.artists.map(a => a.id);
const occasionIds = () => db.occasions.map(o => o.id);
const menuIds = () => ["shilat", "zaffat", "tunes"].reduce(function (acc, g) { return acc.concat((CONFIG.menu[g] || []).map(c => c.id)); }, []);

/* ---------- تعريف الحقول القابلة للتعديل من الإدارة ---------- */
// كل حقل: k = المفتاح، t = النوع، label = الاسم الظاهر، req = إلزامي، min/max = الحدود
const COLS = {
  artists: { db: "artists", prefix: "a", fields: [
    { k: "name", t: "text", label: "الاسم", req: 1, min: 2, max: 80 },
    { k: "initials", t: "text", label: "الاختصار", max: 8 },
    { k: "bio", t: "textarea", label: "نبذة قصيرة", max: 400 },
    { k: "photo", t: "image", label: "صورة شخصية" },
    { k: "featured", t: "bool", label: "كبار الفنانين (يظهر في القسم المميز أولاً)" }
  ] },
  products: { db: "products", prefix: "p", fields: [
    { k: "title", t: "text", label: "عنوان المنتج", req: 1, min: 2, max: 140 },
    { k: "cat", t: "select", label: "القسم", req: 1, options: menuIds },
    { k: "artist", t: "select", label: "المنشد", options: artistIds },
    { k: "price", t: "number", label: "السعر", req: 1, min: 0, max: 100000 },
    { k: "oldPrice", t: "number", label: "السعر قبل الخصم", min: 0, max: 100000 },
    { k: "duration", t: "text", label: "المدة (مثل 02:30)", max: 8, pattern: /^\d{1,2}:\d{2}$/ },
    { k: "sales", t: "number", label: "عدد المبيعات", min: 0, max: 10000000 },
    { k: "tags", t: "tags", label: "وسوم (مفصولة بفاصلة)" },
    { k: "isNew", t: "bool", label: "جديد" },
    { k: "img", t: "image", label: "صورة المنتج (تظهر بدل الخلفية الملونة)" }
  ] },
  packages: { db: "packages", prefix: "pk", fields: [
    { k: "name", t: "text", label: "اسم الباقة", req: 1, min: 2, max: 60 },
    { k: "price", t: "number", label: "السعر", req: 1, min: 0, max: 100000 },
    { k: "desc", t: "textarea", label: "وصف الباقة", max: 300 },
    { k: "features", t: "lines", label: "المميزات (سطر لكل ميزة)" },
    { k: "popular", t: "bool", label: "الأكثر طلباً (تمييز)" }
  ] },
  addons: { db: "addons", prefix: "ad", fields: [
    { k: "label", t: "text", label: "اسم الإضافة", req: 1, min: 2, max: 100 },
    { k: "price", t: "number", label: "السعر", req: 1, min: 0, max: 100000 }
  ] },
  occasions: { db: "occasions", prefix: "o", fields: [
    { k: "label", t: "text", label: "اسم المناسبة", req: 1, min: 2, max: 60 },
    { k: "img", t: "image", label: "صورة البطاقة" }
  ] },
  reviews: { db: "reviews", prefix: "r", fields: [
    { k: "name", t: "text", label: "اسم العميل", req: 1, min: 2, max: 60 },
    { k: "role", t: "text", label: "الصفة (مثل: أب العروس)", max: 60 },
    { k: "text", t: "textarea", label: "نص التقييم", req: 1, min: 5, max: 500 },
    { k: "stars", t: "number", label: "عدد النجوم (1 إلى 5)", req: 1, min: 1, max: 5 },
    { k: "status", t: "select", label: "الحالة (فارغ = بانتظار المراجعة)", options: () => REVIEW_STATUSES },
    { k: "verified", t: "bool", label: "طلب موثّق (تم التحقق من طلب مُسلَّم)" }
  ] },
  faqs: { db: "faqs", prefix: "f", fields: [
    { k: "q", t: "text", label: "السؤال", req: 1, min: 3, max: 200 },
    { k: "a", t: "textarea", label: "الجواب", req: 1, min: 3, max: 1000 }
  ] }
};

/* يبني سجلاً صالحاً من الطلب؛ عند التعديل يُبقي القيم غير المرسلة كما هي (تعديل جزئي) */
function buildRecord(spec, body, existing) {
  const out = {};
  spec.fields.forEach(function (f) {
    const has = Object.prototype.hasOwnProperty.call(body, f.k);
    if (!has && existing) { out[f.k] = existing[f.k]; return; }
    const v = body[f.k];
    if (f.t === "image") {
      if (typeof v === "string" && v.indexOf("data:") === 0) {
        const saved = saveDataUrl(v, "image");
        if (existing && existing[f.k]) removeUpload(existing[f.k]);
        out[f.k] = saved.url;
      } else out[f.k] = existing ? (existing[f.k] || "") : "";
      return;
    }
    if (f.t === "bool") { out[f.k] = v === true || v === "true" || v === "on" || v === 1; return; }
    if (f.t === "number") {
      if (v === "" || v == null) {
        if (f.req) throw fail("حقل «" + f.label + "» مطلوب");
        out[f.k] = 0; return;
      }
      const n = Number(v);
      if (!isFinite(n) || n < (f.min != null ? f.min : -Infinity) || n > (f.max != null ? f.max : Infinity)) throw fail("قيمة «" + f.label + "» غير صحيحة" + (f.min != null || f.max != null ? " (بين " + (f.min != null ? f.min : "") + " و" + (f.max != null ? f.max : "") + ")" : ""));
      out[f.k] = Math.round(n * 100) / 100; return;
    }
    if (f.t === "tags") {
      const arr = (Array.isArray(v) ? v : String(v || "").split(/[,،]/)).map(x => clean(x, 30)).filter(Boolean).slice(0, 10);
      out[f.k] = arr; return;
    }
    if (f.t === "lines") {
      const arr = (Array.isArray(v) ? v : String(v || "").split(/\n/)).map(x => clean(x, 120)).filter(Boolean).slice(0, 12);
      out[f.k] = arr; return;
    }
    if (f.t === "select") {
      const val = clean(v, 60);
      if (!val) { if (f.req) throw fail("اختر «" + f.label + "»"); out[f.k] = ""; return; }
      if (f.options && f.options().indexOf(val) === -1) throw fail("اختيار «" + f.label + "» غير موجود");
      out[f.k] = val; return;
    }
    const s = clean(v, f.max || 500);
    if (f.req && s.length < (f.min || 1)) throw fail("حقل «" + f.label + "» مطلوب" + (f.min > 1 ? " (" + f.min + " أحرف على الأقل)" : ""));
    if (f.pattern && s && !f.pattern.test(s)) throw fail("صيغة «" + f.label + "» غير صحيحة");
    out[f.k] = s;
  });
  return out;
}
function countRefs(col, id) {
  if (col === "artists") return db.products.filter(p => p.artist === id).length + db.works.filter(w => w.artist === id).length;
  if (col === "occasions") return db.works.filter(w => w.occasion === id).length;
  return 0;
}
const REF_LABEL = { artists: "منتج أو عمل مرتبط بهذا الفنان", occasions: "عمل مرتبط بهذه المناسبة" };

/* ---------- الطلبات: الأسعار تُحسب على الخادم من البيانات الحالية ---------- */
function computeOrder(body) {
  const kind = body.kind === "cart" ? "cart" : "custom";
  if (kind === "cart") {
    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 50).map(function (i) {
      const p = db.products.find(x => x.id === String(i.id || ""));
      if (!p) throw fail("أحد المنتجات لم يعد متوفراً، حدّث الصفحة وأعد المحاولة");
      const qty = Math.max(1, Math.min(99, Number(i.qty) || 1));
      return { id: p.id, title: p.title, qty: qty, price: p.price };
    });
    if (!items.length) throw fail("السلة فارغة");
    return { kind, items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
  }
  const v = body.values || {};
  const pkg = db.packages.find(p => p.id === String(v.pkg || ""));
  if (!pkg) throw fail("اختر الباقة");
  const addonIds = Array.isArray(v.addons) ? v.addons.slice(0, 10).map(a => String(a)) : [];
  const addonSum = db.addons.filter(a => addonIds.indexOf(a.id) !== -1).reduce((s, a) => s + a.price, 0);
  return { kind, items: [], total: pkg.price + addonSum };
}
function publicOrder(o) {
  return { id: o.id, status: o.status, createdAt: o.createdAt, kind: o.kind, occasion: o.values.occasion, pkg: o.values.pkg, total: o.total, names: o.values.names, addons: o.values.addons, eventDate: o.values.eventDate, items: o.items };
}

/* ---------- واجهة البرمجة ---------- */
function sortedWorks() {
  return db.works.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}
function approvedReviews() {
  return db.reviews
    .filter(r => r.status === "approved")
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map(r => ({ id: r.id, name: r.name, role: r.role || "", text: r.text, stars: r.stars, verified: !!r.verified, createdAt: r.createdAt }));
}
function publicContent() {
  const rev = approvedReviews();
  const avg = rev.length ? Math.round(rev.reduce((s, r) => s + r.stars, 0) / rev.length * 10) / 10 : 0;
  return {
    ok: true,
    artists: db.artists,
    works: sortedWorks(),
    products: db.products,
    packages: db.packages,
    addons: db.addons,
    occasions: db.occasions,
    reviews: rev,
    reviewStats: { count: rev.length, average: avg },
    faqs: db.faqs,
    menu: CONFIG.menu,
    whatsapp: db.settings.whatsapp,
    social: db.settings.social,
    deliveryHours: db.settings.deliveryHours
  };
}

async function api(req, res, p) {
  const method = req.method;

  if (method === "GET" && p === "/api/content") return send(res, 200, publicContent());

  let m;
  if (method === "POST" && (m = /^\/api\/works\/([\w-]+)\/(like|play)$/.exec(p))) {
    const w = db.works.find(x => x.id === m[1]);
    if (!w) throw fail("العمل غير موجود", 404);
    if (m[2] === "like") w.likes = (w.likes || 0) + 1; else w.plays = (w.plays || 0) + 1;
    saveDb();
    return send(res, 200, { ok: true, likes: w.likes || 0, plays: w.plays || 0 });
  }

  if (method === "POST" && p === "/api/orders") {
    const body = await readJson(req, 200 * 1024);
    const pricing = computeOrder(body);
    const v = body.values || {};
    const names = clean(v.names, 60), customer = clean(v.customerName, 60), phone = clean(v.phone, 20);
    if (pricing.kind === "custom") {
      if (names.length < 2) throw fail("الاسم غير صحيح");
      if (customer.length < 3) throw fail("اسم العميل غير صحيح");
      if (!/^\+?\d{8,15}$/.test(phone.replace(/[\s\-()]/g, ""))) throw fail("رقم الجوال غير صحيح");
    } else if (phone && !/^\+?\d{8,15}$/.test(phone.replace(/[\s\-()]/g, ""))) throw fail("رقم الجوال غير صحيح");
    const clientId = String(body.id || "");
    let orderId = /^NH-[A-Z0-9]{6,12}$/.test(clientId) ? clientId : "";
    if (!orderId || db.orders.some(o => o.id === orderId)) {
      orderId = "NH-" + Date.now().toString(36).toUpperCase().slice(-5) + crypto.randomBytes(2).toString("hex").toUpperCase();
    }
    const order = {
      id: orderId,
      kind: pricing.kind,
      status: "received",
      createdAt: new Date().toISOString(),
      total: pricing.total,
      values: {
        occasion: clean(v.occasion, 40), names: names, names2: clean(v.names2, 60), notes: clean(v.notes, 500),
        eventDate: clean(v.eventDate, 12), duration: clean(v.duration, 10), pkg: clean(v.pkg, 40),
        addons: Array.isArray(v.addons) ? v.addons.slice(0, 10).map(a => clean(a, 40)) : [],
        customerName: customer, phone: phone, email: clean(v.email, 120)
      },
      items: pricing.items
    };
    db.orders.push(order);
    saveDb();
    return send(res, 201, { ok: true, id: order.id, status: order.status, total: order.total });
  }

  if (method === "GET" && (m = /^\/api\/orders\/(NH-[A-Z0-9]{4,12})$/.exec(p))) {
    const o = db.orders.find(x => x.id === m[1]);
    if (!o) throw fail("لم نجد هذا الطلب", 404);
    return send(res, 200, { ok: true, order: publicOrder(o) });
  }

  // تقييم من عميل: يُحفظ بحالة «بانتظار المراجعة» ولا يظهر إلا بعد اعتماد الإدارة
  if (method === "POST" && p === "/api/reviews") {
    const body = await readJson(req, 20 * 1024);
    if (body.website) return send(res, 201, { ok: true, pending: true }); // حقل مخفي لمصائد الروبوتات
    const key = crypto.createHash("sha256").update(String(req.socket.remoteAddress || "")).digest("hex").slice(0, 16);
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const hits = (reviewHits.get(key) || []).filter(t => t > dayAgo);
    if (hits.length >= REVIEW_DAILY_LIMIT) throw fail("لقد أرسلت عدداً كبيراً من التقييمات اليوم. حاول لاحقاً أو راسلنا على واتساب.", 429);
    const name = clean(body.name, 60), text = clean(body.text, 500), role = clean(body.role, 60);
    const rating = Number(body.rating);
    if (name.length < 2) throw fail("أدخل اسمك (حرفان على الأقل)");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw fail("اختر عدد النجوم من 1 إلى 5");
    if (text.length < 10) throw fail("اكتب تقييمك بتفصيل أكثر (10 أحرف على الأقل)");
    const orderId = clean(body.orderId, 20).toUpperCase();
    let verified = false;
    if (orderId) {
      const o = db.orders.find(x => x.id === orderId);
      if (!o) throw fail("رقم الطلب غير موجود. اتركه فارغاً إن لم يكن لديك رقم طلب.");
      if (db.reviews.some(r => r.orderId === orderId)) throw fail("تم إرسال تقييم لهذا الطلب من قبل", 409);
      verified = o.status === "delivered";
    }
    db.reviews.push({ id: newId("r"), name: name, role: role, text: text, stars: rating, status: "pending", verified: verified, orderId: orderId, source: "customer", createdAt: new Date().toISOString() });
    saveDb();
    hits.push(Date.now()); reviewHits.set(key, hits);
    return send(res, 201, { ok: true, pending: true });
  }

  if (method === "POST" && p === "/api/admin/login") {
    const body = await readJson(req);
    const key = clientKey(req), since = Date.now() - LOGIN_WINDOW_MS;
    const fails = (loginFails.get(key) || []).filter(t => t > since);
    if (fails.length >= LOGIN_MAX_FAILS) throw fail("محاولات خاطئة كثيرة. انتظر 15 دقيقة ثم حاول مجدداً.", 429);
    if (!passwordOk(body.password || "")) {
      fails.push(Date.now()); loginFails.set(key, fails);
      throw fail("كلمة المرور غير صحيحة", 401);
    }
    loginFails.delete(key);
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { ok: true, token: token });
  }

  if (method === "POST" && p === "/api/admin/logout") {
    const t = String(req.headers["x-admin-token"] || "");
    if (t) sessions.delete(t);
    return send(res, 200, { ok: true });
  }

  if (p.indexOf("/api/admin/") === 0) {
    requireAdmin(req);

    if (method === "GET" && p === "/api/admin/summary") {
      return send(res, 200, {
        ok: true,
        artists: db.artists,
        works: sortedWorks(),
        products: db.products,
        packages: db.packages,
        addons: db.addons,
        occasions: db.occasions,
        reviews: db.reviews,
        faqs: db.faqs,
        settings: Object.assign({}, db.settings, { adminPassword: undefined }),
        menu: CONFIG.menu,
        orders: db.orders.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      });
    }

    if (method === "PUT" && p === "/api/admin/password") {
      const body = await readJson(req);
      if (!passwordOk(body.current || "")) throw fail("كلمة المرور الحالية غير صحيحة");
      const next = String(body.next || "");
      if (next.length < 8) throw fail("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      if (next === String(body.current || "")) throw fail("اختر كلمة مرور مختلفة عن الحالية");
      db.settings.adminPassword = hashPassword(next);
      saveDb();
      sessions.clear(); // تُلغى كل الجلسات، ويُطلب الدخول بالكلمة الجديدة
      return send(res, 200, { ok: true });
    }

    if (method === "GET" && p === "/api/admin/backup") {
      const data = JSON.stringify(Object.assign({}, db, { settings: Object.assign({}, db.settings, { adminPassword: undefined }) }), null, 2);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="alhan-backup-' + new Date().toISOString().slice(0, 10) + '.json"', "Cache-Control": "no-store" });
      return res.end(data);
    }

    if (method === "PUT" && p === "/api/admin/settings") {
      const body = await readJson(req);
      const wa = String(body.whatsapp || "").replace(/\D/g, "");
      if (!/^\d{8,15}$/.test(wa)) throw fail("رقم الواتساب غير صحيح (8 إلى 15 رقماً، مع رمز الدولة بدون +)");
      const std = Math.round(Number(body.standardHours)), exp = Math.round(Number(body.expressHours));
      if (!(std >= 1 && std <= 720)) throw fail("مدة التسليم القياسي يجب أن تكون بين 1 و 720 ساعة");
      if (!(exp >= 1 && exp <= 720)) throw fail("مدة التسليم العاجل يجب أن تكون بين 1 و 720 ساعة");
      const socialIn = body.social && typeof body.social === "object" ? body.social : {};
      const social = {};
      SOCIAL_KEYS.forEach(function (k) {
        const v = clean(socialIn[k], 200);
        if (v && !/^https?:\/\/[^\s]+$/i.test(v)) throw fail("رابط " + k + " يجب أن يبدأ بـ https://");
        social[k] = v;
      });
      db.settings = Object.assign({}, db.settings, { whatsapp: wa, deliveryHours: { standard: std, express: exp }, social: social });
      saveDb();
      return send(res, 200, { ok: true, settings: db.settings });
    }

    // ----- الأعمال (صور وصوت وفيديو) -----
    if (method === "POST" && p === "/api/admin/works") {
      const body = await readJson(req, MAX_BODY);
      const type = clean(body.type, 10);
      if (["image", "audio", "video"].indexOf(type) === -1) throw fail("نوع العمل غير صحيح");
      const title = clean(body.title, 120);
      if (title.length < 2) throw fail("عنوان العمل مطلوب");
      if (!body.file) throw fail("ارفع ملف العمل");
      const artist = clean(body.artist, 40), occasion = clean(body.occasion, 40);
      if (artist && artistIds().indexOf(artist) === -1) throw fail("المنشد المختار غير موجود");
      if (occasion && occasionIds().indexOf(occasion) === -1) throw fail("المناسبة المختارة غير موجودة");
      const file = saveDataUrl(body.file, type);
      const work = {
        id: newId("w"), title: title, type: type, src: file.url, cover: "", artist: artist, occasion: occasion,
        description: clean(body.description, 400), likes: 0, plays: 0, createdAt: new Date().toISOString()
      };
      if (body.cover) work.cover = saveDataUrl(body.cover, "image").url;
      db.works.push(work); saveDb();
      return send(res, 201, { ok: true, work: work });
    }

    if (method === "PUT" && (m = /^\/api\/admin\/works\/([\w-]+)$/.exec(p))) {
      const body = await readJson(req, MAX_BODY);
      const w = db.works.find(x => x.id === m[1]);
      if (!w) throw fail("العمل غير موجود", 404);
      if (Object.prototype.hasOwnProperty.call(body, "title")) {
        const title = clean(body.title, 120);
        if (title.length < 2) throw fail("عنوان العمل مطلوب");
        w.title = title;
      }
      if (Object.prototype.hasOwnProperty.call(body, "artist")) {
        const artist = clean(body.artist, 40);
        if (artist && artistIds().indexOf(artist) === -1) throw fail("المنشد المختار غير موجود");
        w.artist = artist;
      }
      if (Object.prototype.hasOwnProperty.call(body, "occasion")) {
        const occ = clean(body.occasion, 40);
        if (occ && occasionIds().indexOf(occ) === -1) throw fail("المناسبة المختارة غير موجودة");
        w.occasion = occ;
      }
      if (Object.prototype.hasOwnProperty.call(body, "description")) w.description = clean(body.description, 400);
      if (body.file) { const f = saveDataUrl(body.file, w.type); removeUpload(w.src); w.src = f.url; }
      if (body.cover) { const c = saveDataUrl(body.cover, "image"); removeUpload(w.cover); w.cover = c.url; }
      if (body.clearCover) { removeUpload(w.cover); w.cover = ""; }
      saveDb();
      return send(res, 200, { ok: true, work: w });
    }

    if (method === "DELETE" && (m = /^\/api\/admin\/works\/([\w-]+)$/.exec(p))) {
      const w = db.works.find(x => x.id === m[1]);
      if (!w) throw fail("العمل غير موجود", 404);
      removeUpload(w.src); removeUpload(w.cover);
      db.works = db.works.filter(x => x.id !== m[1]);
      saveDb();
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && (m = /^\/api\/admin\/orders\/(NH-[A-Z0-9]{4,12})\/status$/.exec(p))) {
      const body = await readJson(req);
      const o = db.orders.find(x => x.id === m[1]);
      if (!o) throw fail("الطلب غير موجود", 404);
      if (STATUSES.indexOf(body.status) === -1) throw fail("حالة غير صحيحة");
      o.status = body.status; saveDb();
      return send(res, 200, { ok: true, order: publicOrder(o) });
    }

    // ----- الحقول العامة: فنانون، منتجات وأسعار، باقات، إضافات، مناسبات، تقييمات، أسئلة -----
    if ((m = /^\/api\/admin\/(artists|products|packages|addons|occasions|reviews|faqs)(?:\/([\w-]+))?$/.exec(p))) {
      const spec = COLS[m[1]], id = m[2];
      const list = db[spec.db];
      if (method === "POST" && !id) {
        const body = await readJson(req, MAX_BODY);
        const rec = buildRecord(spec, body, null);
        if (m[1] === "reviews" && !rec.status) rec.status = "pending";
        rec.id = newId(spec.prefix);
        rec.createdAt = new Date().toISOString();
        list.push(rec); saveDb();
        return send(res, 201, { ok: true, record: rec });
      }
      if (method === "PUT" && id) {
        const body = await readJson(req, MAX_BODY);
        const existing = list.find(x => x.id === id);
        if (!existing) throw fail("العنصر غير موجود", 404);
        const rec = buildRecord(spec, body, existing);
        if (m[1] === "reviews" && !rec.status) rec.status = "pending";
        Object.assign(existing, rec); saveDb();
        return send(res, 200, { ok: true, record: existing });
      }
      if (method === "DELETE" && id) {
        const existing = list.find(x => x.id === id);
        if (!existing) throw fail("العنصر غير موجود", 404);
        const refs = countRefs(m[1], id);
        if (refs) throw fail("لا يمكن الحذف لأن هناك " + refs + " " + REF_LABEL[m[1]] + ". انقله أو احذفه أولاً.", 409);
        spec.fields.forEach(f => { if (f.t === "image") removeUpload(existing[f.k]); });
        db[spec.db] = list.filter(x => x.id !== id); saveDb();
        return send(res, 200, { ok: true });
      }
    }
  }

  throw fail("المسار غير موجود", 404);
}

/* ---------- الملفات الثابتة ---------- */
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".aac": "audio/aac",
  ".mp4": "video/mp4", ".webm": "video/webm", ".json": "application/json; charset=utf-8", ".ico": "image/x-icon"
};
function staticFile(req, res, p) {
  if (p === "/") p = "/index.html";
  let decoded;
  try { decoded = decodeURIComponent(p); } catch (e) { res.writeHead(400); return res.end("bad request"); }
  const allowedRoot = /^\/(index\.html|admin\.html|product\.html|styles\.css|app\.js|product\.js|data\.js)$/.test(decoded);
  const allowedDir = /^\/(assets|works|uploads)\//.test(decoded);
  if (!allowedRoot && !allowedDir) { res.writeHead(404); return res.end("Not found"); }
  const file = path.normalize(path.join(ROOT, decoded));
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("Not found"); }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range;
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=300" };
    if (range && /^bytes=\d*-\d*$/.test(range)) {
      const parts = range.replace("bytes=", "").split("-");
      const start = parts[0] === "" ? st.size - Number(parts[1]) : Number(parts[0]);
      const end = parts[1] === "" || parts[0] === "" ? st.size - 1 : Number(parts[1]);
      if (start < 0 || end >= st.size || start > end) { res.writeHead(416, { "Content-Range": "bytes */" + st.size }); return res.end(); }
      headers["Content-Range"] = "bytes " + start + "-" + end + "/" + st.size;
      headers["Content-Length"] = end - start + 1;
      res.writeHead(206, headers);
      return fs.createReadStream(file, { start: start, end: end }).pipe(res);
    }
    headers["Content-Length"] = st.size;
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- الخادم ---------- */
loadDb();
const server = http.createServer(async function (req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.indexOf("/api/") === 0) return await api(req, res, url.pathname);
    if (req.method === "GET" && (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml")) {
      const base = "https://" + req.headers.host;
      const body = url.pathname === "/robots.txt"
        ? "User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\nSitemap: " + base + "/sitemap.xml\n"
        : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + base + '/</loc></url>\n' + (db.products || []).map(function (p) { return '  <url><loc>' + base + '/product.html?id=' + encodeURIComponent(p.id) + '</loc></url>\n'; }).join('') + '</urlset>\n';
      res.writeHead(200, { "Content-Type": url.pathname === "/robots.txt" ? "text/plain; charset=utf-8" : "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" });
      return res.end(body);
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, { ok: false, error: "طريقة الطلب غير مدعومة لهذا الملف" });
    }
    return staticFile(req, res, url.pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error("[خطأ]", e);
    if (!res.headersSent) send(res, status, { ok: false, error: status === 500 ? "حدث خطأ في الخادم، حاول مرة أخرى" : e.message });
    else res.end();
  }
});
server.on("error", function (e) { console.error("تعذّر تشغيل الخادم:", e.message); process.exit(1); });
server.listen(PORT, "0.0.0.0", function () {
  console.log("ألحان الخليج يعمل على المنفذ " + PORT);
  console.log("لوحة الإدارة: /admin.html");
});
process.on("uncaughtException", function (e) { console.error("[استثناء غير متوقع]", e); });
