const NOTE_LIBRARY = {
  top: [
    { id: "bergamot", label: "Bergamot", family: "citrus", mood: "bright", weight: 1 },
    { id: "lemon", label: "Lemon", family: "citrus", mood: "fresh", weight: 1 },
    { id: "grapefruit", label: "Grapefruit", family: "citrus", mood: "zesty", weight: 1 },
    { id: "mandarin", label: "Mandarin", family: "citrus", mood: "juicy", weight: 1 },
    { id: "neroli", label: "Neroli", family: "floral", mood: "sunlit", weight: 1 },
    { id: "marine", label: "Marine Accord", family: "aquatic", mood: "salty", weight: 1 },
    { id: "apple", label: "Green Apple", family: "fruity", mood: "crisp", weight: 1 },
    { id: "pear", label: "Pear", family: "fruity", mood: "soft", weight: 1 },
    { id: "pineapple", label: "Pineapple", family: "fruity", mood: "tropical", weight: 1 },
    { id: "mint", label: "Mint", family: "aromatic", mood: "cool", weight: 1 },
    { id: "sage", label: "Clary Sage", family: "aromatic", mood: "herbal", weight: 1 },
    { id: "pink-pepper", label: "Pink Pepper", family: "spicy", mood: "sparkling", weight: 1 },
    { id: "cardamom", label: "Cardamom", family: "spicy", mood: "smooth", weight: 1 },
    { id: "ginger", label: "Ginger", family: "spicy", mood: "zingy", weight: 1 },
  ],
  middle: [
    { id: "jasmine", label: "Jasmine", family: "floral", mood: "smooth", weight: 2 },
    { id: "rose", label: "Rose", family: "floral", mood: "romantic", weight: 2 },
    { id: "iris", label: "Iris", family: "powdery", mood: "elegant", weight: 2 },
    { id: "violet", label: "Violet", family: "powdery", mood: "soft", weight: 2 },
    { id: "orange-blossom", label: "Orange Blossom", family: "floral", mood: "glowing", weight: 2 },
    { id: "lavender", label: "Lavender", family: "aromatic", mood: "clean", weight: 2 },
    { id: "geranium", label: "Geranium", family: "green", mood: "crisp", weight: 2 },
    { id: "cinnamon", label: "Cinnamon", family: "spicy", mood: "warm", weight: 2 },
    { id: "nutmeg", label: "Nutmeg", family: "spicy", mood: "dry", weight: 2 },
    { id: "saffron", label: "Saffron", family: "spicy", mood: "luxury", weight: 2 },
    { id: "cacao", label: "Cacao", family: "sweet", mood: "dark", weight: 2 },
    { id: "praline", label: "Praline", family: "sweet", mood: "caramelized", weight: 2 },
    { id: "elemi", label: "Elemi", family: "resin", mood: "peppery", weight: 2 },
    { id: "tea", label: "Black Tea", family: "green", mood: "soft", weight: 2 },
    { id: "coffee", label: "Coffee", family: "roasted", mood: "deep", weight: 2 },
    { id: "incense", label: "Incense", family: "smoky", mood: "mysterious", weight: 2 },
  ],
  base: [
    { id: "vanilla", label: "Vanilla", family: "sweet", mood: "cozy", weight: 3 },
    { id: "tonka", label: "Tonka Bean", family: "sweet", mood: "creamy", weight: 3 },
    { id: "amber", label: "Amber", family: "resin", mood: "glowing", weight: 3 },
    { id: "sandalwood", label: "Sandalwood", family: "woody", mood: "creamy", weight: 3 },
    { id: "cedar", label: "Cedar", family: "woody", mood: "dry", weight: 3 },
    { id: "vetiver", label: "Vetiver", family: "woody", mood: "earthy", weight: 3 },
    { id: "patchouli", label: "Patchouli", family: "woody", mood: "rich", weight: 3 },
    { id: "guaiac", label: "Guaiac Wood", family: "woody", mood: "smoky", weight: 3 },
    { id: "musk", label: "Musk", family: "musk", mood: "skin-like", weight: 3 },
    { id: "ambroxan", label: "Ambroxan", family: "musk", mood: "radiant", weight: 3 },
    { id: "labdanum", label: "Labdanum", family: "resin", mood: "ambery", weight: 3 },
    { id: "oud", label: "Oud", family: "heavy", mood: "dark", weight: 3 },
    { id: "leather", label: "Leather", family: "heavy", mood: "bold", weight: 3 },
    { id: "tobacco", label: "Tobacco", family: "heavy", mood: "smoky", weight: 3 },
    { id: "oakmoss", label: "Oakmoss", family: "green", mood: "classic", weight: 3 },
  ],
};

const FRAGRANCES = [
  {
    name: "Dior Sauvage",
    brand: "Dior",
    aliases: ["sauvage", "dior sauvage edt", "dior sauvage edp"],
    category: "designer",
    notes: ["bergamot", "pink-pepper", "lavender", "ambroxan", "cedar", "musk"],
    vibe: "fresh spicy",
    retail: "$105-$145",
  },
  {
    name: "Bleu de Chanel EDP",
    brand: "Chanel",
    aliases: ["bleu de chanel", "blue de chanel", "bdc", "blue de chanel edp"],
    category: "designer",
    notes: ["grapefruit", "lemon", "mint", "pink-pepper", "ginger", "jasmine", "nutmeg", "incense", "vetiver", "cedar", "sandalwood", "patchouli", "labdanum", "musk"],
    vibe: "citrus aromatic woods",
    retail: "$130-$165",
  },
  {
    name: "Black Opium",
    brand: "YSL",
    aliases: ["ysl black opium"],
    category: "designer",
    notes: ["pink-pepper", "coffee", "jasmine", "vanilla", "patchouli"],
    vibe: "sweet night-out",
    retail: "$95-$155",
  },
  {
    name: "Santal 33",
    brand: "Le Labo",
    aliases: ["le labo santal 33"],
    category: "niche",
    notes: ["sandalwood", "cedar", "leather", "violet", "musk"],
    vibe: "dry woody",
    retail: "$230-$345",
  },
  {
    name: "Wood Sage & Sea Salt",
    brand: "Jo Malone",
    aliases: ["jo malone wood sage sea salt"],
    category: "designer",
    notes: ["sage", "marine", "grapefruit", "musk"],
    vibe: "airy casual",
    retail: "$86-$165",
  },
  {
    name: "Vanilla 28",
    brand: "Kayali",
    aliases: ["kayali vanilla 28"],
    category: "designer",
    notes: ["vanilla", "tonka", "amber", "jasmine", "musk"],
    vibe: "warm sweet",
    retail: "$95-$138",
  },
  {
    name: "Oud Wood",
    brand: "Tom Ford",
    aliases: ["tom ford oud wood"],
    category: "designer",
    notes: ["oud", "sandalwood", "cardamom", "pink-pepper", "vanilla"],
    vibe: "dark luxury",
    retail: "$195-$445",
  },
  {
    name: "Light Blue",
    brand: "Dolce & Gabbana",
    aliases: ["dolce gabbana light blue", "d&g light blue"],
    category: "designer",
    notes: ["lemon", "apple", "cedar", "musk"],
    vibe: "summer fresh",
    retail: "$65-$120",
  },
  {
    name: "Althair",
    brand: "Parfums de Marly",
    aliases: ["althair", "altair", "pdm althair", "pdm altair", "parfums de marly althair"],
    category: "niche",
    notes: ["orange-blossom", "bergamot", "cinnamon", "cardamom", "vanilla", "elemi", "praline", "ambroxan", "guaiac", "musk"],
    vibe: "luxury vanilla spice",
    retail: "$240-$365",
    dupes: ["Liquid Brun"],
  },
  {
    name: "Liquid Brun",
    brand: "French Avenue",
    aliases: ["french avenue liquid brun", "liquid brun", "liquid bruh"],
    category: "arabic",
    notes: ["orange-blossom", "bergamot", "cinnamon", "cardamom", "vanilla", "elemi", "praline", "ambroxan", "guaiac", "musk"],
    vibe: "Althair-style vanilla spice",
    retail: "$45-$65",
    dupeFor: "Althair",
  },
  {
    name: "Club de Nuit Intense Man",
    brand: "Armaf",
    aliases: ["club de nuit", "club de nuit intense", "cdnim", "armaf cdnim"],
    category: "arabic",
    notes: ["lemon", "pineapple", "bergamot", "rose", "jasmine", "musk", "patchouli", "vanilla"],
    vibe: "smoky citrus woods",
    retail: "$30-$55",
    dupeFor: "Aventus",
  },
  {
    name: "Aventus",
    brand: "Creed",
    aliases: ["creed aventus", "aventus"],
    category: "niche",
    notes: ["pineapple", "bergamot", "apple", "rose", "jasmine", "patchouli", "oakmoss", "musk", "vanilla"],
    vibe: "fruity smoky chypre",
    retail: "$365-$495",
    dupes: ["Club de Nuit Intense Man"],
  },
  {
    name: "Khamrah",
    brand: "Lattafa",
    aliases: ["lattafa khamrah", "khamrah"],
    category: "arabic",
    notes: ["cinnamon", "nutmeg", "praline", "vanilla", "tonka", "amber", "musk"],
    vibe: "sweet spicy gourmand",
    retail: "$28-$45",
  },
  {
    name: "9PM",
    brand: "Afnan",
    aliases: ["afnan 9pm", "9pm"],
    category: "arabic",
    notes: ["apple", "cinnamon", "lavender", "orange-blossom", "vanilla", "amber", "patchouli"],
    vibe: "sweet clubbing scent",
    retail: "$25-$45",
  },
  {
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    aliases: ["br540", "baccarat rouge", "baccarat rouge 540"],
    category: "niche",
    notes: ["saffron", "jasmine", "amber", "ambroxan", "cedar"],
    vibe: "airy amber saffron",
    retail: "$325-$475",
    dupes: ["Ana Abiyedh Rouge"],
  },
  {
    name: "Ana Abiyedh Rouge",
    brand: "Lattafa",
    aliases: ["ana abiyedh rouge", "lattafa ana abiyedh rouge"],
    category: "arabic",
    notes: ["saffron", "jasmine", "amber", "musk"],
    vibe: "affordable amber saffron",
    retail: "$18-$30",
    dupeFor: "Baccarat Rouge 540",
  },
  {
    name: "Layton",
    brand: "Parfums de Marly",
    aliases: ["pdm layton", "parfums de marly layton"],
    category: "niche",
    notes: ["apple", "lavender", "bergamot", "geranium", "violet", "vanilla", "cardamom", "sandalwood", "patchouli"],
    vibe: "apple vanilla spice",
    retail: "$220-$365",
  },
];

