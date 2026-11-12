"""Assemble a review page the way engine/review.py does, plus a fake window.claude for tests.
usage: build.py <page.html template> <out.html> <x050 dir> <wp.css> <wp.js> [--mock]"""
import sys, json, pathlib
tpl, out, root, wpcss, wpjs = sys.argv[1:6]
root = pathlib.Path(root)
COLORS = {"butter": "#FFEB99", "mint": "#B9EBD6", "blue": "#BFE4F7", "white": "#FFFFFF", "cream": "#F4E9D6"}
LABELS = {"handwriting": "Handwriting", "script": "Script", "serif": "Serif", "sans": "Plain"}
js = pathlib.Path(wpjs).read_text().replace("__COLORS__", json.dumps(COLORS)).replace("__LABELS__", json.dumps(LABELS))
page = pathlib.Path(tpl).read_text()
page = page.replace("/*COUCH_STYLE*/", (root / "toolbox/review-page/couch.css").read_text())
page = page.replace("/*REVIEW_STYLE*/", (root / "toolbox/review-page/review.css").read_text())
page = page.replace("/*WORDPICKER_CSS*/", pathlib.Path(wpcss).read_text()).replace("/*WORDPICKER_JS*/", js)
if "--mock" in sys.argv:
    page = "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><script>" + pathlib.Path(__file__).with_name("mock.js").read_text() + "</script>" + page
    page = page.replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link rel="x-off" href="https://fonts.googleapis.com')
pathlib.Path(out).write_text(page)
print(out, len(page))
