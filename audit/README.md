# Reviewed transcript data

`reviews/` contains the authoritative 793 episode records; `alternate-reviews.json` records checks of the seven alternate caption tracks. `source-index.json` preserves all 45 tracks as numbered paragraphs with timestamps and original SHA-256 fingerprints.

Correct records in the relevant episode review, then run `python3 scripts/compile_audit.py` from the project root. This validates evidence links and source fingerprints, writes the readable transcripts to `goldbound/`, and generates the website's `audit-data.json` and `audit-sources.json`.

Original captions remain in `goldbound/original-vtt/`. Use `python3 scripts/read_episode.py 34 1 5` to inspect paragraphs, or add `--alternate` for an alternate track. Quoted prices, actual receipts, hourly appraisals and component results retain their separate meanings; do not infer GPH from an untimed drop.

[Website maintenance](../README.md) · [Item tooltip maintenance](ITEM-TOOLTIPS.md)
