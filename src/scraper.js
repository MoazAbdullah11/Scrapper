import axios from "axios";
import * as cheerio from "cheerio";

export async function extractMetadata(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      };
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // --------------------------
    // Helpers
    // --------------------------
    const getAttr = (selectors, attr = "content") => {
      for (let sel of selectors) {
        const val = $(sel).attr(attr);
        if (val) return makeAbsolute(val, url);
      }
      return null;
    };

    const getText = (selectors) => {
      for (let sel of selectors) {
        const val = $(sel).text();
        if (val) return val.trim();
      }
      return null;
    };

    const data = {
      title: getText([
        "meta[property='og:title']",
        "meta[name='twitter:title']",
        "title",
      ]),

      description: getAttr([
        "meta[property='og:description']",
        "meta[name='twitter:description']",
        "meta[name='description']",
      ]),

      image: getAttr([
        "meta[property='og:image']",
        "meta[property='og:image:url']",
        "meta[property='og:image:secure_url']",
        "meta[name='twitter:image']",
        "meta[name='twitter:image:src']",
      ]),

      // fallback if no meta image
      fallbackImage:
        getAttr(["link[rel='image_src']"], "href") ||
        getAttr(["img[src]"], "src"),

      media: getAttr([
        "meta[property='og:video']",
        "meta[property='og:video:url']",
        "meta[property='og:audio']",
      ]),

      favicon: getAttr(
        ["link[rel='icon']", "link[rel='shortcut icon']"],
        "href"
      ),

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

function makeAbsolute(link, base) {
  try {
    return new URL(link, base).href;
  } catch {
    return link;
  }
}