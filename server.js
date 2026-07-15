import express from "express";
import cors from "cors";
import chromium from "chromium";
import puppeteer from "puppeteer-core";

const app = express();
app.use(cors());

// Кэш
let productsCache = {};

// Корневой маршрут
app.get("/", (req, res) => {
  res.send("Applit Price Server is running (Puppeteer)");
});

// Источники данных
const sources = {
  iphone17promax: {
    name: "iPhone 17 Pro Max",
    url: "https://gadget-store.by/apple/iphone-17-pro-max/"
  },
  iphone16plus: {
    name: "iPhone 16 Plus",
    url: "https://gadget-store.by/apple/iphone-16-plus/"
  }
};

// Puppeteer парсер
async function parsePrice(url) {
  const browser = await puppeteer.launch({
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

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  // Ждём появления цены
  await page.waitForSelector(".price", { timeout: 5000 }).catch(() => {});

  // Достаём цену
  const price = await page.evaluate(() => {
    const el = document.querySelector(".price");
    if (!el) return null;
    return el.innerText.trim();
  });

  await browser.close();
  return price;
}

// API: получить товары
app.get("/api/products", (req, res) => {
  res.json(productsCache);
});

// API: обновить кэш
app.get("/api/update", async (req, res) => {
  const results = {};

  for (const key in sources) {
    const item = sources[key];
    const price = await parsePrice(item.url);

    results[key] = {
      name: item.name,
      price,
      url: item.url
    };
  }

  productsCache = results;

  res.json({
    status: "updated",
    products: productsCache
  });
});

// Запуск сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
