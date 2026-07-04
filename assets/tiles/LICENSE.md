# Mahjong Tile Images

Source artwork:

https://github.com/FluffyStuff/riichi-mahjong-tiles

Upstream license:

https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/master/LICENSE.md

The upstream repository describes its assets as public domain. Its README says
that all assets are in the public domain.

The app currently renders `assets/tiles/b2/`. That set was generated from the
upstream Regular tile symbols with a custom tile body, side color, shadow,
bezel, and inner line for this app's B2 visual style. In this repository, the
original exported Regular PNG files are kept under `assets/tiles/regular/` for
traceability; the production `dist/` bundle only needs the rendered B2 set.

The tile images are bundled locally so the calculator does not need a remote
image host at runtime.
