const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:1100}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/out/index.html'); await p.waitForTimeout(400);
await p.click('#tourBtn'); const t0=Date.now();
let i=0; while(await p.$('.tourcap')){ await p.waitForTimeout(4000); await p.screenshot({path:`shots/t${i++}.png`}); if(Date.now()-t0>150000) break; }
console.log('tour secs',(Date.now()-t0)/1000, 'shots',i);
console.log('log', await p.textContent('#logBody'));
// keypad wrong code
await p.click('[data-kt=cafe]'); await p.click('#kpadBtn'); for(const d of '123456') await p.click(`#ks .mbp-kp [data-n="${d}"]`); await p.click('#ks .mbp-kp [data-n=ok]');
console.log('wrong:', await p.textContent('#ks .mbp-kpm'));
for(const d of '068994') await p.click(`#ks .mbp-kp [data-n="${d}"]`); await p.click('#ks .mbp-kp [data-n=ok]'); await p.waitForTimeout(1600);
console.log('mode', await p.textContent('#kmode'));
await p.screenshot({path:'shots/k_code_blind.png'});
const m=await b.newPage({viewport:{width:390,height:844}}); await m.goto('file://'+process.cwd()+'/out/index.html'); await m.waitForTimeout(300);
console.log('mobile overflow', await m.evaluate(()=>document.documentElement.scrollWidth));
console.log('errors',errs); await b.close();})();
