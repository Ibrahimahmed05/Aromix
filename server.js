const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https: data:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};
const GENERIC_ERROR_MESSAGE = "Aromix could not complete this request right now.";
const MAX_BODY_BYTES = 64 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMITS = {
  normal: 60,
  heavy: 20,
};
const rateLimitBuckets = new Map();

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  });
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 4173);
const DEV_MODE = process.env.DEV_MODE === "true";
const DEBUG_API = process.env.DEBUG_API === "true" || DEV_MODE;
const FRAGRANCE_PROVIDER = (process.env.FRAGRANCE_PROVIDER || "rapidapi").toLowerCase();
const FRAGELLA_ENABLED = process.env.FRAGELLA_ENABLED === "true";
const API_CACHE = new Map();
const CACHE_TTL = {
  fragrance: 1000 * 60 * 20,
  search: 1000 * 60 * 12,
  shopping: 1000 * 60 * 8,
  image: 1000 * 60 * 30,
};

const TONES = {
  blue: ["#243949", "#517fa4"],
  amber: ["#b7792c", "#e9c07d"],
  black: ["#181512", "#5b4967"],
  green: ["#617a56", "#b7c79c"],
  rose: ["#b75d69", "#e7b4b5"],
};

function secureHeaders(extra = {}) {
  return { ...SECURITY_HEADERS, ...extra };
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    ...secureHeaders(extraHeaders),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendPublicError(response, status = 502, code = "SERVICE_UNAVAILABLE", message = GENERIC_ERROR_MESSAGE, extra = {}) {
  sendJson(response, status, {
    error: true,
    message,
    code,
    ...extra,
  });
}

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function logError(route, label, error) {
  if (DEBUG_API) {
    console.error(`[${route}] ${label}`, error);
  } else {
    console.error(`[${route}] ${label}: ${error?.message || "failed"}`);
  }
}

function handleRouteError(route, response, error, extra = {}) {
  if (error instanceof RequestError) {
    sendPublicError(response, error.status, error.code, error.message, extra);
    return;
  }
  logError(route, "failure", error);
  sendPublicError(response, 502, "SERVICE_UNAVAILABLE", GENERIC_ERROR_MESSAGE, extra);
}

function preview(value, length = 900) {
  try {
    return JSON.stringify(value).slice(0, length);
  } catch {
    return String(value).slice(0, length);
  }
}

function logRoute(route, label, value = "") {
  if (!DEBUG_API) return;
  console.log(`[${route}] ${label}`, value === "" ? "" : preview(value));
}

async function cachedValue(key, ttlMs, loader) {
  const existing = API_CACHE.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const value = await loader();
  API_CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function sanitizedUrl(url) {
  const safeUrl = new URL(url.toString());
  if (safeUrl.searchParams.has("api_key")) safeUrl.searchParams.set("api_key", "[REDACTED]");
  return safeUrl.toString();
}

function keyState() {
  return {
    FRAGRANCE_PROVIDER,
    FRAGELLA_ENABLED,
    FRAGELLA_API_KEY: Boolean(process.env.FRAGELLA_API_KEY),
    RAPIDAPI_KEY: Boolean(process.env.RAPIDAPI_KEY),
    RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "",
    SERPAPI_API_KEY: Boolean(process.env.SERPAPI_API_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",
  };
}

async function readBody(request, options = {}) {
  const maxBytes = options.maxBytes || MAX_BODY_BYTES;
  let body = "";
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      throw new RequestError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
    }
    body += chunk;
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new RequestError(400, "INVALID_JSON", "Invalid JSON request body.");
  }
}

async function callOpenAi(payload, route = "/api/chat", instructions) {
  if (!process.env.OPENAI_API_KEY) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o";
  logRoute(route, "OpenAI key exists", { OPENAI_API_KEY: true, OPENAI_MODEL: model });
  logRoute(route, "OpenAI URL", "https://api.openai.com/v1/responses");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        instructions ||
        "You are Aromix AI, a senior fragrance consultant. Use only the supplied scent profiles, notes, accords, shelf data, and live shopping results. Never invent notes, prices, ratings, or stores. Return practical, direct advice: what to buy, wear, layer, or avoid — with a clear reason and a next step.",
      input: JSON.stringify(payload),
    }),
  });
  logRoute(route, "OpenAI response status", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    logRoute(route, "OpenAI error body", errorText);
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json();
  logRoute(route, "OpenAI response preview", data);
  return data.output_text;
}

