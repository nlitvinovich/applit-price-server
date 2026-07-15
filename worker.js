import Redis from "ioredis";
import axios from "axios";

const redis = new Redis(process.env.REDIS_URL);

// Каталог Apple
const CATEGORY_URL = "https://gadget-store.by/apple/";

// Бесплатный облачный браузер ScrapingBee
const SCRAPER = "https://app.scrapingbee.com/api/v1/?api_key=free&url=";

async function fetchHTML(url) {
  const response = await axios.get(SCRAPER + encodeURIComponent(url));
  return response.data;
}

// Парсим каталог
function parseCatalog(html) {
  const items = [...html.matchAll(
    /product-item__title">([^<]+)<\/div>[\s\S]*?href="([^"]+)"/g
  )];

  return items.map(match => ({
    name: match[1].trim(),
    url: match[2]
  }));
}

// Парсим цену
function parsePrice(html) {
  const match = html.match(/product-item__price">([^<]+)</);
  return match ? match[1].trim() : null;
}

async function run() {
  console.log("Worker started: parsing catalog...");

  // HTML каталога
  const catalogHTML = await fetchHTML(CATEGORY_URL);
  const catalog = parseCatalog(catalogHTML);

  const results = {};

  // Парсим каждый товар
  for (const item of catalog) {
    const html = await fetchHTML(item.url);
    const price = parsePrice(html);

    results[item.name] = {
      name: item.name,
      url: item.url,
      price
    };
  }

  // Сохраняем в Redis
  await redis.set("products", JSON.stringify(results));

  console.log("Saved to Redis:", Object.keys(results).length);
}

run();

