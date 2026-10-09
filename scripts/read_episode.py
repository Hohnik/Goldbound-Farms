from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1];ep=int(sys.argv[1]);index=json.loads((root/'audit/source-index.json').read_text());versions=[v for v in index if v['episode_file_id']==ep];main=next((v for v in versions if ('.en.' if '--alternate' in sys.argv else '.en-orig.') in v['source_file']),versions[0]);print('SOURCE:',main['source_file'],'PARAGRAPHS:',len(main['paragraphs']))
nums=[int(a) for a in sys.argv[2:] if a.isdigit()];start=nums[0]-1 if nums else 0;end=nums[1] if len(nums)>1 else len(main['paragraphs'])
for p in main['paragraphs'][start:end]:print(f"\n[P{p['number']:02d} | {p['time']}]\n{p['text']}")
