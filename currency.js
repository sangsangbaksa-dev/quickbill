// ISO 4217 minor units (decimal places) for currency amounts.
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);
const THREE_DECIMAL = new Set(["BHD", "KWD", "JOD", "OMR", "TND"]);

export function minorUnits(code) {
  if (typeof code !== "string") return 2;
  const c = code.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return 0;
  if (THREE_DECIMAL.has(c)) return 3;
  return 2;
}

// Rounds half away from zero to the currency's minor units (same EPSILON nudge as round2 in logic.js).
export function roundMoney(n, code) {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** minorUnits(code);
  const sign = n < 0 ? -1 : 1;
  const r = Math.round((Math.abs(n) + Number.EPSILON) * f) / f;
  return sign * r + 0; // + 0 turns -0 into 0
}

export function formatMinor(n, code, locale = "en-US") {
  const c = String(code ?? "").toUpperCase();
  const d = minorUnits(c);
  const value = roundMoney(n, c);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: c,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(value);
  } catch {
    return `${c} ${value.toFixed(d)}`;
  }
}
