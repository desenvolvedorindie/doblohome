import os

obj_path = os.path.abspath("assets/doblo.obj")

# Let's inspect all vertices with Z_sk (Three.js Y) > 1.4:
roof_pts = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
            x = (x_sk - 11424.40) * 0.001
            y = (z_sk - 2.75) * 0.001
            z = (y_sk - (-343.13)) * 0.001
            if y > 1.4:
                roof_pts.append((x, y, z))

print(f"Points with Y > 1.4: {len(roof_pts)}")
print(f"Z range for Y > 1.4: {min(p[2] for p in roof_pts):.3f} to {max(p[2] for p in roof_pts):.3f}")

# Look at points near rear (min Z):
rear_pts = [p for p in roof_pts if p[2] < -1.5]
print(f"Points with Z < -1.5 and Y > 1.4: {len(rear_pts)}")
if rear_pts:
    print(f"Sample rear heights (Y): {[p[1] for p in rear_pts[:5]]}")

