import { test } from "node:test";
import assert from "node:assert/strict";
import { TERMS, dueDateFor, termFor, termLabel } from "../terms.js";

test("numeric term adds days to the issue date", () => {
  assert.equal(dueDateFor("2026-01-15", "net30"), "2026-02-14");
  assert.equal(dueDateFor("2026-01-15", "due_on_receipt"), "2026-01-15");
  assert.equal(dueDateFor("2026-01-15", "net7"), "2026-01-22");
});

test("eom returns the last day of the issue month, including leap years", () => {
  assert.equal(dueDateFor("2024-02-10", "eom"), "2024-02-29");
  assert.equal(dueDateFor("2026-02-10", "eom"), "2026-02-28");
  assert.equal(dueDateFor("2026-12-03", "eom"), "2026-12-31");
});

test("termFor round-trips with dueDateFor", () => {
  for (const term of Object.keys(TERMS)) {
    // 2026-01-15: every term yields a distinct due date, so the match is unambiguous.
    const due = dueDateFor("2026-01-15", term);
    assert.equal(termFor("2026-01-15", due), term, term);
  }
  assert.equal(termFor("2026-01-15", "2026-01-16"), null);
  assert.equal(termFor("2026-01-15", ""), null);
});

test("invalid input returns empty string", () => {
  assert.equal(dueDateFor("2026/01/15", "net30"), "");
  assert.equal(dueDateFor("", "net30"), "");
  assert.equal(dueDateFor("2026-01-15", "net99"), "");
  assert.equal(dueDateFor("2026-13-45", "net30"), "");
  assert.equal(dueDateFor(undefined, "eom"), "");
});

test("termLabel gives English labels", () => {
  assert.equal(termLabel("net30"), "Net 30");
  assert.equal(termLabel("due_on_receipt"), "Due on receipt");
  assert.equal(termLabel("eom"), "End of month");
  assert.equal(termLabel("nope"), "");
});
