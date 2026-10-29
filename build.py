# src/app.html + build/qr.js + build/ai.js + src/mbp-sdk.js → out/index.html(게시용), out/내방식패스_시제품.html(단독 실행용)
import os
here=os.path.dirname(os.path.abspath(__file__)); os.chdir(here); os.makedirs('out',exist_ok=True)
s=open('src/app.html',encoding='utf-8').read()
for m,f in [('QR','build/qr.js'),('AI','build/ai.js'),('SDK','src/mbp-sdk.js')]:
    tag='<script>/*__%s__*/</script>'%m; assert tag in s; s=s.replace(tag,'<script>'+open(f,encoding='utf-8').read().replace('</script','<\\/script')+'</script>')
open('out/index.html','w',encoding='utf-8').write(s)
head='<!doctype html>\n<html lang="ko">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
open('out/내방식패스_시제품.html','w',encoding='utf-8').write(head+s)
print(len(s))
