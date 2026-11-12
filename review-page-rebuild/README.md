# Review page and script check widget, rebuilt for speed

Two drop in replacements for the engine's source copy. Nothing here is live: customers only get it when it ships in a signed update.

| File here | Replaces | Notes |
| --- | --- | --- |
| `page.html` | `toolbox/review-page/page.html` | Same placeholders (`/*COUCH_STYLE*/`, `/*REVIEW_STYLE*/`, `/*WORDPICKER_CSS*/`, `/*WORDPICKER_JS*/`, `<!--EXTRA_LINKS-->`), same database documents, same messages to Claude. `couch.css`, `review.css` and `engine/wordpicker.py` are unchanged. |
| `chat-widget.html` | the `_WIDGET` text in `engine/scriptcheck.py` | Same placeholders (`__WP_CSS__`, `__WP_JS__`, `__DATA__`) and the same `sendPrompt` messages. |

## What changed

Both pages used to build the whole card again on every press. Now a card is built once and only the piece that changed is touched.

Measured on a 60 line script (40 word taps, headless Chromium, phone size):

| | Before | After |
| --- | --- | --- |
| Review page: time for 40 taps | 572 ms | 40 ms |
| Review page: page pieces built | 54,960 | 720 |
| Chat widget: time for 40 taps | 546 ms | 20 ms |

Bugs in the old review page that this fixes (each one is reproduced by the tests):

1. **A Send or a Looks good could be silently undone.** Typing in any box and pressing Send or Looks good within 0.8 seconds let the late draft save land after the press, so `answers/<name>.status` went back to `draft`. The message still went out, but the card went back to "your turn" and a worker that reads `answers/<name>` first saw a draft.
2. **The Looks good confirm rebuilt the card twice** (on the first tap and again 5 seconds later), which restarted the review video and threw the cursor out of the box being typed in. Keys typed after that were lost.
3. **Every choice restarted the videos and songs on the card** (picking a style, a chip, a song, Cut, a word).
4. **A change from Claude to a card being typed in** (a caption added, say) dropped the cursor. The cursor and a playing video are now carried over.
5. Every look preview played at once. They now play only while on screen.
6. A draft was written to the database on every word tap, even when nothing had changed. It is now written only when the answer changed, and at once when the page is hidden or closed.
7. Progress notes (`build`) rebuilt the card. They now repaint only the status slip.

## Optional: the short data form for the chat widget

Claude has to type the whole chat widget into the chat every time, so its size is what makes it slow to appear. Most of that size is the word list. `chat-widget.html` also accepts a short row:

```
{"n": 3, "t": "0:07", "s": 2.4, "kept": true, "i0": 24, "x": ["so", "the", "thing"], "out": {"26": "engine"}, "sty": {"25": {"color": "butter", "font": "handwriting"}}}
```

`x` is the words in order, `i0` the number of the first word, `out` the words already taken out (and by whom), `sty` the styled words. `why` and `note` only when there is one. In the test script this took the data from 44 KB to 10 KB. The long form still works, so `scriptcheck.widget()` can switch whenever it suits.

## Putting it in

1. Copy `page.html` over `toolbox/review-page/page.html`. Paste `chat-widget.html` in as `_WIDGET` in `engine/scriptcheck.py`.
2. `./reel review page`, then publish `reels/_review/page/index.html` to the SAME link (`page_url`), with the same capabilities.
3. Check one card of each kind on a phone: pick, review, waiting, being built.

## Tests

`tests/` drives the old and the new page through the same presses with a stand in for the page database and compares what each one sends. They need Node with Playwright, plus `wp.css` and `wp.js` (the `CSS` and `JS` texts from `engine/wordpicker.py`) in the same folder.

```
python3 build.py <page.html> out.html <engine folder> wp.css wp.js --mock
node run.js out.html result.json      # the main scenario
node extra.js out.html                # typing while Claude updates the card, a press right after typing, a new round
node chat.js <chat widget template> long|short
```
