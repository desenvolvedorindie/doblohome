with open("assets/doblo.obj", "r") as f:
    lines = f.readlines()

scale = 0.001
offsetX = 11424.40
offsetY = -343.13
offsetZ = 2.75

vertices = []
for line in lines:
    if line.startswith("v "):
        parts = line.strip().split()
        x_sk = float(parts[1])
        y_sk = float(parts[2])
        z_sk = float(parts[3])
        x = (x_sk - offsetX) * scale
        y = (z_sk - offsetZ) * scale
        z = (y_sk - offsetY) * scale
        vertices.append((x, y, z))

# Filtrar vertices perto de Z = 0.40m e |X| < 0.6m
pts = [v for v in vertices if abs(v[2] - 0.40) < 0.3 and abs(v[0]) < 0.5]
ys = [p[1] for p in pts]
print(f"Points near Z=0.4, |X|<0.5: count={len(pts)}, min Y={min(ys):.3f}, max Y={max(ys):.3f}")

# Distribuição de Y
import bisect
ys_sorted = sorted(ys)
print("Percentiles de Y:")
for p in [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9]:
    idx = int(len(ys_sorted) * p)
    print(f"  {int(p*100)}%: Y = {ys_sorted[idx]:.3f}m")

