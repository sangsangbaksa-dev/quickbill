import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lineAmount,
  applyLineDiscounts,
  itemsSubtotal,
  discountTotal,
} from "../linediscount.js";

test("10% discount on 2 x 50 gives 90", () => {
  assert.equal(lineAmount({ desc: "a", qty: 2, price: 50, discountPct: 10 }), 90);
});

test("discountPct above 100 clamps to 100 (amount 0)", () => {
  assert.equal(lineAmount({ desc: "a", qty: 2, price: 50, discountPct: 150 }), 0);
});

test("discountPct below 0 clamps to 0", () => {
  assert.equal(lineAmount({ desc: "a", qty: 2, price: 50, discountPct: -20 }), 100);
});

test("non-numeric discountPct counts as 0", () => {
  assert.equal(lineAmount({ desc: "a", qty: 2, price: 50, discountPct: "10" }), 100);
  assert.equal(lineAmount({ desc: "a", qty: 2, price: 50, discountPct: null }), 100);
});

test("missing discountPct means no discount", () => {
  assert.equal(lineAmount({ desc: "a", qty: 3, price: 7.5 }), 22.5);
});

test("negative qty and price are clamped to 0", () => {
  assert.equal(lineAmount({ desc: "a", qty: -2, price: 50 }), 0);
  assert.equal(lineAmount({ desc: "a", qty: 2, price: -50 }), 0);
});

test("applyLineDiscounts adds amount and does not mutate input", () => {
  const items = [
    { desc: "a", qty: 2, price: 50, discountPct: 10, lateFee: 5 },
    { desc: "b", qty: 1, price: 20 },
  ];
  const snapshot = JSON.parse(JSON.stringify(items));
  const out = applyLineDiscounts(items);
  assert.deepEqual(items, snapshot);
  assert.notEqual(out, items);
  assert.notEqual(out[0], items[0]);
  assert.deepEqual(out[0], { desc: "a", qty: 2, price: 50, discountPct: 10, lateFee: 5, amount: 90 });
  assert.deepEqual(out[1], { desc: "b", qty: 1, price: 20, amount: 20 });
});

test("itemsSubtotal and discountTotal add up to the undiscounted total", () => {
  const items = [
    { desc: "a", qty: 2, price: 50, discountPct: 10 },
    { desc: "b", qty: 1, price: 20.5 },
    { desc: "c", qty: 3, price: 3.33, discountPct: 15 },
  ];
  const undiscounted = 2 * 50 + 1 * 20.5 + 3 * 3.33;
  const subtotal = itemsSubtotal(items);
  const discount = discountTotal(items);
  assert.equal(subtotal, 118.99);
  assert.equal(discount, 11.5);
  assert.equal(Math.round((subtotal + discount) * 100) / 100, Math.round(undiscounted * 100) / 100);
});

test("3 x 3.33 at 15% rounds to cents", () => {
  assert.equal(lineAmount({ desc: "c", qty: 3, price: 3.33, discountPct: 15 }), 8.49);
});
