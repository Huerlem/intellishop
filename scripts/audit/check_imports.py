import os,re,json,sys
root=sys.argv[1]
pkg=json.load(open(os.path.join(root,'package.json'))); declared={**pkg.get('dependencies',{}),**pkg.get('devDependencies',{})}
DIRS=['app','src','components','context','hooks','firebase','errors','utils','constants','__tests__']
EXT=['.tsx','.ts','.jsx','.js','.json','.png','.jpg','.svg']
imp=re.compile(r"""(?:import\s[^'"]*?from\s*|import\s*|export\s[^'"]*?from\s*|require\(\s*|jest\.mock\(\s*)['"]([^'"]+)['"]""")
files=[os.path.join(dp,f) for d in DIRS if os.path.isdir(os.path.join(root,d)) for dp,_,fs in os.walk(os.path.join(root,d)) for f in fs if f.endswith(('.js','.jsx','.ts','.tsx'))]
files+= [os.path.join(root,f) for f in ['app.config.ts','babel.config.js','metro.config.js','eslint.config.js'] if os.path.exists(os.path.join(root,f))]
def resolve(base):
    for c in [base]+[base+e for e in EXT]+[os.path.join(base,'index'+e) for e in EXT]:
        if os.path.isfile(c): return c
    # platform-specific
    for e in ['.ios.tsx','.ios.ts','.ios.js','.native.tsx','.native.js']:
        if os.path.isfile(base+e): return base+e
problems=[]; bare=set(); count=0
for f in files:
    src=open(f,encoding='utf8').read()
    src=re.sub(r'/\*.*?\*/','',src,flags=re.S); src=re.sub(r'(?m)^\s*//.*$','',src)
    for spec in imp.findall(src):
        count+=1
        if spec.startswith('.') or spec.startswith('@/'):
            base=os.path.normpath(os.path.join(os.path.dirname(f),spec)) if spec.startswith('.') else os.path.join(root,spec[2:])
            if not resolve(base): problems.append(f'UNRESOLVED {os.path.relpath(f,root)} -> {spec}')
        else:
            name='/'.join(spec.split('/')[:2]) if spec.startswith('@') else spec.split('/')[0]
            if name in ('fs','path','crypto','node:fs','node:path','node:crypto','react-native-gesture-handler/ReanimatedSwipeable'): continue  # Node built-ins (tests/scripts only)
            bare.add(name)
            if name not in declared and name not in ('expo-router',):
                problems.append(f'UNDECLARED {os.path.relpath(f,root)} -> {spec}')
print(f'files={len(files)} import specifiers={count} distinct packages={len(bare)}')
print('packages imported:',', '.join(sorted(bare)))
print('declared but never imported:',', '.join(sorted(set(declared)-bare)))
print('\n'.join(problems) if problems else 'PROBLEMS: none')
sys.exit(1 if problems else 0)
