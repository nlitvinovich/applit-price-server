import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();

// Кэш
let cache = {};

// Парсер
async function parseProduct(url) {
  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);

  const name = $("h1").first().text().trim();
  const priceMatch = $("body").text().match(/([\d.,]+)\s*BYN/);
  const price = priceMatch ? priceMatch[1] + " BYN" : null;

  return { name, price, url };
}

// Обновление кэша
async function updateCache() {
  cache["iphone17promax"] = await parseProduct("https://gadget-store.by/zpMJD4pz74Va8aoeA5iK");
  cache["iphone16plus"] = await parseProduct("https://gadget-store.by/6sg9p1TZ3FoMT39XHo7u");
  cache["macbookneo"] = await parseProduct("https://gadget-store.by/IZaHkV1hXRVK2k5AlkiN");
}

// API
app.get("/api/products", (req, res) => {
  res.json(cache);
});

// Ручное обновление
app.get("/api/update", async (req, res) => {
  await updateCache();
  res.json({ status: "updated" });
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log("Applit price server running");
  updateCache();
});
