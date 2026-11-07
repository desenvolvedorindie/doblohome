import os

obj_path = os.path.abspath("assets/doblo.obj")
# Check roof vertices (where Y is between -1500 and +500, and Z is above 1600)
roof_z = []

with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            if len(parts) >= 4:
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                if -1500 < y < 500 and z > 1600:
                    roof_z.append(z)

print(f"Found {len(roof_z)} roof vertices. Min Z: {min(roof_z):.2f}, Max Z: {max(roof_z):.2f}")

