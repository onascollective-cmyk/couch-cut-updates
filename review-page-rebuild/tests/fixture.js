// Three cards: a pick with three look previews and a long script, a review round, and one being built.
module.exports = function () {
  var WORDS = "so the thing nobody tells you about filming at home is that your couch is honestly the best studio you will ever have".split(" ");
  function rows(n, per) { var out = [], i = 0;
    for (var r = 1; r <= n; r++) { var ws = [];
      for (var k = 0; k < per; k++) { ws.push({ i: i, w: WORDS[(i * 7 + r) % WORDS.length], d: (i % 37 === 5), by: (i % 37 === 5) ? "engine" : "", s: (i % 53 === 9) ? { color: "butter", font: "handwriting" } : null }); i++; }
      var kept = r % 9 !== 4;
      out.push({ n: r, t: kept ? "0:" + String(r).padStart(2, "0") : "cut", s: 2.4, kept: kept, why: kept ? "" : "said again right away: the later try is the last take, so that one stays", note: "", text: ws.map(function (w) { return w.w; }).join(" "), words: ws }); }
    return out; }
  var looks = [["sunny-days", "Sunny Days"], ["notebook", "Notebook"], ["bold", "Bold"]];
  return { videos: {
      "couch-studio": { name: "Couch studio", round: 1, stage: "pick", order: 1, recommended: "sunny-days", recommendedWhy: "A calm single message.", lookNames: { "sunny-days": "Sunny Days", "notebook": "Notebook", "bold": "Bold" },
        styles: looks.map(function (l) { return { id: l[0], url: "/v.mp4?" + l[0], blurb: "A look.", board: { url: "/b.jpg?" + l[0], frames: [{ n: 1, what: "the hook" }] } }; }),
        cuts: { url: "/v.mp4?cuts" }, rows: rows(60, 12), did: ["You asked for a pop sound. I added it."], askCarousel: true, askGifs: true,
        musicChoices: [{ id: "m1", name: "Morning", mood: "soft", url: "/a.mp3?1" }, { id: "m2", name: "Bounce", mood: "happy", url: "/a.mp3?2" }] },
      "morning-routine": { name: "Morning routine", round: 2, stage: "review", order: 2, lookNames: { "notebook": "Notebook" }, review: { url: "/v.mp4?review", look: "notebook", length: 41.2, music: { name: "Morning", volume: 35 } },
        rows: rows(30, 10), caption: "A caption.\n#one #two #three #four #five" },
      "pack-with-me": { name: "Pack with me", round: 1, stage: "building", order: 3, rows: rows(10, 8),
        build: { stages: ["Applying your changes", "Checking the cuts and the sound", "Drawing the video"], step: 2, startedAt: new Date(Date.now() - 120000).toISOString(), etaAt: new Date(Date.now() + 200000).toISOString(), updatedAt: new Date().toISOString(), note: "" } } },
    answers: {}, requests: {}, refresh: {}, priority: {} };
};
