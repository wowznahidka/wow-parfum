import asyncio
import os
import re
import requests
from collections import defaultdict
from telethon import TelegramClient

# ══════════════════════════════════════════
API_ID      = 39155326
API_HASH    = 'f5fdd929b4bcc48bb9970aa3b2945c18'
SOURCE_ID   = -1001604744008
TARGET_LINK = 'wowparfumua'
GAS_URL     = 'https://script.google.com/macros/s/AKfycbw9zB-WUX85ZnIUyzlA-tvdFAT-f6mrPyose3MOdScitYj9YZmYf6kXJwUPP6bkKxXr/exec'
MY_MARGIN   = 350
LAST_ID_FILE = 'parfum_last_id.txt'
# ══════════════════════════════════════════

client = TelegramClient('wow_parfum_session', API_ID, API_HASH)

# Слова що ТОЧНО не є назвою товару
SKIP_WORDS = [
    'поповнення', 'новинк', 'топ', 'хіт', 'акція', 'розпродаж',
    'батч', 'якість', 'кришечк', 'магнітн', 'люкс', 'оригінал',
    'замов', 'замовити', 'написати', 'zne', 'kazan',
    'нова пошт', 'укрпошт', 'доставк',
    'свіж', 'ідеальн', 'універсальн', 'компліментарн',
    'аромат літ', 'аромат сезон', 'аромат дня',
    'підписат', 'канал', 'відгук',
]

EMOJI_RE = re.compile(
    '[\U0001F300-\U0001F9FF\U0001FA00-\U0001FAFF'
    '\U00002600-\U000027FF\U0000FE00-\U0000FEFF'
    '⌀-⏿⬀-⯿■-⟿]+',
    flags=re.UNICODE
)


def clean(text):
    text = EMOJI_RE.sub('', text)
    text = re.sub(r'[*_`|➤►▶»«·•]', '', text)
    return re.sub(r'\s+', ' ', text).strip()


def is_product_name(line):
    """Назва парфуму: є латиниця, не занадто коротка/довга, не службова"""
    if not line or len(line) < 4 or len(line) > 90:
        return False
    if not re.search(r'[a-zA-Z]', line):   # обов'язково латиниця
        return False
    low = line.lower()
    return not any(w in low for w in SKIP_WORDS)


def parse_post(text):
    if not text:
        return None

    lines_raw = text.split('\n')
    lines = [clean(l) for l in lines_raw]

    # ── Назва ──────────────────────────────
    name = ''
    for line in lines:
        if is_product_name(line):
            name = line
            break

    if not name:
        return None

    # ── Ціна ───────────────────────────────
    price = 0
    # формат: "Ціна - 1450 грн" або просто "1450 грн"
    for pattern in [
        r'[Цц]іна[^\d]*(\d{3,5})',
        r'(\d{3,5})\s*грн',
    ]:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            v = int(m.group(1))
            if 200 <= v <= 8000:
                price = v
                break

    if price == 0:
        return None

    # ── Об'єм ──────────────────────────────
    volume = '100'
    vm = re.search(r'(\d{2,3})\s*мл', text, re.IGNORECASE)
    if vm:
        volume = vm.group(1)

    # ── Опис ───────────────────────────────
    # Все що не є назвою, ціною, об'ємом і службовим текстом
    DESC_SKIP = [
        'нова пошт', 'укрпошт', 'замов', 'доставк', 'підписат',
        'канал', 'відгук', 'написат', 'оплат', 'безкошт', 'батч',
    ]
    desc_lines = []
    for line in lines:
        if not line or len(line) < 5:
            continue
        if line == name:
            continue
        low = line.lower()
        if any(w in low for w in DESC_SKIP):
            continue
        if re.search(r'\d{3,5}\s*грн', line, re.IGNORECASE):
            continue
        if re.match(r'^\d{2,3}\s*мл$', line.strip(), re.IGNORECASE):
            continue
        desc_lines.append(line)
    description = '\n'.join(desc_lines[:4])

    return {
        'name': name,
        'price_buy': price,
        'price_sell': price + MY_MARGIN,
        'volume': volume,
        'description': description,
    }


def upload_photo(image_bytes):
    try:
        r = requests.post(
            'https://catbox.moe/user/api.php',
            data={'reqtype': 'fileupload'},
            files={'fileToUpload': ('photo.jpg', image_bytes, 'image/jpeg')},
            timeout=30
        )
        url = r.text.strip()
        return url if url.startswith('https://') else ''
    except Exception as e:
        print(f"    catbox: {e}")
        return ''


