import fetch from "node-fetch";
import cheerio from "cheerio";
import express from "express";

const app = express();

async function parseProduct(url) {
  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);

  const name = $("h1").first().text().trim();

  // Ищем цену по шаблону BYN
  const priceMatch = $("body").text().match(/([\d.,]+)\s*BYN/);
  const price = priceMatch ? priceMatch[1] + " BYN" : null;

  // Ищем первое фото
  const image = $("img").first().attr("src");

  return { name, price, image, url };
}

// Кэш
let cache = {};

async function updateCache() {
  cache["iphone17promax"] = await parseProduct("https://gadget-store.by/zpMJD4pz74Va8aoeA5iK");
  cache["iphone16plus"] = await parseProduct("https://gadget-store.by/6sg9p1TZ3FoMT39XHo7u");
  cache["macbookneo"] = await parseProduct("https://gadget-store.by/IZaHkV1hXRVK2k5AlkiN");
}

// Обновляем каждые 30 минут
setInterval(updateCache, 30 * 60 * 1000);
updateCache();

// API для Applit
app.get("/api/products", (req, res) => {
  res.json(cache);
});

app.listen(3000, () => console.log("Applit price server running"));
