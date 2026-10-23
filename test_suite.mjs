import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import server from "./server.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const TEXT_FILES = [
  "server.js",
  "package.json",
  "vercel.json",
  "README.md",
  "api/health.js",
  "api/analyze.js",
  "api/burnout.js",
  "api/community.js",
  "public/favicon.svg",
  "public/index.html",
  "public/privacy.html",
  "public/terms.html",
  "public/styles.css",
  "public/app.js"
];

function runStaticStandardsAudit() {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const purpleRegex = /\b(purple|violet|indigo|fuchsia|magenta)\b|#(?:8b5cf6|7c3aed|9333ea|a855f7|6d28d9|6366f1|c084fc)/i;

  for (const rel of TEXT_FILES) {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `Required file missing: ${rel}`);
    const content = fs.readFileSync(full, "utf8");

    // 1. Zero em dashes anywhere
    assert.ok(!content.includes("\u2014"), `Em dash forbidden in ${rel}`);
    assert.ok(!content.includes("&mdash;"), `HTML em dash entity forbidden in ${rel}`);

    // 2. Zero emojis anywhere
    assert.ok(!emojiRegex.test(content), `Emoji character forbidden in ${rel}`);

    // 3. Zero purple colors or gradients
    assert.ok(!purpleRegex.test(content), `Purple palette forbidden in ${rel}`);
    if (rel.endsWith(".css") || rel.endsWith(".html")) {
      assert.ok(!/linear-gradient|radial-gradient/i.test(content), `Gradients forbidden in ${rel}`);
      assert.ok(!/999px|9999px|border-radius:\s*50px/i.test(content), `Pill border-radius forbidden in ${rel}`);
      assert.ok(!/@keyframes|scroll-behavior:\s*smooth/i.test(content), `Over-the-top animations forbidden in ${rel}`);
      assert.ok(!/<img\b/i.test(content), `Stock / AI-slop images forbidden in ${rel}`);
    }

    // 4. Zero "Made with AI" tag across ALL files with zero exceptions
    assert.ok(!/made with ai|built with ai/i.test(content), `Made-with-AI tag forbidden in ${rel}`);
  }

  // 5. Verify Favicon & Legal links on all HTML pages
  for (const page of ["public/index.html", "public/privacy.html", "public/terms.html"]) {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8");
    assert.match(html, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/favicon\.svg"/, `Favicon missing in ${page}`);
    assert.match(html, /href="\/privacy\.html"/, `Privacy policy link missing in ${page}`);
    assert.match(html, /href="\/terms\.html"/, `Terms link missing in ${page}`);
  }

  // 6. Verify 100% DOM ID & Handler parity between index.html and app.js
  const indexHtml = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
  const appJs = fs.readFileSync(path.join(ROOT, "public/app.js"), "utf8");
  const htmlIds = new Set([...indexHtml.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const jsIds = new Set([...appJs.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]));
  for (const id of jsIds) {
    assert.ok(htmlIds.has(id), `DOM ID "${id}" referenced in app.js missing in index.html`);
  }

  console.log(`Static Standards Audit Passed across all ${TEXT_FILES.length} project files (0 violations).`);
}

async function req(base, route, opts = {}) {
  const res = await fetch(`${base}${route}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function runApiAndRouteTests(base, passNum) {
  for (const r of ["/", "/privacy.html", "/privacy", "/terms.html", "/terms", "/styles.css", "/app.js", "/favicon.svg", "/favicon.ico"]) {
    const res = await req(base, r);
    assert.equal(res.status, 200, `Route ${r} must return 200`);
  }

  const health = await req(base, "/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);

  // Verify zero seeded fake community posts on initial boot
  if (passNum === 1) {
    const initialFeed = await req(base, "/api/community");
    assert.equal(initialFeed.status, 200);
    assert.equal(initialFeed.json.posts.length, 0, "Community feed must start with zero fake seeded entries");
  }

  const rx = await req(base, "/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      text: "Hemoglobin: 9.4 g/dL, Vitamin D3: 11.5 ng/mL, Platelets: 120000, Tab Iron OD PC, Cholecalciferol 60K with milk, Paracetamol SOS, Pantoprazole BBF"
    })
  });
  assert.equal(rx.status, 200);
  assert.equal(rx.json.priority.level, "high");
  assert.ok(rx.json.cards.some(c => c.badge === "TIMING SEPARATION ALERT"));
  assert.ok(!JSON.stringify(rx.json).includes("\u2014"), "API output must contain zero em dashes");

  const emptyRx = await req(base, "/api/analyze", { method: "POST", body: JSON.stringify({ text: "  " }) });
  assert.equal(emptyRx.status, 400);

  const burnout = await req(base, "/api/burnout", {
    method: "POST",
    body: JSON.stringify({ sleep: 5, study: 11, stress: 8, water: 4 })
  });
  assert.equal(burnout.status, 200);
  assert.equal(burnout.json.category, "high_risk");
  assert.ok(!JSON.stringify(burnout.json).includes("\u2014"));

  const postRes = await req(base, "/api/community", {
    method: "POST",
    body: JSON.stringify({
      author: "<script>bad()</script>Samarth",
      tag: "Study Group",
      title: `Physics Formula Practice Session #${passNum}`,
      body: "Library Room B at 5:30 PM."
    })
  });
  assert.equal(postRes.status, 201);
  assert.equal(postRes.json.post.upvotes, 0, "New notice must start with 0 fake upvotes");
  assert.ok(!postRes.json.post.author.includes("<"));

  const voteRes = await req(base, "/api/community", {
    method: "POST",
    body: JSON.stringify({ action: "upvote", id: postRes.json.post.id })
  });
  assert.equal(voteRes.status, 200);
  assert.equal(voteRes.json.post.upvotes, 1);

  console.log(`Pass #${passNum}: All HTTP routes, legal pages, favicon & REST APIs verified.`);
}

runStaticStandardsAudit();
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
try {
  for (let pass = 1; pass <= 3; pass++) {
    await runApiAndRouteTests(`http://127.0.0.1:${port}`, pass);
  }
  console.log("ALL STATIC AUDIT + 3 FULL END-TO-END API PASSES SUCCEEDED WITH ZERO ERRORS.");
} finally {
  server.close();
}
