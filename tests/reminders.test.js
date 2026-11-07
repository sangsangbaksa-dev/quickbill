import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCHEDULE, reminderDue, remindersToday, markReminded, reminderPlan } from "../reminders.js";
import { addDays } from "../logic.js";

const TODAY = "2026-05-10";
const base = (over = {}) => ({
  id: "inv1",
  number: "INV-1",
  client: "Acme",
  type: "invoice",
  status: "sent",
  items: [{ desc: "Work", qty: 1, price: 100 }],
  paid: 0,
  dueDate: TODAY,
  ...over,
});

test("reminds 3 days before the due date", () => {
  const inv = base({ dueDate: addDays(TODAY, 3) });
  assert.deepEqual(reminderDue(inv, TODAY), { kind: "before", days: 3 });
});

test("reminds on the due date", () => {
  assert.deepEqual(reminderDue(base(), TODAY), { kind: "due", days: 0 });
});

test("reminds 7 days after the due date", () => {
  const inv = base({ dueDate: addDays(TODAY, -7) });
  assert.deepEqual(reminderDue(inv, TODAY), { kind: "after", days: 7 });
});

test("no reminder on a day that matches no schedule entry", () => {
  assert.equal(reminderDue(base({ dueDate: addDays(TODAY, 10) }), TODAY), null);
  assert.equal(reminderDue(base({ dueDate: addDays(TODAY, -5) }), TODAY), null);
});

test("no reminder on a paid invoice", () => {
  const inv = base({ status: "paid", paid: 100 });
  assert.equal(reminderDue(inv, TODAY), null);
});

test("no reminder without a due date, on drafts, or with a balance already cleared", () => {
  assert.equal(reminderDue(base({ dueDate: undefined }), TODAY), null);
  assert.equal(reminderDue(base({ status: "draft" }), TODAY), null);
  assert.equal(reminderDue(base({ paid: 100 }), TODAY), null);
});

test("no reminder twice on the same day after markReminded", () => {
  const inv = base();
  assert.deepEqual(reminderDue(inv, TODAY), { kind: "due", days: 0 });
  const marked = markReminded(inv, TODAY);
  assert.equal(reminderDue(marked, TODAY), null);
  assert.deepEqual(remindersToday([marked], TODAY), []);
  // markReminded is idempotent for the same day
  assert.deepEqual(markReminded(marked, TODAY).reminders, [TODAY]);
});

test("a reminder is still due on a later day for the same invoice", () => {
  const inv = markReminded(base(), TODAY);
  assert.deepEqual(reminderDue(inv, addDays(TODAY, 1)), { kind: "after", days: 1 });
});

test("quotes are ignored", () => {
  const quote = base({ type: "quote", status: "sent" });
  assert.equal(reminderDue(quote, TODAY), null);
  assert.deepEqual(remindersToday([quote], TODAY), []);
});

test("schedule override is respected", () => {
  const schedule = { before: [], due: false, after: [2] };
  assert.equal(reminderDue(base(), TODAY, schedule), null);
  assert.equal(reminderDue(base({ dueDate: addDays(TODAY, 3) }), TODAY, schedule), null);
  assert.deepEqual(reminderDue(base({ dueDate: addDays(TODAY, -2) }), TODAY, schedule), { kind: "after", days: 2 });
  assert.equal(reminderDue(base({ dueDate: addDays(TODAY, -7) }), TODAY, schedule), null);
  assert.deepEqual(reminderDue(base({ dueDate: addDays(TODAY, 5) }), TODAY, { before: [5], due: true, after: [] }),
    { kind: "before", days: 5 });
});

test("default schedule is exported and used by default", () => {
  assert.deepEqual(DEFAULT_SCHEDULE, { before: [3], due: true, after: [1, 7, 14, 30] });
});

test("remindersToday collects matching invoices with id, number, client, kind, days", () => {
  const invoices = [
    base({ id: "a", number: "A-1", client: "Acme", dueDate: addDays(TODAY, 3) }),
    base({ id: "b", number: "B-1", client: "Beta", dueDate: TODAY }),
    base({ id: "c", number: "C-1", client: "Gamma", dueDate: addDays(TODAY, -30) }),
    base({ id: "d", number: "D-1", client: "Delta", dueDate: addDays(TODAY, 20) }),
    base({ id: "e", number: "E-1", client: "Echo", status: "paid", paid: 100, dueDate: TODAY }),
  ];
  assert.deepEqual(remindersToday(invoices, TODAY), [
    { id: "a", number: "A-1", client: "Acme", kind: "before", days: 3 },
    { id: "b", number: "B-1", client: "Beta", kind: "due", days: 0 },
    { id: "c", number: "C-1", client: "Gamma", kind: "after", days: 30 },
  ]);
});

test("inputs are not mutated", () => {
  const inv = base({ reminders: ["2026-05-01"] });
  const snapshot = JSON.parse(JSON.stringify(inv));
  const list = [inv];
  const listSnapshot = JSON.parse(JSON.stringify(list));
  const schedule = { before: [3], due: true, after: [1] };
  const scheduleSnapshot = JSON.parse(JSON.stringify(schedule));

  reminderDue(inv, TODAY, schedule);
  remindersToday(list, TODAY, schedule);
  const marked = markReminded(inv, TODAY);

  assert.deepEqual(inv, snapshot);
  assert.deepEqual(list, listSnapshot);
  assert.deepEqual(schedule, scheduleSnapshot);
  assert.notEqual(marked, inv);
  assert.deepEqual(marked.reminders, ["2026-05-01", TODAY]);
});

test("reminderPlan: upcoming dates follow the same schedule as reminderDue, earliest first", () => {
  const inv = base({ dueDate: "2026-05-20" });
  const plan = reminderPlan(inv, TODAY, DEFAULT_SCHEDULE, 10);
  assert.deepEqual(plan, [
    { kind: "before", days: 3, date: "2026-05-17" },
    { kind: "due", days: 0, date: "2026-05-20" },
    { kind: "after", days: 1, date: "2026-05-21" },
    { kind: "after", days: 7, date: "2026-05-27" },
    { kind: "after", days: 14, date: "2026-06-03" },
    { kind: "after", days: 30, date: "2026-06-19" },
  ]);
  // Every planned date is a date reminderDue would report on that day.
  for (const step of plan) assert.equal(reminderDue(inv, step.date)?.kind, step.kind);
});

test("reminderPlan: skips past dates, already-reminded dates, paid, draft and quote invoices", () => {
  const inv = base({ dueDate: "2026-05-20", reminders: ["2026-05-17"] });
  assert.deepEqual(reminderPlan(inv, "2026-05-18", DEFAULT_SCHEDULE, 2).map((s) => s.date), ["2026-05-20", "2026-05-21"]);
  assert.deepEqual(reminderPlan(base({ dueDate: TODAY, paid: 100 }), TODAY), []);
  assert.deepEqual(reminderPlan(base({ status: "draft" }), TODAY), []);
  assert.deepEqual(reminderPlan(base({ type: "quote" }), TODAY), []);
  assert.deepEqual(reminderPlan(base({ dueDate: "" }), TODAY), []);
  assert.deepEqual(reminderPlan(null, TODAY), []);
});

test("reminderPlan: default limit is 3 and bad input never throws", () => {
  assert.equal(reminderPlan(base({ dueDate: "2026-05-20" }), TODAY).length, 3);
  assert.deepEqual(reminderPlan(base({ dueDate: "2026-05-20" }), "not-a-date"), []);
  assert.deepEqual(reminderPlan(base({ dueDate: "2026-05-20" }), TODAY, DEFAULT_SCHEDULE, 0), []);
});
