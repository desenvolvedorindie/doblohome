import os

# SketchUp exported doblo.obj
# Let's check a vertex on the front right headlight:
# In Brazil (and most of the world), driver is on left (X < 11424 or X > 11424?)
# Let's check steering wheel position in doblo.obj!

obj_path = os.path.abspath("assets/doblo.obj")
# Check vertices with Z between 700 and 1200, Y between 0 and 600 (dashboard area)
dash_verts = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
            if 0 < y < 600 and 800 < z < 1100:
                dash_verts.append((x, y, z))

print(f"Dashboard vertices: {len(dash_verts)}")
# Let's check steering wheel X:
# Left side in Three.js is negative X (driver side in Brazil).

