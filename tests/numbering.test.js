import test from "node:test";
import assert from "node:assert/strict";
import { formatNumber, parseSeq, nextFormattedNumber } from "../numbering.js";

const D = "2026-03-01";

test("formatNumber pads the sequence and replaces date tokens", () => {
  assert.equal(formatNumber("INV-{YYYY}-{NNNN}", 7, D), "INV-2026-0007");
  assert.equal(formatNumber("{YY}{MM}-{NN}", 5, D), "2603-05");
  assert.equal(formatNumber("INV-{NN}", 1, D), "INV-01");
});

test("sequence wider than the width is not truncated", () => {
  assert.equal(formatNumber("INV-{NN}", 12345, D), "INV-12345");
  assert.equal(formatNumber("{NNNNNN}", 1234567, D), "1234567");
});

test("pattern without an N token appends nothing", () => {
  assert.equal(formatNumber("INV-{YYYY}", 7, D), "INV-2026");
  assert.equal(formatNumber("FIXED", 7, D), "FIXED");
});

test("invalid date gives empty year and month", () => {
  assert.equal(formatNumber("{YYYY}/{MM}/{NN}", 3, "nope"), "//03");
  assert.equal(formatNumber("{YYYY}/{MM}/{NN}", 3, "2026-02-30"), "//03");
});

test("non-string pattern returns empty string", () => {
  assert.equal(formatNumber(null, 1, D), "");
  assert.equal(formatNumber(42, 1, D), "");
});

test("parseSeq returns the sequence for a matching number", () => {
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "INV-2026-0007"), 7);
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "INV-2025-0007"), 7);
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "INV-2026-12345"), 12345);
});

test("parseSeq returns null for non-matching numbers", () => {
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "INV-26-0007"), null);
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "XINV-2026-0007"), null);
  assert.equal(parseSeq("INV-{YYYY}-{NNNN}", "INV-2026-0007-x"), null);
  assert.equal(parseSeq("INV-{NNNN}", null), null);
});

test("literal dots and brackets are escaped in parseSeq", () => {
  assert.equal(parseSeq("A.B[{NN}]", "A.B[42]"), 42);
  assert.equal(parseSeq("A.B[{NN}]", "AxB[42]"), null);
  assert.equal(parseSeq("A.B[{NN}]", "A.B[42"), null);
  assert.equal(parseSeq("(v+1)*{NN}", "(v+1)*09"), 9);
  assert.equal(parseSeq("(v+1)*{NN}", "vv*09"), null);
});

test("nextFormattedNumber resets the counter in a new year", () => {
  const invoices = [{ number: "INV-2025-0009" }, { number: "INV-2026-0003" }];
  assert.equal(nextFormattedNumber(invoices, "INV-{YYYY}-{NNNN}", "2026-06-01"), "INV-2026-0004");
  assert.equal(nextFormattedNumber(invoices, "INV-{YYYY}-{NNNN}", "2027-01-05"), "INV-2027-0001");
});

test("nextFormattedNumber resets the counter in a new month", () => {
  const invoices = [{ number: "INV-2026-02-0008" }];
  assert.equal(nextFormattedNumber(invoices, "INV-{YYYY}-{MM}-{NNNN}", "2026-02-10"), "INV-2026-02-0009");
  assert.equal(nextFormattedNumber(invoices, "INV-{YYYY}-{MM}-{NNNN}", "2026-03-10"), "INV-2026-03-0001");
});

test("nextFormattedNumber keeps counting when the pattern has no date tokens", () => {
  const invoices = [{ number: "INV-0003" }, { number: "INV-0010" }, { number: "INV-2026-0099" }];
  assert.equal(nextFormattedNumber(invoices, "INV-{NNNN}", "2027-05-01"), "INV-0011");
});

test("nextFormattedNumber ignores non-matching existing numbers", () => {
  const invoices = [
    null,
    { number: 5 },
    {},
    "INV-2026-0050",
    { number: "OTHER-0100" },
    { number: "INV-2026-0002" },
    { number: "INV-2026-x" },
  ];
  assert.equal(nextFormattedNumber(invoices, "INV-{YYYY}-{NNNN}", D), "INV-2026-0003");
  assert.equal(nextFormattedNumber([], "INV-{YYYY}-{NNNN}", D), "INV-2026-0001");
});
