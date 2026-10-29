"""Check current authentication context contracts without referencing deleted V1 files.

This is a lightweight static regression check, not a substitute for TypeScript/Jest.
"""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
provider_path = root / 'context/AuthContext.jsx'
hook_path = root / 'hooks/useAuth.js'
provider = provider_path.read_text(encoding='utf-8')
hook = hook_path.read_text(encoding='utf-8')

match = re.search(r'<AuthContext\.Provider\s+value=\{\{(?P<body>.*?)\}\}', provider, re.S)
if match is None:
    print('ERROR: AuthContext.Provider value contract not found')
    sys.exit(1)

def fields(text):
    result = set()
    for part in text.split(','):
        part = part.strip()
        if not part:
            continue
        key = part.split(':', 1)[0].strip()
        if re.fullmatch(r'[A-Za-z_$][\w$]*', key):
            result.add(key)
    return result

provided = fields(match.group('body'))
required = {'user', 'userData', 'initialising', 'loading', 'error', 'register', 'login', 'logout', 'forgotPassword', 'updateProfile', 'acceptTerms'}
issues = []
for name in sorted(required - provided):
    issues.append(f'AuthContext missing required property: {name}')
if not re.search(r'export\s+const\s+useAuth\s*=', hook):
    issues.append('hooks/useAuth.js no longer exports useAuth')
if not re.search(r'\.\.\.context', hook):
    issues.append('useAuth no longer spreads AuthContext properties')
for path in (root / 'src').rglob('*.tsx'):
    source = path.read_text(encoding='utf-8')
    for destructuring in re.findall(r'const\s*\{([^{}]*)\}\s*=\s*useAuth\(\)', source, re.S):
        for part in destructuring.split(','):
            field = part.strip().split(':', 1)[0].split('=', 1)[0].strip()
            if field and field not in provided and field not in {'getDisplayName', 'getInitials', 'getEmail', 'getPhotoURL'}:
                issues.append(f'{path.relative_to(root)} requires missing auth property: {field}')
print(f'AuthContext properties: {len(provided)}; contract errors: {len(issues)}')
for item in issues:
    print('ERROR:', item)
sys.exit(1 if issues else 0)
