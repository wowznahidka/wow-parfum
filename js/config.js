const CFG = {
  GAS_URL:  'https://script.google.com/macros/s/AKfycbw9dpHT1ZP24gluFQFsh6fQ9pS3IgEzsGPkQL_0HMGuuPRotOSQt5hgcMUIv3xRotTEUw/exec',
  // Після генерації VAPID в адмінці (/api/push/vapid-keygen) → скопіюй public key сюди
  VAPID_PUBLIC_KEY: '',
  TG_URL:   'https://t.me/wowparfum',
  IG_URL:   'https://instagram.com/wow.parfum',
  TT_URL:   'https://www.tiktok.com/@wowparfum',
  GA_ID:    'G-9L346ZDWLK',
  FB_PIXEL_ID: '970568042186153',
  TT_PIXEL_ID: '',
  OG_IMAGE: '',
  CACHE_KEY:    'wow_parfum_v1',
  CACHE_TTL_MS: 5 * 60 * 1000,
  MIN_PRODUCTS: 5,
  SIZES_MALE:   [30,50,75,100],
  SIZES_FEMALE: [30,50,75,100],
  SIZES_ALL:    [15,30,50,75,100,200],
  HOT_SIZES_MALE:   [50,100],
  HOT_SIZES_FEMALE: [50,100],
  GRID_BATCH: 24,
  MATCH_HISTORY_KEY: 'wow_parfum_seen',
};

const STATIC_REVIEWS = [
  { emoji:'😍', author:'Аня',    location:'Київ',   stars:5, text:'Якість відмінна, доставка швидка. Оплата після отримання — зручно!' },
  { emoji:'😄', author:'Максим', location:'Харків', stars:5, text:'Замовляю вже вдруге. Все відповідає опису. Рекомендую!' },
  { emoji:'😎', author:'Олена',  location:'Одеса',  stars:5, text:'Ціна нижче ніж в магазинах, якість не поступається. Відмінно!' },
  { emoji:'🤩', author:'Катя',   location:'Львів',  stars:4, text:'Доставка 2 дні, упаковка ціла. Задоволена покупкою!' },
  { emoji:'🙂', author:'Олег',   location:'Дніпро', stars:5, text:'Все чудово. Буду замовляти ще!' },
];
