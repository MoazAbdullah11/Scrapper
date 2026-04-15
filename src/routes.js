import express from "express";
import axios from "axios";
import { extractMetadata } from "./scraper.js";

const router = express.Router();

router.get("/metadata", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const result = await extractMetadata(url);
  res.json(result);
});

import { JSDOM } from "jsdom";
router.get("/view-html", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await axios.get(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",

    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
  timeout: 20000,
});

    const dom = new JSDOM(response.data);
    dom.window.document.querySelectorAll("script").forEach((s) => s.remove());
    const prettyHtml = dom.window.document.documentElement.outerHTML;

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(prettyHtml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
