// Per-line percentage discounts. An item may carry an optional `discountPct`
// (0-100). Values outside that range are clamped; non-numbers count as 0.
import { round2 } from "./logic.js";

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function qtyOf(item) {
  return Math.max(0, num(item && item.qty));
}

function priceOf(item) {
  return Math.max(0, num(item && item.price));
}

function pctOf(item) {
  return Math.min(100, Math.max(0, num(item && item.discountPct)));
}

function grossOf(item) {
  return qtyOf(item) * priceOf(item);
}

export function lineAmount(item) {
  return round2(grossOf(item) * (1 - pctOf(item) / 100));
}

export function applyLineDiscounts(items) {
  return items.map((item) => ({ ...item, amount: lineAmount(item) }));
}

export function itemsSubtotal(items) {
  return round2(items.reduce((sum, item) => sum + lineAmount(item), 0));
}

export function discountTotal(items) {
  return round2(items.reduce((sum, item) => sum + (grossOf(item) - lineAmount(item)), 0));
}
