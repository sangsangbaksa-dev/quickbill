// Installment plans: split a total into equal parts with a rounding remainder on the last one.
// DOM-free so `npm test` covers it. Decimals are passed in (no currency import).
import { round2, addDays } from "./logic.js";

export const MAX_INSTALLMENTS = 60;

function validDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function splitInstallments(total, count, { startDate, intervalDays = 30, decimals = 2 } = {}) {
  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return [];
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) return [];

  const factor = 10 ** decimals;
  const minor = Math.round(total * factor);
  const base = Math.floor(minor / count);
  const remainder = minor - base * count;
  const useDates = validDate(startDate);

  const plan = [];
  for (let i = 0; i < count; i++) {
    const units = i === count - 1 ? base + remainder : base;
    plan.push({
      n: i + 1,
      amount: units / factor,
      dueDate: useDates ? addDays(startDate, intervalDays * i) : "",
    });
  }
  return plan;
}

export function planTotal(plan) {
  if (!Array.isArray(plan)) return 0;
  return round2(plan.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
}
