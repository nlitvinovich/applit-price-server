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

// Парсер цены
async function parsePrice(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    const match = html.match(/(\d[\d\s]+)\s*руб/);

    return match ? match[1].trim() + " руб." : null;
  } catch {
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
