import {cpSync,mkdirSync,rmSync,readdirSync} from 'node:fs';
const output=new URL('./dist/',import.meta.url),source=new URL('./public/',import.meta.url);
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
cpSync(source,output,{recursive:true});
cpSync(new URL('./data/MAP-ATTRIBUTION.md',import.meta.url),new URL('MAP-ATTRIBUTION.md',output));
console.log(`Built static website with ${readdirSync(source).length} assets. Upload the contents of dashboard/dist to your hosting directory.`);
