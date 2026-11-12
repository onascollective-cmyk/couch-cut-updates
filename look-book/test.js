// Look Book test: fills it with looks and effects, taps through it, and checks what it saves and sends.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const root = process.argv[2], tpl = fs.readFileSync(process.argv[3], 'utf8');
  const html = "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><script>" + fs.readFileSync(path.join(__dirname, 'mock.js'), 'utf8') + "</script>" +
    tpl.replace('/*COUCH_STYLE*/', fs.readFileSync(root + '/toolbox/review-page/couch.css', 'utf8')).replace('rel="stylesheet" href="https://fonts.googleapis', 'rel="x" href="https://fonts.googleapis');
  const fx = {}; [['karaoke', 'Lit up words', 'Captions'], ['punch', 'Punch in', 'Camera'], ['cover', 'Big letters behind you', 'Graphics'], ['notes', 'Sticky notes', 'Scenes'], ['glass', 'Frosted glass letters', 'Graphics']]
    .forEach((e, i) => fx[e[0]] = { name: e[1], group: e[2], order: i, blurb: 'What it does.', say: 'add ' + e[1].toLowerCase(), isNew: i === 4, clip: i === 3 ? null : { url: '/v.mp4?' + e[0] } });
  const fixture = { looks: { 'sunny-days': { name: 'Sunny Days', order: 1, yours: true, isDefault: true, blurb: 'Clean and modern.', say: 'edit this reel in Sunny Days', clip: { url: '/v.mp4?1' } },
      notebook: { name: 'Notebook', order: 2, blurb: 'Hand drawn and friendly.', say: 'edit this reel in Notebook', clip: { url: '/v.mp4?2' } }, bold: { name: 'Bold', order: 3, blurb: 'Loud and editorial.', say: 'do it in Bold', clip: { url: '/v.mp4?3' } } }, effects: fx, picks: {} };
  const b = await chromium.launch(); const errors = [];
  for (const [w, h, shotName] of [[390, 844, 'lb-phone.png'], [1100, 800, 'lb-wide.png']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage(); p.on('pageerror', e => errors.push(String(e)));
    await p.route('**/*', r => r.request().url().endsWith('/page.html') ? r.fulfill({ contentType: 'text/html', body: html }) : r.fulfill({ status: 200, body: '' }));
    await p.addInitScript(f => { window.__FIXTURE = f; }, fixture);
    await p.goto('http://test.local/page.html'); await p.waitForSelector('#look-grid .tile'); await p.waitForTimeout(150);
    await p.evaluate(() => { document.querySelector('#look-grid video').__mark = 1; });
    await p.click('#use'); const errText = await p.locator('#status').innerText();
    await p.click('#look-grid .tile:has-text("Notebook")');
    await p.click('#tab-effects'); await p.click('#groups .chip:has-text("Graphics")');
    const shown = await p.locator('#effect-grid .tile:visible').count();
    await p.click('#effect-grid .tile:has-text("Frosted glass")'); await p.click('#groups .chip:has-text("All")'); await p.click('#effect-grid .tile:has-text("Punch in")');
    await p.click('#tray summary'); await p.fill('#note', 'keep it "calm"'); await p.click('#tray summary'); await p.screenshot({ path: shotName });
    await p.click('#use'); await p.waitForTimeout(150); await p.click('#tray summary'); await p.click('#usual'); await p.waitForTimeout(150); await p.click('#tab-looks');
    const r = await p.evaluate(() => ({ sent: window.__mock.sent, picks: window.__mock.store.picks, mine: document.getElementById('mine').textContent, status: document.getElementById('status').textContent, videoKept: !!document.querySelector('#look-grid video').__mark, scrollX: document.documentElement.scrollWidth > innerWidth }));
    Object.values(r.picks).forEach(d => delete d.at);
    console.log(JSON.stringify({ w, errText, shown, ...r }, null, 1));
  }
  console.log('errors', errors); await b.close();
})();
