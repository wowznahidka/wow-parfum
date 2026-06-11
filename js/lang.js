/* ============================================================
   WOW.ZNAHIDKA — INTERNATIONALISATION
   UA (default) + EN strings
   ============================================================ */

const STRINGS = {
  ua: {
    splashYear:'NO PREPAYMENT', splashTag:'ПРЕМІУМ ПАРФУМИ',
    splashChoose:'Оберіть свій каталог',
    spNopay:'Без передоплати', spNp:'Нова Пошта', spFit:'Примірка',
    sblMale:'Чоловік', sblFemale:'Жінка',
    sbcMale:'Чоловічі аромати', sbcFemale:'Жіночі аромати',
    splashHint:'Можна змінити внизу сторінки',
    hdrSub:'ПРЕМІУМ ПАРФУМИ',
    greeting0:'Доброго ранку! ☀️', greeting1:'Привіт! 👋',
    greeting2:'Добрий вечір! 🌙', greeting3:'Доброї ночі! 🌟',
    homeTitle:'Твій ідеальний<br>аромат тут 🔥',
    popular:'🔥 Популярне зараз', newIn:'✨ Новинки',
    brands:'🌸 Бренди', recent:'👀 Нещодавно переглянуті',
    allModels:'Весь асортимент', seeAll:'Всі',
    navHome:'Головна', navMatch:'Match', navCatalog:'Каталог', navContacts:'Контакти',
    gMale:'♂ Чоловік', gFemale:'♀ Жінка',
    sizesIn:'Розміри: ',
    updated:'🔄 Оновлено: сьогодні о',
    searchPh:'Пошук по бренду або моделі…',
    models:'моделей',
    noSizes:'Немає товарів з вибраними розмірами',
    sizeLabel:'ОБʼЄМ',
    favsTitle:'Улюблені', cartTitle:'Кошик',
    favsEmpty:'Тут з\'являться товари,<br>які ти лайкнув у Match',
    cartEmpty:'Кошик порожній.<br>Додай аромати з Улюблених!',
    cartItems:'шт.',
    lastSizes:'🔴 Останні розміри!',
    noPrep:'Оплата після примірки на Новій Пошті. Без передоплати.',
    chooseSize:'📦 Обрати розмір',
    share:'🔗 Поділитись', telegram:'✈️ Telegram',
    matchTitle:'Match', matchHint:'Свайп вправо — ❤️ в Улюблені · вліво — пропустити',
    matchLike:'❤️ ЛАЙК', matchNope:'✕ ПРОПУСК',
    matchDone:'Ти переглянув усі аромати!',
    matchDoneSub:'Перевір Улюблені або онови колоду.',
    matchRestart:'🔄 Переглянути ще раз',
    tgBtn:'💬 Написати нам',
    sendReview:'Надіслати відгук',
    reviewsTitle:'💬 Що кажуть покупці',
    leaveReview:'✍️ Залишити відгук',
    cartCheckout:'Оформити замовлення <span class="i-arr-lg" aria-hidden="true"></span>',
    cartDelivery:'За тарифами НП',
    cartToPay:'До сплати',
    chooseSizeTitle:'Оберіть розмір',
    mySizeLabel:'Мій розмір',
    mySizeTap:'Натисни щоб вибрати <span class="i-arr" aria-hidden="true"></span>',
    alsoSee:'Також дивляться:',
    requestPhoto:'📸 Запросити фото',
    confirmAdd:'Додати в кошик',
    orderTitle:'📦 Оформлення',
    codTitle:'Оплата після примірки',
    codSub:'Без передоплати · Нова Пошта',
    formName:'Ваше ім\'я', namePh:'Ім\'я та прізвище', nameErr:'Введіть ваше ім\'я',
    formPhone:'Телефон', phonePh:'+380 (XX) XXX-XX-XX', phoneErr:'Введіть повний номер телефону',
    formCity:'Місто', cityPh:'Наприклад: Київ', cityErr:'Введіть назву міста',
    formDept:'Номер відділення', deptPh:'Наприклад: 12', deptErr:'Введіть номер відділення або поштомату',
    formPost:'Номер поштомату', postPh:'Наприклад: 5043',
    tabDept:'🏢 Відділення', tabPost:'📮 Поштомат',
    promoPh:'Промокод (якщо є)', promoApply:'Застосувати',
    submitOrder:'✅ Підтвердити замовлення',
    submitting:'⏳ Відправляємо…',
    orderSuccess:'Замовлення прийнято!',
    orderSuccessSub:'Ми зв\'яжемося з вами найближчим часом.',
    ratingLabel:'Ваша оцінка',
    revNamePh:'Ваше ім\'я та місто (напр. Аня, Київ)',
    revTextPh:'Розкажіть про ваш досвід замовлення…',
    priceAll:'Всі ціни', priceLow:'До 2000₴', priceMid:'2000–3500₴', priceHigh:'3500₴+',
    cartRowItems:'Товари', cartRowDelivery:'Доставка', csbLabel:'ароматів у кошику',
    scarcity1:'⚡️ Останній розмір!', scarcityLow:'🔥 Лише', scarcityLowSuffix:' розміри',
    faqTitle:'❓ Часті запитання',
    faqItems:[
      {q:'Потрібна передоплата?', a:'Ні! Жодної передоплати. Ти отримуєш посилку на відділення Нової Пошти, примірюєш — і лише тоді платиш. Не підійшло? Повертаєш і нічого не платиш. 100% гарантія задоволення.'},
      {q:'Як відбувається доставка?', a:'Відправляємо Новою Поштою по всій Україні. Терміни: 1–3 робочих дні. Доставка — за тарифами НП (зазвичай 50–80₴). Ти отримуєш трекінг-номер і можеш відстежити посилку онлайн.'},
      {q:'Чи є доставка за кордон?', a:'Так! Відправляємо у Польщу, Чехію, Словаччину та інші країни ЄС через міжнародні служби доставки. Уточнення деталей і вартості — через Telegram.'},
      {q:'Як обрати правильний розмір?', a:'Напиши нам у Telegram — підберемо розмір за довжиною стопи або звичним розміром. Також можна примірювати прямо на відділенні: відкрив посилку, виміряв — і вирішив. Ніяких ризиків!'},
      {q:'Що якщо не підійшли?', a:'Просто відмовся від посилки на відділенні або поверни назад — без жодних витрат з твого боку. Ми покриваємо зворотню доставку. Ніяких питань, ніяких проблем.'},
    ],
    // ── 2026 нові рядки ──
    trustNoPrepay:'0₴ передоплати', trustTopQuality:'Топ якість', trustFast:'1–3 дні',
    counterTpl:'моделей в наявності',
    ddEyebrow:'Випадкові 3 аромати', ddTitle:'Знахідка дня', ddTimerLbl:'До оновлення:',
    ddSubtitle:'3 моделі щодня <b>з безкоштовною доставкою</b>',
    giftCtaTitle:'🎁 Відкрий подарунок дня',
    giftCtaSub:'3 аромати з <b>безкоштовною доставкою</b> · лише сьогодні',
    catQAll:'Всі', catQDiscount:'🔥 Знижки', catQNew:'✨ Новинки', catQFree:'🚚 Безкоштовна',
    sortLabel:'Сортувати', sortPopular:'🔥 Популярне', sortNew:'✨ Новинки',
    sortPriceAsc:'↑ Ціна: дешевше', sortPriceDesc:'↓ Ціна: дорожче', sortDiscount:'🎁 Найбільша знижка',
    afClearAll:'Скинути все',
    rvTitle:'Нещодавно переглянуті', rvClear:'Очистити',
    findYourPair:'Знайди свій аромат 🔥',
    bannerTag:'PREMIUM PARFUM STORE',
    bannerStat1:'моделей', bannerStat2:'передоплати', bannerStat3:'дні доставка',
    refTag:'🤝 РЕФЕРАЛЬНА', refTitle:'Поділись і заробляй',
    refSub:'Поширюй своє посилання у соцмережах. <b>Винагороду уточни в менеджера</b> — рахуємо персонально під твою активність.',
    refStat1Lbl:'уточни в TG', refStat2Lbl:'друзів', refStat3Lbl:'cookie життя',
    refBtn:'🔗 Отримати моє посилання', refHint:'Пиши менеджеру в Telegram — обговоримо умови',
    tgCtaEyebrow:'ЕКСКЛЮЗИВНО В TELEGRAM', tgCtaTitle:'Підпишись на канал',
    tgCtaSub:'Перші — про знижки, дропи нових моделей, ексклюзивні розіграші',
    ciDelivery:'Доставка по Україні', ciDeliverySub:'Нова Пошта · 1–3 дні · ~50–80₴ · Оплата після примірки',
    ciIntl:'Міжнародна доставка', ciIntlSub:'Польща, Чехія, Словаччина та інші країни ЄС',
    ciReturn:'Повернення безкоштовно', ciReturnSub:'Не підійшло — просто відмовся на відділенні, без витрат',
  },
  en: {
    splashYear:'NO PREPAYMENT', splashTag:'PREMIUM PARFUMS',
    splashChoose:'Choose your catalog',
    spNopay:'No prepayment', spNp:'Nova Poshta', spFit:'Try-on',
    sblMale:'Men', sblFemale:'Women',
    sbcMale:'Men fragrances', sbcFemale:'Women fragrances',
    splashHint:'You can change this anytime',
    hdrSub:'PREMIUM PARFUMS',
    greeting0:'Good morning! ☀️', greeting1:'Hi there! 👋',
    greeting2:'Good evening! 🌙', greeting3:'Good night! 🌟',
    homeTitle:'Your perfect<br>fragrance is here 🔥',
    popular:'🔥 Trending now', newIn:'✨ New arrivals',
    brands:'🌸 Brands', recent:'👀 Recently viewed',
    allModels:'Full catalog', seeAll:'All',
    navHome:'Home', navMatch:'Match', navCatalog:'Catalog', navContacts:'Contact',
    gMale:'♂ Men', gFemale:'♀ Women',
    sizesIn:'Sizes: ',
    updated:'🔄 Updated: today at',
    searchPh:'Search brand or model…',
    models:'models',
    noSizes:'No items with selected sizes',
    sizeLabel:'VOLUME',
    favsTitle:'Favourites', cartTitle:'Cart',
    favsEmpty:'Items you liked in Match<br>will appear here',
    cartEmpty:'Cart is empty.<br>Add fragrances from Favourites!',
    cartItems:'item(s)',
    lastSizes:'🔴 Last sizes!',
    noPrep:'Pay after try-on at Nova Poshta. No prepayment.',
    chooseSize:'📦 Choose size',
    share:'🔗 Share', telegram:'✈️ Telegram',
    matchTitle:'Match', matchHint:'Swipe right to like · left to skip',
    matchLike:'❤️ LIKE', matchNope:'✕ SKIP',
    matchDone:'You\'ve seen all fragrances!',
    matchDoneSub:'Check Favourites or refresh the deck.',
    matchRestart:'🔄 See again',
    tgBtn:'💬 Contact us',
    sendReview:'Submit review',
    reviewsTitle:'💬 Customer reviews',
    leaveReview:'✍️ Leave a review',
    cartCheckout:'Place order <span class="i-arr-lg" aria-hidden="true"></span>',
    cartDelivery:'Nova Poshta rates',
    cartToPay:'Total',
    chooseSizeTitle:'Choose size',
    mySizeLabel:'My size',
    mySizeTap:'Tap to select <span class="i-arr" aria-hidden="true"></span>',
    alsoSee:'Also viewed:',
    requestPhoto:'📸 Request photo',
    confirmAdd:'Add to cart',
    orderTitle:'📦 Order',
    codTitle:'Pay after try-on',
    codSub:'No prepayment · Nova Poshta',
    formName:'Your name', namePh:'First and last name', nameErr:'Please enter your name',
    formPhone:'Phone', phonePh:'+380 (XX) XXX-XX-XX', phoneErr:'Enter a valid phone number',
    formCity:'City', cityPh:'e.g. Kyiv', cityErr:'Enter your city',
    formDept:'Branch number', deptPh:'e.g. 12', deptErr:'Enter branch or parcel locker number',
    formPost:'Parcel locker number', postPh:'e.g. 5043',
    tabDept:'🏢 Branch', tabPost:'📮 Parcel locker',
    promoPh:'Promo code (if any)', promoApply:'Apply',
    submitOrder:'✅ Confirm order',
    submitting:'⏳ Sending…',
    orderSuccess:'Order received!',
    orderSuccessSub:'We\'ll contact you shortly.',
    ratingLabel:'Your rating',
    revNamePh:'Your name and city (e.g. Ann, Kyiv)',
    revTextPh:'Tell us about your experience…',
    priceAll:'All prices', priceLow:'Under ₴2000', priceMid:'₴2000–3500', priceHigh:'₴3500+',
    cartRowItems:'Items', cartRowDelivery:'Delivery', csbLabel:'items in cart',
    scarcity1:'⚡️ Last size!', scarcityLow:'🔥 Only', scarcityLowSuffix:' sizes left',
    faqTitle:'❓ FAQ',
    faqItems:[
      {q:'No prepayment required?', a:'No prepayment! You receive your package at Nova Poshta, try it on — and only then pay. Not a fit? Return it for free. 100% satisfaction guaranteed.'},
      {q:'How does delivery work?', a:'We ship via Nova Poshta across all of Ukraine. Delivery: 1–3 business days. Standard Nova Poshta rates apply (usually ₴50–80). You receive a tracking number to follow your parcel online.'},
      {q:'Do you ship internationally?', a:'Yes! We ship to Poland, Czech Republic, Slovakia and other EU countries. Contact us on Telegram for details and shipping costs.'},
      {q:'How to choose the right size?', a:'Message us on Telegram — we\'ll recommend a size based on foot length or your usual size. You can also try on at the branch: open the parcel, check the fit — and decide. Zero risk!'},
      {q:'What if it doesn\'t fit?', a:'Simply refuse the parcel at the branch or return it — at no cost to you. We cover return shipping. No questions asked, no hassle.'},
    ],
    // ── 2026 strings ──
    trustNoPrepay:'₴0 prepayment', trustTopQuality:'Top quality', trustFast:'1–3 days',
    counterTpl:'models in stock',
    ddEyebrow:'3 random fragrances', ddTitle:'Daily find', ddTimerLbl:'Updates in:',
    ddSubtitle:'3 models daily <b>with free shipping</b>',
    giftCtaTitle:'🎁 Open today\'s gift',
    giftCtaSub:'3 fragrances with <b>free shipping</b> · today only',
    catQAll:'All', catQDiscount:'🔥 Sale', catQNew:'✨ New', catQFree:'🚚 Free shipping',
    sortLabel:'Sort by', sortPopular:'🔥 Popular', sortNew:'✨ Newest',
    sortPriceAsc:'↑ Price: low to high', sortPriceDesc:'↓ Price: high to low', sortDiscount:'🎁 Biggest discount',
    afClearAll:'Clear all',
    rvTitle:'Recently viewed', rvClear:'Clear',
    findYourPair:'Find your fragrance 🔥',
    bannerTag:'PREMIUM PARFUM STORE',
    bannerStat1:'models', bannerStat2:'prepayment', bannerStat3:'days delivery',
    refTag:'🤝 REFERRAL', refTitle:'Share & earn',
    refSub:'Share your link on social. <b>Ask the manager about reward</b> — calculated per your activity.',
    refStat1Lbl:'ask in TG', refStat2Lbl:'friends', refStat3Lbl:'cookie days',
    refBtn:'🔗 Get my link', refHint:'Message the manager on Telegram for terms',
    tgCtaEyebrow:'EXCLUSIVE ON TELEGRAM', tgCtaTitle:'Subscribe to channel',
    tgCtaSub:'First to know about sales, drops, exclusive giveaways',
    ciDelivery:'Delivery in Ukraine', ciDeliverySub:'Nova Poshta · 1–3 days · ~₴50–80 · Pay after try-on',
    ciIntl:'International delivery', ciIntlSub:'Poland, Czech Republic, Slovakia and other EU countries',
    ciReturn:'Free returns', ciReturnSub:'Not a fit — just refuse at the branch, no costs',
  }
};

