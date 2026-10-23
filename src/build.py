"""Rebuild ../index.html from the source parts. Run: python src/build.py"""
import pathlib
d = pathlib.Path(__file__).parent
parts = ["head.html", "style.css", "body.html", "game.js", "tail.html"]
out = "".join((d / p).read_text(encoding="utf-8") for p in parts)
(d.parent / "index.html").write_text(out, encoding="utf-8")
print(f"index.html rebuilt ({len(out):,} characters)")
