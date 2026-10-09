# Azeroth map outlines

The map geometry in `public/map-data.json` is adapted from Syrio's openly licensed maps:

- Eastern Kingdoms (April 13, 2020): https://commons.wikimedia.org/wiki/File:Eastern_Kingdoms.svg
- Kalimdor (April 13, 2020): https://commons.wikimedia.org/wiki/File:Kalimdor_english.svg

Both are licensed under Creative Commons Attribution-ShareAlike 4.0 International:
https://creativecommons.org/licenses/by-sa/4.0/

Adaptations: original path geometry extracted; text, clip paths and duplicate outlines removed; colors replaced with dashboard performance values; interactive zone labels and controls added; maps repositioned and resized. The map adaptation and its geometry are distributed under CC BY-SA 4.0. This license does not change the license of unrelated dashboard code or transcript content.

`data/eastern-kingdoms-original.svg` and `data/kalimdor-original.svg` preserve the source geometry. `map-data.py` regenerates the map JSON. The visual map itself also credits Syrio and links to the license.

Vashj'ir, Darkmoon Island and continent-wide methods are separate controls because they are not represented by these mainland polygons. The diagram uses a 2020 geographic source, not a live game navigation map.
