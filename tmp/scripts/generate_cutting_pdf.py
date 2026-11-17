"""
Gerador Profissional do Plano de Corte e Desenhos Técnicos em PDF
Projeto Fiat Doblò Campervan & Sistema Solar Retrátil 3D

Gera um documento técnico em formato PDF (A4 Paisagem) com:
1. Capa & Resumo Executivo Consolidado
2. Tabela Geral de Peças de Marcenaria (BOM)
3. Desenhos Técnicos Vetoriais das Chapas de Madeira (Guilhotina 2D Nesting)
4. Tabela e Desenho Técnico do Bloco de Espuma D33 (Estofaria / Colchão)
5. Tabela e Desenho Técnico de Corte Linear das Barras de 6m (Serralheria / Perfis Metálicos)
6. Tabela e Desenho Técnico de Corte dos Tubos PVC (Reservatório de Água em U)
7. Guia Técnico de Oficina e Ordem dos Cortes
"""

import os
import json
import math
import fitz  # PyMuPDF

def rgb(r, g, b):
    """Converte valores 0-255 para 0.0-1.0 do PyMuPDF."""
    return (r / 255.0, g / 255.0, b / 255.0)

# Paleta de Cores Técnicas
C_BG_PAGE = rgb(255, 255, 255)
C_TEXT_MAIN = rgb(15, 23, 42)      # Slate 900
C_TEXT_MUTED = rgb(100, 116, 139)  # Slate 500
C_PRIMARY = rgb(2, 132, 199)       # Sky 600
C_PRIMARY_DARK = rgb(3, 105, 161)  # Sky 700
C_AMBER = rgb(217, 119, 6)         # Amber 600
C_AMBER_LIGHT = rgb(254, 243, 199) # Amber 100
C_EMERALD = rgb(5, 150, 105)       # Emerald 600
C_EMERALD_LIGHT = rgb(209, 250, 229) # Emerald 100
C_SLATE_BORDER = rgb(203, 213, 225) # Slate 300
C_SLATE_BG = rgb(248, 250, 252)    # Slate 50
C_SHEET_BG = rgb(241, 245, 249)    # Slate 100
C_SHEET_BORDER = rgb(51, 65, 85)   # Slate 700
C_REFILO = rgb(234, 88, 12)        # Orange 600
C_WASTE = rgb(226, 232, 240)       # Slate 200

# Paleta de peças de corte
PIECE_PALETTES = [
    {"fill": rgb(224, 242, 254), "stroke": rgb(2, 132, 199), "text": rgb(3, 105, 161)},  # Sky
    {"fill": rgb(209, 250, 229), "stroke": rgb(5, 150, 105), "text": rgb(4, 120, 87)},   # Emerald
    {"fill": rgb(254, 243, 199), "stroke": rgb(217, 119, 6), "text": rgb(180, 83, 9)},   # Amber
    {"fill": rgb(237, 233, 254), "stroke": rgb(124, 58, 237), "text": rgb(109, 40, 217)}, # Violet
    {"fill": rgb(254, 226, 226), "stroke": rgb(225, 29, 72), "text": rgb(190, 18, 60)},  # Rose
    {"fill": rgb(207, 250, 254), "stroke": rgb(8, 145, 178), "text": rgb(14, 116, 144)},  # Cyan
    {"fill": rgb(254, 249, 195), "stroke": rgb(202, 138, 4), "text": rgb(161, 98, 7)},   # Yellow
    {"fill": rgb(241, 245, 249), "stroke": rgb(71, 85, 105), "text": rgb(51, 65, 85)},   # Slate
]

def draw_header_footer(page, page_num, total_pages, title, subtitle=None):
    """Desenha cabeçalho técnico e rodapé com número de página em todas as páginas."""
    w, h = page.rect.width, page.rect.height
    shape = page.new_shape()

    # Linha decorativa superior azul
    shape.draw_rect(fitz.Rect(0, 0, w, 4))
    shape.finish(fill=C_PRIMARY, width=0)

    # Linha separadora do cabeçalho
    shape.draw_line(fitz.Point(36, 46), fitz.Point(w - 36, 46))
    shape.finish(color=C_SLATE_BORDER, width=0.8)

    # Linha separadora do rodapé
    shape.draw_line(fitz.Point(36, h - 30), fitz.Point(w - 36, h - 30))
    shape.finish(color=C_SLATE_BORDER, width=0.8)

    shape.commit()

    # Textos do Cabeçalho
    page.insert_text(fitz.Point(36, 26), "FIAT DOBLÒ CAMPERVAN • SISTEMA SOLAR 3D", fontname="helv", fontsize=8, color=C_PRIMARY_DARK)
    page.insert_text(fitz.Point(36, 39), title, fontname="hebo", fontsize=11, color=C_TEXT_MAIN)
    if subtitle:
        page.insert_text(fitz.Point(280, 39), f"|  {subtitle}", fontname="helv", fontsize=9, color=C_TEXT_MUTED)

    # Textos do Rodapé
    footer_left = "Projeto Executivo de Marcenaria, Serralheria & Hidráulica • Tolerância: ±1mm (Madeira/Metal), ±5mm (Espuma) • Kerf: 3mm"
    page.insert_text(fitz.Point(36, h - 18), footer_left, fontname="helv", fontsize=7.5, color=C_TEXT_MUTED)

    page_str = f"Página {page_num} de {total_pages}"
    page.insert_text(fitz.Point(w - 110, h - 18), page_str, fontname="hebo", fontsize=8, color=C_TEXT_MAIN)


def draw_card(page, rect, title, value, subtext=None, border_color=C_SLATE_BORDER, bg_color=C_SLATE_BG):
    """Desenha um card de resumo executivo com título, valor e subtexto."""
    shape = page.new_shape()
    shape.draw_rect(rect)
    shape.finish(fill=bg_color, color=border_color, width=1)
    shape.commit()

    page.insert_text(fitz.Point(rect.x0 + 12, rect.y0 + 18), title, fontname="hebo", fontsize=8.5, color=C_TEXT_MUTED)
    page.insert_text(fitz.Point(rect.x0 + 12, rect.y0 + 38), value, fontname="hebo", fontsize=15, color=C_TEXT_MAIN)
    if subtext:
        page.insert_text(fitz.Point(rect.x0 + 12, rect.y0 + 52), subtext, fontname="helv", fontsize=7.5, color=C_TEXT_MUTED)


