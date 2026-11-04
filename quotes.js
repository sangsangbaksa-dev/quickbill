// Quote expiry and conversion stats. Pure functions; inputs are never mutated.
import { isQuote, dayDiff } from "./logic.js";

const EXPIRING_DAYS = 7;

// "converted" if an invoice was created from this quote, "expired" if the
// valid-until date has passed, "expiring" if 0..7 days are left, else "open".
export function quoteState(quote, today, invoices = []) {
  if (!isQuote(quote)) return null;
  if (invoices.some((inv) => inv.convertedFrom === quote.number)) return "converted";
  const daysLeft = dayDiff(today, quote.dueDate);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= EXPIRING_DAYS) return "expiring";
  return "open";
}

// Quotes that are still valid but close to expiring, soonest first.
// withinDays narrows the window; it cannot widen it past the 7-day "expiring" state.
export function expiringQuotes(list, today, withinDays = EXPIRING_DAYS) {
  return list
    .filter((q) => quoteState(q, today, list) === "expiring")
    .map((q) => ({
      id: q.id,
      number: q.number,
      client: q.client,
      daysLeft: dayDiff(today, q.dueDate),
    }))
    .filter((q) => q.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Conversion rate across sent/accepted quotes. Drafts are not sent yet, so they
// are excluded from both the total and the converted count.
export function quoteStats(list) {
  const sent = list.filter((q) => isQuote(q) && q.status !== "draft");
  const total = sent.length;
  if (total === 0) return { total: 0, converted: 0, rate: 0 };
  const converted = sent.filter((q) => list.some((inv) => inv.convertedFrom === q.number)).length;
  return { total, converted, rate: Math.round((100 * converted) / total) };
}
