import math

def get_profile_side_points(size=0.040, slot_w=0.0082, lip_t=0.0022, inner_w=0.019, slot_depth=0.0095, chamfer=0.0015):
    """
    Retorna os pontos de UM lado (TOP, y positivo), indo no sentido horário (da esquerda para a direita):
    De (-hs + chamfer, hs) até (+hs - chamfer, hs), passando pela ranhura T central.
    Depois com 4 rotações de 90° geramos o loop fechado completo no sentido horário!
    """
    hs = size / 2.0
    h_slot = slot_w / 2.0
    h_inner = inner_w / 2.0
    
    # Indo de x negativo para x positivo no topo:
    # 1. Início do topo reto (após chanfro da esq): x = -hs + chamfer, y = hs
    # 2. Borda esquerda da fenda externa: x = -h_slot, y = hs
    # 3. Desce a parede do lábio: x = -h_slot, y = hs - lip_t
    # 4. Alarga na cavidade T: vai para x = -h_inner, y = hs - lip_t - 0.0015 (ou ângulo a 45°)
    # 5. Desce até o fundo do canal: x = -h_inner, y = hs - slot_depth
    # 6. Fundo do canal: de x = -h_inner até x = +h_inner, y = hs - slot_depth
    # 7. Sobe a parede interna direita: x = +h_inner, y = hs - lip_t - 0.0015
    # 8. Fecha o alargamento até o lábio direito: x = +h_slot, y = hs - lip_t
    # 9. Sobe até a face externa: x = +h_slot, y = hs
    # 10. Superfície plana até o chanfro da direita: x = hs - chamfer, y = hs
    # 11. Chanfro do canto direito: x = hs, y = hs - chamfer
    
    pts = [
        (-hs + chamfer, hs),
        (-h_slot, hs),
        (-h_slot, hs - lip_t),
        (-h_inner, hs - lip_t - 0.0012),
        (-h_inner, hs - slot_depth),
        (+h_inner, hs - slot_depth),
        (+h_inner, hs - lip_t - 0.0012),
        (+h_slot, hs - lip_t),
        (+h_slot, hs),
        (+hs - chamfer, hs),
        (+hs, hs - chamfer)
    ]
    return pts

def rotate_point(x, y, angle_rad):
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    return (x * cos_a - y * sin_a, x * sin_a + y * cos_a)

def generate_full_profile():
    # 4 lados rotacionados: 0°, -90°, -180°, -270°
    side_pts = get_profile_side_points()
    # Note: no side_pts, o último ponto é (+hs, hs - chamfer), que se conecta perfeitamente
    # com o início do lado direito rotacionado!
    full_pts = []
    for side in range(4):
        angle = -side * (math.pi / 2.0)
        # Os pontos do lado top vão de -hs+chamfer até hs, hs-chamfer
        # Quando rotacionados por 90 graus no sentido horário, continuam em ordem contínua!
        for pt in side_pts:
            rx, ry = rotate_point(pt[0], pt[1], angle)
            # Evita duplicar pontos adjacentes idênticos
            if full_pts:
                last = full_pts[-1]
                if abs(last[0] - rx) < 1e-6 and abs(last[1] - ry) < 1e-6:
                    continue
            full_pts.append((rx, ry))
    return full_pts

pts = generate_full_profile()
print(f"Total de pontos no contorno externo: {len(pts)}")
for i, p in enumerate(pts[:12]):
    print(f"P{i}: ({p[0]*1000:.1f}mm, {p[1]*1000:.1f}mm)")

