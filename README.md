# QuickBill

A small invoicing tool for people who work alone. The app stores data in browser localStorage by default. Optional cloud backup and license verification use external services; operators must configure and protect those services and account for hosting costs.

Free: 3 invoices/quotes, 2 sheets, 2 documents, every currency and language, print to PDF, JSON backup/restore.
Full license ($19, once): unlimited documents, no footer, logo, repeat billing, tracked-time
billing, CSV export, client ledger and overdue ageing.

## What it does
- Invoices and quotes (QUO- numbering); a quote converts to an invoice in one click.
- Tax, discount, deposits and part-payments; status follows the balance.
- Late fees (per started 30 days) and a copy-paste payment reminder per language.
- Dashboard per currency, ageing buckets, per-client ledger.
- Timer that turns tracked hours into invoice lines.
- Sheets: a formula grid (SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS, IF, cell references), CSV import/export, fill from invoices, rows to invoice. `sheet.js` is the engine; formulas are parsed by hand, no eval.
- Documents: proposal, agreement and scope templates with {{client}}/{{from}}/{{date}} fields, own templates, print or save as PDF.
- Client links (Pro): "Copy client link" puts a snapshot of the invoice in the URL fragment (`view.html#d=...`). The client opens a read-only page with status (due in N days / overdue with late fee / paid), balance, an optional https "Pay online" button (the invoice's payment link field), print/PDF and a language switch. The URL fragment is not sent in the page request, but anyone with the link can see the invoice and messaging services may retain it. The link is a snapshot, so send a new one after changing the invoice. Overdue reminders append the link. `share.js` encodes/decodes/validates (only https pay links, size and field limits) and is covered by `tests/share.test.js`.
- Combined totals (Pro): with invoices in more than one currency, the list shows a total in a base currency you pick, using exchange rates you type (`fx.js`). A currency with no rate is listed as left out, never guessed. Nothing is fetched.
- Dated payments: record each payment with its date in the invoice editor (`recordPayment` in `logic.js`; `paid` stays the number the rest of the app reads). Insights then shows average days to be paid, share paid on time, cash received this month and the slowest-paying clients, and a CSV of all dated payments for your accountant.
- Client memory (Pro): saving an invoice remembers that client's email, currency, tax, payment terms (days), payment info and pay link (`clients.js`). Picking the client on a new invoice fills them in. "Email client" opens your mail app with a ready message (invoice, quote or overdue reminder, plus the client link). Profiles are part of the JSON backup.
- Saved items (Pro): descriptions you bill are remembered with their last price (`catalog.js`, most used first, capped at 200). Typing a known description in a new line offers it and fills the price if it is still 0. Part of the JSON backup.
- Tax year view (Pro): expenses carry a category (software, equipment, travel, meals, office, marketing, fees, other; older ones count as other). Pick a tax year to see income, expenses and profit per quarter, spending by category and a set-aside at your own tax rate. Two CSVs for an accountant: all expenses of the year, and a one-sheet tax-year report (`quarterlySummary`, `expensesByCategory`, `taxReportCSV` in `logic.js`). Income is counted by invoice issue date, the same as the year summary.
- Withholding tax (free): a "Withholding tax %" field on every invoice, with presets for Korea (3.3%) and Japan (10.21%). The client pays the total minus that tax, the balance and "paid" status follow the amount you actually receive, the invoice and client link show "You receive", and the tax year view adds up what clients withheld so you can claim it. The rate is remembered per client. `calcTotals(items, tax, discount, withholdingRate)`, `payableOf`, `grossPaidOf` in `logic.js`.
- Expected cash-in (Insights): open invoices are placed on the date each client usually pays (issue date plus their own average days, from dated payments), or on the due date for a client with no history. Shows the next three months, what comes later, and flags invoices expected after their due date (`clientHabits`, `expectedCash`). Computed on the device from your own records.
- Registration number: an optional tax / business registration number (Japan qualified invoice T-number, Korean 사업자등록번호, VAT or tax ID) is remembered from invoice to invoice and printed beside your name on the invoice and the client link. QuickBill does not file e-tax invoices (전자세금계산서) or validate the number.
- Upcoming recurring invoices: Insights lists the next 3 months of scheduled repeat invoices with an expected total per currency (`upcomingRecurring` in `logic.js`).
- Tax-rate presets (free): the tax field suggests common VAT, GST and sales-tax rates (0 to 25%). Any other rate can still be typed (`TAX_PRESETS` in `logic.js`).
- Full balance (free): "Fill in full balance" in the payment log puts the amount still owed into the amount field and the date is today. Nothing is booked until "Record payment" is pressed, so a part-payment is just a different amount typed in.
- Payment terms note (free): each invoice has a "Payment terms" note, starting with a default text in the app's language. It prints on the invoice and shows on the client link (`terms` in the share snapshot). New quotes start empty.
- Bulk status (free): tick invoices or quotes in the list and set them to sent, paid (invoices) or accepted (quotes). Paid amounts follow the status (`bulkStatus` in `logic.js`).
- Recent activity (free): the dashboard lists the latest payments and issued documents, newest first, derived from saved records (`recentActivity` in `logic.js`). Nothing extra is stored.
- Sticky totals (free): the editor keeps the total, the balance and, for an overdue invoice, the late fee the button would add today pinned at the top while you scroll.
- English, Korean, Japanese, Chinese, Spanish with local currency/date formats.

## Selling it
Before selling, configure your checkout link and support details in `config.js`, set `LEMONSQUEEZY_PRODUCT_ID` for the correct product, and deploy the serverless licence endpoint alongside the static files. Test the real purchase, key activation, refund and support flows. Offline keys are a fallback when the endpoint is disabled or unreachable; they are not a secure access control.

## Development
- `npm test` runs the unit tests (`node --test`).
- `python3 -m http.server 8123` then `node tests/e2e.cjs` runs the browser test (needs Playwright).

## Brand assets

The design lives in Figma (colour variables, type styles, icon, logo lockup and the OG image frame). The wordmark is set in Newsreader (SIL OFL) with a tapered accent underline drawn in `design/build_logo.py`; it is not a copy of any Canva or other third-party template, and no template or stock element is embedded. `node` is not needed for it, `python3 design/build_logo.py` (fonttools, brotli) outlines it into `logo.svg`, `icon.svg` and `icon-maskable.svg`. `design/og.html` is the HTML twin of the OG frame, and `node design/render.cjs` renders `og.png` and the PNG icons from it (needs Playwright). Fonts are Newsreader and Inter, self-hosted in `fonts/` under the SIL OFL, so no request leaves the page.

## Storage and safety

- The video module was removed. Any data it saved under `qb.video` stays in the browser untouched; the app no longer reads it.
- `qb.meta` holds the app schema (now 2). On the first run after an upgrade the old keys are copied to `*.bak-v1`. Data from a newer schema is opened read-only and never overwritten.
- Backups are `v: 2` (invoices, logo). Older backups that contain a `video` section still restore the invoices and ignore that section.
- CSV text cells that start with `=`, `+`, `-`, `@`, a tab or a carriage return receive a leading apostrophe before CSV quoting to reduce spreadsheet formula execution risk.

Everyday details:
- With four or more invoices a search box and a status filter (all, unpaid, overdue, paid, quotes) appear above the list. Any invoice can be duplicated as a new draft.
- Invoice and document cards work from the keyboard (Tab, Enter, Space).
- Dark and light themes follow the system, including the browser's own date and number fields. Focus rings show on every control, and the invoice editor, item lines and payment log work at 360px wide. Print output is unchanged.
- If the browser refuses to save (private window, full storage), a banner says so and points to Backup.
- While `checkoutUrl` in `config.js` is still the placeholder, the upgrade dialog hides the buy button and says purchases are not open, instead of sending people to a dead link.

Tests: `npm test` (logic and storage), `node tests/e2e.cjs`, `node tests/e2e-polish.cjs` against `python3 -m http.server 8123`.

## Launch setup

- `config.js` is the one place for the checkout link, support email, price and site address. Terms, privacy, the landing page and the upgrade dialog read it.
- `landing.src.html` is the landing page source. `node design/seo.cjs` renders it into `index.html` and the language pages (`ko/`, `ja/`, `zh/`, `es/`) with canonical and hreflang links, JSON-LD, `sitemap.xml` and `robots.txt`. Edit the source, not `index.html`, and run the script after changing the source, `i18n.js`, `config.js` or the site address.
- `api/license.js` checks Pro keys with Lemon Squeezy's license API. Set `LEMONSQUEEZY_PRODUCT_ID` as an environment variable (Pages Functions read it from `context.env`) to restrict accepted keys to this product. `LEMONSQUEEZY_DISABLED=1` disables server verification; an unavailable endpoint also makes the browser fall back to offline keys. `license.js` is the browser side: keys the server accepted are re-checked about once a week, and only a clear refusal switches Pro off (data is never touched).
- `vercel.json` sets the security headers, including the content security policy. `node tests/serve.cjs` serves the folder with the same headers (and runs the license function) for the e2e tests.
- Steps that need the owner (payment account, domain, environment variables, tax questions) are in `docs/quickbill/launch-checklist.md`; announcement and pilot texts are in `docs/quickbill/copy.md`.

Tests: also `node tests/e2e-license.cjs`, `node tests/e2e-site.cjs` and `node tests/e2e-share.cjs` (client link, payment log, remembered client, saved items).

## 배포 전 검증

설치·빌드·브라우저 검사·Cloudflare 배포 파일 구성은 [PREDEPLOY.md](PREDEPLOY.md)를 참고하세요. `codex/predeploy-2026-11-06` 브랜치의 검증 워크플로에는 배포 단계가 없습니다.
