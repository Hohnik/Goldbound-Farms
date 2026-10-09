import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createItemLinks} from './public/item-links.js';
const {items}=JSON.parse(readFileSync(new URL('./public/item-tooltips.json',import.meta.url)));
const links=createItemLinks(items);
assert.equal(links.resolve('Papal Fez').id,9431);
assert.equal(links.resolve('Miner’s Hat of the Deep').id,9429);
assert.equal(links.resolve('Twilights Blade').id,68163);
assert.equal(links.resolve('Jin’su Sword').id,9424);
assert.equal(links.resolve('Mithril_Ore').id,3858);
assert.equal(links.resolve('Mobus BoE epic drops'),null);
assert.equal(links.resolve('Wedding Ring'),null); // ambiguous caption, no guessed ID
assert.equal(links.resolve('Ancona Chicken, caged'),null); // not the base learning item
assert.match(links.link('Papal Fez'),/data-wowhead="item=9431&amp;domain=www"/);
assert.match(links.link('Papal Fez'),/rel="noopener noreferrer"/);
const decorated=links.decorate('Papal Fez, Miner’s Hat of the Deep and Mithril_Ore.');
assert.equal((decorated.match(/class="item-link"/g)||[]).length,3);
assert.match(decorated,/Miner’s Hat of the Deep/);
assert.equal(links.decorate('Mithril Oresome'), 'Mithril Oresome');
assert.equal(links.decorate('<script>bad()</script>'), '&lt;script&gt;bad()&lt;/script&gt;');
const ambiguous=createItemLinks([{id:1,name:'Unclear sword'},{id:2,name:'Unclear sword'}]);
assert.equal(ambiguous.resolve('Unclear sword'),null);
assert.equal(ambiguous.link('Unclear sword'),'Unclear sword');
assert.equal(createItemLinks([]).decorate('Papal Fez'),'Papal Fez');
console.log('Item tooltip checks passed: verified IDs, caption aliases, boundaries, safe links and unresolved fallbacks.');
