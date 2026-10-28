"""Every named import from a local module must match an export of that module
(mirrors ESLint import/named, which tsc does not enforce for .js/.jsx importers)."""
import os,re,sys
root=sys.argv[1]
EXT=['.tsx','.ts','.jsx','.js']
def resolve(base):
    for c in [base+e for e in EXT]+[os.path.join(base,'index'+e) for e in EXT]+[base]:
        if os.path.isfile(c): return c
def exports_of(path):
    s=open(path,encoding='utf8').read()
    names=set(re.findall(r'export\s+(?:async\s+)?(?:const|let|var|function\*?|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)',s))
    for grp in re.findall(r'export\s+(?:type\s+)?\{([^}]*)\}',s):
        for part in grp.split(','):
            part=part.strip()
            if part: names.add(part.split(' as ')[-1].strip().replace('type ','').strip())
    if re.search(r'export\s+\*\s+from',s):
        for spec in re.findall(r"export\s+\*\s+from\s+['\"]([^'\"]+)['\"]",s):
            t=resolve(os.path.normpath(os.path.join(os.path.dirname(path),spec)))
            if t: names|=exports_of(t)
    return names
bad=0; n=0
for d in ['app','src','components','context','hooks','firebase','errors','utils','constants','__tests__','test-utils']:
    for dp,_,fs in os.walk(os.path.join(root,d)):
        for f in fs:
            if not f.endswith(tuple(EXT)): continue
            p=os.path.join(dp,f); s=open(p,encoding='utf8').read()
            for names,spec in re.findall(r"import\s+(?:[\w$]+\s*,\s*)?(?:type\s+)?\{([^}]*)\}\s*from\s*['\"]([^'\"]+)['\"]",s):
                if not (spec.startswith('.') or spec.startswith('@/')): continue
                base=os.path.normpath(os.path.join(os.path.dirname(p),spec)) if spec.startswith('.') else os.path.join(root,spec[2:])
                t=resolve(base)
                if not t or not t.endswith(tuple(EXT)): continue
                ex=exports_of(t)
                for nm in names.split(','):
                    nm=nm.strip().replace('type ','').split(' as ')[0].strip()
                    if not nm: continue
                    n+=1
                    if nm not in ex:
                        bad+=1; print(f'MISSING {os.path.relpath(p,root)}: {{ {nm} }} from {spec}')
print(f'named imports checked: {n}; missing: {bad}'); sys.exit(1 if bad else 0)
