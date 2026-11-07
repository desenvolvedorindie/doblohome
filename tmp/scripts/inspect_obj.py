import sys
import os

obj_path = os.path.abspath("assets/doblo.obj")
print(f"Reading {obj_path}...")

min_x = min_y = min_z = float('inf')
max_x = max_y = max_z = float('-inf')

vertex_count = 0
with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            if len(parts) >= 4:
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                min_z = min(min_z, z)
                max_z = max(max_z, z)
                vertex_count += 1

print(f"Total vertices: {vertex_count}")
print(f"X range: {min_x:.2f} to {max_x:.2f} (Size: {max_x - min_x:.2f})")
print(f"Y range: {min_y:.2f} to {max_y:.2f} (Size: {max_y - min_y:.2f})")
print(f"Z range: {min_z:.2f} to {max_z:.2f} (Size: {max_z - min_z:.2f})")
print(f"Center: X={(min_x + max_x)/2:.2f}, Y={(min_y + max_y)/2:.2f}, Z={(min_z + max_z)/2:.2f}")

