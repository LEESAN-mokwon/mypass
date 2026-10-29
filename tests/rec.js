const {chromium}=require('playwright');
const W=1300,H=1160;
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:W,height:H},recordVideo:{dir:'vid',size:{width:W,height:H}}});
const p=await ctx.newPage();
await p.goto('file://'+process.cwd()+'/out/index.html'); await p.waitForTimeout(500);
await p.evaluate(()=>{document.querySelector('.wrap').style.zoom='0.84';});
let aiMode=false;
await p.addStyleTag({content:`#cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:rgba(10,20,15,.9);color:#fff;font:700 26px "Noto Sans KR",sans-serif;padding:14px 26px;border-radius:14px;z-index:9999;max-width:1150px;text-align:center;line-height:1.45}
#cap small{display:block;font-weight:500;font-size:19px;color:#cfe;margin-top:4px}
#ttl{position:fixed;inset:0;background:#123326;color:#fff;display:grid;place-items:center;text-align:center;z-index:10000;font:900 52px "Noto Sans KR",sans-serif;line-height:1.4}
#ttl small{display:block;font-size:26px;font-weight:500;margin-top:18px;color:#bfe3d2}
.clk{position:fixed;width:34px;height:34px;border-radius:50%;border:4px solid #ff5a36;z-index:9998;pointer-events:none;transform:translate(-50%,-50%)}`});
const cap=async(t,sub,ms)=>{await p.evaluate(([t,s])=>{let c=document.getElementById('cap');if(!c){c=document.createElement('div');c.id='cap';document.body.appendChild(c)}c.innerHTML=t+(s?`<small>${s}</small>`:'')},[t,sub||'']); if(ms) await p.waitForTimeout(ms);};
const nocap=()=>p.evaluate(()=>{const c=document.getElementById('cap');c&&c.remove()});
const title=async(t,s,ms)=>{await p.evaluate(([t,s])=>{let c=document.getElementById('ttl');if(!c){c=document.createElement('div');c.id='ttl';document.body.appendChild(c)}c.innerHTML=t+(s?`<small>${s}</small>`:'')},[t,s]);await p.waitForTimeout(ms);await p.evaluate(()=>document.getElementById('ttl').remove());};
const click=async(sel,wait=900)=>{if(!aiMode) await p.evaluate(()=>window.scrollTo(0,0)); const el=await p.waitForSelector(sel);const bb=await el.boundingBox();
  await p.evaluate(([x,y])=>{const d=document.createElement('div');d.className='clk';d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),700)},[bb.x+bb.width/2,bb.y+bb.height/2]);
  await p.waitForTimeout(350); await el.click(); await p.waitForTimeout(wait);};
const type=async(sel,txt)=>{await p.fill(sel,'');await p.type(sel,txt,{delay:90});await p.waitForTimeout(400);};
const scrollTo=async(y)=>{aiMode = y>0; await p.evaluate(y=>{ if(y>0) document.querySelector('.grid2').scrollIntoView({behavior:'smooth',block:'start'}); else window.scrollTo({top:0,behavior:'smooth'}); },y);await p.waitForTimeout(1000);};


await title('내 방식 패스','키오스크가 나에게 맞춰집니다 · 2026 AI 라이프 솔루션 챌린지',4500);
await title('키오스크가 불편했던 장애인 10명 중 8명<br>“무인주문기가 가장 불편”','65세 이상 64.2%도 키오스크 주문이 어렵다고 답했습니다<br>2026년 1월부터 키오스크 접근성 의무 전면 적용',6500);
await cap('지금의 키오스크: 작은 글씨, 영어 메뉴, 남은 시간 40초','어르신이 따뜻한 유자차를 주문해 봅니다',3500);
await click('#ks [data-k=begin]',1300);
await click('#ks [data-cat=tea]',1300);
await click('#ks [data-item=yuja]',1300);
await cap('옵션 창은 영어, 필수 항목이 많고 시간은 계속 줄어듭니다','',3000);
await click('#ks [data-k=close]',900);
await click('#ks [data-item=ginger]',900);
await click('#ks [data-k=close]',600);
await cap('망설임 감지: 멈춤·뒤로 가기·빗나간 터치·남은 시간을 점수로 합칩니다','점수가 1을 넘으면 키오스크가 먼저 말을 겁니다',1000);
await p.waitForSelector('#ks .khelp',{timeout:20000}); await p.waitForTimeout(800);
await cap('“주문이 어려우신가요?” → 큰 글씨·쉬운 말·소리로 바로 바꾸거나 직원 호출','QR이 없는 사람도 도움을 받습니다',5000);
await click('#ks [data-k=nohelp]',400);
await p.evaluate(()=>resetKiosk(false)); await p.waitForTimeout(500);

