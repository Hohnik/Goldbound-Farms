import {earningsFor,hasGph,hasValue,formatEarning} from './earnings.js';
import {createItemLinks} from './item-links.js';
import {normalizeSearch,searchMatches,valueCategory,badgesFor,baselineRate,preferredBadge,comparisonValue,resultLabel,earningsDisclosure,groupRecords,selectGroups,zoneInsight,recordedDuration,preparationFor,limitationFor} from './atlas-model.js';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const human=v=>String(v).replaceAll('_',' '), number=v=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(v);
const transforms={kalimdor:'translate(15 35) scale(.55)','eastern-kingdoms':'translate(390 30) scale(.36)'};
const statusSymbols={
  performed:['done','<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>'],
  ongoing:['pending','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'],
  successful:['success','<path d="m6 12 4 4 8-8"/><circle cx="12" cy="12" r="9"/>'],
  measured:['measured','<path d="M5 19V9m7 10V5m7 14v-7M3 21h18"/>'],
  sales_confirmed:['success','<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>'],
  confirmed:['success','<path d="m6 12 4 4 8-8"/><circle cx="12" cy="12" r="9"/>'],
  failed:['negative','<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'],
  rejected:['negative','<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>'],
  blocked:['negative','<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>'],
  observed:['neutral','<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'],
  planned:['pending','<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/>'],
  proposed:['pending','<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0l-1 2H9Z"/>'],
  deferred:['pending','<circle cx="12" cy="12" r="9"/><path d="M9 8v8m6-8v8"/>'],
  partially_successful:['pending','<circle cx="12" cy="12" r="9"/><path d="M12 3v18m-5-9 2 2 2-2"/>'],
  no_sale_yet:['pending','<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'],
  no_spawn_seen:['neutral','<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'],
  not_performed_here:['neutral','<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'],
  excluded_from_challenge:['neutral','<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>'],
  adjusted:['neutral','<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>'],
  unverified:['neutral','<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 4m0 3h.01"/>']
};
function outcomeTone(status){return (statusSymbols[status]||statusSymbols.unverified)[0]}
function statusIcon(status){const [tone,symbol]=statusSymbols[status]||statusSymbols.unverified;const label=esc(human(status));return `<span class="status-icon ${tone}" role="img" aria-label="${label}" title="${label}" data-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbol}</svg></span>`}

const aliases={'Vashjir':['Vashj’ir'],'Hinterlands':['The Hinterlands'],'ZulGurub':['Stranglethorn Vale'],'Stranglethorn':['Stranglethorn Vale'],'Molten Core':['Burning Steppes'],'Blackrock Depths':['Burning Steppes'],'Blackrock Caverns':['Burning Steppes'],'Blackwing Lair':['Burning Steppes'],'Blackwing Descent':['Searing Gorge'],'Uldaman':['Badlands'],'Uldaman Legacy of Tyr':['Badlands'],'Gnomeregan':['Dun Morogh'],'Sunken Temple':['Swamp of Sorrows'],'Throne of the Tides':['Vashj’ir'],'Onyxias Lair':['Dustwallow Marsh'],'Theramore':['Dustwallow Marsh'],'Razorfen Downs':['Thousand Needles'],'Stormwind Stockades':['Elwynn Forest'],'Duskwood border':['Duskwood'],'Swamp':['Swamp of Sorrows'],'Eastern Kingdoms':['Azeroth']};

