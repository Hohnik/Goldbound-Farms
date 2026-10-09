from pathlib import Path
import xml.etree.ElementTree as E,json,re
mapping={'eastern-kingdoms':{14:'Stranglethorn Vale',16:'Westfall',18:'Elwynn Forest',20:'Redridge Mountains',22:'Blasted Lands',24:'Swamp of Sorrows',26:'Duskwood',30:'Stranglethorn Vale',40:'Wetlands',42:'Dun Morogh',44:'Loch Modan',46:'Badlands',48:'Searing Gorge',50:'Burning Steppes',86:'The Hinterlands',114:'Arathi Highlands'},'kalimdor':{42:'Thousand Needles',84:'Dustwallow Marsh'}}
centers={'Stranglethorn Vale':[313,954],'Westfall':[232,868],'Elwynn Forest':[295,814],'Redridge Mountains':[405,807],'Blasted Lands':[405,908],'Swamp of Sorrows':[416,852],'Duskwood':[310,864],'Wetlands':[365,575],'Dun Morogh':[300,665],'Loch Modan':[415,668],'Badlands':[423,719],'Searing Gorge':[332,714],'Burning Steppes':[370,765],'The Hinterlands':[419,423],'Arathi Highlands':[411,491],'Thousand Needles':[303,493],'Dustwallow Marsh':[337,451]}
result={}
for name in mapping:
 root=E.parse(Path(__file__).parent/'data'/f'{name}-original.svg').getroot();background=[];zones={}
 for i,p in enumerate(root.iter()):
  if p.tag.endswith('}path') and p.get('fill') and p.get('fill')!='none':
   d=re.sub(r'\s+',' ',p.get('d','')).strip();zone=mapping[name].get(i)
   if zone:zones.setdefault(zone,{'paths':[],'center':centers[zone]})['paths'].append(d)
   else:background.append(d)
 result[name]={'background':background,'zones':zones}
Path(__file__).with_name('public').joinpath('map-data.json').write_text(json.dumps(result,separators=(',',':')))
print('Generated',sum(len(m['zones']) for m in result.values()),'interactive zone boundaries from licensed source outlines.')
