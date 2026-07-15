import express from "express";
import cors from "cors";
import chromium from "chromium";
import puppeteer from "puppeteer-core";

const app = express();
app.use(cors());

let productsCache = {};

app.get("/", (req, res) => {
  res.send("Applit Price Server is running (Full Catalog)");
});

// URL категории
const CATEGORY_URL = "https://gadget-store.by/apple/";

// Запуск браузера
async function launchBrowser() {
  return puppeteer.launch({
    executablePath: chromium.path,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote"
    ],
    headless: true
  });
}

// Парсер каталога
async function parseCatalog() {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.goto(CATEGORY_URL, { waitUntil: "networkidle2" });

  // Собираем все товары
  const products = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".product-card")];

    return items.map(item => {
      const name = item.querySelector(".product-title")?.innerText?.trim();
      const url = item.querySelector("a")?.href;
      return { name, url };
    });
  });

  await browser.close();
  return products;
}

// Парсер цены товара
async function parsePrice(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  // Ждём цену
  await page.waitForSelector(".price", { timeout: 5000 }).catch(() => {});

  const price = await page.evaluate(() => {
    const el = document.querySelector(".price");
    return el ? el.innerText.trim() : null;
  });

  await browser.close();
  return price;
}

// API: обновить весь каталог
app.get("/api/update", async (req, res) => {
  const catalog = await parseCatalog();
  const results = {};

  for (const item of catalog) {
    const price = await parsePrice(item.url);

    results[item.name] = {
      name: item.name,
      price,
      url: item.url
    };
  }

  productsCache = results;

  res.json({
    status: "updated",
    count: catalog.length,
    products: productsCache
  });
});

// API: получить товары
app.get("/api/products", (req, res) => {
  res.json(productsCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
