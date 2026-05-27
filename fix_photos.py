"""
Фіксер: читає @wowparfumua, скачує фото, завантажує на catbox, оновлює GAS
Запусти один раз: python fix_photos.py
"""
import asyncio
import requests
from telethon import TelegramClient

API_ID      = 39155326
API_HASH    = 'f5fdd929b4bcc48bb9970aa3b2945c18'
OUR_CHANNEL = 'wowparfumua'
GAS_URL     = 'https://script.google.com/macros/s/AKfycbw9zB-WUX85ZnIUyzlA-tvdFAT-f6mrPyose3MOdScitYj9YZmYf6kXJwUPP6bkKxXr/exec'

client = TelegramClient('wow_parfum_session', API_ID, API_HASH)


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
    except:
        return ''


def extract_name_from_caption(text):
    if not text:
        return ''
    for line in text.split('\n'):
        line = line.strip().replace('*', '').replace('🌸', '').strip()
        if len(line) > 3 and not any(w in line.lower() for w in ['ціна', "об'єм", 'замов', 'пошт', 'якіст', 'батч']):
            return line
    return ''


async def fix():
    print('🔧 Фіксер фото запущено...')
    await client.start()
    channel = await client.get_entity(OUR_CHANNEL)

    messages = await client.get_messages(channel, limit=200)
    seen_ids = set()
    fixed = 0

    for msg in reversed(messages):
        if not msg.media or not msg.text:
            continue
        if msg.id in seen_ids:
            continue
        seen_ids.add(msg.id)

        name = extract_name_from_caption(msg.text)
        if not name:
            continue

        tg_link = f"https://t.me/{OUR_CHANNEL}/{msg.id}"
        print(f"\n  → {name}")

        try:
            photo_bytes = await client.download_media(msg.media, bytes)
            if not photo_bytes:
                continue
            photo_url = upload_photo(photo_bytes)
            if not photo_url:
                print(f"    фото не завантажилось")
                continue
            print(f"    фото: {photo_url}")
        except Exception as e:
            print(f"    помилка: {e}")
            continue

        try:
            r = requests.post(GAS_URL, json={
                "action": "upsert",
                "name": name,
                "photo": photo_url,
                "tg_link": tg_link,
            }, timeout=15)
            print(f"    GAS: {r.text[:60]}")
            fixed += 1
        except Exception as e:
            print(f"    GAS помилка: {e}")

        await asyncio.sleep(3)

    print(f'\n✅ Виправлено: {fixed} записів')


with client:
    client.loop.run_until_complete(fix())
