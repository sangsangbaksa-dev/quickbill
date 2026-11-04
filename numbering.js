// Custom invoice number patterns.
// Tokens: {YYYY} year (4 digits), {YY} year (2 digits), {MM} month (2 digits),
// {N...} sequence, zero-padded to the number of N characters. Any other text is literal.
// Only the first N token is the sequence; later N runs are kept as literal text.

const TOKEN = /\{(YYYY|YY|MM|N+)\}/g;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "YYYY-MM-DD" -> { YYYY, YY, MM } as strings; anything invalid gives empty strings.
function dateParts(date) {
  const empty = { YYYY: "", YY: "", MM: "" };
  const m = typeof date === "string" ? DATE.exec(date) : null;
  if (!m) return empty;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return empty;
  return { YYYY: m[1], YY: m[1].slice(2), MM: m[2] };
}

// Splits a pattern into literal and token parts.
function tokenize(pattern) {
  const parts = [];
  let last = 0;
  let seqSeen = false;
  for (const m of pattern.matchAll(TOKEN)) {
    if (m.index > last) parts.push({ literal: pattern.slice(last, m.index) });
    const name = m[1];
    if (name[0] === "N" && !seqSeen) {
      seqSeen = true;
      parts.push({ seq: true, width: name.length });
    } else if (name[0] === "N") {
      parts.push({ literal: m[0] });
    } else {
      parts.push({ field: name });
    }
    last = m.index + m[0].length;
  }
  if (last < pattern.length) parts.push({ literal: pattern.slice(last) });
  return parts;
}

export function formatNumber(pattern, seq, date) {
  if (typeof pattern !== "string") return "";
  const dp = dateParts(date);
  return tokenize(pattern)
    .map((p) => {
      if (p.seq) return String(seq).padStart(p.width, "0");
      if (p.field) return dp[p.field];
      return p.literal;
    })
    .join("");
}

// Builds an anchored regex for a pattern. Capture groups: the sequence (if any), then each date field in order.
function compile(pattern) {
  const fields = [];
  let seqGroup = -1;
  let groups = 0;
  const src = tokenize(pattern)
    .map((p) => {
      if (p.seq) {
        seqGroup = ++groups;
        return "(\\d+)";
      }
      if (p.field) {
        fields.push({ name: p.field, group: ++groups });
        return p.field === "YYYY" ? "(\\d{4})" : "(\\d{2})";
      }
      return escapeRe(p.literal);
    })
    .join("");
  return { re: new RegExp(`^${src}$`), seqGroup, fields };
}

function matchNumber(pattern, number) {
  if (typeof pattern !== "string" || typeof number !== "string") return null;
  const c = compile(pattern);
  const m = c.re.exec(number);
  if (!m) return null;
  return {
    seq: c.seqGroup > 0 ? Number(m[c.seqGroup]) : null,
    fields: Object.fromEntries(c.fields.map((f) => [f.name, m[f.group]])),
  };
}

export function parseSeq(pattern, number) {
  const r = matchNumber(pattern, number);
  return r && r.seq !== null ? r.seq : null;
}

export function nextFormattedNumber(invoices, pattern, date) {
  if (typeof pattern !== "string") return "";
  const fields = tokenize(pattern).filter((p) => p.field).map((p) => p.field);
  const resets = fields.some((f) => f === "YYYY" || f === "YY" || f === "MM");
  const dp = dateParts(date);
  let max = 0;
  for (const inv of Array.isArray(invoices) ? invoices : []) {
    const r = matchNumber(pattern, inv && inv.number);
    if (!r || r.seq === null) continue;
    if (resets && (r.fields.YYYY !== undefined && r.fields.YYYY !== dp.YYYY
      || r.fields.YY !== undefined && r.fields.YY !== dp.YY
      || r.fields.MM !== undefined && r.fields.MM !== dp.MM)) continue;
    if (r.seq > max) max = r.seq;
  }
  return formatNumber(pattern, max + 1, date);
}
