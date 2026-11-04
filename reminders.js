import { balanceOf, isQuote, dayDiff } from "./logic.js";

export const DEFAULT_SCHEDULE = { before: [3], due: true, after: [1, 7, 14, 30] };

// Returns {kind, days} when a reminder should go out for `inv` on `today`, otherwise null.
// offset = days from today to the due date (negative means overdue).
export function reminderDue(inv, today, schedule = DEFAULT_SCHEDULE) {
  if (!inv || isQuote(inv) || inv.status === "draft" || !inv.dueDate) return null;
  if (balanceOf(inv) <= 0) return null;
  if (Array.isArray(inv.reminders) && inv.reminders.includes(today)) return null;

  const offset = dayDiff(today, inv.dueDate);
  const before = schedule.before ?? [];
  const after = schedule.after ?? [];

  if (before.includes(offset)) return { kind: "before", days: offset };
  if (offset === 0 && schedule.due) return { kind: "due", days: 0 };
  if (offset < 0 && after.includes(-offset)) return { kind: "after", days: -offset };
  return null;
}

// Every invoice that needs a reminder today, as {id, number, client, kind, days}.
export function remindersToday(invoices, today, schedule = DEFAULT_SCHEDULE) {
  const out = [];
  for (const inv of invoices) {
    const due = reminderDue(inv, today, schedule);
    if (due) out.push({ id: inv.id, number: inv.number, client: inv.client, kind: due.kind, days: due.days });
  }
  return out;
}

// Returns a new invoice with `today` recorded in reminders (no duplicates). Input is not mutated.
export function markReminded(inv, today) {
  const existing = Array.isArray(inv.reminders) ? inv.reminders : [];
  const reminders = existing.includes(today) ? [...existing] : [...existing, today];
  return { ...inv, reminders };
}
