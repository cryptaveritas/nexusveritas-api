import re

path = 'C:/Users/User/Desktop/nexusveritas-api/operator_classify.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Check current WALLET_FACTORY weights
wf_start = code.find("class: 'WALLET_FACTORY',")
wf_end = code.find("class: 'ROTATION_OPERATOR',")
wf_section = code[wf_start:wf_end]
weights = re.findall(r"weight: ([\d.]+)", wf_section)
print('Current WALLET_FACTORY weights:', weights, '| Sum:', round(sum(float(w) for w in weights), 2))

# Fix: change the init_amount_0002 weight from 0.20 to 0.10 within WALLET_FACTORY section
old_section = wf_section
new_section = wf_section.replace(
    "p.behavioral.total_incoming_sol <= 0.005 && p.behavioral.total_incoming_sol > 0, weight: 0.20 }",
    "p.behavioral.total_incoming_sol <= 0.005 && p.behavioral.total_incoming_sol > 0, weight: 0.10 }"
)

if old_section != new_section:
    code = code.replace(old_section, new_section)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    new_weights = re.findall(r"weight: ([\d.]+)", new_section)
    print('Fixed! New weights:', new_weights, '| New sum:', round(sum(float(w) for w in new_weights), 2))
else:
    print('No change needed or pattern not found')
