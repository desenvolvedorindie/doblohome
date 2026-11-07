import os

obj_path = os.path.abspath("assets/doblo.obj")
materials = set()

with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('usemtl '):
            materials.add(line.strip().split()[1])

print(f"Materials ({len(materials)}): {sorted(list(materials))}")

