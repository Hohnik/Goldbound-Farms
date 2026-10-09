import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {earningsFor} from './public/earnings.js';
import {groupRecords,selectGroups,baselineRate,comparisonValue,preferredBadge,valueCategory,zoneInsight,recordedDuration,resultLabel,limitationFor,earningsDisclosure,searchMatches} from './public/atlas-model.js';
const rows=JSON.parse(readFileSync(new URL('./public/audit-data.json',import.meta.url))).records;
const definitions=JSON.parse(readFileSync(new URL('./public/method-groups.json',import.meta.url))).groups;
const byId=new Map(rows.map(r=>[r.id,r]));
for(const row of rows){row.earnings=earningsFor(row,byId);row.searchText=[row.name,row.summary,row.zone,JSON.stringify(row.metrics)].join(' ')}
const groups=groupRecords(rows,definitions);
assert.equal(groups.reduce((n,g)=>n+g.records.length,0),793);
assert.equal(new Set(groups.flatMap(g=>g.records.map(r=>r.id))).size,793);
for(const row of rows){
 assert.equal(typeof row.guide,'string',row.id);
 assert.ok(row.guide.trim().split(/\s+/).length<=55,row.id);
 assert.ok(row.guide.trim().length>0,row.id);
}
assert.equal(earningsDisclosure(byId.get('E034-06')),null); // one GPH figure belongs in the header
assert.equal(earningsDisclosure(byId.get('E032-14')),'Price & sale'); // preserve quote versus actual receipt
assert.equal(earningsDisclosure(byId.get('E034-03')),'Earnings breakdown'); // multiple named targets
assert.equal(earningsDisclosure(byId.get('E032-19')),'Rotation values'); // independent legs stay separate
assert.equal(earningsDisclosure(byId.get('E014-19')),'Value details'); // hourly fish versus a rare ring quote
const memberships=definitions.flatMap(g=>g.record_ids);
assert.equal(new Set(memberships).size,memberships.length);
assert.ok(memberships.every(id=>byId.has(id)));
const normal=groups.find(g=>g.records.some(r=>r.id==='E014-07'));
const heroic=groups.find(g=>g.records.some(r=>r.id==='E016-09'));
assert.notEqual(normal.id,heroic.id);
assert.equal(baselineRate(byId.get('E033-22')).min,6600); // exclude its 9k lucky sample
assert.equal(baselineRate(byId.get('E032-19')),null); // component rates stay separate
assert.equal(baselineRate(byId.get('E016-05')),null); // 426k listing appraisal is not GPH
assert.equal(baselineRate(byId.get('E034-10')),null); // expected-value model, not a baseline
assert.equal(comparisonValue(byId.get('E034-03'),'gph'),null);
assert.equal(comparisonValue(byId.get('E034-03'),'prices'),8000000);
assert.equal(baselineRate(byId.get('E038-07')),null); // an upper bound is not a minimum return
assert.equal(comparisonValue({earnings:[{kind:'sale',min:200000,max:200000,upperBound:true}]},'sales'),null);
const mixedQuotes={earnings:[{kind:'item',min:50000,max:5000000},{kind:'item',min:500000,max:500000}]};
assert.equal(preferredBadge(mixedQuotes,'prices').min,comparisonValue(mixedQuotes,'prices'));
const hourly=selectGroups(groups,{kind:'farm',category:'gph',sort:'gph'});
assert.ok(hourly.every(g=>g.primary.earnings.some(b=>valueCategory(b)==='gph')));
assert.ok(!hourly.some(g=>g.primary.id==='E034-03'));
const scores=hourly.map(g=>comparisonValue(g.primary,'gph')).filter(v=>v!==null);
assert.deepEqual(scores,[...scores].sort((a,b)=>b-a));
const quote=preferredBadge(byId.get('E034-03'));
assert.equal(resultLabel(quote),'Asking price');
assert.equal(limitationFor(byId.get('E034-03'),quote),'');
assert.equal(recordedDuration({minutes_approx_range:[90,120]}),'≈90–120 min');
assert.equal(recordedDuration({gather_minutes:60,processing_minutes:7}),'60 min gathering + 7 min processing');
assert.equal(recordedDuration({played_hours:150,cooldown_minutes:60}),'Not stated');
assert.equal(recordedDuration({minutes_upper_bound:30}),'≤30 min');
assert.equal(searchMatches('Vashj’ir pickpocketing','vashjir'),true);
assert.equal(searchMatches('Ginn-su Sword','Ginn su'),true);
assert.equal(searchMatches('Beginning supplies for Tin prospecting','Ginn-su'),false);
assert.equal(searchMatches('Thorium mining','thor'),true);
const insight=zoneInsight([byId.get('E034-03'),byId.get('E032-19')],groupRecords([byId.get('E034-03'),byId.get('E032-19')],definitions));
assert.equal(insight.rate,null);
assert.equal(insight.rare.badge.min,8000000);
const cowl=byId.get('E034-24');
assert.equal(zoneInsight([cowl],groupRecords([cowl],definitions)).rare.badge.min,5000000);
console.log('Atlas model checks passed: full record retention, method boundaries, safe rankings, scope labels, durations and search aliases.');
