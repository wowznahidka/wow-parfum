// GAS для WOW.PARFUM
// Вставити в Apps Script → Deploy → Web App → Anyone

var SHEET_NAME = 'Catalog';

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['ID', 'Назва', 'Ціна', "Об'єм", 'Фото', 'TG_Link', 'Дата', 'Опис']);
  }
  return sh;
}

// ── GET: роздати каталог сайту ──────────────────────────
function doGet(e) {
  var sh = getSheet();
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];

  var products = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = r[j];

    products.push({
      id:          String(obj['ID']    || i),
      name:        String(obj['Назва'] || ''),
      price:       Number(obj['Ціна']  || 0),
      sizes:       [String(obj["Об'єм"] || '100') + ' мл'],
      photo:       String(obj['Фото']   || ''),
      tgLink:      String(obj['TG_Link']|| ''),
      description: String(obj['Опис']  || ''),
    });
  }

  var dailyDeals = _getDailyDealIds(products, 3);

  return ContentService
    .createTextOutput(JSON.stringify({ products: products, dailyDeals: dailyDeals }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST: отримати дані від парсера ─────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'upsert') {
      upsertProduct(data);
      return ok('upserted');
    }

    return ok('unknown action');
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function upsertProduct(d) {
  var sh = getSheet();
  var rows = sh.getDataRange().getValues();
  var name = String(d.name || '').trim();

  // Шукаємо існуючий рядок по назві
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toLowerCase() === name.toLowerCase()) {
      // Оновлюємо
      sh.getRange(i + 1, 3).setValue(d.price       || rows[i][2]);
      sh.getRange(i + 1, 4).setValue(d.volume      || rows[i][3]);
      sh.getRange(i + 1, 5).setValue(d.photo       || rows[i][4]);
      sh.getRange(i + 1, 6).setValue(d.tg_link     || rows[i][5]);
      sh.getRange(i + 1, 7).setValue(new Date());
      sh.getRange(i + 1, 8).setValue(d.description || rows[i][7] || '');
      return;
    }
  }

  // Додаємо новий
  var newId = rows.length;
  sh.appendRow([newId, name, d.price || 0, d.volume || '100', d.photo || '', d.tg_link || '', new Date(), d.description || '']);
}

function ok(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Daily Deals (серверна сторона) ──────────────────────
function _mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function _getDailyDealIds(products, count) {
  var d = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  var rng = _mulberry32(seed);
  var arr = products.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr.slice(0, count).map(function(p) { return p.id; });
}
