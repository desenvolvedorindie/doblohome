import os

obj_path = os.path.abspath("assets/doblo.obj")

# In doblo.js, we transformed coordinates as:
# x = (x_sk - 11424.40) * 0.001
# y = (z_sk - 2.75) * 0.001
# z = (y_sk - (-343.13)) * 0.001

# Let's find vertices with y > 1.6 (upper body / roof):
roof_points = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
            x = (x_sk - 11424.40) * 0.001
            y = (z_sk - 2.75) * 0.001
            z = (y_sk - (-343.13)) * 0.001
            if y > 1.70 and abs(x) < 0.65:
                roof_points.append((x, y, z))

print(f"Total roof points found: {len(roof_points)}")
z_vals = [p[2] for p in roof_points]
y_vals = [p[1] for p in roof_points]
print(f"Roof Z range (front to back): {min(z_vals):.3f}m (rear) to {max(z_vals):.3f}m (front)")
print(f"Roof Y range (height): {min(y_vals):.3f}m to {max(y_vals):.3f}m (highest point)")

# Sample heights at different Z positions:
for test_z in [0.5, 0.2, 0.0, -0.4, -0.8, -1.2, -1.6, -1.8]:
    near = [p[1] for p in roof_points if abs(p[2] - test_z) < 0.08]
    if near:
        print(f"  At Z = {test_z:+.2f}m: roof max height = {max(near):.3f}m, avg = {sum(near)/len(near):.3f}m")

