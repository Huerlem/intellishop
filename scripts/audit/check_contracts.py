import os,re,sys
root=sys.argv[1]
rd=lambda p: open(os.path.join(root,p),encoding='utf8').read().replace('\r\n','\n')
def provider_keys(path):
    s=rd(path); m=re.search(r'value=\{\{(.*?)\}\}',s,re.S) or re.search(r'const value\s*=\s*\{(.*?)\n\s*\};',s,re.S)
    body=re.sub(r'//.*','',m.group(1))
    return {k.strip().split(':')[0].strip() for k in body.split(',') if k.strip()}
def returned_keys(path):
    s=rd(path); m=list(re.finditer(r'return\s*\{(.*?)\};',s,re.S))[-1]
    body=re.sub(r'//.*','',m.group(1))
    return {k.strip().split(':')[0].strip() for k in body.split(',') if k.strip()}
P={'AuthContext':provider_keys('context/AuthContext.jsx'),'ShoppingListContext':provider_keys('context/ShoppingListContext.jsx'),'StockContext':provider_keys('context/StockContext.jsx')}
H={'useAuth':returned_keys('hooks/useAuth.js'),'useShoppingList':returned_keys('hooks/useShoppingList.js'),'useStock':returned_keys('hooks/useStock.js')}
for k,v in {**P,**H}.items(): print(f'{k}: {len(v)} keys')
screens=['src/screens/HomeScreen.jsx','src/screens/ListsScreen.jsx','src/screens/PantryScreen.jsx','src/screens/ProfileScreen.jsx','app/(public)/LoginScreen.jsx','app/(public)/RegisterScreen.jsx','app/(public)/forgot-password.jsx','app/(public)/WelcomeScreen.jsx','app/_layout.tsx','hooks/useShoppingList.js','hooks/useStock.js','hooks/useAuth.js']
bad=0
for f in screens:
    s=rd(f)
    for m in re.finditer(r'const\s*\{([^}]*)\}\s*=\s*(useContext\((\w+)\)|(use\w+)\(\))',s):
        src=m.group(3) or m.group(4)
        keys=[k.strip().split(':')[0].split('=')[0].strip() for k in m.group(1).split(',') if k.strip()]
        avail=P.get(src) or H.get(src)
        if avail is None: continue
        missing=[k for k in keys if k not in avail]
        print(f'{"MISSING" if missing else "ok":7} {f} <- {src}: {", ".join(keys)}' + (f'   !! not provided: {missing}' if missing else ''))
        bad+=len(missing)
print('TOTAL MISSING:',bad); sys.exit(1 if bad else 0)
