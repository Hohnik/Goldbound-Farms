# Goldbound Farms

Interactive map of Pathalerix's farms and experiments. The website contains 793 reviewed records from 38 videos and 45 caption tracks. Values are historical transcript results.

## Run and host

```sh
cd dashboard
npm run dev
```

Open `http://localhost:4173/#map`. Node.js is required for local development; there are no npm dependencies to install.

```sh
npm run check
npm test
npm run build
```

Upload the contents of `dashboard/dist/` to your static host. Relative asset paths support a domain root or project subfolder. The website is static and requires no database, backend or API keys. Hash navigation needs no routing rewrites. Fonts and item tooltips use Google Fonts and Wowhead.

## GitHub Pages

The `Deploy GitHub Pages` workflow validates and builds the atlas, then deploys only `dashboard/dist/` on pushes to `main`. It can also be run manually from the Actions tab. Pages uses GitHub Actions as its publishing source.

- Website: https://Hohnik.github.io/Goldbound-Farms/
- Repository: https://github.com/Hohnik/Goldbound-Farms

## Maintain the data

- `dashboard/public/`: website code and compiled data.
- `audit/reviews/`: authoritative episode records. Edit these to correct farms, values, evidence references or short `guide` explanations (maximum 55 words).
- `audit/source-index.json`: transcript paragraphs, timestamps and source fingerprints.
- `audit/alternate-reviews.json`: alternate-caption checks.
- `goldbound/`: one readable copy of each transcript; `original-vtt/` preserves original captions for verification.
- `scripts/`: data compilation, item lookup generation and source reading.
- `dashboard/data/`: licensed map originals and item lookup inputs.

Guide instructions should follow the referenced transcript passages. If a guide needs a passage outside its record’s range, add `guide_source_refs` with the episode, paragraph range and start time; the compiler validates these and the evidence panel includes them.

After editing reviewed records:

```sh
python3 scripts/compile_audit.py
python3 scripts/build_item_tooltips.py
cd dashboard
npm run check
npm test
npm run build
```

Edit method associations in `dashboard/public/method-groups.json`, and item aliases in `dashboard/data/item-tooltip-overrides.json`. Regenerate map geometry with `python3 dashboard/map-data.py`. Read a transcript section with `python3 scripts/read_episode.py 34 1 5`.

The reviewed paragraph numbering in `audit/source-index.json` is stable and used by evidence references. The compiler regenerates readable transcripts from this index and verifies the original captions by SHA-256. Preserve paragraph numbers when correcting text. The compiler currently validates the reviewed 38-video / 45-track corpus; extend that validation when adding episodes.

Build output in `dashboard/dist/` is generated and ignored by Git. Preserve the map attribution and CC BY-SA license links; see [map attribution](dashboard/data/MAP-ATTRIBUTION.md). See [dashboard behavior](dashboard/README.md) and [tooltip maintenance](audit/ITEM-TOOLTIPS.md).
