from pathlib import Path

p = Path('packages/contracts/claimgrid.py')
s = p.read_text(encoding='utf-8')
required = ['class ClaimGrid', '@gl.public.write.payable', '@gl.public.view', 'prompt_comparative', 'reserved', 'policy_version']
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('Missing contract markers: ' + ', '.join(missing))
print('Contract structure check passed.')
