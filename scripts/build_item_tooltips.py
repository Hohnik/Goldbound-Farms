"""Build the explicit item-name lookup; tooltip content comes from Wowhead Retail."""
from pathlib import Path
import csv,json
ROOT=Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((ROOT/'dashboard/data/item-ids.csv').open()))
records=json.loads((ROOT/'dashboard/public/audit-data.json').read_text())['records']
texts=[]
for record in records:
    texts.extend([record['name'],record['summary'],*record['metrics'].keys(),*(drop['item'] for drop in record.get('valued_drops',[]))])
texts.extend(p['text'] for s in json.loads((ROOT/'audit/source-index.json').read_text()) for p in s['paragraphs'])
text=' '.join(texts).lower().replace('’',"'").replace('_',' ')
counts={}
for row in rows:counts.setdefault(row['name'],set()).add(row['itemId'])
items=[]
for name,ids in counts.items():
    if len(ids)!=1 or len(name)<5 or name.lower().replace('’',"'") not in text:continue
    items.append({'id':int(next(iter(ids))),'name':name,'source':'TradeSkillMaster item IDs in the local EU commodity export'})
overrides=json.loads((ROOT/'dashboard/data/item-tooltip-overrides.json').read_text())
assert len({i['id'] for i in overrides})==len(overrides), 'Combine aliases for duplicate IDs'
for item in overrides:item['source']=f"https://www.wowhead.com/item={item['id']}"
ids={i['id'] for i in overrides}
items=[i for i in items if i['id'] not in ids]+overrides
(ROOT/'dashboard/public/item-tooltips.json').write_text(json.dumps({'provider':'Wowhead Retail','items':sorted(items,key=lambda i:i['name'])},ensure_ascii=False,indent=2)+'\n')
print(f'Mapped {len(items)} item names plus their verified aliases.')
