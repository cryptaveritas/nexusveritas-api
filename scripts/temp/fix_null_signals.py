import subprocess

path = 'C:/Users/User/Desktop/nexusveritas-api/operator_classify.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

replacements = [
    # recycling_loop_true: null should NOT trigger
    (
        "check: p => p.behavioral.recycling_loop,                         weight: 0.40",
        "check: p => isTrue(p.behavioral.recycling_loop),                 weight: 0.40"
    ),
    # split_init_pattern: null should NOT trigger
    (
        "check: p => p.behavioral.split_init_pattern,                     weight: 0.35",
        "check: p => isTrue(p.behavioral.split_init_pattern),             weight: 0.35"
    ),
    # no_recycling_loop: null should NOT give bonus (unknown != confirmed false)
    (
        "check: p => !p.behavioral.recycling_loop,                        weight: 0.15",
        "check: p => isFalse(p.behavioral.recycling_loop),                weight: 0.15"
    ),
    # no_visible_funding: null funding_sources_count should NOT trigger
    # funding_sources_count === 0 means confirmed zero, null means unknown
    (
        "check: p => p.structural.funding_sources_count === 0,            weight: 0.15",
        "check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.15"
    ),
    (
        "check: p => p.structural.funding_sources_count === 0,            weight: 0.20",
        "check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.20"
    ),
    (
        "check: p => p.structural.funding_sources_count === 0,            weight: 0.30",
        "check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.30"
    ),
]

fixed = 0
for old, new in replacements:
    if old in code:
        code = code.replace(old, new)
        fixed += 1
        print(f'Fixed: {old[:50]}...')
    else:
        print(f'NOT FOUND: {old[:50]}...')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print(f'\nTotal fixed: {fixed}/{len(replacements)}')
