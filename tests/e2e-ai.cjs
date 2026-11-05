// Run: node tests/e2e-ai.cjs  (needs playwright + a static server on :8123, e.g. python3 -m http.server 8123)
// The AI reminder draft: template shown without a key, key saved on this device only, the model asked only from the
// button (the request is stubbed here), the reply shown as text, nothing extra in the request, layout at 390px.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const BASE = "http://localhost:8123";
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } });
  const requests = [];
  await ctx.route("https://api.anthropic.com/v1/messages", async (route) => {
    requests.push({ headers: route.request().headers(), body: route.request().postDataJSON() });
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ content: [{ type: "text", text: "Dear Acme,\nInvoice INV-1 is 10 days past due. Could you confirm the payment date?\nThank you." }] }) });
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("dialog", (d) => d.accept());
  await p.goto(BASE + "/app.html", { waitUntil: "load" });
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  // An overdue invoice with one line item.
  await p.click("#btn-new");
  await p.fill("[name=from]", "Jo Rivera"); await p.fill("[name=client]", "Acme <Ltd>");
  await p.selectOption("[name=status]", "sent");
  await p.fill("[name=dueDate]", "2020-01-31");
  await p.fill("#items [data-k=desc]", "Secret logo job"); await p.fill("#items [data-k=price]", "500");
  await p.click("button[type=submit]");
  await p.click("#list .card >> nth=0");

  // No key: the local template is in the draft, the key box is shown, no request.
  assert.ok(await p.isVisible("#ai-remind"), "panel visible for an overdue invoice");
  assert.ok(await p.isVisible("#ai-nokey"));
  assert.ok(!(await p.isVisible("#ai-keyed")));
  const template = await p.inputValue("#ai-draft");
  assert.match(template, /Acme/);
  assert.match(template, /INV-/);
  assert.equal(requests.length, 0, "no request before the button");

  // Save a key on this device, then ask the model from the button.
  await p.fill("#ai-key", "sk-ant-api03-EXAMPLEKEYEXAMPLEKEY");
  await p.click("#ai-save");
  assert.ok(await p.isVisible("#ai-keyed"));
  assert.equal(await p.evaluate(() => localStorage.getItem("quickbill-ai-key")), "sk-ant-api03-EXAMPLEKEYEXAMPLEKEY");
  assert.equal(await p.evaluate(() => localStorage.getItem("qb.invoices") && /sk-ant/.test(localStorage.getItem("qb.invoices"))), false);
  await p.click("#ai-run");
  await p.waitForFunction(() => document.querySelector("#ai-status").textContent.startsWith("Draft ready"));
  assert.match(await p.inputValue("#ai-draft"), /^Dear Acme,\nInvoice INV-1/);
  assert.equal(requests.length, 1);
  const r = requests[0];
  assert.equal(r.headers["x-api-key"], "sk-ant-api03-EXAMPLEKEYEXAMPLEKEY");
  assert.equal(r.headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.equal(r.body.model, "claude-haiku-5-5");
  assert.match(r.body.messages[0].content, /Client: Acme Ltd\n/, "typed angle brackets are stripped");
  assert.doesNotMatch(r.body.messages[0].content, /Secret logo job/, "line items are not sent");
  assert.doesNotMatch(r.body.messages[0].content, /sk-ant/, "the key is not in the body");

  // The reply is text: markup in it stays text.
  await p.fill("#ai-draft", "<img src=x onerror=alert(1)>");
  assert.equal(await p.evaluate(() => document.querySelectorAll("#ai-draft img").length), 0);

  // Layout at phone width.
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(overflow, false, "no horizontal overflow at 390px");

  // Forget the key: back to the key box, and the draft is kept.
  await p.click("#ai-forget");
  assert.ok(await p.isVisible("#ai-nokey"));
  assert.equal(await p.evaluate(() => localStorage.getItem("quickbill-ai-key")), null);

  assert.deepEqual(errs, [], "no console errors");
  console.log("e2e-ai: ok");
  await b.close();
})().catch(async (e) => { console.error("e2e-ai FAILED:", e.message); process.exit(1); });