async function callOpenAiJson(payload, route, instructions, fallback) {
  if (!process.env.OPENAI_API_KEY) return fallback;

  const text = await callOpenAi(
    payload,
    route,
    `${instructions} Return strict JSON only with double-quoted keys and no markdown fences.`
  );

  try {
    const cleaned = (text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    logError(route, "OpenAI JSON parse failure", error);
    return fallback;
  }
}

function normalizeMarketResults(results = []) {
  return results
    .filter((item) => item.title)
    .slice(0, 12)
    .map((item) => ({
      title: item.title,
      store: item.source || item.store || item.seller,
      source: item.source || item.store || item.seller,
      price: item.price || "",
      extracted_price: item.extracted_price,
      delivery: item.delivery || item.extensions?.join(", "),
      product_link: item.product_link,
      link: item.product_link || item.link,
      thumbnail: safeImageUrl(item.thumbnail),
      rating: item.rating,
      reviews: item.reviews,
    }));
}

const DISCOVERY_CATEGORY_ORDER = ["Designer", "Niche", "Arabic / Middle Eastern", "Affordable", "Luxury"];
const KNOWN_DESIGNER_BRANDS = [
  "dior", "chanel", "yves saint laurent", "ysl", "armani", "emporio armani", "prada", "versace",
  "dolce gabbana", "dolce & gabbana", "gucci", "valentino", "jean paul gaultier", "viktor rolf",
  "viktor&rolf", "azzaro", "burberry", "givenchy", "tom ford", "hermes", "paco rabanne", "rabanne",
];
const KNOWN_NICHE_BRANDS = [
  "le labo", "byredo", "diptyque", "jo malone", "mancera", "montale", "nishane",
];
const KNOWN_LUXURY_BRANDS = [
  "parfums de marly", "initio", "kilian", "by kilian", "maison francis kurkdjian", "mfk", "creed",
  "xerjoff", "amouage", "roja", "clive christian", "frederic malle", "bond no 9",
];
const KNOWN_ARABIC_BRANDS = [
  "lattafa", "afnan", "armaf", "al haramain", "rasasi", "swiss arabian", "ajmal",
  "maison alhambra", "french avenue", "fragrance world",
];
const KNOWN_AFFORDABLE_BRANDS = [
  "zara", "nautica", "montblanc", "coach", "guess", "bentley", "cremo", "banana republic", "davidoff",
  "halloween man", "antonio banderas",
];
const REJECTED_WEARABLE_TERMS = [
  "essential oil", "anointing", "candle", "room spray", "diffuser", "soap", "lotion", "body oil",
  "fragrance oil", "roll on", "roll-on", "home fragrance", "wax", "incense oil", "perfume oil",
  "refill", "deodorant", "body spray", "air freshener", "reed diffuser", "body mist", "hair mist",
  "linen spray", "car freshener", "beard oil", "massage oil", "cinnamon bun", "toast",
  "cinnamon toast", "pastry", "novelty scent",
];
const IMAGE_REJECTED_TERMS = [
  "bag", "handbag", "purse", "tote", "wallet", "shoes", "shoe", "shirt", "dress", "makeup", "lipstick",
  "candle", "diffuser", "oil", "essential oil", "anointing oil", "room spray", "lotion", "soap",
  "deodorant", "refill", "wax", "incense", "poster", "sample lot",
];
const POSITIVE_FRAGRANCE_TERMS = [
  "eau de parfum", "edp", "eau de toilette", "edt", "parfum", "extrait", "cologne", "perfume", "fragrance",
];
const CURATED_IMAGE_CACHE = new Map();
const CURATED_DISCOVERY_LIBRARY = [
  { name: "Dior Sauvage", brand: "Dior", categoryLabel: "Designer", notes: ["Bergamot", "Pink Pepper", "Lavender", "Ambroxan", "Cedarwood", "Vetiver"] },
  { name: "Bleu de Chanel", brand: "Chanel", categoryLabel: "Designer", notes: ["Grapefruit", "Lemon", "Mint", "Pink Pepper", "Ginger", "Incense", "Vetiver", "Cedarwood", "Sandalwood", "Patchouli", "Labdanum", "Musk"] },
  { name: "Black Opium", brand: "Yves Saint Laurent", categoryLabel: "Designer", notes: ["Pink Pepper", "Coffee", "Jasmine", "Vanilla", "Patchouli"] },
  { name: "Spicebomb Extreme", brand: "Viktor&Rolf", categoryLabel: "Designer", notes: ["Cinnamon", "Tobacco", "Vanilla", "Black Pepper"] },
  { name: "Stronger With You Intensely", brand: "Emporio Armani", categoryLabel: "Designer", notes: ["Cinnamon", "Vanilla", "Tonka Bean", "Amber"] },
  { name: "Azzaro The Most Wanted", brand: "Azzaro", categoryLabel: "Designer", notes: ["Cinnamon", "Amberwood", "Cardamom", "Toffee"] },
  { name: "Burberry London for Men", brand: "Burberry", categoryLabel: "Designer", notes: ["Cinnamon", "Tobacco", "Leather", "Lavender"] },
  { name: "Santal 33", brand: "Le Labo", categoryLabel: "Luxury", notes: ["Sandalwood", "Cedarwood", "Leather", "Violet", "Musk"] },
  { name: "Wood Sage & Sea Salt", brand: "Jo Malone London", categoryLabel: "Niche", notes: ["Sage", "Marine Accord", "Grapefruit", "Musk"] },
  { name: "Vanilla 28", brand: "Kayali Fragrances", categoryLabel: "Luxury", notes: ["Vanilla", "Tonka Bean", "Amber", "Jasmine", "Musk"] },
  { name: "Oud Wood", brand: "Tom Ford", categoryLabel: "Luxury", notes: ["Oud", "Sandalwood", "Cardamom", "Pink Pepper", "Vanilla"] },
  { name: "Althair", brand: "Parfums de Marly", categoryLabel: "Luxury", notes: ["Orange Blossom", "Bergamot", "Cinnamon", "Cardamom", "Vanilla", "Elemi", "Praline", "Ambroxan", "Guaiac Wood", "Musk"] },
  { name: "Liquid Brun", brand: "French Avenue", categoryLabel: "Arabic / Middle Eastern", notes: ["Orange Blossom", "Bergamot", "Cinnamon", "Cardamom", "Vanilla", "Elemi", "Praline", "Ambroxan", "Guaiac Wood", "Musk"] },
  { name: "Club de Nuit Intense Man", brand: "Armaf", categoryLabel: "Arabic / Middle Eastern", notes: ["Lemon", "Pineapple", "Bergamot", "Rose", "Jasmine", "Musk", "Patchouli", "Vanilla"] },
  { name: "Aventus", brand: "Creed", categoryLabel: "Luxury", notes: ["Pineapple", "Bergamot", "Apple", "Rose", "Jasmine", "Patchouli", "Oakmoss", "Musk", "Vanilla"] },
  { name: "Khamrah", brand: "Lattafa", categoryLabel: "Arabic / Middle Eastern", notes: ["Cinnamon", "Nutmeg", "Praline", "Vanilla", "Tonka Bean", "Amber", "Musk"] },
  { name: "9PM", brand: "Afnan", categoryLabel: "Arabic / Middle Eastern", notes: ["Apple", "Cinnamon", "Lavender", "Orange Blossom", "Vanilla", "Amber", "Patchouli"] },
  { name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", categoryLabel: "Luxury", notes: ["Saffron", "Jasmine", "Amber", "Ambroxan", "Cedarwood"] },
  { name: "Ana Abiyedh Rouge", brand: "Lattafa", categoryLabel: "Arabic / Middle Eastern", notes: ["Saffron", "Jasmine", "Amber", "Musk"] },
  { name: "Layton", brand: "Parfums de Marly", categoryLabel: "Luxury", notes: ["Apple", "Lavender", "Bergamot", "Geranium", "Violet", "Vanilla", "Cardamom", "Sandalwood", "Patchouli"] },
  { name: "Libre", brand: "Yves Saint Laurent", categoryLabel: "Designer", notes: ["Lavender", "Orange Blossom", "Jasmine", "Vanilla", "Musk"] },
  { name: "Chance Eau Tendre", brand: "Chanel", categoryLabel: "Designer", notes: ["Grapefruit", "Quince", "Jasmine", "White Musk", "Iris"] },
  { name: "Burberry Goddess", brand: "Burberry", categoryLabel: "Designer", notes: ["Vanilla", "Lavender", "Cacao", "Ginger"] },
  { name: "Donna Born in Roma", brand: "Valentino", categoryLabel: "Designer", notes: ["Black Currant", "Jasmine", "Vanilla", "Cashmeran"] },
  { name: "Paradoxe", brand: "Prada", categoryLabel: "Designer", notes: ["Neroli", "Jasmine", "Orange Blossom", "Amber", "Musk", "Vanilla"] },
  { name: "J'adore", brand: "Dior", categoryLabel: "Designer", notes: ["Pear", "Melon", "Jasmine", "Rose", "Musk", "Vanilla"] },
  { name: "Mon Guerlain", brand: "Guerlain", categoryLabel: "Luxury", notes: ["Lavender", "Jasmine", "Vanilla", "Sandalwood"] },
  { name: "Good Girl Blush", brand: "Carolina Herrera", categoryLabel: "Designer", notes: ["Bergamot", "Peony", "Rose", "Vanilla", "Tonka Bean"] },
];

const CURATED_ALIAS_LIBRARY = [
  {
    name: "Y Eau de Parfum",
    brand: "Yves Saint Laurent",
    aliases: [
      "ysl y edp",
      "ysl y eau de parfum",
      "y edp",
      "y eau de parfum",
      "yves saint laurent y edp",
      "yves saint laurent y eau de parfum",
      "y by ysl",
      "y by yves saint laurent",
      "ysl y",
    ],
    categoryLabel: "Designer",
    notes: ["Apple", "Ginger", "Bergamot", "Sage", "Juniper Berries", "Geranium", "Amberwood", "Tonka Bean", "Cedar", "Vetiver", "Olibanum"],
    vibe: "fresh woody aromatic",
    gender: "masculine/unisex",
  },
  {
    name: "Y Le Parfum",
    brand: "Yves Saint Laurent",
    aliases: ["ysl y le parfum", "y le parfum", "yves saint laurent y le parfum"],
    categoryLabel: "Designer",
    notes: ["Apple", "Grapefruit", "Ginger", "Sage", "Lavender", "Geranium", "Cedarwood", "Tonka Bean", "Olibanum", "Patchouli"],
    vibe: "fresh woody aromatic",
    gender: "masculine/unisex",
  },
  {
    name: "Dior Sauvage Eau de Parfum",
    brand: "Dior",
    aliases: ["dior sauvage edp", "sauvage edp", "sauvage eau de parfum", "dior sauvage eau de parfum"],
    categoryLabel: "Designer",
    notes: ["Bergamot", "Pepper", "Sichuan Pepper", "Lavender", "Star Anise", "Nutmeg", "Ambroxan", "Vanilla"],
    vibe: "fresh spicy amber",
    gender: "masculine/unisex",
  },
  {
    name: "Bleu de Chanel Eau de Parfum",
    brand: "Chanel",
    aliases: ["bleu de chanel edp", "bdc edp", "blue de chanel edp", "bleu de chanel eau de parfum"],
    categoryLabel: "Designer",
    notes: ["Grapefruit", "Lemon", "Mint", "Pink Pepper", "Ginger", "Incense", "Vetiver", "Cedarwood", "Sandalwood", "Patchouli", "Labdanum", "Musk"],
    vibe: "blue woody aromatic",
    gender: "masculine/unisex",
  },
  {
    name: "La Nuit de L'Homme",
    brand: "Yves Saint Laurent",
    aliases: ["ysl la nuit", "ysl la nuit de lhomme", "la nuit de l'homme", "la nuit de l homme"],
    categoryLabel: "Designer",
    notes: ["Cardamom", "Bergamot", "Lavender", "Cedar", "Vetiver", "Caraway"],
    vibe: "spicy date night",
    gender: "masculine/unisex",
  },
  {
    name: "MYSLF",
    brand: "Yves Saint Laurent",
    aliases: ["ysl myslf", "myself ysl", "yves saint laurent myslf", "ysl myself"],
    categoryLabel: "Designer",
    notes: ["Bergamot", "Orange Blossom", "Ambrofix", "Patchouli", "Musk", "Woods"],
    vibe: "clean woody floral",
    gender: "masculine/unisex",
  },
  {
    name: "Libre",
    brand: "Yves Saint Laurent",
    aliases: ["ysl libre", "yves saint laurent libre", "libre ysl"],
    categoryLabel: "Designer",
    notes: ["Lavender", "Mandarin Orange", "Orange Blossom", "Jasmine", "Vanilla", "Musk", "Cedar"],
    vibe: "lavender vanilla floral",
    gender: "feminine/unisex",
  },
  {
    name: "Luna Rossa Carbon",
    brand: "Prada",
    aliases: ["prada luna rossa carbon", "luna rossa carbon"],
    categoryLabel: "Designer",
    notes: ["Bergamot", "Pepper", "Lavender", "Metallic Notes", "Coal", "Ambroxan", "Patchouli"],
    vibe: "fresh metallic aromatic",
    gender: "masculine/unisex",
  },
  {
    name: "Acqua di Gio Profondo",
    brand: "Giorgio Armani",
    aliases: ["adg profondo", "acqua di gio profondo", "armani profondo"],
    categoryLabel: "Designer",
    notes: ["Marine Notes", "Bergamot", "Green Mandarin", "Rosemary", "Lavender", "Cypress", "Musk", "Patchouli"],
    vibe: "aquatic aromatic",
    gender: "masculine/unisex",
  },
  {
    name: "Le Male Le Parfum",
    brand: "Jean Paul Gaultier",
    aliases: ["jpg le male le parfum", "jean paul gaultier le male le parfum", "le male le parfum"],
    categoryLabel: "Designer",
    notes: ["Cardamom", "Lavender", "Iris", "Vanilla", "Oriental Notes", "Woods"],
    vibe: "sweet spicy powdery",
    gender: "masculine/unisex",
  },
  {
    name: "The Most Wanted",
    brand: "Azzaro",
    aliases: ["azzaro the most wanted", "the most wanted azzaro", "azzaro most wanted"],
    categoryLabel: "Designer",
    notes: ["Cardamom", "Toffee", "Amberwood"],
    vibe: "sweet amber spicy",
    gender: "masculine/unisex",
  },
  {
    name: "Stronger With You Intensely",
    brand: "Emporio Armani",
    aliases: ["stronger with you intensely", "armani stronger with you intensely", "swy intensely"],
    categoryLabel: "Designer",
    notes: ["Pink Pepper", "Juniper", "Violet", "Cinnamon", "Toffee", "Tonka Bean", "Vanilla", "Amber", "Suede"],
    vibe: "sweet warm spicy",
    gender: "masculine/unisex",
  },
  {
    name: "Hawas",
    brand: "Rasasi",
    aliases: ["rasasi hawas", "hawas", "hawas for him"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Apple", "Bergamot", "Cinnamon", "Lemon", "Watery Notes", "Plum", "Orange Blossom", "Cardamom", "Ambergris", "Musk", "Driftwood", "Patchouli"],
    vibe: "fresh aquatic sweet",
    gender: "masculine/unisex",
  },
  {
    name: "Hawas Ice",
    brand: "Rasasi",
    aliases: ["rasasi hawas ice", "hawas ice"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Apple", "Italian Bergamot", "Star Anise", "Lemon", "Plum", "Orange Blossom", "Cardamom", "Amber", "Musk", "Driftwood"],
    vibe: "fresh aquatic sweet",
    gender: "masculine/unisex",
  },
  {
    name: "Hawas Fire",
    brand: "Rasasi",
    aliases: ["rasasi hawas fire", "hawas fire"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Bergamot", "Cinnamon", "Apple", "Orange Blossom", "Cardamom", "Amber", "Musk", "Patchouli", "Woody Notes"],
    vibe: "warm spicy sweet",
    gender: "masculine/unisex",
  },
  {
    name: "Khamrah",
    brand: "Lattafa",
    aliases: ["lattafa khamrah", "khamrah"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Cinnamon", "Nutmeg", "Bergamot", "Dates", "Praline", "Tuberose", "Vanilla", "Tonka Bean", "Amberwood", "Myrrh"],
    vibe: "sweet gourmand amber",
    gender: "unisex",
  },
  {
    name: "Amber Oud Gold Edition",
    brand: "Al Haramain",
    aliases: ["amber oud gold", "al haramain amber oud gold", "amber oud gold edition"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Bergamot", "Green Notes", "Melon", "Pineapple", "Amber", "Vanilla", "Musk", "Woods"],
    vibe: "fruity sweet amber",
    gender: "unisex",
  },
  {
    name: "Amber Oud Ruby Edition",
    brand: "Al Haramain",
    aliases: ["amber oud ruby", "al haramain amber oud ruby", "amber oud ruby edition"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Saffron", "Bitter Almond", "Jasmine", "Cedar", "Ambergris", "Musk", "Woody Notes"],
    vibe: "amber woody sweet",
    gender: "unisex",
  },
  {
    name: "Amber Oud Rose Edition",
    brand: "Al Haramain",
    aliases: ["amber oud rose", "al haramain amber oud rose", "amber oud rose edition"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Rose", "Saffron", "Jasmine", "Amber", "Musk", "Woody Notes", "Vanilla"],
    vibe: "rose amber woody",
    gender: "unisex",
  },
  {
    name: "Side Effect",
    brand: "Initio",
    aliases: ["initio side effect", "side effect"],
    categoryLabel: "Luxury",
    notes: ["Rum", "Vanilla", "Tobacco", "Cinnamon", "Saffron"],
    vibe: "boozy sweet spicy",
    gender: "unisex",
  },
  {
    name: "Layton",
    brand: "Parfums de Marly",
    aliases: ["pdm layton", "parfums de marly layton", "layton"],
    categoryLabel: "Luxury",
    notes: ["Apple", "Lavender", "Bergamot", "Mandarin Orange", "Geranium", "Violet", "Jasmine", "Vanilla", "Cardamom", "Sandalwood", "Patchouli", "Pepper"],
    vibe: "sweet spicy apple",
    gender: "masculine/unisex",
  },
  {
    name: "Althair",
    brand: "Parfums de Marly",
    aliases: ["pdm althair", "althair", "parfums de marly althair", "altair"],
    categoryLabel: "Luxury",
    notes: ["Orange Blossom", "Bergamot", "Cinnamon", "Cardamom", "Vanilla", "Elemi", "Praline", "Ambroxan", "Guaiac Wood", "Musk"],
    vibe: "vanilla amber sweet",
    gender: "masculine/unisex",
  },
  {
    name: "Naxos",
    brand: "Xerjoff",
    aliases: ["xerjoff naxos", "naxos"],
    categoryLabel: "Luxury",
    notes: ["Lavender", "Bergamot", "Lemon", "Honey", "Cinnamon", "Cashmeran", "Tobacco Leaf", "Tonka Bean", "Vanilla"],
    vibe: "honey tobacco spicy",
    gender: "unisex",
  },
  {
    name: "Angels' Share",
    brand: "Kilian",
    aliases: ["angels share", "angel's share", "kilian angels share", "by kilian angels share"],
    categoryLabel: "Luxury",
    notes: ["Cognac", "Cinnamon", "Tonka Bean", "Oak", "Praline", "Vanilla", "Sandalwood"],
    vibe: "boozy gourmand amber",
    gender: "unisex",
  },
  {
    name: "God of Fire",
    brand: "Stephane Humbert Lucas",
    aliases: ["god of fire", "shl god of fire", "stephane humbert lucas god of fire"],
    categoryLabel: "Luxury",
    notes: ["Mango", "Ginger", "Lemon", "Red Berries", "Coumarin", "Jasmine", "Cedar", "Musk", "Amber"],
    vibe: "tropical fruity amber",
    gender: "unisex",
  },
  {
    name: "Vanilla 28",
    brand: "Kayali Fragrances",
    aliases: ["kayali vanilla 28", "vanilla 28", "kayali vanilla"],
    categoryLabel: "Luxury",
    notes: ["Vanilla Orchid", "Jasmine", "Brown Sugar", "Tonka Bean", "Amber", "Musk", "Patchouli"],
    vibe: "sweet vanilla amber",
    gender: "unisex",
  },
  {
    name: "Liquid Brun",
    brand: "French Avenue",
    aliases: ["liquid brun", "french avenue liquid brun", "liquid brunn"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Orange Blossom", "Bergamot", "Cinnamon", "Cardamom", "Vanilla", "Elemi", "Praline", "Ambroxan", "Guaiac Wood", "Musk"],
    vibe: "vanilla amber sweet",
    gender: "masculine/unisex",
  },
  {
    name: "Club de Nuit Intense Man",
    brand: "Armaf",
    aliases: ["club de nuit intense man", "club de nuit", "cdnim", "armaf cdnim"],
    categoryLabel: "Arabic / Middle Eastern",
    notes: ["Lemon", "Pineapple", "Bergamot", "Black Currant", "Apple", "Birch", "Jasmine", "Rose", "Musk", "Ambergris", "Patchouli", "Vanilla"],
    vibe: "fruity smoky woody",
    gender: "masculine/unisex",
  },
];

const CURATED_DUPE_LIBRARY = [
  { target: "Althair", targetBrand: "Parfums de Marly", name: "Liquid Brun", brand: "French Avenue", confidenceBoost: 32 },
  { target: "Baccarat Rouge 540", targetBrand: "Maison Francis Kurkdjian", name: "Ana Abiyedh Rouge", brand: "Lattafa", confidenceBoost: 30 },
  { target: "Aventus", targetBrand: "Creed", name: "Club de Nuit Intense Man", brand: "Armaf", confidenceBoost: 34 },
  { target: "God of Fire", targetBrand: "Stephane Humbert Lucas", name: "Lataffa Sehr", brand: "Lattafa", confidenceBoost: 18 },
  { target: "Bleu de Chanel", targetBrand: "Chanel", name: "Blue Iconic", brand: "Maison Alhambra", confidenceBoost: 18 },
  { target: "Dior Sauvage", targetBrand: "Dior", name: "Modest Une", brand: "Afnan", confidenceBoost: 20 },
];

function fragranceLabel(profile = {}) {
  const brand = toDisplayString(profile.brand);
  const name = toDisplayString(profile.name);
  if (brand && normalizeName(name).startsWith(normalizeName(brand))) return name;
  return [brand, name].filter(Boolean).join(" ").trim();
}

function mergeCuratedEntry(existing = {}, incoming = {}) {
  return {
    ...existing,
    ...incoming,
    notes: uniqueStrings([...(existing.notes || []), ...(incoming.notes || [])]),
    aliases: uniqueStrings([...(existing.aliases || []), ...(incoming.aliases || [])]),
    vibe: incoming.vibe || existing.vibe || "",
    gender: incoming.gender || existing.gender || "",
    categoryLabel: incoming.categoryLabel || existing.categoryLabel || normalizedBrandCategory(incoming.brand || existing.brand),
  };
}

function curatedCatalog() {
  const map = new Map();
  [...CURATED_DISCOVERY_LIBRARY, ...CURATED_ALIAS_LIBRARY].forEach((entry) => {
    const key = `${normalizeName(entry.brand)}::${normalizeName(entry.name)}`;
    map.set(key, mergeCuratedEntry(map.get(key), entry));
  });
  return [...map.values()];
}

function curatedEntryMatchesQuery(entry = {}, query = "", exactOnly = false) {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return false;
  const name = normalizeName(entry.name);
  const brand = normalizeName(entry.brand);
  const full = normalizeName(`${entry.brand} ${entry.name}`);
  const aliases = (entry.aliases || []).map(normalizeName);
  if ([name, full, ...aliases].includes(normalizedQuery)) return true;
  if (exactOnly) return false;
  if (full.includes(normalizedQuery) || normalizedQuery.includes(full)) return true;
  return aliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias));
}

function curatedEntryForQuery(query, exactOnly = false) {
  const catalog = curatedCatalog();
  const exact = catalog.find((entry) => curatedEntryMatchesQuery(entry, query, true));
  if (exact || exactOnly) return exact || null;
  return catalog.find((entry) => curatedEntryMatchesQuery(entry, query, false)) || null;
}

function toCuratedProfile(entry, query = "", confidence = "medium") {
  if (!entry) return null;
  return withProfileMetadata({
    found: true,
    query,
    name: entry.name,
    brand: entry.brand,
    aliases: uniqueStrings(entry.aliases || []),
    image_url: "",
    image: "",
    image_source: "placeholder",
    image_confidence: "fallback",
    notes: entry.notes || [],
    top_notes: [],
    middle_notes: [],
    base_notes: [],
    accords: entry.accords || [],
    description: "",
    shortDescription: shortProfileDescription(entry),
    rating: null,
    reviewCount: null,
    categoryLabel: entry.categoryLabel || normalizedBrandCategory(entry.brand),
    vibe: entry.vibe || "",
    gender: entry.gender || "",
    confidence,
  }, "curated");
}

function yslYQuery(query = "") {
  const normalized = normalizeName(query);
  return /\b(ysl y|y edp|y eau de parfum|yves saint laurent y|y by ysl|y by yves saint laurent)\b/.test(normalized);
}

function yslYTitleMatch(title = "", query = "") {
  const normalized = normalizeName(title);
  const normalizedQuery = normalizeName(query);
  if (/\b(libre|black opium|myself|myslf|la nuit|l homme|lhomme|tuxedo|kouros|mon paris|makeup|lipstick|mascara|deodorant)\b/.test(normalized)) {
    return false;
  }
  const wantsLeParfum = normalizedQuery.includes("le parfum");
  if (!wantsLeParfum && /\b(le parfum|elixir|intense|eau fraiche|iced|live)\b/.test(normalized)) return false;
  if (wantsLeParfum && !normalized.includes("le parfum")) return false;
  if (/\b(edp|eau de parfum)\b/.test(normalizedQuery) && /\b(eau de toilette|edt)\b/.test(normalized)) return false;
  return normalized.includes("ysl y") ||
    normalized.includes("y eau de parfum") ||
    normalized.includes("yves saint laurent y") ||
    normalized.includes("y edp");
}

function queryAliases(query = "") {
  const aliases = [];
  const add = (value) => {
    const cleaned = toDisplayString(value).replace(/\s+/g, " ").trim();
    if (cleaned && !aliases.some((item) => normalizeName(item) === normalizeName(cleaned))) aliases.push(cleaned);
  };
  add(query);
  const curated = curatedEntryForQuery(query);
  if (curated) {
    add(`${curated.brand} ${curated.name}`);
    add(curated.name);
    (curated.aliases || []).forEach(add);
  }
  if (yslYQuery(query) || normalizeName(query) === "y") {
    [
      "YSL Y Eau de Parfum",
      "Yves Saint Laurent Y Eau de Parfum",
      "Y Eau de Parfum Yves Saint Laurent",
      "Y by Yves Saint Laurent Eau de Parfum",
    ].forEach(add);
  }
  return aliases.slice(0, 10);
}

function mergeProfileData(primary = {}, fallback = {}, query = "") {
  const primaryNotes = allProfileNotes(primary);
  const fallbackNotes = allProfileNotes(fallback);
  const useFallbackNotes = fallbackNotes.length && primaryNotes.length < 3;
  return withProfileMetadata({
    ...fallback,
    ...primary,
    query,
    aliases: uniqueStrings([...(fallback.aliases || []), ...(primary.aliases || [])]),
    notes: useFallbackNotes ? fallback.notes || fallbackNotes : primary.notes || primaryNotes,
    top_notes: primary.top_notes?.length ? primary.top_notes : fallback.top_notes || [],
    middle_notes: primary.middle_notes?.length ? primary.middle_notes : fallback.middle_notes || [],
    base_notes: primary.base_notes?.length ? primary.base_notes : fallback.base_notes || [],
    accords: primary.accords?.length ? primary.accords : fallback.accords || [],
    categoryLabel: primary.categoryLabel && primary.categoryLabel !== "Unknown" ? primary.categoryLabel : fallback.categoryLabel,
    category: primary.category && primary.category !== "Unknown" ? primary.category : fallback.category,
    vibe: primary.vibe || fallback.vibe || "",
    gender: primary.gender || fallback.gender || "",
    confidence: primary.confidence === "high" || fallback.confidence === "high" ? "high" : primary.confidence || fallback.confidence || "medium",
  }, useFallbackNotes ? "curated" : primary.note_source || fallback.note_source || "verified");
}

function filterShoppingResults(results, query) {
  return results.filter((item) => isWearableShoppingResult(item, query));
}

function isVibeQuery(query) {
  const normalized = normalizeName(query);
  return [
    "summer",
    "winter",
    "date night",
    "clubbing",
    "office",
    "gym",
    "fresh",
    "sweet",
    "blue",
    "aquatic",
    "clean",
    "woody",
    "vanilla",
    "sandalwood",
  ].some((term) => normalized.includes(term));
}

function getRouteQuery(requestUrl) {
  return (requestUrl.searchParams.get("query") || requestUrl.searchParams.get("q") || "").trim();
}

function safeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/^http:\/\//i, "https://");
}

function imageMetaForProvider(imageUrl) {
  const safe = safeImageUrl(imageUrl);
  return {
    image_url: safe || "",
    image: safe || "",
    image_source: safe ? "provider" : "placeholder",
    image_confidence: safe ? "high" : "fallback",
  };
}

function normalizeFragellaFragrance(item) {
  if (!item) return null;
  const notes = item.Notes || item.notes || {};
  const imageUrl = item["Image URL"] || item.imageUrl || item.image_url || item.image || "";
  const topNotes = normalizeFragellaNotes(notes.Top || notes.top || item.top_notes || item.topNotes);
  const middleNotes = normalizeFragellaNotes(notes.Middle || notes.middle || item.middle_notes || item.middleNotes || item.heart_notes || item.heartNotes);
  const baseNotes = normalizeFragellaNotes(notes.Base || notes.base || item.base_notes || item.baseNotes);
  return withProfileMetadata({
    source: "hidden",
    found: true,
    name: item.Name || item.name,
    brand: item.Brand || item.brand,
    ...imageMetaForProvider(imageUrl),
    price: item.Price || item.price || "",
    accords: normalizeAccords(item["Main Accords"] || item.mainAccords || item.accords || []),
    accordPercentages: item["Main Accords Percentage"] || item.mainAccordsPercentage || {},
    description: item.Description || item.description || "",
    top_notes: topNotes,
    middle_notes: middleNotes,
    base_notes: baseNotes,
    notesByLayer: {
      top: topNotes,
      middle: middleNotes,
      base: baseNotes,
    },
    longevity: item.Longevity || item.longevity || "",
    sillage: item.Sillage || item.sillage || "",
  }, "verified");
}

function normalizeAccords(accords = []) {
  if (Array.isArray(accords)) {
    return accords.map((accord) => accord.name || accord.Name || accord).filter(Boolean);
  }
  if (accords && typeof accords === "object") return Object.keys(accords);
  return [];
}

function normalizeFragellaNotes(notes = []) {
  return (Array.isArray(notes) ? notes : [])
    .map((note) => ({
      name: note.name || note.Name || note,
      image_url: note.imageUrl || note["Image URL"] || note.image_url || note.image || "",
      imageUrl: note.imageUrl || note["Image URL"] || note.image_url || note.image || "",
    }))
    .filter((note) => note.name);
}

function toDisplayString(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return String(
      value.name ||
      value.Name ||
      value.title ||
      value.label ||
      value.value ||
      value.text ||
      ""
    ).trim();
  }
  return "";
}

function validatedText(value, label = "value", maxLength = 120, required = true) {
  const cleaned = toDisplayString(value).replace(/\s+/g, " ").trim();
  if (required && !cleaned) {
    throw new RequestError(400, "BAD_REQUEST", `${label} is required.`);
  }
  if (cleaned.length > maxLength) {
    throw new RequestError(400, "BAD_REQUEST", `${label} must be ${maxLength} characters or fewer.`);
  }
  return cleaned;
}

function validatedQuery(requestUrl, label = "query", maxLength = 120) {
  return validatedText(requestUrl.searchParams.get("query") || requestUrl.searchParams.get("q") || "", label, maxLength);
}

function safeLower(value) {
  return toDisplayString(value).toLowerCase();
}

function includesAny(haystack, terms = []) {
  return terms.some((term) => haystack.includes(term));
}

function normalizedBrandCategory(brand) {
  const normalized = normalizeName(brand);
  if (!normalized) return "Unknown";
  if (KNOWN_ARABIC_BRANDS.some((term) => normalized.includes(term))) return "Arabic / Middle Eastern";
  if (KNOWN_AFFORDABLE_BRANDS.some((term) => normalized.includes(term))) return "Affordable";
  if (KNOWN_LUXURY_BRANDS.some((term) => normalized.includes(term))) return "Luxury";
  if (KNOWN_NICHE_BRANDS.some((term) => normalized.includes(term))) return "Niche";
  if (KNOWN_DESIGNER_BRANDS.some((term) => normalized.includes(term))) return "Designer";
  return "Unknown";
}

function isLikelyNoteQuery(query) {
  const normalized = cleanNoteQuery(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 2) return false;
  if (isVibeQuery(query)) return false;
  return words.every((word) =>
    NOTE_FAMILIES.has(word) ||
    [...NOTE_FAMILIES.values()].includes(word) ||
    [...NOTE_FAMILIES.keys()].some((note) => note.includes(word) || word.includes(note))
  );
}

function cleanNoteQuery(query) {
  return normalizeName(query)
    .replace(/\b(cologne|colognes|perfume|perfumes|fragrance|fragrances|edp|edt|parfum|eau de parfum|eau de toilette|wearable|with|contains|containing|for men|for women)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryMatchesNotes(query, profile) {
  const normalizedQuery = cleanNoteQuery(query) || normalizeName(query);
  const notePool = uniqueStrings([...(profile.notes || []), ...(profile.accords || [])]).map(normalizeName);
  return notePool.some((note) => note.includes(normalizedQuery) || normalizedQuery.includes(note));
}

function isWearableFragrance(profile, query = "") {
  const name = normalizeName(profile.name);
  const brand = normalizeName(profile.brand);
  const combined = normalizeName(`${profile.brand} ${profile.name}`);
  const noteText = normalizeName(uniqueStrings([...(profile.notes || []), ...(profile.accords || [])]).join(" "));
  const category = normalizedBrandCategory(profile.brand);
  const knownBrand = category !== "Unknown";
  if (!name) return false;
  if (includesAny(combined, REJECTED_WEARABLE_TERMS)) return false;
  if (query && isLikelyNoteQuery(query) && !queryMatchesNotes(query, profile)) return false;
  if (!knownBrand && !includesAny(combined, POSITIVE_FRAGRANCE_TERMS) && !profile.notes?.length) return false;
  if (includesAny(noteText, ["cinnamon bun", "toast"])) return false;
  return true;
}

function curatedDiscoveryMatches(query) {
  const normalizedQuery = cleanNoteQuery(query) || normalizeName(query);
  return curatedCatalog()
    .filter((entry) => {
      const searchable = normalizeName(`${entry.brand} ${entry.name} ${(entry.aliases || []).join(" ")} ${(entry.notes || []).join(" ")} ${entry.vibe || ""}`);
      return searchable.includes(normalizedQuery);
    })
    .map((entry) => withProfileMetadata({
      query,
      found: true,
      name: entry.name,
      brand: entry.brand,
      aliases: entry.aliases || [],
      image_url: "",
      image: "",
      notes: entry.notes,
      top_notes: [],
      middle_notes: [],
      base_notes: [],
      accords: [],
      description: "",
      shortDescription: shortProfileDescription(entry),
      rating: null,
      reviewCount: null,
      categoryLabel: entry.categoryLabel,
      vibe: entry.vibe || "",
      gender: entry.gender || "",
      source: "hidden",
      confidence: "medium",
    }, "curated"));
}

function curatedProfileForQuery(query) {
  return toCuratedProfile(curatedEntryForQuery(query), query, curatedEntryForQuery(query, true) ? "high" : "medium");
}

function rapidApiUrl(pathname = "/multi-search") {
  if (!process.env.RAPIDAPI_HOST) throw new Error("RAPIDAPI_HOST is not configured");
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(`https://${process.env.RAPIDAPI_HOST}${cleanPath}`);
}

async function callRapidApiMultiSearch(query, route = "/debug/rapidapi", limit = 10) {
  if (!process.env.RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY is not configured");
  if (!process.env.RAPIDAPI_HOST) throw new Error("RAPIDAPI_HOST is not configured");

  const url = rapidApiUrl("/multi-search");
  const body = {
    queries: [
      {
        indexUid: "fragrances",
        q: query,
        limit,
      },
    ],
  };
  logRoute(route, "RapidAPI key exists", { RAPIDAPI_KEY: true, RAPIDAPI_HOST: process.env.RAPIDAPI_HOST });
  logRoute(route, "RapidAPI URL", url.toString());
  logRoute(route, "RapidAPI method", "POST");
  logRoute(route, "RapidAPI body", body);

  const apiResponse = await fetch(url, {
    method: "POST",
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "fragrance-api.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  logRoute(route, "RapidAPI response status", apiResponse.status);

  const text = await apiResponse.text();
  logRoute(route, "RapidAPI raw response body", text);
  return {
    status: apiResponse.status,
    contentType: apiResponse.headers.get("content-type") || "application/json; charset=utf-8",
    bodyText: text,
  };
}

function extractRapidApiCandidates(data) {
  const directHits = data?.results?.[0]?.hits;
  if (Array.isArray(directHits) && directHits.length) return directHits;

  const candidates = [];
  const seen = new Set();
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object") return;
    const possibleName = toDisplayString(
      value.name || value.Name || value.title || value.fragrance_name || value.fragranceName || value.perfume || value.perfume_name
    );
    const possibleBrand = toDisplayString(value.brand?.name || value.brand || value.Brand || value.house || value.designer);
    const possibleNotes = value.notes || value.Notes || value.top_notes || value.middle_notes || value.base_notes;
    const possibleImage = value.image || value.image_url || value.imageUrl || value.photo || value.picture || value.thumbnail;
    if (possibleName || possibleBrand || possibleNotes || possibleImage) {
      const id = JSON.stringify([possibleName, possibleBrand, possibleImage]).slice(0, 300);
      if (!seen.has(id)) {
        seen.add(id);
        candidates.push(value);
      }
    }
    Object.values(value).forEach(visit);
  };
  visit(data);
  return candidates;
}

function normalizeRapidApiNotes(notes = []) {
  if (!notes) return [];
  const list = Array.isArray(notes) ? notes : typeof notes === "string" ? notes.split(/,\s*/) : [];
  return list.map((note) => toDisplayString(note)).filter(Boolean);
}

function normalizePerfumers(perfumers = []) {
  if (!Array.isArray(perfumers)) return [];
  return perfumers.map((perfumer) => toDisplayString(perfumer?.name || perfumer)).filter(Boolean);
}

const NOTE_FAMILIES = new Map([
  ["bergamot", "citrus"],
  ["lemon", "citrus"],
  ["grapefruit", "citrus"],
  ["mandarin", "citrus"],
  ["orange blossom", "floral"],
  ["orange", "citrus"],
  ["neroli", "floral"],
  ["apple", "fruity"],
  ["green apple", "fruity"],
  ["pear", "fruity"],
  ["pineapple", "fruity"],
  ["black currant", "fruity"],
  ["marine accord", "aquatic"],
  ["sea salt", "aquatic"],
  ["sage", "aromatic"],
  ["clary sage", "aromatic"],
  ["mint", "aromatic"],
  ["lavender", "aromatic"],
  ["pink pepper", "spicy"],
  ["black pepper", "spicy"],
  ["pepper", "spicy"],
  ["cardamom", "spicy"],
  ["ginger", "spicy"],
  ["cinnamon", "spicy"],
  ["nutmeg", "spicy"],
  ["saffron", "spicy"],
  ["jasmine", "floral"],
  ["rose", "floral"],
  ["iris", "powdery"],
  ["violet", "powdery"],
  ["coffee", "gourmand"],
  ["praline", "gourmand"],
  ["vanilla", "sweet"],
  ["tonka bean", "sweet"],
  ["tonka", "sweet"],
  ["amber", "amber"],
  ["ambroxan", "amber"],
  ["musk", "musk"],
  ["cedar", "woody"],
  ["cedarwood", "woody"],
  ["sandalwood", "woody"],
  ["vetiver", "woody"],
  ["patchouli", "woody"],
  ["guaiac wood", "woody"],
  ["oud", "heavy"],
  ["leather", "heavy"],
  ["tobacco", "heavy"],
  ["incense", "smoky"],
  ["labdanum", "resin"],
  ["oakmoss", "green"],
]);

const COMPLEMENTARY_FAMILIES = {
  citrus: ["aromatic", "woody", "musk", "floral"],
  fruity: ["floral", "sweet", "musk"],
  aromatic: ["citrus", "woody", "spicy", "aquatic"],
  spicy: ["sweet", "woody", "amber", "floral"],
  floral: ["citrus", "musk", "sweet", "woody"],
  aquatic: ["citrus", "aromatic", "musk", "woody"],
  powdery: ["musk", "woody", "floral"],
  gourmand: ["sweet", "amber", "woody", "spicy"],
  sweet: ["spicy", "woody", "amber", "floral"],
  amber: ["sweet", "woody", "spicy", "musk"],
  musk: ["citrus", "floral", "woody", "aquatic"],
  woody: ["citrus", "aromatic", "spicy", "sweet", "musk"],
  resin: ["woody", "sweet", "spicy", "smoky"],
  smoky: ["woody", "resin", "sweet"],
  heavy: ["woody", "amber", "spicy"],
  green: ["citrus", "aromatic", "musk"],
};

const CONFLICT_FAMILIES = new Set([
  "aquatic:heavy",
  "aquatic:gourmand",
  "citrus:heavy",
  "fruity:heavy",
  "green:heavy",
  "smoky:aquatic",
]);

function noteFamily(note) {
  const normalized = safeLower(note);
  if (!normalized) return "";
  if (NOTE_FAMILIES.has(normalized)) return NOTE_FAMILIES.get(normalized);
  return [...NOTE_FAMILIES.entries()].find(([key]) => normalized.includes(key) || key.includes(normalized))?.[1] || "";
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => toDisplayString(value)).filter(Boolean))];
}

function shortProfileDescription(profile) {
  const accordText = uniqueStrings(profile.accords || []).slice(0, 3).join(", ");
  const noteText = uniqueStrings(profile.notes || []).slice(0, 4).join(", ");
  if (accordText && noteText) return `${accordText} with notes of ${noteText}`;
  if (accordText) return accordText;
  if (noteText) return `Notes include ${noteText}`;
  return "Profile data is still limited for this fragrance.";
}

function allProfileNotes(profile = {}) {
  return uniqueStrings([
    ...(profile.notes || []),
    ...(profile.top_notes || []),
    ...(profile.middle_notes || []),
    ...(profile.base_notes || []),
  ]);
}

function withProfileMetadata(profile = {}, noteSource = "verified") {
  const notes = allProfileNotes(profile);
  const category = profile.category || profile.categoryLabel || normalizedBrandCategory(profile.brand);
  const confidence = profile.confidence || (notes.length >= 3 ? "high" : notes.length ? "medium" : "low");
  return {
    ...profile,
    notes: uniqueStrings(profile.notes || []),
    top_notes: uniqueStrings(profile.top_notes || []),
    middle_notes: uniqueStrings(profile.middle_notes || []),
    base_notes: uniqueStrings(profile.base_notes || []),
    accords: uniqueStrings(profile.accords || []),
    category,
    categoryLabel: profile.categoryLabel || category,
    confidence,
    note_source: profile.note_source || noteSource,
    message: profile.message || (notes.length ? "" : "Scent note data is limited for this fragrance."),
    source: "hidden",
  };
}

function normalizeRapidApiFragrance(item) {
  if (!item) return null;
  const imageUrl = toDisplayString(
    item.image?.url ||
    item.picture?.url ||
    item.thumbnail?.url ||
    item.image ||
    item.picture ||
    item.thumbnail ||
    item.image_url ||
    item.imageUrl
  );
  const name = toDisplayString(item.name || item.Name || item.title || item.fragrance_name || item.fragranceName || item.perfume || item.perfume_name);
  const brand = toDisplayString(item.brand?.name || item.brand || item.Brand || item.house || item.designer);
  const notes = normalizeRapidApiNotes(item.notes || item.Notes || []);
  const topNotes = normalizeRapidApiNotes(item.top_notes || item.topNotes || []);
  const middleNotes = normalizeRapidApiNotes(item.middle_notes || item.middleNotes || item.heart_notes || item.heartNotes || []);
  const baseNotes = normalizeRapidApiNotes(item.base_notes || item.baseNotes || []);
  const accords = normalizeAccords(item.accords || item.main_accords || item.mainAccords || item["Main Accords"] || []);
  const perfumers = normalizePerfumers(item.perfumers || []);

  return withProfileMetadata({
    found: Boolean(name || brand),
    name,
    brand,
    ...imageMetaForProvider(imageUrl),
    notes: uniqueStrings(notes),
    top_notes: topNotes,
    middle_notes: middleNotes,
    base_notes: baseNotes,
    notesByLayer: {
      top: topNotes,
      middle: middleNotes,
      base: baseNotes,
    },
    accords: uniqueStrings(accords),
    description: toDisplayString(item.description || item.Description || item.about || ""),
    longevity: toDisplayString(item.longevity || item.Longevity),
    sillage: toDisplayString(item.sillage || item.Sillage),
    year: Number.isFinite(Number(item.releasedAt))
      ? String(new Date(Number(item.releasedAt)).getUTCFullYear())
      : toDisplayString(item.releaseDate || item.year),
    perfumers,
    rating: item.reviewsScoreAvg === null || item.reviewsScoreAvg === undefined ? null : Number(item.reviewsScoreAvg),
    reviewCount: item.reviewsCount === null || item.reviewsCount === undefined ? null : Number(item.reviewsCount),
    shortDescription: shortProfileDescription({ accords, notes }),
    categoryLabel: normalizedBrandCategory(brand),
    source: "hidden",
  }, "verified");
}

async function getRapidApiFragrance(query, route = "/api/fragrance") {
  if (FRAGRANCE_PROVIDER !== "rapidapi" || !process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) return null;
  return cachedValue(`fragrance:${normalizeName(query)}`, CACHE_TTL.fragrance, async () => {
    for (const search of fragranceSearchQueries(query)) {
      const apiResponse = await callRapidApiMultiSearch(search, route, 12);
      if (apiResponse.status < 200 || apiResponse.status >= 300) {
        throw new Error(`RapidAPI failed with ${apiResponse.status}`);
      }
      let data = null;
      try {
        data = apiResponse.bodyText ? JSON.parse(apiResponse.bodyText) : null;
      } catch {
        data = { raw: apiResponse.bodyText };
      }
      const candidates = extractRapidApiCandidates(data);
      logRoute(route, `RapidAPI candidates for "${search}"`, candidates.slice(0, 5));
      logRoute(route, "first RapidAPI hit name", toDisplayString(candidates[0]?.name || candidates[0]?.title || candidates[0]?.fragrance_name));
      logRoute(route, "first RapidAPI hit brand.name", toDisplayString(candidates[0]?.brand?.name || candidates[0]?.brand));
      const result = pickFragellaCandidate(candidates, query) || candidates[0];
      const normalized = normalizeRapidApiFragrance(result);
      logRoute(route, "normalized notes array", normalized?.notes || []);
      logRoute(route, "RapidAPI selected candidate", normalized);
      if (normalized?.found) return normalized;
    }
    return null;
  });
}

function scoreResolvedProfile(profile = {}, query = "") {
  let score = scoreFragellaCandidate(profile, query);
  const notes = allProfileNotes(profile);
  if (notes.length >= 8) score += 28;
  else if (notes.length >= 3) score += 18;
  else if (notes.length) score += 8;
  if (profile.note_source === "curated") score += 14;
  if (profile.image_confidence === "high") score += 5;
  if (profile.rating) score += 3;
  return score;
}

function resolutionCandidates(profiles = [], query = "") {
  return profiles
    .filter((profile) => profile?.found)
    .sort((first, second) => scoreResolvedProfile(second, query) - scoreResolvedProfile(first, query))
    .slice(0, 6)
    .map((profile) => ({
      name: profile.name,
      brand: profile.brand,
      confidence: profile.confidence || "medium",
      note_source: profile.note_source || "verified",
    }));
}

async function openAiQueryAliases(query, route = "/api/fragrance") {
  if (!process.env.OPENAI_API_KEY) return [];
  const catalogPreview = curatedCatalog().map((entry) => ({
    name: entry.name,
    brand: entry.brand,
    aliases: (entry.aliases || []).slice(0, 6),
  })).slice(0, 40);
  const result = await callOpenAiJson(
    { query, catalogPreview },
    route,
    "Normalize this fragrance search query into likely real fragrance search aliases only. Do not invent fragrance facts. Return JSON as {\"queries\":[\"...\"]}. Prefer full brand + fragrance name.",
    { queries: [] }
  ).catch(() => ({ queries: [] }));
  return Array.isArray(result?.queries) ? result.queries.map(toDisplayString).filter(Boolean).slice(0, 5) : [];
}

async function resolveFragranceQuery(query, route = "/api/fragrance") {
  const originalQuery = validatedText(query, "query", 120);
  const exactCurated = curatedProfileForQuery(originalQuery);
  const aliases = queryAliases(originalQuery);
  const profiles = [];
  if (exactCurated) profiles.push(exactCurated);

  try {
    const apiProfile = await getRapidApiFragrance(originalQuery, route);
    if (apiProfile?.found) {
      const aliasCurated = curatedProfileForQuery(`${apiProfile.brand || ""} ${apiProfile.name}`.trim()) || exactCurated;
      profiles.push(aliasCurated ? mergeProfileData(apiProfile, aliasCurated, originalQuery) : { ...apiProfile, query: originalQuery });
    }
  } catch (error) {
    logRoute(route, "resolution API lookup skipped", { message: error.message });
  }

  if (!profiles.some((profile) => profile?.found)) {
    const searchProfiles = await searchRapidApiProfiles(originalQuery, route).catch(() => []);
    profiles.push(...searchProfiles.slice(0, 4).map((profile) => {
      const aliasCurated = curatedProfileForQuery(`${profile.brand || ""} ${profile.name}`.trim()) || exactCurated;
      return aliasCurated ? mergeProfileData(profile, aliasCurated, originalQuery) : { ...profile, query: originalQuery };
    }));
  }

  if (!profiles.some((profile) => profile?.found) && process.env.SERPAPI_API_KEY) {
    const webResults = await getSerpApiOrganicResults(`${originalQuery} fragrance perfume`, route).catch(() => []);
    const webCandidates = dupeCandidatesFromWebResults(webResults, originalQuery);
    for (const candidate of webCandidates.slice(0, 4)) {
      const profile = await getRapidApiFragrance(`${candidate.brand || ""} ${candidate.name}`.trim(), route).catch(() => null);
      const curated = curatedProfileForQuery(`${candidate.brand || ""} ${candidate.name}`.trim());
      if (profile?.found || curated) profiles.push(profile && curated ? mergeProfileData(profile, curated, originalQuery) : profile || curated);
    }
  }

  if (!profiles.some((profile) => profile?.found)) {
    const aiAliases = await openAiQueryAliases(originalQuery, route);
    for (const alias of aiAliases) {
      const curated = curatedProfileForQuery(alias);
      const profile = await getRapidApiFragrance(alias, route).catch(() => null);
      if (profile?.found || curated) profiles.push(profile && curated ? mergeProfileData(profile, curated, originalQuery) : profile || curated);
      if (profiles.some((item) => item?.found)) break;
    }
  }

  const selected = profiles
    .filter((profile) => profile?.found && isWearableFragrance(profile, originalQuery))
    .sort((first, second) => scoreResolvedProfile(second, originalQuery) - scoreResolvedProfile(first, originalQuery))[0] ||
    profiles.filter((profile) => profile?.found).sort((first, second) => scoreResolvedProfile(second, originalQuery) - scoreResolvedProfile(first, originalQuery))[0] ||
    null;

  if (!selected) {
    return {
      found: false,
      query: originalQuery,
      resolvedName: "",
      resolvedBrand: "",
      confidence: "low",
      candidates: [],
      selectedProfile: null,
    };
  }

  const normalized = withProfileMetadata({
    ...selected,
    found: true,
    query: originalQuery,
    resolvedName: selected.name,
    resolvedBrand: selected.brand,
    aliases: uniqueStrings([...(selected.aliases || []), ...aliases]),
    confidence: scoreResolvedProfile(selected, originalQuery) >= 110 ? "high" : selected.confidence || (exactCurated ? "high" : "medium"),
  }, selected.note_source || "verified");
  await ensureFragranceImage(normalized, route);
  return {
    found: true,
    query: originalQuery,
    resolvedName: normalized.name,
    resolvedBrand: normalized.brand,
    confidence: normalized.confidence,
    candidates: resolutionCandidates(profiles, originalQuery),
    selectedProfile: normalized,
  };
}

async function searchRapidApiProfiles(query, route = "/api/search") {
  if (FRAGRANCE_PROVIDER !== "rapidapi" || !process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) return [];
  return cachedValue(`search:${normalizeName(query)}`, CACHE_TTL.search, async () => {
    const seen = new Set();
    const results = [];

    for (const search of fragranceSearchQueries(query)) {
      try {
        const apiResponse = await callRapidApiMultiSearch(search, route, 24);
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
          logRoute(route, "RapidAPI variant skipped", { search, status: apiResponse.status });
          continue;
        }
        let data = null;
        try {
          data = apiResponse.bodyText ? JSON.parse(apiResponse.bodyText) : null;
        } catch {
          data = { raw: apiResponse.bodyText };
        }
        const candidates = extractRapidApiCandidates(data);
        candidates.forEach((candidate) => {
          const normalized = normalizeRapidApiFragrance(candidate);
          if (!normalized?.found || !isWearableFragrance(normalized, query)) return;
          const key = `${safeLower(normalized.brand)}::${safeLower(normalized.name)}`;
          if (seen.has(key)) return;
          seen.add(key);
          results.push(normalized);
        });
      } catch (error) {
        logRoute(route, "RapidAPI variant error", { search, message: error.message });
      }
    }

    return results.sort((first, second) => {
      const secondNoteBoost = queryMatchesNotes(query, second) ? 80 : 0;
      const firstNoteBoost = queryMatchesNotes(query, first) ? 80 : 0;
      const categoryWeight = (value) => {
        const category = value.categoryLabel || normalizedBrandCategory(value.brand);
        if (category === "Designer") return 22;
        if (category === "Luxury") return 20;
        if (category === "Niche") return 18;
        if (category === "Arabic / Middle Eastern") return 16;
        if (category === "Affordable") return 14;
        return 0;
      };
      return (scoreFragellaCandidate(second, query) + secondNoteBoost + categoryWeight(second)) -
        (scoreFragellaCandidate(first, query) + firstNoteBoost + categoryWeight(first));
    });
  });
}

function normalizeSearchResult(profile, query) {
  const name = toDisplayString(profile.name);
  const brand = toDisplayString(profile.brand);
  const notes = uniqueStrings(profile.notes || []);
  const accords = uniqueStrings(profile.accords || []);
  const queryWords = importantQueryWords(query);
  const cleanQuery = cleanNoteQuery(query) || query;
  const searchable = safeLower(`${brand} ${name} ${accords.join(" ")} ${notes.join(" ")}`);
  const matchedWords = queryWords.filter((word) => searchable.includes(word));
  const noteMatched = isLikelyNoteQuery(query) && queryMatchesNotes(query, profile);
  const matchReason = noteMatched
    ? `Contains ${toDisplayString(cleanQuery)}`
    : matchedWords.length
    ? `Matched on ${matchedWords.slice(0, 3).join(", ")}`
    : accords.length
      ? `Accords: ${accords.slice(0, 3).join(", ")}`
      : notes.length
        ? `Notes: ${notes.slice(0, 4).join(", ")}`
        : "Relevant fragrance profile";

  return {
    name,
    brand,
    image_url: profile.image_url || "",
    image: profile.image || profile.image_url || "",
    image_source: profile.image_source || "placeholder",
    image_confidence: profile.image_confidence || "fallback",
    notes,
    accords,
    shortDescription: profile.shortDescription || shortProfileDescription(profile),
    matchReason,
    category: profile.category || profile.categoryLabel || normalizedBrandCategory(brand) || "Unknown",
    categoryLabel: profile.categoryLabel || profile.category || normalizedBrandCategory(brand) || "Unknown",
    confidence: profile.confidence || (notes.length ? "medium" : "low"),
    note_source: profile.note_source || (notes.length ? "verified" : "unavailable"),
    sourceHidden: true,
    rating: profile.rating ?? null,
    reviewCount: profile.reviewCount ?? null,
  };
}

function buildDiscoveryResultFromShopping(item, query) {
  const title = toDisplayString(item.title);
  if (!title || !isWearableShoppingResult(item, query)) return null;
  const cleanedTitle = title.replace(/\s+(for|by)\s+.*$/i, "").trim();
  return {
    name: cleanedTitle,
    brand: "",
    image_url: item.thumbnail || "",
    image: item.thumbnail || "",
    image_source: item.thumbnail ? "shopping" : "placeholder",
    image_confidence: item.thumbnail ? "medium" : "fallback",
    notes: [],
    accords: [],
    shortDescription: item.store ? `Available from ${item.store}` : "Shopping result",
    matchReason: "Found through live shopping discovery",
    category: "Unknown",
    categoryLabel: "Luxury",
    confidence: "low",
    note_source: "unavailable",
    sourceHidden: true,
  };
}

async function maybeRankSearchResults(query, results) {
  if (!process.env.OPENAI_API_KEY || !isVibeQuery(query) || results.length < 2) return results;
  try {
    const fallback = results.map((item) => ({
      name: item.name,
      brand: item.brand,
      matchReason: item.matchReason,
    }));
    const ranked = await callOpenAiJson(
      {
        query,
        results: results.map((item) => ({
          name: item.name,
          brand: item.brand,
          notes: item.notes,
          accords: item.accords,
          shortDescription: item.shortDescription,
        })),
      },
      "/api/search",
      "Rank these fragrance search results for the user's query. Use only the provided fragrance data. Return JSON as {\"ranked\":[{\"name\":\"...\",\"brand\":\"...\",\"matchReason\":\"...\"}]}. Keep each matchReason under 18 words and do not invent notes.",
      { ranked: fallback }
    );
    const rankedMap = new Map(
      (ranked.ranked || []).map((item, index) => [`${safeLower(item.brand)}::${safeLower(item.name)}`, { rank: index, matchReason: item.matchReason }])
    );
    return [...results].sort((first, second) => {
      const firstRank = rankedMap.get(`${safeLower(first.brand)}::${safeLower(first.name)}`)?.rank ?? Number.MAX_SAFE_INTEGER;
      const secondRank = rankedMap.get(`${safeLower(second.brand)}::${safeLower(second.name)}`)?.rank ?? Number.MAX_SAFE_INTEGER;
      return firstRank - secondRank;
    }).map((item) => {
      const rankedItem = rankedMap.get(`${safeLower(item.brand)}::${safeLower(item.name)}`);
      return rankedItem?.matchReason ? { ...item, matchReason: rankedItem.matchReason } : item;
    });
  } catch (error) {
    logError("/api/search", "OpenAI ranking failure", error);
    return results;
  }
}

function fragranceSearchQueries(query) {
  const cleaned = query
    .replace(/\b(eau de parfum|eau de toilette|edp|edt|parfum|perfume|fragrance|cologne)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const noteDriven = isLikelyNoteQuery(query);
  const aliases = queryAliases(query);
  return [...new Set([
    ...aliases,
    ...aliases.map((alias) => `${alias} perfume`),
    ...aliases.map((alias) => `${alias} fragrance`),
    noteDriven ? `${query.trim()} cologne` : "",
    noteDriven ? `${query.trim()} eau de parfum` : "",
    noteDriven ? `${query.trim()} men fragrance` : "",
    cleaned,
    cleaned ? `${cleaned} perfume` : "",
    cleaned ? `${cleaned} fragrance` : "",
  ].filter(Boolean))].slice(0, 18);
}

function extractFragellaResults(data) {
  if (Array.isArray(data)) return data;
  return data?.data || data?.fragrances || data?.results || data?.items || [];
}

function scoreFragellaCandidate(item, query) {
  const normalizedQuery = normalizeName(query);
  const name = normalizeName(toDisplayString(item.Name || item.name || item.title || item.fragrance_name || item.fragranceName));
  const brand = normalizeName(toDisplayString(item.brand?.name || item.Brand || item.brand || item.house || item.designer));
  const full = `${brand} ${name}`.trim();
  const aliases = queryAliases(query).map(normalizeName);
  let score = 0;
  if (yslYQuery(query)) score += yslYTitleMatch(full, query) ? 120 : -80;
  if (name === normalizedQuery || full === normalizedQuery) score += 100;
  if (aliases.some((alias) => alias === name || alias === full)) score += 96;
  if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) score += 45;
  if (full.includes(normalizedQuery) || normalizedQuery.includes(full)) score += 55;
  aliases.forEach((alias) => {
    if (alias && (full.includes(alias) || alias.includes(full) || name.includes(alias) || alias.includes(name))) score += 36;
  });
  normalizedQuery.split(/\s+/).forEach((word) => {
    if (word && full.includes(word)) score += 6;
  });
  return score;
}

function importantQueryWords(query) {
  return normalizeName(query)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !["eau", "de", "or", "parfum", "toilette", "fragrance", "fragrances", "perfume", "cologne", "sample", "spray", "travel", "men", "women", "woman", "man"].includes(word));
}

function canonicalShoppingQuery(query = "") {
  const normalized = normalizeName(query);
  const known = knownFragranceCatalog().find((item) => {
    const full = normalizeName(`${item.brand || ""} ${item.name}`);
    const name = normalizeName(item.name);
    const words = importantQueryWords(item.name);
    const aliases = (item.aliases || []).map(normalizeName);
    return normalized === name ||
      normalized === full ||
      aliases.includes(normalized) ||
      aliases.some((alias) => alias.includes(normalized) || normalized.includes(alias)) ||
      full.includes(normalized) ||
      normalized.includes(full) ||
      (words.length && words.every((word) => normalized.includes(word)));
  });
  const base = known ? fragranceLabel(known) : query;
  const baseHasFormat = /\b(eau de parfum|eau de toilette|parfum|edp|edt|cologne|perfume)\b/.test(normalizeName(base));
  return `${base} ${baseHasFormat ? "OR Eau de Toilette cologne perfume" : "Eau de Parfum OR Eau de Toilette cologne perfume"}`;
}

function isRelevantFragranceTitle(title, query) {
  const normalizedTitle = normalizeName(title);
  const normalizedQuery = normalizeName(query);
  if (!normalizedTitle || !normalizedQuery) return false;
  if (yslYQuery(query)) return yslYTitleMatch(normalizedTitle, query);
  if (normalizedTitle.includes(normalizedQuery)) return true;
  const words = importantQueryWords(query);
  if (!words.length) return true;
  if (words.length === 1) return normalizedTitle.includes(words[0]);
  const exactPairs = [
    ["bleu", "chanel"],
    ["black", "opium"],
    ["wood", "sage"],
    ["sea", "salt"],
  ];
  if (exactPairs.some((pair) => pair.every((word) => words.includes(word)) && pair.every((word) => normalizedTitle.includes(word)))) {
    return true;
  }
  return words.every((word) => normalizedTitle.includes(word));
}

function isRejectedProductTitle(title) {
  const normalized = normalizeName(title);
  return ["bag", "handbag", "shoe", "shoes", "makeup", "lipstick", "wallet", "shirt", "dress", "accessory", "accessories", ...REJECTED_WEARABLE_TERMS].some((word) =>
    normalized.includes(word)
  );
}

function isWearableShoppingResult(item, query) {
  const title = normalizeName(item?.title);
  if (!title) return false;
  if (isRejectedProductTitle(title)) {
    logRoute("/api/prices", "shopping result rejected", { reason: "non-fragrance product", title: item.title });
    return false;
  }
  if (!isRelevantFragranceTitle(title, query)) {
    logRoute("/api/prices", "shopping result rejected", { reason: "weak title match", query, title: item.title });
    return false;
  }
  const queryWords = importantQueryWords(query);
  const hasSpecificNameWord = queryWords.some((word) => !KNOWN_DESIGNER_BRANDS.includes(word) && title.includes(word));
  const looksFragrance = includesAny(title, POSITIVE_FRAGRANCE_TERMS) || /\b(edp|edt)\b/.test(title) || title.includes("travel spray") || title.includes("sample");
  if (!looksFragrance && !hasSpecificNameWord) {
    logRoute("/api/prices", "shopping result rejected", { reason: "not clearly wearable fragrance", title: item.title });
    return false;
  }
  return true;
}

function pickRelevantShoppingThumbnail(results, query) {
  return results.find((item) => {
    const title = normalizeName(item.title);
    if (!title || isRejectedProductTitle(title)) return false;
    return isRelevantFragranceTitle(title, query);
  })?.thumbnail || "";
}

function curatedImageForProfile(profile = {}) {
  const keys = [
    `${normalizeName(profile.brand)}::${normalizeName(profile.name)}`,
    normalizeName(`${profile.brand || ""} ${profile.name || ""}`),
    normalizeName(profile.name),
  ];
  return keys.map((key) => CURATED_IMAGE_CACHE.get(key)).find(Boolean) || "";
}

function isValidFragranceImageResult(result, fragranceName, brand, route = "/api/fragrance", aliases = []) {
  const title = normalizeName(result?.title);
  const normalizedName = normalizeName(fragranceName);
  const normalizedBrand = normalizeName(brand);
  const importantNameWords = importantQueryWords(fragranceName);
  const importantBrandWords = importantQueryWords(brand);
  const aliasMatches = (aliases || []).map(normalizeName).filter(Boolean).some((alias) => title.includes(alias));

  if (!title) {
    logRoute(route, "image fallback rejected", { reason: "missing title", fragranceName, brand });
    return false;
  }
  if (IMAGE_REJECTED_TERMS.some((term) => title.includes(term))) {
    logRoute(route, "image fallback rejected", { reason: "rejected term", title });
    return false;
  }
  if (yslYQuery(`${brand} ${fragranceName}`) || (aliases || []).some(yslYQuery)) {
    if (!yslYTitleMatch(title, `${brand} ${fragranceName}`)) {
      logRoute(route, "image fallback rejected", { reason: "wrong YSL Y product", title });
      return false;
    }
    logRoute(route, "image fallback accepted", { title, fragranceName, brand });
    return true;
  }
  if (!aliasMatches && (!importantNameWords.length || !importantNameWords.every((word) => title.includes(word)))) {
    logRoute(route, "image fallback rejected", { reason: "missing fragrance name words", title, fragranceName });
    return false;
  }
  if (importantBrandWords.length && !importantBrandWords.some((word) => title.includes(word))) {
    logRoute(route, "image fallback rejected", { reason: "missing brand words", title, brand });
    return false;
  }
  if (!includesAny(title, POSITIVE_FRAGRANCE_TERMS) && !title.includes(normalizedName) && !aliasMatches) {
    logRoute(route, "image fallback rejected", { reason: "not clearly wearable fragrance", title });
    return false;
  }
  logRoute(route, "image fallback accepted", { title, fragranceName, brand });
  return true;
}

function pickFragellaCandidate(results, query) {
  if (!results.length) return null;
  return [...results].sort((a, b) => scoreFragellaCandidate(b, query) - scoreFragellaCandidate(a, query))[0];
}

async function getFragellaFragrance(query, route = "/api/fragrance") {
  if (!FRAGELLA_ENABLED || !process.env.FRAGELLA_API_KEY) return null;

  for (const search of fragranceSearchQueries(query)) {
    const data = await callFragella("fragrances", { search, limit: "8" }, route);
    const results = extractFragellaResults(data);
    logRoute(route, `Fragella candidates for "${search}"`, results.slice(0, 3));
    const result = pickFragellaCandidate(results, query);
    if (result) {
      const normalized = normalizeFragellaFragrance(result);
      logRoute(route, "Fragella selected candidate", normalized);
      return normalized;
    }
  }

  return null;
}

async function callFragella(endpoint, params = {}, route = "/api/fragella") {
  if (!process.env.FRAGELLA_API_KEY) return null;

  const url = new URL(`https://api.fragella.com/api/v1/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  logRoute(route, "Fragella key exists", { FRAGELLA_API_KEY: true });
  logRoute(route, "Fragella URL", url.toString());
  const apiResponse = await fetch(url, {
    headers: { "x-api-key": process.env.FRAGELLA_API_KEY },
  });
  logRoute(route, "Fragella response status", apiResponse.status);
  const text = await apiResponse.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  logRoute(route, "Fragella response preview", data);
  if (!apiResponse.ok) throw new Error(`Fragella failed with ${apiResponse.status}`);
  return data;
}

function bottleArt(name, tone = "rose") {
  const [dark, light] = TONES[tone] || TONES.rose;
  const safeName = name.replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char]);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360">
      <rect width="520" height="360" fill="#faf6ef"/>
      <circle cx="168" cy="138" r="132" fill="${light}" opacity=".28"/>
      <circle cx="362" cy="194" r="148" fill="${dark}" opacity=".18"/>
      <rect x="218" y="58" width="86" height="42" rx="10" fill="#211d1b"/>
      <rect x="186" y="94" width="150" height="210" rx="38" fill="url(#g)" stroke="#2b2927" stroke-width="6"/>
      <rect x="206" y="126" width="110" height="116" rx="20" fill="rgba(255,255,255,.22)"/>
      <text x="260" y="206" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#fff">${initials}</text>
      <text x="260" y="328" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#171514">${safeName}</text>
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${light}"/>
          <stop offset=".58" stop-color="${dark}"/>
          <stop offset="1" stop-color="#211d1b"/>
        </linearGradient>
      </defs>
    </svg>`;
}

function svgEscape(value = "") {
  return String(value).replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char]);
}

function initialsFor(name = "", brand = "") {
  const words = normalizeName(`${brand} ${name}`)
    .split(/\s+/)
    .filter((word) => word && !["eau", "de", "the", "for", "men", "women"].includes(word));
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "A";
}

function toneForFragrance(profile = {}) {
  const category = profile.categoryLabel || normalizedBrandCategory(profile.brand);
  const text = normalizeName(`${category} ${profile.brand} ${profile.name} ${(profile.notes || []).join(" ")} ${(profile.accords || []).join(" ")}`);
  if (category === "Arabic / Middle Eastern" || text.includes("oud") || text.includes("amber") || text.includes("cinnamon")) return "amber";
  if (category === "Luxury" || text.includes("black") || text.includes("noir") || text.includes("night")) return "black";
  if (text.includes("fresh") || text.includes("green") || text.includes("sage") || text.includes("vetiver")) return "green";
  if (text.includes("blue") || text.includes("bleu") || text.includes("aquatic") || text.includes("marine")) return "blue";
  return "rose";
}

function placeholderBottleSvg(profile = {}) {
  const name = toDisplayString(profile.name || profile.query || "Aromix");
  const brand = toDisplayString(profile.brand || "");
  const category = toDisplayString(profile.categoryLabel || normalizedBrandCategory(brand) || "Scent Profile");
  const initials = initialsFor(name, brand);
  const [dark, light] = TONES[toneForFragrance(profile)] || TONES.rose;
  const brandLine = svgEscape(brand || category);
  const nameLine = svgEscape(name.slice(0, 34));
  const categoryLine = svgEscape(category);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="820" viewBox="0 0 640 820">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${light}"/>
          <stop offset=".52" stop-color="${dark}"/>
          <stop offset="1" stop-color="#181512"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="rgba(255,255,255,.42)"/>
          <stop offset=".48" stop-color="rgba(255,255,255,.16)"/>
          <stop offset="1" stop-color="rgba(23,21,20,.34)"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#171514" flood-opacity=".28"/>
        </filter>
      </defs>
      <rect width="640" height="820" rx="42" fill="#fbf7f1"/>
      <rect x="26" y="26" width="588" height="768" rx="36" fill="url(#bg)" opacity=".94"/>
      <circle cx="184" cy="164" r="176" fill="#fff" opacity=".14"/>
      <circle cx="484" cy="376" r="210" fill="#fff" opacity=".08"/>
      <path d="M116 202 C206 118 342 118 524 196" fill="none" stroke="#fff" stroke-width="2" opacity=".24"/>
      <path d="M82 618 C214 558 370 558 548 620" fill="none" stroke="#fff" stroke-width="2" opacity=".16"/>
      <g filter="url(#shadow)">
        <rect x="260" y="166" width="120" height="58" rx="14" fill="#171514" opacity=".88"/>
        <rect x="238" y="214" width="164" height="34" rx="12" fill="#f8f4ed" opacity=".2"/>
        <rect x="176" y="242" width="288" height="348" rx="66" fill="url(#glass)" stroke="#f8f4ed" stroke-opacity=".52" stroke-width="4"/>
        <rect x="216" y="300" width="208" height="172" rx="34" fill="#fff" opacity=".16"/>
        <text x="320" y="408" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="900" fill="#fff" opacity=".96">${svgEscape(initials)}</text>
      </g>
      <text x="320" y="658" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#fff" opacity=".84">${brandLine}</text>
      <text x="320" y="696" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="#fff">${nameLine}</text>
      <text x="320" y="735" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3" fill="#fff" opacity=".64">${categoryLine.toUpperCase()}</text>
    </svg>`;
}

function placeholderBottleDataUrl(profile = {}) {
  return `data:image/svg+xml;base64,${Buffer.from(placeholderBottleSvg(profile), "utf8").toString("base64")}`;
}

function setPlaceholderImage(profile = {}, route = "/api/fragrance", reason = "no safe image found") {
  profile.image_url = placeholderBottleDataUrl(profile);
  profile.image = profile.image_url;
  profile.image_source = "placeholder";
  profile.image_confidence = "fallback";
  logRoute(route, "image placeholder generated", {
    reason,
    name: profile.name,
    brand: profile.brand,
    category: profile.categoryLabel || normalizedBrandCategory(profile.brand),
  });
  return profile;
}

async function getLiveShoppingResults(query) {
  if (!process.env.SERPAPI_API_KEY) throw new Error("SERPAPI_API_KEY is not configured");
  const searchQuery = canonicalShoppingQuery(query);

  return cachedValue(`shopping:${normalizeName(searchQuery)}`, CACHE_TTL.shopping, async () => {
    const serpUrl = new URL("https://serpapi.com/search");
    serpUrl.searchParams.set("engine", "google_shopping");
    serpUrl.searchParams.set("q", searchQuery);
    serpUrl.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

    logRoute("/api/prices", "SerpAPI key exists", { SERPAPI_API_KEY: true });
    logRoute("/api/prices", "SerpAPI URL", sanitizedUrl(serpUrl));
    const apiResponse = await fetch(serpUrl);
    logRoute("/api/prices", "SerpAPI response status", apiResponse.status);
    const text = await apiResponse.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    logRoute("/api/prices", "SerpAPI response preview", data);
    if (!apiResponse.ok) throw new Error(`SerpApi failed with ${apiResponse.status}`);
    return filterShoppingResults(normalizeMarketResults(data.shopping_results), query);
  });
}

async function ensureFragranceImage(profile, route = "/api/fragrance") {
  if (!profile) return profile;

  const providerImage = toDisplayString(profile.image_url || profile.image);
  if (providerImage && !providerImage.startsWith("data:image/svg")) {
    if (profile.image_source && profile.image_source !== "placeholder") {
      profile.image_url = providerImage;
      profile.image = providerImage;
      profile.image_confidence = profile.image_confidence || (profile.image_source === "provider" ? "high" : "medium");
      logRoute(route, "image accepted", { source: profile.image_source, name: profile.name, brand: profile.brand });
      return profile;
    }
    profile.image_url = providerImage;
    profile.image = providerImage;
    profile.image_source = "provider";
    profile.image_confidence = "high";
    logRoute(route, "image accepted", { source: "provider", name: profile.name, brand: profile.brand });
    return profile;
  }

  const curatedImage = curatedImageForProfile(profile);
  if (curatedImage) {
    profile.image_url = curatedImage;
    profile.image = curatedImage;
    profile.image_source = "curated";
    profile.image_confidence = "high";
    logRoute(route, "image accepted", { source: "curated", name: profile.name, brand: profile.brand });
    return profile;
  }

  const cacheKey = `image:${normalizeName(`${profile.brand || ""} ${profile.name || profile.query || ""}`)}`;
  const cachedImage = API_CACHE.get(cacheKey);
  if (cachedImage && cachedImage.expiresAt > Date.now()) {
    Object.assign(profile, cachedImage.value);
    logRoute(route, "image cache hit", { name: profile.name, brand: profile.brand, image_source: profile.image_source });
    return profile;
  }

  let imageMeta;
  try {
    const imageQuery = `${profile.brand || ""} ${profile.name || profile.query || ""} Eau de Parfum OR Eau de Toilette OR cologne OR perfume`.trim();
    const shoppingImages = await getLiveShoppingResults(imageQuery);
    const match = shoppingImages.find((item) => isValidFragranceImageResult(item, profile.name || profile.query, profile.brand, route, profile.aliases || []));
    if (match?.thumbnail) {
      imageMeta = {
        image_url: match.thumbnail,
        image: match.thumbnail,
        image_source: "shopping",
        image_confidence: "medium",
      };
      logRoute(route, "image accepted", { source: "shopping", title: match.title, name: profile.name, brand: profile.brand });
    }
  } catch (error) {
    logRoute(route, "shopping image fallback failed", error.message);
  }

  if (!imageMeta) {
    setPlaceholderImage(profile, route, "no safe real image found");
    imageMeta = {
      image_url: profile.image_url,
      image: profile.image,
      image_source: profile.image_source,
      image_confidence: profile.image_confidence,
    };
  } else {
    Object.assign(profile, imageMeta);
  }

  API_CACHE.set(cacheKey, { value: imageMeta, expiresAt: Date.now() + CACHE_TTL.image });
  return profile;
}

async function getSerpApiRaw(query, route = "/debug/serpapi", engine = "google_shopping") {
  if (!process.env.SERPAPI_API_KEY) throw new Error("SERPAPI_API_KEY is not configured");
  const serpUrl = new URL("https://serpapi.com/search");
  serpUrl.searchParams.set("engine", engine);
  serpUrl.searchParams.set("q", query);
  serpUrl.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  logRoute(route, "SerpAPI key exists", { SERPAPI_API_KEY: true });
  logRoute(route, "SerpAPI URL", sanitizedUrl(serpUrl));
  const apiResponse = await fetch(serpUrl);
  logRoute(route, "SerpAPI response status", apiResponse.status);
  const bodyText = await apiResponse.text();
  logRoute(route, "SerpAPI raw response body", bodyText);
  return {
    status: apiResponse.status,
    contentType: apiResponse.headers.get("content-type") || "application/json; charset=utf-8",
    bodyText,
  };
}

async function handlePrices(request, response) {
  const route = "/api/prices";
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const query = validatedQuery(requestUrl, "query", 120);
    logRoute(route, "incoming query", { query });
    logRoute(route, "keys", keyState());
    const results = await getLiveShoppingResults(query);
    const normalized = {
      query,
      updatedAt: new Date().toISOString(),
      warning: results.length ? "" : "No verified fragrance shopping results found.",
      results,
    };
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, { results: [] });
  }
}

function debugEnvPayload() {
  return {
    rapidapi: Boolean(process.env.RAPIDAPI_KEY),
    rapidapiHost: process.env.RAPIDAPI_HOST === "fragrance-api.p.rapidapi.com" ? "fragrance-api.p.rapidapi.com" : Boolean(process.env.RAPIDAPI_HOST),
    serpapi: Boolean(process.env.SERPAPI_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL ? "configured" : "",
    fragranceProvider: FRAGRANCE_PROVIDER === "rapidapi" ? "rapidapi" : "configured",
  };
}

async function handleEnvDebug(request, response) {
  const route = "/debug/env";
  logRoute(route, "keys", debugEnvPayload());
  sendJson(response, 200, debugEnvPayload());
}

async function handleHealth(request, response) {
  sendJson(response, 200, {
    ok: true,
    fragranceData: Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) || Boolean(FRAGELLA_ENABLED && process.env.FRAGELLA_API_KEY),
    shoppingData: Boolean(process.env.SERPAPI_API_KEY),
    ai: Boolean(process.env.OPENAI_API_KEY),
    fragranceProviderConfigured: FRAGRANCE_PROVIDER === "rapidapi" || FRAGELLA_ENABLED,
    updatedAt: new Date().toISOString(),
  });
}

async function handleRapidApiDebug(request, response) {
  const route = "/debug/rapidapi";
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const query = (getRouteQuery(requestUrl) || "Bleu de Chanel").slice(0, 120);
  logRoute(route, "incoming query", { query });
  logRoute(route, "keys", keyState());

  try {
    const upstream = await callRapidApiMultiSearch(query, route);
    response.writeHead(upstream.status, {
      ...secureHeaders(),
      "Content-Type": upstream.contentType,
    });
    response.end(upstream.bodyText);
  } catch (error) {
    handleRouteError(route, response, error);
  }
}

async function handleSerpApiDebug(request, response) {
  const route = "/debug/serpapi";
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const query = (getRouteQuery(requestUrl) || "Bleu de Chanel Eau de Parfum").slice(0, 120);
  logRoute(route, "incoming query", { query });
  logRoute(route, "keys", keyState());

  try {
    const upstream = await getSerpApiRaw(query, route, "google_shopping");
    response.writeHead(upstream.status, {
      ...secureHeaders(),
      "Content-Type": upstream.contentType,
    });
    response.end(upstream.bodyText);
  } catch (error) {
    handleRouteError(route, response, error);
  }
}

async function handleFragrance(request, response) {
  const route = "/api/fragrance";
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const query = validatedQuery(requestUrl, "query", 120);
    logRoute(route, "incoming query", { query });
    logRoute(route, "keys", keyState());
    const normalized = await getFragranceProfile(query, route);
    if (!normalized.found) {
      logRoute(route, "normalized response", normalized);
      sendJson(response, 404, normalized);
      return;
    }
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, { found: false });
  }
}

async function handleSearch(request, response) {
  const route = "/api/search";
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const query = validatedQuery(requestUrl, "q", 120);
    logRoute(route, "incoming query", { query });
    logRoute(route, "keys", keyState());
    const noteQuery = isLikelyNoteQuery(query);
    let candidates = await searchFragrances(query, 18, route);
    logRoute(route, "search candidates", { noteQuery, candidates: candidates.length });

    if (!noteQuery && (!candidates.length || (isVibeQuery(query) && candidates.length < 3))) {
      try {
        const shoppingResults = await getLiveShoppingResults(query);
        const discovery = shoppingResults
          .map((item) => buildDiscoveryResultFromShopping(item, query))
          .filter(Boolean);
        const merged = [...candidates, ...discovery].filter(
          (item, index, array) =>
            array.findIndex((entry) => `${safeLower(entry.brand)}::${safeLower(entry.name)}` === `${safeLower(item.brand)}::${safeLower(item.name)}`) === index
        );
        candidates = merged;
      } catch (error) {
        logRoute(route, "shopping discovery fallback failed", error.message);
      }
    }

    const normalized = {
      query,
      results: candidates.slice(0, 18),
      message: candidates.length ? "" : "No strong cologne matches found. Try a broader note like spice, amber, vanilla, or tobacco.",
    };
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, { results: [] });
  }
}

function detectChatIntent(message = "") {
  const text = normalizeName(message);
  if (/\b(layer|mix|combine|pair)\b/.test(text)) return "layering";
  if (/\b(dupe|clone|alternative|cheaper version|cheaper dupe|cheaper alternative)\b/.test(text)) return "dupe";
  if (/\b(missing from my shelf|shelf missing|what is missing|gap|gaps)\b/.test(text)) return "shelf_gap";
  if (/\b(what should i wear|wear today|wear for|wear to|school|office|gym)\b/.test(text)) return "wear_today";
  if (/\b(should i buy|worth buying|blind buy|buy|avoid|skip|sample)\b/.test(text)) return "buy_advice";
  if (/\b(price|shop|shopping|where can i buy|cheapest|deal)\b/.test(text)) return "shopping";
  if (/\b(what is|tell me about|profile|notes in|smell like)\b/.test(text) && extractFragranceNames(message).length) return "fragrance_profile";
  if (isLikelyNoteQuery(message) || /\b(find|recommend|show me|looking for|under|date night|winter|summer|arabic|fresh|sweet|blue|vanilla|floral|wife|gift|feminine|cologne|fragrance|perfume|loud|club|safe)\b/.test(text)) return "recommend";
  return "general";
}

function extractBudget(message = "") {
  const match = message.match(/(?:under|below|less than|max|budget|around|for)\s*\$?\s*(\d{2,4})|\$\s*(\d{2,4})/i);
  const value = Number(match?.[1] || match?.[2] || 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractOccasion(message = "") {
  const text = normalizeName(message);
  const occasions = ["school", "office", "gym", "date night", "clubbing", "work", "wedding", "daily", "everyday", "formal"];
  return occasions.find((occasion) => text.includes(occasion)) || "";
}

function extractSeason(message = "") {
  const text = normalizeName(message);
  return ["winter", "summer", "spring", "fall", "autumn"].find((season) => text.includes(season)) || "";
}

function extractUserConstraints(message = "", history = []) {
  const text = normalizeName(message);
  const recent = normalizeName((Array.isArray(history) ? history : []).slice(-6).map((item) => item.content || item.message || "").join(" "));
  const combined = `${recent} ${text}`.trim();
  const notesWanted = uniqueStrings([
    ...[...NOTE_FAMILIES.keys()].filter((note) => combined.includes(normalizeName(note))),
    ...(combined.includes("citrus") ? ["bergamot", "lemon", "grapefruit", "mandarin"] : []),
    ...(combined.includes("floral") ? ["jasmine", "rose", "orange blossom", "iris"] : []),
    ...(combined.includes("sweet") ? ["vanilla", "tonka bean", "praline", "amber"] : []),
    ...(combined.includes("woody") || combined.includes("wood") ? ["cedar", "sandalwood", "vetiver", "guaiac wood"] : []),
    ...(combined.includes("spicy") || combined.includes("spice") ? ["cinnamon", "cardamom", "black pepper", "pink pepper"] : []),
    ...(combined.includes("aquatic") || combined.includes("marine") ? ["marine accord", "sea salt"] : []),
    ...(combined.includes("gourmand") ? ["vanilla", "praline", "tonka bean", "coffee"] : []),
    ...(combined.includes("amber") ? ["amber", "ambroxan", "labdanum"] : []),
    ...(combined.includes("oud") ? ["oud", "leather"] : []),
    ...(combined.includes("musk") ? ["musk", "ambroxan"] : []),
    ...(combined.includes("fresh") ? ["bergamot", "lemon", "mint", "marine accord"] : []),
    ...(combined.includes("blue") ? ["bergamot", "lavender", "cedar", "ambroxan"] : []),
  ]);
  const avoidMatch = message.match(/(?:avoid|without|no)\s+([a-z ,/&-]+)/i);
  const notesAvoided = avoidMatch ? uniqueStrings(avoidMatch[1].split(/,|\/| and /).map((value) => value.trim()).filter(Boolean)) : [];
  const recipient = /\bwife\b/.test(text) ? "wife" : /\bgirlfriend\b/.test(text) ? "girlfriend" : /\bhusband\b/.test(text) ? "husband" : /\bboyfriend\b/.test(text) ? "boyfriend" : "";
  const genderPreference =
    /\b(wife|girlfriend|feminine|women|woman|her)\b/.test(text) ? "feminine/unisex" :
    /\b(cologne|men|man|masculine|him|husband|boyfriend)\b/.test(text) ? "masculine/unisex" :
    "unisex";
  const occasion = extractOccasion(message);
  const strengthPreference =
    /\b(beast mode|loud|project|projection|club|clubbing)\b/.test(text) ? "loud" :
    /\b(school|office|gym|safe|subtle|close|quiet)\b/.test(text) ? "subtle/moderate" :
    "";
  const categoryPreference =
    /\barabic|middle eastern\b/.test(text) ? "Arabic / Middle Eastern" :
    /\bdesigner\b/.test(text) ? "Designer" :
    /\bniche\b/.test(text) ? "Niche" :
    /\bluxury\b/.test(text) ? "Luxury" :
    /\bcheap|affordable|budget|under\b/.test(text) ? "Affordable" :
    "";
  const vibe = [
    "citrus", "sweet", "fresh", "clean", "blue", "aquatic", "woody", "wood", "spicy", "spice", "oud", "gourmand", "amber", "musk", "vanilla", "floral", "date night", "clubbing", "safe", "gift"
  ].find((term) => text.includes(term)) || "";

  return {
    budget: extractBudget(message),
    recipient,
    genderPreference,
    occasion,
    season: extractSeason(message),
    vibe,
    notesWanted,
    notesAvoided,
    categoryPreference,
    strengthPreference,
    ageContext: /\bschool|college|teen|student\b/.test(text) ? "student/school" : "",
    existingFragrances: extractFragranceNames(message).slice(1),
    comparisonTarget: extractFragranceNames(message)[0] || "",
  };
}

function knownFragranceCatalog() {
  const extras = [
    { name: "Hawas Ice", brand: "Rasasi" },
    { name: "Hawas Fire", brand: "Rasasi" },
    { name: "Kayali Vanilla 28", brand: "Kayali" },
    { name: "Dior Sauvage", brand: "Dior" },
    { name: "Bleu de Chanel", brand: "Chanel" },
  ];
  const seen = new Set();
  return [...curatedCatalog(), ...extras].filter((item) => {
    const key = `${safeLower(item.brand)}::${safeLower(item.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFragranceNames(message = "") {
  const raw = message.trim();
  const candidates = [];
  const add = (value) => {
    const cleaned = toDisplayString(value)
      .replace(/[?.!]+$/g, "")
      .replace(/\b(edp|edt|cologne|perfume|fragrance)\b$/i, "")
      .trim();
    if (cleaned && cleaned.length > 1 && !candidates.some((item) => normalizeName(item) === normalizeName(cleaned))) {
      candidates.push(cleaned);
    }
  };

  const layerMatch = raw.match(/(?:layer|mix|combine|pair)\s+(.+?)\s+(?:with|and|\+)\s+(.+?)(?:[?.!]|$)/i);
  if (layerMatch) {
    add(layerMatch[1]);
    add(layerMatch[2]);
  }

  const buyMatch = raw.match(/(?:should i buy|worth buying|buy|avoid|skip|sample)\s+(.+?)(?:\s+if|\s+for|\s+under|[?.!]|$)/i);
  if (buyMatch) add(buyMatch[1]);

  const dupeMatch = raw.match(/(?:dupe|clone|alternative|cheaper dupe|cheaper version)\s+(?:for|of|to)?\s*(.+?)(?:[?.!]|$)/i);
  if (dupeMatch) add(dupeMatch[1]);

  const ownMatch = raw.match(/(?:already own|own|have)\s+(.+?)(?:[?.!]|$)/i);
  if (ownMatch) add(ownMatch[1]);

  const normalizedMessage = normalizeName(raw);
  knownFragranceCatalog().forEach((item) => {
    const full = normalizeName(`${item.brand || ""} ${item.name}`.trim());
    const name = normalizeName(item.name);
    const important = importantQueryWords(item.name);
    const strongImportant = important.length >= 2 && important.every((word) => normalizedMessage.includes(word));
    if (
      normalizedMessage.includes(full) ||
      normalizedMessage.includes(name) ||
      strongImportant
    ) {
      add(`${item.brand ? `${item.brand} ` : ""}${item.name}`.trim());
    }
  });

  return candidates.slice(0, 4);
}

async function getFragranceProfile(query, route = "/api/chat") {
  let resolution;
  if (FRAGRANCE_PROVIDER === "rapidapi") {
    resolution = await resolveFragranceQuery(query, route);
  } else {
    const legacyProfile = await getFragellaFragrance(query, route);
    resolution = {
      found: Boolean(legacyProfile),
      selectedProfile: legacyProfile,
      query,
      candidates: [],
    };
  }
  const profile = resolution.selectedProfile;
  if (!resolution.found || !profile) {
    const missing = withProfileMetadata({
      found: false,
      query,
      candidates: resolution.candidates || [],
      name: query,
      brand: "",
      image_url: "",
      image: "",
      image_source: "placeholder",
      image_confidence: "fallback",
      notes: [],
      top_notes: [],
      middle_notes: [],
      base_notes: [],
      accords: [],
      confidence: "low",
      message: "I could not verify this fragrance. Try the full brand + fragrance name.",
    }, "unavailable");
    setPlaceholderImage(missing, route, "profile not found");
    return missing;
  }
  await ensureFragranceImage(profile, route);
  return withProfileMetadata({
    found: true,
    ...profile,
    query,
    resolvedName: resolution.resolvedName || profile.name,
    resolvedBrand: resolution.resolvedBrand || profile.brand,
    candidates: resolution.candidates || [],
    confidence: resolution.confidence || profile.confidence,
  }, profile.note_source || "verified");
}

function curatedIntentMatches(query = "") {
  const text = normalizeName(query);
  const wantedNotes = [];
  const wantedCategories = [];
  const feminineGift = /\b(wife|girlfriend|feminine|women|woman|her|gift)\b/.test(text);
  if (text.includes("sweet")) wantedNotes.push("vanilla", "tonka", "praline", "amber");
  if (text.includes("winter")) wantedNotes.push("cinnamon", "tobacco", "amber", "vanilla", "oud");
  if (text.includes("date")) wantedNotes.push("spicy", "vanilla", "amber", "cardamom");
  if (text.includes("vanilla")) wantedNotes.push("vanilla");
  if (text.includes("floral")) wantedNotes.push("jasmine", "rose", "orange blossom", "peony", "iris");
  if (feminineGift) wantedNotes.push("vanilla", "jasmine", "orange blossom", "musk", "rose");
  if (text.includes("fresh") || text.includes("school") || text.includes("office")) wantedNotes.push("bergamot", "musk", "lavender", "cedar", "marine");
  if (text.includes("arabic") || text.includes("middle eastern")) wantedCategories.push("Arabic / Middle Eastern");
  if (text.includes("luxury") || text.includes("niche")) wantedCategories.push("Luxury", "Niche");
  if (text.includes("affordable") || text.includes("cheap") || text.includes("under")) wantedCategories.push("Affordable", "Arabic / Middle Eastern");

  return curatedCatalog()
    .filter((entry) => {
      const haystack = normalizeName(`${entry.brand} ${entry.name} ${entry.categoryLabel} ${(entry.aliases || []).join(" ")} ${(entry.notes || []).join(" ")} ${entry.vibe || ""}`);
      const noteMatch = wantedNotes.length ? wantedNotes.some((term) => haystack.includes(term)) : false;
      const categoryMatch = wantedCategories.length ? wantedCategories.includes(entry.categoryLabel) : false;
      const giftSafe = feminineGift && /libre|chance|goddess|paradoxe|jadore|j adore|mon guerlain|good girl|vanilla 28|born in roma/.test(haystack);
      return noteMatch || categoryMatch || giftSafe || haystack.includes(text);
    })
    .map((entry) => withProfileMetadata({
      found: true,
      name: entry.name,
      brand: entry.brand,
      aliases: entry.aliases || [],
      image_url: "",
      image: "",
      notes: entry.notes,
      top_notes: [],
      middle_notes: [],
      base_notes: [],
      accords: [],
      description: "",
      shortDescription: shortProfileDescription(entry),
      rating: null,
      reviewCount: null,
      categoryLabel: entry.categoryLabel,
      vibe: entry.vibe || "",
      gender: entry.gender || "",
      source: "hidden",
      confidence: "medium",
    }, "curated"));
}

async function searchFragrances(query, limit = 8, route = "/api/chat") {
  const rapidProfiles = FRAGRANCE_PROVIDER === "rapidapi" ? await searchRapidApiProfiles(query, route) : [];
  const curatedProfiles = curatedIntentMatches(query);
  const exactCurated = curatedProfileForQuery(query);
  const broadIntent = isVibeQuery(query) || /\b(winter|date|sweet|arabic|affordable|under|cheap|school|office|wife|girlfriend|feminine|floral|gift|loud|club|safe)\b/.test(normalizeName(query));
  const merged = [
    ...(exactCurated ? [exactCurated] : []),
    ...(broadIntent ? [...curatedProfiles, ...rapidProfiles] : [...rapidProfiles, ...curatedProfiles]),
  ].filter(
    (profile, index, array) =>
      array.findIndex((entry) => `${safeLower(entry.brand)}::${safeLower(entry.name)}` === `${safeLower(profile.brand)}::${safeLower(profile.name)}`) === index
  );
  const wearable = merged.filter((profile) => isWearableFragrance(profile, query) || profile.source === "hidden");
  const categoryWeight = (item) => {
    const queryText = normalizeName(query);
    const category = item.categoryLabel || normalizedBrandCategory(item.brand);
    if (/\b(school|office|gym|clean|fresh|daily|subtle)\b/.test(queryText)) {
      if (category === "Designer") return 38;
      if (category === "Niche") return 32;
      if (category === "Luxury") return 28;
      if (category === "Affordable") return 24;
      if (category === "Arabic / Middle Eastern") return 18;
      return 0;
    }
    if (category === "Arabic / Middle Eastern") return 34;
    if (category === "Affordable") return 32;
    if (category === "Designer") return 28;
    if (category === "Luxury") return 24;
    if (category === "Niche") return 22;
    return 0;
  };
  const preSorted = wearable.sort((first, second) => {
    const secondScore = categoryWeight(second) + (queryMatchesNotes(query, second) ? 20 : 0) + (second.source === "hidden" ? 8 : 0);
    const firstScore = categoryWeight(first) + (queryMatchesNotes(query, first) ? 20 : 0) + (first.source === "hidden" ? 8 : 0);
    return secondScore - firstScore;
  });
  const withImages = await Promise.all(preSorted.slice(0, Math.max(limit, 8)).map((profile) => ensureFragranceImage(profile, route)));
  const normalized = withImages.map((profile) => normalizeSearchResult(profile, query));
  const sorted = normalized.sort((first, second) => {
    if (exactCurated) {
      const exactKey = `${safeLower(exactCurated.brand)}::${safeLower(exactCurated.name)}`;
      const firstExact = `${safeLower(first.brand)}::${safeLower(first.name)}` === exactKey;
      const secondExact = `${safeLower(second.brand)}::${safeLower(second.name)}` === exactKey;
      if (firstExact !== secondExact) return firstExact ? -1 : 1;
    }
    const secondScore = categoryWeight(second) + (queryMatchesNotes(query, second) ? 20 : 0);
    const firstScore = categoryWeight(first) + (queryMatchesNotes(query, first) ? 20 : 0);
    return secondScore - firstScore;
  });
  const knownCategory = sorted.filter((item) => (item.categoryLabel || "Unknown") !== "Unknown");
  const base = knownCategory.length >= Math.min(3, limit) ? knownCategory : sorted;
  return maybeRankSearchResults(query, base).then((items) => items.slice(0, limit));
}

async function gatherFragranceCandidates(constraints = {}, route = "/api/chat", rawMessage = "") {
  const directQuery = rawMessage ? cleanChatSearchQuery(rawMessage) : "";
  const queryParts = [
    directQuery,
    constraints.notesWanted?.length ? constraints.notesWanted.join(" ") : "",
    constraints.vibe,
    constraints.season,
    constraints.occasion,
    constraints.recipient ? `${constraints.recipient} gift` : "",
    constraints.genderPreference?.startsWith("feminine") ? "feminine floral vanilla popular" : "",
    constraints.strengthPreference === "loud" ? "loud clubbing projection" : "",
    constraints.strengthPreference?.startsWith("subtle") ? "safe clean subtle" : "",
    constraints.categoryPreference,
    "fragrance",
  ].filter(Boolean);
  const query = queryParts.join(" ").trim() || "popular fragrance";
  const candidates = await searchFragrances(query, 12, route);
  return filterWearableFragrances(candidates, constraints);
}

function filterWearableFragrances(candidates = [], constraints = {}) {
  return (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => {
      const title = normalizeName(`${candidate.brand || ""} ${candidate.name || ""} ${candidate.shortDescription || ""}`);
      if (!candidate.name || isRejectedProductTitle(title)) return false;
      if ((constraints.notesAvoided || []).some((note) => normalizeName(note) && normalizeName((candidate.notes || []).join(" ")).includes(normalizeName(note)))) return false;
      return true;
    })
    .filter((candidate, index, array) =>
      array.findIndex((item) => `${safeLower(item.brand)}::${safeLower(item.name)}` === `${safeLower(candidate.brand)}::${safeLower(candidate.name)}`) === index
    );
}

function calculatePopularitySignal(candidate = {}) {
  const brandCategory = candidate.categoryLabel || normalizedBrandCategory(candidate.brand);
  const reviewCount = Number(candidate.reviewCount || candidate.reviewsCount || 0);
  const rating = Number(candidate.rating || candidate.reviewsScoreAvg || 0);
  const curated = curatedCatalog().some((entry) => safeLower(entry.name) === safeLower(candidate.name) && safeLower(entry.brand) === safeLower(candidate.brand));
  let score = 0;
  if (reviewCount > 10000) score += 32;
  else if (reviewCount > 1000) score += 24;
  else if (reviewCount > 100) score += 14;
  if (rating >= 4.3) score += 18;
  else if (rating >= 3.8) score += 10;
  if (["Designer", "Luxury", "Niche"].includes(brandCategory)) score += 18;
  if (["Arabic / Middle Eastern", "Affordable"].includes(brandCategory)) score += 12;
  if (curated) score += 24;
  const label = score >= 58 ? "Strong popularity signal" : score >= 36 ? "Widely available" : score >= 22 ? "Cult favorite signal" : "Low data signal";
  return { score: Math.min(100, score), label };
}

function noteConstraintScore(candidate = {}, constraints = {}) {
  const haystack = normalizeName(`${(candidate.notes || []).join(" ")} ${(candidate.accords || []).join(" ")} ${candidate.shortDescription || ""} ${candidate.name || ""}`);
  return (constraints.notesWanted || []).reduce((score, note) => score + (haystack.includes(normalizeName(note)) ? 12 : 0), 0);
}

function candidateShelfOverlap(candidate = {}, shelf = []) {
  const notes = new Set((candidate.notes || []).map(safeLower));
  if (!notes.size || !shelf.length) return "low";
  const maxShared = Math.max(0, ...shelf.map((item) => uniqueStrings(item.notes || []).map(safeLower).filter((note) => notes.has(note)).length));
  if (maxShared >= 4) return "high";
  if (maxShared >= 2) return "medium";
  return "low";
}

function rankCandidates(candidates = [], constraints = {}, shelf = []) {
  return candidates.map((candidate) => {
    const popularity = calculatePopularitySignal(candidate);
    const category = candidate.categoryLabel || normalizedBrandCategory(candidate.brand);
    let matchScore = 42;
    matchScore += noteConstraintScore(candidate, constraints);
    if (constraints.categoryPreference && category === constraints.categoryPreference) matchScore += 12;
    if (constraints.genderPreference?.startsWith("feminine") && /libre|chance|goddess|paradoxe|jadore|j adore|mon guerlain|good girl|vanilla|donna/.test(normalizeName(`${candidate.brand} ${candidate.name}`))) matchScore += 32;
    if (constraints.genderPreference?.startsWith("masculine") && /black opium|libre|chance|goddess|paradoxe|jadore|j adore|mon guerlain|good girl|donna|born in roma/.test(normalizeName(`${candidate.brand} ${candidate.name}`))) matchScore -= 28;
    if (constraints.recipient && /black opium|spicebomb|sauvage|club de nuit intense man|9pm\b/.test(normalizeName(`${candidate.brand} ${candidate.name}`))) matchScore -= 16;
    if ((constraints.notesWanted || []).some((note) => normalizeName(note) === "floral") && /jasmine|rose|orange blossom|peony|iris|floral/.test(normalizeName(`${(candidate.notes || []).join(" ")} ${candidate.shortDescription || ""}`))) matchScore += 12;
    if (constraints.occasion === "school" && /sauvage|bleu|wood sage|chance|prada|musk|clean|fresh/.test(normalizeName(`${candidate.name} ${candidate.notes?.join(" ")}`))) matchScore += 12;
    if (constraints.strengthPreference === "loud" && /khamrah|9pm|spicebomb|most wanted|oud|club|tobacco|amber/.test(normalizeName(`${candidate.name} ${candidate.notes?.join(" ")}`))) matchScore += 14;
    if (candidate.bestPrice && constraints.budget && priceNumber({ price: candidate.bestPrice }) <= constraints.budget) matchScore += 10;
    if (candidate.image_confidence === "high") matchScore += 5;
    if (candidate.image_confidence === "medium") matchScore += 3;
    matchScore += Math.round(popularity.score * 0.18);
    const shelfOverlap = candidateShelfOverlap(candidate, shelf);
    if (shelfOverlap === "high") matchScore -= 14;
    if (shelfOverlap === "medium") matchScore -= 6;
    const confidence = (candidate.notes?.length || candidate.accords?.length) && popularity.score >= 30 ? "high" : candidate.notes?.length ? "medium" : "low";
    return {
      ...candidate,
      matchScore: Math.max(1, Math.min(99, matchScore)),
      popularityScore: popularity.score,
      popularitySignal: popularity.label,
      valueScore: candidate.underBudget === true ? 90 : candidate.bestPrice ? 68 : 42,
      confidence,
      confidenceReason: confidence === "high" ? "Verified notes plus strong availability signals." : confidence === "medium" ? "Verified notes with partial market signals." : "Limited note or market data.",
      shelfOverlap,
      verdict: shelfOverlap === "high" ? "Sample First" : "Buy",
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function cleanChatSearchQuery(message = "") {
  return toDisplayString(message)
    .replace(/\b(find me|show me|recommend me|recommend|looking for|i want|please|can you)\b/gi, " ")
    .replace(/\b(cologne|fragrance|perfume)\b/gi, " fragrance ")
    .replace(/\bunder\s*\$?\d{2,4}\b/gi, " ")
    .replace(/\$\s*\d{2,4}/g, " ")
    .replace(/[?.!]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getLivePrices(query, route = "/api/chat") {
  try {
    return await getLiveShoppingResults(query);
  } catch (error) {
    logRoute(route, "price lookup skipped", { query, message: error.message });
    return [];
  }
}

function priceNumber(item = {}) {
  const value = Number(item.extracted_price);
  if (Number.isFinite(value)) return value;
  const priceText = toDisplayString(item.price).replace(/[^0-9.]/g, "");
  const parsed = Number(priceText);
  return Number.isFinite(parsed) ? parsed : null;
}

async function attachLiveOffers(recommendations = [], budget = null, route = "/api/chat") {
  const enriched = await Promise.all(
    recommendations.slice(0, 6).map(async (item) => {
      const query = `${item.brand || ""} ${item.name} cologne perfume`.trim();
      const offers = await getLivePrices(query, route);
      const bestWithinBudget = budget ? offers.find((offer) => {
        const price = priceNumber(offer);
        return price !== null && price <= budget;
      }) : null;
      const bestOffer = bestWithinBudget || offers[0] || null;
      return {
        ...item,
        bestPrice: bestOffer?.price || "",
        bestStore: bestOffer?.store || bestOffer?.source || "",
        shoppingLink: bestOffer?.link || "",
        underBudget: budget ? Boolean(bestWithinBudget) : null,
        _bestOffer: bestOffer,
      };
    })
  );
  const budgetFiltered = budget && enriched.some((item) => item.underBudget)
    ? enriched.filter((item) => item.underBudget)
    : enriched;
  const visibleRecommendations = budgetFiltered.slice(0, 5);
  const shoppingResults = visibleRecommendations.map((item) => item._bestOffer).filter(Boolean).slice(0, 6);
  return {
    recommendations: visibleRecommendations.map(({ _bestOffer, ...item }) => item),
    shoppingResults,
  };
}

function normalizeChatShelf(shelf = []) {
  return (Array.isArray(shelf) ? shelf : []).slice(0, 24).map((item) => ({
    name: toDisplayString(item.name),
    brand: toDisplayString(item.brand),
    status: toDisplayString(item.status || item.type || "Owned"),
    tags: uniqueStrings(item.tags || []),
    notes: uniqueStrings([...(item.notesPreview || []), ...(item.profile?.notes || []), ...(item.notes || [])]),
    accords: uniqueStrings(item.profile?.accords || []),
  })).filter((item) => item.name);
}

function compareShelfOverlap(fragrance, shelf = []) {
  const fragranceNotes = new Set(noteNames(fragrance));
  const similar = shelf.map((item) => {
    const shelfNotes = uniqueStrings(item.notes || []).map(safeLower);
    const sharedNotes = shelfNotes.filter((note) => fragranceNotes.has(note));
    return {
      name: item.name,
      brand: item.brand,
      status: item.status,
      sharedNotes,
      sharedTags: (item.tags || []).filter((tag) => (fragrance.accords || []).map(safeLower).includes(safeLower(tag))),
    };
  }).filter((item) => item.sharedNotes.length || item.sharedTags.length);
  return similar.sort((a, b) => (b.sharedNotes.length + b.sharedTags.length) - (a.sharedNotes.length + a.sharedTags.length)).slice(0, 5);
}

function uniqueShelfOverlap(overlaps = []) {
  const seen = new Set();
  return overlaps.filter((item) => {
    const key = `${safeLower(item.brand)}::${safeLower(item.name)}`;
    if (!item.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function analyzeShelfGaps(shelf = []) {
  const text = normalizeName(shelf.map((item) => `${item.name} ${item.brand} ${(item.tags || []).join(" ")} ${(item.notes || []).join(" ")}`).join(" "));
  const gaps = [
    { title: "Fresh daily scent", reason: "Useful for school, office, gym, and warm weather.", query: "fresh clean daily fragrance", examples: ["Dior Sauvage", "Bleu de Chanel", "Wood Sage & Sea Salt"] },
    { title: "Sweet winter/date-night scent", reason: "Adds warmth for nights out and cold weather.", query: "sweet winter date night fragrance", examples: ["Khamrah", "9PM", "Spicebomb Extreme"] },
    { title: "Formal luxury scent", reason: "A polished option for dinners, events, and dressed-up outfits.", query: "formal luxury fragrance", examples: ["Baccarat Rouge 540", "Oud Wood", "Layton"] },
    { title: "Affordable Arabic fragrance", reason: "High value category for projection and variety.", query: "arabic vanilla fragrance", examples: ["Liquid Brun", "Khamrah", "Club de Nuit Intense Man"] },
    { title: "Subtle close-range scent", reason: "Helps when loud projection would be too much.", query: "subtle musk clean fragrance", examples: ["Wood Sage & Sea Salt", "Santal 33"] },
  ];
  return gaps.filter((gap) => !normalizeName(`${gap.title} ${gap.examples.join(" ")}`).split(/\s+/).some((word) => word.length > 4 && text.includes(word))).slice(0, 4);
}

function scoreLayering(profileA, profileB) {
  return calculateLayering(profileA, profileB);
}

async function resolveFragranceProfile(query, route = "/api/chat") {
  const direct = await getFragranceProfile(query, route);
  if (direct.found) return direct;
  const candidates = await searchFragrances(query, 3, route);
  if (!candidates.length) return direct;
  const best = candidates[0];
  const resolved = await getFragranceProfile(`${best.brand || ""} ${best.name}`.trim(), route);
  return resolved.found ? resolved : { found: true, ...best };
}

function estimatedFamilyNotes(profile = {}, originalQuery = "") {
  const text = normalizeName(`${originalQuery} ${profile.brand || ""} ${profile.name || ""} ${profile.categoryLabel || ""} ${(profile.accords || []).join(" ")}`);
  const estimates = [];
  if (/sauvage|bleu|blue|fresh|clean|aquatic|marine/.test(text)) estimates.push("citrus", "aromatic", "musk", "woody");
  if (/vanilla|goddess|khamrah|9pm|sweet|tonka|amber/.test(text)) estimates.push("vanilla", "amber", "sweet", "musk");
  if (/oud|leather|tobacco|smoke|intense|fire/.test(text)) estimates.push("oud", "smoky", "amber", "spicy");
  if (/rose|floral|jasmine|blush|libre|jadore|paradoxe/.test(text)) estimates.push("jasmine", "rose", "musk", "vanilla");
  return uniqueStrings(estimates.length ? estimates : ["musk", "woody"]);
}

async function buildLayeringAnalysis(firstQuery, secondQuery, shelf = [], route = "/api/layering") {
  const [firstProfile, secondProfile] = await Promise.all([
    resolveFragranceProfile(firstQuery, route),
    resolveFragranceProfile(secondQuery, route),
  ]);
  const missing = [
    firstProfile?.found ? null : firstQuery,
    secondProfile?.found ? null : secondQuery,
  ].filter(Boolean);
  if (missing.length) {
    return {
      found: false,
      missing,
      confidence: "low",
      verdict: "Low Confidence",
      message: `${missing.join(" and ")} ${missing.length === 1 ? "was" : "were"} not found. Try the full brand + fragrance name.`,
    };
  }

  const firstNotesReal = noteNames(firstProfile).length > 0;
  const secondNotesReal = noteNames(secondProfile).length > 0;
  const scoringFirst = firstNotesReal ? firstProfile : { ...firstProfile, notes: estimatedFamilyNotes(firstProfile, firstQuery), note_source: "AI-estimated" };
  const scoringSecond = secondNotesReal ? secondProfile : { ...secondProfile, notes: estimatedFamilyNotes(secondProfile, secondQuery), note_source: "AI-estimated" };
  const computed = calculateLayering(scoringFirst, scoringSecond);
  const confidence = firstNotesReal && secondNotesReal ? "high" : "low";
  const verdict = confidence === "low"
    ? "Low Confidence"
    : computed.score >= 7.4
      ? "Safe Layer"
      : computed.score >= 5.8
        ? "Risky"
        : "Do Not Layer";
  const warning = confidence === "low"
    ? "This is estimated because complete note data was unavailable."
    : computed.warning_notes.join(" ") || "";
  const explanation = await explainLayering(computed, scoringFirst, scoringSecond);
  return {
    found: true,
    fragranceA: firstProfile,
    fragranceB: secondProfile,
    first: firstProfile,
    second: secondProfile,
    score: computed.score,
    verdict,
    confidence,
    sharedNotes: computed.shared_notes,
    shared_notes: computed.shared_notes,
    matching_accords: computed.matching_accords,
    complementaryNotes: computed.complementary_notes,
    complementary_notes: computed.complementary_notes,
    conflicts: computed.potential_conflicts,
    potential_conflicts: computed.potential_conflicts,
    sprayOrder: computed.spray_order,
    spray_order: computed.spray_order,
    ratio: computed.suggested_ratio,
    suggested_ratio: computed.suggested_ratio,
    bestOccasion: computed.occasion,
    occasion: computed.occasion,
    warning,
    warning_notes: warning ? [warning] : computed.warning_notes,
    explanation,
  };
}

async function getSerpApiOrganicResults(query, route = "/api/dupe-finder") {
  if (!process.env.SERPAPI_API_KEY) return [];
  const serpUrl = new URL("https://serpapi.com/search");
  serpUrl.searchParams.set("engine", "google");
  serpUrl.searchParams.set("q", query);
  serpUrl.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
  logRoute(route, "SerpAPI web URL", sanitizedUrl(serpUrl));
  const apiResponse = await fetch(serpUrl);
  logRoute(route, "SerpAPI web response status", apiResponse.status);
  if (!apiResponse.ok) return [];
  const data = await apiResponse.json().catch(() => ({}));
  return data.organic_results || [];
}

function dupeCandidatesFromWebResults(results = [], target = "") {
  const haystack = normalizeName(results.map((item) => `${item.title || ""} ${item.snippet || ""}`).join(" "));
  return knownFragranceCatalog()
    .filter((item) => {
      const full = normalizeName(`${item.brand || ""} ${item.name}`);
      const name = normalizeName(item.name);
      return haystack.includes(full) || haystack.includes(name);
    })
    .filter((item) => normalizeName(item.name) !== normalizeName(target));
}

function dupeSimilarity(targetProfile = {}, candidate = {}, knownBoost = 0, webBoost = 0) {
  const targetNotes = new Set(noteNames(targetProfile));
  const candidateNotes = noteNames(candidate);
  const shared = candidateNotes.filter((note) => targetNotes.has(note));
  const accordShared = intersectNames(targetProfile.accords || [], candidate.accords || []);
  let score = 34 + shared.length * 7 + accordShared.length * 8 + knownBoost + webBoost;
  if (candidate.bestPrice) score += 8;
  if (candidate.popularityScore) score += Math.round(candidate.popularityScore * 0.08);
  score = Math.max(1, Math.min(97, score));
  return {
    similarityScore: score,
    shared,
    confidence: score >= 78 && candidate.notes?.length ? "high" : score >= 55 ? "medium" : "low",
  };
}

async function buildDupeFinderResult(fragranceName, budget = null, shelf = [], route = "/api/dupe-finder") {
  const target = await resolveFragranceProfile(fragranceName, route);
  const normalizedTarget = normalizeName(fragranceName);
  const curated = CURATED_DUPE_LIBRARY.filter((item) =>
    normalizeName(`${item.targetBrand || ""} ${item.target}`).includes(normalizedTarget) ||
    normalizedTarget.includes(normalizeName(item.target))
  );
  const webResults = await Promise.all([
    getSerpApiOrganicResults(`best dupe for ${fragranceName}`, route),
    getSerpApiOrganicResults(`${fragranceName} clone fragrance`, route),
    getSerpApiOrganicResults(`${fragranceName} alternative cologne`, route),
    getSerpApiOrganicResults(`${fragranceName} similar perfume`, route),
  ]).then((groups) => groups.flat()).catch(() => []);
  const webCandidates = dupeCandidatesFromWebResults(webResults, fragranceName);
  const searchCandidates = await searchFragrances(`affordable alternative ${fragranceName}`, 8, route).catch(() => []);
  const candidateSeeds = [...curated.map((item) => ({ name: item.name, brand: item.brand, confidenceBoost: item.confidenceBoost })), ...webCandidates, ...searchCandidates]
    .filter((item, index, array) =>
      array.findIndex((entry) => `${safeLower(entry.brand)}::${safeLower(entry.name)}` === `${safeLower(item.brand)}::${safeLower(item.name)}`) === index
    )
    .slice(0, 8);
  const profiles = await Promise.all(candidateSeeds.map(async (seed) => {
    const profile = await resolveFragranceProfile(`${seed.brand || ""} ${seed.name}`.trim(), route);
    return { ...profile, confidenceBoost: seed.confidenceBoost || 0, webBoost: webCandidates.some((item) => safeLower(item.name) === safeLower(seed.name)) ? 10 : 0 };
  }));
  const ranked = rankCandidates(profiles.filter((item) => item.found), { budget, notesWanted: noteNames(target).slice(0, 5) }, shelf);
  const priced = await attachLiveOffers(ranked, budget, route);
  const dupes = priced.recommendations.map((candidate) => {
    const similarity = dupeSimilarity(target, candidate, candidate.confidenceBoost || 0, candidate.webBoost || 0);
    return {
      name: candidate.name,
      brand: candidate.brand,
      image_url: candidate.image_url || candidate.image,
      price: candidate.bestPrice || "",
      store: candidate.bestStore || "",
      notes: candidate.notes || [],
      similarityScore: similarity.similarityScore,
      confidence: similarity.confidence,
      whySimilar: similarity.shared.length ? `Shares ${similarity.shared.slice(0, 4).join(", ")} with the target profile.` : "Closest available alternative from profile and web signals.",
      differences: similarity.shared.length ? "Expect some difference in texture, projection, or dry-down." : "Similarity is lower confidence because note overlap was limited.",
      bestFor: candidate.categoryLabel || "Affordable alternative",
      buyLink: candidate.shoppingLink || "",
      matchScore: similarity.similarityScore,
      popularityScore: candidate.popularityScore,
      shelfOverlap: candidate.shelfOverlap || "low",
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);

  return {
    target,
    dupes,
    message: dupes.some((dupe) => dupe.confidence === "high")
      ? "Verified dupe candidates found."
      : "I could not verify a strong dupe, but here are the closest alternatives.",
  };
}

function buildChatFallback(context) {
  const recommendations = context.recommendations || [];
  const shoppingResults = context.shoppingResults || [];
  const layeringAnalysis = context.layeringAnalysis || null;
  const shelfInsights = context.shelfInsights || [];
  let answer = "I pulled the strongest available fragrance data and kept the recommendation grounded in real notes and live offers.";

  if (context.intent === "layering" && layeringAnalysis) {
    answer = `${context.names?.[0] || "The first fragrance"} and ${context.names?.[1] || "the second fragrance"} score ${layeringAnalysis.score}/10. Start with ${layeringAnalysis.spray_order || "the fresher scent first"} and test lightly before a full wear.`;
  } else if (context.intent === "buy_advice" && context.primaryProfile?.found) {
    const overlapNames = (context.shelfOverlap || []).map((item) => fragranceLabel(item) || item.name).filter(Boolean).slice(0, 2).join(" and ");
    const overlap = context.shelfOverlap?.length
      ? `You already have overlap with ${overlapNames || "your shelf"}, so I would Sample First unless the live price is especially strong.`
      : "It fills a clearer spot in your shelf, so it is a reasonable Buy if you like the note profile.";
    answer = `${context.primaryProfile.name}: ${overlap}`;
  } else if (context.intent === "wear_today") {
    answer = context.shelf?.length
      ? "From your shelf, pick the cleanest and easiest fragrance for the setting. If it is school or daytime, keep sprays light."
      : "Your shelf is empty, so I would start with clean daily fragrances like Bleu de Chanel, Dior Sauvage, or Wood Sage & Sea Salt.";
  } else if (context.intent === "shelf_gap") {
    answer = shelfInsights.length
      ? `Your shelf has ${shelfInsights.length} useful gap areas to consider next.`
      : "Your shelf looks balanced from the available data.";
  } else if (recommendations.length) {
    const lead = recommendations[0];
    answer = `Start with ${lead.brand ? `${lead.brand} ` : ""}${lead.name}. It is the strongest match from the verified candidates I found.`;
  }

  return {
    answer,
    intent: context.intent,
    confidence: context.noteDataLimited ? "medium" : "high",
    recommendations,
    shoppingResults,
    layeringAnalysis,
    shelfInsights,
    followUps: ["Show cheaper options", "Make it more fresh", "Only Arabic fragrances", "Compare with my shelf"],
  };
}

function mergeChatRecommendations(aiRecommendations = [], realRecommendations = []) {
  if (!Array.isArray(aiRecommendations) || !aiRecommendations.length) return realRecommendations;
  const realByKey = new Map(
    realRecommendations.map((item) => [`${safeLower(item.brand)}::${safeLower(item.name)}`, item])
  );
  const merged = aiRecommendations.map((item) => {
    const key = `${safeLower(item.brand)}::${safeLower(item.name)}`;
    const real = realByKey.get(key);
    return real
      ? {
          ...real,
          whyItFits: toDisplayString(item.whyItFits || item.why || item.matchReason) || real.whyItFits,
          bestOccasion: toDisplayString(item.bestOccasion || item.bestFor) || real.bestOccasion,
          confidence: toDisplayString(item.confidence) || real.confidence,
          matchReason: toDisplayString(item.matchReason || item.whyItFits || item.why) || real.matchReason,
          matchScore: Number(item.matchScore || real.matchScore || 0) || real.matchScore,
          popularityScore: Number(item.popularityScore || real.popularityScore || 0) || real.popularityScore,
          bestFor: toDisplayString(item.bestFor || item.bestOccasion) || real.bestFor,
          watchOut: toDisplayString(item.watchOut) || real.watchOut,
          priceComment: toDisplayString(item.priceComment) || real.priceComment,
          shelfOverlap: toDisplayString(item.shelfOverlap) || real.shelfOverlap,
          verdict: toDisplayString(item.verdict) || real.verdict,
        }
      : null;
  }).filter(Boolean);
  const seen = new Set(merged.map((item) => `${safeLower(item.brand)}::${safeLower(item.name)}`));
  realRecommendations.forEach((item) => {
    const key = `${safeLower(item.brand)}::${safeLower(item.name)}`;
    if (!seen.has(key)) merged.push(item);
  });
  return merged.slice(0, 5);
}

function normalizeChatResponse(response, context) {
  const fallback = buildChatFallback(context);
  return {
    answer: toDisplayString(response?.answer) || fallback.answer,
    intent: toDisplayString(response?.intent) || context.intent,
    confidence: ["high", "medium", "low"].includes(toDisplayString(response?.confidence)) ? response.confidence : fallback.confidence,
    reasoningSummary: toDisplayString(response?.reasoningSummary) || toDisplayString(response?.answer) || fallback.answer,
    recommendations: mergeChatRecommendations(response?.recommendations, fallback.recommendations),
    shoppingResults: fallback.shoppingResults,
    layeringAnalysis: fallback.layeringAnalysis,
    shelfInsights: fallback.shelfInsights,
    followUps: Array.isArray(response?.followUps) && response.followUps.length ? response.followUps.slice(0, 5) : fallback.followUps,
  };
}

async function askOpenAiChat(context) {
  const fallback = buildChatFallback(context);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await callOpenAiJson(
      {
        message: context.message,
        intent: context.intent,
        constraints: context.constraints,
        fragranceProfiles: context.fragranceProfiles,
        recommendations: context.recommendations,
        shoppingResults: context.shoppingResults,
        layeringAnalysis: context.layeringAnalysis,
        shelf: context.shelf,
        shelfOverlap: context.shelfOverlap,
        shelfInsights: context.shelfInsights,
        selectedNotes: context.selectedNotes,
        recentHistory: context.recentHistory,
        noteDataLimited: context.noteDataLimited,
      },
      "/api/chat",
      "You are Aromix AI, a senior fragrance consultant with deep knowledge of designer, niche, luxury, and Arabic fragrances. Use ONLY the provided profiles, notes, accords, shelf data, prices, and shopping results — never invent or hallucinate notes, prices, ratings, or stores. When note data is missing, say so and lower your confidence. Structure your answer like a consultant: lead with the direct recommendation, explain why it fits the request (occasion, budget, season, shelf), flag a watch-out or limitation, and give a clear next step. For layering: always recommend the application order. For dupes: explain the note overlap and any key differences. For shelf gaps: name the exact missing category and give one actionable pick. Return strict JSON exactly shaped as {\"answer\":\"...\",\"intent\":\"...\",\"confidence\":\"high|medium|low\",\"reasoningSummary\":\"...\",\"recommendations\":[{\"name\":\"...\",\"brand\":\"...\",\"rank\":1,\"matchScore\":92,\"popularityScore\":80,\"confidence\":\"high|medium|low\",\"whyItFits\":\"...\",\"bestFor\":\"...\",\"watchOut\":\"...\",\"priceComment\":\"...\",\"shelfOverlap\":\"low|medium|high\",\"verdict\":\"Buy|Sample First|Skip\"}],\"shoppingResults\":[],\"layeringAnalysis\":null,\"shelfInsights\":[],\"followUps\":[]}. Never add products not in the provided recommendations list.",
      fallback
    );
    return normalizeChatResponse(response, context);
  } catch (error) {
    logError("/api/chat", "OpenAI chat reasoning failure", error);
    return { ...fallback, confidence: fallback.confidence === "high" ? "medium" : fallback.confidence };
  }
}

async function buildChatContext(payload = {}, route = "/api/chat") {
  const message = toDisplayString(payload.message);
  const recentHistory = Array.isArray(payload.context?.chatHistory)
    ? payload.context.chatHistory.slice(-10).map((item) => ({
        role: toDisplayString(item.role),
        content: toDisplayString(item.content),
      })).filter((item) => item.content)
    : [];
  const intent = detectChatIntent(message);
  const constraints = extractUserConstraints(message, recentHistory);
  const names = extractFragranceNames(message);
  const shelf = normalizeChatShelf(payload.shelf || []);
  const selectedNotes = Array.isArray(payload.selectedNotes) ? payload.selectedNotes.map((note) => ({
    label: toDisplayString(note.label || note.name || note),
    family: toDisplayString(note.family),
    layer: toDisplayString(note.layer),
  })).filter((note) => note.label) : [];

  const context = {
    message,
    intent,
    constraints,
    budget: constraints.budget,
    occasion: constraints.occasion,
    season: constraints.season,
    names,
    shelf,
    selectedNotes,
    recentHistory,
    recommendations: [],
    shoppingResults: [],
    fragranceProfiles: [],
    layeringAnalysis: null,
    shelfInsights: [],
    shelfOverlap: [],
    noteDataLimited: false,
    chosenTools: [],
    candidateCount: 0,
    filteredCount: 0,
  };

  if (intent === "layering") {
    context.chosenTools.push("fragrance_profile", "layering_score");
    const [firstName, secondName] = names;
    if (firstName && secondName) {
      const analysis = await buildLayeringAnalysis(firstName, secondName, shelf, route);
      context.fragranceProfiles = [analysis.fragranceA, analysis.fragranceB].filter(Boolean);
      context.layeringAnalysis = analysis;
      context.noteDataLimited = analysis.confidence === "low";
    } else {
      context.noteDataLimited = true;
    }
    return context;
  }

  if (intent === "buy_advice" || intent === "fragrance_profile") {
    context.chosenTools.push("fragrance_profile", "shopping", "shelf_overlap");
    const target = names[0] || constraints.comparisonTarget || message;
    const profile = await getFragranceProfile(target, route);
    context.primaryProfile = profile;
    context.fragranceProfiles = [profile];
    context.noteDataLimited = !noteNames(profile).length;
    context.shelfOverlap = profile.found ? compareShelfOverlap(profile, shelf) : [];
    if (profile.found && names.length > 1) {
      const ownedProfiles = await Promise.all(names.slice(1, 4).map((name) => getFragranceProfile(name, route)));
      const ownedShelf = ownedProfiles.filter((item) => item.found).map((item) => ({
        name: item.name,
        brand: item.brand,
        status: "Owned",
        tags: [],
        notes: noteNames(item),
        accords: item.accords || [],
      }));
      context.fragranceProfiles = [profile, ...ownedProfiles];
      context.shelfOverlap = uniqueShelfOverlap([...context.shelfOverlap, ...compareShelfOverlap(profile, ownedShelf)]);
    }
    if (profile.found) {
      const offers = await getLivePrices(`${profile.brand || ""} ${profile.name}`.trim(), route);
      context.shoppingResults = offers.slice(0, 5);
      const ranked = rankCandidates([normalizeSearchResult(profile, message)], constraints, shelf);
      context.recommendations = ranked;
    }
    return context;
  }

  if (intent === "wear_today") {
    context.chosenTools.push("shelf", shelf.length ? "shelf_ranking" : "recommendation_search");
    if (shelf.length) {
      context.recommendations = rankCandidates(shelf.map((item) => ({
        name: item.name,
        brand: item.brand,
        notes: item.notes,
        accords: item.accords,
        tags: item.tags,
        matchReason: constraints.occasion ? `Good candidate for ${constraints.occasion}` : "Good candidate from your shelf",
        shortDescription: uniqueStrings([...(item.tags || []), ...(item.notes || [])]).slice(0, 5).join(", "),
        categoryLabel: item.status || "Owned",
        image_url: item.image || item.profile?.image_url || "",
        image: item.image || item.profile?.image_url || "",
      })), constraints, shelf).slice(0, 3);
    } else {
      const candidates = await gatherFragranceCandidates({ ...constraints, occasion: constraints.occasion || "school", strengthPreference: constraints.strengthPreference || "subtle/moderate" }, route);
      const priced = await attachLiveOffers(rankCandidates(candidates, constraints, shelf), constraints.budget, route);
      context.recommendations = rankCandidates(priced.recommendations, constraints, shelf).slice(0, 5);
      context.shoppingResults = priced.shoppingResults;
    }
    return context;
  }

  if (intent === "shelf_gap") {
    context.chosenTools.push("shelf_gap_analysis", "recommendation_search");
    context.shelfInsights = analyzeShelfGaps(shelf);
    const firstGap = context.shelfInsights[0];
    if (firstGap) {
      const recs = await searchFragrances(firstGap.query, 6, route);
      context.recommendations = rankCandidates(recs, constraints, shelf).slice(0, 5);
    }
    return context;
  }

  if (intent === "dupe") {
    context.chosenTools.push("dupe_finder", "fragrance_profile", "shopping");
    const target = names[0] || message.replace(/dupe|clone|alternative|cheaper|for|of|to/gi, " ").trim();
    const dupeResult = await buildDupeFinderResult(target, constraints.budget, shelf, route);
    context.primaryProfile = dupeResult.target;
    context.fragranceProfiles = [dupeResult.target, ...(dupeResult.dupes || [])].filter(Boolean);
    context.recommendations = (dupeResult.dupes || []).map((dupe) => ({
      ...dupe,
      matchScore: dupe.similarityScore,
      matchReason: dupe.whySimilar,
      bestPrice: dupe.price,
      shoppingLink: dupe.buyLink,
      verdict: dupe.confidence === "high" ? "Buy" : "Sample First",
    }));
    context.shoppingResults = context.recommendations.filter((item) => item.buyLink).map((item) => ({
      title: `${item.brand} ${item.name}`,
      store: item.store || "",
      price: item.price || "",
      link: item.buyLink,
      thumbnail: item.image_url,
    }));
    return context;
  }

  if (intent === "shopping") {
    context.chosenTools.push("shopping");
    const query = names[0] || constraints.comparisonTarget || message;
    context.shoppingResults = await getLivePrices(query, route);
    if (names[0]) {
      const profile = await getFragranceProfile(names[0], route);
      context.fragranceProfiles = [profile];
      context.recommendations = profile.found ? rankCandidates([normalizeSearchResult(profile, message)], constraints, shelf) : [];
    }
    return context;
  }

  context.chosenTools.push("recommendation_search", "shopping", "ranking");
  const candidates = await gatherFragranceCandidates(constraints, route, message);
  context.candidateCount = candidates.length;
  const rankedCandidates = rankCandidates(candidates, constraints, shelf).slice(0, 8);
  const priced = await attachLiveOffers(rankedCandidates, constraints.budget, route);
  context.filteredCount = priced.recommendations.length;
  context.recommendations = rankCandidates(priced.recommendations, constraints, shelf).slice(0, 5);
  context.shoppingResults = priced.shoppingResults;
  context.noteDataLimited = context.recommendations.some((item) => !item.notes?.length);
  return context;
}

async function handleChat(request, response) {
  const route = "/api/chat";
  try {
    const payload = await readBody(request, { maxBytes: MAX_BODY_BYTES });
    const message = validatedText(payload.message, "message", 1000);
    payload.message = message;
    if (Array.isArray(payload.shelf) && payload.shelf.length > 50) payload.shelf = payload.shelf.slice(0, 50);
    if (Array.isArray(payload.selectedNotes) && payload.selectedNotes.length > 50) payload.selectedNotes = payload.selectedNotes.slice(0, 50);
    if (Array.isArray(payload.context?.chatHistory)) payload.context.chatHistory = payload.context.chatHistory.slice(-10);
    logRoute(route, "incoming body", { message, shelfCount: payload.shelf?.length || 0, selectedNotes: payload.selectedNotes?.length || 0 });
    logRoute(route, "keys", keyState());

    const context = await buildChatContext(payload, route);
    const normalized = await askOpenAiChat(context);
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, {
      answer: "Aromix AI is unavailable right now. Try again in a moment.",
      intent: "general",
      confidence: "low",
      recommendations: [],
      shoppingResults: [],
      layeringAnalysis: null,
      shelfInsights: [],
      followUps: ["Try a simpler fragrance name", "Ask for a broader recommendation"],
    });
  }
}

async function handleChatPlanDebug(request, response) {
  const route = "/debug/chat-plan";
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const payload = request.method === "POST"
      ? await readBody(request)
      : { message: requestUrl.searchParams.get("message") || requestUrl.searchParams.get("q") || "" };
    const context = await buildChatContext(payload, route);
    sendJson(response, 200, {
      intent: context.intent,
      constraints: context.constraints,
      candidateCount: context.candidateCount || context.recommendations.length,
      filteredCount: context.filteredCount || context.recommendations.length,
      chosenTools: context.chosenTools,
      confidence: context.noteDataLimited ? "limited" : "normal",
      recommendationsPreview: context.recommendations.slice(0, 5).map((item) => ({
        name: item.name,
        brand: item.brand,
        matchScore: item.matchScore,
        confidence: item.confidence,
      })),
    });
  } catch (error) {
    handleRouteError(route, response, error);
  }
}

async function handleDupeFinder(request, response) {
  const route = "/api/dupe-finder";
  try {
    const payload = await readBody(request);
    const fragranceName = validatedText(payload.fragranceName || payload.query || payload.name, "fragranceName", 120);
    const shelf = normalizeChatShelf(payload.shelf || []);
    const result = await buildDupeFinderResult(fragranceName, Number(payload.budget || 0) || null, shelf, route);
    const ai = await callOpenAiJson(
      {
        fragranceName,
        target: result.target,
        dupes: result.dupes,
      },
      route,
      "You are Aromix AI, a fragrance consultant specializing in scent alternatives. Use ONLY the provided target profile, dupe candidates, similarity scores, notes, and prices — never invent data. For each dupe: explain specifically what notes they share with the target, what is different (texture, projection, longevity), and whether it is a true blind-buy dupe or a sample-first. Lead your answer with the best overall pick and why. Return JSON with answer, confidence (high|medium|low), reasoningSummary, recommendations, warnings, followUps.",
      {
        answer: result.message,
        confidence: result.dupes.some((dupe) => dupe.confidence === "high") ? "high" : result.dupes.length ? "medium" : "low",
        reasoningSummary: result.message,
        recommendations: result.dupes,
        warnings: [],
        followUps: ["Show cheaper options", "Show closer niche alternatives", "Only Arabic fragrances"],
      }
    ).catch(() => null);
    sendJson(response, 200, {
      target: result.target,
      dupes: result.dupes,
      message: ai?.answer || result.message,
      reasoningSummary: ai?.reasoningSummary || result.message,
      confidence: ai?.confidence || (result.dupes.length ? "medium" : "low"),
      followUps: ai?.followUps || ["Show cheaper options", "Only Arabic fragrances"],
    });
  } catch (error) {
    handleRouteError(route, response, error, { target: null, dupes: [] });
  }
}

async function handleFragellaMatches(request, response) {
  if (!FRAGELLA_ENABLED || !process.env.FRAGELLA_API_KEY) {
    sendJson(response, 200, { results: [] });
    return;
  }

  try {
    const payload = await readBody(request);
    const params = {
      top: payload.top?.join(","),
      middle: payload.middle?.join(","),
      base: payload.base?.join(","),
      general: payload.general?.join(","),
      limit: "10",
    };
    const data = await callFragella("fragrances/match", params);
    const results = (Array.isArray(data) ? data : data.results || data.fragrances || []).map(normalizeFragellaFragrance).filter(Boolean);
    sendJson(response, 200, { results });
  } catch (error) {
    logError("/api/matches", "legacy match failure", error);
    sendJson(response, 200, { results: [] });
  }
}

async function handleFragellaNotes(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const query = requestUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2 || query.length > 120) {
    sendJson(response, 200, { results: [] });
    return;
  }

  if (!FRAGELLA_ENABLED || !process.env.FRAGELLA_API_KEY) {
    sendJson(response, 200, { results: [] });
    return;
  }

  try {
    const data = await callFragella("notes", { search: query, limit: "8" });
    sendJson(response, 200, { results: Array.isArray(data) ? data : data.results || [] });
  } catch (error) {
    logError("/api/notes", "legacy notes failure", error);
    sendJson(response, 200, { results: [] });
  }
}

function noteNames(profile) {
  return [...(profile.notes || []), ...(profile.top_notes || []), ...(profile.middle_notes || []), ...(profile.base_notes || [])]
    .map((note) => safeLower(note.name || note))
    .filter(Boolean);
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function intersectNames(first = [], second = []) {
  const secondMap = new Map(second.map((item) => [normalizeName(item), item]));
  return first.filter((item) => secondMap.has(normalizeName(item)));
}

function noteFamilies(profile) {
  return uniqueStrings(noteNames(profile).map((note) => noteFamily(note)).filter(Boolean));
}

function calculateLayering(first, second) {
  const firstNotes = noteNames(first);
  const secondNotes = noteNames(second);
  const sharedNotes = intersectNames(firstNotes, secondNotes);
  const matchingAccords = intersectNames(first.accords || [], second.accords || []);
  const firstFamilies = noteFamilies(first);
  const secondFamilies = noteFamilies(second);
  const complementaryFamilies = uniqueStrings(
    firstFamilies.flatMap((family) => (COMPLEMENTARY_FAMILIES[family] || []).filter((target) => secondFamilies.includes(target)))
  );
  const complementaryNotes = uniqueStrings(
    [...firstNotes, ...secondNotes].filter((note) => complementaryFamilies.includes(noteFamily(note)))
  ).slice(0, 8);
  const conflicts = uniqueStrings(
    firstFamilies.flatMap((family) =>
      secondFamilies.filter((otherFamily) => CONFLICT_FAMILIES.has([family, otherFamily].sort().join(":")))
    )
  );
  const denominator = Math.max(Math.min(firstNotes.length, secondNotes.length), 1);
  let score = 4.6 + sharedNotes.length * 0.5 + matchingAccords.length * 0.55 + complementaryFamilies.length * 0.32;
  const warnings = [];

  if (!sharedNotes.length) warnings.push("No shared notes were returned by the scent profile data.");
  if (!matchingAccords.length) warnings.push("No matching accords were returned by the scent profile data.");
  if (conflicts.length) warnings.push(`Potential tension between ${conflicts.join(" and ")} families.`);
  if (matchingAccords.some((accord) => ["oud", "leather", "smoky", "tobacco"].includes(normalizeName(accord)))) {
    warnings.push("Dense accords may become heavy if both fragrances are oversprayed.");
  }

  score += Math.min(sharedNotes.length / denominator, 1) * 1.3;
  score -= conflicts.length * 0.38;
  score = Math.max(1, Math.min(10, Number(score.toFixed(1))));

  const firstTopCount = (first.top_notes?.length || 0) || Math.ceil((first.notes?.length || 0) / 3);
  const secondTopCount = (second.top_notes?.length || 0) || Math.ceil((second.notes?.length || 0) / 3);
  const sprayOrder =
    firstTopCount >= secondTopCount
      ? `${first.name} first, then ${second.name}`
      : `${second.name} first, then ${first.name}`;
  const ratio = score >= 8 ? "2:1" : score >= 6.5 ? "1:1" : "1:2";
  const occasion = conflicts.length
    ? "Best for short evening wear"
    : sharedNotes.length >= 4 || complementaryFamilies.length >= 2
      ? "Versatile for nights out and cooler evenings"
      : "Best for testing before a full wear";

  return {
    score,
    shared_notes: sharedNotes,
    matching_accords: matchingAccords,
    complementary_notes: complementaryNotes,
    potential_conflicts: conflicts,
    spray_order: sprayOrder,
    suggested_ratio: ratio,
    occasion,
    warning_notes: warnings,
  };
}

async function explainLayering(result, first, second) {
  const fallback = `${first.name} and ${second.name} score ${result.score}/10 based only on the available scent notes and accords. ${result.shared_notes.length ? `Shared notes: ${result.shared_notes.join(", ")}.` : "No shared notes were returned."} ${result.matching_accords.length ? `Matching accords: ${result.matching_accords.join(", ")}.` : "No matching accords were returned."}`;
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    return await callOpenAi(
      result,
      "/api/layering",
      "Explain this fragrance layering score in 2 concise sentences. Use only the supplied shared_notes, matching_accords, score, spray_order, and warning_notes. Do not add or infer any fragrance notes."
    ) || fallback;
  } catch (error) {
    logError("/api/layering", "OpenAI explanation failure", error);
    return fallback;
  }
}

async function handleScentAdvice(request, response) {
  const route = "/api/ai/scent-advice";
  try {
    const payload = await readBody(request);
    logRoute(route, "incoming body", payload);
    logRoute(route, "keys", keyState());
    const fragranceProfile = payload.fragranceProfile || {};
    const normalizedProfile = {
      name: toDisplayString(fragranceProfile.name),
      brand: toDisplayString(fragranceProfile.brand),
      notes: uniqueStrings(fragranceProfile.notes || []),
      accords: uniqueStrings(fragranceProfile.accords || []),
      top_notes: uniqueStrings(fragranceProfile.top_notes || []),
      middle_notes: uniqueStrings(fragranceProfile.middle_notes || []),
      base_notes: uniqueStrings(fragranceProfile.base_notes || []),
    };
    const noteDataLimited = !noteNames(normalizedProfile).length;
    const fallback = {
      summary: noteDataLimited
        ? "Note data is limited, so the advice is more general than usual."
        : `${fragranceLabel(normalizedProfile)} leans ${shortProfileDescription(normalizedProfile).toLowerCase()}.`,
      bestUseCases: noteDataLimited ? ["General wear"] : [payload.userGoal || "Signature wear", "Evening", "Testing on skin"],
      layeringTips: noteDataLimited
        ? ["Use a lighter companion scent and test on skin first."]
        : [`Pair with scents that support ${normalizedProfile.accords.slice(0, 2).join(" and ") || normalizedProfile.notes.slice(0, 2).join(" and ")}.`],
      warnings: noteDataLimited ? ["The note data is limited for this fragrance."] : [],
      confidence: noteDataLimited ? "medium" : "high",
    };
    const normalized = await callOpenAiJson(
      {
        fragranceProfile: normalizedProfile,
        userGoal: payload.userGoal || "",
        context: payload.context || "",
        noteDataLimited,
      },
      route,
      "You are Aromix AI, a fragrance advisor. Use ONLY the provided fragranceProfile data — never invent notes, accords, or descriptions. Write like a client-facing consultant: clear, specific, useful. Return JSON with fields: summary (2-3 sentences describing the scent character), bestUseCases (array of specific occasions/seasons), layeringTips (array of practical pairing ideas using real note families), warnings (array of watch-outs like projection, skin type, season), confidence (high|medium|low).",
      fallback
    );
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, {
      summary: "AI advice is unavailable right now.",
      bestUseCases: [],
      layeringTips: [],
      warnings: ["The AI advisor is temporarily unavailable."],
      confidence: "low",
    });
  }
}

async function handleLayering(request, response) {
  const route = "/api/layering";
  try {
    const payload = await readBody(request);
    logRoute(route, "incoming body", payload);
    logRoute(route, "keys", keyState());
    const firstQuery = validatedText(payload.fragranceA || payload.first || payload.fragranceOne || payload.fragOne, "fragranceA", 120);
    const secondQuery = validatedText(payload.fragranceB || payload.second || payload.fragranceTwo || payload.fragTwo, "fragranceB", 120);

    const normalized = await buildLayeringAnalysis(firstQuery, secondQuery, normalizeChatShelf(payload.shelf || []), route);
    if (normalized.found === false) {
      logRoute(route, "normalized response", normalized);
      sendJson(response, 404, normalized);
      return;
    }
    logRoute(route, "normalized response", normalized);
    sendJson(response, 200, normalized);
  } catch (error) {
    handleRouteError(route, response, error, { found: false });
  }
}

async function handleUsage(request, response) {
  if (!FRAGELLA_ENABLED || !process.env.FRAGELLA_API_KEY) {
    sendJson(response, 200, { configured: false });
    return;
  }

  try {
    const usage = await callFragella("usage");
    sendJson(response, 200, { configured: true, usage });
  } catch (error) {
    logError("/api/usage", "usage lookup failure", error);
    sendJson(response, 200, { configured: true });
  }
}

function handleBottleArt(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const name = (requestUrl.searchParams.get("name") || "Aromix").slice(0, 80);
  const tone = requestUrl.searchParams.get("tone") || "rose";
  response.writeHead(200, {
    ...secureHeaders(),
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  });
  response.end(bottleArt(name, tone));
}

async function handleStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const cleanPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(ROOT, cleanPath));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403, secureHeaders());
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, secureHeaders({ "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" }));
    response.end(file);
  } catch {
    response.writeHead(404, secureHeaders());
    response.end("Not found");
  }
}

function handleApiNotFound(request, response) {
  sendJson(response, 404, {
    error: true,
    message: "The requested API route does not exist.",
    code: "NOT_FOUND",
    path: new URL(request.url, `http://${request.headers.host}`).pathname,
  });
}

function clientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return request.socket.remoteAddress || "unknown";
}

function rateLimitKind(pathname) {
  if (["/api/chat", "/api/dupe-finder", "/api/layering", "/api/ai/scent-advice"].includes(pathname)) return "heavy";
  if (["/api/prices", "/api/search", "/api/fragrance", "/api/matches", "/api/notes", "/api/usage"].includes(pathname)) return "normal";
  return "";
}

function isRateLimited(request, response, pathname) {
  const kind = rateLimitKind(pathname);
  if (!kind) return false;
  const now = Date.now();
  const limit = RATE_LIMITS[kind];
  const key = `${kind}:${clientIp(request)}`;
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  if (bucket.count <= limit) return false;
  sendPublicError(response, 429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
  return true;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (pathname.startsWith("/debug/") && !DEBUG_API) {
    sendPublicError(response, 404, "DEBUG_DISABLED", "Debug routes are disabled.");
    return;
  }

  if (isRateLimited(request, response, pathname)) return;

  if (request.method === "POST" && pathname === "/api/ai/scent-advice") {
    handleScentAdvice(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/chat") {
    handleChat(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/dupe-finder") {
    handleDupeFinder(request, response);
    return;
  }

  if ((request.method === "GET" || request.method === "POST") && pathname === "/debug/chat-plan") {
    handleChatPlanDebug(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/debug/env") {
    handleEnvDebug(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    handleHealth(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/debug/rapidapi") {
    handleRapidApiDebug(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/debug/serpapi") {
    handleSerpApiDebug(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/prices") {
    handlePrices(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/fragrance") {
    handleFragrance(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/search") {
    handleSearch(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/matches") {
    handleFragellaMatches(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/layering") {
    handleLayering(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/notes") {
    handleFragellaNotes(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/usage") {
    handleUsage(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/bottle-art") {
    if (!DEV_MODE) {
      response.writeHead(404, secureHeaders());
      response.end("Not found");
      return;
    }
    handleBottleArt(request, response);
    return;
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/debug/")) {
    handleApiNotFound(request, response);
    return;
  }

  handleStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Aromix running at http://localhost:${PORT}`);
});