// Active language strings (mutable reference)
let L = STRINGS[S.lang] || STRINGS.ua;

function toggleLang() {
  S.lang = S.lang === 'en' ? 'ua' : 'en';
  L = STRINGS[S.lang];
  localStorage.setItem('wow_lang', S.lang);
  applyLang();
  refreshCurrentTab();
}

function applyLang() {
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = S.lang === 'en' ? 'EN' : 'UA';

  _setText('hdr-sub', L.hdrSub);

  // Nav labels
  [['home','navHome'],['match','navMatch'],['catalog','navCatalog'],['contacts','navContacts']].forEach(([tab,key]) => {
    const el = document.querySelector(`.nav-item[data-tab="${tab}"] .nav-label`);
    if (el) el.textContent = L[key];
    const dsk = document.getElementById('dsk-btn-' + tab);
    if (dsk) dsk.textContent = L[key];
  });

  // Gender toggle (home) + g-chip (match/catalog)
  document.querySelectorAll('.g-btn[data-gender="male"] .g-lbl, .g-chip[data-gender="male"]').forEach(el => el.textContent = L.gMale);
  document.querySelectorAll('.g-btn[data-gender="female"] .g-lbl, .g-chip[data-gender="female"]').forEach(el => el.textContent = L.gFemale);

  // Catalog
  const search = document.getElementById('cat-search');
  if (search) search.placeholder = L.searchPh;
  document.querySelectorAll('.cat-quick[data-quick="all"] span').forEach(el => el.textContent = L.catQAll);
  document.querySelectorAll('.cat-quick[data-quick="discount"] span').forEach(el => el.textContent = L.catQDiscount);
  document.querySelectorAll('.cat-quick[data-quick="new"] span').forEach(el => el.textContent = L.catQNew);
  document.querySelectorAll('.cat-quick[data-quick="free"] span').forEach(el => el.textContent = L.catQFree);

  // Sort dropdown
  const sortSel = document.getElementById('cat-sort');
  if (sortSel) {
    const opts = sortSel.options;
    if (opts.length >= 5) {
      opts[0].text = L.sortPopular; opts[1].text = L.sortNew;
      opts[2].text = L.sortPriceAsc; opts[3].text = L.sortPriceDesc;
      opts[4].text = L.sortDiscount;
    }
  }

  // Daily Find
  _setTextSel('#daily-deals-section .sec-eyebrow', '', L.ddEyebrow, true);
  _setTextSel('#daily-deals-section .dd-title', '', L.ddTitle);
  const ddSub = document.querySelector('#daily-deals-section .dd-subtitle');
  if (ddSub) ddSub.innerHTML = L.ddSubtitle;
  _setTextSel('#daily-deals-section .dd-timer-lbl', '', L.ddTimerLbl);

  // Hero trust chips
  const trustItems = document.querySelectorAll('.hero-trust-item');
  if (trustItems.length >= 3) {
    _replaceTextNode(trustItems[0], L.trustNoPrepay);
    _replaceTextNode(trustItems[1], L.trustTopQuality);
    _replaceTextNode(trustItems[2], L.trustFast);
  }

  // Home counter — keep number, change suffix
  const counterChip = document.querySelector('.home-counter-chip');
  if (counterChip) {
    const txt = counterChip.childNodes;
    for (const n of txt) {
      if (n.nodeType === 3 && n.textContent.trim() && !/^\d+/.test(n.textContent.trim())) {
        n.textContent = ' ' + L.counterTpl;
        break;
      }
    }
  }

  // Section headings
  document.querySelectorAll('.sec-title').forEach(el => {
    const txt = el.textContent.trim();
    if (txt.includes('Популярне') || txt.includes('Trending')) el.textContent = L.popular;
    else if (txt.includes('Новинки') || txt.includes('New arrivals')) el.textContent = L.newIn;
    else if (txt.includes('Бренди') || txt.includes('Brands')) el.textContent = L.brands;
    else if (txt.includes('Нещодавно') || txt.includes('Recently')) el.textContent = L.rvTitle;
    else if (txt.includes('Що кажуть') || txt.includes('Customer reviews')) el.textContent = L.reviewsTitle;
    else if (txt.includes('Весь асортимент') || txt.includes('Full catalog')) el.textContent = L.allModels;
  });

  // Recently viewed clear button
  const rvClear = document.querySelector('.rv-clear');
  if (rvClear) rvClear.textContent = L.rvClear;

  // "Знайди свою пару"
  _setTextSel('.cat-vibe-line', '', L.findYourPair.replace(' 🔥','').trim());

  // Contacts banner
  _setTextSel('.contacts-banner-tag', '', L.bannerTag);
  const stats = document.querySelectorAll('.cb-stat-lbl');
  if (stats.length >= 3) {
    stats[0].textContent = L.bannerStat1;
    stats[1].textContent = L.bannerStat2;
    stats[2].textContent = L.bannerStat3;
  }

  // Contacts list (delivery/intl/return)
  const ciTitles = document.querySelectorAll('.contact-item .ci-title');
  const ciSubs   = document.querySelectorAll('.contact-item .ci-sub');
  const ciData = [[L.ciDelivery,L.ciDeliverySub],[L.ciIntl,L.ciIntlSub],[L.ciReturn,L.ciReturnSub]];
  ciTitles.forEach((el,i) => { if (ciData[i]) el.textContent = ciData[i][0]; });
  ciSubs.forEach((el,i) => { if (ciData[i]) el.textContent = ciData[i][1]; });

  // Referral section
  _setTextSel('.ref-section-tag', '', L.refTag);
  _setTextSel('.ref-section-title', '', L.refTitle);
  const refSub = document.querySelector('.ref-section-sub');
  if (refSub) refSub.innerHTML = L.refSub;
  const refLbls = document.querySelectorAll('.ref-stat-lbl');
  if (refLbls.length >= 3) {
    refLbls[0].textContent = L.refStat1Lbl;
    refLbls[1].textContent = L.refStat2Lbl;
    refLbls[2].textContent = L.refStat3Lbl;
  }
  const refBtn = document.querySelector('.ref-section-btn > span:first-child');
  if (refBtn) refBtn.textContent = L.refBtn;
  _setTextSel('.ref-section-hint', '', L.refHint);

  // TG Channel CTA
  _setTextSel('.tg-cta-eyebrow', 'dot', L.tgCtaEyebrow);
  _setTextSel('.tg-cta-title', '', L.tgCtaTitle);
  _setTextSel('.tg-cta-sub', '', L.tgCtaSub);

  // Gift box CTA (if rendered)
  const giftStrong = document.querySelector('.dd-gift-cta strong');
  const giftSpan   = document.querySelector('.dd-gift-cta span');
  if (giftStrong) giftStrong.textContent = L.giftCtaTitle;
  if (giftSpan)   giftSpan.innerHTML     = L.giftCtaSub;

  // Match
  _setTextSel('.match-hint', '', L.matchHint);

  // Cart
  _setTextSel('.sh-title-cart', '', L.cartTitle);

  updateTimestamp();
  if (typeof renderFaq === 'function') renderFaq();
}

// Helper: set text of element matched by selector. ignoreChild = class name to preserve (sets only LAST text node)
function _setTextSel(sel, ignoreChild, val, addIcon) {
  const el = document.querySelector(sel);
  if (!el) return;
  // знаходимо текстовий вузол, не зачіпаючи дочірні елементи (іконки/SVG)
  let txtNode = null;
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.textContent.trim()) { txtNode = n; break; }
  }
  if (txtNode) txtNode.textContent = (txtNode.textContent.startsWith(' ') ? ' ' : '') + val;
  else el.appendChild(document.createTextNode(val));
}

function _replaceTextNode(el, val) {
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.textContent.trim()) {
      n.textContent = val;
      return;
    }
  }
  el.appendChild(document.createTextNode(val));
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
