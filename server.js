import express from "express";
import cors from "cors";
import Redis from "ioredis";

const app = express();
app.use(cors());

const redis = new Redis(process.env.REDIS_URL);

app.get("/", (req, res) => {
  res.send("Applit Price Server is running");
});

app.get("/api/products", async (req, res) => {
  const data = await redis.get("products");
  res.json(JSON.parse(data || "{}"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running"));