def generate_cutting_plan_pdf(json_path="tmp/scripts/cutting_data.json", output_pdf="plano_de_corte_doblo_solar.pdf"):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    doc = fitz.open()

    # Contagem preliminar de páginas para numeração correta
    # P1: Capa & Resumo
    # P2: Tabela de Peças de Marcenaria
    # P3 a P(2+N): Chapas de Madeira (1 por página)
    # P(3+N): Estofaria (Espuma D33)
    # P(4+N): Serralheria 1 (Perfis 40x40 e 30x30)
    # P(5+N): Serralheria 2 (Trilhos, telescópicos, sapatas & Soldas)
    # P(6+N): Hidráulica PVC
    # P(7+N): Guia Técnico e Ordem de Corte
    wood_sheets_count = sum(len(cp["sheets"]) for cp in data["wood"]["cuttingPlans"])
    has_awning = bool(data.get("awning") and data["awning"].get("enabled", True))
    total_pages = 2 + wood_sheets_count + 1 + 2 + 1 + (1 if has_awning else 0) + 1

    current_page = 1

    # =========================================================================
    # PÁGINA 1: CAPA TÉCNICA & RESUMO EXECUTIVO (DASHBOARD)
    # =========================================================================
    p1 = doc.new_page(width=842, height=595)
    draw_header_footer(p1, current_page, total_pages, "RESUMO EXECUTIVO & ESPECIFICAÇÕES TÉCNICAS")

    # Banner de Destaque da Capa
    s1 = p1.new_shape()
    s1.draw_rect(fitz.Rect(36, 56, 806, 155))
    s1.finish(fill=rgb(240, 249, 255), color=C_PRIMARY, width=1.2)

    # Faixa lateral azul do banner
    s1.draw_rect(fitz.Rect(36, 56, 44, 155))
    s1.finish(fill=C_PRIMARY, width=0)
    s1.commit()

    p1.insert_text(fitz.Point(60, 82), "PROJETO EXECUTIVO DE CORTE & FABRICAÇÃO", fontname="hebo", fontsize=10, color=C_PRIMARY_DARK)
    p1.insert_text(fitz.Point(60, 108), "Plano de Corte Otimizado & Desenho dos Cortes", fontname="hebo", fontsize=20, color=C_TEXT_MAIN)
    p1.insert_text(fitz.Point(60, 128), "Layout: " + data["project"]["presetName"], fontname="hebo", fontsize=11, color=C_AMBER)
    p1.insert_text(fitz.Point(60, 144), "Veículo: " + data["project"]["vehicle"] + "  •  Data: " + data["project"]["date"] + "  •  Versão: 2.0 (CAD/CAM Integrado)", fontname="helv", fontsize=8.5, color=C_TEXT_MUTED)

    # 4 Cards de Resumo Executivo
    cw = (806 - 36 - 30) / 4 # largura de cada card
    c_y = 166

    # Card 1: Marcenaria
    draw_card(
        p1, fitz.Rect(36, c_y, 36 + cw, c_y + 64),
        "MARCENARIA (COMPENSADO)",
        f"{data['wood']['totalPieces']} Peças",
        f"{data['wood']['totalAreaM2']:.2f} m²  •  {data['wood']['standardSheets']} Chapas 2440×1220",
        border_color=C_AMBER, bg_color=C_AMBER_LIGHT
    )

    # Card 2: Estofaria
    draw_card(
        p1, fitz.Rect(36 + cw + 10, c_y, 36 + 2 * cw + 10, c_y + 64),
        "ESTOFARIA (ESPUMA D33)",
        f"{data['upholstery']['totalPieces']} Almofadas",
        f"{data['upholstery']['totalAreaM2']:.2f} m²  •  {data['upholstery']['totalVolumeLiters']:.0f} Litros de Espuma",
        border_color=C_PRIMARY, bg_color=rgb(224, 242, 254)
    )

    # Card 3: Serralheria
    draw_card(
        p1, fitz.Rect(36 + 2 * cw + 20, c_y, 36 + 3 * cw + 20, c_y + 64),
        "SERRALHERIA (METAX/T-SLOT)",
        f"{data['metal']['totalPieces']} Perfis",
        f"{data['metal']['totalMeters']:.1f} m lineares  •  {data['metal']['totalBars6m']} Barras de 6m",
        border_color=C_EMERALD, bg_color=C_EMERALD_LIGHT
    )

    # Card 4: Hidráulica
    draw_card(
        p1, fitz.Rect(36 + 3 * cw + 30, c_y, 36 + 4 * cw + 30, c_y + 64),
        "HIDRÁULICA (RESERVATÓRIO)",
        f"{data['pvc']['totalCapacityL']} Litros (U)",
        f"{data['pvc']['totalPieces']} Tubos Ø{data['pvc']['diameterMm']}mm  •  {data['pvc']['totalLinearMeters']:.2f} m",
        border_color=rgb(14, 165, 233), bg_color=rgb(240, 249, 255)
    )

    # Duas colunas centrais: Parâmetros Técnicos & Índice de Conteúdo
    col_w = (806 - 36 - 16) / 2
    col1_x = 36
    col2_x = 36 + col_w + 16
    tbl_y = 242

    # Caixa 1: Parâmetros de Oficina e Máquinas
    s1 = p1.new_shape()
    s1.draw_rect(fitz.Rect(col1_x, tbl_y, col1_x + col_w, tbl_y + 300))
    s1.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=1)
    s1.draw_rect(fitz.Rect(col1_x, tbl_y, col1_x + col_w, tbl_y + 28))
    s1.finish(fill=rgb(241, 245, 249), color=C_SLATE_BORDER, width=1)
    s1.commit()

    p1.insert_text(fitz.Point(col1_x + 12, tbl_y + 19), "⚙️ PARÂMETROS TÉCNICOS DE CORTE & OFICINA", fontname="hebo", fontsize=9.5, color=C_TEXT_MAIN)

    params = [
        ("Espessura de Corte da Serra (Kerf Madeira):", "3,0 mm (Disco Trapezoidal / Widea)"),
        ("Refilo Periférico Obrigatório (Margem):", "10,0 mm nas 4 bordas da chapa bruta"),
        ("Chapa Padrão de Compensado Naval:", "2.440 mm × 1.220 mm (Área: 2,977 m²)"),
        ("Chapa Padrão de MDF Branco Ultra:", "2.750 mm × 1.830 mm (Área: 5,032 m²)"),
        ("Bloco Comercial de Espuma D33:", "1.900 mm × 1.400 mm (Densidade 33 Real)"),
        ("Comprimento Comercial das Barras:", "6.000 mm (Perfis Alumínio / Metalon / PVC)"),
        ("Kerf de Corte Metálico / Disco Abrasivo:", "3,0 mm (Serra Policorte / Esquadrejadeira)"),
        ("Furações de Alívio e Ventilação CNC:", "Broca Forstner Ø 40 mm (Passo 85 mm)"),
        ("Acabamento das Bordas de Madeira:", "Fita de Borda PVC 1,0 mm c/ cola PUR"),
        ("Impermeabilização da Madeira:", "Seladora + 2 demãos de Verniz PU Náutico"),
        ("Soldagem da Estrutura Metálica:", "MIG/MAG ou TIG (Cordão contínuo nas quinas)")
    ]

    py = tbl_y + 48
    for label, val in params:
        p1.insert_text(fitz.Point(col1_x + 12, py), label, fontname="hebo", fontsize=8, color=C_TEXT_MAIN)
        p1.insert_text(fitz.Point(col1_x + 220, py), val, fontname="helv", fontsize=8, color=C_PRIMARY_DARK)
        py += 22

    # Caixa 2: Índice e Sumário do Documento
    s1 = p1.new_shape()
    s1.draw_rect(fitz.Rect(col2_x, tbl_y, col2_x + col_w, tbl_y + 300))
    s1.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=1)
    s1.draw_rect(fitz.Rect(col2_x, tbl_y, col2_x + col_w, tbl_y + 28))
    s1.finish(fill=rgb(241, 245, 249), color=C_SLATE_BORDER, width=1)
    s1.commit()

    p1.insert_text(fitz.Point(col2_x + 12, tbl_y + 19), "📑 ÍNDICE GERAL DO DOCUMENTO", fontname="hebo", fontsize=9.5, color=C_TEXT_MAIN)

    toc_items = [
        ("Página 1", "Resumo Executivo, Metadados e Parâmetros de Oficina"),
        ("Página 2", "Lista Geral de Peças de Marcenaria (Bill of Materials)"),
        (f"Páginas 3 a {2 + wood_sheets_count}", f"Desenhos Técnicos das {wood_sheets_count} Chapas de Madeira (Guilhotina 2D)"),
        (f"Página {3 + wood_sheets_count}", "Estofaria & Colchão: Lista de Almofadas & Desenho do Bloco D33"),
        (f"Página {4 + wood_sheets_count}", "Serralheria: Perfis T-Slot 40x40 e 30x30 (Corte Linear 1D)"),
        (f"Página {5 + wood_sheets_count}", "Serralheria: Trilhos Telescópicos, Sapatas e Juntas Soldadas"),
        (f"Página {6 + wood_sheets_count}", "Hidráulica: Tubos PVC Ø100mm, Conexões e Esquema do Reservatório"),
        (f"Página {7 + wood_sheets_count}", "Guia de Oficina: Sequência de Corte, Refilo e Montagem")
    ]

    py = tbl_y + 52
    for pg, desc in toc_items:
        p1.insert_text(fitz.Point(col2_x + 14, py), pg, fontname="hebo", fontsize=8.5, color=C_AMBER)
        p1.insert_text(fitz.Point(col2_x + 85, py), desc, fontname="helv", fontsize=8, color=C_TEXT_MAIN)
        py += 27

    current_page += 1

    # =========================================================================
    # PÁGINA 2: LISTA GERAL DE PEÇAS DE MARCENARIA (BOM DETALHADO)
    # =========================================================================
    p2 = doc.new_page(width=842, height=595)
    draw_header_footer(p2, current_page, total_pages, "LISTA DE PEÇAS DE MARCENARIA (BILL OF MATERIALS)", f"Total: {data['wood']['totalPieces']} peças de corte")

    # Tabela com as peças de corte de marcenaria
    th_y = 56
    s2 = p2.new_shape()
    s2.draw_rect(fitz.Rect(36, th_y, 806, th_y + 22))
    s2.finish(fill=C_PRIMARY_DARK, width=0)
    s2.commit()

    headers = [
        ("#", 42),
        ("Nome da Peça / Identificação", 65),
        ("Módulo", 280),
        ("Material", 420),
        ("Esp.", 540),
        ("Compr.", 575),
        ("Larg.", 625),
        ("Qtd", 675),
        ("Área (m²)", 710),
        ("Usinagem CNC", 760)
    ]
    for h_title, h_x in headers:
        p2.insert_text(fitz.Point(h_x, th_y + 15), h_title, fontname="hebo", fontsize=7.5, color=C_BG_PAGE)

    # Linhas de peças
    all_wood_pieces = []
    for cat in data["wood"]["categories"]:
        for p in cat["pieces"]:
            if not p.get("isUpholstery"):
                all_wood_pieces.append(p)

    row_y = th_y + 24
    row_h = 16.5
    for idx, p in enumerate(all_wood_pieces[:28]): # cabe até 28 linhas confortavelmente
        bg = C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG
        s_row = p2.new_shape()
        s_row.draw_rect(fitz.Rect(36, row_y, 806, row_y + row_h))
        s_row.finish(fill=bg, color=C_SLATE_BORDER, width=0.4)
        s_row.commit()

        p2.insert_text(fitz.Point(42, row_y + 11), f"{idx+1:02d}", fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        
        lbl = p["label"]
        if len(lbl) > 42:
            lbl = lbl[:40] + ".."
        p2.insert_text(fitz.Point(65, row_y + 11), lbl, fontname="hebo", fontsize=7, color=C_TEXT_MAIN)

        mod = p.get("moduleName", "Estrutura")
        if len(mod) > 24:
            mod = mod[:22] + ".."
        p2.insert_text(fitz.Point(280, row_y + 11), mod, fontname="helv", fontsize=6.8, color=C_TEXT_MUTED)

        mat = p.get("woodMaterial", "Compensado")
        p2.insert_text(fitz.Point(420, row_y + 11), mat, fontname="helv", fontsize=6.8, color=C_PRIMARY_DARK)

        p2.insert_text(fitz.Point(540, row_y + 11), f"{p['thicknessMm']}mm", fontname="helv", fontsize=7, color=C_TEXT_MAIN)
        p2.insert_text(fitz.Point(575, row_y + 11), f"{p['lengthMm']} mm", fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p2.insert_text(fitz.Point(625, row_y + 11), f"{p['widthMm']} mm", fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p2.insert_text(fitz.Point(680, row_y + 11), f"{p['qty']}x", fontname="hebo", fontsize=7, color=C_AMBER)
        p2.insert_text(fitz.Point(715, row_y + 11), f"{p['totalAreaM2']:.2f}", fontname="helv", fontsize=7, color=C_TEXT_MAIN)

        cnc_notes = []
        if p.get("isPerforated"):
            cnc_notes.append("Furos CNC Ø40")
        if p.get("hasCabinetCutout"):
            cnc_notes.append("Recorte Armário")
        if p.get("hasCabinetExclusion"):
            cnc_notes.append("Apoio Maciço")
        cnc_str = " + ".join(cnc_notes) if cnc_notes else "Corte Reto"

        cnc_color = C_EMERALD if p.get("isPerforated") else (C_AMBER if p.get("hasCabinetCutout") else C_TEXT_MUTED)
        p2.insert_text(fitz.Point(760, row_y + 11), cnc_str, fontname="helv", fontsize=6.5, color=cnc_color)

        row_y += row_h

    # Nota explicativa no rodapé da tabela
    s_note = p2.new_shape()
    s_note.draw_rect(fitz.Rect(36, 524, 806, 558))
    s_note.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=0.8)
    s_note.commit()

    p2.insert_text(fitz.Point(46, 538), "💡 NOTA DE CORTE: Todas as dimensões indicadas incluem os descontos necessários para refilo e assentamento.", fontname="hebo", fontsize=7.5, color=C_TEXT_MAIN)
    p2.insert_text(fitz.Point(46, 550), "Para peças com furação passante CNC (ex: tampos do estrado da cama), executar as furações antes do corte final de esquadrejamento.", fontname="helv", fontsize=7, color=C_TEXT_MUTED)

    current_page += 1

    # =========================================================================
    # PÁGINAS 3+: DESENHOS TÉCNICOS VETORIAIS DAS CHAPAS DE MADEIRA (2D GUILHOTINA)
    # =========================================================================
    sheet_global_idx = 1
    for cp in data["wood"]["cuttingPlans"]:
        for sheet in cp["sheets"]:
            p_sheet = doc.new_page(width=842, height=595)
            sheet_title = f"DESENHO TÉCNICO DE CORTE — CHAPA {sheet_global_idx:02d} DE {wood_sheets_count:02d}"
            sheet_sub = f"{sheet['material']} {sheet['thicknessMm']}mm  •  Dimensão Nominal: {sheet['sheetWidthMm']} × {sheet['sheetHeightMm']} mm"
            draw_header_footer(p_sheet, current_page, total_pages, sheet_title, sheet_sub)

            # Barra de Estatísticas da Chapa
            sb_y = 54
            s_sb = p_sheet.new_shape()
            s_sb.draw_rect(fitz.Rect(36, sb_y, 806, sb_y + 26))
            s_sb.finish(fill=rgb(240, 253, 244), color=C_EMERALD, width=0.8)
            s_sb.commit()

            p_sheet.insert_text(fitz.Point(46, sb_y + 17), f"⚡ APROVEITAMENTO: {sheet['efficiencyPct']:.1f}%", fontname="hebo", fontsize=9.5, color=C_EMERALD)
            p_sheet.insert_text(fitz.Point(220, sb_y + 17), f"Área Útil Cortada: {sheet['usedAreaM2']:.2f} m² de {sheet['totalAreaM2']:.2f} m²", fontname="helv", fontsize=8.5, color=C_TEXT_MAIN)
            p_sheet.insert_text(fitz.Point(440, sb_y + 17), f"Sobras / Retalhos: {sheet['wastePct']:.1f}%", fontname="helv", fontsize=8.5, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(600, sb_y + 17), f"Refilo: {sheet['marginMm']} mm  •  Kerf da Serra: {sheet['kerfMm']} mm", fontname="hebo", fontsize=8.5, color=C_AMBER)
            p_sheet.insert_text(fitz.Point(740, sb_y + 17), f"Peças: {len(sheet['placedPieces'])}", fontname="hebo", fontsize=8.5, color=C_PRIMARY_DARK)

            # ─── ÁREA DE DESENHO CAD DA CHAPA ───
            # Disponível: x: 36 a 806 (770 pt), y: 88 a 460 (372 pt)
            canvas_x0 = 46
            canvas_y0 = 92
            canvas_max_w = 750
            canvas_max_h = 360

            sheet_w_mm = sheet["sheetWidthMm"]
            sheet_h_mm = sheet["sheetHeightMm"]

            scale = min(canvas_max_w / sheet_w_mm, canvas_max_h / sheet_h_mm)
            draw_w = sheet_w_mm * scale
            draw_h = sheet_h_mm * scale

            # Centraliza o desenho da chapa
            offset_x = canvas_x0 + (canvas_max_w - draw_w) / 2
            offset_y = canvas_y0 + (canvas_max_h - draw_h) / 2

            s_cad = p_sheet.new_shape()

            # Fundo da Chapa Bruta
            s_cad.draw_rect(fitz.Rect(offset_x, offset_y, offset_x + draw_w, offset_y + draw_h))
            s_cad.finish(fill=C_SHEET_BG, color=C_SHEET_BORDER, width=1.5)

            # Linha Tracejada de Refilo (Margem de 10mm)
            margin_mm = sheet.get("marginMm", 10)
            if margin_mm > 0:
                ref_x0 = offset_x + margin_mm * scale
                ref_y0 = offset_y + margin_mm * scale
                ref_w = (sheet_w_mm - 2 * margin_mm) * scale
                ref_h = (sheet_h_mm - 2 * margin_mm) * scale
                s_cad.draw_rect(fitz.Rect(ref_x0, ref_y0, ref_x0 + ref_w, ref_y0 + ref_h))
                s_cad.finish(color=C_REFILO, width=1, dashes="[4 3] 0")

            # Desenho de Cada Peça Posicionada
            for p_idx, piece in enumerate(sheet["placedPieces"]):
                palette = PIECE_PALETTES[p_idx % len(PIECE_PALETTES)]

                px = offset_x + piece["x"] * scale
                py = offset_y + piece["y"] * scale
                pw = piece["w"] * scale
                ph = piece["h"] * scale

                # Retângulo da peça
                s_cad.draw_rect(fitz.Rect(px, py, px + pw, py + ph))
                s_cad.finish(fill=palette["fill"], color=palette["stroke"], width=1.2)

                # Se tiver furos de alívio CNC
                if piece.get("holes"):
                    for hole in piece["holes"]:
                        hx = px + hole["x"] * scale
                        hy = py + hole["y"] * scale
                        hr = max(1.5, hole["r"] * scale)
                        s_cad.draw_circle(fitz.Point(hx, hy), hr)
                        s_cad.finish(fill=rgb(255, 255, 255), color=palette["stroke"], width=0.8)

            s_cad.commit()

            # Desenha textos das peças (labels e dimensões)
            for p_idx, piece in enumerate(sheet["placedPieces"]):
                palette = PIECE_PALETTES[p_idx % len(PIECE_PALETTES)]
                px = offset_x + piece["x"] * scale
                py = offset_y + piece["y"] * scale
                pw = piece["w"] * scale
                ph = piece["h"] * scale

                # Apenas desenha textos se houver espaço suficiente no retângulo
                if pw > 35 and ph > 18:
                    lbl = piece["label"]
                    # Trunca se necessário
                    max_chars = int(pw / 5.2)
                    if len(lbl) > max_chars:
                        lbl = lbl[:max_chars - 2] + ".."

                    f_size = min(9.0, max(6.0, pw / 14))
                    p_sheet.insert_text(fitz.Point(px + 4, py + ph / 2 - 2), lbl, fontname="hebo", fontsize=f_size, color=C_TEXT_MAIN)

                    # Dimensão cotada
                    dim_str = f"{piece['w']} × {piece['h']} mm"
                    if piece.get("rotated"):
                        dim_str += " ↻"
                    p_sheet.insert_text(fitz.Point(px + 4, py + ph / 2 + 8), dim_str, fontname="hebo", fontsize=f_size - 1.0, color=palette["text"])

                    if piece.get("isPerforated") and ph > 35:
                        p_sheet.insert_text(fitz.Point(px + 4, py + ph / 2 + 18), "Vazado CNC", fontname="helv", fontsize=5.5, color=C_EMERALD)

            # Cotas Totais da Chapa (Dimensões Nominais em mm)
            p_sheet.insert_text(fitz.Point(offset_x + draw_w / 2 - 40, offset_y - 4), f"↔ Comprimento Total: {sheet_w_mm} mm", fontname="hebo", fontsize=8, color=C_TEXT_MAIN)
            p_sheet.insert_text(fitz.Point(offset_x - 30, offset_y + draw_h / 2), f"↕ {sheet_h_mm} mm", fontname="hebo", fontsize=8, color=C_TEXT_MAIN)

            # ─── MINI TABELA DE PEÇAS DESTA CHAPA NO RODAPÉ ───
            mt_y = 466
            s_mt = p_sheet.new_shape()
            s_mt.draw_rect(fitz.Rect(36, mt_y, 806, mt_y + 18))
            s_mt.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=0.8)
            s_mt.commit()

            p_sheet.insert_text(fitz.Point(42, mt_y + 12), "ID", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(65, mt_y + 12), "Peça na Folha", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(260, mt_y + 12), "Posição X / Y", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(360, mt_y + 12), "Dimensões Cortadas", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(490, mt_y + 12), "Área Unitária", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(580, mt_y + 12), "Rotação", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)
            p_sheet.insert_text(fitz.Point(660, mt_y + 12), "Furação / Recorte CNC", fontname="hebo", fontsize=7, color=C_TEXT_MUTED)

            r_y = mt_y + 20
            for idx, p in enumerate(sheet["placedPieces"][:5]): # exibe até 5 peças em resumo
                s_r = p_sheet.new_shape()
                s_r.draw_rect(fitz.Rect(36, r_y, 806, r_y + 15))
                s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
                s_r.commit()

                p_sheet.insert_text(fitz.Point(42, r_y + 11), f"#{idx+1}", fontname="helv", fontsize=6.8, color=C_TEXT_MUTED)
                p_sheet.insert_text(fitz.Point(65, r_y + 11), p["label"][:36], fontname="hebo", fontsize=6.8, color=C_TEXT_MAIN)
                p_sheet.insert_text(fitz.Point(260, r_y + 11), f"X={p['x']} mm, Y={p['y']} mm", fontname="helv", fontsize=6.8, color=C_TEXT_MUTED)
                p_sheet.insert_text(fitz.Point(360, r_y + 11), f"{p['w']} × {p['h']} mm", fontname="hebo", fontsize=6.8, color=C_PRIMARY_DARK)
                p_sheet.insert_text(fitz.Point(490, r_y + 11), f"{(p['w'] * p['h'] / 1_000_000):.3f} m²", fontname="helv", fontsize=6.8, color=C_TEXT_MAIN)
                p_sheet.insert_text(fitz.Point(580, r_y + 11), "90° (Rotacionada)" if p.get("rotated") else "0° (Padrão)", fontname="helv", fontsize=6.8, color=C_AMBER if p.get("rotated") else C_TEXT_MUTED)

                cnc_txt = "Furos CNC Ø40" if p.get("isPerforated") else ("Recorte Especial" if p.get("hasCabinetCutout") else "Corte Reto")
                p_sheet.insert_text(fitz.Point(660, r_y + 11), cnc_txt, fontname="helv", fontsize=6.8, color=C_EMERALD if p.get("isPerforated") else C_TEXT_MUTED)
                r_y += 15

            sheet_global_idx += 1
            current_page += 1

    # =========================================================================
    # PÁGINA: ESTOFARIA & TAPEÇARIA (ESPUMA D33 / COLCHÃO CAMPERVAN)
    # =========================================================================
    p_uph = doc.new_page(width=842, height=595)
    draw_header_footer(p_uph, current_page, total_pages, "ESTOFARIA & TAPEÇARIA — PLANO DE CORTE DO COLCHÃO", "Bloco Comercial de Espuma D33 (1.900 × 1.400 × 60/80 mm)")

    # Cards de Resumo da Estofaria
    u_y = 56
    draw_card(p_uph, fitz.Rect(36, u_y, 220, u_y + 56), "TOTAL DE ALMOFADAS", f"{data['upholstery']['totalPieces']} Peças", "Colchão Tripartido Dobrável", border_color=C_PRIMARY, bg_color=rgb(240, 249, 255))
    draw_card(p_uph, fitz.Rect(230, u_y, 414, u_y + 56), "ÁREA & VOLUME TOTAL", f"{data['upholstery']['totalAreaM2']:.2f} m²", f"{data['upholstery']['totalVolumeLiters']:.0f} Litros de Espuma D33", border_color=C_EMERALD, bg_color=C_EMERALD_LIGHT)
    draw_card(p_uph, fitz.Rect(424, u_y, 608, u_y + 56), "BLOCOS DE ESPUMA", f"{data['upholstery']['estimatedSheets1900']} Bloco Padrão", "1900 × 1400 mm (D33 Selada)", border_color=C_AMBER, bg_color=C_AMBER_LIGHT)
    draw_card(p_uph, fitz.Rect(618, u_y, 806, u_y + 56), "REVESTIMENTO & CAPA", "Tecido Impermeável", "Zíper destacável reforçado", border_color=C_SLATE_BORDER, bg_color=C_SLATE_BG)

    # Desenho CAD do Bloco de Espuma D33 com as Almofadas Posicionadas
    f_cad_y = 126
    s_fcad = p_uph.new_shape()
    s_fcad.draw_rect(fitz.Rect(36, f_cad_y, 806, f_cad_y + 240))
    s_fcad.finish(fill=rgb(248, 250, 252), color=C_SLATE_BORDER, width=1)

    # Bloco de espuma: 1900 x 1400 mm
    foam_scale = min(720 / 1900, 210 / 1400)
    fb_w = 1900 * foam_scale
    fb_h = 1400 * foam_scale
    fb_x = 36 + (770 - fb_w) / 2
    fb_y = f_cad_y + (240 - fb_h) / 2

    s_fcad.draw_rect(fitz.Rect(fb_x, fb_y, fb_x + fb_w, fb_y + fb_h))
    s_fcad.finish(fill=rgb(224, 242, 254), color=C_PRIMARY, width=1.5)

    # Almofada 1 (Traseira) e Almofada 2 (Dianteira com encaixe)
    # Supondo almofadas padrão da Doblò: ~1180 x 600 mm e 1180 x 600 mm
    c1_w = 1200 * foam_scale
    c1_h = 600 * foam_scale
    s_fcad.draw_rect(fitz.Rect(fb_x + 10, fb_y + 10, fb_x + 10 + c1_w, fb_y + 10 + c1_h))
    s_fcad.finish(fill=rgb(186, 230, 253), color=C_PRIMARY_DARK, width=1.2)

    c2_w = 1200 * foam_scale
    c2_h = 600 * foam_scale
    c2_x = fb_x + 10
    c2_y = fb_y + 10 + c1_h + 8
    s_fcad.draw_rect(fitz.Rect(c2_x, c2_y, c2_x + c2_w, c2_y + c2_h))
    s_fcad.finish(fill=rgb(254, 243, 199), color=C_AMBER, width=1.2)

    # Destaque do Recorte do Armário Aéreo na Almofada 2
    cutout_w = 250 * foam_scale
    cutout_h = 450 * foam_scale
    s_fcad.draw_rect(fitz.Rect(c2_x, c2_y, c2_x + cutout_w, c2_y + cutout_h))
    s_fcad.finish(fill=rgb(254, 202, 202), color=rgb(239, 68, 68), width=1.2)

    s_fcad.commit()

    # Rótulos no desenho do bloco
    p_uph.insert_text(fitz.Point(fb_x + 20, fb_y + 40), "Almofada #1 — Assento / Cama Traseira (1.200 × 600 × 60mm)", fontname="hebo", fontsize=8.5, color=C_PRIMARY_DARK)
    p_uph.insert_text(fitz.Point(fb_x + 20, fb_y + 55), "Corte Reto 90° • Espuma D33 Pura • Sem recorte", fontname="helv", fontsize=7.5, color=C_TEXT_MAIN)

    p_uph.insert_text(fitz.Point(c2_x + cutout_w + 16, c2_y + 40), "Almofada #2 — Encosto / Cama Dianteira", fontname="hebo", fontsize=8.5, color=C_AMBER)
    p_uph.insert_text(fitz.Point(c2_x + cutout_w + 16, c2_y + 55), "1.200 × 600 × 60mm • C/ RECORTE ESPECIAL P/ ARMÁRIO AÉREO", fontname="hebo", fontsize=7.5, color=rgb(180, 83, 9))

    p_uph.insert_text(fitz.Point(c2_x + 8, c2_y + 24), "RECORTE", fontname="hebo", fontsize=7, color=rgb(185, 28, 28))
    p_uph.insert_text(fitz.Point(c2_x + 8, c2_y + 36), "Armário Aéreo", fontname="helv", fontsize=6, color=rgb(185, 28, 28))

    # Tabela de Almofadas no Rodapé
    tu_y = 384
    s_tu = p_uph.new_shape()
    s_tu.draw_rect(fitz.Rect(36, tu_y, 806, tu_y + 20))
    s_tu.finish(fill=C_PRIMARY_DARK, width=0)
    s_tu.commit()

    p_uph.insert_text(fitz.Point(42, tu_y + 14), "#", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(65, tu_y + 14), "Identificação da Almofada", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(280, tu_y + 14), "Função no Campervan", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(450, tu_y + 14), "Compr. (mm)", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(530, tu_y + 14), "Larg. (mm)", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(610, tu_y + 14), "Esp. (mm)", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(680, tu_y + 14), "Densidade", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_uph.insert_text(fitz.Point(750, tu_y + 14), "Recorte Especial", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)

    ru_y = tu_y + 22
    for idx, c in enumerate(data["upholstery"]["cushions"]):
        s_ru = p_uph.new_shape()
        s_ru.draw_rect(fitz.Rect(36, ru_y, 806, ru_y + 18))
        s_ru.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
        s_ru.commit()

        p_uph.insert_text(fitz.Point(42, ru_y + 12), f"#{idx+1}", fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_uph.insert_text(fitz.Point(65, ru_y + 12), c["label"], fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_uph.insert_text(fitz.Point(280, ru_y + 12), c.get("moduleName", "Cama Retrátil"), fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_uph.insert_text(fitz.Point(450, ru_y + 12), f"{c['lengthMm']} mm", fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_uph.insert_text(fitz.Point(530, ru_y + 12), f"{c['widthMm']} mm", fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_uph.insert_text(fitz.Point(610, ru_y + 12), f"{c['thicknessMm']} mm", fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_uph.insert_text(fitz.Point(680, ru_y + 12), "D33 Selada", fontname="helv", fontsize=7, color=C_PRIMARY_DARK)

        cutout_txt = "Sim (Recorte Aéreo)" if c.get("hasCabinetCutout") else "Não (Corte Reto)"
        c_col = C_AMBER if c.get("hasCabinetCutout") else C_TEXT_MUTED
        p_uph.insert_text(fitz.Point(750, ru_y + 12), cutout_txt, fontname="hebo", fontsize=7, color=c_col)
        ru_y += 18

    # Instrução de Corte da Espuma
    p_uph.insert_text(fitz.Point(36, 545), "✂️ RECOMENDAÇÃO DE CORTE: Cortar com faca elétrica de estofador de duplo gume ou fio quente calibrado a 120°C.", fontname="hebo", fontsize=7.5, color=C_PRIMARY_DARK)
    p_uph.insert_text(fitz.Point(36, 557), "Utilizar régua de alumínio presa com grampos para guiar a lâmina e obter faces de corte 100% perpendiculares.", fontname="helv", fontsize=7, color=C_TEXT_MUTED)

    current_page += 1

    # =========================================================================
    # PÁGINA: SERRALHERIA & PERFIS METÁLICOS — CORTE LINEAR (1D NESTING)
    # =========================================================================
    # Otimização 1D de perfis metálicos em barras de 6m
    def optimize_1d_bars(cut_groups, bar_length_mm=6000, kerf_mm=3):
        by_profile = {}
        for g in cut_groups:
            spec = g["profileSpec"]
            by_profile.setdefault(spec, []).extend([{
                "label": g["label"],
                "lengthMm": g["lengthMm"],
                "profileSpec": spec
            }] * g["qty"])

        results = {}
        for spec, items in by_profile.items():
            sorted_items = sorted(items, key=lambda x: x["lengthMm"], reverse=True)
            bars = []
            for item in sorted_items:
                placed = False
                for bar in bars:
                    added_kerf = kerf_mm if bar["cuts"] else 0
                    if bar["used_mm"] + item["lengthMm"] + added_kerf <= bar_length_mm:
                        bar["cuts"].append(item)
                        bar["used_mm"] += item["lengthMm"] + added_kerf
                        placed = True
                        break
                if not placed:
                    bars.append({
                        "cuts": [item],
                        "used_mm": item["lengthMm"],
                        "bar_length_mm": bar_length_mm
                    })
            for bar in bars:
                bar["waste_mm"] = bar_length_mm - bar["used_mm"]
                bar["efficiency_pct"] = (bar["used_mm"] / bar_length_mm) * 100
            results[spec] = bars
        return results

    nested_metal = optimize_1d_bars(data["metal"]["cutGroups"])

    # Página 1 de Serralheria: Perfis T-Slot 40x40 e 30x30
    p_met1 = doc.new_page(width=842, height=595)
    draw_header_footer(p_met1, current_page, total_pages, "SERRALHERIA ESTRUTURAL — DESENHO DE CORTE LINEAR (1D NESTING)", "Perfis T-Slot 40x40 e 30x30  •  Barras Comerciais de 6.000 mm")

    # Banner informativo
    s_mb = p_met1.new_shape()
    s_mb.draw_rect(fitz.Rect(36, 54, 806, 78))
    s_mb.finish(fill=C_EMERALD_LIGHT, color=C_EMERALD, width=0.8)
    s_mb.commit()

    p_met1.insert_text(fitz.Point(46, 68), "📏 DESENHO TÉCNICO DE CORTE DAS BARRAS DE 6 METROS (1D BEST-FIT DECREASING)", fontname="hebo", fontsize=8.5, color=C_EMERALD)
    p_met1.insert_text(fitz.Point(46, 75), "Cada régua representa uma barra comercial inteira de 6.000 mm. Cortes delimitados com indicação da perda de serra (kerf 3mm) e sobra final.", fontname="helv", fontsize=7.5, color=C_TEXT_MAIN)

    # Renderiza os perfis principais: Perfil T-Slot 40x40 e 30x30
    target_specs = ["Perfil T-Slot 40x40", "Perfil T-Slot 30x30"]
    bar_cad_y = 88

    for spec_name in target_specs:
        bars = nested_metal.get(spec_name, [])
        if not bars:
            continue

        p_met1.insert_text(fitz.Point(36, bar_cad_y + 12), f"🔩 {spec_name.upper()} — {len(bars)} BARRAS DE 6 METROS NECESSÁRIAS", fontname="hebo", fontsize=9, color=C_PRIMARY_DARK)
        bar_cad_y += 18

        # Desenha cada barra como uma régua técnica de 6000mm
        rule_x0 = 42
        rule_w = 750
        rule_h = 16
        scale_1d = rule_w / 6000.0

        for b_idx, bar in enumerate(bars):
            s_bar = p_met1.new_shape()

            # Fundo da barra inteira (sobra)
            s_bar.draw_rect(fitz.Rect(rule_x0, bar_cad_y, rule_x0 + rule_w, bar_cad_y + rule_h))
            s_bar.finish(fill=C_WASTE, color=C_SLATE_BORDER, width=0.8)

            # Segmentos cortados
            cur_x = rule_x0
            for c_idx, cut in enumerate(bar["cuts"]):
                seg_w = cut["lengthMm"] * scale_1d
                palette = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]

                s_bar.draw_rect(fitz.Rect(cur_x, bar_cad_y, cur_x + seg_w, bar_cad_y + rule_h))
                s_bar.finish(fill=palette["fill"], color=palette["stroke"], width=1)

                # Marca de serra kerf
                s_bar.draw_line(fitz.Point(cur_x + seg_w, bar_cad_y), fitz.Point(cur_x + seg_w, bar_cad_y + rule_h))
                s_bar.finish(color=rgb(239, 68, 68), width=1.5)

                cur_x += seg_w + 3 * scale_1d

            s_bar.commit()

            # Textos dentro dos segmentos e rodapé da barra
            cur_x = rule_x0
            for c_idx, cut in enumerate(bar["cuts"]):
                seg_w = cut["lengthMm"] * scale_1d
                palette = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]

                if seg_w > 28:
                    lbl = cut["label"]
                    if len(lbl) > 16:
                        lbl = lbl[:14] + ".."
                    p_met1.insert_text(fitz.Point(cur_x + 3, bar_cad_y + 8), lbl, fontname="helv", fontsize=5.8, color=C_TEXT_MAIN)
                    p_met1.insert_text(fitz.Point(cur_x + 3, bar_cad_y + 14), f"{cut['lengthMm']}mm", fontname="hebo", fontsize=5.8, color=palette["text"])

                cur_x += seg_w + 3 * scale_1d

            # Estatística da Barra à direita
            stats_str = f"Barra #{b_idx+1}: {bar['efficiency_pct']:.1f}% útil ({bar['used_mm']} mm) | Sobra: {bar['waste_mm']} mm"
            p_met1.insert_text(fitz.Point(rule_x0, bar_cad_y + rule_h + 8), stats_str, fontname="hebo", fontsize=6.8, color=C_TEXT_MUTED)

            bar_cad_y += rule_h + 14

        bar_cad_y += 8

    current_page += 1

    # Página 2 de Serralheria: Trilhos Telescópicos, Sapatas e Relatório de Solda
    p_met2 = doc.new_page(width=842, height=595)
    draw_header_footer(p_met2, current_page, total_pages, "SERRALHERIA ESTRUTURAL — TRILHOS, SAPATAS & SOLDAGEM", "Trilhos Heavy Duty, Sapatas de Ancoragem e Nós Estruturais Soldados")

    # Tabela com as demais barras e componentes metálicos
    m2_y = 56
    s_m2 = p_met2.new_shape()
    s_m2.draw_rect(fitz.Rect(36, m2_y, 806, m2_y + 20))
    s_m2.finish(fill=C_PRIMARY_DARK, width=0)
    s_m2.commit()

    p_met2.insert_text(fitz.Point(42, m2_y + 14), "#", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(65, m2_y + 14), "Especificação do Perfil / Ferragem", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(260, m2_y + 14), "Peças", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(340, m2_y + 14), "Metragem Total", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(440, m2_y + 14), "Barras 6m", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(520, m2_y + 14), "Barras 3m", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_met2.insert_text(fitz.Point(620, m2_y + 14), "Aplicação Estrutural", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)

    row_my = m2_y + 22
    for idx, psum in enumerate(data["metal"]["profileSummaries"]):
        s_rm = p_met2.new_shape()
        s_rm.draw_rect(fitz.Rect(36, row_my, 806, row_my + 18))
        s_rm.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
        s_rm.commit()

        p_met2.insert_text(fitz.Point(42, row_my + 12), f"#{idx+1}", fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_met2.insert_text(fitz.Point(65, row_my + 12), psum["profileSpec"], fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_met2.insert_text(fitz.Point(260, row_my + 12), f"{psum['pieces']} un", fontname="hebo", fontsize=7, color=C_AMBER)
        p_met2.insert_text(fitz.Point(340, row_my + 12), f"{psum['totalMeters']:.2f} m", fontname="helv", fontsize=7, color=C_TEXT_MAIN)
        p_met2.insert_text(fitz.Point(440, row_my + 12), f"{psum['bars6m']} barras", fontname="hebo", fontsize=7, color=C_PRIMARY_DARK)
        p_met2.insert_text(fitz.Point(520, row_my + 12), f"{psum['bars3m']} barras", fontname="helv", fontsize=7, color=C_TEXT_MUTED)

        app_txt = "Subchassi & Rack Base" if "40x40" in psum["profileSpec"] else ("Bandejas Solares Retráteis" if "30x30" in psum["profileSpec"] else "Gavetões & Extensão")
        p_met2.insert_text(fitz.Point(620, row_my + 12), app_txt, fontname="helv", fontsize=7, color=C_TEXT_MAIN)

        row_my += 18

    # Relatório de Juntas e Soldagem das Quinas (Nós Estruturais)
    wj_y = row_my + 16
    s_wj = p_met2.new_shape()
    s_wj.draw_rect(fitz.Rect(36, wj_y, 806, wj_y + 160))
    s_wj.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=1)
    s_wj.draw_rect(fitz.Rect(36, wj_y, 806, wj_y + 26))
    s_wj.finish(fill=rgb(241, 245, 249), color=C_SLATE_BORDER, width=1)
    s_wj.commit()

    p_met2.insert_text(fitz.Point(46, wj_y + 17), "🔥 RELATÓRIO DE JUNTAS ESTRUTURAIS & CORDÕES DE SOLDA", fontname="hebo", fontsize=9, color=C_TEXT_MAIN)

    wj_data = data["metal"]["weldedJoints"]
    p_met2.insert_text(fitz.Point(46, wj_y + 44), f"• Total de Nós Estruturais Soldados (Quinas): {wj_data.get('totalJoints', 58)} junções estruturais", fontname="hebo", fontsize=8.5, color=C_PRIMARY_DARK)
    p_met2.insert_text(fitz.Point(46, wj_y + 62), f"• Quinas em Meia-Esquadria (45°): {wj_data.get('miterCorners45', 16)}  |  Junções em 'T' (90°): {wj_data.get('teeJoints', 24)}  |  Suportes: {wj_data.get('mountBracketsJoints', 18)}", fontname="helv", fontsize=8.5, color=C_TEXT_MAIN)
    cons = wj_data.get('consumables', {})
    p_met2.insert_text(fitz.Point(46, wj_y + 80), f"• Consumíveis Estimados: {cons.get('cuttingDiscs4Half', 4)} Discos de Corte 4.5\"  •  {cons.get('flapDiscsGrinding', 3)} Discos Flap Desbaste  •  {cons.get('migWireKg', 1.5):.1f} kg Arame MIG", fontname="helv", fontsize=8.5, color=C_TEXT_MAIN)
    p_met2.insert_text(fitz.Point(46, wj_y + 98), "• Processo de Solda Recomendado: MIG/MAG com arame sólido 0.8mm ou TIG com vareta de alumínio 4043", fontname="helv", fontsize=8, color=C_TEXT_MUTED)
    p_met2.insert_text(fitz.Point(46, wj_y + 114), "• Tratamento Anticorrosivo: Fosfatização e pintura eletrostática a pó epóxi preto fosco (espessura 80 µm)", fontname="helv", fontsize=8, color=C_TEXT_MUTED)
    p_met2.insert_text(fitz.Point(46, wj_y + 130), "• Travamento Mecânico na Doblò: Parafusos sextavados M8 em Aço Inox 304 com porcas auto-travantes (Nyloc)", fontname="helv", fontsize=8, color=C_TEXT_MUTED)

    current_page += 1

    # =========================================================================
    # PÁGINA: HIDRÁULICA PVC — RESERVATÓRIO EM U NO TETO
    # =========================================================================
    p_pvc = doc.new_page(width=842, height=595)
    draw_header_footer(p_pvc, current_page, total_pages, "INSTALAÇÃO HIDRÁULICA — RESERVATÓRIO EM 'U' NO TETO", "Tubos e Conexões Soldáveis PVC Ø100mm (Capacidade: ~35 Litros)")

    # Cards de Resumo Hidráulico
    pvc_y = 56
    pvc_info = data["pvc"]
    draw_card(p_pvc, fitz.Rect(36, pvc_y, 220, pvc_y + 56), "CAPACIDADE DO RESERVATÓRIO", f"{pvc_info['totalCapacityL']} Litros", "Geometria em U sobre o teto", border_color=rgb(14, 165, 233), bg_color=rgb(240, 249, 255))
    draw_card(p_pvc, fitz.Rect(230, pvc_y, 414, pvc_y + 56), "TUBULAÇÃO PRINCIPAL", f"PVC Ø {pvc_info['diameterMm']} mm", f"{pvc_info['totalPieces']} Tubos • {pvc_info['totalLinearMeters']:.2f}m", border_color=C_PRIMARY, bg_color=rgb(224, 242, 254))
    draw_card(p_pvc, fitz.Rect(424, pvc_y, 608, pvc_y + 56), "BARRA RECOMENDADA", f"1 Barra de {pvc_info['recommendedBarOption']}", "Aproveitamento ótimo > 90%", border_color=C_EMERALD, bg_color=C_EMERALD_LIGHT)
    draw_card(p_pvc, fitz.Rect(618, pvc_y, 806, pvc_y + 56), "CONEXÕES & VÁLVULAS", "2 Joelhos 90° + 2 CAPs", "Dreno, respiro e torneira", border_color=C_AMBER, bg_color=C_AMBER_LIGHT)

    # Desenho Linear de Corte dos Tubos de PVC
    pvc_cad_y = 126
    s_pcad = p_pvc.new_shape()
    s_pcad.draw_rect(fitz.Rect(36, pvc_cad_y, 806, pvc_cad_y + 110))
    s_pcad.finish(fill=rgb(248, 250, 252), color=C_SLATE_BORDER, width=1)
    s_pcad.commit()

    p_pvc.insert_text(fitz.Point(46, pvc_cad_y + 18), "📏 DESENHO DE CORTE LINEAR DA BARRA DE PVC (6.000 mm)", fontname="hebo", fontsize=9, color=C_PRIMARY_DARK)

    # Régua da barra de PVC
    pvc_rx = 46
    pvc_rw = 740
    pvc_rh = 22
    pvc_scale = pvc_rw / 6000.0

    s_pbar = p_pvc.new_shape()
    s_pbar.draw_rect(fitz.Rect(pvc_rx, pvc_cad_y + 30, pvc_rx + pvc_rw, pvc_cad_y + 30 + pvc_rh))
    s_pbar.finish(fill=C_WASTE, color=C_SLATE_BORDER, width=0.8)

    cur_px = pvc_rx
    for c_idx, item in enumerate(pvc_info["cutItems"]):
        for _ in range(item["qty"]):
            sw = item["lengthMm"] * pvc_scale
            pal = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]

            s_pbar.draw_rect(fitz.Rect(cur_px, pvc_cad_y + 30, cur_px + sw, pvc_cad_y + 30 + pvc_rh))
            s_pbar.finish(fill=pal["fill"], color=pal["stroke"], width=1)

            s_pbar.draw_line(fitz.Point(cur_px + sw, pvc_cad_y + 30), fitz.Point(cur_px + sw, pvc_cad_y + 30 + pvc_rh))
            s_pbar.finish(color=rgb(239, 68, 68), width=1.5)

            cur_px += sw + 3 * pvc_scale

    s_pbar.commit()

    # Rótulos dos tubos cortados
    cur_px = pvc_rx
    for c_idx, item in enumerate(pvc_info["cutItems"]):
        for _ in range(item["qty"]):
            sw = item["lengthMm"] * pvc_scale
            pal = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]

            p_pvc.insert_text(fitz.Point(cur_px + 4, pvc_cad_y + 42), item["label"], fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
            p_pvc.insert_text(fitz.Point(cur_px + 4, pvc_cad_y + 50), f"{item['lengthMm']} mm", fontname="helv", fontsize=6.5, color=pal["text"])

            cur_px += sw + 3 * pvc_scale

    # Texto de aproveitamento da barra de PVC
    p_pvc.insert_text(fitz.Point(pvc_rx, pvc_cad_y + 68), f"• Tubos Cortados: {pvc_info['totalLinearMeters']:.2f} m  |  Sobra da Barra: {6.0 - pvc_info['totalLinearMeters']:.2f} m (Retalho aproveitável)", fontname="hebo", fontsize=7.5, color=C_TEXT_MUTED)

    # Tabela de Tubos e Conexões Hidráulicas
    p_tbl_y = 250
    s_ptbl = p_pvc.new_shape()
    s_ptbl.draw_rect(fitz.Rect(36, p_tbl_y, 806, p_tbl_y + 20))
    s_ptbl.finish(fill=C_PRIMARY_DARK, width=0)
    s_ptbl.commit()

    p_pvc.insert_text(fitz.Point(42, p_tbl_y + 14), "#", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_pvc.insert_text(fitz.Point(65, p_tbl_y + 14), "Item / Conexão", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_pvc.insert_text(fitz.Point(260, p_tbl_y + 14), "Especificação Técnica", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_pvc.insert_text(fitz.Point(450, p_tbl_y + 14), "Comprimento / Bitola", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_pvc.insert_text(fitz.Point(590, p_tbl_y + 14), "Quantidade", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)
    p_pvc.insert_text(fitz.Point(670, p_tbl_y + 14), "Notas de Instalação", fontname="hebo", fontsize=7.5, color=C_BG_PAGE)

    r_py = p_tbl_y + 22
    # Tubos
    for idx, item in enumerate(pvc_info["cutItems"]):
        s_r = p_pvc.new_shape()
        s_r.draw_rect(fitz.Rect(36, r_py, 806, r_py + 18))
        s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
        s_r.commit()

        p_pvc.insert_text(fitz.Point(42, r_py + 12), f"T{idx+1}", fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_pvc.insert_text(fitz.Point(65, r_py + 12), item["label"], fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_pvc.insert_text(fitz.Point(260, r_py + 12), item["spec"], fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_pvc.insert_text(fitz.Point(450, r_py + 12), f"{item['lengthMm']} mm", fontname="hebo", fontsize=7, color=C_PRIMARY_DARK)
        p_pvc.insert_text(fitz.Point(590, r_py + 12), f"{item['qty']} un", fontname="hebo", fontsize=7, color=C_AMBER)
        p_pvc.insert_text(fitz.Point(670, r_py + 12), item["notes"], fontname="helv", fontsize=6.8, color=C_TEXT_MAIN)
        r_py += 18

    # Conexões
    for idx, fit_item in enumerate(pvc_info["fittings"]):
        s_r = p_pvc.new_shape()
        s_r.draw_rect(fitz.Rect(36, r_py, 806, r_py + 18))
        s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
        s_r.commit()

        p_pvc.insert_text(fitz.Point(42, r_py + 12), f"C{idx+1}", fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_pvc.insert_text(fitz.Point(65, r_py + 12), fit_item["label"], fontname="hebo", fontsize=7, color=C_TEXT_MAIN)
        p_pvc.insert_text(fitz.Point(260, r_py + 12), fit_item["spec"], fontname="helv", fontsize=7, color=C_TEXT_MUTED)
        p_pvc.insert_text(fitz.Point(450, r_py + 12), f"Ø {pvc_info['diameterMm']} mm", fontname="helv", fontsize=7, color=C_TEXT_MAIN)
        p_pvc.insert_text(fitz.Point(590, r_py + 12), f"{fit_item['qty']} {fit_item['unit']}", fontname="hebo", fontsize=7, color=C_AMBER)
        p_pvc.insert_text(fitz.Point(670, r_py + 12), fit_item["notes"], fontname="helv", fontsize=6.8, color=C_TEXT_MAIN)
        r_py += 18

    # Recomendações Hidráulicas
    p_pvc.insert_text(fitz.Point(36, 545), "💧 RECOMENDAÇÃO DE MONTAGEM: Lixar as pontas dos tubos e limpar com Solução Limpadora antes de aplicar o Adesivo Plástico PVC.", fontname="hebo", fontsize=7.5, color=C_PRIMARY_DARK)
    p_pvc.insert_text(fitz.Point(36, 557), "Instalar respiro superior c/ tela anti-inseto e válvula de retenção na saída inferior para garantir vazão uniforme sem vácuo.", fontname="helv", fontsize=7, color=C_TEXT_MUTED)

    current_page += 1

    # =========================================================================
    # PÁGINA: TOLDO RETRÁTIL OVERLAND — FERRAGENS & PLANO DE CORTE LINEAR
    # =========================================================================
    if has_awning:
        p_awn = doc.new_page(width=842, height=595)
        awn_info = data["awning"]
        draw_header_footer(p_awn, current_page, total_pages, f"TOLDO RETRÁTIL OVERLAND — {awn_info['typeLabel'].upper()}", f"Ferragens e Plano de Corte Linear dos Perfis de Alumínio  •  {awn_info['sideLabel']}")

        # 4 Cards de Resumo do Toldo
        awn_y = 56
        draw_card(p_awn, fitz.Rect(36, awn_y, 220, awn_y + 56), "MODELO & FIXAÇÃO", (awn_info["typeLabel"].split(" ")[0] + " 270°") if "270" in awn_info["typeLabel"] else "Toldo Traseiro", awn_info["sideLabel"], border_color=C_AMBER, bg_color=C_AMBER_LIGHT)
        draw_card(p_awn, fitz.Rect(230, awn_y, 414, awn_y + 56), "PERFIS DE ALUMÍNIO", f"{awn_info['totalProfilePieces']} Cortes", f"{awn_info['totalLinearMeters']:.2f} m lineares  •  {awn_info['profilesWeightKg']} kg", border_color=C_PRIMARY, bg_color=rgb(224, 242, 254))
        draw_card(p_awn, fitz.Rect(424, awn_y, 608, awn_y + 56), "BARRAS COMERCIAIS", f"{len(awn_info['plan6m'])} Barras de 6m", f"Recomendado: Barras de {awn_info['recommendedBarOption']}", border_color=C_EMERALD, bg_color=C_EMERALD_LIGHT)
        draw_card(p_awn, fitz.Rect(618, awn_y, 806, awn_y + 56), "PESO TOTAL CONJUNTO", f"{awn_info['totalAwningWeightKg']} kg Total", f"Perfis: {awn_info['profilesWeightKg']}kg | Ferragens: {awn_info['fittingsWeightKg']}kg", border_color=rgb(168, 85, 247), bg_color=rgb(250, 245, 255))

        # Desenho Linear de Corte das Barras de Alumínio
        awn_cad_y = 124
        s_acad = p_awn.new_shape()
        s_acad.draw_rect(fitz.Rect(36, awn_cad_y, 806, awn_cad_y + 114))
        s_acad.finish(fill=rgb(248, 250, 252), color=C_SLATE_BORDER, width=1)
        s_acad.commit()

        p_awn.insert_text(fitz.Point(46, awn_cad_y + 16), "📏 DESENHO DE CORTE LINEAR DAS BARRAS DE ALUMÍNIO (BARRAS COMERCIAIS DE 6.000 mm)", fontname="hebo", fontsize=8.5, color=C_PRIMARY_DARK)

        # Réguas das barras de alumínio do toldo
        bar_y_offset = awn_cad_y + 24
        scale_awn = 740 / 6000.0
        for b_idx, bar in enumerate(awn_info["plan6m"]):
            s_abar = p_awn.new_shape()
            rx0 = 46
            rw = 740
            rh = 14
            s_abar.draw_rect(fitz.Rect(rx0, bar_y_offset, rx0 + rw, bar_y_offset + rh))
            s_abar.finish(fill=C_WASTE, color=C_SLATE_BORDER, width=0.8)

            cx = rx0
            for c_idx, seg in enumerate(bar["segments"]):
                if seg.get("isWaste"):
                    continue
                seg_w = seg["lengthMm"] * scale_awn
                pal = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]
                s_abar.draw_rect(fitz.Rect(cx, bar_y_offset, cx + seg_w, bar_y_offset + rh))
                s_abar.finish(fill=pal["fill"], color=pal["stroke"], width=0.8)
                s_abar.draw_line(fitz.Point(cx + seg_w, bar_y_offset), fitz.Point(cx + seg_w, bar_y_offset + rh))
                s_abar.finish(color=rgb(239, 68, 68), width=1.2)
                cx += seg_w + 3 * scale_awn
            s_abar.commit()

            # Textos dos segmentos
            cx = rx0
            for c_idx, seg in enumerate(bar["segments"]):
                if seg.get("isWaste"):
                    continue
                seg_w = seg["lengthMm"] * scale_awn
                pal = PIECE_PALETTES[c_idx % len(PIECE_PALETTES)]
                if seg_w > 26:
                    lbl = seg["label"]
                    if len(lbl) > 16:
                        lbl = lbl[:14] + ".."
                    p_awn.insert_text(fitz.Point(cx + 3, bar_y_offset + 7), lbl, fontname="helv", fontsize=5.5, color=C_TEXT_MAIN)
                    p_awn.insert_text(fitz.Point(cx + 3, bar_y_offset + 12), f"{seg['lengthMm']}mm", fontname="hebo", fontsize=5.5, color=pal["text"])
                cx += seg_w + 3 * scale_awn

            p_awn.insert_text(fitz.Point(rx0 + rw + 4, bar_y_offset + 10), f"B#{b_idx+1}: {bar['efficiencyPct']:.0f}%", fontname="hebo", fontsize=6.5, color=C_PRIMARY_DARK)
            bar_y_offset += 20

        # Tabelas: Perfis Cortados (à esquerda) e Ferragens/Mancais (à direita)
        tbl_y = awn_cad_y + 122
        # Header Perfis
        s_th1 = p_awn.new_shape()
        s_th1.draw_rect(fitz.Rect(36, tbl_y, 440, tbl_y + 20))
        s_th1.finish(fill=C_PRIMARY_DARK, width=0)
        s_th1.commit()
        p_awn.insert_text(fitz.Point(42, tbl_y + 13), "Peça / Perfil de Alumínio", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)
        p_awn.insert_text(fitz.Point(230, tbl_y + 13), "Perfil Comercial", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)
        p_awn.insert_text(fitz.Point(340, tbl_y + 13), "Compr.", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)
        p_awn.insert_text(fitz.Point(395, tbl_y + 13), "Qtd", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)

        ry1 = tbl_y + 20
        for idx, p_item in enumerate(awn_info["profileItems"]):
            s_r = p_awn.new_shape()
            s_r.draw_rect(fitz.Rect(36, ry1, 440, ry1 + 17))
            s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
            s_r.commit()
            p_awn.insert_text(fitz.Point(42, ry1 + 11), p_item["label"][:26], fontname="hebo", fontsize=6.5, color=C_TEXT_MAIN)
            p_awn.insert_text(fitz.Point(230, ry1 + 11), p_item["spec"][:20], fontname="helv", fontsize=6.2, color=C_TEXT_MUTED)
            p_awn.insert_text(fitz.Point(340, ry1 + 11), f"{p_item['lengthMm']}mm", fontname="hebo", fontsize=6.5, color=C_PRIMARY_DARK)
            p_awn.insert_text(fitz.Point(400, ry1 + 11), f"{p_item['qty']} un", fontname="hebo", fontsize=6.5, color=C_AMBER)
            ry1 += 17

        # Header Ferragens / Mancais / Parafusos
        s_th2 = p_awn.new_shape()
        s_th2.draw_rect(fitz.Rect(448, tbl_y, 806, tbl_y + 20))
        s_th2.finish(fill=rgb(109, 40, 217), width=0)
        s_th2.commit()
        p_awn.insert_text(fitz.Point(454, tbl_y + 13), "Ferragens, Mancais & Parafusos", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)
        p_awn.insert_text(fitz.Point(670, tbl_y + 13), "Material", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)
        p_awn.insert_text(fitz.Point(760, tbl_y + 13), "Qtd", fontname="hebo", fontsize=7.2, color=C_BG_PAGE)

        ry2 = tbl_y + 20
        for idx, fit_item in enumerate(awn_info["fittings"]):
            s_r = p_awn.new_shape()
            s_r.draw_rect(fitz.Rect(448, ry2, 806, ry2 + 17))
            s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
            s_r.commit()
            p_awn.insert_text(fitz.Point(454, ry2 + 11), fit_item["label"][:32], fontname="hebo", fontsize=6.5, color=C_TEXT_MAIN)
            p_awn.insert_text(fitz.Point(670, ry2 + 11), fit_item["material"][:16], fontname="helv", fontsize=6.2, color=C_TEXT_MUTED)
            p_awn.insert_text(fitz.Point(765, ry2 + 11), f"{fit_item['qty']} {fit_item['unit']}", fontname="hebo", fontsize=6.5, color=C_AMBER)
            ry2 += 17

        # Nota Técnica Rodapé
        p_awn.insert_text(fitz.Point(36, 550), "⛺ RECOMENDAÇÃO OVERLAND: Utilizar lubrificante seco de Teflon (PTFE) nas buchas do pivô central 270°. Em acampamentos com ventos superiores a 35 km/h,", fontname="hebo", fontsize=7.2, color=C_PRIMARY_DARK)
        p_awn.insert_text(fitz.Point(36, 560), "ancorar obrigatoriamente os 3 postes verticais com estacas e cordas guias (guy lines) a 45° para evitar esforço de torção no rack da van.", fontname="helv", fontsize=6.8, color=C_TEXT_MUTED)

        current_page += 1

    # =========================================================================
    # PÁGINA: GUIA TÉCNICO DE OFICINA & ORDEM DOS CORTES
    # =========================================================================
    p_guide = doc.new_page(width=842, height=595)
    draw_header_footer(p_guide, current_page, total_pages, "GUIA DE OFICINA — SEQUÊNCIA DE CORTE, REFILO & MONTAGEM", "Recomendações Práticas para Marceneiros, Serralheiros e Construtores")

    steps = [
        ("PASSO 1: ESQUADREJAMENTO & REFILO DAS CHAPAS",
         "Antes de efetuar qualquer corte interno, execute o refilo de 10 mm em todo o perímetro da chapa de compensado naval de 2440 × 1220 mm. Isso elimina avarias de transporte, amassados e imperfeições de borda, garantindo que os ângulos de 90° estejam perfeitamente calibrados."),

        ("PASSO 2: EXECUÇÃO DOS CORTES GUILHOTINA PRIMÁRIOS",
         "Seguindo o diagrama de corte de cada folha, execute primeiro os cortes longitudinais de ponta a ponta (cortes guilhotina primários). Eles dividem a chapa em faixas principais. Jamais tente cortar peças isoladas no meio da chapa sem respeitar a linha de passagem da serra."),

        ("PASSO 3: CORTES SECUNDÁRIOS & SEPARAÇÃO INDIVIDUAL",
         "Com as faixas primárias cortadas, use o batente paralelo da esquadrejadeira regulado na cota exata da peça para fazer os cortes secundários. Sempre corte as peças maiores primeiro e guarde as sobras/retalhos devidamente identificados para peças menores posteriores."),

        ("PASSO 4: FURAÇÕES PASSANTES CNC & ALÍVIO DE PESO",
         "Para os tampos do estrado da cama que possuem furação passante de alívio e ventilação: utilize uma Broca Forstner Ø 40 mm em furadeira de bancada ou centro de usinagem CNC com espaçamento de 85 mm. Isso previne o acúmulo de umidade sob o colchão de espuma D33."),

        ("PASSO 5: RECORTE ESPECIAL DO ARMÁRIO AÉREO NA ESPUMA",
         "O corte em degrau do bloco de espuma D33 deve ser realizado após cortar o bloco nas medidas retangulares totais (1200 × 600 mm). Trace o encaixe com caneta marcadora e use a faca elétrica bem apoiada sobre guia de alumínio com ângulo rigorosamente vertical (90°)."),

        ("PASSO 6: TRATAMENTO DAS BORDAS & IMPERMEABILIZAÇÃO",
         "Aplique fita de borda PVC 1,0 mm nas faces expostas dos módulos com cola PUR à prova d'água. Em seguida, aplique 1 demão de selador náutico e 2 demãos de verniz PU marítimo fosco/acetinado em todas as faces de compensado para imunização contra umidade e condensação veicular.")
    ]

    gy = 60
    for s_title, s_desc in steps:
        s_step = p_guide.new_shape()
        s_step.draw_rect(fitz.Rect(36, gy, 806, gy + 70))
        s_step.finish(fill=C_SLATE_BG, color=C_SLATE_BORDER, width=0.8)

        # Barra lateral colorida
        s_step.draw_rect(fitz.Rect(36, gy, 42, gy + 70))
        s_step.finish(fill=C_PRIMARY, width=0)
        s_step.commit()

        p_guide.insert_text(fitz.Point(52, gy + 18), s_title, fontname="hebo", fontsize=9, color=C_PRIMARY_DARK)
        
        # Quebra de texto do parágrafo
        words = s_desc.split(" ")
        lines = []
        cur_line = []
        for w in words:
            if len(" ".join(cur_line + [w])) > 120:
                lines.append(" ".join(cur_line))
                cur_line = [w]
            else:
                cur_line.append(w)
        if cur_line:
            lines.append(" ".join(cur_line))

        ly = gy + 32
        for l in lines:
            p_guide.insert_text(fitz.Point(52, ly), l, fontname="helv", fontsize=7.5, color=C_TEXT_MAIN)
            ly += 12

        gy += 76

    # Salva o PDF final
    doc.save(output_pdf)
    doc.close()
    print(f"Sucesso! PDF gerado em: {os.path.abspath(output_pdf)}")

if __name__ == "__main__":
    generate_cutting_plan_pdf()
