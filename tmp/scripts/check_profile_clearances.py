import math

def check_clearances():
    size = 40.0
    hs = size / 2.0 # 20.0
    slot_w = 8.2 / 2.0 # 4.1
    mouth_ch = 0.8
    lip_t = 2.5
    inner_w = 19.6 / 2.0 # 9.8
    slot_d = 9.5 # profundidade
    bottom_y = hs - slot_d # 10.5
    
    corner_cx = 13.0
    corner_cy = 13.0
    corner_r = 2.0
    
    center_r = 3.4
    
    print("=== Dimensões do Perfil 40x40 T-Slot ===")
    print(f"Largura x Altura: {size} x {size} mm")
    print(f"Abertura externa da ranhura: {slot_w*2:.1f} mm com chanfro de boca a 45° ({mouth_ch}mm)")
    print(f"Largura da câmara interna da porca T: {inner_w*2:.1f} mm")
    print(f"Profundidade total do canal: {slot_d:.1f} mm (fundo a {bottom_y:.1f}mm do centro)")
    print(f"Furo central: Ø {center_r*2:.1f} mm (rosca M8)")
    print(f"4 Furos nos cantos: Ø {corner_r*2:.1f} mm em (±{corner_cx}, ±{corner_cy}) mm")
    
    # Folga entre furo do canto e parede lateral da ranhura do topo:
    wall_dist_x = corner_cx - corner_r - inner_w
    wall_dist_y = corner_cy - corner_r - inner_w
    print(f"Espessura da parede entre furo do canto e cavidade T: {wall_dist_x:.2f} mm")
    
    # Distância para o furo central:
    dist_center = math.hypot(corner_cx, corner_cy) - corner_r - center_r
    print(f"Espessura da parede sólida diagonal entre furo central e canto: {dist_center:.2f} mm")
    
    # Distância entre fundos das cavidades T opostas e o furo central:
    wall_bottom_center = bottom_y - center_r
    print(f"Espessura da parede entre fundo da ranhura T e furo central M8: {wall_bottom_center:.2f} mm")

check_clearances()

