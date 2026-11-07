import os

obj_path = os.path.abspath("assets/doblo.obj")

# Find roof heights along length:
roof_samples = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            if len(parts) >= 4:
                x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
                # Three.js coordinates
                x = (x_sk - 11424.40) * 0.001
                y = (z_sk - 2.75) * 0.001
                z = (y_sk - (-343.13)) * 0.001
                if -1.1 <= z <= 1.1 and abs(x) < 0.65 and y > 1.7:
                    roof_samples.append((x, y, z))

print(f"Sampled {len(roof_samples)} points on the roof.")
y_vals = [p[1] for p in roof_samples]
print(f"Min roof Y: {min(y_vals):.3f} m, Max roof Y: {max(y_vals):.3f} m, Avg: {sum(y_vals)/len(y_vals):.3f} m")