await title('해결: 내 방식을 한 번 만들고, QR로 어디서나','휴대폰 30초 진단 → QR → 키오스크가 바뀜',4500);
await cap('① 글씨가 잘 보이는지 물어봅니다','',1000);
await click('[data-p=font]',1000);
await click('[data-p=fontbig]',700); await click('[data-p=fontbig]',700); await click('[data-p=fontbig]',1000);
await click('[data-p=fontok]',700);
await cap('② 동그라미를 누르는 속도·정확도로 버튼 크기와 시간 제한을 정합니다','',800);
for(let i=0;i<3;i++){ await p.waitForTimeout(1200); await click('#target',300); }
await p.waitForTimeout(500);
await cap('③ 소리 안내 ④ 쉬운 말 ⑤ 진한 화면·휠체어·말로 주문·화면 낭독·언어','이름·연락처·장애 정보는 묻지 않습니다',1200);
await click('[data-p=v1]',1000); await click('[data-p=e1]',1300);
await click('[data-p=finish]',1300);
await cap('QR에는 “필요한 방식”만 담깁니다','개인정보 없음 · 키오스크는 주문이 끝나면 지웁니다',4000);
await click('[data-p=intro]',500);
await click('[data-preset=elder]',1200);
await cap('⑥ 키오스크에 QR을 보여주면…','',1200);
await click('[data-p=show]',2200);
await cap('같은 키오스크가 큰 글씨·쉬운 말·사진·시간 제한 없음으로 바뀝니다','“Americano” → “쓴 커피 (아메리카노)”, 한 줄 설명까지',5000);
await click('#ks [data-item=yuja]',1500);
await cap('한 화면에 질문 하나: “따뜻하게 드릴까요, 차갑게 드릴까요?”','소리로도 읽어 줍니다',3000);
await click('#ks [data-o="temp:hot"]',1200);
await click('#ks [data-o="q+"]',1000);
await click('#ks [data-k=addopt]',2200);

await cap('말로 주문 — 직접 학습시킨 AI가 문장을 서버 없이 기기 안에서 이해합니다','영상에서는 음성 인식 결과를 글로 넣어 보여 드립니다',3500);
await click('#ks [data-k=voice]',1000);
await type('#vIn','아이스 아메리카노 하나랑 치즈케이크');
await click('#ks [data-k=vsend]',1000);
await cap('한 문장에서 메뉴 2개·수량·온도를 뽑아 확인을 받습니다','',4000);
await click('#ks [data-k=vyes]',1800);
await click('#ks [data-k=voice]',800);
await type('#vIn','쪼코 하나');
await click('#ks [data-k=vsend]',800);
await cap('잘못 들렸을 때: 소리가 가장 비슷한 메뉴로 “혹시 ○○ 말씀이세요?” 되묻기','',4000);
await click('#ks [data-k=vyes]',1500);
await click('#ks [data-o="temp:hot"]',1000);
await click('#ks [data-k=addopt]',1500);
await click('#ks [data-k=voice]',800);
await type('#vIn','화장실 어디예요');
await click('#ks [data-k=vsend]',800);
await cap('엉뚱한 말이면 담은 것을 건드리지 않고 다시 묻습니다','전체 취소·결제는 반드시 “네/아니요”로 확인',3500);
await click('#ks [data-k=vclose]',800);
await click('#ks [data-k=tomenu]',800).catch(()=>{});
if(false)
await click('#ks [data-k=addopt]',2000);
await click('#ks [data-k=voice]',800);
await type('#vIn','계산할게요');
await click('#ks [data-k=vsend]',1500);
await cap('“계산할게요” → 결제 확인, 큰 “네 / 아니요”','',2500);
await click('#ks [data-k=paycard]',1200);
await click('#ks [data-k=paid]',1800);
await cap('주문 완료 · 내 방식 정보는 키오스크에서 바로 지웁니다','',3500);

await cap('쓰면서 배우는 내 방식: 버튼 옆을 자꾸 누르면…','',500);
await click('[data-p=intro]',300); await click('[data-preset=elder]',600); await click('[data-p=show]',2000);
{ const bb=await (await p.$('#ks [data-item=americano]')).boundingBox();
  for(const dy of [30,70]){ await p.evaluate(([x,y])=>{const d=document.createElement('div');d.className='clk';d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),700)},[bb.x+bb.width+5,bb.y+dy]); await p.waitForTimeout(300); await p.mouse.click(bb.x+bb.width+5,bb.y+dy); await p.waitForTimeout(700);} }
await cap('키오스크가 먼저 “더 크게 할까요?” 묻고, 내 방식(QR)도 함께 고쳐집니다','',3500);
await click('#ks [data-k=adyes]',3500);