const SYNERGY = {
  citrus: ["aromatic", "woody", "musk", "floral"],
  fruity: ["floral", "sweet", "musk", "green"],
  aromatic: ["citrus", "woody", "spicy", "musk", "green"],
  spicy: ["sweet", "woody", "heavy", "floral", "aromatic"],
  floral: ["citrus", "fruity", "sweet", "musk", "woody", "spicy"],
  green: ["citrus", "aromatic", "floral", "musk"],
  aquatic: ["citrus", "aromatic", "musk", "woody"],
  powdery: ["floral", "musk", "sweet", "woody"],
  roasted: ["sweet", "spicy", "woody", "heavy"],
  smoky: ["woody", "resin", "heavy", "spicy"],
  resin: ["sweet", "woody", "spicy", "smoky", "heavy"],
  sweet: ["spicy", "woody", "floral", "heavy", "musk"],
  woody: ["citrus", "aromatic", "spicy", "sweet", "floral", "musk", "heavy"],
  musk: ["citrus", "floral", "woody", "sweet", "green", "fruity"],
  heavy: ["woody", "spicy", "sweet"],
};

const CLASHES = new Set([
  "citrus:heavy",
  "fruity:heavy",
  "green:heavy",
  "aquatic:heavy",
  "aquatic:roasted",
  "aquatic:smoky",
  "fresh:heavy",
  "aromatic:sweet",
]);

const FAMILY_COLORS = {
  citrus: "#e8b044",
  fruity: "#d96f7c",
  aromatic: "#76966a",
  spicy: "#b65f3c",
  floral: "#c6769a",
  green: "#6f8f62",
  aquatic: "#5f91a6",
  powdery: "#b7a1c7",
  roasted: "#6d4b39",
  smoky: "#5d5962",
  resin: "#b47b45",
  sweet: "#d8948d",
  woody: "#9a744f",
  musk: "#9aa0a6",
  heavy: "#4f4059",
};

const state = {
  selected: {
    top: new Set(),
    middle: new Set(),
    base: new Set(),
  },
  saved: JSON.parse(localStorage.getItem("aromixCollection") || "[]"),
  shelf: JSON.parse(localStorage.getItem("aromixShelf") || "[]"),
  shelfTagDraft: new Set(["Daily Wear"]),
  shelfFilter: "All",
  shelfSuggestions: [],
  shelfSuggestionRegistry: new Map(),
  shelfSearchTimer: null,
  searchSuggestions: [],
  noteSearchTimer: null,
  remoteSearchTimer: null,
  matchRequestId: 0,
  lastMatchKey: "",
  theme: localStorage.getItem("aromixTheme") || "light",
  chatHistory: JSON.parse(localStorage.getItem("aromixChatHistory") || "[]"),
  chatPending: false,
  chatCardRegistry: new Map(),
};

const fragranceApiCache = new Map();
const API_ORIGIN = window.location.protocol === "file:" ? "http://localhost:4173" : "";

const elements = {
  topNotes: document.querySelector("#topNotes"),
  middleNotes: document.querySelector("#middleNotes"),
  baseNotes: document.querySelector("#baseNotes"),
  noteSearch: document.querySelector("#noteSearch"),
  searchSuggestions: document.querySelector("#searchSuggestions"),
  scoreLabel: document.querySelector("#scoreLabel"),
  scoreNumber: document.querySelector("#scoreNumber"),
  profileTag: document.querySelector("#profileTag"),
  seasonTag: document.querySelector("#seasonTag"),
  priceSearchForm: document.querySelector("#priceSearchForm"),
  priceQuery: document.querySelector("#priceQuery"),
  priceStatus: document.querySelector("#priceStatus"),
  shoppingProfile: document.querySelector("#shoppingProfile"),
  priceResults: document.querySelector("#priceResults"),
  dupeForm: document.querySelector("#dupeForm"),
  dupeQuery: document.querySelector("#dupeQuery"),
  dupeStatus: document.querySelector("#dupeStatus"),
  dupeResults: document.querySelector("#dupeResults"),
  layerForm: document.querySelector("#layerForm"),
  fragOne: document.querySelector("#fragOne"),
  fragTwo: document.querySelector("#fragTwo"),
  layeringStatus: document.querySelector("#layeringStatus"),
  layerResult: document.querySelector("#layerResult"),
  shelfForm: document.querySelector("#shelfForm"),
  shelfName: document.querySelector("#shelfName"),
  shelfType: document.querySelector("#shelfType"),
  shelfSummary: document.querySelector("#shelfSummary"),
  shelfSuggestions: document.querySelector("#shelfSuggestions"),
  shelfTagOptions: document.querySelector("#shelfTagOptions"),
  shelfFilters: document.querySelector("#shelfFilters"),
  shelfOutfitButton: document.querySelector("#shelfOutfitButton"),
  shelfHint: document.querySelector("#shelfHint"),
  shelfGrid: document.querySelector("#shelfGrid"),
  descriptionText: document.querySelector("#descriptionText"),
  accordList: document.querySelector("#accordList"),
  vibeList: document.querySelector("#vibeList"),
  matches: document.querySelector("#matches"),
  matchCount: document.querySelector("#matchCount"),
  bottleFill: document.querySelector("#bottleFill"),
  topLiquid: document.querySelector("#topLiquid"),
  middleLiquid: document.querySelector("#middleLiquid"),
  baseLiquid: document.querySelector("#baseLiquid"),
  blendOrbit: document.querySelector("#blendOrbit"),
  heroBlendProfile: document.querySelector("#heroBlendProfile"),
  blendName: document.querySelector("#blendName"),
  heroBlendName: document.querySelector("#heroBlendName"),
  collection: document.querySelector("#collection"),
  saveForm: document.querySelector("#saveForm"),
  randomizeButton: document.querySelector("#randomizeButton"),
  clearButton: document.querySelector("#clearButton"),
  fragranceDialog: document.querySelector("#fragranceDialog"),
  fragranceDetail: document.querySelector("#fragranceDetail"),
  dialogClose: document.querySelector("#dialogClose"),
  systemStatus: document.querySelector("#systemStatus"),
  themeToggle: document.querySelector("#themeToggle"),
  toastRegion: document.querySelector("#toastRegion"),
  chatHistory: document.querySelector("#chatHistory"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  chatSend: document.querySelector("#chatSend"),
  clearChatButton: document.querySelector("#clearChatButton"),
  chatUseShelf: document.querySelector("#chatUseShelf"),
};

function allNotes() {
  return Object.values(NOTE_LIBRARY).flat();
}

function slug(value = "") {
  return String(value).trim().toLowerCase();
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => textValue(value)).filter(Boolean))];
}

function vibeTagsFromProfile(profile = {}) {
  const families = new Set([
    ...((profile.accords || []).map((accord) => slug(accord))),
    ...((profile.notes || []).map((note) => slug(note))),
  ]);
  const tags = [];
  if ([...families].some((value) => value.includes("fresh") || value.includes("citrus") || value.includes("aquatic"))) tags.push("Fresh");
  if ([...families].some((value) => value.includes("sweet") || value.includes("vanilla") || value.includes("amber"))) tags.push("Sweet");
  if ([...families].some((value) => value.includes("wood") || value.includes("cedar") || value.includes("sandal"))) tags.push("Woody");
  if ([...families].some((value) => value.includes("spicy") || value.includes("amber"))) tags.push("Date Night");
  if ([...families].some((value) => value.includes("clean") || value.includes("fresh") || value.includes("aquatic"))) tags.push("Daily Wear");
  if ([...families].some((value) => value.includes("summer") || value.includes("citrus") || value.includes("marine"))) tags.push("Summer");
  if ([...families].some((value) => value.includes("club") || value.includes("sweet") || value.includes("oud"))) tags.push("Clubbing");
  return uniqueStrings(tags);
}

function placeholderInitials(label = "Aromix") {
  return String(label || "Aromix")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["eau", "de", "the", "for", "men", "women"].includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "A";
}

function premiumPlaceholder(label = "Aromix") {
  const clean = textValue(label) || "Aromix";
  return `
    <div class="premium-placeholder">
      <span class="placeholder-cap" aria-hidden="true"></span>
      <span class="placeholder-bottle" aria-hidden="true">
        <strong>${escapeHtml(placeholderInitials(clean))}</strong>
      </span>
      <small>${escapeHtml(clean.slice(0, 34))}</small>
    </div>
  `;
}

function getSelectedNotes() {
  return Object.entries(state.selected).flatMap(([layer, ids]) =>
    [...ids].map((id) => ({ ...allNotes().find((note) => note.id === id), layer }))
  );
}

function renderNoteButtons() {
  const query = elements.noteSearch.value.trim().toLowerCase();
  Object.entries(NOTE_LIBRARY).forEach(([layer, notes]) => {
    const target = elements[`${layer}Notes`];
    const filteredNotes = query
      ? notes.filter(
          (note) =>
            note.label.toLowerCase().includes(query) ||
            note.family.toLowerCase().includes(query) ||
            note.mood.toLowerCase().includes(query)
        )
      : notes;
    target.innerHTML = filteredNotes.length
      ? filteredNotes
      .map(
        (note) => `
          <button class="chip" data-layer="${escapeHtml(layer)}" data-note="${escapeHtml(note.id)}" type="button">
            ${escapeHtml(note.label)}
          </button>
        `
      )
      .join("")
      : `<p class="empty-state compact">No ${escapeHtml(layer)} notes match locally. Try the broader suggestions below.</p>`;
  });
}

function toggleNote(layer, noteId) {
  const selectedLayer = state.selected[layer];
  if (selectedLayer.has(noteId)) {
    selectedLayer.delete(noteId);
  } else {
    selectedLayer.add(noteId);
  }
  render();
}

