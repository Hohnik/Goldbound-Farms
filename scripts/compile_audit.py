from pathlib import Path
import json, re, hashlib
from collections import Counter
ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'audit'
PUBLIC = ROOT / 'dashboard/public'
index = json.loads((AUDIT / 'source-index.json').read_text())
reviews = [json.loads(p.read_text()) for p in sorted((AUDIT / 'reviews').glob('*.json'))]
alternates = json.loads((AUDIT / 'alternate-reviews.json').read_text())
assert [r['source_id'] for r in reviews] == list(range(1,39))
assert len(index) == 45 and len(alternates) == 7
assert all(r['full_text_reviewed'] for r in reviews + alternates)
backup = ROOT / 'goldbound/original-vtt'
# Final presentation cleanup preserves paragraph numbering and evidence timestamps.
def noise(text):
    text = re.sub(r'\[(?:music|applause|laughter|snorts|coughs|silence|screaming)\]', '', text, flags=re.I)
    text = text.replace('{slash}', '/').replace('{question mark}', '?')
    return re.sub(r'\s+', ' ', text).strip()
for s in index:
    raw = backup / s['source_file']
    assert hashlib.sha256(raw.read_bytes()).hexdigest() == s['source_sha256']
    for p in s['paragraphs']: p['text'] = noise(p['text'])
    s['cleaned_words'] = sum(len(p['text'].split()) for p in s['paragraphs'])
    s['original_file'] = str(raw.relative_to(ROOT))
    s['canonical_file'] = 'goldbound/' + Path(s['cleaned_file']).name
    s['cleaned_file'] = s['canonical_file']
    clean_text = '\n\n'.join(p['text'] for p in s['paragraphs']) + '\n'
    (ROOT / s['canonical_file']).write_text(clean_text)
    assert not re.search(r'WEBVTT|-->|<[^>]+>|align:start|position:0%|\[(?:music|screaming)\]', clean_text)
records = []
for review in reviews:
    source = next(s for s in index if s['source_file'] == review['source_file'])
    assert review['paragraph_count'] == len(source['paragraphs'])
    for e in review['records']:
        assert isinstance(e.get('guide'),str) and 1 <= len(e['guide'].split()) <= 55, f"Missing or long guide: {e['id']}"
        assert e['guide'] == e['guide'].strip() and '\n' not in e['guide'], f"Guide formatting: {e['id']}"
        a,b = e['source']['paragraph_start'],e['source']['paragraph_end']
        assert 1 <= a <= b <= len(source['paragraphs'])
        e['source']['quote'] = source['paragraphs'][a-1]['text']
        e['source']['cleaned_file'] = source['cleaned_file']
        e['source']['canonical_file'] = source['canonical_file']
        e['source']['original_file'] = source['original_file']
        if 'T wilights Blade' in e['metrics']: e['metrics']['Twilights Blade'] = e['metrics'].pop('T wilights Blade')
        e['name'] = re.sub(r'(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])', ' ', e['name']).replace('ret est', 'retest')
        e['summary'] = re.sub(r'(?<=[a-z])(?=[A-Z])|(?<=\d)(?=[A-Za-z])|(?<=[A-Za-z])(?=\d)', ' ', e['summary'])
        e['summary'] = re.sub(r'(?<=[,;.!?])(?=[A-Za-z])', ' ', e['summary'])
        records.append({'episode':review['source_id'], **e})
    review['cleaned_file'] = source['cleaned_file']
    (AUDIT/'reviews'/f"{review['source_id']:03}.json").write_text(json.dumps(review,ensure_ascii=False,indent=2))
# Linked component values retain independent evidence and do not become route GPH.
record_ids={e['id'] for e in records}
def validate_refs(refs):
    assert refs
    for ref in refs:
        source=next(s for s in index if s['episode_file_id']==ref['episode'] and '.en-orig.' in s['source_file'])
        assert 1 <= ref['paragraph_start'] <= ref['paragraph_end'] <= len(source['paragraphs'])
        assert ref['start_time'] == source['paragraphs'][ref['paragraph_start']-1]['time']
for e in records:
    if e.get('guide_source_refs'): validate_refs(e['guide_source_refs'])
    for link in e.get('related_records',[]):
        assert link['id'] in record_ids and link['id'] != e['id']
    for drop in e.get('valued_drops',[]):
        assert drop['item'] and drop.get('source_refs')
        assert any(key in drop for key in ['quote_gold','quote_text','sale_gold'])
        validate_refs(drop['source_refs'] + drop.get('sale_source_refs',[]))
    for value in e.get('additional_values',[]):
        assert value['label'] and value['basis']
        assert value['kind'] in ['value','sale','recorded','estimated']
        assert value['unit'] in ['g','g/h','g/day','g/run','g/use','g/item','g/craft','g/bar','g/herb','g/kill']
        assert (value['kind'] in ['recorded','estimated']) == (value['unit']=='g/h')
        numbers=value['value'] if isinstance(value['value'],list) else [value['value']]
        assert len(numbers) in [1,2] and all(isinstance(n,(int,float)) and n>=0 for n in numbers)
        assert numbers==sorted(numbers)
        validate_refs(value['source_refs'])
kinds = dict(Counter(e['kind'] for e in records))
coverage = []
for s in index:
    primary = '.en-orig.' in s['source_file']
    coverage.append({'id':s['episode_file_id'],'file':s['source_file'],'cleaned_file':s['canonical_file'],'track':'primary' if primary else 'alternate','full_text_reviewed':True,'paragraphs':len(s['paragraphs']),'words':s['cleaned_words'],'entries':sum(e['episode']==s['episode_file_id'] for e in records) if primary else 0})
data = {'title':'Goldbound — complete transcript audit','reviewed_files':45,'unique_videos':38,'alternate_tracks':7,'record_count':len(records),'kinds':kinds,'scope':'Episode-specific records, including repeated tests and sales follow-ups. These are not a count of unique profitable farms. Historical transcript evidence, not live benchmarks.','coverage':coverage,'alternate_reviews':alternates,'records':records}
(AUDIT/'source-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2))
web_records=[]
for e in records:
    e=json.loads(json.dumps(e));e['source'].pop('quote',None);web_records.append(e)
(PUBLIC/'audit-data.json').write_text(json.dumps({**data,'records':web_records},ensure_ascii=False))
(PUBLIC/'audit-sources.json').write_text(json.dumps(index,ensure_ascii=False))
print(json.dumps({'files_reviewed':len(coverage),'records':len(records),'by_kind':kinds,'canonical_transcripts':len(list((ROOT/'goldbound').glob('*.txt'))),'original_backups':len(list(backup.glob('*.vtt')))},indent=2))
