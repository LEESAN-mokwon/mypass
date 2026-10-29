// 사용법: node eval.js 평가파일.jsonl ...   (학습 문장 train2.jsonl과 똑같은 문장은 따로 빼서도 계산)
const NLU=require('./nlu.js');const fs=require('fs');
NLU.load(JSON.parse(fs.readFileSync('model.json')));NLU.setMenu(JSON.parse(fs.readFileSync('menu_aliases.json')));
const norm=t=>t.replace(/\s+/g,' ').trim();
const TRAIN=new Set(fs.existsSync('train2.jsonl')?fs.readFileSync('train2.jsonl','utf8').trim().split('\n').map(l=>norm(JSON.parse(l).text)):[]);
const eq=(a,b)=>JSON.stringify([...a].sort((x,y)=>x.id<y.id?-1:1))===JSON.stringify([...b].sort((x,y)=>x.id<y.id?-1:1));
function score(rows){
  let ia=0,full=0,oN=0,oFull=0;const errs=[];
  for(const r of rows){const p=NLU.parse(r.text);const iok=p.intent===r.intent;ia+=iok;let ok;
    if(r.intent==='remove'){ok=iok&&p.items.map(x=>x.id).join()===r.items.map(x=>x.id).join();}
    else{const items=r.intent==='order'?r.items:[];const pi=(p.intent==='order'||p.intent==='remove')?p.items.map(x=>({id:x.id,qty:x.qty,temp:x.temp})):[];
      ok=iok&&eq(pi,items.map(x=>({id:x.id,qty:x.qty,temp:x.temp})));}
    full+=ok; if(r.intent==='order'){oN++;oFull+=ok;} if(!ok)errs.push([r.text,r.intent,p.intent,JSON.stringify(p.items)]);}
  const pc=(a,b)=>b?(a/b*100).toFixed(1)+'%':'-';
  return {n:rows.length,intent:pc(ia,rows.length),full:pc(full,rows.length),orderN:oN,orderFull:pc(oFull,oN),errs};
}
for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse);
  const uniq=rows.filter(r=>!TRAIN.has(norm(r.text)));
  const a=score(rows),b=score(uniq);
  console.log(`${f}\n  전체 ${a.n}문장: 의도 ${a.intent}, 완전일치 ${a.full}, 주문 문장(${a.orderN})만 완전일치 ${a.orderFull}`);
  console.log(`  학습 문장과 겹치는 ${a.n-b.n}문장 제외 ${b.n}문장: 의도 ${b.intent}, 완전일치 ${b.full}, 주문 문장(${b.orderN})만 완전일치 ${b.orderFull}`);
  if(!f.startsWith('test'))a.errs.forEach(e=>console.log('   ✗',e.join(' | ')));
}
