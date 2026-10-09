const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
const escapePattern=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/['’]/g,"['’]").replace(/[ _]+/g,'[ _]+');

// Explicit IDs only: an unresolved caption name never turns into a guessed item.
export function createItemLinks(items){
 const matches=new Map(),names=new Set();
 for(const item of items){
  if(!Number.isSafeInteger(item.id)||item.id<=0)continue;
  for(const name of [item.name,...(item.aliases||[])]){
   if(!name)continue;
   const key=normalize(name),previous=matches.get(key);
   matches.set(key,previous && previous.id!==item.id ? {ambiguous:true} : item);
   names.add(name);
  }
 }
 const alternatives=[...names].sort((a,b)=>b.length-a.length).map(escapePattern);
 const pattern=alternatives.length?new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`,'giu'):null;
 const resolve=name=>{const item=matches.get(normalize(name));return item?.ambiguous?null:item||null};
 function link(name){
  const item=resolve(name);
  if(!item)return escapeHtml(name);
  return `<a class="item-link" href="https://www.wowhead.com/item=${item.id}" data-wowhead="item=${item.id}&amp;domain=www" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(name)} — item details on Wowhead">${escapeHtml(name)}</a>`;
 }
 function decorate(value){
  const text=String(value??'');if(!pattern)return escapeHtml(text);
  let html='',end=0;
  for(const match of text.matchAll(pattern)){html+=escapeHtml(text.slice(end,match.index))+link(match[0]);end=match.index+match[0].length}
  return html+escapeHtml(text.slice(end));
 }
 return {link,decorate,resolve};
}
