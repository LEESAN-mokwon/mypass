const NLU=require('./nlu.js');const fs=require('fs');
for(const n of (process.argv[2]||'train,test').split(',')){
 const rows=fs.readFileSync(n+'.jsonl','utf8').trim().split('\n').map(JSON.parse);
 const out=rows.map(r=>{const f=NLU.feats(r.text);return {i:[...f.keys()],v:[...f.values()],y:r.intent}});
 fs.writeFileSync(n+'.feat.json',JSON.stringify(out));
}
console.log('ok');
