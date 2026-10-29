// 내 방식 패스: 한국어 음성 주문 이해 엔진 (브라우저·Node 공용)
// 1) 의도 분류: 글자 n-그램 해시 특징 + 직접 학습한 다항 로지스틱 회귀
// 2) 메뉴·수량·온도 추출: 자모 단위 유사도(음성인식 오탈자 허용) + 규칙
(function (root) {
  const NLU = {};
  const DIM = 4096;

  // ---- 공통 전처리 ----
  function norm(t) {
    return (t || '').toLowerCase().replace(/[.,!?~·]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function fnv(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function feats(text) {
    const t = ' ' + norm(text) + ' ';
    const f = new Map();
    const add = (g) => { const k = fnv(g) % DIM; f.set(k, (f.get(k) || 0) + 1); };
    for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= t.length; i++) add(n + ':' + t.substr(i, n));
    const nospace = norm(text).replace(/ /g, '');
    for (let i = 0; i + 2 <= nospace.length; i++) add('s:' + nospace.substr(i, 2));
    let ss = 0; f.forEach(v => ss += v * v); const z = Math.sqrt(ss) || 1;
    f.forEach((v, k) => f.set(k, v / z));
    return f;
  }
  NLU.feats = feats; NLU.fnv = fnv; NLU.norm = norm; NLU.DIM = DIM;

  // ---- 의도 분류 ----
  let MODEL = null;
  NLU.load = (m) => { MODEL = m; };
  NLU.intent = (text) => {
    const f = feats(text); const C = MODEL.classes, W = MODEL.W, b = MODEL.b;
    const s = C.map((_, c) => { let v = b[c]; f.forEach((x, k) => { v += x * W[c][k]; }); return v; });
    const mx = Math.max(...s); const e = s.map(v => Math.exp(v - mx)); const Z = e.reduce((a, c) => a + c, 0);
    const p = e.map(v => v / Z); let bi = 0; p.forEach((v, i) => { if (v > p[bi]) bi = i; });
    return { intent: C[bi], conf: p[bi], probs: Object.fromEntries(C.map((c, i) => [c, p[i]])) };
  };

  // ---- 자모 분해 ----
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
  function jamo(s) {
    let o = '';
    for (const ch of s) {
      const c = ch.charCodeAt(0) - 0xAC00;
      if (c >= 0 && c < 11172) { o += CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)]; const j = c % 28; if (j) o += JONG[j]; }
      else o += ch;
    }
    return o;
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }
  NLU.jamo = jamo;

  // ---- 메뉴·수량·온도 추출 ----
  let MENU = [];
  NLU.setMenu = (menu) => {
    MENU = [];
    menu.forEach(m => m.aliases.forEach(a => {
      const c = a.replace(/ /g, ''); MENU.push({ id: m.id, alias: c, j: jamo(c), temp: !!m.temp, ice: /^아이스/.test(c) || c === '아아', hot: /^핫/.test(c) || c === '뜨아' || c === '따아' });
    }));
    MENU.sort((x, y) => y.alias.length - x.alias.length);
  };
  const QW = [[/(열\s*(잔|개|조각)|10\s*(잔|개))/, 10], [/(다섯|5)\s*(잔|개|개요|잔요)?/, 5], [/(넷|네\s*(잔|개)|넉\s*잔|4\s*(잔|개))/, 4], [/(셋|세\s*(잔|개)|석\s*잔|3\s*(잔|개))/, 3], [/(둘|두\s*(잔|개)|2\s*(잔|개))/, 2], [/(하나|한\s*(잔|개)|1\s*(잔|개))/, 1]];
  const HOTW = /(따뜻|따끈|뜨끈|뜨거|뜨겁|핫|hot|데워)/, ICEW = /(차가|차갑|아이스|시원|얼음|ice|찬\s)/;

  function findItems(text) {
    const raw = norm(text);
    // 띄어쓰기 없이 비교하되, 원래 위치를 기억
    const chars = []; for (let i = 0; i < raw.length; i++) if (raw[i] !== ' ') chars.push(i);
    const s = raw.replace(/ /g, '');
    const used = new Array(s.length).fill(false); const hits = [];
    // 1단계: 정확히 일치하는 메뉴 이름을 먼저 잡는다(긴 이름 우선)
    for (const m of MENU) {
      let from = 0, i;
      while ((i = s.indexOf(m.alias, from)) >= 0) {
        from = i + 1; let free = true; for (let k = i; k < i + m.alias.length; k++) if (used[k]) { free = false; break; }
        if (!free) continue;
        hits.push({ id: m.id, start: i, end: i + m.alias.length, d: 0, temp: m.temp, ice: m.ice, hot: m.hot });
        for (let k = i; k < i + m.alias.length; k++) used[k] = true;
      }
    }
    // 2단계: 남은 부분에서 비슷한 소리(자모 거리)를 허용해 잡는다 — 음성인식 오탈자 대응
    for (const m of MENU) {
      const L = m.alias.length; if (L <= 2) continue;
      for (const w of [L, L - 1, L + 1]) {
        for (let i = 0; i + w <= s.length; i++) {
          let free = true; for (let k = i; k < i + w; k++) if (used[k]) { free = false; break; }
          if (!free) continue;
          const seg = s.substr(i, w); const d = lev(jamo(seg), m.j) / Math.max(m.j.length, 1);
          const thr = L <= 3 ? 0.2 : 0.3;
          if (d <= thr) { hits.push({ id: m.id, start: i, end: i + w, d, temp: m.temp, ice: m.ice, hot: m.hot }); for (let k = i; k < i + w; k++) used[k] = true; }
        }
      }
    }
    hits.sort((a, b) => a.start - b.start);
    // 같은 메뉴가 바로 붙어 두 번 잡힌 경우 합치기 (예: '딸기 스무디'에서 '딸기'+'스무디')
    const merged = [];
    for (const h of hits) { const p = merged[merged.length - 1]; if (p && p.id === h.id && h.start - p.end <= 1) { p.end = h.end; continue; } merged.push(h); }
    return { s, hits: merged };
  }

  NLU.parse = (text) => {
    const it = MODEL ? NLU.intent(text) : { intent: 'order', conf: 0 };
    const { s, hits } = findItems(text);
    // 메뉴 사이의 말을 '이랑/하고/,/그리고/에' 같은 연결어 기준으로 앞 메뉴 몫과 뒤 메뉴 몫으로 나눈다
    const JOIN = /(이랑|랑|하고|그리고|,|에다가|에|와|과)/;
    const own = hits.map(() => ({ pre: '', post: '' }));
    hits.forEach((h, idx) => {
      const gStart = idx ? hits[idx - 1].end : 0, gap = s.substring(gStart, h.start);
      if (!idx) { own[idx].pre = gap; return; }
      const m = gap.match(JOIN);
      if (m) { own[idx - 1].post = gap.slice(0, m.index); own[idx].pre = gap.slice(m.index + m[0].length); }
      else {
        // 연결어가 없으면 온도 말이 뒤쪽에 붙어 있을 때만 다음 메뉴 몫으로 본다
        const t = gap.search(/(따뜻|따끈|뜨거|뜨겁|핫|차가|차갑|아이스|시원|얼음)/);
        if (t > 0) { own[idx - 1].post = gap.slice(0, t); own[idx].pre = gap.slice(t); } else own[idx - 1].post = gap;
      }
    });
    if (hits.length) own[hits.length - 1].post = s.substring(hits[hits.length - 1].end);
    // 정정 표현: "라떼 말고 아메리카노" → 라떼는 버림, "따뜻한 거 말고 차가운" / "세 개 아니 두 개" → 뒤의 말만 씀
    const drop = hits.map((h, idx) => idx < hits.length - 1 && /말고/.test(own[idx].post) && !/(이랑|하고|그리고)/.test(own[idx].post));
    own.forEach(o => { o.pre = o.pre.split(/말고|아니고|아니/).pop(); o.post = o.post.split(/말고|아니고|아니/).pop(); });
    const NEG_ICE = /안\s*차(가|갑)/, NEG_HOT = /안\s*뜨(거|겁)/;
    const items = hits.map((h, idx) => drop[idx] ? null : (() => {
      const before = own[idx].pre, after = own[idx].post, ctx = before + '|' + after;
      let qty = 1; for (const [re, q] of QW) { if (re.test(after) || re.test(before)) { qty = q; break; } }
      const m2 = (after + before).match(/(\d+)\s*(잔|개|조각|컵)/); if (m2) qty = Math.min(30, +m2[1]);
      if (/(두|2)\s*조각/.test(ctx)) qty = 2; else if (/(세|3)\s*조각/.test(ctx)) qty = 3; else if (/(한|1)\s*조각/.test(ctx)) qty = Math.max(qty, 1);
      let temp = null;
      if (h.temp) {
        if (ICEW.test(ctx)) temp = 'ice';
        if (HOTW.test(ctx)) temp = 'hot';
        if (NEG_ICE.test(ctx)) temp = 'hot'; else if (NEG_HOT.test(ctx)) temp = 'ice';
        if (h.ice) temp = 'ice';
        if (h.hot) temp = 'hot';
      }
      return { id: h.id, qty, temp };
    })()).filter(Boolean);
    let intent = it.intent;
    // 메뉴가 들렸는데 의도가 애매하면 주문으로 본다
    if (items.length && it.conf < 0.5 && !['remove', 'cancel'].includes(intent)) intent = 'order';
    if (items.length && intent === 'cancel') intent = 'remove';
    return { intent, conf: it.conf, items };
  };

  // 메뉴를 못 찾았을 때: 가장 비슷한 메뉴 하나를 골라 "혹시 ○○ 말씀이세요?"라고 되묻기 위한 후보
  NLU.suggest = (text) => {
    const s = norm(text).replace(/ /g, ''); let best = null;
    for (const m of MENU) {
      const L = m.alias.length; if (L < 2) continue;
      for (const w of [L - 1, L, L + 1]) {
        if (w < 2) continue;
        for (let i = 0; i + w <= s.length; i++) {
          const d = lev(jamo(s.substr(i, w)), m.j) / Math.max(m.j.length, 1);
          if (!best || d < best.d) best = { id: m.id, alias: m.alias, d, heard: s.substr(i, w) };
        }
      }
    }
    return best && best.d <= 0.34 ? best : null;
  };

  if (typeof module !== 'undefined') module.exports = NLU; else root.NLU = NLU;
})(typeof window !== 'undefined' ? window : globalThis);