def make_caption(p):
    desc_part = f"\n_{p['description']}_\n" if p.get('description') else '\n'
    return (
        f"🌸 **{p['name']}**\n"
        f"{desc_part}"
        f"💰 Ціна: **{p['price_sell']} грн**\n"
        f"🧴 Об'єм: **{p['volume']} мл**\n"
        f"\n"
        f"✅ Оригінальна якість · Батч-код\n"
        f"📦 Нова Пошта · Укрпошта\n"
        f"\n"
        f"🛒 **[ЗАМОВИТИ](https://t.me/{TARGET_LINK})**"
    )


async def parse_once():
    print('\n🌸 WOW.PARFUM парсер запущено...')
    await client.start()
    await client.get_dialogs()

    source = await client.get_entity(SOURCE_ID)
    target = await client.get_entity(TARGET_LINK)

    last_id = 0
    if os.path.exists(LAST_ID_FILE):
        try:
            last_id = int(open(LAST_ID_FILE).read().strip())
        except:
            pass

    raw = await client.get_messages(source, limit=700, min_id=last_id)
    messages = list(reversed(raw))
    print(f"Повідомлень: {len(messages)}")

    # ── Групуємо альбоми за grouped_id ──
    groups  = defaultdict(list)
    singles = []
    for msg in messages:
        if msg.grouped_id:
            groups[msg.grouped_id].append(msg)
        else:
            singles.append(msg)

    # Список (головне_повідомлення, [медіа])
    tasks = []
    for grp in groups.values():
        grp.sort(key=lambda m: m.id)
        main = next((m for m in grp if m.text and m.text.strip()), None)
        if not main:
            continue
        media = [m.media for m in grp if m.media]
        tasks.append((main, media))

    for msg in singles:
        if msg.text and msg.text.strip() and msg.media:
            tasks.append((msg, [msg.media]))

    tasks.sort(key=lambda x: x[0].id)

    found = sum(1 for t, _ in tasks if parse_post(t.text))
    print(f"Продуктів знайдено: {found}")

    new_last_id = last_id

    for main_msg, media_list in tasks:
        p = parse_post(main_msg.text)
        if not p:
            continue

        print(f"\n  [{p['name']}]  {p['price_sell']} грн  {p['volume']} мл  ({len(media_list)} фото)")

        # Фото → catbox
        photo_url = ''
        try:
            img = await client.download_media(media_list[0], bytes)
            if img:
                photo_url = upload_photo(img)
                print(f"    📸 {photo_url or 'не завантажилось'}")
        except Exception as e:
            print(f"    фото помилка: {e}")

        # Публікуємо в наш канал
        caption = make_caption(p)
        tg_link = ''
        try:
            valid = [m for m in media_list if m][:10]
            sent = await client.send_file(target, valid, caption=caption)
            first = sent[0] if isinstance(sent, list) else sent
            tg_link = f"https://t.me/{TARGET_LINK}/{first.id}"
            print(f"    📢 {tg_link}")
        except Exception as e:
            print(f"    публікація помилка: {e}")
            # fallback — тільки перше фото
            try:
                sent = await client.send_file(target, media_list[0], caption=caption)
                tg_link = f"https://t.me/{TARGET_LINK}/{sent.id}"
                print(f"    📢 {tg_link} (1 фото)")
            except Exception as e2:
                print(f"    ❌ {e2}")
                continue

        # GAS
        try:
            r = requests.post(GAS_URL, json={
                "action": "upsert",
                "name": p['name'],
                "price": p['price_sell'],
                "volume": p['volume'],
                "photo": photo_url,
                "tg_link": tg_link,
                "description": p.get('description', ''),
            }, timeout=15)
            print(f"    📊 {r.text[:60]}")
        except Exception as e:
            print(f"    GAS: {e}")

        new_last_id = max(new_last_id, main_msg.id)
        open(LAST_ID_FILE, 'w').write(str(new_last_id))
        await asyncio.sleep(8)

    print('\n✅ Готово.')


async def run_loop():
    while True:
        await parse_once()
        print('\n⏳ Наступний запуск через 2 години...')
        await asyncio.sleep(7200)


if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(run_loop())
