// Runs the chat script check widget (old or new template, long or short data) through the same presses and prints what it sends.
const { chromium } = require('playwright'); const fs = require('fs'); const fixture = require('./fixture.js');
const [tpl, mode] = process.argv.slice(2);
const COLORS = { butter: "#FFEB99", mint: "#B9EBD6", blue: "#BFE4F7", white: "#FFFFFF", cream: "#F4E9D6" }, LABELS = { handwriting: "Handwriting", script: "Script", serif: "Serif", sans: "Plain" };
let rows = fixture().videos['couch-studio'].rows;
if (mode === 'short') rows = rows.map(r => { const out = {}, sty = {}; r.words.forEach(w => { if (w.d) out[w.i] = w.by || 'owner'; if (w.s) sty[w.i] = w.s; });
  const o = { n: r.n, t: r.t, s: r.s, kept: r.kept, i0: r.words[0].i, x: r.words.map(w => w.w) }; if (r.why) o.why = r.why; if (Object.keys(out).length) o.out = out; if (Object.keys(sty).length) o.sty = sty; return o; });
const D = { rows, length: 131.4, mode: 'teaching', pick: { look: 'Sunny Days', runner: 'Bold', why: ['A calm single message.'] }, did: ['You asked for a pop sound.'] };
const data = JSON.stringify(D).replace(/<\//g, '<\\/');
const html = fs.readFileSync(tpl, 'utf8').replace('__WP_CSS__', fs.readFileSync('wp.css', 'utf8')).replace('__WP_JS__', fs.readFileSync('wp.js', 'utf8').replace('__COLORS__', JSON.stringify(COLORS)).replace('__LABELS__', JSON.stringify(LABELS))).replace('__DATA__', () => data);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 700, height: 900 } }); const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.setContent('<!doctype html><script>window.__sent=[];function sendPrompt(t){window.__sent.push(t);}</script><body>' + html + '</body>');
  const taps = await p.evaluate(() => { let added = 0; const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { added += 1 + (n.querySelectorAll ? n.querySelectorAll('*').length : 0); }))); mo.observe(document.body, { childList: true, subtree: true });
    const ids = Array.from(document.querySelectorAll('[data-wp-i]')).map(e => e.dataset.wpI).filter((x, i) => i > 90 && i % 3 === 0).slice(0, 40); const t0 = performance.now();
    ids.forEach(i => { document.querySelector('[data-wp-i="' + i + '"]').click(); document.body.offsetHeight; }); const ms = performance.now() - t0;
    return new Promise(r => setTimeout(() => { mo.disconnect(); r({ ms: Math.round(ms), nodesBuilt: added }); }, 30)); });
  await p.click('[data-wp="desel"]');
  await p.click('#ok');
  await p.fill('[data-note="3"]', 'make it "short"'); await p.focus('[data-note="3"]');
  await p.click('[data-keep="2"]'); await p.click('[data-keep="4"]');
  const noteKept = await p.evaluate(() => document.querySelector('[data-note="3"]').value);
  await p.click('[data-wp-i="30"]'); await p.click('[data-wp="remove"]');
  await p.click('[data-wp-i="40"]'); await p.click('[data-wp="color:mint"]'); await p.click('[data-wp="font:serif"]'); await p.click('[data-wp="desel"]');
  await p.click('[data-wp-i="5"]'); await p.click('[data-wp="back"]');
  // grab line 5 and drop it above line 1, then line 2 to the end
  await p.evaluate(() => { function ev(t, el, y) { const e = new Event(t, { bubbles: true, cancelable: true }); e.clientY = y; e.dataTransfer = { setData() {}, effectAllowed: '' }; el.dispatchEvent(e); }
    const row = n => document.querySelector('.row[data-n="' + n + '"]');
    ev('dragstart', row(5).querySelector('.handle'), 0); const b1 = row(1).getBoundingClientRect(); ev('dragover', row(1), b1.top + 2); ev('drop', row(1), b1.top + 2);
    ev('dragstart', row(2).querySelector('.handle'), 0); ev('dragover', document.getElementById('endzone'), 0); ev('drop', document.getElementById('endzone'), 0); });
  await p.fill('#fix', 'Glowmarc = Glowmark'); await p.fill('#extra', 'add a "pop"');
  const view = await p.evaluate(() => ({ len: document.getElementById('len').textContent, sheet: document.getElementById('sheet').innerText.slice(0, 120), first: Array.from(document.querySelectorAll('.row')).slice(0, 3).map(r => r.dataset.n).join(','), last: document.querySelector('.row:last-child').dataset.n, why2: document.querySelector('.row[data-n="2"] .why').textContent, btn4: document.querySelector('[data-keep="4"]').textContent }));
  await p.click('#send'); await p.click('#reset'); await p.click('#ok');
  const sent = await p.evaluate(() => window.__sent);
  console.log(JSON.stringify({ bytes: html.length, dataBytes: data.length, taps, noteKept, view, sent, errors }));
  await b.close();
})();
