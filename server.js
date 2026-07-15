import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());

let productsCache = {};

const CATEGORY_URL = "https://gadget-store.by/apple/";

async function parseCatalog() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(CATEGORY_URL, { waitUntil: "networkidle" });

  const products = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".product-item")];

    return items.map(item => {
      const name = item.querySelector(".product-item__title")?.innerText?.trim();
      const url = item.querySelector("a.product-item__link")?.href;
      const price = item.querySelector(".product-item__price")?.innerText?.trim();

      return { name, url, price };
    });
  });

  await browser.close();
  return products;
}

async function parsePrice(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const price = await page.evaluate(() => {
    const el =
      document.querySelector(".price") ||
      document.querySelector(".product-price");
    return el ? el.innerText.trim() : null;
  });

  await browser.close();
  return price;
}

app.get("/api/update", async (req, res) => {
  const catalog = await parseCatalog();
  const results = {};

  for (const item of catalog) {
    const finalPrice = item.price || await parsePrice(item.url);

    results[item.name] = {
      name: item.name,
      price: finalPrice,
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

app.get("/api/products", (req, res) => {
  res.json(productsCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
