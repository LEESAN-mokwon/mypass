/* 내 방식 패스 연동 도구 (MyWay Pass Adapter SDK) v0.9
 * 기존 키오스크 웹 화면에 스크립트 한 줄로 붙여서, 사용자의 '내 방식' 프로필대로 화면을 바꾼다.
 *   <script src="mbp-sdk.js"></script>
 *   MBP.attach(document.querySelector('#kiosk-root'), { onTimeLimit: f => myTimer.scale(f) });
 *   // QR 리더가 문자열을 읽으면:  MBP.applyQR(text)   주문이 끝나면: MBP.reset()
 * 하는 일: 글씨·터치 영역 키우기, 촘촘한 격자 줄이기, 진한 화면, 어려운 말 → 쉬운 말,
 *          소리로 읽기, '한 번 누르면 읽고 두 번 누르면 선택'(시각장애인), 버튼을 아래로(휠체어),
 *          시간 제한 늘리기(연동 지점), 끝나면 원래대로 되돌리고 프로필은 저장하지 않음.
 */
(function (root) {
  const MBP = {};
  const S = { root: null, prof: null, opts: {}, saved: [], textSaved: [], style: null, explore: null, lastSpoken: '', spacer: null };

  // ---------- 프로필 ----------
  MBP.decode = function (s) {
    if (!/^MBP1;/.test(s || '')) return null; const o = {};
    s.split(';').slice(1).forEach(kv => { const [k, v] = kv.split('='); o[k] = k === 'l' ? v : parseFloat(v); });
    return o;
  };
  MBP.encode = p => 'MBP1;' + ['f', 'b', 't', 'v', 'e', 'h', 'w', 's', 'r', 'l'].filter(k => p[k] !== undefined).map(k => k + '=' + p[k]).join(';');

  // ---------- 6자리 '내 방식 번호' (카메라·QR 리더가 없는 키오스크용) ----------
  // 15비트(글씨 6단계·버튼 4단계·시간 4단계·켜고 끄기 6개·언어 4개) → 5자리 숫자 + 검사 숫자 1자리(Damm)
  const FL = [1, 1.25, 1.5, 1.9, 2.3, 2.75], BL = [1, 1.3, 1.6, 1.9], TL = [1, 2, 3, 0], LL = ['ko', 'en', 'vi', 'zh'];
  const near = (arr, v) => { let bi = 0; arr.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(arr[bi] - v)) bi = i; }); return bi; };
  // 검사 숫자: Damm 알고리즘 — 한 자리 오타와 이웃한 두 자리 바뀜을 모두 잡아낸다
  const DAMM = ['0317598642', '7092154863', '4206871359', '1750983426', '6123045978', '3674209581', '5869720134', '8945362017', '9438617205', '2581436790'];
  const check = d => String(d.split('').reduce((a, c) => +DAMM[a][+c], 0));
  MBP.toCode = function (p) {
    const ti = p.t === 0 ? 3 : near([1, 2, 3], p.t);
    const x = near(FL, p.f || 1) | near(BL, p.b || 1) << 3 | ti << 5 | (p.v ? 1 : 0) << 7 | (p.e ? 1 : 0) << 8 | (p.h ? 1 : 0) << 9 |
      (p.w ? 1 : 0) << 10 | (p.s ? 1 : 0) << 11 | (p.r ? 1 : 0) << 12 | Math.max(0, LL.indexOf(p.l || 'ko')) << 13;
    const d = String(x).padStart(5, '0'); return d + check(d);
  };
  MBP.fromCode = function (c) {
    c = String(c || '').replace(/\D/g, ''); if (c.length !== 6) return null;
    const d = c.slice(0, 5); if (check(d) !== c[5]) return null;
    const x = +d; if (x > 32767 || (x & 7) > 5) return null;
    return { f: FL[x & 7], b: BL[x >> 3 & 3], t: TL[x >> 5 & 3], v: x >> 7 & 1, e: x >> 8 & 1, h: x >> 9 & 1, w: x >> 10 & 1, s: x >> 11 & 1, r: x >> 12 & 1, l: LL[x >> 13 & 3] };
  };
  // 번호 입력판: 키오스크 회사가 따로 만들 필요 없이 연동 도구가 띄워 준다
  MBP.openKeypad = function (host, onProfile) {
    css(); let v = '';
    const ov = document.createElement('div'); ov.className = 'mbp-kp'; ov.setAttribute('data-mbp-skip', '');
    const draw = (msg) => {
      ov.innerHTML = `<div class="mbp-kpb" role="dialog" aria-label="내 방식 번호 입력"><div class="mbp-kpt">내 방식 번호 6자리를 눌러 주세요</div>
        <div class="mbp-kpd">${(v + '______').slice(0, 6).replace(/(...)(...)/, '$1-$2')}</div><div class="mbp-kpm">${msg || '휴대폰이나 종이 카드에 적힌 번호'}</div>
        <div class="mbp-kpg">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button data-n="del">지우기</button><button data-n="0">0</button><button data-n="ok" class="mbp-ok">확인</button></div>
        <button data-n="close" class="mbp-kpc">닫기</button></div>`;
    };
    draw(); if (getComputedStyle(host).position === 'static') host.style.position = 'relative'; host.appendChild(ov);
    ov.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('button'); if (!b) return; const n = b.dataset.n;
      if (n === 'close') { ov.remove(); return; }
      if (n === 'del') v = v.slice(0, -1); else if (n === 'ok') {
        const p = MBP.fromCode(v); if (!p) { v = ''; draw('번호가 맞지 않아요. 다시 눌러 주세요.'); return; }
        ov.remove(); onProfile(p); return;
      } else if (v.length < 6) v += n;
      draw();
    });
    return ov;
  };

  // ---------- 쉬운 말 사전 (생성형 AI 초안 → 사람 검수) ----------
  // 공공·금융·의료·교통 키오스크에서 자주 나오는 어려운 말. 원래 말은 괄호로 남긴다.
  MBP.GLOSSARY = {
    '주민등록표 등본': '우리 집 식구 확인서', '건축물대장': '건물 정보 서류', '자동차등록원부': '자동차 등록 기록', '병적증명서': '군대 다녀온 확인서',
    '국세 납세증명서': '나라 세금 낸 확인서', '어린이집 입소대기': '어린이집 대기 신청', '장애인증명서': '장애인 확인서', '주민등록표 초본': '내 주소 기록 확인서', '가족관계증명서': '가족 관계 확인서',
    '건강보험 자격득실확인서': '건강보험 가입 기록', '지방세 납세증명서': '세금 낸 확인서', '토지대장': '땅 정보 서류',
    '발급': '뽑기', '교부': '받기', '열람': '보기', '수수료': '내는 돈', '본인 인증': '내가 맞는지 확인', '본인인증': '내가 맞는지 확인',
    '지문 인식': '손가락 대기', '지문인식': '손가락 대기', '주민등록번호': '주민번호', '세대주': '집 대표', '세대원': '같이 사는 식구',
    '과거 주소 변동사항': '예전에 살던 주소', '인적사항': '이름·생일 같은 정보', '포함': '넣기', '미포함': '빼기', '선택하십시오': '골라 주세요',
    '입력하십시오': '눌러 주세요', '진행하시겠습니까': '할까요', '확인': '네, 맞아요', '취소': '그만하기', '이전': '뒤로', '처음으로': '처음 화면',
    '결제': '돈 내기', '결제수단': '돈 내는 방법', '간편결제': '휴대폰으로 내기', '신용/체크카드': '카드', '영수증': '계산서',
    '부': '장', '출력': '종이로 뽑기', '매수': '몇 장', '용도': '어디에 쓸지', '제출처': '낼 곳', '테이크아웃': '가지고 가기', '매장 식사': '여기서 먹기',
    '적립': '점수 모으기', '쿠폰': '할인권', '옵션': '고르는 것', '수납': '병원비 내기', '처방전': '약 받는 종이', '진료비': '병원비', '승차권': '표', '예매': '미리 사기',
  };
  MBP.TERMS_EN = {};

  // ---------- 화면 바꾸기 ----------
  function saveStyle(el, props) { const o = {}; props.forEach(p => o[p] = el.style[p]); S.saved.push([el, o]); }
  const INTERACTIVE = 'button, a[href], [role=button], input, select, [data-mbp-action]';

  function scaleText(f) {
    if (f <= 1.02) return;
    const els = S.root.querySelectorAll('*');
    const sizes = [];
    els.forEach(el => { if (el.closest('[data-mbp-skip]')) return; const cs = getComputedStyle(el); sizes.push([el, parseFloat(cs.fontSize)]); });
    sizes.forEach(([el, px]) => { saveStyle(el, ['fontSize', 'lineHeight']); el.style.fontSize = Math.min(px * f, 64) + 'px'; el.style.lineHeight = '1.3'; });
  }
  function enlargeTargets(b) {
    const min = Math.round(44 * Math.max(1, b)); // WCAG 2.5.5: 44px 이상
    S.root.querySelectorAll(INTERACTIVE).forEach(el => {
      saveStyle(el, ['minHeight', 'minWidth', 'padding']);
      el.style.minHeight = min + 'px'; el.style.minWidth = min + 'px';
    });
  }
  function reflowGrids(f) {
    if (f <= 1.2) return;
    S.root.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'grid') {
        const cols = cs.gridTemplateColumns.split(' ').length;
        const want = Math.max(1, Math.min(cols, Math.floor(cols / f) || 1, 2));
        if (cols > want) { saveStyle(el, ['gridTemplateColumns']); el.style.gridTemplateColumns = `repeat(${want}, minmax(0,1fr))`; }
      } else if (cs.display === 'flex' && cs.flexWrap === 'nowrap' && el.children.length > 3 && el.querySelector(INTERACTIVE)) {
        saveStyle(el, ['flexWrap']); el.style.flexWrap = 'wrap';
      }
    });
  }
  // 짧은 버튼 글자에서만 바꾸는 말 (긴 문장 속 '확인', '부' 등은 건드리지 않음)
  const SHORT_ONLY = new Set(['발급', '교부', '열람', '확인', '취소', '이전', '부', '포함', '미포함', '출력', '결제', '처음으로', '쿠폰', '옵션', '매수', '용도']);
  // 원래 말을 괄호로 남길 필요가 없는 말(문장 끝 존댓말 등)
  const NO_PAREN = new Set(['선택하십시오', '입력하십시오', '진행하시겠습니까', '포함', '미포함']);
  const esc = k => k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  function easyWords() {
    const all = Object.keys(MBP.GLOSSARY).sort((a, b) => b.length - a.length);
    const reShort = new RegExp('(' + all.map(esc).join('|') + ')', 'g');
    const reLong = new RegExp('(' + all.filter(k => !SHORT_ONLY.has(k)).map(esc).join('|') + ')', 'g');
    const walker = document.createTreeWalker(S.root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (!n.nodeValue.trim() || n.parentElement.closest('[data-mbp-skip],script,style')) return;
      const v = n.nodeValue; const short = v.trim().length <= 6; const re = short ? reShort : reLong;
      re.lastIndex = 0; if (!re.test(v)) return; re.lastIndex = 0;
      S.textSaved.push([n, v]);
      // 짧은 버튼 글자는 쉬운 말만, 긴 문장은 쉬운 말(원래 말)
      n.nodeValue = v.replace(re, m => (SHORT_ONLY.has(m) || NO_PAREN.has(m)) ? MBP.GLOSSARY[m] : `${MBP.GLOSSARY[m]}(${m})`);
    });
  }
  function contrast() {
    S.root.classList.add('mbp-hc');
  }
  function lowLayout() {
    // 휠체어: 누를 것들이 화면 아래 2/3 안에 오도록 위쪽에 빈 공간을 둔다
    S.root.classList.add('mbp-low');
  }
  function css() {
    if (S.style) return;
    S.style = document.createElement('style');
    S.style.textContent = `
      .mbp-hc, .mbp-hc * { background-color:#000 !important; color:#FFF34D !important; border-color:#FFF34D !important; box-shadow:none !important; }
      .mbp-hc button, .mbp-hc [role=button] { border:2px solid #FFF34D !important; }
      .mbp-hc img { filter: contrast(1.3); }
      .mbp-low { display:flex !important; flex-direction:column !important; justify-content:flex-end !important; }
      .mbp-focus { outline: 5px solid #FF6A00 !important; outline-offset: 2px !important; }
      .mbp-kp { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:60; padding:12px }
      .mbp-kpb { background:#fff; color:#111; border-radius:14px; padding:16px; width:100%; max-width:380px; display:flex; flex-direction:column; gap:10px; font-family:inherit }
      .mbp-kpt { font-weight:900; font-size:20px; text-align:center }
      .mbp-kpd { font:900 36px/1.2 ui-monospace,Menlo,monospace; letter-spacing:4px; text-align:center; background:#F2F4F3; border-radius:10px; padding:8px }
      .mbp-kpm { font-size:14px; color:#555; text-align:center; min-height:20px }
      .mbp-kpg { display:grid; grid-template-columns:repeat(3,1fr); gap:8px }
      .mbp-kpg button, .mbp-kpc { font-weight:700; font-size:26px; line-height:1; font-family:inherit; padding:16px 0; border-radius:10px; border:2px solid #333; background:#fff; color:#111; cursor:pointer }
      .mbp-kpg button[data-n=del] { font-size:18px }
      .mbp-kpg .mbp-ok { background:#1F6F54; border-color:#1F6F54; color:#fff; font-size:20px }
      .mbp-kpc { font-size:18px; padding:10px }
      .mbp-badge { position:absolute; right:8px; top:46px; z-index:50; background:#1F6F54; color:#fff !important; font:700 12px/1.3 sans-serif; padding:4px 8px; border-radius:999px; pointer-events:none }
      .mbp-hc .mbp-badge { background:#FFF34D !important; color:#000 !important; }`;
    document.head.appendChild(S.style);
  }

  // ---------- 소리 ----------
  const LANG = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN', zh: 'zh-CN' };
  MBP.say = function (text, force) {
    if (!S.prof || (!S.prof.v && !force) || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = LANG[S.prof.l || 'ko']; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) { }
    S.lastSpoken = text; if (S.opts.onSpeak) S.opts.onSpeak(text);
  };
  function labelOf(el) {
    return (el.getAttribute('aria-label') || el.innerText || el.value || '').replace(/\s+/g, ' ').trim();
  }
  // 한 번 누르면 읽고, 같은 것을 다시 누르면 선택 (스마트폰 화면낭독기와 같은 방식)
  function exploreHandler(e) {
    const el = e.target.closest(INTERACTIVE); if (!el || !S.root.contains(el)) return;
    if (el.closest('[data-mbp-direct]')) return;
    const now = Date.now();
    if (S.explore && S.explore.el === el && now - S.explore.t < 6000) { S.explore = null; el.classList.remove('mbp-focus'); return; } // 두 번째: 그대로 통과
    e.preventDefault(); e.stopImmediatePropagation();
    if (S.explore && S.explore.el) S.explore.el.classList.remove('mbp-focus');
    S.explore = { el, t: now }; el.classList.add('mbp-focus');
    MBP.say(labelOf(el) + '. 선택하려면 한 번 더 누르세요.', true);
  }
  function readOnTap(e) {
    const el = e.target.closest(INTERACTIVE); if (!el || !S.root.contains(el)) return;
    MBP.say(labelOf(el));
  }

  // ---------- 공개 함수 ----------
  MBP.attach = function (rootEl, opts) { S.root = rootEl; S.opts = opts || {}; css(); return MBP; };
  MBP.apply = function (p, quiet) {
    if (!S.root) throw new Error('MBP.attach 먼저');
    MBP.reset(true); S.prof = Object.assign({ f: 1, b: 1, t: 1, v: 0, e: 0, h: 0, w: 0, s: 0, r: 0, l: 'ko' }, p);
    const P = S.prof;
    if (P.e && P.l === 'ko') easyWords();
    scaleText(P.f); enlargeTargets(P.b); reflowGrids(P.f);
    if (P.h) contrast(); if (P.w) lowLayout();
    if (P.r) S.root.addEventListener('click', exploreHandler, true);
    else if (P.v) S.root.addEventListener('pointerdown', readOnTap, true);
    const badge = document.createElement('div'); badge.className = 'mbp-badge'; badge.setAttribute('data-mbp-skip', ''); badge.textContent = '내 방식 적용 중';
    if (getComputedStyle(S.root).position === 'static') { saveStyle(S.root, ['position']); S.root.style.position = 'relative'; }
    S.root.appendChild(badge); S.badge = badge;
    if (S.opts.onTimeLimit) S.opts.onTimeLimit(P.t === 0 ? Infinity : Math.max(1, P.t));
    if (S.opts.onApply) S.opts.onApply(P);
    if (!quiet) MBP.say(P.r ? '내 방식이 적용됐어요. 화면을 한 번 누르면 읽어 드리고, 한 번 더 누르면 선택돼요.' : '내 방식이 적용됐어요.');
    return P;
  };
  MBP.applyQR = text => { const p = MBP.decode(text); return p ? MBP.apply(p) : null; };
  // 화면이 새로 그려졌을 때(다음 단계로 넘어갔을 때) 다시 적용
  MBP.refresh = function () { if (!S.prof) return; const p = S.prof; MBP.reset(true); MBP.apply(p, true); };
  MBP.reset = function (keepQuiet) {
    if (!S.root) return;
    S.saved.reverse().forEach(([el, o]) => Object.assign(el.style, o)); S.saved = [];
    S.textSaved.forEach(([n, v]) => { n.nodeValue = v; }); S.textSaved = [];
    S.root.classList.remove('mbp-hc', 'mbp-low');
    S.root.removeEventListener('click', exploreHandler, true); S.root.removeEventListener('pointerdown', readOnTap, true);
    if (S.badge) { S.badge.remove(); S.badge = null; }
    if (S.explore && S.explore.el) S.explore.el.classList.remove('mbp-focus'); S.explore = null;
    if (!keepQuiet) { if (S.opts.onTimeLimit) S.opts.onTimeLimit(1); S.prof = null; } // 프로필은 남기지 않는다
  };
  MBP.profile = () => S.prof && Object.assign({}, S.prof);

  if (typeof module !== 'undefined') module.exports = MBP; else root.MBP = MBP;
})(typeof window !== 'undefined' ? window : globalThis);
