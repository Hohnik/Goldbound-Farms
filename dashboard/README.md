# Goldbound — the farm atlas

The map is the main surface. Explore Azeroth → region → method → recorded run → evidence, or search the whole atlas to jump directly to a farm, item or region.

## Run and validate

Run `npm run dev` and open `http://localhost:4173/#map`. The local server reads updated assets directly. `npm run check`, `npm test` and `npm run build` validate syntax, earnings, tooltip matching and atlas models, then build the static website.

## Progressive disclosure

Region cards show one clearly scoped result. Related runs and variants expand underneath. Farm details start with the return, sample duration, preparation and any specific limitation. Earnings breakdowns, quantities, review notes, related components and transcript evidence are closed by default. Source paragraphs load when evidence is opened. Searching for a specific item opens the section containing it.

All **793 original records** remain available. The **38 explicit method families** connect **102 related records**. Other entries remain separate, except exact same-name records in the same zone and activity type. Routes, normal/heroic difficulties and independent experiments are not merged by fuzzy names. Associations and a few source-backed preparation hints live in `public/method-groups.json`; they change presentation, not source data.

Returning to a region preserves search, tabs, result type, sort, pagination, expanded histories and scroll position. Deep links preserve continent, zone, record, result type, activity type, query, sorting and map layer. Legacy `values=estimate` links retain a valued-record filter.

## Search and comparisons

The search button or Cmd/Ctrl+K opens region, item and method results. Arrow keys, Enter and Escape navigate the search. Item aliases use the verified tooltip lookup and relevant record metadata.

Region filters distinguish hourly figures, item quotes, actual sales and batch/other values. Selecting a highest-value sort selects its category. Rankings use lower range endpoints. Upper-bound-only and qualitative figures remain visible but unranked. Sale rankings compare receipts in gold; per-item receipts are unranked. Asking prices and gross receipts are labelled explicitly and do not become profit claims.

GPH rankings and the recorded-GPH map use recorded/derived farming tests. Lucky sessions, future-price projections, expected-value models, processing-only/active-time extrapolations, upper-bound-only figures and component rates are excluded from ranking. These figures stay available in the breakdown. Separate scopes keep labels such as raw/vendor gold, recorded valuation, calculated appraisal, processing only or expected-value model.

## Map layers and mobile

The map offers farm count, recorded GPH and rare-loot quote layers. Five color bands rank nonzero values relative to the mapped regions; neutral means absent data and orange means selection. Hover/focus previews show method counts and a leading relevant result. Entering a region from a GPH or rare-loot map selects the corresponding journal filter and sort. Region names stay hidden on the map.

Rare-loot values come from named item quotes and explicitly priced rare-target records. Historical quotes include unobtained targets and are not repeatable farming income. Offshore/shared regions remain available through map controls and global search.

On a phone, a selected region reduces the map to a **142px locator** above a scrolling journal. Expand map restores an interactive map and layer controls. Back/close controls stay visible. The first farm is visible in the initial viewport at 390×844. Desktop keeps map and journal side by side. Keyboard interaction and reduced-motion support remain available.

Secondary labels, quote/component badges, notes and controls use darker colors. Representative small-text contrast pairs measure above 4.5:1. This is targeted verification, not a complete accessibility conformance audit.

## Data and tooltips

- `public/atlas-model.js`: grouping, filtering, ranking, result labels, durations and preparation rules.
- `public/earnings.js`: explicit monetary allowlists, quoted prices, sale bounds and component provenance.
- `public/item-tooltips.json`: verified Retail item IDs. Hover/focus shows Wowhead's tooltip; Escape dismisses it. Unresolved names stay plain text. Rebuild with `python3 ../scripts/build_item_tooltips.py`.
- `public/audit-data.json`: original 793 source-linked records.
- `public/audit-sources.json`: all 45 caption tracks, paragraph indexes and evidence times; loaded on demand.

Values are historical transcript results, not current EU market benchmarks. The atlas does not fetch live auction-house prices.

Map attribution: `data/MAP-ATTRIBUTION.md`, Syrio / CC BY-SA 4.0. Original sources remain in `../goldbound/` and `../audit/`.

Regenerate source data with `python3 ../scripts/compile_audit.py`. Method associations and the atlas model are independent of compilation.

Host the contents of `dist/` at a domain root or project subfolder after `npm run build`, or upload `public/` directly with the map attribution file. `dist/` is generated and ignored by Git. See `../README.md` for the complete maintenance workflow.
