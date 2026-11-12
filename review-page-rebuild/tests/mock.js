// A stand-in for the page runtime: an in-memory database with live snapshots, and a comments channel that records what is sent.
(function () {
  var store = {}, subs = {}, sent = [], writes = [];
  function coll(name) { return store[name] || (store[name] = {}); }
  function fire(name) { (subs[name] || []).forEach(function (cb) { var c = coll(name); cb({ docs: Object.keys(c).map(function (k) { return { id: k, data: function () { return JSON.parse(JSON.stringify(c[k])); } }; }) }); }); }
  function later(name) { setTimeout(function () { fire(name); }, 0); }
  var db = {
    doc: function (path) { var p = path.split("/"), n = p[0], id = p[1];
      return { set: function (d) { writes.push(["set", path]); coll(n)[id] = JSON.parse(JSON.stringify(d)); later(n); return Promise.resolve(); },
               update: function (d) { writes.push(["update", path]); var c = coll(n); c[id] = Object.assign(c[id] || {}, JSON.parse(JSON.stringify(d))); later(n); return Promise.resolve(); },
               delete: function () { writes.push(["delete", path]); delete coll(n)[id]; later(n); return Promise.resolve(); } }; },
    collection: function (n) { return { onSnapshot: function (cb) { (subs[n] || (subs[n] = [])).push(cb); later(n); } }; }
  };
  var comments = { anchorFor: function () { return Promise.resolve({ a: 1 }); }, canSendToClaude: function () { return Promise.resolve("available"); },
                   sendToClaude: function (m) { sent.push(m.text); return Promise.resolve(); } };
  window.claude = { use: function (k) { return Promise.resolve(k === "db" ? db : comments); } };
  window.__mock = { store: store, sent: sent, writes: writes, db: db, seed: function (data) { Object.keys(data).forEach(function (n) { store[n] = data[n]; }); } };
  if (window.__FIXTURE) window.__mock.seed(window.__FIXTURE);
})();
