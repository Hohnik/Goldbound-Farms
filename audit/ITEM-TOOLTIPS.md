# Retail item tooltips

Item names in farm details, recorded fields, review notes and transcript passages link to explicit item IDs. Hover or keyboard focus displays Wowhead's Retail tooltip; clicking the name opens the item page. Escape dismisses keyboard inspection without leaving the farm. Item names remain unchanged from the reviewed transcript, including verified aliases such as “Jin’su Sword” → Ginn-Su Sword.

The lookup currently contains 277 distinct items plus aliases. Commodity IDs come from the saved TradeSkillMaster commodity ID catalog (`dashboard/data/item-ids.csv`). Additional equipment, pets and rare targets were checked against their Wowhead item pages; their source URLs remain in `dashboard/public/item-tooltips.json`. This lookup contains IDs, not live auction prices.

Collective labels (such as “Mobus BoE epic drops”), ambiguous captions and unmatched items stay as plain text. “Wedding Ring” is deliberately unresolved; the specifically named Stendel's Wedding Band has its own verified link. The caged Ancona Chicken is not mapped to the base learning item.

[Wowhead integration documentation](https://www.wowhead.com/tooltips). The provider loads asynchronously, independently of the atlas. Item links remain usable if the tooltip provider is unavailable; failure of the optional item lookup leaves the atlas usable with plain text.

Rebuild the item lookup with `python3 scripts/build_item_tooltips.py`. Add verified aliases to `dashboard/data/item-tooltip-overrides.json`, preserving distinct items rather than guessing IDs from a price or approximate caption.

Validation: matching IDs, aliases, word boundaries, HTML escaping, ambiguous-name fallbacks, provider display on keyboard focus, Escape dismissal, and a 390px viewport without tooltip overflow. Build and the existing earnings checks also pass.
