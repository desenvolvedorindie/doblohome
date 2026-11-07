import os

obj_path = os.path.abspath("assets/doblo.obj")

# Profile car height (Three.js Y) vs length (Three.js Z):
# Z ranges from -2.23 to +2.23:
bins = {}
for z_bin in [round(-2.2 + i * 0.2, 2) for i in range(23)]:
    bins[z_bin] = []

with open(obj_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('v '):
            parts = line.strip().split()
            x_sk, y_sk, z_sk = float(parts[1]), float(parts[2]), float(parts[3])
            x = (x_sk - 11424.40) * 0.001
            y = (z_sk - 2.75) * 0.001
            z = (y_sk - (-343.13)) * 0.001
            # Near centerline of car
            if abs(x) < 0.5:
                # Find closest bin
                for b in bins:
                    if abs(z - b) < 0.1:
                        bins[b].append(y)

print("Car Top Profile (Centerline X=0):")
print(f"{'Z (Length)':>12} | {'Max Y (Height)':>15} | {'Notes'}")
print("-" * 45)
for b in sorted(bins.keys()):
    if bins[b]:
        max_y = max(bins[b])
        note = ""
        if b > 1.4: note = "Hood / Front Grille"
        elif 0.6 <= b <= 1.4: note = "Windshield slope"
        elif -1.6 <= b < 0.6: note = "ROOF SECTION (Useful for Rack!)"
        elif b < -1.6: note = "Rear Window / Tailgate"
        print(f"{b:+10.2f} m | {max_y:13.3f} m | {note}")

