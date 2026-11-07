"""
Script para gerar e validar o contorno exato do perfil de alumínio 40x40 T-Slot.
Dimensões em mm (depois convertidas para metros / Three.js).
"""
import math

def generate_profile_points(size=40.0, slot_w=8.2, lip_t=2.2, inner_w=20.0, slot_depth=9.5, chamfer=1.5):
    # Metade do tamanho
    hs = size / 2.0 # 20.0
    h_slot = slot_w / 2.0 # 4.1
    h_inner = inner_w / 2.0 # 10.0
    
    # Vamos construir 1 quarto (quadrante) ou 1 lado e rotacionar por simetria de 90 graus!
    # Lado TOP (y = +hs):
    # Começa no canto direito chanfrado (hs - chamfer, hs)
    # Anda para a esquerda até a fenda: (h_slot, hs)
    # Desce na ranhura: (h_slot, hs - lip_t)
    # Alarga para a cavidade T: (h_inner, hs - lip_t - (h_inner - h_slot)) ou degrau
    # No perfil 4040 padrão:
    # Do lábio (h_slot, hs - lip_t) vai reto para trás ou abre a 45°:
    # Em perfil T-Slot 4040 clássico:
    # Lábio tem espessura lip_t (ex 2.5mm).
    # Daí abre lateralmente para h_inner com degrau reto e ângulo de alívio:
    # (h_slot, hs - lip_t) -> (h_inner, hs - lip_t) -> (h_inner, hs - slot_depth)
    # -> (-h_inner, hs - slot_depth) -> (-h_inner, hs - lip_t) -> (-h_slot, hs - lip_t)
    # -> (-h_slot, hs)
    # Mas em perfis com nervura / V-slot / T-slot moderno:
    # A parede do T-slot tem degrau com ângulo de 45° ou 30° para retenção de porca e rigidez:
    pass

print("Script de validação do perfil iniciado...")

