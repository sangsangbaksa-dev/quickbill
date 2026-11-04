// Payment terms presets. Keys are stable ids; values are days after the
// issue date, or "eom" for the last day of the issue date's month.
import { addDays } from "./logic.js";

export const TERMS = {
  due_on_receipt: 0,
  net7: 7,
  net14: 14,
  net30: 30,
  net45: 45,
  net60: 60,
  eom: "eom",
};

const LABELS = {
  due_on_receipt: "Due on receipt",
  net7: "Net 7",
  net14: "Net 14",
  net30: "Net 30",
  net45: "Net 45",
  net60: "Net 60",
  eom: "End of month",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s) {
  return typeof s === "string" && DATE_RE.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

export function dueDateFor(issueDate, term) {
  if (!isValidDate(issueDate)) return "";
  if (!Object.hasOwn(TERMS, term)) return "";
  const value = TERMS[term];
  if (value === "eom") {
    const [y, m] = issueDate.split("-").map(Number);
    // Day 0 of the next month is the last day of this month.
    const last = new Date(Date.UTC(y, m, 0));
    return last.toISOString().slice(0, 10);
  }
  return addDays(issueDate, value);
}

export function termFor(issueDate, dueDate) {
  if (typeof dueDate !== "string" || !dueDate) return null;
  for (const term of Object.keys(TERMS)) {
    const due = dueDateFor(issueDate, term);
    if (due && due === dueDate) return term;
  }
  return null;
}

// English only; `lang` is accepted for call-site compatibility and ignored.
export function termLabel(term, lang = "en") {
  return Object.hasOwn(LABELS, term) ? LABELS[term] : "";
}
