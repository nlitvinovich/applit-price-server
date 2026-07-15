import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

// Кэш
let productsCache = {};

// Корневой маршрут
app.get("/", (req, res) => {
  res.send("Applit Price Server is running (gadget-store.by)");
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

// Новый улучшенный парсер цены
async function parsePrice(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // 1) Ищем цену в <span class="price">
    let match = html.match(/<span[^>]*class="price"[^>]*>([\d\s]+) BYN<\/span>/i);
    if (match) return match[1].trim() + " BYN";

    // 2) Ищем цену в <div class="product-price">
    match = html.match(/<div[^>]*class="product-price"[^>]*>([\d\s]+) BYN<\/div>/i);
    if (match) return match[1].trim() + " BYN";

    // 3) Ищем любое число перед BYN
    match = html.match(/(\d[\d\s]+)\s*BYN/i);
    if (match) return match[1].trim() + " BYN";

    // 4) Ищем любое число перед руб.
    match = html.match(/(\d[\d\s]+)\s*руб/i);
    if (match) return match[1].trim() + " руб.";

    return null;
  } catch (err) {
    return null;
  }
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
