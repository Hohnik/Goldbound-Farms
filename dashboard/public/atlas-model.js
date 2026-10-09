export const normalizeSearch=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
export function searchMatches(text,query){
 const normalized=normalizeSearch(text),term=normalizeSearch(query),tokens=normalized.split(' '),words=term.split(' ').filter(Boolean);
 if(!words.length)return true;
 return words.every(word=>tokens.some(token=>token.startsWith(word)))||normalized.replaceAll(' ','').includes(term.replaceAll(' ',''));
}
const chronological=(a,b)=>b.episode-a.episode||b.id.localeCompare(a.id);
export function valueCategory(badge){
 if(['recorded','estimated'].includes(badge.kind))return 'gph';
 if(badge.kind==='item')return 'prices';
 if(badge.kind==='sale')return 'sales';
 if(badge.kind==='component')return 'components';
 return 'other';
}
export function badgesFor(record,category='all'){
 return (record.earnings||[]).filter(b=>category==='all'||valueCategory(b)===category);
}
export function baselineRate(record){
 // The map compares farming tests, not jackpots, listings, future-price models,
 // processing-only rates, or rates belonging to another leg of a rotation.
 return badgesFor(record,'gph').filter(b=>!b.inherited&&!b.upperBound&&!/lucky|jackpot|processing|projected|claimed ev|active time/i.test(b.label+' '+b.key)&&!/theoretical|expected-value|projection|processing time only|active farming time/i.test(b.basis)).sort((a,b)=>b.min-a.min)[0]||null;
}
export function preferredBadge(record,category='all'){
 const badges=badgesFor(record,category);
 if(category==='prices'||category==='sales'){
  const ranked=badges.filter(b=>!b.negative&&!b.displayValue&&!b.upperBound&&(category!=='sales'||!b.unit||b.unit==='g')).sort((a,b)=>b.min-a.min);
  return ranked[0]||badges[0]||null;
 }
 if(category!=='all')return badges.find(b=>b===baselineRate(record))||badges[0]||null;
 return baselineRate(record)||badges.find(b=>valueCategory(b)==='gph')||badges.find(b=>b.kind==='sale'&&!b.inherited)||badges.find(b=>b.kind==='item')||badges[0]||null;
}
export function comparisonValue(record,sort){
 const category={gph:'gph',prices:'prices',sales:'sales'}[sort];
 if(!category)return null;
 const badges=badgesFor(record,category).filter(b=>!b.negative&&!b.displayValue&&!b.upperBound&&(category!=='sales'||!b.unit||b.unit==='g'));
 if(category==='gph'){const baseline=baselineRate(record);return baseline?.min??null}
 return badges.length?Math.max(...badges.map(b=>b.min)):null;
}
export function resultLabel(badge){
 if(!badge)return 'No value recorded';
 if(badge.inherited)return badge.kind==='component'?'Component GPH':badge.kind==='sale'?'Component sale':'Component quote';
 const category=valueCategory(badge);
 if(category==='prices')return badge.label==='Listing'||/listing/.test(badge.key)?'Asking price':/regional_sale_average/.test(badge.key)?'Regional sale average':badge.obtained===false?'Target quote':'Market quote';
 if(category==='sales')return /gross/i.test(badge.label+' '+badge.basis)?'Gross sale':'Reported sale';
 if(category==='gph'){
  if(/lucky|jackpot/i.test(badge.label+' '+badge.key))return 'Lucky session';
  if(/processing/i.test(badge.label+' '+badge.key))return 'Processing time only';
  if(/raw|vendor/i.test(badge.key+' '+badge.basis))return 'Raw / vendor gold';
  if(/claimed ev|theoretical|expected-value/i.test(badge.label+' '+badge.key+' '+badge.basis))return 'Expected-value model';
  return badge.kind==='estimated'?'Calculated appraisal':'Recorded appraisal';
 }
 if(category==='components')return 'Component GPH';
 return badge.label;
}
export function earningsDisclosure(record){
 const badges=record.earnings||[];
 // A lone figure is already visible in the result header.
 if(badges.length<2)return null;
 if(badges.some(b=>b.inherited))return 'Rotation values';
 const items=new Set(badges.map(b=>b.item).filter(Boolean));
 if(items.size>1)return 'Earnings breakdown';
 const categories=new Set(badges.map(valueCategory));
 if(items.size===1&&[...categories].every(c=>['prices','sales'].includes(c))){
  if(categories.size===2)return 'Price & sale';
  return categories.has('sales')?'Sale receipts':'Price references';
 }
 if(categories.size===1&&categories.has('gph'))return 'Session values';
 if(categories.size===1&&categories.has('sales'))return 'Sale receipts';
 return 'Value details';
}
export function groupRecords(records,definitions=[]){
 const byRecord=new Map();
 for(const group of definitions)for(const id of group.record_ids)byRecord.set(id,group);
 const groups=new Map();
 for(const record of records){
  const definition=byRecord.get(record.id);
  // Identical names are grouped only within the same zone and activity type.
  const id=definition?.id||`${record.kind}:${record.zone}:${normalizeSearch(record.name)}`;
  if(!groups.has(id))groups.set(id,{id,title:definition?.title||record.name,requirements:definition?.requirements||[],records:[]});
  groups.get(id).records.push(record);
 }
 for(const group of groups.values()){group.records.sort(chronological);group.latest=group.records[0]}
 return [...groups.values()];
}
export function selectGroups(groups,{kind='farm',query='',category='all',sort='latest'}={}){
 const selected=[];
 for(const group of groups){
  const matching=group.records.filter(r=>{
   const resultMatches=category==='all'||(category==='value'?r.earnings.length>0:badgesFor(r,category).length>0);
   return (kind==='all'||r.kind===kind)&&resultMatches&&searchMatches(group.title+' '+r.searchText,query);
  });
  if(!matching.length)continue;
  let primary=matching[0];
  if(['gph','prices','sales'].includes(sort)){
   const ranked=matching.filter(r=>comparisonValue(r,sort)!==null).sort((a,b)=>comparisonValue(b,sort)-comparisonValue(a,sort)||chronological(a,b));
   if(ranked.length)primary=ranked[0];
  }else if(!primary.earnings.length){primary=matching.find(r=>r.earnings.length)||primary}
  selected.push({...group,primary,matching});
 }
 return selected.sort((a,b)=>{
  if(sort==='name')return a.title.localeCompare(b.title);
  if(['gph','prices','sales'].includes(sort))return (comparisonValue(b.primary,sort)??-Infinity)-(comparisonValue(a.primary,sort)??-Infinity)||chronological(a.primary,b.primary);
  return chronological(a.latest,b.latest);
 });
}
export function zoneInsight(records,groups){
 const farms=records.filter(r=>r.kind==='farm');
 const rates=farms.map(record=>({record,badge:baselineRate(record)})).filter(r=>r.badge).sort((a,b)=>b.badge.min-a.badge.min);
 const rare=farms.flatMap(record=>badgesFor(record,'prices').filter(b=>!b.displayValue&&b.min>=1000&&(b.item||/rare|hunt|target|world.?drop|transmog|whelpling|hatchling|blue|pattern|cowl|robes|pet|plans|blade|sword|cleaver|jackpot/i.test(record.name))).map(badge=>({record,badge}))).sort((a,b)=>b.badge.min-a.badge.min);
 return {count:groups.filter(g=>g.records.some(r=>r.kind==='farm')).length,records:records.length,rate:rates[0]||null,rare:rare[0]||null};
}
export function recordedDuration(metrics){
 const gathering=metrics.gather_minutes??metrics.gathering_minutes;
 if(typeof gathering==='number'&&typeof metrics.processing_minutes==='number')return `${gathering} min gathering + ${metrics.processing_minutes} min processing`;
 for(const [keys,unit] of [
  [['minutes','duration_minutes','duration_minutes_approx','test_minutes','total_minutes','session_minutes_range','minutes_approx','minutes_approx_range','minutes_range','minutes_lower_bound','minutes_upper_bound'],'min'],
  [['hours','hours_approx','hours_range','hours_lower_bound','duration_hours','session_hours_approx','session_hours_range','farming_hours_range'],'h'],
  [['active_minutes','active_minutes_approx'],'min active'],
  [['run_minutes','run_minutes_approx','run_minutes_range','clear_minutes','full_run_minutes_range'],'min/run'],
  [['batch_minutes_range'],'min/batch'],
  [['gather_minutes','gathering_minutes'],'min gathering']
 ]){
  for(const key of keys){const value=metrics[key];if(typeof value!=='number'&&!Array.isArray(value))continue;
   const text=Array.isArray(value)?value.join('–'):String(value);
   return `${key.includes('lower_bound')?'≥':key.includes('upper_bound')?'≤':key.includes('approx')?'≈':''}${text} ${unit}`;
  }
 }
 return 'Not stated';
}
export function preparationFor(record,group){
 const text=record.name.toLowerCase(),requirements=new Set([...(group?.requirements||[]),...(record.preparation||[])]);
 if(/pickpocket/.test(text)||Object.keys(record.metrics).some(k=>/^pickpockets/.test(k)))requirements.add('Rogue');
 if(/\bskin(?:ning)?\b/.test(text))requirements.add('Skinning');
 if(/fishing/.test(text))requirements.add('Fishing');
 if(/mining|copper-only|thorium|ore-focused/.test(text))requirements.add('Mining');
 if(/\bherb(?:alism)?\b/.test(text))requirements.add('Herbalism');
 if(/\bmilling\b|\bpigments?\b|\binks?\b/.test(text))requirements.add('Inscription');
 if(/dual-gather|dual gathering/.test(text)){requirements.add('Mining');requirements.add('Herbalism')}
 for(const [key,value] of Object.entries(record.metrics))if(/^required_.+skill|^required_inscription_skill/.test(key))requirements.add(`${key.replace(/^required_|_skill$/g,'').replaceAll('_',' ')} ${value}`);
 return [...requirements];
}
export function limitationFor(record,badge){
 if(record.metrics.digits_uncertain||record.unverified_metrics)return 'Some figures are unverified; see transcript evidence.';
 if(!badge)return '';
 if(badge.inherited||badge.kind==='component')return 'Component values only; no combined GPH recorded.';
 if(valueCategory(badge)==='sales')return /loss/i.test(badge.basis)?'Sold at a loss; this is the gross receipt.':'';
 if(valueCategory(badge)==='prices')return '';
 if(/lucky|jackpot/.test((badge.label+' '+badge.key).toLowerCase()))return 'Includes lucky loot; not a repeatable baseline.';
 if(/claimed ev|theoretical|expected-value/i.test(badge.label+' '+badge.key+' '+badge.basis))return 'Modelled from drop chances and assumed sale prices.';
 if(/processing/.test((badge.label+' '+badge.key).toLowerCase()))return 'Gathering time excluded.';
 if(/reset cap|hourly reset cap/.test(badge.basis))return 'Includes the hourly instance reset cap.';
 if(/seasonal|pilgrim|noblegarden|darkmoon/i.test(record.name+' '+record.summary))return 'Event availability and seasonal prices apply.';
 return '';
}
