# 한국어 카페 주문 발화 합성 데이터 생성기
# 출력: train.jsonl, test.jsonl (각 줄: text, intent, items[{id,qty,temp}])
import json, random, sys

MENU = {
  'americano':   {'names':['아메리카노','아메','아이스아메리카노','블랙커피','그냥 커피','커피'], 'temp':True},
  'latte':       {'names':['카페라떼','라떼','카페라테','라테','우유 커피','우유 들어간 커피'], 'temp':True},
  'vanilla':     {'names':['바닐라라떼','바닐라 라떼','바닐라라테','바닐라'], 'temp':True},
  'yuja':        {'names':['유자차','유자','유자 차'], 'temp':True},
  'ginger':      {'names':['생강차','생강','생강 차'], 'temp':True},
  'choco':       {'names':['초코라떼','핫초코','초코','코코아','초콜릿 라떼'], 'temp':True},
  'smoothie':    {'names':['딸기스무디','딸기 스무디','스무디','딸기 주스','딸기'], 'temp':False},
  'cake':        {'names':['치즈케이크','치즈 케이크','케이크','케익'], 'temp':False},
}
QTY = {1:['하나','한 잔','한잔','1잔','한 개','1개','한 개요','하나요'],
       2:['두 잔','두잔','둘','2잔','두 개','2개','두 개요'],
       3:['세 잔','세잔','셋','3잔','석 잔','세 개','3개'],
       4:['네 잔','넉 잔','넷','4잔','네 개','4개']}
HOT = ['따뜻한','따뜻하게','뜨거운','뜨겁게','핫','따끈한','따뜻한 걸로']
ICE = ['차가운','차갑게','아이스','시원한','시원하게','얼음 넣은','아이스로']
PRE = ['','','','저기요 ','음 ','어 ','저 ','여기 ','아 그 ','네 ']
END_ORDER = ['','주세요','요','줘','주세요','이요','부탁해요','주실래요','할게요','으로 할게요','먹을게요','시킬게요','주문할게요','하나 줘요','로 주세요','좀 주세요','부탁드려요']

def item_phrase(mid, rnd, with_qty=True, with_temp=True):
    m = MENU[mid]; name = rnd.choice(m['names'])
    qty = 1; temp = None; parts = []
    if with_temp and m['temp'] and rnd.random()<0.55:
        if 'ice' in name or '아이스' in name: temp='ice'
        else:
            temp = rnd.choice(['hot','ice']); parts.append(rnd.choice(HOT if temp=='hot' else ICE))
    if name.startswith('아이스'): temp='ice'
    parts.append(name)
    if with_qty and rnd.random()<0.7:
        qty = rnd.choice([1,1,1,2,2,3,4]); parts.append(rnd.choice(QTY[qty]))
    if temp is None and with_temp and m['temp'] and rnd.random()<0.15:
        temp = rnd.choice(['hot','ice']); parts.append('따뜻하게' if temp=='hot' else '차갑게')
    return ' '.join(p for p in parts if p), {'id':mid,'qty':qty,'temp':temp}

def gen_order(rnd):
    n = 1 if rnd.random()<0.72 else 2
    mids = rnd.sample(list(MENU), n)
    phrases=[]; items=[]
    for i,mid in enumerate(mids):
        p,it = item_phrase(mid, rnd); phrases.append(p); items.append(it)
    joiner = rnd.choice(['이랑 ','하고 ',', ','랑 ',' 그리고 ','에 '])
    text = rnd.choice(PRE) + joiner.join(phrases) + ' ' + rnd.choice(END_ORDER)
    return text.strip(), 'order', items

