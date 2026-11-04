import test from "node:test";
import assert from "node:assert/strict";
import { splitInstallments, planTotal } from "../installments.js";

test("100 split into 3 at 2 decimals; remainder goes on the last one", () => {
  const plan = splitInstallments(100, 3, { decimals: 2 });
  assert.deepEqual(plan.map((p) => p.amount), [33.33, 33.33, 33.34]);
  assert.deepEqual(plan.map((p) => p.n), [1, 2, 3]);
  assert.equal(planTotal(plan), 100);
});

test("zero-decimal currency (JPY-like) split into 3", () => {
  const plan = splitInstallments(1000, 3, { decimals: 0 });
  assert.deepEqual(plan.map((p) => p.amount), [333, 333, 334]);
  assert.equal(planTotal(plan), 1000);
});

test("due dates step by intervalDays from startDate", () => {
  const plan = splitInstallments(90, 3, { startDate: "2026-01-01" });
  assert.deepEqual(plan.map((p) => p.dueDate), ["2026-01-01", "2026-01-31", "2026-03-02"]);

  const weekly = splitInstallments(40, 4, { startDate: "2026-01-01", intervalDays: 7 });
  assert.deepEqual(weekly.map((p) => p.dueDate), ["2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22"]);
});

test("dueDate is empty when startDate is missing or invalid", () => {
  for (const startDate of [undefined, "", "2026-02-30", "2026/01/01", "not a date", 20260101]) {
    const plan = splitInstallments(10, 2, { startDate });
    assert.equal(plan.length, 2);
    assert.deepEqual(plan.map((p) => p.dueDate), ["", ""]);
  }
});

test("invalid count returns []", () => {
  for (const count of [0, -1, 61, 1.5, NaN, "3", undefined]) {
    assert.deepEqual(splitInstallments(100, count), []);
  }
  assert.equal(splitInstallments(100, 60).length, 60);
  assert.equal(splitInstallments(100, 1).length, 1);
});

test("negative or non-finite total returns []", () => {
  for (const total of [-5, NaN, Infinity, -Infinity, "100", null]) {
    assert.deepEqual(splitInstallments(total, 3), []);
  }
});

test("total 0 gives count entries of 0", () => {
  const plan = splitInstallments(0, 4);
  assert.deepEqual(plan.map((p) => p.amount), [0, 0, 0, 0]);
  assert.equal(planTotal(plan), 0);
});

test("sum always equals total for a set of fixed values", () => {
  const totals = [0.01, 0.99, 19.99, 100, 123.45, 999.99, 1234567.89, 3.33];
  const counts = [1, 2, 3, 7, 12, 60];
  for (const total of totals) {
    for (const count of counts) {
      const plan = splitInstallments(total, count, { decimals: 2 });
      assert.equal(plan.length, count);
      assert.equal(planTotal(plan), total, `total ${total} into ${count}`);
    }
  }
});

test("planTotal handles empty and missing input", () => {
  assert.equal(planTotal([]), 0);
  assert.equal(planTotal(null), 0);
});
