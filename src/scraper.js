import axios from "axios";
import * as cheerio from "cheerio";

export async function extractMetadata(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 ... Chrome/120",
        Accept: "text/html,application/xhtml+xml",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
      },
      timeout: 20000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const get = (sel) => $(sel).attr("content") || $(sel).text() || null;
    const ogImages = [];
    $("meta[property='og:image']").each((i, el) => {
      const img = $(el).attr("content");
      if (img) ogImages.push(img);
    });

    const ogImageUrl = [];
    $("meta[property='og:image:url']").each((i, el) => {
      const img = $(el).attr("content");
      if (img) ogImageUrl.push(img);
    });

    const ogImageSecure = [];
    $("meta[property='og:image:secure_url']").each((i, el) => {
      const img = $(el).attr("content");
      if (img) ogImageSecure.push(img);
    });

    // Twitter images
    const twitterImages = [];
    $("meta[name='twitter:image'], meta[name='twitter:image:src']").each(
      (i, el) => {
        const img = $(el).attr("content");
        if (img) twitterImages.push(img);
      }
    );

    const mediaUrls = [];
    [
      "meta[property='og:video']",
      "meta[property='og:video:url']",
      "meta[property='og:video:secure_url']",
      "meta[property='og:audio']",
    ].forEach((selector) => {
      $(selector).each((i, el) => {
        const url = $(el).attr("content");
        if (url) mediaUrls.push(url);
      });
    });

    const data = {
      title: $("title").text() || null,
      description: get("meta[name='description']"),
      ogTitle: get("meta[property='og:title']"),
      ogDescription: get("meta[property='og:description']"),

      ogImage: ogImages[0] || null,
      ogImageUrl: ogImageUrl[0] || null,
      ogImageSecure: ogImageSecure[0] || null,
      twitterImage: twitterImages[0] || null,

      mediaUrl: mediaUrls.length ? mediaUrls[0] : null,

      favicon:
        $("link[rel='icon']").attr("href") ||
        $("link[rel='shortcut icon']").attr("href") ||
        null,
      success: true,
    };

    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}