function scoreBlend(notes) {
  if (!notes.length) return 0;

  return scoreNoteSet(notes, {
    hasTop: state.selected.top.size > 0,
    hasMiddle: state.selected.middle.size > 0,
    hasBase: state.selected.base.size > 0,
  });
}

function scoreNoteSet(notes, structure = { hasTop: true, hasMiddle: true, hasBase: true }) {
  let score = 4.6;
  const families = notes.map((note) => note.family);
  const uniqueFamilies = new Set(families);

  score += Math.min(uniqueFamilies.size, 5) * 0.42;
  score += structure.hasTop && structure.hasMiddle && structure.hasBase ? 1.1 : -0.45;

  for (let i = 0; i < families.length; i += 1) {
    for (let j = i + 1; j < families.length; j += 1) {
      const first = families[i];
      const second = families[j];
      const clashKey = [first, second].sort().join(":");
      if (first === second) score += 0.18;
      if (SYNERGY[first]?.includes(second)) score += 0.32;
      if (CLASHES.has(clashKey)) score -= 0.72;
    }
  }

  const ids = new Set(notes.map((note) => note.id));
  if (ids.has("oud") && ids.has("lemon")) score -= 0.8;
  if (ids.has("vanilla") && ids.has("bergamot")) score += 0.7;
  if (ids.has("sandalwood") && ids.has("jasmine")) score += 0.55;
  if (ids.has("leather") && ids.has("rose")) score += 0.35;

  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
}

function scoreLabel(score) {
  if (score === 0) return "Pick notes";
  if (score >= 8.4) return "Elite blend";
  if (score >= 7) return "Strong combo";
  if (score >= 5.2) return "Interesting";
  return "Risky mix";
}

function getDominantFamilies(notes) {
  const totals = notes.reduce((acc, note) => {
    acc[note.family] = (acc[note.family] || 0) + note.weight;
    return acc;
  }, {});

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
}

function generateDescription(notes, score) {
  if (!notes.length) {
    return "Choose at least one top, middle, and base note to generate a profile.";
  }

  const top = notes.filter((note) => note.layer === "top").map((note) => note.label.toLowerCase());
  const middle = notes.filter((note) => note.layer === "middle").map((note) => note.label.toLowerCase());
  const base = notes.filter((note) => note.layer === "base").map((note) => note.label.toLowerCase());
  const scoreMood = score >= 8 ? "polished and wearable" : score >= 6 ? "creative with a few sharp edges" : "experimental and intense";

  return `A ${scoreMood} scent with ${joinList(top) || "a subtle"} opening, ${joinList(middle) || "a quiet"} heart, and ${joinList(base) || "a soft"} dry-down.`;
}

function joinList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function getVibes(notes, score) {
  const families = new Set(notes.map((note) => note.family));
  const vibes = [];

  if (families.has("citrus") || families.has("green")) vibes.push(["Fresh", "summer, daytime, easy reach"]);
  if (families.has("sweet") || families.has("spicy")) vibes.push(["Warm", "date night, fall, cozy rooms"]);
  if (families.has("heavy") || families.has("leather")) vibes.push(["Bold", "night out, cold weather, low sprays"]);
  if (families.has("musk") || families.has("aromatic")) vibes.push(["Clean", "office-safe, gym bag, everyday"]);
  if (score >= 8) vibes.push(["Signature", "balanced enough to wear often"]);
  if (score && score < 5.2) vibes.push(["Warning", "keep this one light or reformulate"]);

  return vibes.slice(0, 4);
}

function getSeason(notes) {
  const families = new Set(notes.map((note) => note.family));
  if (families.has("heavy") || families.has("sweet")) return "Cool weather";
  if (families.has("citrus") || families.has("green")) return "Warm weather";
  return "Any season";
}

function getMatches(notes) {
  if (!notes.length) return [];

  const selectedIds = new Set(notes.map((note) => note.id));
  return FRAGRANCES.map((fragrance) => {
    const overlap = fragrance.notes.filter((note) => selectedIds.has(note));
    const score = Math.round((overlap.length / Math.max(fragrance.notes.length, selectedIds.size, 1)) * 100);
    return { ...fragrance, overlap, score };
  })
    .filter((fragrance) => fragrance.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);
}

function findFragrance(query) {
  const normalized = query.trim().toLowerCase();
  const known = FRAGRANCES.find(
    (fragrance) =>
      fragrance.name.toLowerCase().includes(normalized) ||
      normalized.includes(fragrance.name.toLowerCase()) ||
      `${fragrance.brand} ${fragrance.name}`.toLowerCase().includes(normalized) ||
      fragrance.aliases?.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias))
  );

  if (known) return { ...known, isKnown: true };

  return {
    name: query.trim() || "Unknown fragrance",
    brand: "Unknown",
    category: "unknown",
    notes: [],
    vibe: "needs fragrance profile data",
    price: "live search",
    retail: "unknown",
    isKnown: false,
  };
}

function noteIdsToObjects(noteIds) {
  return [...new Set(noteIds)]
    .map((id) => allNotes().find((note) => note.id === id))
    .filter(Boolean);
}

function colorForNotes(notes, fallback = "#d78b2d") {
  if (!notes.length) return fallback;
  const dominant = getDominantFamilies(notes)[0]?.[0];
  return FAMILY_COLORS[dominant] || fallback;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function textValue(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return String(value.name || value.Name || value.title || value.label || value.value || "").trim();
  }
  return "";
}

function noteList(profile) {
  return [...(profile.notes || []), ...(profile.top_notes || []), ...(profile.middle_notes || []), ...(profile.base_notes || [])]
    .map((note) => textValue(note.name || note))
    .filter(Boolean);
}

