/* ===================================================
   ألحان الخليج — ملف الإعدادات والمحتوى
   عدّل هذا الملف لتغيير الرقم والأسعار والمنتجات والفنانين دون لمس الكود.
   =================================================== */
window.SITE_CONFIG = {
  brand: {
    name: "ألحان الخليج",
    nameEn: "Alhan Al-Khaleej",
    tagline: "زفّتك بأسمائكم.. لحنٌ يليق بليلتكم",
    currency: "ر.س"
  },

  // استبدل الرقم برقم واتساب الحقيقي بصيغة دولية بدون + أو مسافات
  whatsapp: "967779000996",

  // روابط التواصل الاجتماعي: تُدار من لوحة الإدارة ← الإعدادات. الفارغ لا يظهر في الموقع.
  social: { instagram: "", tiktok: "", snapchat: "", youtube: "", x: "", facebook: "" },

  deliveryHours: { standard: 72, express: 24 },

  // قائمة المناسبات الرئيسية (تُستخدم في النموذج وفي بطاقات الصفحة)
  occasions: [
    { id: "wedding-groom", label: "زفة عريس", img: "assets/cat-wedding.jpg" },
    { id: "wedding-bride", label: "زفة عروس", img: "assets/cat-wedding.jpg" },
    { id: "mother-bride", label: "زفة أم العروس", img: "assets/cat-wedding.jpg" },
    { id: "koshah", label: "أغنية كوشة", img: "assets/cat-koshah.jpg" },
    { id: "talla", label: "موسيقى طلة", img: "assets/cat-talla.jpg" },
    { id: "graduation", label: "تخرج", img: "assets/cat-graduation.jpg" },
    { id: "birth", label: "مولود جديد", img: "assets/cat-birth.jpg" },
    { id: "birthday", label: "عيد ميلاد", img: "assets/cat-birthday.jpg" },
    { id: "retirement", label: "تقاعد", img: "assets/cat-retirement.jpg" },
    { id: "other", label: "مناسبة أخرى", img: "assets/cat-other.jpg" }
  ],

  // قوائم القائمة العلوية المنسدلة (شيلات / زفات / ألحان الشيلات)
  menu: {
    shilat: [
      { label: "شيلات زواج", id: "shilat-wedding" },
      { label: "شيلات تخرج بنات", id: "shilat-grad-girls" },
      { label: "شيلات تخرج أولاد", id: "shilat-grad-boys" },
      { label: "شيلات مواليد", id: "shilat-birth" },
      { label: "شيلات عروس", id: "shilat-bride" },
      { label: "شيلات عريس", id: "shilat-groom" },
      { label: "شيلات تقاعد", id: "shilat-retire" }
    ],
    zaffat: [
      { label: "زفات عريس", id: "zaffa-groom" },
      { label: "زفات عروس", id: "zaffa-bride" },
      { label: "زفات مسار", id: "zaffa-masar" },
      { label: "زفات أم العروس", id: "zaffa-mother" },
      { label: "زفات مواليد", id: "zaffa-birth" }
    ],
    tunes: [
      { label: "ألحان الشيلات", id: "tune-shilat" },
      { label: "موسيقى طلة", id: "talla" },
      { label: "أغنية كوشة", id: "koshah" }
    ]
  },

  // الفنانون / المنشدون (أسماء توضيحية — استبدلها بأسماء فريقك الحقيقي)
  artists: [
    { id: "a1", name: "المنشد سالم العتيبي", initials: "س ع" },
    { id: "a2", name: "المنشد ماجد الحربي", initials: "م ح" },
    { id: "a3", name: "المنشد عبدالله الشهري", initials: "ع ش" },
    { id: "a4", name: "المنشد فهد القحطاني", initials: "ف ق" },
    { id: "a5", name: "المنشد خالد الغامدي", initials: "خ غ" },
    { id: "a6", name: "المنشد ناصر الدوسري", initials: "ن د" },
    { id: "a7", name: "المنشدة لينا الزهراني", initials: "ل ز" },
    { id: "a8", name: "المنشد يوسف المالكي", initials: "ي م" }
  ],

  // المنتجات (الزفات والشيلات الجاهزة للطلب والمعاينة)
  products: [
    { id: "p1", title: "شيلة زواج باسم خالد — ليلة فرح", cat: "shilat-wedding", img: "assets/prod-p1.jpg", artist: "a1", price: 575, oldPrice: 900, duration: "02:26", sales: 175, tags: ["قابل للتعديل", "الأكثر طلباً"], isNew: false },
    { id: "p2", title: "زفة عريس باسم فيصل — زواج الشهم", cat: "zaffa-groom", img: "assets/prod-p2.jpg", artist: "a2", price: 625, oldPrice: 875, duration: "02:40", sales: 120, tags: ["الأكثر طلباً"], isNew: true },
    { id: "p3", title: "شيلة تخرج باسم غلا — افرحي يابنيتي", cat: "shilat-grad-girls", img: "assets/prod-p3.jpg", artist: "a3", price: 625, oldPrice: 950, duration: "02:15", sales: 98, tags: ["قابل للتعديل"], isNew: false },
    { id: "p4", title: "زفة عروس — اقبلت احلى عروس", cat: "zaffa-bride", img: "assets/prod-p4.jpg", artist: "a4", price: 575, oldPrice: 1000, duration: "02:31", sales: 88, tags: ["جديد"], isNew: true },
    { id: "p5", title: "شيلة تخرج ضابط — يوم تخريجه", cat: "shilat-grad-boys", img: "assets/prod-p5.jpg", artist: "a5", price: 625, oldPrice: 875, duration: "02:20", sales: 70, tags: [], isNew: false },
    { id: "p6", title: "زفة مولود — عطانا الله", cat: "zaffa-birth", img: "assets/prod-p6.jpg", artist: "a6", price: 625, oldPrice: 950, duration: "02:05", sales: 43, tags: ["قابل للتعديل"], isNew: false },
    { id: "p7", title: "شيلة أم العروس — بنت الشيوخ", cat: "shilat-groom", img: "assets/prod-p7.jpg", artist: "a7", price: 625, oldPrice: 850, duration: "02:18", sales: 39, tags: ["الأكثر طلباً"], isNew: false },
    { id: "p8", title: "زفة مسار — شمس الكواكب", cat: "zaffa-masar", img: "assets/prod-p8.jpg", artist: "a8", price: 575, oldPrice: 850, duration: "02:36", sales: 40, tags: [], isNew: false },
    { id: "p9", title: "شيلة تقاعد — عمر العطاء", cat: "shilat-retire", img: "assets/prod-p9.jpg", artist: "a2", price: 575, oldPrice: 900, duration: "02:12", sales: 22, tags: ["جديد"], isNew: true },
    { id: "p10", title: "شيلة عروس باسم رهف — شيخة زمنها", cat: "shilat-bride", img: "assets/prod-p10.jpg", artist: "a3", price: 625, oldPrice: 850, duration: "02:22", sales: 43, tags: ["قابل للتعديل"], isNew: false },
    { id: "p11", title: "زفة أم العروس — تم الفرح", cat: "zaffa-mother", img: "assets/cat-wedding.jpg", artist: "a4", price: 575, oldPrice: 1000, duration: "02:28", sales: 37, tags: [], isNew: false },
    { id: "p12", title: "أغنية كوشة — ليلة العمر", cat: "koshah", img: "assets/cat-koshah.jpg", artist: "a1", price: 750, oldPrice: 1200, duration: "03:05", sales: 19, tags: ["حصري"], isNew: true }
  ],

  // شرائح الصفحة الرئيسية
  slides: [
    { title: "صمّم شيلتك!", sub: "شيلات مخصصة بأسماء أحبتك بأصوات نخبة من المنشدين", cta: "ابدأ التصميم", target: "#builder", img: "assets/hero.jpg" },
    { title: "زفات تليق بليلة العمر", sub: "زفات زواج ومسار وكوشة وموسيقى طلة بتسليم سريع", cta: "تصفح الزفات", target: "#catalog", img: "assets/cat-koshah.jpg" },
    { title: "أشياء تفرح أحبتك", sub: "تخرج، مواليد، تقاعد، وكل مناسبة لها لحنها", cta: "استعرض المناسبات", target: "#categories", img: "assets/cat-graduation.jpg" }
  ],

  // الباقات
  packages: [
    { id: "basic", name: "الاقتصادية", price: 200, desc: "زفة بالاسم بصوت من فريقنا، بدون موسيقى إضافية.", features: ["اسم واحد أو اثنان", "صوت من فريق الأداء", "ملف MP3 عالي الجودة", "تسليم خلال 72 ساعة"] },
    { id: "standard", name: "القياسية", price: 350, desc: "الباقة الأكثر طلباً: موسيقى جاهزة مع الاسم والترحيب.", features: ["أسماء متعددة", "موسيقى جاهزة من مكتبتنا", "ترحيب بالضيوف", "ملف MP3 + نسخة للهاتف"], popular: true },
    { id: "premium", name: "المميزة", price: 550, desc: "كلمات مكتوبة خصيصاً لكم مع موسيقى حصرية.", features: ["كلمات مخصصة بالكامل", "موسيقى حصرية", "مونتاج احترافي", "نسخة قصيرة للسوشيال ميديا"] }
  ],

  addons: [
    { id: "express", label: "تسليم عاجل خلال 24 ساعة", price: 150 },
    { id: "short", label: "نسخة قصيرة (30 ثانية) للسوشيال", price: 50 },
    { id: "hq", label: "ملف WAV عالي الدقة", price: 30 },
    { id: "video", label: "فيديو جاهز بصورة العروسين", price: 120 }
  ],

  // المناسبات داخل نموذج الطلب
  styles: [],

  // التقييمات الحقيقية تأتي من العملاء عبر الموقع وتُعتمد من لوحة الإدارة
  reviews: [],

  faqs: [
    { q: "كم يستغرق تنفيذ الطلب؟", a: "التسليم القياسي خلال 72 ساعة، والتسليم العاجل خلال 24 ساعة مقابل رسوم إضافية." },
    { q: "هل يمكنني تعديل الاسم بعد التنفيذ؟", a: "نعم، يمكنك طلب تعديل واحد مجاناً خلال 48 ساعة من التسليم إذا كان التعديل في الاسم أو التاريخ فقط." },
    { q: "ما طريقة الدفع؟", a: "نقبل التحويل البنكي والدفع عبر المحافظ الإلكترونية. يتم تأكيد الطلب بعد استلام العربون." },
    { q: "هل الزفة مرخصة للاستخدام؟", a: "الزفات المخصصة تُنفذ لاستخدامكم الشخصي في مناسباتكم. الاستخدام التجاري يحتاج اتفاقاً خاصاً." },
    { q: "كيف أستلم الملف؟", a: "يُرسل الملف عبر واتساب أو البريد الإلكتروني بصيغة MP3، ويمكنك تحميله مباشرة." },
    { q: "هل أستطيع معاينة الشيلة قبل الشراء؟", a: "نعم، كل منتج في المتجر له معاينة صوتية مختصرة، ويمكنك طلب عينة مخصصة بأسمائكم." }
  ]
  ,
  /* أعمالنا — الأعمال المنفذة (صور وصوت وفيديو). يُستخدم هذا القسم احتياطياً
     عند تعذّر الاتصال بالخادم؛ الإضافة الرسمية تتم من لوحة الإدارة /admin.html */
  // ساعات الرد على الواتساب بتوقيت عدن (تُراجع من المالك)
  replyHours: { from: 9, to: 23 },

  // الأسئلة الشائعة: إجابات تصف ما يفعله الموقع فعلاً، وتفاصيل الدفع والتعديل تُؤكَّد عبر واتساب
  faqs: [
    { q: "كم يستغرق تنفيذ الطلب؟", a: "مدة التسليم تظهر في ملخص طلبك قبل الإرسال: التسليم القياسي خلال 72 ساعة، والعاجل خلال 24 ساعة." },
    { q: "هل يمكنني تعديل الاسم بعد التنفيذ؟", a: "نعم. تواصل معنا على واتساب مع رقم طلبك قبل التسليم، وسنراجع التعديل معك." },
    { q: "كيف أدفع ثمن الطلب؟", a: "يُؤكَّد الطلب بعد إرساله عبر واتساب، وتوضح لك رسالة التأكيد طريقة الدفع المتاحة." },
    { q: "ما الذي تتضمنه المعاينة في صفحة المنتج؟", a: "صفحة المنتج تعرض وصفه وسعره ومنشده. للاستماع إلى أعمال منفذة فعلاً، انظر قسم أعمالنا." },
    { q: "كيف أستلم الملف؟", a: "يُرسل الملف النهائي إلى رقم الواتساب الذي أدخلته في الطلب." }
  ],

  // أعمالنا: تُضاف الأعمال المنفّذة من لوحة الإدارة فقط (لا توجد عينات)
  works: []
};
