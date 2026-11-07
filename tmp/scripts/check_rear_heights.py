import os

obj_path = os.path.abspath("assets/doblo.obj")

# Find vertices with y_sk < -1000 (rear half of the car):
rear_samples = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
            if y_sk < -1000:
                rear_samples.append((x_sk, y_sk, z_sk))

print(f"Total vertices with y_sk < -1000: {len(rear_samples)}")
if rear_samples:
    z_heights = [p[2] for p in rear_samples]
    print(f"Max Z height in rear: {max(z_heights):.2f} mm")
    print(f"Min Z height in rear: {min(z_heights):.2f} mm")

# What about y_sk > +1000?
front_samples = []
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
            if y_sk > 1000:
                front_samples.append((x_sk, y_sk, z_sk))

print(f"Total vertices with y_sk > +1000: {len(front_samples)}")
if front_samples:
    z_heights = [p[2] for p in front_samples]
    print(f"Max Z height in front: {max(z_heights):.2f} mm")
    print(f"Min Z height in front: {min(z_heights):.2f} mm")

