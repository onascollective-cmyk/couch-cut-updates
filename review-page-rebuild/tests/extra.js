// Extra checks on the rebuilt page: Claude changes a card while you type in it, and a phone screenshot.
const { chromium } = require('playwright'); const fs = require('fs'); const fixture = require('./fixture.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.route('**/*', r => r.request().url().endsWith('/page.html') ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(process.argv[2], 'utf8') }) : r.fulfill({ status: 200, body: '' }));
  await p.addInitScript(f => { window.__FIXTURE = f; }, fixture());
  await p.goto('http://test.local/page.html'); await p.waitForSelector('#card-pack-with-me'); await p.waitForTimeout(200);
  await p.click('#extra-couch-studio'); await p.keyboard.type('hello wor');
  await p.evaluate(() => { document.querySelector('#card-couch-studio video.cuts').__mark = 1; const v = window.__mock.store.videos['couch-studio']; v.caption = 'new caption'; window.__mock.db.doc('videos/couch-studio').set(v); });
  await p.waitForTimeout(150); await p.keyboard.type('ld');
  const r1 = await p.evaluate(() => ({ value: document.getElementById('extra-couch-studio').value, focus: document.activeElement.id, cutsKept: !!document.querySelector('#card-couch-studio video.cuts').__mark, caption: !!document.querySelector('#card-couch-studio .caption') }));
  // type then send at once: the late draft must not undo the send
  await p.click('#card-couch-studio .style:nth-child(1)'); await p.fill('#note-couch-studio-1', 'x'); await p.click('#card-couch-studio .btn.primary'); await p.waitForTimeout(1200);
  const r2 = await p.evaluate(() => window.__mock.store.answers['couch-studio'].status);
  // a new round arrives: the card starts clean
  await p.evaluate(() => { const v = window.__mock.store.videos['couch-studio']; v.round = 2; v.stage = 'review'; v.review = { url: '/v.mp4?r2', look: 'notebook', length: 30 }; window.__mock.db.doc('videos/couch-studio').set(v); });
  await p.waitForTimeout(150);
  const r3 = await p.evaluate(() => ({ pill: document.querySelector('#card-couch-studio .pill').textContent, extra: document.getElementById('extra-couch-studio').value, cards: Array.from(document.querySelectorAll('#list .card')).map(c => c.id) }));
  await p.click('#card-couch-studio summary >> nth=0'); await p.click('#card-couch-studio [data-wp-i="2"]');
  await p.screenshot({ path: 'shot-review.png', fullPage: false });
  await p.locator('#card-couch-studio').screenshot({ path: 'shot-card.png' }).catch(() => {});
  console.log(JSON.stringify({ r1, afterQuickSend: r2, r3, errors }, null, 1)); await b.close();
})();
