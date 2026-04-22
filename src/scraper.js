import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

export async function extractMetadata(url) {
  try {
    const DEBUG = false; // 🔥 turn ON/OFF

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
      },
      timeout: 20000,
    });

    const html = response.data;

    // ✅ SAFE DEBUG (no crash on Vercel)
    if (DEBUG) {
      try {
        fs.writeFileSync("/tmp/debug.html", html, "utf-8");
        console.log("✅ Debug HTML saved in /tmp/debug.html");
      } catch (e) {
        console.log("⚠️ Cannot write file, fallback to log");
        console.log(html.slice(0, 1500));
      }
    }

    const $ = cheerio.load(html);

    const get = (sel) => $(sel).attr("content") || $(sel).text() || null;

    // =========================
    // OG IMAGES
    // =========================
    const ogImages = [];
    $("meta[property='og:image']").each((i, el) => {
      const img = $(el).attr("content");
      if (img) ogImages.push(img);
    });

    // =========================
    // TWITTER IMAGES
    // =========================
    const twitterImages = [];
    $("meta[name='twitter:image'], meta[name='twitter:image:src']").each(
      (i, el) => {
        const img = $(el).attr("content");
        if (img) twitterImages.push(img);
      }
    );

    // =========================
    // FALLBACK: FIRST IMG
    // =========================
    let firstImage = null;
    $("img").each((i, el) => {
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-original");

      if (src && src.startsWith("http") && !firstImage) {
        firstImage = src;
      }
    });

    // =========================
    // BACKGROUND IMAGE
    // =========================
    if (!firstImage) {
      $("*").each((i, el) => {
        const style = $(el).attr("style");
        if (style && style.includes("background-image")) {
          const match = style.match(/url\((.*?)\)/);
          if (match && match[1]) {
            firstImage = match[1].replace(/['"]/g, "");
            return false;
          }
        }
      });
    }

    // =========================
    // 🔥 TEMU JSON IMAGE FIX
    // =========================
    let jsonImage = null;

    $("script").each((i, el) => {
      const content = $(el).html();

      if (content && content.includes("kwcdn")) {
        const match = content.match(
          /https:\/\/img\.kwcdn\.com[^"']+/g
        );
        if (match && match.length) {
          jsonImage = match[0];
          return false;
        }
      }
    });

    // =========================
    // FINAL IMAGE
    // =========================
    const finalImage =
      ogImages[0] ||
      twitterImages[0] ||
      jsonImage ||
      firstImage ||
      null;

    return {
      title: $("title").text() || null,
      description: get("meta[name='description']"),
      ogTitle: get("meta[property='og:title']"),
      ogDescription: get("meta[property='og:description']"),
      image: finalImage,
      favicon:
        $("link[rel='icon']").attr("href") ||
        $("link[rel='shortcut icon']").attr("href") ||
        null,
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}