await cap('화면이 안 보이는 분: 한 번 누르면 읽어 주고, 한 번 더 누르면 선택','스마트폰 화면낭독기와 같은 방식 + 진한 화면',1000);
await click('[data-p=intro]',300); await click('[data-preset=blind]',600); await click('[data-p=show]',2200);
await click('#ks [data-item=latte]',2500);
await click('#ks [data-item=latte]',2500);
await p.evaluate(()=>resetKiosk(false));

await title('다른 키오스크도: 연동 SDK','화면 코드는 고치지 않고 연동 도구(SDK)만 붙인 무인 민원발급기 (시연용 모형)',4500);
await click('[data-kt=gov]',1500);
await cap('원래 민원발급기: 작은 글씨, 4칸 촘촘한 버튼, 어려운 행정 용어','',4000);
await click('[data-p=intro]',300); await click('[data-preset=elder]',800);
await click('[data-p=show]',2200);
await cap('같은 QR → 글씨 190%, 2칸 큰 버튼, 쉬운 말, 시간 제한 없음','“주민등록표 등본” → “우리 집 식구 확인서(주민등록표 등본)”',5500);
await click('#gov [data-g=doc]',2000);
await cap('“포함/미포함” → “넣기/빼기”, “확인” → “네, 맞아요”','쉬운 말 사전은 생성형 AI로 만들고 사람이 검수',4500);
await click('#gov [data-g=ok]',1200); await click('#gov [data-g=rrn]',1000); await click('#gov [data-g=finger]',1200);
await click('#gov [data-g=paid] >> nth=1',2500);
await cap('발급 완료 → 연동 도구가 화면을 원래대로 돌리고 정보를 지웁니다','',3500);
await click('#gov [data-g=home]',800);
await cap('QR 카메라가 없는 키오스크는 6자리 ‘내 방식 번호’로','휴대폰·종이 카드에 적힌 번호를 누르면 똑같이 바뀝니다 · 오타·자리 바뀜은 검사 숫자로 걸러냅니다',800);
await click('#kpadBtn',800);
for(const d of await p.evaluate(()=>MBP.toCode(P.profile))) await click(`#gov .mbp-kp [data-n="${d}"]`,150);
await click('#gov .mbp-kp [data-n=ok]',3500);
await click('#gov [data-g=home]',600);
await click('[data-kt=cafe]',600);

await cap('스마트폰이 없는 어르신: 자녀·복지관이 만들어 종이 카드로','지갑에 넣고 다니다 키오스크 카메라에 보여 주면 끝',1000);
await click('[data-p=card]',4500);
await p.evaluate(()=>document.querySelector('.cardov')?.remove());

await title('AI는 이렇게 알아듣습니다','글자 n-그램 + 직접 학습한 의도 분류(9종) + 자모 유사도 메뉴 찾기',4000);
await scrollTo(1180);
await cap('음성인식이 틀려도: “아메리카로 한잔요” → 아메리카노 1잔','',300);
await type('#aiIn','아메리카로 한잔요'); await click('#aiGo',3000);
await cap('한 문장에 두 사람 주문: 메뉴·온도를 각각 나눠 이해','',300);
await type('#aiIn','할머니는 따뜻한 생강차 하나 주고 나는 아이스 라떼'); await click('#aiGo',3500);
await cap('주문이 아닌 말도 구분: 빼기 · 도움 요청','',300);
await type('#aiIn','케이크는 안 먹을래'); await click('#aiGo',2200);
await type('#aiIn','이거 어떻게 하는 거예요'); await click('#aiGo',2500);
await cap('학습 문장과 겹치지 않는 새 문장 50개(사투리 포함): 의도 98.0%, 완전 일치 92.0%','틀린 것도 공개: “뜨신·따신” 같은 사투리 온도 표현 → 다음 개선 과제',5500);
await p.evaluate(()=>document.querySelector('.meter').scrollIntoView({behavior:'smooth',block:'center'})); await p.waitForTimeout(800);
await cap('시험 기록: 기본 화면과 내 방식 화면의 시간·터치 수를 자동 비교','가족·지인 사용자 시험으로 효과를 측정합니다',4500);
await scrollTo(0);
await cap('외국인 노동자에게는 베트남어 화면으로','',600);
await click('[data-p=intro]',300); await click('[data-preset=foreign]',800); await click('[data-p=show]',3500);
await nocap();
await title('키오스크를 바꾸지 않고, 사람에 맞춥니다','소프트웨어만으로 · QR 하나로 · 이름·장애 정보 없이<br>2026년 키오스크 접근성 의무화에 대응하는 새로운 방법',6000);
await p.close(); await ctx.close(); await b.close();
})();
