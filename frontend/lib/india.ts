// ─────────────────────────────────────────────────────
//  India Locale Utilities  (IST · INR · Indian numbers)
// ─────────────────────────────────────────────────────

/** Format currency in Indian Rupees */
export const formatINR = (amount: number, decimals = 2): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

/** Format a plain number in Indian system (1,00,000 etc.) */
export const formatIndian = (n: number): string =>
  new Intl.NumberFormat("en-IN").format(n);

/** Format paise (1/100 of INR) */
export const formatPaise = (paise: number): string =>
  paise < 100
    ? `₹${paise.toFixed(2)} paise`
    : formatINR(paise / 100);

/** Format date in IST (Indian Standard Time) */
export const formatIST = (
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: "Asia/Kolkata",
  }
): string => new Intl.DateTimeFormat("en-IN", opts).format(new Date(date));

/** Format date only in IST */
export const formatDateIST = (date: string | Date): string =>
  formatIST(date, { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Format time only in IST */
export const formatTimeIST = (date: string | Date): string =>
  formatIST(date, { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

/** Convert a number to Indian short form: 1L, 2.5L, 1Cr */
export const toIndianShort = (n: number): string => {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (n >= 1_000)      return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
};

/** India +91 phone formatter */
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("91") && clean.length === 12)
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  if (clean.length === 10)
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  return phone;
};

/** IST timezone offset label */
export const IST_LABEL = "IST (UTC+5:30)";

/** India WhatsApp languages (prioritised for Indian market) */
export const INDIA_LANGUAGES = [
  { code: "hi",    label: "हिंदी (Hindi)" },
  { code: "en",    label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "ta",    label: "தமிழ் (Tamil)" },
  { code: "te",    label: "తెలుగు (Telugu)" },
  { code: "mr",    label: "मराठी (Marathi)" },
  { code: "gu",    label: "ગુજરાતી (Gujarati)" },
  { code: "bn",    label: "বাংলা (Bengali)" },
  { code: "kn",    label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml",    label: "മലയാളം (Malayalam)" },
  { code: "pa",    label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ur",    label: "اردو (Urdu)" },
  { code: "ar",    label: "Arabic" },
  { code: "pt_BR", label: "Portuguese (BR)" },
];

/** India rupee cost per WhatsApp message category (Effective Jan 1, 2026) */
export const MSG_COST_INR = {
  MARKETING:      0.86,   // ₹0.86 per marketing message
  UTILITY:        0.15,   // ₹0.145 -> ₹0.15 rounded
  AUTHENTICATION: 0.15,   // ₹0.145 -> ₹0.15 rounded
  SERVICE:        0.00,   // Free
};