TEMPL = {
 'remove':   ['{x} 빼 주세요','{x} 취소해 주세요','{x} 빼줘','{x}는 안 먹을래요','{x} 지워 주세요','{x} 하나 빼요','방금 시킨 {x} 취소','{x} 말고요 빼주세요','{x} 필요 없어요'],
 'checkout': ['결제할게요','계산해 주세요','이제 계산','다 됐어요','결제','주문 끝','이걸로 주문할게요','계산할게요','다 골랐어요','카드로 할게요','이대로 주세요','주문 완료','결제해 주세요','이제 됐어요 계산해줘요'],
 'cancel':   ['처음부터 다시','전부 취소','다 취소해 주세요','처음으로','주문 안 할래요','다시 할게요','전부 지워 주세요','그만할래요','취소 취소','다 빼 주세요','첫 화면으로 돌아가','맨 처음으로 가요','초기 화면으로'],
 'help':     ['직원 불러 주세요','도와주세요','사람 불러줘요','잘 모르겠어요','어떻게 해요','이거 어려워요','직원분 좀','도움이 필요해요','못 하겠어요','여기 좀 와 주세요','사장님 불러 주세요','모르겠는데요','사람이 안 보여요','계산대에 사람 없어요','누구 없어요','어디 눌러야 돼요','글씨가 안 보여요'],
 'repeat':   ['다시 말해 주세요','뭐라고요','한 번 더요','다시요','잘 못 들었어요','천천히 말해 주세요','다시 한번 읽어 주세요','방금 뭐라 했어요','안 들려요'],
 'yes':      ['네','예','맞아요','응','네 맞아요','좋아요','그래요','네 그걸로','어 맞아','예 그렇게 해 주세요'],
 'no':       ['아니요','아니','아니에요','틀렸어요','그거 아니에요','아뇨','아니 그거 말고','싫어요'],
 'menu':     ['뭐 있어요','메뉴 알려 주세요','뭐 팔아요','메뉴 읽어 주세요','마실 거 뭐 있어요','추천해 주세요','따뜻한 거 뭐 있어요','안 쓴 거 있어요','달달한 거 뭐 있어요','커피 말고 뭐 있어요'],
}
def gen_other(intent, rnd):
    t = rnd.choice(TEMPL[intent])
    if '{x}' in t:
        mid = rnd.choice(list(MENU)); t = t.replace('{x}', rnd.choice(MENU[mid]['names']))
        return (rnd.choice(PRE)+t).strip(), intent, [{'id':mid,'qty':1,'temp':None}]
    return (rnd.choice(PRE)+t).strip(), intent, []

def noise(text, rnd, p):
    # 음성인식 오류 흉내: 띄어쓰기 변형, 글자 탈락·반복, 비슷한 글자 치환
    sim = {'떼':'테','테':'떼','라':'나','차':'자','잔':'장','두':'도','세':'새','케':'게','아':'어','리':'니','카':'가'}
    out=[]
    for ch in text:
        r = rnd.random()
        if ch==' ' and r<p: continue
        if r<p*0.3 and ch!=' ': continue
        if r<p*0.6 and ch in sim: out.append(sim[ch]); continue
        out.append(ch)
        if r>1-p*0.15 and ch!=' ': out.append(' ')
    return ''.join(out)

def make(n, seed, p_noise):
    rnd = random.Random(seed); rows=[]
    weights = [('order',0.5),('remove',0.06),('checkout',0.08),('cancel',0.06),('help',0.08),('repeat',0.06),('yes',0.05),('no',0.04),('menu',0.07)]
    for _ in range(n):
        r = rnd.random(); acc=0
        for it,w in weights:
            acc+=w
            if r<acc: intent=it; break
        else: intent='order'
        text, intent, items = gen_order(rnd) if intent=='order' else gen_other(intent, rnd)
        if p_noise and rnd.random()<0.6: text = noise(text, rnd, p_noise)
        rows.append({'text':text,'intent':intent,'items':items})
    return rows

if __name__=='__main__':
    for name,n,seed,p in [('train',6000,1,0.08),('test',1500,99,0.12)]:
        with open(name+'.jsonl','w') as f:
            for r in make(n,seed,p): f.write(json.dumps(r,ensure_ascii=False)+'\n')
    print('ok')
