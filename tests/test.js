const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:1500}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out/index.html'); await p.waitForTimeout(800);
await p.screenshot({path:'shots/1_initial.png'});
// default kiosk: begin
await p.click('#ks [data-k=begin]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/2_default_menu.png'});
// phone preset elder
await p.click('[data-preset=elder]'); await p.waitForTimeout(300);
const qr=await p.$('.qrbox svg'); await qr.screenshot({path:'shots/qr.png'});
await p.click('[data-p=show]'); await p.waitForTimeout(1600);
await p.screenshot({path:'shots/3_mine_menu.png'});
await p.click('#ks [data-k=voice]'); await p.waitForTimeout(200);
await p.fill('#vIn','따뜻한 유자차 두 잔이요'); await p.click('#ks [data-k=vsend]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/4_voice.png'});
await p.click('#ks [data-k=vyes]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/5_cart.png'});
await p.click('#ks [data-k=paystart]'); await p.click('#ks [data-k=paycard]'); await p.click('#ks [data-k=paid]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/6_done.png'});
console.log('log rows', await p.$$eval('#logBody tr',r=>r.length), await p.textContent('#logBody'));
// manual phone diagnosis flow
await p.click('[data-p=intro]'); await p.click('[data-p=font]'); await p.click('[data-p=fontbig]'); await p.click('[data-p=fontok]');
for(let i=0;i<3;i++){ await p.click('#target'); }
await p.click('[data-p=v1]'); await p.click('[data-p=e1]'); await p.check('[data-d=h]'); await p.selectOption('[data-d=l]','vi'); await p.click('[data-p=finish]');
console.log('chips', await p.textContent('.chips'));
await p.click('[data-p=show]'); await p.waitForTimeout(1600);
await p.screenshot({path:'shots/7_vi_hc.png'});
// mobile
const m=await b.newPage({viewport:{width:390,height:844}}); await m.goto('file://'+process.cwd()+'/out/index.html'); await m.waitForTimeout(500);
console.log('mobile overflow', await m.evaluate(()=>document.documentElement.scrollWidth));
await m.screenshot({path:'shots/8_mobile.png',fullPage:true});
console.log('errors',errs); await b.close();})();
