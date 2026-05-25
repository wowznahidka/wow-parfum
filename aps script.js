const SUPPLIERS = [
  { id: "1WjRRBuZWCp6QnNzrJQMX5NUREhFEbXyRQ9Uk_Oi6LiI", gender: "Чоловік" },
  { id: "14x32aRMF4G_45DweNKx3nMQlxsYIeZdwxJDrK8d1N5k", gender: "Жінка" }
];

const HEADERS = [
  "ID",
  "Бренд",
  "Назва",
  "Ціна",
  "Стара ціна",
  "Фото",
  "Розміри",
  "Нове",
  "Стать",
  "Постачальник"
];

const SKIP_KEYWORDS = [
  "одяг",
  "барсетк",
  "рюкзак",
  "шнурк",
  "шкарпет",
  "шапк",
  "кепк",
  "ремен",
  "yarm",
  "general_stores",
  "babylon drop"
];

const KNOWN_BRANDS = [
  "Nike",
  "Adidas",
  "New Balance",
  "Jordan",
  "Air Jordan",
  "Puma",
  "Asics",
  "Salomon",
  "Balenciaga",
  "Rick Owens",
  "Golden Goose",
  "New Rock",
  "Lanvin",
  "UGG",
  "MMY",
  "Dior",
  "Prada",
  "Versace",
  "Gucci",
  "Louis Vuitton",
  "McQueen",
  "Amiri",
  "Off-White",
  "DC Shoes",
  "Vans",
  "Reebok",
  "Fila"
];

// ── Minimum product count safety threshold ──────────────────
// If parsed product count drops below this, assume a supplier
// fetch failure and abort the catalog overwrite entirely.
const MIN_PRODUCTS_SAFETY = 20;

function getTGConfig() {
  const props = PropertiesService.getScriptProperties();

  return {
    token: props.getProperty("TG_BOT_TOKEN"),
    chatId: props.getProperty("TG_CHAT_ID")
  };
}

