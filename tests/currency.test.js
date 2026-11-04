import { test } from "node:test";
import assert from "node:assert/strict";
import { minorUnits, roundMoney, formatMinor } from "../currency.js";

test("minorUnits: zero-decimal currencies", () => {
  assert.equal(minorUnits("JPY"), 0);
  assert.equal(minorUnits("KRW"), 0);
  assert.equal(minorUnits("jpy"), 0);
});

test("minorUnits: three-decimal currencies", () => {
  assert.equal(minorUnits("KWD"), 3);
  assert.equal(minorUnits("BHD"), 3);
});

test("minorUnits: unknown or invalid codes default to 2", () => {
  assert.equal(minorUnits("XYZ"), 2);
  assert.equal(minorUnits("USD"), 2);
  assert.equal(minorUnits(null), 2);
  assert.equal(minorUnits(undefined), 2);
  assert.equal(minorUnits(392), 2);
});

test("roundMoney: half away from zero", () => {
  assert.equal(roundMoney(2.5, "JPY"), 3);
  assert.equal(roundMoney(-2.5, "JPY"), -3);
  assert.equal(roundMoney(1.005, "USD"), 1.01);
  assert.equal(roundMoney(-1.005, "USD"), -1.01);
});

test("roundMoney: uses the currency's decimals", () => {
  assert.equal(roundMoney(1.2346, "KWD"), 1.235);
  assert.equal(roundMoney(1.2344, "KWD"), 1.234);
  assert.equal(roundMoney(1234.6, "KRW"), 1235);
});

test("roundMoney: non-finite input returns 0 and no -0", () => {
  assert.equal(roundMoney(NaN, "USD"), 0);
  assert.equal(roundMoney(Infinity, "USD"), 0);
  assert.equal(roundMoney(-Infinity, "USD"), 0);
  assert.ok(Object.is(roundMoney(-0.001, "USD"), 0));
});

test("formatMinor: JPY has no decimals", () => {
  const out = formatMinor(3000.4, "JPY");
  assert.match(out, /3,000/);
  assert.doesNotMatch(out, /\./);
});

test("formatMinor: KWD shows three decimals", () => {
  assert.match(formatMinor(1.2, "KWD"), /1\.200/);
});

test("formatMinor: default two decimals for USD", () => {
  assert.match(formatMinor(12, "USD"), /12\.00/);
});