function safeUrl(url) {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function safeImageUrl(url) {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return "";
  if (/^data:image\/(svg\+xml|png|jpe?g|gif|webp);base64,/i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("/api/")) return API_ORIGIN ? `${API_ORIGIN}${rawUrl}` : rawUrl;
  return safeUrl(rawUrl);
}

function imageStyle(url) {
  const imageUrl = safeImageUrl(url).replace(/['\\]/g, "\\$&");
  return imageUrl ? `background-image: url('${imageUrl}')` : "";
}

function apiUrl(path) {
  return `${API_ORIGIN}${path}`;
}

function showToast(message, tone = "info") {
  if (!elements.toastRegion) return;
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.setAttribute("role", tone === "error" ? "alert" : "status");
  toast.textContent = message;
  elements.toastRegion.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3600);
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("aromixTheme", state.theme);
  if (elements.themeToggle) {
    elements.themeToggle.textContent = state.theme === "dark" ? "Light" : "Dark";
    elements.themeToggle.setAttribute("aria-pressed", String(state.theme === "dark"));
  }
}

function setButtonLoading(button, isLoading, label = "Working") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

async function apiFetchJson(path, options = {}, timeoutMs = 22000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl(path), { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.message || data.warning || `Request failed with ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkSystemHealth() {
  if (!elements.systemStatus) return;
  try {
    const health = await apiFetchJson("/api/health", {}, 6000);
    const ready = health.fragranceData && health.shoppingData && health.ai;
    elements.systemStatus.textContent = ready ? "Live data ready" : "Partial data";
    elements.systemStatus.classList.toggle("is-ready", ready);
    elements.systemStatus.title = [
      health.fragranceData ? "Fragrance profiles connected" : "Fragrance profiles need setup",
      health.shoppingData ? "Shopping connected" : "Shopping needs setup",
      health.ai ? "AI connected" : "AI needs setup",
    ].join(" · ");
  } catch {
    elements.systemStatus.textContent = "Server offline";
    elements.systemStatus.classList.remove("is-ready");
  }
}

function persistChatHistory() {
  state.chatHistory = state.chatHistory.slice(-10);
  localStorage.setItem("aromixChatHistory", JSON.stringify(state.chatHistory));
}

function chatWelcomeMessage() {
  return {
    id: "welcome",
    role: "assistant",
    content: "I am Aromix AI. Ask me what to buy, wear, layer, or avoid, and I will use scent profiles, live shopping, your shelf, and the layering engine before answering.",
    data: {
      confidence: "high",
      followUps: ["Find me a sweet winter cologne under $80", "Can I layer Sauvage with Vanilla 28?", "What is missing from my shelf?"],
    },
  };
}

function renderChat() {
  if (!elements.chatHistory) return;
  state.chatCardRegistry.clear();
  const messages = [chatWelcomeMessage(), ...state.chatHistory];
  elements.chatHistory.innerHTML = messages
    .map((message) => renderChatMessage(message))
    .join("") + (state.chatPending ? renderTypingBubble() : "");
  elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

function renderChatMessage(message) {
  const isUser = message.role === "user";
  return `
    <article class="chat-message ${isUser ? "user" : "assistant"}">
      <div class="message-avatar" aria-hidden="true">${isUser ? "You" : "AI"}</div>
      <div class="message-bubble">
        <p>${escapeHtml(message.content || "")}</p>
        ${!isUser && message.data ? renderChatStructuredData(message.data, message.id) : ""}
      </div>
    </article>
  `;
}

function renderTypingBubble() {
  return `
    <article class="chat-message assistant">
      <div class="message-avatar" aria-hidden="true">AI</div>
      <div class="message-bubble typing-bubble">
        <span></span><span></span><span></span>
      </div>
    </article>
  `;
}

function renderChatStructuredData(data, messageId) {
  return `
    ${data.confidence ? `<span class="confidence-pill">${escapeHtml(data.confidence)} confidence</span>` : ""}
    ${renderLayeringChatCard(data.layeringAnalysis)}
    ${renderRecommendationCards(data.recommendations || [], messageId)}
    ${renderShoppingCards(data.shoppingResults || [])}
    ${renderShelfInsights(data.shelfInsights || [])}
    ${renderFollowUps(data.followUps || [])}
  `;
}

function renderRecommendationCards(recommendations = [], messageId = "") {
  if (!recommendations.length) return "";
  return `
    <section class="chat-result-section">
      <h4>Best picks</h4>
      <div class="chat-card-grid">
        ${recommendations.slice(0, 5).map((item, index) => {
          const registryKey = `${messageId}-${index}`;
          state.chatCardRegistry.set(registryKey, item);
          const title = [textValue(item.brand), textValue(item.name)].filter(Boolean).join(" ");
          const shoppingLink = safeUrl(item.shoppingLink);
          return `
            <article class="chat-fragrance-card">
              ${imageBlock("chat-card-image", item.image_url || item.image, item.name)}
              <div>
                <h5>${escapeHtml(title || item.name || "Fragrance")}</h5>
                <div class="card-badge-row">
                  ${item.matchScore ? `<span class="meta-pill">${escapeHtml(`${item.matchScore}% match`)}</span>` : ""}
                  ${item.confidence ? `<span class="meta-pill">${escapeHtml(`${item.confidence} confidence`)}</span>` : ""}
                  ${item.verdict ? `<span class="meta-pill">${escapeHtml(item.verdict)}</span>` : ""}
                </div>
                <p>${escapeHtml(item.whyItFits || item.matchReason || item.shortDescription || "Recommended by Aromix AI")}</p>
                <p>${escapeHtml(uniqueStrings(item.notes || []).slice(0, 4).join(", ") || "Note data is limited")}</p>
                ${item.bestFor ? `<p><strong>Best for:</strong> ${escapeHtml(item.bestFor)}</p>` : ""}
                ${item.watchOut ? `<p><strong>Watch out:</strong> ${escapeHtml(item.watchOut)}</p>` : ""}
                ${item.bestPrice ? `<p><strong>Live price:</strong> ${escapeHtml([item.bestPrice, item.bestStore].filter(Boolean).join(" at "))}</p>` : ""}
                <div class="chat-card-actions">
                  <button class="ghost-button chat-add-shelf" type="button" data-chat-add-shelf="${escapeHtml(registryKey)}">Add to Shelf</button>
                  ${shoppingLink ? `<a href="${escapeHtml(shoppingLink)}" target="_blank" rel="noopener noreferrer">Shop ${escapeHtml(item.bestPrice || "")}</a>` : ""}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderShoppingCards(results = []) {
  if (!results.length) return "";
  return `
    <section class="chat-result-section">
      <h4>Live shopping</h4>
      <div class="chat-shopping-row">
        ${results.slice(0, 4).map((item) => {
          const link = safeUrl(item.link);
          return link ? `
          <a class="chat-shop-card" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">
            ${imageBlock("chat-shop-image", item.thumbnail, item.title)}
            <strong>${escapeHtml(item.title || "Shopping result")}</strong>
            <span>${escapeHtml([item.store || item.source, item.price].filter(Boolean).join(" · ") || "Check store")}</span>
          </a>
        ` : "";
        }).join("")}
      </div>
    </section>
  `;
}

function renderLayeringChatCard(layering) {
  if (!layering) return "";
  return `
    <section class="chat-result-section">
      <h4>Layering analysis</h4>
      <div class="chat-layer-card">
        <strong>${escapeHtml(layering.score || "?")}/10 compatibility</strong>
        ${layering.verdict ? `<p>Verdict: ${escapeHtml(layering.verdict)}${layering.confidence ? ` · ${escapeHtml(layering.confidence)} confidence` : ""}.</p>` : ""}
        <p>Shared notes: ${escapeHtml((layering.sharedNotes || layering.shared_notes || []).join(", ") || "none returned")}.</p>
        <p>Best order: ${escapeHtml(layering.sprayOrder || layering.spray_order || "test lightly on skin")}.</p>
        <p>Watch out: ${escapeHtml(layering.warning || (layering.warning_notes || []).join(" ") || "No major watch-outs returned.")}</p>
      </div>
    </section>
  `;
}

function renderShelfInsights(insights = []) {
  if (!insights.length) return "";
  return `
    <section class="chat-result-section">
      <h4>Shelf insight</h4>
      <div class="shelf-insight-list">
        ${insights.slice(0, 5).map((insight) => `
          <div class="shelf-insight">
            <strong>${escapeHtml(textValue(insight.title || insight))}</strong>
            <span>${escapeHtml(textValue(insight.reason || insight.description || ""))}</span>
            ${insight.examples?.length ? `<small>Try: ${escapeHtml(insight.examples.join(", "))}</small>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderFollowUps(followUps = []) {
  if (!followUps.length) return "";
  return `
    <div class="chat-followups">
      ${followUps.slice(0, 5).map((followUp) => `
        <button class="followup-chip" type="button" data-prompt="${escapeHtml(textValue(followUp))}">${escapeHtml(textValue(followUp))}</button>
      `).join("")}
    </div>
  `;
}

function selectedNotesForChat() {
  return getSelectedNotes().map(({ id, label, family, layer }) => ({ id, label, family, layer }));
}

async function sendChatMessage(message) {
  const content = textValue(message || elements.chatInput?.value);
  if (!content || state.chatPending) return;

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
  state.chatHistory.push(userMessage);
  persistChatHistory();
  if (elements.chatInput) elements.chatInput.value = "";
  state.chatPending = true;
  setButtonLoading(elements.chatSend, true, "Thinking");
  renderChat();

  try {
    const data = await apiFetchJson("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        shelf: elements.chatUseShelf?.checked ? state.shelf : [],
        selectedNotes: selectedNotesForChat(),
        context: {
          blendScore: scoreBlend(getSelectedNotes()),
          blendName: elements.blendName?.value || "",
          chatHistory: state.chatHistory.slice(-10).map(({ role, content }) => ({ role, content })),
        },
      }),
    }, 52000);
    state.chatHistory.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.answer || "I found a result, but the explanation came back limited.",
      data,
      createdAt: new Date().toISOString(),
    });
    showToast("Aromix AI response ready.", "success");
  } catch (error) {
    state.chatHistory.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: error.message || "Aromix AI is unavailable right now.",
      data: {
        confidence: "low",
        followUps: ["Try a simpler fragrance name", "Ask for a broader recommendation"],
      },
      createdAt: new Date().toISOString(),
    });
    showToast("Aromix AI is unavailable right now.", "error");
  } finally {
    state.chatPending = false;
    setButtonLoading(elements.chatSend, false);
    persistChatHistory();
    renderChat();
  }
}

function shelfItemFromProfile(profile = {}, status = "Want", fallbackName = "") {
  const name = textValue(profile.name);
  const safeName = name || textValue(fallbackName) || "Untitled fragrance";
  return {
    id: crypto.randomUUID(),
    name: safeName,
    brand: textValue(profile.brand),
    status,
    notes: [],
    notesPreview: uniqueStrings(profile.notes || []),
    tags: uniqueStrings([
      ...(profile.tags || []),
      ...(profile.categoryLabel || profile.category ? [profile.categoryLabel || profile.category] : []),
      ...(profile.vibe ? String(profile.vibe).split(/\s+/).filter(Boolean) : []),
      ...vibeTagsFromProfile(profile),
    ]).slice(0, 8),
    image: profile.image_url || profile.image || "",
    confidence: profile.confidence || "low",
    profile: {
      ...profile,
      name: safeName,
      image_url: profile.image_url || profile.image || "",
    },
  };
}

function addProfileToShelf(profile = {}, status = "Want", fallbackName = "") {
  const item = shelfItemFromProfile(profile, status, fallbackName);
  if (!item.name) return;
  state.shelf = [item, ...state.shelf].slice(0, 18);
  persistShelf();
  renderShelf();
  showToast(`${item.name} added to My Shelf.`, "success");
}

function imageBlock(className, url, label = "") {
  return url
    ? `<div class="${className}" style="${imageStyle(url)}"></div>`
    : `<div class="${className} no-image">${premiumPlaceholder(label || "Aromix bottle")}</div>`;
}

function getLayerNotes(notes, layer) {
  return notes.filter((note) => note.layer === layer);
}

function renderScore(score) {
  elements.scoreNumber.textContent = score;
  elements.scoreLabel.textContent = scoreLabel(score);
  document.documentElement.style.setProperty("--score-progress", `${score * 10}%`);
  elements.bottleFill.style.height = `${24 + score * 6}%`;
}

function renderBlendVisual(notes, score) {
  const top = getLayerNotes(notes, "top");
  const middle = getLayerNotes(notes, "middle");
  const base = getLayerNotes(notes, "base");
  const topColor = colorForNotes(top, "#e8b044");
  const middleColor = colorForNotes(middle, "#c6769a");
  const baseColor = colorForNotes(base, "#4f4059");

  elements.topLiquid.style.background = `linear-gradient(180deg, ${topColor}, transparent)`;
  elements.middleLiquid.style.background = `linear-gradient(180deg, ${middleColor}, ${baseColor})`;
  elements.baseLiquid.style.background = `linear-gradient(180deg, ${baseColor}, #2d2830)`;
  elements.bottleFill.style.opacity = notes.length ? "0" : "1";
  elements.bottleFill.style.background = "linear-gradient(180deg, rgba(215, 139, 45, 0.58), rgba(183, 93, 105, 0.74))";

  document.documentElement.style.setProperty("--mist-a", topColor);
  document.documentElement.style.setProperty("--mist-b", middleColor);
  document.documentElement.style.setProperty("--mist-c", baseColor);

  elements.blendOrbit.innerHTML = notes.length
    ? notes
        .slice(0, 8)
        .map((note, index) => {
          const angle = index * (360 / Math.min(notes.length, 8));
          return `<span class="orbit-note" style="--angle:${angle}deg; --note-color:${FAMILY_COLORS[note.family] || "#d78b2d"}">${escapeHtml(note.label)}</span>`;
        })
        .join("")
    : `<span class="orbit-note empty-orbit">Build</span>`;

  const profile = getDominantFamilies(notes)
    .slice(0, 3)
    .map(([family]) => family)
    .join(" / ");
  elements.heroBlendProfile.textContent = profile ? `${score}/10 · ${profile}` : "No notes selected yet";
}

function renderAccords(notes) {
  const accords = getDominantFamilies(notes);
  elements.accordList.innerHTML = accords.length
    ? accords
        .map(([family, value]) => `<div class="accord"><strong>${escapeHtml(family)}</strong><span>${escapeHtml(value)} intensity</span></div>`)
        .join("")
    : "";
}

function renderVibes(notes, score) {
  const vibes = getVibes(notes, score);
  elements.vibeList.innerHTML = vibes.length
    ? vibes.map(([name, detail]) => `<div class="vibe"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(detail)}</span></div>`).join("")
    : `<p class="empty-state">Your vibe meter will appear after you select notes.</p>`;
}

async function fetchFragranceApi(name) {
  if (fragranceApiCache.has(name)) return fragranceApiCache.get(name);

  try {
    const response = await fetch(apiUrl(`/api/fragrance?query=${encodeURIComponent(name)}`));
    const data = await response.json();
    if (!response.ok) {
      const missing = { ...data, found: false, name };
      fragranceApiCache.set(name, missing);
      return missing;
    }
    fragranceApiCache.set(name, data);
    return data;
  } catch {
    const missing = { found: false, name, image_url: "", image: "", offers: [], notes: [] };
    fragranceApiCache.set(name, missing);
    return missing;
  }
}

async function renderMatches(notes) {
  const matchKey = notes.map((note) => note.id).sort().join("|");
  if (state.lastMatchKey === matchKey && elements.matches.dataset.loadedKey === matchKey) return;
  state.lastMatchKey = matchKey;
  const requestId = (state.matchRequestId += 1);

  if (!notes.length) {
    elements.matchCount.textContent = "0 matches";
    elements.matches.dataset.loadedKey = matchKey;
    elements.matches.innerHTML = `<p class="empty-state">Build a scent to see fragrance matches.</p>`;
    return;
  }

  elements.matchCount.textContent = "Searching";
  elements.matches.innerHTML = `
    <div class="skeleton-grid" aria-label="Loading fragrance discovery">
      <span></span><span></span><span></span>
    </div>
  `;
  const apiMatches = await fetchApiMatches(notes);
  if (requestId !== state.matchRequestId) return;
  if (apiMatches.length) {
    renderApiMatches(apiMatches);
    elements.matches.dataset.loadedKey = matchKey;
    return;
  }

  const matches = getMatches(notes);
  elements.matchCount.textContent = `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
  if (!matches.length) {
    elements.matches.innerHTML = `<p class="empty-state">Build a scent to see fragrance matches.</p>`;
    elements.matches.dataset.loadedKey = matchKey;
    return;
  }

  elements.matches.innerHTML = `<p class="empty-state">Loading images, retail, and live offer data...</p>`;
  const hydrated = await Promise.all(matches.map(async (match) => ({ ...match, api: await fetchFragranceApi(match.name) })));
  if (requestId !== state.matchRequestId) return;
  const groups = ["designer", "arabic", "niche"];
  elements.matches.innerHTML = groups
    .map((group) => {
      const groupMatches = hydrated.filter((match) => match.category === group);
      if (!groupMatches.length) return "";
      return `
        <div class="match-group">
          <h4>${group}</h4>
          <div class="match-row">
            ${groupMatches
              .map((match) => {
                return `
                  <button class="match match-card-button" type="button" data-fragrance="${escapeHtml(match.name)}">
                    ${imageBlock("match-image", match.api.image_url || match.api.image)}
                    <h4>${escapeHtml(textValue(match.api.name) || match.name)}</h4>
                    <p>${escapeHtml(textValue(match.api.brand) || match.brand)} · ${escapeHtml(match.vibe)}</p>
                    <p>${match.api.found === false ? "Try the full brand + fragrance name." : "Scent Profile loaded"}</p>
                    <p>Shared notes: ${match.overlap.map(formatNoteName).map(escapeHtml).join(", ")}</p>
                    <span class="match-score">${escapeHtml(match.score)}% profile match</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
  elements.matches.dataset.loadedKey = matchKey;
}

async function fetchApiMatches(notes) {
  if (!notes.length) return [];

  const noteQuery = notes
    .slice(0, 6)
    .map((note) => note.label)
    .join(" ");

  try {
    const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(noteQuery)}`));
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function renderApiMatches(matches) {
  const groups = ["Designer", "Niche", "Arabic / Middle Eastern", "Affordable", "Luxury"];
  const grouped = groups
    .map((group) => ({
      group,
      items: matches.filter((match) => (match.categoryLabel || "Luxury") === group),
    }))
    .filter((entry) => entry.items.length);

  elements.matchCount.textContent = `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
  if (!grouped.length) {
    elements.matches.innerHTML = `<p class="empty-state">No strong cologne matches found. Try a broader note like spice, amber, vanilla, or tobacco.</p>`;
    return;
  }

  elements.matches.innerHTML = grouped
    .map(
      ({ group, items }) => `
        <div class="match-group">
          <h4>${escapeHtml(group)}</h4>
          <div class="match-row">
            ${items
              .map((match) => {
                const lookup = `${match.brand ? `${match.brand} ` : ""}${match.name}`.trim();
                return `
                  <button class="match match-card-button" type="button" data-fragrance="${escapeHtml(lookup)}">
                    ${imageBlock("match-image", match.image_url, match.name)}
                    <div class="match-card-meta">
                      <span class="meta-pill">${escapeHtml(match.categoryLabel || group)}</span>
                    </div>
                    <h4>${escapeHtml(textValue(match.name))}</h4>
                    <p>${escapeHtml(textValue(match.brand) || "Fragrance profile")}</p>
                    <p>${escapeHtml(match.shortDescription || "Scent Profile")}</p>
                    <span class="match-score">${escapeHtml(match.matchReason || "Matched for discovery")}</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
}

async function searchAllFragranceData(query) {
  if (!query || query.length < 2) {
    state.searchSuggestions = [];
    renderSearchSuggestions();
    return;
  }

  try {
    const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
    if (!response.ok) return;
    const data = await response.json();
    state.searchSuggestions = (data.results || []).slice(0, 6);
    elements.noteSearch.title = data.message || "";
    renderSearchSuggestions();
  } catch {
    state.searchSuggestions = [];
    renderSearchSuggestions();
  }
}

function localSuggestions(query) {
  const normalized = slug(query);
  if (!normalized) return [];
  const noteSuggestions = allNotes()
    .filter((note) =>
      slug(note.label).includes(normalized) ||
      slug(note.family).includes(normalized) ||
      slug(note.mood).includes(normalized)
    )
    .slice(0, 5)
    .map((note) => ({ type: "note", label: note.label, detail: `${note.family} note`, query: note.label }));
  const fragranceSuggestions = FRAGRANCES
    .filter((fragrance) =>
      slug(`${fragrance.brand} ${fragrance.name} ${fragrance.vibe}`).includes(normalized)
    )
    .slice(0, 5)
    .map((fragrance) => ({
      type: "fragrance",
      label: fragrance.name,
      detail: fragrance.brand,
      query: `${fragrance.brand} ${fragrance.name}`,
    }));
  return [...noteSuggestions, ...fragranceSuggestions].slice(0, 7);
}

function renderSearchSuggestions() {
  const local = localSuggestions(elements.noteSearch.value);
  const remote = (state.searchSuggestions || []).map((item) => ({
    type: "search",
    label: item.name,
    detail: [item.brand, item.matchReason].filter(Boolean).join(" · ") || "Fragrance suggestion",
    query: `${item.brand ? `${item.brand} ` : ""}${item.name}`.trim(),
  }));
  const suggestions = [...local, ...remote].filter(
    (item, index, array) => array.findIndex((entry) => slug(entry.label) === slug(item.label) && slug(entry.detail) === slug(item.detail)) === index
  );

  elements.searchSuggestions.innerHTML = suggestions.length
    ? suggestions
        .map(
          (item) => `
            <button class="suggestion-chip" type="button" data-query="${escapeHtml(item.query)}" data-kind="${escapeHtml(item.type)}">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </button>
          `
        )
        .join("")
    : "";
}

function groupNotesByLayer(noteIds) {
  return ["top", "middle", "base"].map((layer) => ({
    layer,
    notes: noteIdsToObjects(noteIds).filter((note) => NOTE_LIBRARY[layer].some((libraryNote) => libraryNote.id === note.id)),
  }));
}

function renderNotePyramid(fragrance) {
  return groupNotesByLayer(fragrance.notes)
    .map(
      ({ layer, notes }) => `
        <div class="note-pyramid-row">
          <h5>${escapeHtml(layer)}</h5>
          <div class="note-badges">
            ${
              notes.length
                ? notes
                    .map(
                      (note) => `
                        <span class="note-badge" style="--note-color:${FAMILY_COLORS[note.family] || "#d78b2d"}">
                          ${escapeHtml(note.label)}
                          <small>${escapeHtml(note.family)}</small>
                        </span>
                      `
                    )
                    .join("")
                : `<span class="empty-state compact">No verified ${escapeHtml(layer)} notes stored.</span>`
            }
          </div>
        </div>
      `
    )
    .join("");
}

function renderApiNotePyramid(notesByLayer) {
  if (!notesByLayer) return "";
  const hasLayerNotes = ["top", "middle", "base"].some((layer) => (notesByLayer[layer] || []).length);
  if (!hasLayerNotes) return "";

  return ["top", "middle", "base"]
    .map((layer) => {
      const notes = notesByLayer[layer] || [];
      if (!notes.length) return "";
      return `
        <div class="note-pyramid-row">
          <h5>${layer}</h5>
          <div class="note-badges">
            ${notes
              .map((note) => {
                const noteName = note.name || note;
                return `
                  <span class="note-badge api-note ${note.imageUrl ? "note-card" : ""}">
                    ${note.imageUrl ? `<span class="note-image" style="${imageStyle(note.imageUrl)}"></span>` : ""}
                    ${escapeHtml(noteName)}
                  </span>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderGeneralNotes(notes = []) {
  const normalized = notes.map((note) => textValue(note.name || note)).filter(Boolean);
  if (!normalized.length) return "";
  return `
    <div class="note-pyramid-row">
      <h5>Notes</h5>
      <div class="note-badges">
        ${normalized.map((note) => `<span class="note-badge api-note">${escapeHtml(note)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderAccordBars(accords = [], accordPercentages = {}) {
  if (!accords.length) return "";

  const widths = ["100%", "84%", "70%", "58%", "50%", "44%"];
  return `
    <div class="accord-bars">
      <h4>Main Accords</h4>
      ${accords
        .slice(0, 6)
        .map((accord, index) => {
          const accordName = textValue(accord);
          const strength = accordPercentages[accordName] || accordPercentages[accordName.toLowerCase()] || "";
          return `
            <div class="accord-bar" style="--bar-width:${widths[index] || "40%"}; --bar-color:${FAMILY_COLORS[accordName.toLowerCase()] || "#738b62"}">
              <span>${escapeHtml(accordName)}</span>
              ${strength ? `<small>${escapeHtml(strength)}</small>` : ""}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

async function openFragranceDetail(name) {
  const api = await fetchFragranceApi(name);
  if (api.found === false) {
    elements.fragranceDetail.innerHTML = `
      <div class="layer-result-card">
        <h4>${api.message === "Fragrance lookup failed." ? "Fragrance lookup failed" : "Fragrance not found"}</h4>
        <p>${escapeHtml(api.message || `${name} was not found. Choose another result.`)}</p>
      </div>
    `;
    elements.fragranceDialog.showModal();
    return;
  }

  const notePyramid = renderApiNotePyramid(api.notesByLayer);
  const generalNotes = renderGeneralNotes(api.notes || []);
  let scentAdvice = null;
  try {
    const adviceResponse = await fetch(apiUrl("/api/ai/scent-advice"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fragranceProfile: api,
        userGoal: "Describe the scent clearly for a client-facing fragrance profile.",
        context: "Use sections for what it smells like, best for, layering ideas, and watch out.",
      }),
    });
    if (adviceResponse.ok) scentAdvice = await adviceResponse.json();
  } catch {
    scentAdvice = null;
  }
  elements.fragranceDetail.innerHTML = `
    <div class="detail-hero">
      ${imageBlock("detail-image", api.image_url || api.image, api.name || name)}
      <div>
        <p class="eyebrow">Scent Profile</p>
        <h3>${escapeHtml(textValue(api.name))}</h3>
        <p>${escapeHtml(textValue(api.brand) || "Fragrance house")}</p>
        <p>${escapeHtml((api.accords || []).map(textValue).filter(Boolean).slice(0, 5).join(", ") || "No accords returned")}</p>
        <p>${[
          textValue(api.year) ? `Released ${textValue(api.year)}` : "",
          api.rating ? `${api.rating} rating` : "",
          api.reviewCount ? `${api.reviewCount} reviews` : "",
          textValue(api.longevity),
          textValue(api.sillage),
        ].filter(Boolean).map(escapeHtml).join(" · ")}</p>
      </div>
    </div>
    <div class="note-pyramid">
      ${renderAccordBars(api.accords, api.accordPercentages).replace("Main Accords", "Accords")}
      ${notePyramid}
      ${generalNotes}
      ${(!notePyramid && !generalNotes) ? `<p class="empty-state">Notes are limited for this fragrance.</p>` : ""}
      ${
        scentAdvice
          ? `
            <div class="detail-ai">
              <div class="detail-ai-card">
                <h4>What it smells like</h4>
                <p>${escapeHtml(scentAdvice.summary || "Profile guidance is limited right now.")}</p>
              </div>
              <div class="detail-ai-card">
                <h4>Best for</h4>
                <p>${escapeHtml((scentAdvice.bestUseCases || []).join(", ") || "Everyday wear")}</p>
              </div>
              <div class="detail-ai-card">
                <h4>Layering ideas</h4>
                <p>${escapeHtml((scentAdvice.layeringTips || []).join(", ") || "Keep the pairing simple and test on skin.")}</p>
              </div>
              <div class="detail-ai-card">
                <h4>Watch out</h4>
                <p>${escapeHtml((scentAdvice.warnings || []).join(", ") || "No major watch-outs returned.")}</p>
              </div>
            </div>
          `
          : ""
      }
    </div>
  `;
  elements.fragranceDialog.showModal();
}

async function searchPrices(event) {
  event.preventDefault();
  const query = elements.priceQuery.value.trim();
  if (!query) return;

  setButtonLoading(event.submitter, true, "Searching");
  elements.priceStatus.textContent = "Searching";
  elements.priceResults.innerHTML = `
    <div class="skeleton-grid shopping-skeleton" aria-label="Loading shopping results">
      <span></span><span></span><span></span>
    </div>
  `;

  try {
    const [fragranceResponse, priceResponse] = await Promise.all([
      fetch(apiUrl(`/api/fragrance?query=${encodeURIComponent(query)}`)),
      fetch(apiUrl(`/api/prices?query=${encodeURIComponent(query)}`)),
    ]);
    const priceData = priceResponse.ok
      ? await priceResponse.json()
      : { query, results: [], warning: "No verified fragrance shopping results found" };
    const fragranceData = fragranceResponse.ok ? await fragranceResponse.json() : null;
    renderShoppingResults(priceData, fragranceData);
    showToast(priceData.results?.length ? "Verified fragrance shopping updated." : "No verified fragrance shopping results found.", priceData.results?.length ? "success" : "info");
  } catch {
    elements.priceStatus.textContent = "No verified results";
    elements.shoppingProfile.innerHTML = "";
    elements.priceResults.innerHTML = `<p class="empty-state">No verified fragrance shopping results found.</p>`;
    showToast("No verified fragrance shopping results found.", "error");
  } finally {
    setButtonLoading(event.submitter, false);
  }
}

function renderShoppingResults(data, fragrance) {
  const results = data.results || [];
  elements.priceStatus.textContent = results.length ? "Verified" : "No verified results";
  elements.shoppingProfile.innerHTML = fragrance?.found !== false && fragrance
    ? `
        <div class="shopping-summary">
          ${imageBlock("shopping-summary-image", fragrance.image_url || fragrance.image, fragrance.name || data.query)}
          <div>
            <h4>${escapeHtml(textValue(fragrance.brand) ? `${textValue(fragrance.brand)} ${textValue(fragrance.name)}` : textValue(fragrance.name) || data.query)}</h4>
            <p>${escapeHtml((fragrance.accords || []).map(textValue).filter(Boolean).slice(0, 5).join(", ") || textValue(fragrance.longevity) || "No accords returned")}</p>
            <p>${escapeHtml(`Verified fragrance shopping for ${data.query || fragrance.name}.`)}</p>
          </div>
        </div>
      `
    : "";
  elements.priceResults.innerHTML = results.length
    ? results
        .map(
          (item) => {
            const link = safeUrl(item.link);
            return `
            <div class="price-card">
              ${imageBlock("price-image", item.thumbnail)}
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.store || item.source || "Seller")}${item.rating ? ` · ${escapeHtml(`${item.rating} stars`)}` : ""}${item.reviews ? ` · ${escapeHtml(`${item.reviews} reviews`)}` : ""}</p>
              <span class="price-pill">${escapeHtml(item.price || (item.extracted_price ? `$${item.extracted_price}` : "Check store"))}</span>
              ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Buy now</a>` : ""}
            </div>
          `;
          }
        )
        .join("")
    : `<p class="empty-state">No verified fragrance shopping results found.</p>`;
}

async function findDupes(event) {
  event.preventDefault();
  const query = elements.dupeQuery.value.trim();
  if (!query) return;

  setButtonLoading(event.submitter, true, "Searching");
  elements.dupeStatus.textContent = "Searching";
  elements.dupeResults.innerHTML = `<p class="empty-state">Searching for closest alternatives...</p>`;

  try {
    const response = await fetch(apiUrl("/api/dupe-finder"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceName: query, shelf: state.shelf }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Dupe lookup failed");
    elements.dupeStatus.textContent = data.dupes?.length ? `${data.dupes.length} alternatives` : "No strong match";
    const target = data.target || {};
    elements.dupeResults.innerHTML = data.dupes?.length
      ? `
        <div class="dupe-hero">
          <div class="dupe-card original">
            ${imageBlock("match-image", target.image_url || target.image, target.name || query)}
            <h4>${escapeHtml([target.brand, target.name || query].filter(Boolean).join(" "))}</h4>
            <p>${escapeHtml(uniqueStrings(target.notes || []).slice(0, 5).join(", ") || "Reference scent profile")}</p>
            <p>${escapeHtml(data.reasoningSummary || data.message || "")}</p>
          </div>
          ${data.dupes.map((dupe) => {
            const buyLink = safeUrl(dupe.buyLink);
            return `
            <div class="dupe-card">
              ${imageBlock("match-image", dupe.image_url || dupe.image, dupe.name)}
              <h4>${escapeHtml([dupe.brand, dupe.name].filter(Boolean).join(" "))}</h4>
              <p>${escapeHtml(dupe.whySimilar || "Closest verified alternative.")}</p>
              <p>${escapeHtml(dupe.differences || "")}</p>
              <p>${escapeHtml(uniqueStrings(dupe.notes || []).slice(0, 5).join(", ") || "Note data is limited")}</p>
              ${dupe.price ? `<span class="price-pill">${escapeHtml(dupe.price)}</span>` : ""}
              <span class="match-score">${escapeHtml(dupe.similarityScore || "?")}% similarity · ${escapeHtml(dupe.confidence || "medium")} confidence</span>
              ${buyLink ? `<a href="${escapeHtml(buyLink)}" target="_blank" rel="noopener noreferrer">Shop</a>` : ""}
            </div>
          `;
          }).join("")}
        </div>
      `
      : `<p class="empty-state">${escapeHtml(data.message || "I could not verify a strong dupe, but try a broader fragrance name.")}</p>`;
    showToast("Dupe alternatives ready.", "success");
  } catch (error) {
    elements.dupeStatus.textContent = "Unavailable";
    elements.dupeResults.innerHTML = `<p class="empty-state">${escapeHtml(error.message || "Dupe Finder is unavailable right now.")}</p>`;
    showToast("Dupe Finder is unavailable right now.", "error");
  } finally {
    setButtonLoading(event.submitter, false);
  }
}

async function scoreLayerForm(event) {
  event.preventDefault();
  const first = elements.fragOne.value.trim();
  const second = elements.fragTwo.value.trim();
  if (!first || !second) return;

  setButtonLoading(event.submitter, true, "Scoring");
  elements.layeringStatus.textContent = "Looking up";
  elements.layerResult.innerHTML = `<p class="empty-state">Fetching fragrance profiles for ${escapeHtml(first)} and ${escapeHtml(second)}...</p>`;

  try {
    const response = await fetch(apiUrl("/api/layering"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceA: first, fragranceB: second, shelf: state.shelf }),
    });
    const result = await response.json();

    if (!response.ok || result.found === false) {
      elements.layeringStatus.textContent = result.message === "Layering lookup failed." ? "Unavailable" : "Not found";
      elements.layerResult.innerHTML = `
        <div class="layer-result-card">
          <h4>${result.message === "Layering lookup failed." ? "Layering lookup failed" : "Need a clearer fragrance"}</h4>
          <p>${escapeHtml(result.message || `${result.missing?.join(" and ") || "One fragrance"} was not found. Choose another result.`)}</p>
        </div>
      `;
      showToast(result.message || "Layering needs clearer fragrance names.", "error");
      return;
    }

    elements.layeringStatus.textContent = `${result.score}/10`;
    elements.layerResult.innerHTML = `
      <div class="layer-result-card">
        <h4>${escapeHtml(result.fragranceA?.name || result.first?.name || first)} + ${escapeHtml(result.fragranceB?.name || result.second?.name || second)}</h4>
        <p>Compatibility score: ${escapeHtml(result.score)}/10 · ${escapeHtml(result.verdict || "Layering verdict")} · ${escapeHtml(result.confidence || "medium")} confidence.</p>
        <p>Shared notes: ${(result.sharedNotes || result.shared_notes || []).length ? (result.sharedNotes || result.shared_notes).map(escapeHtml).join(", ") : "none returned"}.</p>
        <p>Complementary notes: ${(result.complementaryNotes || result.complementary_notes || []).length ? (result.complementaryNotes || result.complementary_notes).map(escapeHtml).join(", ") : "none called out"}.</p>
        <p>Potential conflicts: ${(result.conflicts || result.potential_conflicts || []).length ? (result.conflicts || result.potential_conflicts).map(escapeHtml).join(", ") : "none major"}.</p>
        <p>Best spray order: ${escapeHtml(result.sprayOrder || result.spray_order)}.</p>
        <p>Suggested ratio: ${escapeHtml(result.ratio || result.suggested_ratio || "1:1")} · Occasion: ${escapeHtml(result.bestOccasion || result.occasion || "Flexible testing")}</p>
        <p>Warning: ${escapeHtml(result.warning || (result.warning_notes || []).join("; ") || "none")}</p>
        <p>${escapeHtml(result.explanation || "")}</p>
        <span class="match-score">${escapeHtml(result.score)}/10 compatibility</span>
      </div>
    `;
    showToast("Layering analysis ready.", "success");
  } catch {
    elements.layeringStatus.textContent = "Unavailable";
    elements.layerResult.innerHTML = `<p class="empty-state">Layering lookup failed.</p>`;
    showToast("Layering analysis is unavailable right now.", "error");
  } finally {
    setButtonLoading(event.submitter, false);
  }
}

function formatNoteName(noteId) {
  return allNotes().find((note) => note.id === noteId)?.label || noteId;
}

function renderCollection() {
  elements.collection.innerHTML = state.saved.length
    ? state.saved
        .map(
          (blend) => `
            <div class="saved-blend">
              <h4>${escapeHtml(blend.name)}</h4>
              <p>${escapeHtml(blend.score)}/10 · ${escapeHtml(blend.notes.map(formatNoteName).join(", "))}</p>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Saved blends will show up here.</p>`;
}

function persistShelf() {
  const safe = state.shelf.map((item) => ({
    ...item,
    image: typeof item.image === "string" && item.image.startsWith("data:") ? "" : (item.image || ""),
    profile: item.profile ? {
      ...item.profile,
      image_url: typeof item.profile.image_url === "string" && item.profile.image_url.startsWith("data:") ? "" : (item.profile.image_url || ""),
      image: typeof item.profile.image === "string" && item.profile.image.startsWith("data:") ? "" : (item.profile.image || ""),
    } : item.profile,
  }));
  try {
    localStorage.setItem("aromixShelf", JSON.stringify(safe));
  } catch {
    const trimmed = safe.slice(0, 10);
    try { localStorage.setItem("aromixShelf", JSON.stringify(trimmed)); } catch {}
  }
}

function filteredShelf() {
  return state.shelf.filter((item) => state.shelfFilter === "All" || (item.status || item.type || "Owned") === state.shelfFilter);
}

function clearShelfSuggestions() {
  state.shelfSuggestions = [];
  state.shelfSuggestionRegistry.clear();
  if (elements.shelfSuggestions) elements.shelfSuggestions.innerHTML = "";
}

function renderShelfSuggestions(message = "") {
  if (!elements.shelfSuggestions) return;
  state.shelfSuggestionRegistry.clear();
  if (message && !state.shelfSuggestions.length) {
    elements.shelfSuggestions.innerHTML = `<p class="empty-state compact">${escapeHtml(message)}</p>`;
    return;
  }
  elements.shelfSuggestions.innerHTML = state.shelfSuggestions.length
    ? `
      <p class="empty-state compact">Choose the closest match:</p>
      ${state.shelfSuggestions.slice(0, 5).map((profile, index) => {
        const key = `shelf-suggestion-${index}`;
        state.shelfSuggestionRegistry.set(key, profile);
        const title = [textValue(profile.brand), textValue(profile.name)].filter(Boolean).join(" ");
        return `
          <button class="shelf-suggestion-card" type="button" data-shelf-suggestion="${escapeHtml(key)}">
            ${imageBlock("shelf-suggestion-image", profile.image_url || profile.image, profile.name)}
            <span class="shelf-suggestion-copy">
              <strong>${escapeHtml(title || profile.name || "Fragrance")}</strong>
              <span>${escapeHtml(uniqueStrings(profile.notes || []).slice(0, 4).join(", ") || profile.matchReason || "Scent profile")}</span>
            </span>
            <small>${escapeHtml(profile.confidence || "medium")} confidence</small>
          </button>
        `;
      }).join("")}
      <button class="ghost-button shelf-add-anyway" type="button" data-shelf-add-anyway="true">Add anyway</button>
    `
    : "";
}

async function fetchShelfSuggestions(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    clearShelfSuggestions();
    return;
  }
  try {
    const data = await apiFetchJson(`/api/search?q=${encodeURIComponent(trimmed)}`, {}, 12000);
    state.shelfSuggestions = (data.results || []).slice(0, 5);
    renderShelfSuggestions();
  } catch {
    state.shelfSuggestions = [];
    renderShelfSuggestions();
  }
}

function renderShelf() {
  const shelfItems = filteredShelf();
  elements.shelfSummary.textContent = `${state.shelf.length} saved`;
  elements.shelfGrid.innerHTML = shelfItems.length
    ? shelfItems
        .map(
          (item) => `
            <div class="shelf-card">
              <div class="shelf-bottle-wrap">
                ${imageBlock("shelf-art", item.image, item.name)}
              </div>
              <div class="shelf-copy">
                <div class="shelf-card-top">
                  <div>
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${escapeHtml(item.brand || item.vibe || "Fragrance profile")}</p>
                  </div>
                  <span class="shelf-pill">${escapeHtml(item.status || item.type || "Owned")}</span>
                </div>
                <p>${escapeHtml(uniqueStrings(item.notesPreview || item.notes || []).slice(0, 4).join(", ") || "Notes are still limited for this bottle.")}</p>
                <div class="shelf-meta-tags">
                  ${(item.tags || []).map((tag) => `<span class="meta-pill">${escapeHtml(tag)}</span>`).join("")}
                </div>
                <div class="shelf-card-actions">
                  <button class="ghost-button shelf-action" type="button" data-shelf-open="${item.id}">Open</button>
                  <button class="ghost-button shelf-action" type="button" data-shelf-edit="${item.id}">Edit</button>
                  <button class="ghost-button shelf-action" type="button" data-shelf-remove="${item.id}">Remove</button>
                </div>
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Add bottles you own, want, or sampled to start building your shelf.</p>`;
}

async function addShelfItem(event) {
  event.preventDefault();
  const name = elements.shelfName.value.trim();
  if (!name) return;

  setButtonLoading(event.submitter, true, "Adding");
  const status = elements.shelfType.value;
  elements.shelfGrid.innerHTML = `<p class="empty-state">Finding fragrance profile for ${escapeHtml(name)}...</p>`;
  clearShelfSuggestions();

  let profile = null;
  try {
    profile = await fetchFragranceApi(name);
  } catch {
    profile = null;
  }

  if (profile?.found !== false && textValue(profile?.name)) {
    const enrichedProfile = {
      ...profile,
      tags: uniqueStrings([...state.shelfTagDraft, ...(profile.tags || [])]),
    };
    addProfileToShelf(enrichedProfile, status, name);
    elements.shelfName.value = "";
    elements.shelfHint.textContent = profile.image_url || profile.image
      ? "Bottle saved with trusted imagery and note data."
      : "Bottle saved with a polished placeholder until a trusted image is available.";
    clearShelfSuggestions();
    setButtonLoading(event.submitter, false);
    return;
  }

  try {
    const searchData = await apiFetchJson(`/api/search?q=${encodeURIComponent(name)}`, {}, 12000);
    state.shelfSuggestions = (searchData.results || []).slice(0, 5);
    if (state.shelfSuggestions.length) {
      elements.shelfHint.textContent = "I found a few close matches. Choose one, or add your typed name manually.";
      renderShelfSuggestions();
      renderShelf();
      showToast("Choose the closest shelf match.", "info");
      setButtonLoading(event.submitter, false);
      return;
    }
  } catch {
    state.shelfSuggestions = [];
  }

  addManualShelfItem(name, status);
  setButtonLoading(event.submitter, false);
}

function addManualShelfItem(name, status = "Want") {
  const profile = {
    found: false,
    name,
    brand: "",
    notes: [],
    tags: [...state.shelfTagDraft],
    image_url: "",
    image: "",
    confidence: "low",
    message: "Manual shelf entry",
  };
  addProfileToShelf(profile, status, name);
  elements.shelfName.value = "";
  elements.shelfHint.textContent = "Bottle saved manually. A polished placeholder is showing because no verified profile was found.";
  clearShelfSuggestions();
}

function removeShelfItem(id) {
  const removed = state.shelf.find((item) => item.id === id);
  state.shelf = state.shelf.filter((item) => item.id !== id);
  persistShelf();
  renderShelf();
  showToast(`${removed?.name || "Bottle"} removed from My Shelf.`, "info");
}

function editShelfItem(id) {
  const item = state.shelf.find((entry) => entry.id === id);
  if (!item) return;
  const currentStatus = item.status || item.type || "Owned";
  const nextStatus = currentStatus === "Owned" ? "Want" : currentStatus === "Want" ? "Sampled" : "Owned";
  item.status = nextStatus;
  delete item.type;
  persistShelf();
  renderShelf();
  showToast(`${item.name} moved to ${nextStatus}.`, "success");
}

async function buildOutfitScent() {
  if (!state.shelf.length) {
    elements.shelfHint.textContent = "Add at least one bottle to your shelf first.";
    showToast("Add a bottle to My Shelf first.", "info");
    return;
  }

  const owned = state.shelf.filter((item) => item.status === "Owned").slice(0, 6);
  const payload = {
    fragranceProfile: {
      name: "My Shelf",
      brand: "",
      notes: owned.flatMap((item) => item.notesPreview || []).slice(0, 18),
      accords: owned.flatMap((item) => item.tags || []).slice(0, 12),
    },
    userGoal: "Recommend the best bottle from my shelf for a polished evening outfit.",
    context: owned.map((item) => ({
      name: item.name,
      brand: item.brand,
      notes: item.notesPreview,
      tags: item.tags,
      status: item.status,
    })),
  };

  elements.shelfHint.textContent = "Reviewing your shelf for the best outfit scent...";
  try {
    const response = await fetch(apiUrl("/api/ai/scent-advice"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    elements.shelfHint.textContent = data.summary || "Your shelf recommendation is ready.";
    showToast("Outfit scent recommendation ready.", "success");
  } catch {
    elements.shelfHint.textContent = "AI advice is unavailable right now. Try again in a moment.";
    showToast("AI shelf advice is unavailable right now.", "error");
  }
}

function saveBlend(event) {
  event.preventDefault();
  const notes = getSelectedNotes();
  if (!notes.length) return;

  const name = elements.blendName.value.trim() || "Untitled blend";
  const blend = {
    id: crypto.randomUUID(),
    name,
    score: scoreBlend(notes),
    notes: notes.map((note) => note.id),
  };

  state.saved = [blend, ...state.saved].slice(0, 6);
  localStorage.setItem("aromixCollection", JSON.stringify(state.saved));
  elements.blendName.value = "";
  render();
  showToast(`${name} saved to your local collection.`, "success");
}

function randomizeBlend() {
  Object.keys(state.selected).forEach((layer) => state.selected[layer].clear());
  Object.entries(NOTE_LIBRARY).forEach(([layer, notes]) => {
    const shuffled = [...notes].sort(() => Math.random() - 0.5);
    shuffled.slice(0, layer === "base" ? 2 : 1).forEach((note) => state.selected[layer].add(note.id));
  });
  render();
}

function clearBlend() {
  Object.values(state.selected).forEach((layer) => layer.clear());
  render();
}

function updateActiveButtons() {
  document.querySelectorAll(".chip").forEach((button) => {
    button.classList.toggle("active", state.selected[button.dataset.layer].has(button.dataset.note));
  });
}

function render() {
  const notes = getSelectedNotes();
  const score = scoreBlend(notes);
  const name = elements.blendName.value.trim() || "Untitled blend";

  updateActiveButtons();
  renderScore(score);
  renderBlendVisual(notes, score);
  renderAccords(notes);
  renderVibes(notes, score);
  renderMatches(notes);
  renderCollection();
  renderShelf();

  elements.descriptionText.textContent = generateDescription(notes, score);
  elements.profileTag.textContent = notes.length ? getDominantFamilies(notes)[0]?.[0] || "Balanced" : "Waiting";
  elements.seasonTag.textContent = getSeason(notes);
  elements.heroBlendName.textContent = name;
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  const match = event.target.closest(".match-card-button");
  const suggestion = event.target.closest(".suggestion-chip");
  const shelfTag = event.target.closest(".tag-chip");
  const shelfFilter = event.target.closest(".filter-pill");
  const shelfRemove = event.target.closest("[data-shelf-remove]");
  const shelfEdit = event.target.closest("[data-shelf-edit]");
  const shelfOpen = event.target.closest("[data-shelf-open]");
  const shelfSuggestion = event.target.closest("[data-shelf-suggestion]");
  const shelfAddAnyway = event.target.closest("[data-shelf-add-anyway]");
  const quickCard = event.target.closest(".quick-card");
  const promptChip = event.target.closest(".prompt-chip, .followup-chip");
  const chatAddShelf = event.target.closest("[data-chat-add-shelf]");

  if (chip) {
    toggleNote(chip.dataset.layer, chip.dataset.note);
    return;
  }

  if (promptChip) {
    sendChatMessage(promptChip.dataset.prompt);
    return;
  }

  if (chatAddShelf) {
    const profile = state.chatCardRegistry.get(chatAddShelf.dataset.chatAddShelf);
    if (profile) addProfileToShelf(profile);
    return;
  }

  if (suggestion) {
    const query = suggestion.dataset.query;
    elements.noteSearch.value = query;
    renderNoteButtons();
    renderSearchSuggestions();
    const exactNote = allNotes().find((note) => slug(note.label) === slug(query));
    if (exactNote) {
      const layer = Object.entries(NOTE_LIBRARY).find(([, notes]) => notes.some((note) => note.id === exactNote.id))?.[0];
      if (layer) toggleNote(layer, exactNote.id);
      return;
    }
    openFragranceDetail(query);
    return;
  }

  if (match) {
    openFragranceDetail(match.dataset.fragrance);
    return;
  }

  if (shelfTag) {
    const tag = shelfTag.dataset.tag;
    if (state.shelfTagDraft.has(tag)) {
      state.shelfTagDraft.delete(tag);
    } else {
      state.shelfTagDraft.add(tag);
    }
    shelfTag.classList.toggle("active", state.shelfTagDraft.has(tag));
    return;
  }

  if (shelfFilter) {
    state.shelfFilter = shelfFilter.dataset.filter;
    elements.shelfFilters.querySelectorAll(".filter-pill").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === state.shelfFilter);
    });
    renderShelf();
    return;
  }

  if (shelfSuggestion) {
    const profile = state.shelfSuggestionRegistry.get(shelfSuggestion.dataset.shelfSuggestion);
    if (profile) {
      addProfileToShelf({ ...profile, tags: [...state.shelfTagDraft] }, elements.shelfType.value, elements.shelfName.value);
      elements.shelfName.value = "";
      elements.shelfHint.textContent = "Bottle saved from the closest verified match.";
      clearShelfSuggestions();
    }
    return;
  }

  if (shelfAddAnyway) {
    const name = elements.shelfName.value.trim();
    if (name) addManualShelfItem(name, elements.shelfType.value);
    return;
  }

  if (shelfRemove) {
    removeShelfItem(shelfRemove.dataset.shelfRemove);
    return;
  }

  if (shelfEdit) {
    editShelfItem(shelfEdit.dataset.shelfEdit);
    return;
  }

  if (shelfOpen) {
    const item = state.shelf.find((entry) => entry.id === shelfOpen.dataset.shelfOpen);
    if (item) openFragranceDetail(`${item.brand ? `${item.brand} ` : ""}${item.name}`.trim());
    return;
  }

  if (quickCard) {
    const targetId = quickCard.dataset.jump;
    if (quickCard.dataset.query) {
      elements.noteSearch.value = quickCard.dataset.query;
      renderNoteButtons();
      renderSearchSuggestions();
      searchAllFragranceData(quickCard.dataset.query);
    }
    const focusTarget = quickCard.dataset.focus ? document.querySelector(`#${quickCard.dataset.focus}`) : null;
    const jumpTarget = targetId ? document.querySelector(`#${targetId}`) : focusTarget;
    jumpTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
    focusTarget?.focus({ preventScroll: true });
  }
});

function on(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
}

on(elements.saveForm, "submit", saveBlend);
on(elements.randomizeButton, "click", randomizeBlend);
on(elements.clearButton, "click", clearBlend);
on(elements.blendName, "input", render);
on(elements.noteSearch, "input", () => {
  const query = elements.noteSearch.value.trim();
  renderNoteButtons();
  updateActiveButtons();
  clearTimeout(state.noteSearchTimer);
  renderSearchSuggestions();
  clearTimeout(state.remoteSearchTimer);
  state.remoteSearchTimer = setTimeout(() => searchAllFragranceData(query), 300);
});
on(elements.priceSearchForm, "submit", searchPrices);
on(elements.dupeForm, "submit", findDupes);
on(elements.layerForm, "submit", scoreLayerForm);
on(elements.shelfForm, "submit", addShelfItem);
on(elements.shelfName, "input", () => {
  const query = elements.shelfName.value.trim();
  clearTimeout(state.shelfSearchTimer);
  state.shelfSearchTimer = setTimeout(() => fetchShelfSuggestions(query), 300);
});
on(elements.shelfOutfitButton, "click", buildOutfitScent);
on(elements.dialogClose, "click", () => elements.fragranceDialog?.close());
on(elements.themeToggle, "click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
on(elements.chatForm, "submit", (event) => {
  event.preventDefault();
  sendChatMessage();
});
on(elements.clearChatButton, "click", () => {
  state.chatHistory = [];
  persistChatHistory();
  renderChat();
  showToast("Chat cleared.", "info");
});
on(elements.chatUseShelf, "change", () => {
  showToast(elements.chatUseShelf.checked ? "Aromix AI will use My Shelf." : "Aromix AI will ignore My Shelf.", "info");
});

setTheme(state.theme);
checkSystemHealth();
renderNoteButtons();
renderSearchSuggestions();
renderChat();
render();