function normalize(v) {
  return String(v || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[|｜]+/g, "|")
    .replace(/["""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

function normalizeLower(v) {
  return normalize(v).toLowerCase();
}

function shouldSkipSheet(name) {
  const n = normalizeLower(name);
  return SKIP_KEYWORDS.some(k => n.includes(k));
}

function extractBrand(sheetName, productName) {
  const source = normalize(sheetName);
  const name = normalize(productName);

  for (const b of KNOWN_BRANDS) {
    if (source.toLowerCase().includes(b.toLowerCase())) return b;
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }

  return source
    .split("|")[0]
    .replace(/[^\p{L}\p{N}\s.-]/gu, "")
    .trim();
}

function extractImageUrl(formula) {
  if (!formula) return "";

  const f = String(formula);

  const patterns = [
    /IMAGE\s*\(\s*"([^"]+)"/i,
    /HYPERLINK\s*\(\s*"([^"]+)"/i,
    /https?:\/\/[^"')\s]+/i
  ];

  for (const p of patterns) {
    const m = f.match(p);

    if (m) {
      return m[1] || m[0];
    }
  }

  return "";
}

function parsePrice(v) {
  if (v === null || v === undefined) return 0;

  const n = String(v)
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  const num = parseFloat(n);

  return isNaN(num) ? 0 : Math.round(num);
}

function parseSize(v) {
  if (!v) return null;

  const m = String(v).match(/(\d{2}(?:[.,]\d)?)/);

  if (!m) return null;

  const size = parseFloat(m[1].replace(",", "."));

  if (size < 30 || size > 55) return null;

  return size;
}

function isAvailable(v) {
  if (v === null || v === undefined) return false;

  if (typeof v === "number" && v > 0) return true;

  const s = normalizeLower(v);

  return (
    s === "є" ||
    s === "+" ||
    s === "yes" ||
    s.includes("✪") ||
    s.includes("✔") ||
    parseFloat(s) > 0
  );
}

function fingerprint(product) {
  // Include sizes in fingerprint to avoid collapsing restocks of same model
  // Strip qty format "40(2)" → "40" for deduplication
  return [
    normalizeLower(product[1]),
    normalizeLower(product[2]),
    normalizeLower(product[8]),
    String(product[6]).split(",").map(s => s.replace(/\(\w+\)/, "").trim()).sort().join(",")
  ].join("|");
}

function detectProductColumns(row) {
  const cols = [];

  row.forEach((cell, i) => {
    const val = normalize(cell);

    if (/^№/.test(val)) {
      cols.push(i);
    }
  });

  return cols;
}

function detectDropRow(rows, start, end) {
  const keys = ["дроп", "drop", "price", "опт", "ціна"];

  for (let i = start; i < end; i++) {
    const row = rows[i];

    for (let j = 0; j < row.length; j++) {
      const v = normalizeLower(row[j]);

      if (keys.some(k => v.includes(k))) {
        return row;
      }
    }
  }

  return null;
}

// Returns 1 (General Stores) or 2 (Babylon) based on raw qty cell values
function detectSupplier_(rows, start, end, qtyCol) {
  for (let i = start; i < end; i++) {
    if (!rows[i]) continue;
    const qtyRaw = rows[i][qtyCol];
    if (qtyRaw === null || qtyRaw === undefined || qtyRaw === "") continue;
    const s = normalizeLower(String(qtyRaw));
    if (s === "є" || s === "e" || s === "+" || s.includes("✪") || s.includes("✔")) return 2;
    if (typeof qtyRaw === "number" && qtyRaw > 0) return 1;
  }
  return 0;
}

function collectSizes(rows, start, end, sizeCol, qtyCol) {
  const sizeMap = new Map(); // size → total qty

  for (let i = start; i < end; i++) {
    const row = rows[i];
    const size = parseSize(row[sizeCol]);
    if (!size) continue;

    const qtyRaw = row[qtyCol];
    const qtyExists = qtyRaw !== "" && qtyRaw !== null && qtyRaw !== undefined;

    let qty;
    if (qtyExists) {
      // Qty column has data → use it exclusively
      // Babylon: є = 1, 0 = unavailable; General Stores: number = pair count
      if (!isAvailable(qtyRaw)) continue;
      qty = (typeof qtyRaw === "number" && qtyRaw > 1) ? Math.round(qtyRaw) : 1;
    } else {
      // No qty column — availability from size cell itself
      if (!isAvailable(row[sizeCol])) continue;
      qty = 1;
    }

    sizeMap.set(size, (sizeMap.get(size) || 0) + qty);
  }

  const sorted = [...sizeMap.entries()].sort((a, b) => a[0] - b[0]);

  if (!sorted.length) return ["ONE SIZE"];

  // Return "40(2),41(1)" format — frontend parser handles this
  return sorted.map(([sz, q]) => `${sz}(${q})`);
}

function parseSupplierSheet(rows, formulas, sheetName, gender) {
  const products = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    const productCols = detectProductColumns(row);

    if (!productCols.length) continue;

    const nextBlock = (() => {
      for (let x = r + 1; x < rows.length; x++) {
        if (detectProductColumns(rows[x]).length) {
          return x;
        }
      }

      return Math.min(r + 25, rows.length);
    })();

    const dropRow = detectDropRow(rows, r, nextBlock);

    for (const c of productCols) {
      const articleRaw = normalize(row[c]);

      if (!articleRaw) continue;

      const article = articleRaw
        .replace(/^№\s*/i, "")
        .trim();

      const name = normalize(row[c + 1]);

      if (!name) continue;

      let image = "";

      for (let k = r; k < Math.min(r + 5, formulas.length); k++) {
        if (
          formulas[k] &&
          formulas[k][c]
        ) {
          image = extractImageUrl(formulas[k][c]);

          if (image) break;
        }
      }

      let price = 0;

      if (
        dropRow &&
        dropRow[c + 2] !== undefined
      ) {
        price = parsePrice(dropRow[c + 2]);
      }

      if (!price) {
        for (let pr = r; pr < nextBlock; pr++) {
          const val = parsePrice(rows[pr][c + 2]);

          if (val > 50) {
            price = val;
            break;
          }
        }
      }

      if (!price) continue;

      const sizes = collectSizes(
        rows,
        r,
        nextBlock,
        c + 3,
        c + 4
      );

      const supplierType = detectSupplier_(rows, r, nextBlock, c + 4);

      products.push([
        article,
        extractBrand(sheetName, name),
        name,
        price + 450,
        "",
        image,
        sizes.join(","),
        "",
        gender,
        supplierType
      ]);
    }
  }

  return products;
}

function sendTelegramMessage(text) {
  try {
    const tg = getTGConfig();

    if (!tg.token || !tg.chatId) return;

    UrlFetchApp.fetch(
      "https://api.telegram.org/bot" +
      tg.token +
      "/sendMessage",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: tg.chatId,
          text,
          parse_mode: "HTML"
        }),
        muteHttpExceptions: true
      }
    );
  } catch (e) {}
}

// ── SOLD SIZE TRACKING ──────────────────────────────────────
// Called from doPost(new_order): decrements sizes in Товари sheet
// and logs each sold unit to Продано sheet for re-sync persistence.

function autoRemoveOrderedSizes(ss, cart) {
  if (!cart || !cart.length) return;
  const sheet = ss.getSheetByName("Товари");
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idCol     = HEADERS.indexOf("ID");
  const sizesCol  = HEADERS.indexOf("Розміри");
  if (idCol < 0 || sizesCol < 0) return;

  const data = sheet.getRange(1, 1, lastRow, HEADERS.length).getValues();

  for (let r = 1; r < data.length; r++) {
    const rowId = String(data[r][idCol]);
    const item  = cart.find(c => String(c.id) === rowId);
    if (!item) continue;

    const orderedSize = String(item.size);
    const orderedQty  = item.qty || 1;
    const sizesStr    = String(data[r][sizesCol]);
    const parts       = sizesStr.split(",").map(s => s.trim()).filter(Boolean);
    const newParts    = [];

    for (const part of parts) {
      const m = part.match(/^(\d+(?:[.,]\d)?)\((\d+)\)$/);
      if (!m) {
        // Plain size without qty (legacy) — remove if matches
        const plain = part.replace(/\(.*\)/, "").trim();
        if (plain !== orderedSize && parseFloat(plain) !== parseFloat(orderedSize)) {
          newParts.push(part);
        }
        continue;
      }
      const sz        = m[1];
      const qty       = parseInt(m[2]);
      const remaining = qty - (parseFloat(sz) === parseFloat(orderedSize) ? orderedQty : 0);
      if (remaining > 0) newParts.push(`${sz}(${remaining})`);
    }

    sheet.getRange(r + 1, sizesCol + 1).setValue(newParts.join(","));
  }
}

function _logSoldSizes(ss, cart, orderRef) {
  if (!cart || !cart.length) return;
  let sheet = ss.getSheetByName("Продано");
  if (!sheet) {
    sheet = ss.insertSheet("Продано");
    sheet.appendRow(["Дата", "ID", "Розмір", "К-во", "Замовлення"]);
  }
  const now = new Date();
  for (const item of cart) {
    sheet.appendRow([now, String(item.id), String(item.size), item.qty || 1, orderRef || ""]);
  }
}

// Returns { productId: { "40": totalSoldQty, ... } }
function getSoldSizes(ss) {
  const sheet = ss.getSheetByName("Продано");
  if (!sheet || sheet.getLastRow() <= 1) return {};
  const data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const sold  = {};
  for (const row of data) {
    const id   = String(row[1]);
    const size = String(row[2]);
    const qty  = parseInt(row[3]) || 1;
    if (!id || !size) continue;
    if (!sold[id]) sold[id] = {};
    sold[id][size] = (sold[id][size] || 0) + qty;
  }
  return sold;
}

// Removes sold sizes/quantities from freshly-parsed products
function applySoldFilter(products, sold) {
  if (!Object.keys(sold).length) return products;
  const result = [];
  for (const p of products) {
    const id        = String(p[0]);
    const soldSizes = sold[id];
    if (!soldSizes) { result.push(p); continue; }

    const sizesStr = String(p[6]);
    if (sizesStr === "ONE SIZE" || !sizesStr) { result.push(p); continue; }

    const parts    = sizesStr.split(",").map(s => s.trim()).filter(Boolean);
    const newParts = [];

    for (const part of parts) {
      const m = part.match(/^(\d+(?:[.,]\d)?)\((\d+)\)$/);
      if (!m) { newParts.push(part); continue; }
      const sz        = m[1];
      const qty       = parseInt(m[2]);
      const soldQty   = soldSizes[sz] || soldSizes[String(Math.round(parseFloat(sz)))] || 0;
      const remaining = qty - soldQty;
      if (remaining > 0) newParts.push(`${sz}(${remaining})`);
    }

    if (!newParts.length) continue; // All sizes sold out — drop product
    const updated = [...p];
    updated[6] = newParts.join(",");
    result.push(updated);
  }
  return result;
}

// ── SERVER-SIDE DAILY DEALS ─────────────────────────────────
// Same mulberry32 PRNG + date seed as the client (deals.js).
// Called from doGet() so every client receives identical deal IDs.

function _mulberry32GAS(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function _getDailyDealIds(products, count) {
  count = count || 3;
  var d    = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  var eligible = products
    .filter(function(p) {
      var sizes = String(p['Розміри'] || '').trim();
      return sizes && sizes !== 'ONE SIZE';
    })
    .sort(function(a, b) {
      var ia = String(a['ID'] || '');
      var ib = String(b['ID'] || '');
      return ia < ib ? -1 : ia > ib ? 1 : 0;
    });

  if (!eligible.length) return [];

  var rng = _mulberry32GAS(seed);
  var arr = eligible.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j   = Math.floor(rng() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  return arr.slice(0, count).map(function(p) { return String(p['ID'] || ''); });
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheet = ss.getSheetByName("Товари");

  if (!sheet) {
    return ContentService
      .createTextOutput(
        JSON.stringify({ products: [], dailyDeals: [] })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow <= 1) {
    return ContentService
      .createTextOutput(
        JSON.stringify({ products: [], dailyDeals: [] })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }

  const data = sheet
    .getRange(1, 1, lastRow, lastCol)
    .getValues();

  const headers = data.shift();

  const products = data
    .filter(r => r[0])
    .map(r => {
      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = r[i];
      });

      return obj;
    });

  const dailyDeals = _getDailyDealIds(products, 3);

  return ContentService
    .createTextOutput(
      JSON.stringify({ products, dailyDeals })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

function doPost(e) {
  try {
    // ── ДІАГНОСТИКА: видно у Apps Script → Executions ──────────────
    console.log("Отримані дані:", e.postData.contents);

    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === "new_order") {
      const sheet = ss.getSheetByName("Orders");

      const totalFormatted = typeof data.total === "number"
        ? data.total + " ₴"
        : String(data.total || "");

      // ── Явна перевірка поля items ───────────────────────────────
      const hasItems = data.items && String(data.items).trim().length > 0;
      const itemsFormatted = hasItems
        ? String(data.items)
            .split("\n")
            .filter(Boolean)
            .map(line => "  · " + line)
            .join("\n")
        : null;

      const utm = data.utm || null;
      sheet.appendRow([
        new Date(),
        data.fio     || "",
        "'" + (data.phone || ""),
        data.city    || "",
        data.delivery|| "",
        hasItems ? data.items : "⚠️ items відсутні",
        totalFormatted,
        data.promo   || "",
        "Нове",
        utm ? (utm.source   || "") : "",
        utm ? (utm.campaign || "") : "",
        utm ? (utm.video    || "") : ""
      ]);

      // Build per-supplier grouped TG message
      const cartItems = (data.cart && Array.isArray(data.cart)) ? data.cart : [];
      const groups = { 1: [], 2: [], 0: [] };
      cartItems.forEach(item => {
        const sup = parseInt(item.supplier) || 0;
        groups[sup in groups ? sup : 0].push(item);
      });
      const supplierKeys = [1, 2, 0].filter(k => groups[k].length);
      const multipleSuppliers = supplierKeys.length > 1;

      let itemsBlock = "";
      if (!cartItems.length) {
        itemsBlock = itemsFormatted || "⚠️ <i>Помилка: назву товару не отримано</i>";
      } else {
        const labels = { 1: "📦 #1 General Stores", 2: "📦 #2 Babylon", 0: "❓ Невідомий постачальник" };
        if (multipleSuppliers) itemsBlock += "⚠️ <b>ЗМІШАНЕ — " + supplierKeys.length + " відправки</b>\n\n";
        supplierKeys.forEach(k => {
          itemsBlock += "<b>" + labels[k] + ":</b>\n";
          groups[k].forEach(item => {
            const nameStr = (item.brand || "") + " " + (item.name || item.id);
            const priceStr = item.price ? " — " + item.price + "₴" : "";
            const qtyStr = (item.qty || 1) > 1 ? " × " + item.qty : "";
            itemsBlock += "  · " + nameStr + ", розмір " + item.size + qtyStr + priceStr + "\n";
          });
          itemsBlock += "\n";
        });
      }

      const utmFooter = utm && (utm.video || utm.source)
        ? "\n📊 <b>Джерело:</b> video=" + (utm.video || "—") + ", src=" + (utm.source || "—") + ", campaign=" + (utm.campaign || "—")
        : "";

      sendTelegramMessage(
        "🚀 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n\n" +
        "👟 <b>Товар:</b>\n" + itemsBlock +
        "👤 <b>Ім'я:</b> "     + (data.fio      || "—") + "\n" +
        "📞 <b>Тел:</b> "      + (data.phone    || "—") + "\n" +
        "🏙 <b>Місто:</b> "    + (data.city     || "—") + "\n" +
        "📦 <b>Доставка:</b> " + (data.delivery || "—") + "\n" +
        "💰 <b>Сума:</b> "     + totalFormatted +
        (data.promo ? "\n🎟 <b>Промокод:</b> " + data.promo : "") +
        utmFooter
      );

      // Decrement sizes in master sheet + persist to Продано log
      if (data.cart && Array.isArray(data.cart) && data.cart.length) {
        autoRemoveOrderedSizes(ss, data.cart);
        _logSoldSizes(ss, data.cart, data.phone || "");
      }
    }

    if (data.action === "review") {
      let sheet = ss.getSheetByName("Відгуки");

      if (!sheet) {
        sheet = ss.insertSheet("Відгуки");

        sheet.appendRow([
          "Дата",
          "Автор",
          "Оцінка",
          "Текст"
        ]);
      }

      sheet.appendRow([
        new Date(),
        data.author || "Анонім",
        data.stars || 5,
        data.text || ""
      ]);

      const stars = Math.min(5, Math.max(1, parseInt(data.stars) || 5));
      sendTelegramMessage(
        "✍️ <b>НОВИЙ ВІДГУК</b>\n\n" +
        "⭐".repeat(stars) + "\n\n" +
        "👤 <b>Автор:</b> " + (data.author || "Анонім") + "\n" +
        "💬 " + (data.text || "—")
      );
    }

    if (data.action === "photo_request") {
      sendTelegramMessage(
        "📸 ФОТО ЗАПИТ\n\n" +
        (
          data.product
            ? data.product.brand +
              " " +
              data.product.name
            : ""
        ) +
        "\n" +
        (data.size || "")
      );
    }

    return ContentService
      .createTextOutput(
        JSON.stringify({
          status: "ok"
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  } catch (e) {
    sendTelegramMessage(
      "❌ " + e.message
    );

    return ContentService
      .createTextOutput(
        JSON.stringify({
          status: "error",
          message: e.message
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}

function updateMasterDB() {
  // P0-10: Use tryLock instead of waitLock to prevent concurrent double-writes
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) {
    sendTelegramMessage("⚠️ updateMasterDB: lock не отримано, паралельний запуск — пропуск");
    return 0;
  }

  try {
    const masterSS =
      SpreadsheetApp.getActiveSpreadsheet();

    const masterSheet =
      masterSS.getSheetByName("Товари");

    masterSheet
      .getRange(
        1,
        1,
        1,
        HEADERS.length
      )
      .setValues([HEADERS]);

    let products = [];
    // P0-10: Track how many suppliers responded successfully
    let successfulSuppliers = 0;

    for (const supplier of SUPPLIERS) {
      try {
        const ss =
          SpreadsheetApp.openById(
            supplier.id
          );

        const sheets = ss.getSheets();
        let supplierProducts = [];

        for (const sheet of sheets) {
          const name = sheet.getName();

          if (shouldSkipSheet(name)) {
            continue;
          }

          const lastRow =
            sheet.getLastRow();

          const lastCol =
            sheet.getLastColumn();

          if (!lastRow || !lastCol) {
            continue;
          }

          const range = sheet.getRange(
            1,
            1,
            lastRow,
            lastCol
          );

          const rows = range.getValues();

          const formulas = range.getFormulas();

          const parsed =
            parseSupplierSheet(
              rows,
              formulas,
              name,
              supplier.gender
            );

          if (parsed.length) {
            supplierProducts =
              supplierProducts.concat(parsed);
          }
        }

        if (supplierProducts.length > 0) {
          products = products.concat(supplierProducts);
          successfulSuppliers++;
        } else {
          // Supplier returned 0 products — suspicious but not fatal
          sendTelegramMessage(
            "⚠️ Постачальник повернув 0 товарів: " + supplier.id
          );
        }

      } catch (e) {
        sendTelegramMessage(
          "❌ Supplier error\n" +
          supplier.id +
          "\n" +
          e.message
        );
      }
    }

    const unique = new Map();

    for (const p of products) {
      const key = fingerprint(p);

      if (!unique.has(key)) {
        unique.set(key, p);
      }
    }

    // Apply sold-size filter so manually decremented sizes survive the re-sync
    const sold = getSoldSizes(masterSS);
    const finalProducts = applySoldFilter([...unique.values()], sold);

    // P0-10: Safety gate — do NOT overwrite catalog if result looks wrong
    if (finalProducts.length < MIN_PRODUCTS_SAFETY) {
      sendTelegramMessage(
        "⚠️ updateMasterDB: підозріло мало товарів (" +
        finalProducts.length +
        "), успішних постачальників: " +
        successfulSuppliers +
        ". Каталог НЕ перезаписано. Перевірте постачальників."
      );
      return 0;
    }

    // P0-10: Only clear AFTER we have a valid product set to write
    const lastRow =
      masterSheet.getLastRow();

    if (lastRow > 1) {
      masterSheet
        .getRange(
          2,
          1,
          lastRow - 1,
          HEADERS.length
        )
        .clearContent();
    }

    if (finalProducts.length) {
      masterSheet
        .getRange(
          2,
          1,
          finalProducts.length,
          HEADERS.length
        )
        .setValues(finalProducts);
    }

    sendTelegramMessage(
      "✅ Оновлено: " +
      finalProducts.length +
      " товарів (постачальників: " +
      successfulSuppliers +
      ")"
    );

    return finalProducts.length;

  } finally {
    lock.releaseLock();
  }
}

function setupTrigger() {
  ScriptApp
    .getProjectTriggers()
    .forEach(t => {
      if (
        t.getHandlerFunction() ===
        "updateMasterDB"
      ) {
        ScriptApp.deleteTrigger(t);
      }
    });

  ScriptApp
    .newTrigger("updateMasterDB")
    .timeBased()
    .everyHours(2)
    .create();
}

function debugParser() {
  const supplier = SUPPLIERS[0];

  const ss =
    SpreadsheetApp.openById(
      supplier.id
    );

  const sheet = ss.getSheets()[0];

  const lastRow =
    sheet.getLastRow();

  const lastCol =
    sheet.getLastColumn();

  const rows = sheet
    .getRange(
      1,
      1,
      lastRow,
      lastCol
    )
    .getValues();

  const formulas = sheet
    .getRange(
      1,
      1,
      lastRow,
      lastCol
    )
    .getFormulas();

  const parsed =
    parseSupplierSheet(
      rows,
      formulas,
      sheet.getName(),
      supplier.gender
    );

  Logger.log(
    JSON.stringify(parsed.slice(0, 20))
  );
}