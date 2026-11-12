// Drives one build of the review page through the same presses and reports what it sent and how much work it did.
const { chromium } = require('playwright'); const fs = require('fs'); const fixture = require('./fixture.js');
(async () => {
  const file = process.argv[2], out = process.argv[3];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); const errors = [];
  p.on('pageerror', e => errors.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await p.route('**/*', r => { const u = r.request().url();
    if (u.endsWith('/page.html')) return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(file, 'utf8') });
    return r.fulfill({ status: 200, contentType: /mp3/.test(u) ? 'audio/mpeg' : /jpg/.test(u) ? 'image/jpeg' : 'video/mp4', body: '' }); });
  await p.addInitScript(f => { window.__FIXTURE = f; }, fixture());
  await p.goto('http://test.local/page.html'); await p.waitForSelector('#card-pack-with-me'); await p.waitForTimeout(300);
  const res = { file, errors };
  // 1. how much work 40 word taps cost
  res.taps = await p.evaluate(() => {
    let added = 0; const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { added += 1 + (n.querySelectorAll ? n.querySelectorAll('*').length : 0); })));
    mo.observe(document.body, { childList: true, subtree: true });
    const card = document.getElementById('card-couch-studio'); card.querySelector('video.cuts').__mark = 1; card.querySelector('.style video').__mark = 1;
    const t0 = performance.now();
    const ids = Array.from(card.querySelectorAll('[data-wp-i]')).map(e => e.dataset.wpI).filter((x, i) => i > 90 && i % 3 === 0).slice(0, 40);
    for (let k = 0; k < 40; k++) { const w = document.querySelector('#card-couch-studio [data-wp-i="' + ids[k] + '"]'); w.click(); document.body.getBoundingClientRect(); document.body.offsetHeight; }
    const ms = performance.now() - t0;
    return new Promise(r => setTimeout(() => { mo.disconnect(); r({ ms: Math.round(ms), nodesBuilt: added }); }, 50));
  });
  await p.click('#card-couch-studio [data-wp="desel"]');
  // 2. a full pick answer
  const card = '#card-couch-studio';
  await p.click(`${card} .style:nth-child(2)`);
  await p.click(`${card} .style:nth-child(2) .frames`);
  res.boardShown = await p.locator(`${card} .board img`).count();
  await p.click(`${card} button[aria-label="Cut line 2"]`);
  await p.click(`${card} button[aria-label="Put back line 4"]`);
  await p.click(`${card} [data-wp-i="30"]`); await p.click(`${card} [data-wp="remove"]`);
  await p.click(`${card} [data-wp-i="40"]`); await p.click(`${card} [data-wp="color:mint"]`); await p.click(`${card} [data-wp="font:serif"]`); await p.click(`${card} [data-wp="desel"]`);
  await p.click(`${card} [data-wp-i="5"]`); await p.click(`${card} [data-wp="back"]`);
  await p.fill(`#note-couch-studio-3`, 'make this "shorter"');
  await p.click(`${card} .chip:has-text("A carousel")`);
  await p.fill(`#ctx-couch-studio`, 'for new moms');
  await p.click(`${card} .track:has-text("Bounce") .tn`);
  await p.locator(`${card} .vol input`).evaluate(e => { e.value = 50; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click(`${card} .chip:has-text("A few GIFs")`);
  await p.fill(`#extra-couch-studio`, 'use CAP-06');
  res.sheet = (await p.locator('#sheet-couch-studio').innerText()).slice(0, 160);
  res.kept = await p.evaluate(() => ({ cuts: !!document.querySelector('#card-couch-studio video.cuts').__mark, preview: !!document.querySelector('#card-couch-studio .style video').__mark }));
  await p.waitForTimeout(1000);
  res.draft = await p.evaluate(() => { const a = JSON.parse(JSON.stringify(window.__mock.store.answers['couch-studio'] || null)); if (a) delete a.saved; return a; });
  await p.click(`${card} .btn.primary`); await p.waitForTimeout(200);
  res.pickPill = await p.locator(`${card} .pill`).innerText();
  // 3. review round: type, press Looks good once, wait out the confirm, then approve
  const rv = '#card-morning-routine';
  await p.evaluate(() => { document.querySelector('#card-morning-routine video.main').__mark = 1; });
  await p.click(`${rv} .btn.done`);
  res.confirmLabel = await p.locator(`${rv} .btn.done`).innerText();
  await p.click(`#extra-morning-routine`); await p.keyboard.type('louder end');
  await p.waitForTimeout(5300);
  res.afterConfirm = await p.evaluate(() => ({ videoKept: !!document.querySelector('#card-morning-routine video.main').__mark, stillTyping: document.activeElement && document.activeElement.id, label: document.querySelector('#card-morning-routine .btn.done').textContent }));
  await p.keyboard.type('!');
  res.extraValue = await p.locator('#extra-morning-routine').inputValue();
  await p.locator(`${rv} .vol input`).evaluate(e => { e.value = 20; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click(`${rv} .btn.done`); await p.click(`${rv} .btn.done`); await p.waitForTimeout(200);
  res.reviewPill = await p.locator(`${rv} .pill`).innerText();
  // 4. Claude posts progress on the one being built
  await p.click('#card-pack-with-me .stbtn');
  await p.evaluate(() => { const v = window.__mock.store.videos['pack-with-me']; v.build.step = 3; window.__mock.db.doc('videos/pack-with-me').set(v); });
  await p.waitForTimeout(200);
  res.stage = await p.locator('#card-pack-with-me .stage').innerText();
  // 5. a new video request and a priority press
  await p.fill('#nv-text', 'the beach one'); await p.click('#nv-go'); await p.waitForTimeout(200);
  await p.click('#orderlist button:has-text("Make priority") >> nth=0'); await p.waitForTimeout(200);
  res.order = await p.locator('#orderlist li').allInnerTexts();
  const m = await p.evaluate(() => window.__mock);
  res.sent = m.sent.map(s => s.replace(/\(r[a-z0-9]+\)/g, '(rID)'));
  res.writes = m.writes.map(w => w.join(' ').replace(/\/r[a-z0-9]{9,}$/, '/rID'));
  res.answers = Object.fromEntries(Object.entries(m.store.answers).map(([k, v]) => { delete v.saved; return [k, v]; }));
  res.order = res.order.map(s => s.replace(/\d+:\d+\s?[AP]M/g, 'TIME'));
  fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
  console.log(JSON.stringify({ taps: res.taps, kept: res.kept, afterConfirm: res.afterConfirm, extraValue: res.extraValue, errors: res.errors, writes: res.writes.length }, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
