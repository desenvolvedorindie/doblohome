const fs = require('fs');
const path = require('path');

const pyPath = path.resolve('tmp/scripts/generate_cutting_pdf.py');
let code = fs.readFileSync(pyPath, 'utf8').replace(/\r\n/g, '\n');

const oldDrawText = `                # Apenas desenha textos se houver espaço suficiente no retângulo
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
                        p_sheet.insert_text(fitz.Point(px + 4, py + ph / 2 + 18), "Vazado CNC", fontname="helv", fontsize=5.5, color=C_EMERALD)`;

const newDrawText = `                # Apenas desenha textos se houver espaço suficiente no retângulo
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
                elif pw >= 20 and ph >= 8:
                    # Peça estreita horizontal (ex: sarrafos, pés ou ripas na horizontal)
                    lbl = piece["label"]
                    if len(lbl) > 22:
                        lbl = lbl[:20] + ".."
                    dim_str = f"{piece['w']}×{piece['h']}"
                    f_size = min(6.5, max(4.8, ph * 0.45))
                    p_sheet.insert_text(fitz.Point(px + 2, py + ph / 2 + 1.8), f"{lbl} ({dim_str})", fontname="hebo", fontsize=f_size, color=C_TEXT_MAIN)
                elif pw >= 8 and ph >= 25:
                    # Peça estreita vertical (ex: ripas ou pés na vertical)
                    dim_str = f"{piece['w']}×{piece['h']}"
                    f_size = min(6.0, max(4.5, pw * 0.44))
                    short_lbl = piece["label"]
                    if "Ripa" in short_lbl:
                        short_lbl = "Ripa " + ("Fixa" if "Fixa" in short_lbl else "Móvel")
                    elif "Pé" in short_lbl or "Pe" in short_lbl:
                        short_lbl = "Pé Apoio"
                    elif len(short_lbl) > 12:
                        short_lbl = short_lbl[:10] + ".."
                    p_sheet.insert_text(fitz.Point(px + 1.2, py + ph / 2 - 2), short_lbl, fontname="hebo", fontsize=f_size, color=C_TEXT_MAIN)
                    p_sheet.insert_text(fitz.Point(px + 1.2, py + ph / 2 + 5), dim_str, fontname="hebo", fontsize=f_size - 0.5, color=palette["text"])`;

if (!code.includes(oldDrawText)) {
  console.error('Could not find oldDrawText in generate_cutting_pdf.py');
  process.exit(1);
}
code = code.replace(oldDrawText, newDrawText);

const oldTableLoop = `            r_y = mt_y + 20
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
                r_y += 15`;

const newTableLoop = `            # Agrupa peças idênticas desta folha para que ripas (12x) e pés (2x) apareçam consolidados na mini tabela
            sheet_groups = []
            grouped_seen = {}
            for p in sheet["placedPieces"]:
                g_key = f"{p['label']}__{p['w']}x{p['h']}"
                if g_key in grouped_seen:
                    grouped_seen[g_key]["qty"] += 1
                else:
                    item = dict(p)
                    item["qty"] = 1
                    grouped_seen[g_key] = item
                    sheet_groups.append(item)

            r_y = mt_y + 20
            for idx, p in enumerate(sheet_groups[:7]): # exibe até 7 grupos consolidados
                s_r = p_sheet.new_shape()
                s_r.draw_rect(fitz.Rect(36, r_y, 806, r_y + 14))
                s_r.finish(fill=C_BG_PAGE if idx % 2 == 0 else C_SLATE_BG, color=C_SLATE_BORDER, width=0.4)
                s_r.commit()

                qty_str = f"{p['qty']} un" if p['qty'] > 1 else f"#{idx+1}"
                p_sheet.insert_text(fitz.Point(42, r_y + 10), qty_str, fontname="hebo" if p['qty'] > 1 else "helv", fontsize=6.8, color=C_AMBER if p['qty'] > 1 else C_TEXT_MUTED)
                p_sheet.insert_text(fitz.Point(65, r_y + 10), p["label"][:36], fontname="hebo", fontsize=6.8, color=C_TEXT_MAIN)
                p_sheet.insert_text(fitz.Point(260, r_y + 10), f"X={p['x']} mm, Y={p['y']} mm" if p['qty'] == 1 else f"Diversas ({p['qty']} posições)", fontname="helv", fontsize=6.8, color=C_TEXT_MUTED)
                p_sheet.insert_text(fitz.Point(360, r_y + 10), f"{p['w']} × {p['h']} mm", fontname="hebo", fontsize=6.8, color=C_PRIMARY_DARK)
                p_sheet.insert_text(fitz.Point(490, r_y + 10), f"{(p['w'] * p['h'] * p['qty'] / 1_000_000):.3f} m²", fontname="helv", fontsize=6.8, color=C_TEXT_MAIN)
                p_sheet.insert_text(fitz.Point(580, r_y + 10), "90° (Rotacionada)" if p.get("rotated") else "0° (Padrão)", fontname="helv", fontsize=6.8, color=C_AMBER if p.get("rotated") else C_TEXT_MUTED)

                cnc_txt = "Furos CNC Ø40" if p.get("isPerforated") else ("Recorte Especial" if p.get("hasCabinetCutout") else "Corte Reto")
                p_sheet.insert_text(fitz.Point(660, r_y + 10), cnc_txt, fontname="helv", fontsize=6.8, color=C_EMERALD if p.get("isPerforated") else C_TEXT_MUTED)
                r_y += 14`;

if (!code.includes(oldTableLoop)) {
  console.error('Could not find oldTableLoop in generate_cutting_pdf.py');
  process.exit(1);
}
code = code.replace(oldTableLoop, newTableLoop);

fs.writeFileSync(pyPath, code, 'utf8');
console.log('generate_cutting_pdf.py updated successfully');
