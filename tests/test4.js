const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:1300}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/out/내방식패스_시제품.html'); await p.waitForTimeout(300);
await p.click('[data-preset=elder]'); await p.click('[data-p=show]'); await p.waitForTimeout(1600);
const v=async t=>{ if(!await p.$('#vIn')) await p.click('#ks [data-k=voice]'); await p.fill('#vIn',t); await p.click('#ks [data-k=vsend]'); await p.waitForTimeout(200); return (await p.textContent('#ks .heard').catch(()=>'')).replace(/\s+/g,' '); };
console.log('1', await v('따뜻한 유자차 두 잔이요')); await p.click('#ks [data-k=vyes]'); await p.waitForTimeout(200);
console.log('cart', await p.textContent('#ks .kcart'));
console.log('2', await v('화장실 어디예요'));
console.log('3', await v('다 취소해 줘'));
await p.click('#ks [data-k=vno]'); await p.waitForTimeout(150); console.log('3b', (await p.textContent('#ks .heard')).replace(/\s+/g,' '));
await p.click('#ks [data-k=vclose]'); await p.click('#ks [data-k=tocart]'); console.log('cart still', await p.textContent('#ks .kcart'));
console.log('4', await v('뜨아 두 잔')); await p.click('#ks [data-k=vclose]');
// tab notice
await p.click('[data-kt=gov]'); await p.waitForTimeout(300); console.log('notice', await p.textContent('#gov .ktoast').catch(()=>'none'));
// keypad with real code
const code=await p.evaluate(()=>MBP.toCode(P.profile)); console.log('code',code);
await p.click('#kpadBtn'); for(const d of code) await p.click(`#gov .mbp-kp [data-n="${d}"]`); await p.click('#gov .mbp-kp [data-n=ok]'); await p.waitForTimeout(1600);
console.log('gov mode', await p.textContent('#kmode'), await p.textContent('#gov .gbd button'));
await p.screenshot({path:'shots/v_gov.png'});
// adapt note
await p.click('[data-kt=cafe]'); await p.evaluate(()=>resetKiosk(false)); await p.click('[data-p=show]'); await p.waitForTimeout(1600);
const bb=await (await p.$('#ks [data-item=americano]')).boundingBox(); await p.mouse.click(bb.x+bb.width+5,bb.y+20); await p.mouse.click(bb.x+bb.width+5,bb.y+50); await p.waitForTimeout(200);
await p.click('#ks [data-k=adyes]'); await p.waitForTimeout(200); console.log('adapt', await p.textContent('#phone'));
// blind korean names
await p.click('[data-p=intro]'); await p.click('[data-preset=blind]'); await p.click('[data-p=show]'); await p.waitForTimeout(1600);
console.log('blind names', (await p.$$eval('#ks .kitem .nm',x=>x.map(e=>e.textContent))).join(','));
const m=await b.newPage({viewport:{width:390,height:844}}); await m.goto('file://'+process.cwd()+'/out/내방식패스_시제품.html'); await m.waitForTimeout(300);
console.log('mobile', await m.evaluate(()=>[document.documentElement.scrollWidth, innerWidth]));
await m.screenshot({path:'shots/v_mob.png'});
console.log('errors',errs); await b.close();})();
