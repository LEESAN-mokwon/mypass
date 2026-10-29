const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:1300}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/out/index.html'); await p.waitForTimeout(500);
// gov default
await p.click('[data-kt=gov]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/g1_default.png'});
await p.click('#gov [data-g=doc]'); await p.waitForTimeout(200); await p.screenshot({path:'shots/g2_opt_default.png'});
await p.click('#gov [data-g=home]');
// elder → gov
await p.click('[data-preset=elder]'); await p.click('[data-p=show]'); await p.waitForTimeout(1700);
await p.screenshot({path:'shots/g3_elder_home.png'});
await p.click('#gov [data-g=doc]'); await p.waitForTimeout(300); await p.screenshot({path:'shots/g4_elder_opt.png'});
await p.click('#gov [data-g=ok]'); await p.click('#gov [data-g=rrn]'); await p.click('#gov [data-g=finger]'); await p.click('#gov [data-g=paid] >> nth=1'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/g5_done.png'});
console.log('gov badge after done:', await p.$$eval('#gov .mbp-badge',x=>x.length), 'mode', await p.textContent('#kmode'));
// blind on cafe
await p.click('[data-kt=cafe]'); await p.click('[data-p=intro]'); await p.click('[data-preset=blind]'); await p.click('[data-p=show]'); await p.waitForTimeout(1700);
await p.click('#ks [data-item=yuja]'); await p.waitForTimeout(200);
console.log('after 1 tap sel modal?', await p.$$eval('#ks .kmodal',x=>x.length), 'focus', await p.$$eval('#ks .mbp-focus',x=>x.length));
await p.click('#ks [data-item=yuja]'); await p.waitForTimeout(200);
console.log('after 2 taps modal?', await p.$$eval('#ks .kmodal',x=>x.length));
await p.screenshot({path:'shots/b1_blind.png'});
// elder cafe: near-miss adapt
await p.click('[data-p=intro]'); await p.click('[data-preset=elder]'); await p.click('[data-p=show]'); await p.waitForTimeout(1700);
const bb=await (await p.$('#ks [data-item=americano]')).boundingBox();
await p.mouse.click(bb.x+bb.width+5, bb.y+20); await p.mouse.click(bb.x+bb.width+5, bb.y+40); await p.waitForTimeout(300);
await p.screenshot({path:'shots/a1_adapt.png'});
await p.click('#ks [data-k=adyes]'); await p.waitForTimeout(300);
console.log('phone note:', await p.textContent('#phone .note'));
// clarify
await p.click('#ks [data-k=voice]'); await p.fill('#vIn','유쟈차 주세요'); await p.click('#ks [data-k=vsend]'); await p.waitForTimeout(200);
console.log('heard:', await p.textContent('#ks .heard'));
await p.fill('#vIn','쌍화차 주세요'); await p.click('#ks [data-k=vsend]'); await p.waitForTimeout(200);
console.log('heard2:', await p.textContent('#ks .heard'));
await p.fill('#vIn','쪼코 하나'); await p.click('#ks [data-k=vsend]'); await p.waitForTimeout(200);
console.log('heard3:', await p.textContent('#ks .heard'));
await p.screenshot({path:'shots/c1_clarify.png'});
// default struggle
await p.click('#ks [data-k=vclose]'); await p.evaluate(()=>resetKiosk(false)); await p.click('#ks [data-k=begin]');
await p.click('#ks [data-item=latte]'); await p.click('#ks [data-k=close]'); await p.click('#ks [data-item=latte]'); await p.click('#ks [data-k=close]');
await p.waitForTimeout(6500); console.log('meter', await p.textContent('#mVal'), 'help?', await p.$$eval('#ks .khelp',x=>x.length));
await p.screenshot({path:'shots/s1_struggle.png'});
// card
await p.click('[data-p=intro]'); await p.click('[data-preset=elder]'); await p.click('[data-p=card]'); await p.waitForTimeout(300);
await p.screenshot({path:'shots/p1_card.png'});
const im=await p.$('.pcard'); await im.screenshot({path:'shots/p1_cardonly.png'});
console.log('errors',errs); await b.close();})();
