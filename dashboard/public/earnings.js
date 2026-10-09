// Earnings are independent of outcome status. Only explicit monetary fields are
// eligible: counts, sale frequencies, balances, costs and token goals are not values.
const recordedKeys = [
  'reported_consistent_gold_per_hour','reported_normal_gold_per_hour',
  'reported_material_gold_per_hour','reported_material_gph',
  'reported_tradegoods_gold_per_hour','material_gold_per_hour',
  'reported_gold_per_hour','reported_gold_per_hour_approx',
  'reported_gold_per_hour_range','reported_gold_per_hour_lower_bound',
  'reported_skinning_gold_per_hour','reported_gph','total_loot_value_gph',
  'reported_total_gold_per_hour','total_gold_per_hour','total_gold_per_hour_range',
  'reported_processing_gold_per_hour','reported_processing_gold_per_hour_approx',
  'reported_raw_gold_per_hour','raw_vendor_gold_per_hour','raw_gold_per_hour_approx',
  'raw_vendor_gold_per_hour_approx','material_gold_per_hour_approx',
  'herb_gold_per_hour_approx','essence_only_gold_per_hour_approx',
  'charm_only_gold_per_hour_approx','junkbox_only_reported_gold_per_hour',
  'tradegoods_gold_per_hour_approx','tradegoods_gold_per_hour','DE_gold_per_hour',
  'DE_appraisal_gold_per_farm_hour_approx','egg_gold_per_hour','reported_lucky_gold_per_hour'
];
const estimatedKeys = [
  'expected_gold_per_lockout_hour','calculated_gold_per_hour','derived_gold_per_hour',
  'extrapolated_gold_per_hour','projected_gold_per_hour',
  'repriced_projected_gold_per_hour_range','projected_processing_gold_per_hour_range',
  'processing_only_extrapolated_gold_per_hour','derived_active_gold_per_hour','author_theoretical_gold_per_hour'
];
const itemKeys = [
  'expected_sale_gold_range','quoted_EU_gold','quoted_regional_sale_average_gold',
  'quoted_sale_gold','quoted_sale_gold_lower_bound','quoted_Cleaver_sale_gold',
  'quoted_region_sale_gold','quoted_regional_sale_gold_approx','quoted_item_value_gold',
  'quoted_item_price_gold_range','quoted_pet_gold','quoted_pet_gold_range',
  'quoted_pet_sale_gold_approx','quoted_market_gold','quoted_market_gold_approx',
  'quoted_market_gold_range','quoted_market_gold_lower_bound',
  'quoted_plan_gold','quoted_plan_gold_range','quoted_pattern_gold','quoted_pattern_gold_range',
  'quoted_schematic_gold','quoted_recipe_gold_range','quoted_gold_range','quoted_listing_gold',
  'quoted_listing_gold_range','listing_gold','quoted_unit_gold','quoted_unit_gold_range',
  'quoted_unit_value_gold','quoted_unit_sale_gold_approx','quoted_unit_sale_gold_range',
  'quoted_sale_gold','quoted_sale_gold_range','quoted_piece_gold_range',
  'quoted_each_market_gold','quoted_NA_gold','quoted_Hurricane_gold','quoted_bow_gold',
  'quoted_axe_gold','quoted_Hanzo_gold','quoted_MoonMoon_gold_range',
  'quoted_mask_gold','quoted_shoulders_gold_range','quoted_leggings_gold_range',
  'quoted_mount_sale_gold','quoted_sconce_gold_range','quoted_rug_gold_range',
  'quoted_Cleaver_sale_gold','quoted_Cleaver_market_gold','quoted_knot_price_gold',
  'quoted_stars_unit_gold','quoted_light_leather_unit_gold','quoted_pearl_unit_gold',
  'quoted_fish_unit_gold','quoted_firewater_gold_range','quoted_egg_gold_approx',
  'seasonal_quoted_egg_gold_range','quoted_usual_unit_gold','quoted_primal_leather_gold',
  'quoted_Elementium_unit_gold','quoted_crystal_gold','quoted_hide_gold_lower_bound',
  'quoted_ore_gold','quoted_ore_gold_range','quoted_bar_gold_range','quoted_ore_unit_gold',
  'quoted_bar_unit_gold_range','quoted_bolt_gold_range','quoted_tin_gold',
  'expected_output_per_tin_gold','quoted_output_gold','quoted_output_gold_range'
];
const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
function amount(value) {
  if (numeric(value)) return {min:value,max:value};
  if (Array.isArray(value) && value.length===2 && value.every(numeric) && value[0]<=value[1]) return {min:value[0],max:value[1]};
  return null;
}
function first(keys, metrics) {
  for (const key of keys) {const value=amount(metrics[key]);if(value)return {key,...value};}
  return null;
}
function scope(key) {
  if (key.includes('processing')) return 'Processing time only';
  if (key.includes('raw') || key.includes('vendor')) return 'Raw / vendor gold only';
  if (key.includes('material') || key.includes('tradegoods')) return 'Trade goods only';
  if (key.includes('essence_only')) return 'Essences only';
  if (key.includes('charm_only')) return 'Charms only';
  if (key.includes('junkbox_only')) return 'Junkboxes only';
  if (key.includes('DE_')) return 'Disenchanting value only';
  return 'Recorded test valuation';
}
function candidate(entry, kind, label, basis) {
  return {...entry,kind,label,basis,lowerBound:entry.key.includes('lower_bound'),approx:entry.key.includes('approx')};
}
export function earningsFor(record, recordsById) {
  const metrics=record.metrics || {}, badges=[];
  const isTest=['farm','experiment'].includes(record.kind);
  if (isTest) {
    const recorded=first(recordedKeys,metrics);
    const estimated=first(estimatedKeys,metrics);
    if (recorded) badges.push(candidate(recorded,'recorded',recorded.key.includes('lucky')?'Lucky session':recorded.key.includes('processing')?'Processing':'Recorded',recorded.key.includes('lucky')?'Historical session including a lucky rare drop; not a repeatability estimate':scope(recorded.key)));
    else if (estimated) badges.push(candidate(estimated,'estimated',estimated.key.includes('processing')?'Processing':estimated.key.includes('active')?'Active time':estimated.key.includes('theoretical')?'Claimed EV':estimated.key.includes('projected')?'Projected':'Estimated',estimated.key.includes('theoretical')?'The creator’s expected-value calculation; assumptions and uncertainty are retained in the source':estimated.key.includes('active')?'Active farming time extrapolated to one hour; later spawn suppression limits repeatability':estimated.key==='expected_gold_per_lockout_hour'?'Expected return with the hourly reset cap included':estimated.key.includes('processing')?'Projected processing return; farming inputs takes additional time':estimated.key.includes('projected')?'Projection stated in the transcript; its assumptions remain in the evidence':'Calculated or extrapolated from the recorded test'));
    else if (!metrics.digits_uncertain) {
      // Raw basket appraisals stay separate from processed output prices when
      // processing time was excluded. No rare-drop or transmog rate is inferred.
      const basket=first(['raw_appraisal_gold','appraisal_gold'],metrics);
      const minutes=metrics.minutes ?? metrics.duration_minutes;
      if (basket && numeric(minutes) && minutes>0) badges.push(candidate({...basket,min:basket.min*60/minutes,max:basket.max*60/minutes},'estimated','Estimated',`Recorded basket appraisal divided by ${minutes} minutes of farming; this is appraised value, not confirmed sales`));
    }
  }
  const namedKeys=Object.keys(metrics).filter(key=>!key.startsWith('output_') && !key.startsWith('quoted_') && /^(?:.+_quoted_gold(?:_range)?|.+ quoted_gold|.+_(?:listing|market)_gold)$/.test(key));
  const valuedDrops=record.valued_drops || [];
  for (const [index,drop] of valuedDrops.entries()) {
    const quote=amount(drop.quote_gold), sale=amount(drop.sale_gold);
    const shared={item:drop.item,obtained:drop.obtained,sourceRecordId:record.id};
    if(quote || drop.quote_text)badges.push({...candidate({key:`valued_drops.${index}.quote_gold`,...(quote || {min:0,max:0})},'item',drop.quote_label || (drop.obtained===false?'Rare target':'Item value'),drop.note || 'Historical quoted item price'),...shared,displayValue:drop.quote_text,lowerBound:drop.quote_bound==='lower',upperBound:drop.quote_bound==='upper',strictBound:Boolean(drop.quote_strict),source_refs:drop.source_refs || []});
    if(sale)badges.push({...candidate({key:`valued_drops.${index}.sale_gold`,...sale},'sale','Sold','Actual sale reported in the transcript'),...shared,lowerBound:drop.sale_bound==='lower',upperBound:drop.sale_bound==='upper',strictBound:Boolean(drop.sale_strict),source_refs:drop.sale_source_refs || drop.source_refs || []});
  }
  const item=valuedDrops.length?null:first([...itemKeys,...namedKeys],metrics);
  if (item) badges.push({...candidate(item,'item','Item value',item.key.startsWith('expected')?'Expected sale or output value stated in the transcript':item.key==='quoted_EU_gold'?'Historical quoted EU item price':item.key==='quoted_NA_gold'?'Historical quoted North American item price':'Historical quoted item price from the transcript'),item:namedKeys.includes(item.key)?item.key.replace(/_(?:quoted_gold(?:_range)?|listing_gold|market_gold)$| quoted_gold$/,'').replaceAll('_',' '):undefined});
  // Named secondary loot must not disappear behind the first quoted item.
  if(!valuedDrops.length)for(const key of namedKeys){
    const value=amount(metrics[key]);
    if(!value || key===item?.key)continue;
    badges.push({...candidate({key,...value},'item','Item value','Historical quoted item price from the transcript'),item:key.replace(/_(?:quoted_gold(?:_range)?|listing_gold|market_gold)$| quoted_gold$/,'').replaceAll('_',' ')});
  }
  for(const [index,value] of (record.additional_values || []).entries()){
    const parsed=amount(value.value);
    if(!parsed)continue;
    badges.push({...parsed,key:`additional_values.${index}`,kind:value.kind,label:value.label,basis:value.basis,unit:value.unit,item:value.item,negative:Boolean(value.negative),approx:Boolean(value.approx),lowerBound:Boolean(value.lower_bound),upperBound:Boolean(value.upper_bound),strictBound:Boolean(value.strict_bound),source_refs:value.source_refs});
  }
  if (!badges.length) {const batch=first(['batch_material_gold_range','appraised_gold','quoted_basket_value_gold','appraised_value_gold','appraised_session_gold','output_market_gold'],metrics);if(batch)badges.push(candidate(batch,'batch','Batch value','Historical appraised value of this batch or session; no hourly return inferred'));}
  for(const badge of badges){
    badge.sourceRecordId ||= record.id;
    badge.source_refs ||= record.source ? [{episode:record.episode,paragraph_start:record.source.paragraph_start,paragraph_end:record.source.paragraph_end,start_time:record.source.start_time}] : [];
  }
  if(recordsById)for(const link of record.related_records || []){
    if(link.role!=='component' || !link.include_earnings)continue;
    const component=recordsById.get(link.id);
    if(!component)continue;
    // Inherit loot values and individual-leg rates, never a combined rotation GPH.
    for(const original of earningsFor(component)){
      const badge={...original,inherited:true,componentName:component.name};
      if(['recorded','estimated'].includes(badge.kind)){
        badge.kind='component';badge.label='Component GPH';
        badge.basis=`${component.name}: ${badge.basis}. This rate belongs to that leg of the rotation.`;
      }
      else if(badge.kind==='sale')badge.label='Sold in episode';
      badges.push(badge);
    }
  }
  const priority={recorded:0,estimated:0,item:1,batch:1,value:1,sale:2,component:3};
  return badges.sort((a,b)=>(priority[a.kind]-priority[b.kind]) || b.max-a.max);
}
export const hasGph = badges => badges.some(badge=>badge.kind==='recorded'||badge.kind==='estimated');
export const hasValue = badges => badges.length>0;
export function formatEarning(badge) {
  if(badge.displayValue)return badge.displayValue;
  const formatter=new Intl.NumberFormat('en',{maximumFractionDigits:2});
  const values=badge.min===badge.max?formatter.format(badge.min):`${formatter.format(badge.min)}–${formatter.format(badge.max)}`;
  const prefix=badge.lowerBound?(badge.strictBound?'>':'≥'):badge.upperBound?(badge.strictBound?'<':'≤'):badge.kind==='estimated'||badge.approx?'≈':'';
  return `${badge.negative?'−':''}${prefix}${values}${badge.unit || (['item','batch','sale','value'].includes(badge.kind)?'g':'g/h')}`;
}
