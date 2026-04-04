/**
 * Food / order intent for Phase 1 (keyword + phrased heuristic).
 * Designed for Hinglish; reduces obvious false positives with exclude-only-greeting heuristic.
 */

const PHRASES: RegExp[] = [
  /\b(bhej|bhejo|bhejna|bhej do)\b/i,
  /\bkitna\s+time\b/i,
  /\bavailable\s+hai\b/i,
  /\b(ek|do|teen|char|paanch|chhe|saat|aath|nau|das)\s+plate\b/i,
  /\bplate\b.*\b(bhej|order|chahiye)\b/i,
  /\border\b.*\b(bhej|lag|do)\b/i,
  /\bchahiye\b/i,
  /\b(aaj|kal)\b.*\b(lunch|dinner|tiffin|khana|thali)\b/i,
];

const KEYWORDS = [
  "thali",
  "tiffin",
  "lunch",
  "dinner",
  "breakfast",
  "paneer",
  "roti",
  "chawal",
  "rice",
  "daal",
  "dal",
  "sabzi",
  "curry",
  "biryani",
  "paratha",
  "rajma",
  "khana",
  "food",
  "dabba",
  "pack",
  "delivery",
  "menu",
  "usual",
  "order",
] as const;

const keywordPattern = new RegExp(
  KEYWORDS.map((k) => `\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).join("|"),
  "i",
);

/** e.g. "2 x paneer", "2×chole" */
const qtyItemPattern = /\d+\s*(x|×|\*)\s*\S+/i;

/** Pure acknowledgements — block unless stronger food cue also present */
const greetingOnlyPattern =
  /^(hi|hello|hey|namaste|thanks|thank you|ok|okay|theek|thik|haan|ha|nahi|no)\.?$/i;

function phraseMatch(normalized: string): boolean {
  return PHRASES.some((p) => p.test(normalized));
}

export function hasFoodOrOrderIntent(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  const normalized = text.toLowerCase().trim();
  if (greetingOnlyPattern.test(normalized)) return false;
  if (qtyItemPattern.test(normalized)) return true;
  if (phraseMatch(normalized)) return true;
  return keywordPattern.test(normalized);
}
