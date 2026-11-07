import os

obj_path = os.path.abspath("assets/doblo.obj")
# Check vertices of mirrors:
# Mirrors are the widest points on X (min X and max X)
min_x_verts = []
max_x_verts = []

with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
            if x < 10400:
                min_x_verts.append((x, y, z))
            elif x > 12450:
                max_x_verts.append((x, y, z))

print(f"Min X (near 10350): Y range {[min(v[1] for v in min_x_verts), max(v[1] for v in min_x_verts)]}, Z range {[min(v[2] for v in min_x_verts), max(v[2] for v in min_x_verts)]}")
print(f"Max X (near 12500): Y range {[min(v[1] for v in max_x_verts), max(v[1] for v in max_x_verts)]}, Z range {[min(v[2] for v in max_x_verts), max(v[2] for v in max_x_verts)]}")

