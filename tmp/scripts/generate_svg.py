import math
from generate_profile_2d import generate_full_profile

pts = generate_full_profile()

# SVG 400x400, escala 1mm = 8 pixels. Centro = (200, 200)
scale = 8.0 * 1000.0 # metros para pixels

svg = []
svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" style="background:#1e293b;">')
svg.append('<g transform="translate(200, 200)">')

# Path do contorno externo
d_path = []
for i, (x, y) in enumerate(pts):
    px = x * scale
    py = -y * scale # inverter Y para SVG
    if i == 0:
        d_path.append(f"M {px:.2f} {py:.2f}")
    else:
        d_path.append(f"L {px:.2f} {py:.2f}")
d_path.append("Z")

# Furo central: raio 3.4 mm
# Furos dos cantos: raio 2.4 mm em (+-11.5mm, +-11.5mm)
# No SVG, subpaths em sentido anti-horário funcionam como furos em fill-rule="evenodd"
def circle_path(cx, cy, r):
    r_px = r * scale
    cx_px = cx * scale
    cy_px = -cy * scale
    return f"M {cx_px - r_px:.2f} {cy_px:.2f} A {r_px:.2f} {r_px:.2f} 0 1 0 {cx_px + r_px:.2f} {cy_px:.2f} A {r_px:.2f} {r_px:.2f} 0 1 0 {cx_px - r_px:.2f} {cy_px:.2f} Z"

all_d = " ".join(d_path) + " " + circle_path(0, 0, 0.0034)
for cx in [-0.0115, 0.0115]:
    for cy in [-0.0115, 0.0115]:
        all_d += " " + circle_path(cx, cy, 0.0025)

svg.append(f'<path d="{all_d}" fill="#94a3b8" stroke="#38bdf8" stroke-width="1.5" fill-rule="evenodd" />')
svg.append('</g>')
svg.append('</svg>')

with open('tmp/scripts/profile_preview.svg', 'w') as f:
    f.write("\n".join(svg))

print("SVG gerado com sucesso em tmp/scripts/profile_preview.svg")

