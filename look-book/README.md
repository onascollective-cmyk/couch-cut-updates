# The Look Book page

A page the owner opens when they do not remember what they want: every look and every effect, each shown on a few seconds of their own footage. They tap a look, add effects, and send it for the next video.

`page.html` is the page (it uses the shared `/*COUCH_STYLE*/` placeholder, like the review page). It is published once with the `db`, `comments` and `assets` capabilities and then filled by writing documents:

| Document | Fields |
| --- | --- |
| `looks/<look folder>` | `name`, `blurb`, `engine`, `order`, `yours`, `isDefault`, `say`, `clip: {url}`, `poster: {url}` |
| `effects/<id>` | `name`, `blurb`, `group` (Captions, Hooks, Camera, Graphics, Scenes, Sound), `order`, `say`, `isNew`, `clip: {url}`, `poster: {url}` |
| `picks/next` | written by the page: `look`, `effects: [ids]`, `note`, `at`. Read it at the start of "edit this reel", use it, then delete it. |
| `picks/usual` | written by the page: `look`, `at`. Set it as the default look in `brand-kit.md`. |

The page also sends a comment: `Couch Cut look book: for my next video use the look ... with these effects where they fit: ...` or `Couch Cut look book: make ... my usual look from now on.`

It has no examples until the engine draws them. That part is engine work (a command that draws a 4 to 6 second sample of each look and each effect from one of the owner's clips, small like the review copy, and prints the files to upload).

Test: `node test.js <engine folder> page.html` (needs Playwright and `mock.js` from `review-page-rebuild/tests` beside it).
