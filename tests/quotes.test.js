import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteState, expiringQuotes, quoteStats } from "../quotes.js";

const TODAY = "2026-11-04";
const quote = (over = {}) => ({
  id: "q1",
  type: "quote",
  number: "QUO-0001",
  client: "Acme",
  status: "sent",
  dueDate: "2026-12-04",
  ...over,
});
const invoiceFrom = (number) => ({ id: "i1", type: "invoice", number: "INV-0001", convertedFrom: number });

test("quoteState: open when more than 7 days remain", () => {
  assert.equal(quoteState(quote({ dueDate: "2026-11-30" }), TODAY), "open");
});

test("quoteState: expiring at 0 and 7 days left (inclusive bounds)", () => {
  assert.equal(quoteState(quote({ dueDate: "2026-11-11" }), TODAY), "expiring");
  assert.equal(quoteState(quote({ dueDate: TODAY }), TODAY), "expiring");
});

test("quoteState: expired once the valid-until date has passed", () => {
  assert.equal(quoteState(quote({ dueDate: "2026-11-03" }), TODAY), "expired");
});

test("quoteState: converted wins over expiry when an invoice references the quote", () => {
  const q = quote({ dueDate: "2026-10-01" });
  assert.equal(quoteState(q, TODAY, [invoiceFrom("QUO-0001")]), "converted");
  assert.equal(quoteState(q, TODAY, [invoiceFrom("QUO-0002")]), "expired");
});

test("quoteState: non-quotes return null", () => {
  assert.equal(quoteState({ id: "i", type: "invoice", number: "INV-1", dueDate: TODAY }, TODAY), null);
});

test("expiringQuotes: keeps only expiring quotes, sorted by daysLeft ascending", () => {
  const list = [
    quote({ id: "a", number: "QUO-0001", dueDate: "2026-11-10" }), // 6 days
    quote({ id: "b", number: "QUO-0002", dueDate: "2026-11-05" }), // 1 day
    quote({ id: "c", number: "QUO-0003", dueDate: "2026-12-30" }), // open
    quote({ id: "d", number: "QUO-0004", dueDate: "2026-11-01" }), // expired
    quote({ id: "e", number: "QUO-0005", dueDate: "2026-11-04" }), // 0 days
    { id: "f", type: "invoice", number: "INV-0001", dueDate: "2026-11-06" },
  ];
  assert.deepEqual(expiringQuotes(list, TODAY), [
    { id: "e", number: "QUO-0005", client: "Acme", daysLeft: 0 },
    { id: "b", number: "QUO-0002", client: "Acme", daysLeft: 1 },
    { id: "a", number: "QUO-0001", client: "Acme", daysLeft: 6 },
  ]);
});

test("expiringQuotes: excludes quotes already converted", () => {
  const list = [quote({ number: "QUO-0001", dueDate: "2026-11-06" }), invoiceFrom("QUO-0001")];
  assert.deepEqual(expiringQuotes(list, TODAY), []);
});

test("expiringQuotes: withinDays narrows the window", () => {
  const list = [quote({ id: "a", number: "QUO-0001", dueDate: "2026-11-10" })];
  assert.equal(expiringQuotes(list, TODAY, 3).length, 0);
  assert.equal(expiringQuotes(list, TODAY, 6).length, 1);
});

test("quoteStats: rate is the rounded share of sent quotes converted", () => {
  const list = [
    quote({ id: "a", number: "QUO-0001" }),
    quote({ id: "b", number: "QUO-0002", status: "accepted" }),
    quote({ id: "c", number: "QUO-0003" }),
    invoiceFrom("QUO-0001"),
  ];
  assert.deepEqual(quoteStats(list), { total: 3, converted: 1, rate: 33 });
});

test("quoteStats: draft quotes do not count toward total or converted", () => {
  const list = [
    quote({ id: "a", number: "QUO-0001", status: "draft" }),
    quote({ id: "b", number: "QUO-0002" }),
    invoiceFrom("QUO-0002"),
  ];
  assert.deepEqual(quoteStats(list), { total: 1, converted: 1, rate: 100 });
});

test("quoteStats: zero quotes gives rate 0 without dividing by zero", () => {
  assert.deepEqual(quoteStats([]), { total: 0, converted: 0, rate: 0 });
  assert.deepEqual(quoteStats([quote({ status: "draft" })]), { total: 0, converted: 0, rate: 0 });
});

test("inputs are not mutated", () => {
  const list = [
    quote({ id: "a", number: "QUO-0001", dueDate: "2026-11-06" }),
    quote({ id: "b", number: "QUO-0002", status: "draft" }),
    invoiceFrom("QUO-0002"),
  ];
  const snapshot = structuredClone(list);
  quoteState(list[0], TODAY, list);
  expiringQuotes(list, TODAY);
  quoteStats(list);
  assert.deepEqual(list, snapshot);
});
