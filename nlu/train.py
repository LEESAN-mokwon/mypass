"""내 방식 패스 음성주문 의도 분류기 학습 스크립트
사용법:
  python gen.py && python gen2.py        # 학습 문장 생성 (train2.jsonl)
  node feat.js train2                    # 브라우저 엔진과 똑같은 방식으로 특징 계산 (train2.feat.json)
  python train.py train2 model.json      # 다항 로지스틱 회귀 학습 → model.json
  node eval.js test.jsonl handtest.jsonl blindtest3.jsonl   # 평가
"""
import json, sys
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.linear_model import LogisticRegression
name = sys.argv[1] if len(sys.argv) > 1 else 'train2'
out = sys.argv[2] if len(sys.argv) > 2 else 'model.json'
rows = json.load(open(name + '.feat.json'))
DIM = 4096
data, ind, ptr, y = [], [], [0], []
for r in rows:
    ind += r['i']; data += r['v']; ptr.append(len(ind)); y.append(r['y'])
X = csr_matrix((data, ind, ptr), shape=(len(rows), DIM))
clf = LogisticRegression(C=6, max_iter=3000)
clf.fit(X, y)
print('train acc', round(clf.score(X, y), 4), 'classes', list(clf.classes_))
json.dump({'classes': list(clf.classes_), 'W': np.round(clf.coef_, 3).tolist(), 'b': np.round(clf.intercept_, 3).tolist(), 'dim': DIM},
          open(out, 'w'), separators=(',', ':'))
