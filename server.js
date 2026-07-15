const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Кэш для данных
let productsCache = {};

// Корневой маршрут — чтобы не было "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Applit Price Server is running");
});

// Эндпоинт: получить товары
app.get("/api/products", (req, res) => {
  res.json(productsCache);
});

// Эндпоинт: обновить кэш вручную
app.get("/api/update", async (req, res) => {
  try {
    const urls = {
      iphone17promax: "https://www.21vek.by/mobile/iphone_17_pro_max.html",
      iphone16plus: "https://www.21vek.by/mobile/iphone_16_plus.html",
      macbookneo: "https://www.21vek.by/notebooks/apple_macbook_neo.html"
    };

    const results = {};

    for (const key in urls) {
      try {
        const response = await axios.get(urls[key]);
        const html = response.data;

        // Ищем BYN в HTML
        const priceMatch = html.match(/(\d[\d\s]+) BYN/);

        results[key] = {
          name: key,
          price: priceMatch ? priceMatch[1].trim() + " BYN" : null,
          url: urls[key]
        };
      } catch (err) {
        results[key] = {
          name: key,
          price: null,
          url: urls[key]
        };
      }
    }

    productsCache = results;

    res.json({ status: "updated", products: productsCache });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
