import os,re,sys
root=sys.argv[1]
# Build URL set from app/ files (expo-router: groups "(x)" are not in URLs; index -> parent; _layout/+not-found excluded)
urls=set()
for dp,_,fs in os.walk(os.path.join(root,'app')):
    for f in fs:
        if not f.endswith(('.tsx','.ts','.jsx','.js')): continue
        rel=os.path.relpath(os.path.join(dp,f),os.path.join(root,'app'))
        name=os.path.splitext(rel)[0]
        if os.path.basename(name).startswith(('_layout','+')): continue
        segs=[s for s in name.split(os.sep)]
        full='/'+'/'.join(segs)                                   # with groups
        nogroup='/'+'/'.join(s for s in segs if not (s.startswith('(') and s.endswith(')')))
        for u in (full,nogroup):
            u=re.sub(r'/index$','',u) or '/'
            urls.add(u if u else '/')
consts={}
rt=os.path.join(root,'src/navigation/routes.ts')
if os.path.exists(rt):
    for k,v in re.findall(r"(\w+):\s*'(/[^']*)'",open(rt).read()): consts['ROUTES.'+k]=v
targets=[]
for d in ['app','src','components','context','hooks','errors']:
    for dp,_,fs in os.walk(os.path.join(root,d)):
        for f in fs:
            if not f.endswith(('.tsx','.ts','.jsx','.js')): continue
            p=os.path.join(dp,f); s=open(p,encoding='utf8').read()
            for m in re.finditer(r"(?:router\.(?:push|replace|navigate)|navigation\.navigate|href=|pathname:)\s*\(?\s*(?:\{?\s*pathname:\s*)?([`'\"][^`'\"]+[`'\"]|ROUTES\.\w+)",s):
                raw=m.group(1)
                val=consts.get(raw, raw.strip('`\'"'))
                targets.append((os.path.relpath(p,root), raw, val))
bad=0
for f,raw,val in targets:
    v=re.sub(r'\$\{[^}]+\}','[x]',val)
    ok = v in urls or ('[x]' in v and any(re.fullmatch(re.escape(v).replace(r'\[x\]','[^/]+'),u) for u in urls))
    if not ok: bad+=1
    print(('ok    ' if ok else 'BROKEN'), f, raw, '->', val)
print('routes:',sorted(urls)); print('BROKEN TOTAL:',bad); sys.exit(1 if bad else 0)
