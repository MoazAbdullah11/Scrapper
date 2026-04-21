import express from "express";
import axios from "axios";
import { extractMetadata } from "./scraper.js";

const router = express.Router();

router.get("/metadata", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await extractMetadata(url);
    return res.json(result);

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/view-html", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await axios.get(url, {
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
      },
      timeout: 8000,
    });

    let html = response.data;

    // remove scripts (lightweight way)
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(html);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