function zoom(target){cancelAnimationFrame(zoomFrame);const svg=$('#world-map'),start=svg.getAttribute('viewBox').split(' ').map(Number);if(matchMedia('(prefers-reduced-motion: reduce)').matches){svg.setAttribute('viewBox',target.join(' '));return}const started=performance.now();function frame(now){const t=Math.min(1,(now-started)/520),ease=1-Math.pow(1-t,3);svg.setAttribute('viewBox',start.map((v,i)=>v+(target[i]-v)*ease).join(' '));if(t<1)zoomFrame=requestAnimationFrame(frame)}zoomFrame=requestAnimationFrame(frame)}
function buildMap(){let content='<g class="world-label"><text class="ocean-label" x="346" y="190" text-anchor="middle">THE GREAT</text><text class="ocean-label" x="346" y="207" text-anchor="middle">SEA</text></g>';for(const [c,key] of [['west','kalimdor'],['east','eastern-kingdoms']]){const data=mapData[key];content+=`<g data-map-continent="${c}"><g transform="${transforms[key]}"><g class="map-background" aria-hidden="true">${data.background.map(d=>`<path d="${esc(d)}"/>`).join('')}</g>`;for(const [z,g] of Object.entries(data.zones)){const count=zoneRecords(z).length;content+=`<g class="map-zone" data-zone="${esc(z)}" data-geometry="${esc(z)}" tabindex="0" role="button" aria-label="Explore ${esc(z)}, ${count} recorded activities" aria-pressed="false"><title>${esc(z)} · ${count} recorded activities</title>${g.paths.map(d=>`<path d="${esc(d)}"/>`).join('')}<circle cx="${g.center[0]}" cy="${g.center[1]}" r="5"/></g>`}content+='</g></g>';const x=c==='west'?165:575;content+=`<g class="continent-hit world-label" tabindex="0" role="button" data-continent="${c}" aria-label="Explore ${continentName(c)}"><rect x="${x-105}" y="25" width="210" height="45" fill="transparent"/><text x="${x}" y="51" text-anchor="middle" class="continent-label">${continentName(c).toUpperCase()} ↗</text></g>`;}$('#world-map').innerHTML=content}
async function loadSources(){if(sources)return sources;if(!sourcesPromise)sourcesPromise=fetch('./audit-sources.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>sources=d).catch(e=>{sourcesPromise=null;throw e});return sourcesPromise}
function supplementaryEvidence(record){
 const included=new Set();for(let p=record.source.paragraph_start;p<=record.source.paragraph_end;p++)included.add(record.episode+':'+p);
 const passages=[];
 for(const ref of [...record.earnings.flatMap(b=>b.source_refs||[]),...(record.guide_source_refs||[])]){
  const source=sources.find(s=>s.episode_file_id===ref.episode&&s.source_file.includes('.en-orig.'));if(!source)continue;
  for(const paragraph of source.paragraphs.slice(ref.paragraph_start-1,ref.paragraph_end)){
   const key=ref.episode+':'+paragraph.number;if(included.has(key))continue;included.add(key);passages.push({episode:ref.episode,...paragraph});
  }
 }
 passages.sort((a,b)=>a.episode-b.episode||a.number-b.number);
 return passages.length?`<details class="supplement-evidence"><summary>Additional evidence · ${passages.length} passages</summary>${passages.map(p=>`<div class="passage"><small>FILE ${p.episode} · PARAGRAPH ${p.number} · ${p.time}</small><p>${itemText(p.text)}</p></div>`).join('')}</details>`:'';
}
function earningDetails(record){
 const groups=new Map();
 for(const badge of record.earnings){const key=(badge.sourceRecordId||record.id)+'|'+(badge.item||badge.key);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(badge)}
 return [...groups.values()].map(group=>{const first=group[0];return `<div class="earning-detail-row">${first.item?`<h4>${itemLinks.link(first.item)} ${first.obtained!==undefined?`<span class="loot-outcome ${first.obtained?'obtained':'target'}">${first.obtained?'Obtained':first.obtained===false?'Target':'Quote'}</span>`:''}</h4>`:first.inherited?`<h4>${esc(first.componentName)}</h4>`:''}<div class="earning-badges">${group.map(b=>`<span class="earning-badge ${b.kind}"><strong>${esc(formatEarning(b))}</strong><small>${esc(b.label)}</small></span>`).join('')}</div>${[...new Set(group.map(b=>b.basis))].map(basis=>`<p>${itemText(basis)}</p>`).join('')}${first.inherited?`<button class="related-inline" data-record="${first.sourceRecordId}">Component ↗</button>`:''}</div>`}).join('')
}

const continentName=v=>({world:'Azeroth',east:'Eastern Kingdoms',west:'Kalimdor'})[v];
const views={world:[0,0,760,450],east:[440,120,205,310],west:[65,65,235,360]};
const categoryNames={all:'All results',gph:'Hourly returns',prices:'Item quotes',sales:'Actual sales',other:'Batch / other',value:'Has value'};
const palettes={coverage:['#dae0d2','#d0dabb','#b4c59d','#91aa76','#6e8b57','#4f6e3f'],gph:['#dce3df','#c9ddd8','#a5cbc1','#76ae9e','#4d8b7b','#2f695c'],prices:['#e4e0d7','#e6d9bf','#d9c096','#c2a370','#a5814d','#805c2c']};
let mapData,catalog,sources,sourcesPromise,ready=false,zoomFrame,itemLinks=createItemLinks([]);
let groups=[],groupsByRecord=new Map(),insights=new Map(),items=[],searchItems=[];
let state={continent:'world',zone:null,record:null},tab='farm',search='',valueFilter='all',sort='latest',mapLayer='coverage',limit=12,lastRegionFocus=null,mapExpanded=false;
const regionMemory=new Map(),expandedGroups=new Set();
const itemText=value=>itemLinks.decorate(value);
const labelSort={latest:'Latest in journal',name:'Farm name',gph:'Highest recorded GPH',prices:'Highest item quote',sales:'Highest sale receipt'};
function itemHoverEvent(link,type){const rect=link.getBoundingClientRect();link.dispatchEvent(new MouseEvent(type,{bubbles:true,clientX:rect.left+rect.width/2,clientY:rect.bottom}))}
function dismissItem(){if(document.activeElement.matches('.item-link'))itemHoverEvent(document.activeElement,'mouseout')}
function geography(r){return [...new Set(r.zone.split(' / ').flatMap(n=>aliases[n]||[n]))]}
function zoneRecords(z){return catalog.records.filter(r=>r.regions.includes(z))}
function zoneGroups(z){return groupRecords(zoneRecords(z),catalog.methodGroups)}
function zoneContinent(z){return z==='Azeroth'?'world':Object.hasOwn(mapData.kalimdor.zones,z)?'west':'east'}
function announce(text){$('#announce').textContent=text}
function rememberRegion(){if(state.zone&&!state.record)regionMemory.set(state.zone,{tab,search,valueFilter,sort,limit,scroll:$('#explorer').scrollTop})}
function restoreRegion(zone){const saved=regionMemory.get(zone);tab=saved?.tab||'farm';search=saved?.search||'';valueFilter=saved?.valueFilter||'all';sort=saved?.sort||'latest';limit=saved?.limit||12}
function routeHash(){const p=new URLSearchParams();if(state.continent!=='world')p.set('continent',state.continent);if(state.zone)p.set('zone',state.zone);if(state.record)p.set('record',state.record);if(valueFilter!=='all')p.set('values',valueFilter);if(sort!=='latest')p.set('sort',sort);if(tab!=='farm')p.set('kind',tab);if(search)p.set('q',search);if(mapLayer!=='coverage')p.set('layer',mapLayer);return '#map'+(p.size?'?'+p:'')}
function syncUrl(replace=false){const url=routeHash();if(replace)history.replaceState(null,'',url);else if(location.hash!==url)history.pushState(null,'',url)}
function route(next,{replace=false,restoreScroll=false}={}){dismissItem();state={...next};syncUrl(replace);render();if(restoreScroll)requestAnimationFrame(()=>{$('#explorer').scrollTop=regionMemory.get(state.zone)?.scroll||0;document.querySelector(`[data-record="${CSS.escape(lastRegionFocus||'')}"]`)?.focus({preventScroll:true})})}
function readRoute(){
 const p=new URLSearchParams(location.hash.split('?')[1]||''),record=catalog.records.find(r=>r.id===p.get('record'));
 const requested=p.get('zone'),zone=requested&&catalog.records.some(r=>r.regions.includes(requested))?requested:record?.regions[0]||null;
 tab=['farm','experiment','all'].includes(p.get('kind'))?p.get('kind'):'farm';search=p.get('q')||'';
 valueFilter=p.get('values')==='estimate'?'value':Object.hasOwn(categoryNames,p.get('values'))?p.get('values'):'all';
 sort=Object.hasOwn(labelSort,p.get('sort'))?p.get('sort'):'latest';mapLayer=['coverage','gph','prices'].includes(p.get('layer'))?p.get('layer'):'coverage';
 limit=regionMemory.get(zone)?.limit||12;
 state={continent:zone?zoneContinent(zone):['east','west'].includes(p.get('continent'))?p.get('continent'):'world',zone,record:zone&&record?.regions.includes(zone)?record.id:null};
 render();if(!state.record&&zone)requestAnimationFrame(()=>{$('#explorer').scrollTop=regionMemory.get(zone)?.scroll||0});
}
function enterZone(zone){if(!zoneRecords(zone).length)return;rememberRegion();restoreRegion(zone);if(mapLayer==='gph'){tab='farm';valueFilter='gph';sort='gph'}else if(mapLayer==='prices'){tab='farm';valueFilter='prices';sort='prices'}mapExpanded=false;route({continent:zoneContinent(zone),zone,record:null});$('#explorer').scrollTop=0;$('#region-title')?.focus({preventScroll:true});announce(`${zone}. ${insights.get(zone).count} farm methods.`)}
function enterContinent(continent){rememberRegion();mapExpanded=false;route({continent,zone:null,record:null});announce(`${continentName(continent)} map`)}
function enterRecord(id,zone=state.zone){const r=catalog.records.find(r=>r.id===id);if(!r)return;rememberRegion();if(!zone||!r.regions.includes(zone))zone=r.regions.find(z=>z!=='Azeroth')||r.regions[0];if(zone!==state.zone)restoreRegion(zone);lastRegionFocus=id;mapExpanded=false;route({continent:zoneContinent(zone),zone,record:id});$('#explorer').scrollTop=0;$('#record-title')?.focus({preventScroll:true});announce(`${r.name}. Farm summary opened.`)}
function back(){if(state.record)route({...state,record:null},{restoreScroll:true});else if(state.zone)enterContinent(state.continent);else enterContinent('world')}
function renderMap(){
 const svg=$('#world-map');
 const values=[...svg.querySelectorAll('[data-zone]')].map(n=>insights.get(n.dataset.zone)).map(i=>mapLayer==='gph'?i.rate?.badge.min||0:mapLayer==='prices'?i.rare?.badge.min||0:i.count).filter(v=>v>0).sort((a,b)=>a-b);
 for(const n of svg.querySelectorAll('[data-zone]')){
  const insight=insights.get(n.dataset.zone),value=mapLayer==='gph'?insight?.rate?.badge.min||0:mapLayer==='prices'?insight?.rare?.badge.min||0:insight?.count||0;
  const band=value?Math.max(1,Math.min(5,Math.ceil(values.filter(v=>v<=value).length/Math.max(1,values.length)*5))):0;
  n.style.setProperty('--zone-fill',palettes[mapLayer][band]);n.dataset.band=band;
  n.classList.toggle('selected',n.dataset.zone===state.zone);n.classList.toggle('dimmed',Boolean(state.zone&&n.dataset.zone!==state.zone));n.setAttribute('aria-pressed',String(n.dataset.zone===state.zone));
  const detail=mapLayer==='gph'?(insight?.rate?formatEarning(insight.rate.badge)+' historical farming test':'no eligible hourly test'):mapLayer==='prices'?(insight?.rare?formatEarning(insight.rare.badge)+' highest named quote':'no rare-item quote'):insight?.count+' farm methods';
  n.setAttribute('aria-label',`Explore ${n.dataset.zone}, ${detail}`);
 }
 svg.querySelectorAll('[data-map-continent]').forEach(g=>{const visible=state.continent==='world'||g.dataset.mapContinent===state.continent;g.style.opacity=visible?'1':'.15';g.setAttribute('aria-hidden',String(!visible));g.style.pointerEvents=visible?'auto':'none';g.querySelectorAll('[tabindex]').forEach(n=>n.setAttribute('tabindex',visible?'0':'-1'))});
 svg.querySelectorAll('.world-label').forEach(n=>n.style.display=state.continent==='world'?'':'none');
 let target=views[state.continent];
 if(state.zone){const g=svg.querySelector(`[data-geometry="${CSS.escape(state.zone)}"]`);if(g){const b=g.getBBox(),west=zoneContinent(state.zone)==='west',scale=west?.55:.36,dx=west?15:390,dy=west?35:30,w=Math.max(b.width*scale+45,125),h=Math.max(b.height*scale+55,125);target=[b.x*scale+dx-(w-b.width*scale)/2,b.y*scale+dy-(h-b.height*scale)/2,w,h]}}
 if(svg.getAttribute('viewBox')!==target.join(' '))zoom(target);
 $('#map-tooltip').hidden=true;$('#map-layer').value=mapLayer;
 $('#layer-label').textContent=state.zone?'03 / REGION':state.continent==='world'?'01 / AZEROTH':'02 / CONTINENT';
 $('#map-title').textContent=state.zone||(state.continent==='world'?'Azeroth':continentName(state.continent));

 document.querySelectorAll('[data-continent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.continent===state.continent)));
 document.querySelectorAll('.offshore [data-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.zone===state.zone)));
 const descriptions={coverage:['Farm methods','Relative to mapped regions.','No farms'],gph:['Historical GPH','Lucky sessions, models and processing-only rates excluded.','No eligible test'],prices:['Item quotes','Includes unobtained targets.','No quote']};
 const [heading,description,empty]=descriptions[mapLayer];
 $('#map-legend').innerHTML=`<div title="${esc(description)}"><strong>${heading}</strong><span class="legend-scale" aria-hidden="true">${palettes[mapLayer].slice(1).map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>Lower → higher</span>${state.zone?'<span class="legend-selected"><i></i>Selected</span>':''}</div><small><i style="background:${palettes[mapLayer][0]}"></i>${empty}</small>`;
 $('#mobile-map-toggle').textContent=mapExpanded?'Collapse map ↓':'Expand map ↗';$('#mobile-map-toggle').setAttribute('aria-expanded',String(mapExpanded));
}
function breadcrumbs(){const layers=[{label:'Azeroth',continent:'world'}];if(state.continent!=='world')layers.push({label:continentName(state.continent),continent:state.continent});if(state.zone)layers.push({label:state.zone,zone:state.zone});if(state.record)layers.push({label:human(catalog.records.find(r=>r.id===state.record).kind)+' summary'});$('#breadcrumbs').innerHTML=layers.map((l,i)=>`${i?'<span class="divider" aria-hidden="true">/</span>':''}${i===layers.length-1?`<span class="current" aria-current="page">${esc(l.label)}</span>`:`<button ${l.zone?`data-zone="${esc(l.zone)}"`:`data-continent="${l.continent}"`}>${esc(l.label)}</button>`}`).join('')}
function resultHero(record,category='all',compact=false){
 const b=preferredBadge(record,category==='value'?'all':category);
 if(!b)return `<div class="result-hero unvalued"><span>No value recorded</span></div>`;
 const kind=valueCategory(b);
 return `<div class="result-hero ${kind}${compact?' compact':''}">${b.item&&!compact?`<div class="hero-item">${itemLinks.link(b.item)}${b.obtained===true?'<span class="loot-outcome obtained">Obtained</span>':b.obtained===false?'<span class="loot-outcome">Target</span>':''}</div>`:''}<strong>${esc(formatEarning(b))}</strong><span>${esc(resultLabel(b))}</span>${b.item&&compact?`<small>${esc(b.item)}</small>`:''}</div>`;
}
function historyRows(group,currentId){return group.records.map(r=>{const b=preferredBadge(r);return `<button class="history-run" data-record="${r.id}"${r.id===currentId?' aria-current="true"':''}><span><strong>${esc(r.name)}</strong><small>Journal ${r.episode} · ${esc(human(r.kind))}${r.id===currentId?' · this record':''}</small></span><span>${b?esc(formatEarning(b)):'No value stated'}<small>${b?esc(resultLabel(b)):esc(human(r.status))}</small></span></button>`}).join('')}
function renderCards(){
 const selected=selectGroups(zoneGroups(state.zone),{kind:tab,query:search,category:valueFilter,sort});
 const rawCount=selected.reduce((total,g)=>total+g.matching.length,0);
 $('#list-meta').textContent=`${selected.length} ${tab==='experiment'?'experiment groups':tab==='all'?'activity groups':'farm methods'} · ${rawCount} records`;
 $('#record-list').innerHTML=selected.slice(0,limit).map(g=>{
  const r=g.primary,b=preferredBadge(r,valueFilter==='value'?'all':valueFilter),secondary=r.earnings.filter(v=>v!==b&&valueCategory(v)!==valueCategory(b||{}));
  const note=['gph','prices','sales'].includes(sort)&&comparisonValue(r,sort)===null?'Unranked reference':r.id!==g.latest.id&&sort==='latest'?'Earlier valued run':'';
  return `<article class="method-card outcome-${outcomeTone(r.status)}"><button class="record-open" data-record="${r.id}" aria-label="Open ${esc(g.title)}"><div class="record-main">${note?`<div class="method-meta">${esc(note)}</div>`:''}<h3>${esc(g.title)}</h3>${resultHero(r,valueFilter,true)}${secondary.length?`<div class="secondary-result"><span>${esc(secondary[0].item||secondary[0].componentName||secondary[0].label)}</span><strong>${esc(formatEarning(secondary[0]))}</strong><small>${esc(resultLabel(secondary[0]))}${secondary.length>1?` · +${secondary.length-1} references`:''}</small></div>`:''}</div><div class="record-actions">${statusIcon(r.status)}<span aria-hidden="true">↗</span></div></button>${g.records.length>1?`<details class="run-history" data-group="${esc(g.id)}"${expandedGroups.has(g.id)?' open':''}><summary>Runs & variants <span>${g.records.length}</span></summary>${historyRows(g,r.id)}</details>`:''}</article>`;
 }).join('')||'<p class="empty-message">No matching methods.</p>';
 $('#more').hidden=selected.length<=limit;$('#more').textContent=`Show ${Math.min(12,selected.length-limit)} more`;
}
function filterMarkup(){return `<div class="value-filters" role="group" aria-label="Choose result type">${[['all','All'],['gph','Hourly'],['prices','Item quotes'],['sales','Sales'],['other','Other'],...(valueFilter==='value'?[['value','Has value']]:[])].map(([key,label])=>`<button data-value-filter="${key}" aria-pressed="${valueFilter===key}">${label}</button>`).join('')}</div>`}
function renderRegion(){
 const list=zoneRecords(state.zone),methods=zoneGroups(state.zone),farmCount=methods.filter(g=>g.records.some(r=>r.kind==='farm')).length;
 $('#back').textContent='← Back to '+(state.continent==='world'?'Azeroth':'continent');
 $('#explorer-content').innerHTML=`<div class="eyebrow">REGION JOURNAL</div><h2 id="region-title" tabindex="-1">${esc(state.zone)}</h2><p class="region-context">${farmCount} farm methods · ${list.length} records · ${new Set(list.map(r=>r.episode)).size} videos</p><input id="region-search" class="region-search" type="search" placeholder="Search region…" aria-label="Search this region" value="${esc(search)}"><div class="record-tabs" role="group" aria-label="Choose activity type">${[['farm','Farms'],['experiment','Experiments'],['all','All activity']].map(([key,label])=>`<button data-kind="${key}" aria-pressed="${tab===key}">${label}</button>`).join('')}</div>${filterMarkup()}<div class="sort-row"><label for="result-sort">Sort</label><select id="result-sort">${Object.entries(labelSort).map(([key,label])=>`<option value="${key}"${sort===key?' selected':''}>${label}</option>`).join('')}</select><details class="result-guide"><summary aria-label="Explain result types">?</summary><div><strong>Ranking & colors</strong><p>Ranges rank by their lower end. Upper bounds stay unranked.</p><p>GPH rankings exclude lucky sessions, models and processing-only rates. Sales rank by total receipts.</p><p>Green: successful · teal: measured · amber: ongoing · rose: failed · neutral: performed / other.</p></div></details></div><div id="list-meta" class="list-meta" aria-live="polite"></div><div id="record-list"></div><button class="show-more" id="more">Show more methods</button>`;
 renderCards();
}
function relatedDetails(record){const links=record.related_records||[];if(!links.length)return '';return `<details class="disclosure detail-section"><summary>${links.some(l=>l.role==='component')?'Inside this rotation':'Related tests'}<span>${links.length} links</span></summary><div class="disclosure-body">${links.map(link=>`<button class="related-record" data-record="${link.id}"><span>${esc(link.label)}</span><span aria-hidden="true">↗</span></button>`).join('')}</div></details>`}
function renderRecord(){
 const r=catalog.records.find(r=>r.id===state.record),group=groupsByRecord.get(r.id),metrics=Object.entries(r.metrics),badge=preferredBadge(r),requirements=preparationFor(r,group),duration=recordedDuration(r.metrics),limitation=limitationFor(r,badge),earningsTitle=earningsDisclosure(r);
 $('#back').textContent='← Back to '+state.zone;
 const hasPrior=group?.records.length>1;
 $('#explorer-content').innerHTML=`<div class="eyebrow">${esc(r.kind==='farm'?'FARM SUMMARY':r.kind==='experiment'?'EXPERIMENT SUMMARY':'JOURNAL ENTRY')}</div><h2 id="record-title" tabindex="-1">${itemText(r.name)}</h2><p class="record-location">${esc(r.zone)} · ${esc(human(r.kind))}</p><div class="summary-result">${resultHero(r)}${statusIcon(r.status)}</div><dl class="summary-facts"><div><dt>Duration</dt><dd>${esc(duration)}</dd></div><div><dt>Preparation</dt><dd>${requirements.length?requirements.map(v=>`<span class="requirement-chip">${esc(v)}</span>`).join(' '):'Not stated'}</dd></div></dl>${limitation?`<div class="key-limitation"><p>${esc(limitation)}</p></div>`:''}<div class="historical-stamp">Journal ${r.episode} · Historical result</div>${r.guide?`<details class="disclosure detail-section quick-guide" open><summary>${['farm','experiment','proposal'].includes(r.kind)?'Quick guide':'Summary'}</summary><div class="disclosure-body"><p>${itemText(r.guide)}</p></div></details>`:''}${earningsTitle?`<details class="disclosure detail-section earnings-detail"><summary>${esc(earningsTitle)}<span>${r.earnings.length} figures</span></summary><div class="disclosure-body">${earningDetails(r)}</div></details>`:''}${hasPrior?`<details class="disclosure detail-section"><summary>Runs & variants<span>${group.records.length} records</span></summary><div class="disclosure-body">${historyRows(group,r.id)}</div></details>`:''}${relatedDetails(r)}${metrics.length?`<details class="disclosure detail-section"><summary>Recorded quantities<span>${metrics.length} fields</span></summary><div class="disclosure-body">${metrics.length?`<div class="metric-grid">${metrics.map(([k,v])=>`<div class="metric"><small>${itemText(human(k))}</small><strong>${itemText(typeof v==='number'?number(v):typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('')}</div>`:'<p>No separate timed quantities were stated for this entry.</p>'}</div></details>`:''}<details class="disclosure detail-section" id="transcript-disclosure"><summary>Transcript evidence<span>${r.source.paragraph_end-r.source.paragraph_start+1} paragraphs</span></summary><div class="disclosure-body"><details class="source-notes"><summary>Source notes</summary><p>${itemText(r.summary)}</p>${!earningsTitle&&badge?`<p class="detail-note">${itemText(badge.basis)}</p>`:''}${r.unverified_metrics?'<p class="detail-note">Unverified figures are excluded from the results.</p>':''}</details><p class="detail-note">Journal ${r.episode} · source time ${r.source.start_time.slice(0,8)}</p><div id="evidence"><p class="detail-note">Loading passage…</p></div></div></details>`;
}
async function renderEvidence(r){
 try{await loadSources();if(state.record!==r.id)return;const s=sources.find(s=>s.source_file===r.source.file),ps=s.paragraphs.slice(r.source.paragraph_start-1,r.source.paragraph_end);
 $('#evidence').innerHTML=`${ps.map(p=>`<div class="passage"><small>PARAGRAPH ${p.number} · ${p.time}</small><p>${itemText(p.text)}</p></div>`).join('')}${supplementaryEvidence(r)}${r.alternate_evidence?`<details><summary>Alternate-caption evidence</summary><div class="passage"><p>${itemText(r.alternate_evidence.quote)}</p></div></details>`:''}<button class="source-link" data-source="${r.episode}">Read the full clean transcript ↗</button>`;$('#evidence').dataset.loaded='true';
 }catch{if(state.record===r.id)$('#evidence').innerHTML='<p class="detail-note">The transcript could not load.</p><button class="source-link" data-retry="true">Try again</button>'}
}
async function openSource(ep){const id=state.record;try{await loadSources();if(state.record!==id)return;const s=sources.find(s=>s.episode_file_id===ep&&s.source_file.includes('.en-orig.'));$('#evidence').innerHTML=`<button class="full-source" data-passage="true">← Return to supporting passage</button><p class="detail-note">${esc(s.canonical_file)}</p>${s.paragraphs.map(p=>`<div class="passage"><small>PARAGRAPH ${p.number} · ${p.time}</small><p>${itemText(p.text)}</p></div>`).join('')}`;announce('Full clean transcript opened')}catch{announce('Transcript unavailable. Try again.')}}
function render(){if(!ready)return;dismissItem();$('#atlas').classList.toggle('has-region',Boolean(state.zone));$('#atlas').classList.toggle('has-record',Boolean(state.record));$('#atlas').classList.toggle('map-expanded',mapExpanded);$('#explorer').hidden=!state.zone;breadcrumbs();renderMap();if(state.record)renderRecord();else if(state.zone)renderRegion();document.title=`${state.record?catalog.records.find(r=>r.id===state.record).name:state.zone||(state.continent==='world'?'The farm atlas':continentName(state.continent))} — Goldbound`}
function tooltip(n,event){
 const zone=n.dataset.zone,insight=insights.get(zone),tip=$('#map-tooltip'),stage=$('#map-canvas').getBoundingClientRect(),rect=n.getBoundingClientRect(),leading=mapLayer==='prices'?insight.rare:insight.rate;
 tip.innerHTML=`<strong>${esc(zone)}</strong><span>${insight.count} farm methods · ${insight.records} records</span>${leading?`<div class="map-peek"><b>${esc(formatEarning(leading.badge))}</b><span>${esc(resultLabel(leading.badge))}</span><small>${esc(leading.badge.item||leading.record.name)}</small></div>`:`<p>${mapLayer==='prices'?'No rare-item quote recorded.':'No comparable hourly test recorded.'}</p>`}`;
 tip.hidden=false;const width=tip.offsetWidth,height=tip.offsetHeight;
 tip.style.left=Math.max(8,Math.min(stage.width-width-8,(event?.clientX??rect.left+rect.width/2)-stage.left-width/2))+'px';tip.style.top=Math.max(8,Math.min(stage.height-height-8,(event?.clientY??rect.top)-stage.top-height-15))+'px';
}
function globalResults(query){
 const results=[];
 const regionNames=[...insights.keys()];
 if(!query.trim())return regionNames.sort((a,b)=>insights.get(b).count-insights.get(a).count).slice(0,6).map(zone=>({type:'Region',title:zone,subtitle:`${insights.get(zone).count} farm methods`,zone}));
 for(const zone of regionNames)if(searchMatches(zone,query))results.push({type:'Region',title:zone,subtitle:`${insights.get(zone).count} farm methods`,zone});
 for(const item of searchItems)if(searchMatches(item.name+' '+(item.aliases||[]).join(' '),query))results.push({type:'Item',title:item.name,subtitle:`${item.record.name} · ${item.record.regions[0]}`,record:item.record.id,itemId:item.id});
 const matches=selectGroups(groups,{kind:'all',query,category:'all',sort:'latest'});
 for(const group of matches)results.push({type:group.primary.kind==='experiment'?'Experiment':'Farm',title:group.title,subtitle:`${group.primary.regions[0]} · ${preferredBadge(group.primary)?formatEarning(preferredBadge(group.primary))+' · '+resultLabel(preferredBadge(group.primary)):'No value stated'}${group.records.length>1?' · '+group.records.length+' records':''}`,record:group.primary.id});
 const seen=new Set();return results.filter(r=>{const key=r.type+':'+(r.zone||r.record)+':'+r.title;if(seen.has(key))return false;seen.add(key);return true}).slice(0,12);
}
function renderSearch(){const query=$('#global-search').value,results=globalResults(query);$('#global-results').innerHTML=results.map(r=>`<button class="search-result" ${r.zone?`data-search-zone="${esc(r.zone)}"`:`data-search-record="${r.record}"${r.itemId?` data-search-item="${r.itemId}"`:''}`}><span class="search-type">${r.type}</span><span><strong>${esc(r.title)}</strong><small>${esc(r.subtitle)}</small></span><span aria-hidden="true">↗</span></button>`).join('')||'<p class="search-empty">No matches.</p>';$('#search-result-count').textContent=`${results.length} search results`;}
function openSearch(){if(!ready)return;if($('#atlas-search').open){$('#global-search').focus();return;}$('#atlas-search').showModal();$('#global-search').value='';renderSearch();$('#global-search').focus()}
function closeSearch(){if($('#atlas-search').open)$('#atlas-search').close()}
function makeSearchIndex(){
 const associations=new Map();
 for(const r of catalog.records){
  const referenced=new Set();
  for(const b of r.earnings){const item=b.item&&itemLinks.resolve(b.item);if(item)referenced.add(item.id)}
  for(const key of Object.keys(r.metrics)){const item=itemLinks.resolve(human(key));if(item)referenced.add(item.id)}
  const compactText=normalizeSearch(r.name+' '+(r.guide||'')+' '+r.summary+' '+Object.keys(r.metrics).join(' ')).replaceAll(' ','');
  for(const item of items)if([item.name,...(item.aliases||[])].some(name=>compactText.includes(normalizeSearch(name).replaceAll(' ',''))))referenced.add(item.id);
  for(const id of referenced){const direct=r.earnings.some(b=>b.item&&itemLinks.resolve(b.item)?.id===id&&!b.inherited),existing=associations.get(id);if(!existing||(direct&&!existing.direct)||(direct===existing.direct&&r.episode>existing.record.episode))associations.set(id,{record:r,direct})}
 }
 searchItems=items.filter(i=>associations.has(i.id)).map(i=>({...i,record:associations.get(i.id).record}));
}
function bindEvents(){
 document.addEventListener('click',e=>{
  if(!ready)return;
  const searchResult=e.target.closest('[data-search-zone],[data-search-record]');
  if(searchResult){closeSearch();if(searchResult.dataset.searchZone)enterZone(searchResult.dataset.searchZone);else{enterRecord(searchResult.dataset.searchRecord,null);if(searchResult.dataset.searchItem){const item=$('#explorer-content').querySelector(`[data-wowhead^="item=${searchResult.dataset.searchItem}&"]`);if(item){for(let section=item.closest('details');section;section=section.parentElement?.closest('details'))section.open=true;requestAnimationFrame(()=>{item.scrollIntoView({block:'center'});item.focus({preventScroll:true})})}}}return}
  const b=e.target.closest('[data-zone],[data-continent],[data-record],[data-kind],[data-source],[data-retry],[data-passage],[data-value-filter]');
  if(b?.hasAttribute('data-zone'))enterZone(b.dataset.zone);
  else if(b?.hasAttribute('data-continent'))enterContinent(b.dataset.continent);
  else if(b?.hasAttribute('data-record'))enterRecord(b.dataset.record);
  else if(b?.hasAttribute('data-kind')){tab=b.dataset.kind;limit=12;renderRegion();syncUrl();document.querySelector(`[data-kind="${tab}"]`).focus({preventScroll:true});rememberRegion()}
  else if(b?.hasAttribute('data-value-filter')){valueFilter=b.dataset.valueFilter;limit=12;if(['gph','prices','sales'].includes(sort)&&sort!==valueFilter)sort='latest';renderRegion();syncUrl();document.querySelector(`[data-value-filter="${valueFilter}"]`).focus({preventScroll:true});rememberRegion()}
  else if(b?.hasAttribute('data-source'))openSource(+b.dataset.source);
  else if(b?.hasAttribute('data-retry')||b?.hasAttribute('data-passage'))renderEvidence(catalog.records.find(r=>r.id===state.record));
  if(e.target.closest('#more')){limit+=12;renderCards();rememberRegion()}
 });
 document.addEventListener('input',e=>{if(e.target.id==='region-search'){search=e.target.value;limit=12;renderCards();syncUrl(true);rememberRegion()}if(e.target.id==='global-search')renderSearch()});
 document.addEventListener('change',e=>{
  if(e.target.id==='result-sort'){sort=e.target.value;if(['gph','prices','sales'].includes(sort))valueFilter=sort;limit=12;renderRegion();$('#result-sort').focus({preventScroll:true});syncUrl();rememberRegion()}
  if(e.target.id==='map-layer'){mapLayer=e.target.value;renderMap();syncUrl()}
 });
 document.addEventListener('toggle',e=>{
  if(e.target.matches('.run-history')){if(e.target.open)expandedGroups.add(e.target.dataset.group);else expandedGroups.delete(e.target.dataset.group)}
  if(e.target.id==='transcript-disclosure'&&e.target.open&&e.target.isConnected&&state.record){const evidence=$('#evidence');if(evidence&&!evidence.dataset.loaded)renderEvidence(catalog.records.find(r=>r.id===state.record))}
 },true);
 document.addEventListener('focusin',e=>{if(e.target.matches('.item-link'))itemHoverEvent(e.target,'mouseover')});
 document.addEventListener('focusout',e=>{if(e.target.matches('.item-link'))itemHoverEvent(e.target,'mouseout')});
 document.addEventListener('keydown',e=>{
  if(!ready)return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return}
  if($('#atlas-search').open){
   if(e.key==='Escape'){e.preventDefault();closeSearch();return}
   if(['ArrowDown','ArrowUp'].includes(e.key)){const buttons=[...$('#global-results').querySelectorAll('button')],index=buttons.indexOf(document.activeElement);e.preventDefault();if(e.key==='ArrowDown')(buttons[index+1]||buttons[0])?.focus();else if(index<=0)$('#global-search').focus();else buttons[index-1].focus()}
   if(e.key==='Enter'&&e.target.id==='global-search'){e.preventDefault();$('#global-results button')?.click()}
   return;
  }
  if(e.key==='Escape'&&document.activeElement.matches('.item-link')){dismissItem();document.activeElement.blur();e.preventDefault();return}
  if(['Enter',' '].includes(e.key)&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
  if(e.key==='Escape'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))back();
 });
 $('#reset').onclick=()=>{if(ready)enterContinent('world')};$('#back').onclick=()=>{if(ready)back()};$('#close').onclick=()=>{if(ready)enterContinent(state.continent)};
 $('#mobile-map-toggle').onclick=()=>{mapExpanded=!mapExpanded;$('#atlas').classList.toggle('map-expanded',mapExpanded);renderMap()};
 $('#search-open').onclick=openSearch;$('#search-close').onclick=closeSearch;
 $('#atlas-search').addEventListener('click',e=>{if(e.target===$('#atlas-search')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSearch()}});
 $('#world-map').addEventListener('pointerover',e=>{const n=e.target.closest('.map-zone');if(n)tooltip(n,e)});
 $('#world-map').addEventListener('pointerout',e=>{if(!e.relatedTarget?.closest?.('.map-zone'))$('#map-tooltip').hidden=true});
 $('#world-map').addEventListener('focusin',e=>{const n=e.target.closest('.map-zone');if(n)tooltip(n)});$('#world-map').addEventListener('focusout',()=>$('#map-tooltip').hidden=true);
 window.addEventListener('popstate',()=>{if(ready)readRoute()});window.addEventListener('hashchange',()=>{if(ready)readRoute()});
}
async function init(){
 try{
  const itemPromise=fetch('./item-tooltips.json').then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}));
  const methodsPromise=fetch('./method-groups.json').then(r=>r.ok?r.json():{groups:[]}).catch(()=>({groups:[]}));
  [mapData,catalog]=await Promise.all(['./map-data.json','./audit-data.json'].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error();return r.json()})));
  items=(await itemPromise).items;itemLinks=createItemLinks(items);const methods=await methodsPromise;catalog.methodGroups=methods.groups;catalog.preparation=methods.preparation||{};
  const byId=new Map(catalog.records.map(r=>[r.id,r]));
  for(const r of catalog.records){r.preparation=catalog.preparation[r.id]||[];r.regions=geography(r);r.earnings=earningsFor(r,byId);const itemNames=r.earnings.map(b=>b.item?itemLinks.resolve(b.item)?.name+' '+b.item:'');r.searchText=[r.name,r.zone,r.regions.join(' '),r.guide||'',r.summary,JSON.stringify(r.metrics),JSON.stringify(r.valued_drops||[]),...itemNames,...r.earnings.map(b=>b.label+' '+valueCategory(b)+' '+resultLabel(b))].join(' ')}
  groups=groupRecords(catalog.records,catalog.methodGroups);for(const group of groups)for(const r of group.records)groupsByRecord.set(r.id,group);
  for(const zone of new Set(catalog.records.flatMap(r=>r.regions)))insights.set(zone,zoneInsight(zoneRecords(zone),zoneGroups(zone)));
  makeSearchIndex();buildMap();ready=true;$('#loading').hidden=true;$('#coverage-label').textContent=`· ${catalog.unique_videos} videos`;bindEvents();readRoute();if(!location.hash.startsWith('#map'))route(state,{replace:true});
 }catch(error){$('#loading').textContent='The atlas could not load. Reload to try again.';console.error('Atlas initialization failed',error)}
}
init();
