<?php

namespace app\components;

use TCPDF;

/**
 * Serviço de Geração Profissional do Plano de Corte e Desenhos Técnicos em PDF.
 * Desenvolvido em PHP com TCPDF para o projeto Fiat Doblò Campervan & Sistema Solar 3D.
 */
class CuttingPlanPdfService
{
    // Cores Principais (RGB 0-255)
    private array $cBgPage = [255, 255, 255];
    private array $cTextMain = [15, 23, 42];     // Slate 900
    private array $cTextMuted = [100, 116, 139]; // Slate 500
    private array $cPrimary = [2, 132, 199];     // Sky 600
    private array $cPrimaryDark = [3, 105, 161]; // Sky 700
    private array $cAmber = [217, 119, 6];       // Amber 600
    private array $cAmberLight = [254, 243, 199];// Amber 100
    private array $cEmerald = [5, 150, 105];     // Emerald 600
    private array $cEmeraldLight = [209, 250, 229];// Emerald 100
    private array $cSlateBorder = [203, 213, 225];// Slate 300
    private array $cSlateBg = [248, 250, 252];   // Slate 50
    private array $cSheetBg = [241, 245, 249];   // Slate 100
    private array $cSheetBorder = [51, 65, 85];  // Slate 700
    private array $cRefilo = [234, 88, 12];      // Orange 600
    private array $cWaste = [226, 232, 240];     // Slate 200

    private array $piecePalettes = [
        ['fill' => [224, 242, 254], 'stroke' => [2, 132, 199],  'text' => [3, 105, 161]],  // Sky
        ['fill' => [209, 250, 229], 'stroke' => [5, 150, 105],  'text' => [4, 120, 87]],   // Emerald
        ['fill' => [254, 243, 199], 'stroke' => [217, 119, 6],  'text' => [180, 83, 9]],   // Amber
        ['fill' => [237, 233, 254], 'stroke' => [124, 58, 237], 'text' => [109, 40, 217]], // Violet
        ['fill' => [254, 226, 226], 'stroke' => [225, 29, 72],  'text' => [190, 18, 60]],  // Rose
        ['fill' => [207, 250, 254], 'stroke' => [8, 145, 178],  'text' => [14, 116, 144]], // Cyan
        ['fill' => [254, 249, 195], 'stroke' => [202, 138, 4],  'text' => [161, 98, 7]],   // Yellow
        ['fill' => [241, 245, 249], 'stroke' => [71, 85, 105],  'text' => [51, 65, 85]],   // Slate
    ];

    /**
     * Gera o documento técnico completo em PDF a partir dos dados estruturados.
     *
     * @param array $data Dados consolidados do corte (JSON deserializado)
     * @param string|null $outputPath Caminho para salvar o arquivo (opcional)
     * @return string Conteúdo binário do PDF gerado
     */
    public function generate(array $data, ?string $outputPath = null): string
    {
        $pdf = new TCPDF('L', 'pt', [842, 595], true, 'UTF-8', false);
        $pdf->SetCreator('Fiat Doblò Campervan CAD/CAM');
        $pdf->SetAuthor('Sistema Doblo Solar');
        $pdf->SetTitle('Plano de Corte Executivo & Desenho Técnico dos Cortes');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false, 0);

        // Contagem de páginas
        $woodSheetsCount = 0;
        if (!empty($data['wood']['cuttingPlans'])) {
            foreach ($data['wood']['cuttingPlans'] as $cp) {
                $woodSheetsCount += count($cp['sheets'] ?? []);
            }
        }
        $hasAwning = !empty($data['awning']['enabled']);
        // P1: Capa & Resumo
        // P2: BOM Marcenaria
        // P3..(2+N): Chapas de Madeira
        // P(3+N): Estofaria D33
        // P(4+N): Serralheria 1D Perfis
        // P(5+N): Serralheria Juntas/Soldas
        // P(6+N): Hidráulica PVC
        // P(7+N se awning): Toldo Retrátil
        // Última: Guia de Oficina
        $totalPages = 2 + $woodSheetsCount + 1 + 2 + 1 + ($hasAwning ? 1 : 0) + 1;

        $pageNum = 1;

        // PÁGINA 1: Capa Técnica & Resumo Executivo
        $this->renderCoverPage($pdf, $data, $pageNum, $totalPages, $woodSheetsCount);
        $pageNum++;

        // PÁGINA 2: Lista Geral de Peças de Marcenaria (BOM)
        $this->renderWoodBomPage($pdf, $data, $pageNum, $totalPages);
        $pageNum++;

        // PÁGINAS 3+: Chapas de Madeira (Guilhotina 2D)
        $this->renderWoodSheetPages($pdf, $data, $pageNum, $totalPages, $woodSheetsCount);

        // PÁGINA: Estofaria & Tapeçaria (Espuma D33)
        $this->renderUpholsteryPage($pdf, $data, $pageNum, $totalPages);
        $pageNum++;

        // PÁGINAS: Serralheria (Perfis 1D e Juntas/Soldagem)
        $this->renderMetalPages($pdf, $data, $pageNum, $totalPages);

        // PÁGINA: Hidráulica PVC
        $this->renderPvcPage($pdf, $data, $pageNum, $totalPages);
        $pageNum++;

        // PÁGINA: Toldo Retrátil Overland (se habilitado)
        if ($hasAwning) {
            $this->renderAwningPage($pdf, $data, $pageNum, $totalPages);
            $pageNum++;
        }

        // PÁGINA: Guia Técnico de Oficina & Ordem dos Cortes
        $this->renderWorkshopGuidePage($pdf, $data, $pageNum, $totalPages);

        if ($outputPath) {
            $pdf->Output($outputPath, 'F');
            return file_get_contents($outputPath);
        }

        return $pdf->Output('', 'S');
    }

    // =========================================================================
    // ELEMENTOS BÁSICOS & HELPERS DE LAYOUT
    // =========================================================================

    private function drawHeaderFooter(TCPDF $pdf, int $pageNum, int $totalPages, string $title, ?string $subtitle = null): void
    {
        $w = 842.0;
        $h = 595.0;

        // Faixa decorativa superior azul
        $pdf->SetFillColor(...$this->cPrimary);
        $pdf->Rect(0, 0, $w, 4, 'F');

        // Linha separadora do cabeçalho
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetLineWidth(0.8);
        $pdf->Line(36, 46, $w - 36, 46);

        // Linha separadora do rodapé
        $pdf->Line(36, $h - 30, $w - 36, $h - 30);

        // Textos do Cabeçalho
        $pdf->SetFont('dejavusans', 'B', 8);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(36, 16, 'FIAT DOBLÒ CAMPERVAN • SISTEMA SOLAR 3D');

        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(36, 28, $title);

        if ($subtitle) {
            $pdf->SetFont('dejavusans', '', 8.5);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(280, 29, '|  ' . $subtitle);
        }

        // Textos do Rodapé
        $footerLeft = 'Projeto Executivo de Marcenaria, Serralheria & Hidráulica • Tolerância: ±1mm (Madeira/Metal), ±5mm (Espuma) • Kerf: 3mm';
        $pdf->SetFont('dejavusans', '', 7.5);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(36, $h - 22, $footerLeft);

        $pdf->SetFont('dejavusans', 'B', 8);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text($w - 110, $h - 22, "Página {$pageNum} de {$totalPages}");
    }

    private function drawCard(
        TCPDF $pdf,
        float $x,
        float $y,
        float $w,
        float $h,
        string $title,
        string $value,
        ?string $subtext = null,
        array $borderCol = [203, 213, 225],
        array $bgCol = [248, 250, 252]
    ): void {
        $pdf->SetDrawColor(...$borderCol);
        $pdf->SetFillColor(...$bgCol);
        $pdf->SetLineWidth(1);
        $pdf->Rect($x, $y, $w, $h, 'DF');

        $pdf->SetFont('dejavusans', 'B', 8);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text($x + 10, $y + 8, $title);

        $pdf->SetFont('dejavusans', 'B', 14);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text($x + 10, $y + 22, $value);

        if ($subtext) {
            $pdf->SetFont('dejavusans', '', 7.2);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text($x + 10, $y + 40, $subtext);
        }
    }

    // =========================================================================
    // PÁGINA 1: CAPA TÉCNICA & RESUMO EXECUTIVO
    // =========================================================================

    private function renderCoverPage(TCPDF $pdf, array $data, int $pageNum, int $totalPages, int $woodSheetsCount): void
    {
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'RESUMO EXECUTIVO & ESPECIFICAÇÕES TÉCNICAS');

        // Banner de Destaque da Capa
        $pdf->SetDrawColor(...$this->cPrimary);
        $pdf->SetFillColor(240, 249, 255);
        $pdf->SetLineWidth(1.2);
        $pdf->Rect(36, 56, 770, 99, 'DF');

        // Faixa lateral azul do banner
        $pdf->SetFillColor(...$this->cPrimary);
        $pdf->Rect(36, 56, 8, 99, 'F');

        $proj = $data['project'] ?? [];
        $pdf->SetFont('dejavusans', 'B', 9.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(58, 68, 'PROJETO EXECUTIVO DE CORTE & FABRICAÇÃO');

        $pdf->SetFont('dejavusans', 'B', 18);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(58, 84, 'Plano de Corte Otimizado & Desenho dos Cortes');

        $pdf->SetFont('dejavusans', 'B', 10.5);
        $pdf->SetTextColor(...$this->cAmber);
        $pdf->Text(58, 108, 'Layout: ' . ($proj['presetName'] ?? 'Personalizado'));

        $vehicle = $proj['vehicle'] ?? 'Fiat Doblò Campervan';
        $date = $proj['date'] ?? date('d/m/Y');
        $pdf->SetFont('dejavusans', '', 8.5);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(58, 126, "Veículo: {$vehicle}  •  Data: {$date}  •  Versão: 2.0 (CAD/CAM Integrado)");

        // 4 Cards de Resumo Executivo
        $cw = (770 - 30) / 4;
        $cy = 166;

        $wood = $data['wood'] ?? [];
        $uph = $data['upholstery'] ?? [];
        $metal = $data['metal'] ?? [];
        $pvc = $data['pvc'] ?? [];

        // Card 1: Marcenaria
        $wPieces = $wood['totalPieces'] ?? 0;
        $wArea = number_format($wood['totalAreaM2'] ?? 0, 2, ',', '.');
        $wSheets = $wood['standardSheets'] ?? 0;
        $this->drawCard($pdf, 36, $cy, $cw, 64, 'MARCENARIA (COMPENSADO)', "{$wPieces} Peças", "{$wArea} m²  •  {$wSheets} Chapas 2440×1220", $this->cAmber, $this->cAmberLight);

        // Card 2: Estofaria
        $uPieces = $uph['totalPieces'] ?? 0;
        $uArea = number_format($uph['totalAreaM2'] ?? 0, 2, ',', '.');
        $uVol = round($uph['totalVolumeLiters'] ?? 0);
        $this->drawCard($pdf, 36 + $cw + 10, $cy, $cw, 64, 'ESTOFARIA (ESPUMA D33)', "{$uPieces} Almofadas", "{$uArea} m²  •  {$uVol} Litros Espuma", $this->cPrimary, [224, 242, 254]);

        // Card 3: Serralheria
        $mPieces = $metal['totalPieces'] ?? 0;
        $mMeters = number_format($metal['totalMeters'] ?? 0, 1, ',', '.');
        $mBars = $metal['totalBars6m'] ?? 0;
        $this->drawCard($pdf, 36 + 2 * $cw + 20, $cy, $cw, 64, 'SERRALHERIA (METAX/T-SLOT)', "{$mPieces} Perfis", "{$mMeters} m lineares  •  {$mBars} Barras 6m", $this->cEmerald, $this->cEmeraldLight);

        // Card 4: Hidráulica
        $pCap = $pvc['totalCapacityL'] ?? 35;
        $pDiam = $pvc['diameterMm'] ?? 100;
        $pPieces = $pvc['totalPieces'] ?? 0;
        $pMeters = number_format($pvc['totalLinearMeters'] ?? 0, 2, ',', '.');
        $this->drawCard($pdf, 36 + 3 * $cw + 30, $cy, $cw, 64, 'HIDRÁULICA (RESERVATÓRIO)', "{$pCap} Litros (U)", "{$pPieces} Tubos Ø{$pDiam}mm  •  {$pMeters} m", [14, 165, 233], [240, 249, 255]);

        // Duas colunas centrais: Parâmetros Técnicos & Índice Geral
        $colW = (770 - 16) / 2;
        $col1X = 36;
        $col2X = 36 + $colW + 16;
        $tblY = 242;

        // Caixa 1: Parâmetros de Oficina e Máquinas
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(...$this->cSlateBg);
        $pdf->SetLineWidth(1);
        $pdf->Rect($col1X, $tblY, $colW, 300, 'DF');

        $pdf->SetFillColor(241, 245, 249);
        $pdf->Rect($col1X, $tblY, $colW, 28, 'DF');

        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text($col1X + 12, $tblY + 8, 'PARÂMETROS TÉCNICOS DE CORTE & OFICINA');

        $params = [
            ['Espessura de Corte da Serra (Kerf Madeira):', '3,0 mm (Disco Trapezoidal / Widea)'],
            ['Refilo Periférico Obrigatório (Margem):', '10,0 mm nas 4 bordas da chapa bruta'],
            ['Chapa Padrão de Compensado Naval:', '2.440 mm × 1.220 mm (Área: 2,977 m²)'],
            ['Chapa Padrão de MDF Branco Ultra:', '2.750 mm × 1.830 mm (Área: 5,032 m²)'],
            ['Bloco Comercial de Espuma D33:', '1.900 mm × 1.400 mm (Densidade 33 Real)'],
            ['Comprimento Comercial das Barras:', '6.000 mm (Perfis Alumínio / Metalon / PVC)'],
            ['Kerf de Corte Metálico / Disco Abrasivo:', '3,0 mm (Serra Policorte / Esquadrejadeira)'],
            ['Furações de Alívio e Ventilação CNC:', 'Broca Forstner Ø 40 mm (Passo 85 mm)'],
            ['Acabamento das Bordas de Madeira:', 'Fita de Borda PVC 1,0 mm c/ cola PUR'],
            ['Impermeabilização da Madeira:', 'Seladora + 2 demãos de Verniz PU Náutico'],
            ['Soldagem da Estrutura Metálica:', 'MIG/MAG ou TIG (Cordão contínuo nas quinas)'],
        ];

        $py = $tblY + 38;
        foreach ($params as [$label, $val]) {
            $pdf->SetFont('dejavusans', 'B', 7.5);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text($col1X + 12, $py, $label);

            $pdf->SetFont('dejavusans', '', 7.5);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text($col1X + 195, $py, $val);

            $py += 23;
        }

        // Caixa 2: Índice e Sumário do Documento
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(...$this->cSlateBg);
        $pdf->SetLineWidth(1);
        $pdf->Rect($col2X, $tblY, $colW, 300, 'DF');

        $pdf->SetFillColor(241, 245, 249);
        $pdf->Rect($col2X, $tblY, $colW, 28, 'DF');

        $pdf->SetFont('dejavusans', 'B', 9);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text($col2X + 12, $tblY + 8, 'ÍNDICE GERAL DO DOCUMENTO');

        $tocItems = [
            ['Página 1', 'Resumo Executivo, Metadados e Parâmetros de Oficina'],
            ['Página 2', 'Lista Geral de Peças de Marcenaria (Bill of Materials)'],
            ["Páginas 3 a " . (2 + $woodSheetsCount), "Desenhos Técnicos das {$woodSheetsCount} Chapas de Madeira (Guilhotina 2D)"],
            ["Página " . (3 + $woodSheetsCount), 'Estofaria & Colchão: Lista de Almofadas & Desenho do Bloco D33'],
            ["Página " . (4 + $woodSheetsCount), 'Serralheria: Perfis T-Slot 40x40 e 30x30 (Corte Linear 1D)'],
            ["Página " . (5 + $woodSheetsCount), 'Serralheria: Trilhos Telescópicos, Sapatas e Juntas Soldadas'],
            ["Página " . (6 + $woodSheetsCount), 'Hidráulica: Tubos PVC Ø100mm, Conexões e Esquema do Reservatório'],
            ["Página " . (7 + $woodSheetsCount), 'Guia de Oficina: Sequência de Corte, Refilo e Montagem'],
        ];

        $py = $tblY + 42;
        foreach ($tocItems as [$pg, $desc]) {
            $pdf->SetFont('dejavusans', 'B', 8);
            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text($col2X + 14, $py, $pg);

            $pdf->SetFont('dejavusans', '', 7.8);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text($col2X + 78, $py, $desc);

            $py += 28;
        }
    }

    // =========================================================================
    // PÁGINA 2: LISTA GERAL DE PEÇAS DE MARCENARIA (BOM)
    // =========================================================================

    private function renderWoodBomPage(TCPDF $pdf, array $data, int $pageNum, int $totalPages): void
    {
        $pdf->AddPage('L', [842, 595]);
        $wPieces = $data['wood']['totalPieces'] ?? 0;
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'LISTA DE PEÇAS DE MARCENARIA (BILL OF MATERIALS)', "Total: {$wPieces} peças de corte");

        $thY = 56;
        $pdf->SetFillColor(...$this->cPrimaryDark);
        $pdf->Rect(36, $thY, 770, 22, 'F');

        $headers = [
            ['#', 42],
            ['Nome da Peça / Identificação', 65],
            ['Módulo', 270],
            ['Material', 410],
            ['Esp.', 525],
            ['Compr.', 565],
            ['Larg.', 615],
            ['Qtd', 665],
            ['Área (m²)', 700],
            ['Usinagem CNC', 750]
        ];

        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(255, 255, 255);
        foreach ($headers as [$hTitle, $hX]) {
            $pdf->Text($hX, $thY + 6, $hTitle);
        }

        $allWoodPieces = [];
        if (!empty($data['wood']['categories'])) {
            foreach ($data['wood']['categories'] as $cat) {
                foreach ($cat['pieces'] ?? [] as $p) {
                    if (empty($p['isUpholstery'])) {
                        $allWoodPieces[] = $p;
                    }
                }
            }
        }

        $rowY = $thY + 24;
        $rowH = 16.5;
        $displayLimit = 28;

        foreach (array_slice($allWoodPieces, 0, $displayLimit) as $idx => $p) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $rowY, 770, $rowH, 'DF');

            // #
            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(42, $rowY + 4, sprintf('%02d', $idx + 1));

            // Nome
            $lbl = $p['label'] ?? '';
            if (str_contains($lbl, '•')) {
                $parts = explode('•', $lbl);
                $lbl = trim(end($parts));
            }
            if (mb_strlen($lbl) > 42) {
                $lbl = mb_substr($lbl, 0, 40) . '..';
            }
            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(65, $rowY + 4, $lbl);

            // Módulo
            $mod = $p['moduleName'] ?? 'Estrutura';
            if (mb_strlen($mod) > 22) {
                $mod = mb_substr($mod, 0, 20) . '..';
            }
            $pdf->SetFont('dejavusans', '', 6.8);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(270, $rowY + 4, $mod);

            // Material
            $mat = $p['woodMaterial'] ?? 'Compensado';
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(410, $rowY + 4, $mat);

            // Esp., Compr., Larg., Qtd, Área
            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(525, $rowY + 4, ($p['thicknessMm'] ?? 15) . 'mm');

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->Text(565, $rowY + 4, ($p['lengthMm'] ?? 0) . ' mm');
            $pdf->Text(615, $rowY + 4, ($p['widthMm'] ?? 0) . ' mm');

            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(665, $rowY + 4, ($p['qty'] ?? 1) . 'x');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $area = number_format($p['totalAreaM2'] ?? 0, 2, ',', '.');
            $pdf->Text(705, $rowY + 4, $area);

            // Usinagem CNC
            $cncNotes = [];
            if (!empty($p['isPerforated'])) {
                $cncNotes[] = 'Furos CNC Ø40';
            }
            if (!empty($p['hasCabinetCutout'])) {
                $cncNotes[] = 'Recorte Armário';
            }
            if (!empty($p['hasCabinetExclusion'])) {
                $cncNotes[] = 'Apoio Maciço';
            }
            $cncStr = !empty($cncNotes) ? implode(' + ', $cncNotes) : 'Corte Reto';

            $cncColor = !empty($p['isPerforated']) ? $this->cEmerald : (!empty($p['hasCabinetCutout']) ? $this->cAmber : $this->cTextMuted);
            $pdf->SetFont('dejavusans', '', 6.5);
            $pdf->SetTextColor(...$cncColor);
            $pdf->Text(750, $rowY + 4, $cncStr);

            $rowY += $rowH;
        }

        // Nota explicativa no rodapé da tabela
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(...$this->cSlateBg);
        $pdf->SetLineWidth(0.8);
        $pdf->Rect(36, 524, 770, 34, 'DF');

        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(46, 532, 'NOTA DE CORTE: Todas as dimensões indicadas incluem os descontos necessários para refilo e assentamento.');

        $pdf->SetFont('dejavusans', '', 7);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(46, 544, 'Para peças com furação passante CNC (ex: tampos do estrado da cama), executar as furações antes do corte final de esquadrejamento.');
    }

    // =========================================================================
    // PÁGINAS 3+: DESENHOS TÉCNICOS VETORIAIS DAS CHAPAS DE MADEIRA (2D)
    // =========================================================================

    private function renderWoodSheetPages(TCPDF $pdf, array $data, int &$pageNum, int $totalPages, int $woodSheetsCount): void
    {
        $sheetGlobalIdx = 1;

        if (empty($data['wood']['cuttingPlans'])) {
            return;
        }

        foreach ($data['wood']['cuttingPlans'] as $cp) {
            foreach ($cp['sheets'] ?? [] as $sheet) {
                $pdf->AddPage('L', [842, 595]);

                $sheetTitle = sprintf("DESENHO TÉCNICO DE CORTE — CHAPA %02d DE %02d", $sheetGlobalIdx, $woodSheetsCount);
                $sheetSub = "{$sheet['material']} {$sheet['thicknessMm']}mm  •  Dimensão Nominal: {$sheet['sheetWidthMm']} × {$sheet['sheetHeightMm']} mm";
                $this->drawHeaderFooter($pdf, $pageNum, $totalPages, $sheetTitle, $sheetSub);

                // Barra de Estatísticas da Chapa
                $sbY = 54;
                $pdf->SetDrawColor(...$this->cEmerald);
                $pdf->SetFillColor(240, 253, 244);
                $pdf->SetLineWidth(0.8);
                $pdf->Rect(36, $sbY, 770, 26, 'DF');

                $eff = number_format($sheet['efficiencyPct'] ?? 0, 1, ',', '.');
                $used = number_format($sheet['usedAreaM2'] ?? 0, 2, ',', '.');
                $totalA = number_format($sheet['totalAreaM2'] ?? 0, 2, ',', '.');
                $waste = number_format($sheet['wastePct'] ?? 0, 1, ',', '.');
                $piecesCount = count($sheet['placedPieces'] ?? []);

                $pdf->SetFont('dejavusans', 'B', 8.5);
                $pdf->SetTextColor(...$this->cEmerald);
                $pdf->Text(46, $sbY + 8, "⚡ APROVEITAMENTO: {$eff}%");

                $pdf->SetFont('dejavusans', '', 8);
                $pdf->SetTextColor(...$this->cTextMain);
                $pdf->Text(210, $sbY + 8, "Área Útil: {$used} m² de {$totalA} m²");

                $pdf->SetTextColor(...$this->cTextMuted);
                $pdf->Text(400, $sbY + 8, "Sobras: {$waste}%");

                $pdf->SetFont('dejavusans', 'B', 8);
                $pdf->SetTextColor(...$this->cAmber);
                $pdf->Text(530, $sbY + 8, "Refilo: {$sheet['marginMm']} mm  •  Kerf: {$sheet['kerfMm']} mm");

                $pdf->SetTextColor(...$this->cPrimaryDark);
                $pdf->Text(720, $sbY + 8, "Peças: {$piecesCount}");

                // ─── ÁREA DE DESENHO CAD DA CHAPA ───
                $canvasX0 = 46.0;
                $canvasY0 = 92.0;
                $canvasMaxW = 750.0;
                $canvasMaxH = 360.0;

                $sheetWMm = (float)($sheet['sheetWidthMm'] ?? 2440);
                $sheetHMm = (float)($sheet['sheetHeightMm'] ?? 1220);

                $scale = min($canvasMaxW / $sheetWMm, $canvasMaxH / $sheetHMm);
                $drawW = $sheetWMm * $scale;
                $drawH = $sheetHMm * $scale;

                $offsetX = $canvasX0 + ($canvasMaxW - $drawW) / 2.0;
                $offsetY = $canvasY0 + ($canvasMaxH - $drawH) / 2.0;

                // Fundo da Chapa Bruta
                $pdf->SetDrawColor(...$this->cSheetBorder);
                $pdf->SetFillColor(...$this->cSheetBg);
                $pdf->SetLineWidth(1.5);
                $pdf->Rect($offsetX, $offsetY, $drawW, $drawH, 'DF');

                // Linha Tracejada de Refilo (Margem de 10mm)
                $marginMm = (float)($sheet['marginMm'] ?? 10);
                if ($marginMm > 0) {
                    $refX0 = $offsetX + $marginMm * $scale;
                    $refY0 = $offsetY + $marginMm * $scale;
                    $refW = ($sheetWMm - 2 * $marginMm) * $scale;
                    $refH = ($sheetHMm - 2 * $marginMm) * $scale;

                    $pdf->SetLineStyle(['width' => 1, 'cap' => 'butt', 'join' => 'miter', 'dash' => '4,3', 'color' => $this->cRefilo]);
                    $pdf->Rect($refX0, $refY0, $refW, $refH, 'D');
                    $pdf->SetLineStyle(['width' => 1, 'cap' => 'butt', 'join' => 'miter', 'dash' => 0, 'color' => $this->cSlateBorder]);
                }

                // Desenho de cada peça posicionada
                foreach ($sheet['placedPieces'] ?? [] as $pIdx => $piece) {
                    $palette = $this->piecePalettes[$pIdx % count($this->piecePalettes)];

                    $px = $offsetX + $piece['x'] * $scale;
                    $py = $offsetY + $piece['y'] * $scale;
                    $pw = $piece['w'] * $scale;
                    $ph = $piece['h'] * $scale;

                    $pdf->SetDrawColor(...$palette['stroke']);
                    $pdf->SetFillColor(...$palette['fill']);
                    $pdf->SetLineWidth(1.1);
                    $pdf->Rect($px, $py, $pw, $ph, 'DF');

                    // Se tiver furos de alívio CNC
                    if (!empty($piece['holes'])) {
                        $pdf->SetDrawColor(...$palette['stroke']);
                        $pdf->SetFillColor(255, 255, 255);
                        $pdf->SetLineWidth(0.8);
                        foreach ($piece['holes'] as $hole) {
                            $hx = $px + $hole['x'] * $scale;
                            $hy = $py + $hole['y'] * $scale;
                            $hr = max(1.5, $hole['r'] * $scale);
                            $pdf->Circle($hx, $hy, $hr, 0, 360, 'DF');
                        }
                    }

                    // Rótulos e dimensões dentro da peça
                    if ($pw > 35 && $ph > 18) {
                        $lbl = $piece['label'] ?? '';
                        if (str_contains($lbl, '•')) {
                            $parts = explode('•', $lbl);
                            $partName = trim(end($parts));
                            $partName = preg_replace('/\s*\(\d+.*?\)$/', '', $partName);
                            if (str_contains($partName, 'Dobradiça') && str_contains($partName, 'Pé')) {
                                $lbl = 'Pé Articulado';
                            } elseif (mb_strlen($partName) <= 24) {
                                $lbl = $partName;
                            } else {
                                $lbl = mb_substr($partName, 0, 22) . '..';
                            }
                        } else {
                            $maxChars = max(5, (int)($pw / 5.2));
                            if (mb_strlen($lbl) > $maxChars) {
                                $lbl = mb_substr($lbl, 0, $maxChars - 2) . '..';
                            }
                        }
                        $fSize = min(8.5, max(6.0, $pw / 15.0));

                        $pdf->SetFont('dejavusans', 'B', $fSize);
                        $pdf->SetTextColor(...$this->cTextMain);
                        $pdf->Text($px + 3, $py + $ph / 2 - 7, $lbl);

                        $dimStr = "{$piece['w']} × {$piece['h']}";
                        if (!empty($piece['rotated'])) {
                            $dimStr .= " ↻";
                        }
                        $pdf->SetFont('dejavusans', 'B', max(5.5, $fSize - 1.0));
                        $pdf->SetTextColor(...$palette['text']);
                        $pdf->Text($px + 3, $py + $ph / 2 + 2, $dimStr);

                        if (!empty($piece['isPerforated']) && $ph > 35) {
                            $pdf->SetFont('dejavusans', '', 5.5);
                            $pdf->SetTextColor(...$this->cEmerald);
                            $pdf->Text($px + 3, $py + $ph / 2 + 11, 'Vazado CNC');
                        }
                    } elseif ($pw >= 20 && $ph >= 8) {
                        $lbl = $piece['label'] ?? '';
                        if (str_contains($lbl, '•')) {
                            $parts = explode('•', $lbl);
                            $lbl = trim(end($parts));
                            $lbl = preg_replace('/\s*\(\d+.*?\)$/', '', $lbl);
                        }
                        if (str_contains($lbl, 'Dobradiça') || str_contains($lbl, 'Articulado')) {
                            $lbl = 'Pé Articulado';
                        } elseif (str_contains($lbl, 'Ripa')) {
                            $lbl = 'Ripa ' . (str_contains($lbl, 'Fixa') ? 'Fixa' : 'Móvel');
                        } elseif (mb_strlen($lbl) > 18) {
                            $lbl = mb_substr($lbl, 0, 16) . '..';
                        }
                        $dimStr = "{$piece['w']}×{$piece['h']}";
                        $fSize = min(6.0, max(4.5, $ph * 0.45));
                        $pdf->SetFont('dejavusans', 'B', $fSize);
                        $pdf->SetTextColor(...$this->cTextMain);
                        $pdf->Text($px + 2, $py + $ph / 2 - 3, "{$lbl} ({$dimStr})");
                    } elseif ($pw >= 8 && $ph >= 25) {
                        $dimStr = "{$piece['w']}×{$piece['h']}";
                        $fSize = min(5.5, max(4.2, $pw * 0.44));
                        $shortLbl = $piece['label'] ?? '';
                        if (str_contains($shortLbl, '•')) {
                            $parts = explode('•', $shortLbl);
                            $shortLbl = trim(end($parts));
                            $shortLbl = preg_replace('/\s*\(\d+.*?\)$/', '', $shortLbl);
                        }
                        if (str_contains($shortLbl, 'Dobradiça') || str_contains($shortLbl, 'Articulado')) {
                            $shortLbl = 'Pé Articulado';
                        } elseif (str_contains($shortLbl, 'Ripa')) {
                            $shortLbl = 'Ripa ' . (str_contains($shortLbl, 'Fixa') ? 'Fixa' : 'Móvel');
                        } elseif (str_contains($shortLbl, 'Pé') || str_contains($shortLbl, 'Pe')) {
                            $shortLbl = 'Pé Apoio';
                        } elseif (mb_strlen($shortLbl) > 10) {
                            $shortLbl = mb_substr($shortLbl, 0, 8) . '..';
                        }
                        $pdf->SetFont('dejavusans', 'B', $fSize);
                        $pdf->SetTextColor(...$this->cTextMain);
                        $pdf->Text($px + 1.2, $py + $ph / 2 - 5, $shortLbl);
                        $pdf->SetFont('dejavusans', '', max(4.0, $fSize - 0.5));
                        $pdf->SetTextColor(...$palette['text']);
                        $pdf->Text($px + 1.2, $py + $ph / 2 + 2, $dimStr);
                    }
                }

                // Cotas Totais da Chapa
                $pdf->SetFont('dejavusans', 'B', 8);
                $pdf->SetTextColor(...$this->cTextMain);
                $pdf->Text($offsetX + $drawW / 2 - 60, $offsetY - 12, "↔ Comprimento Total: {$sheetWMm} mm");
                $pdf->Text($offsetX - 32, $offsetY + $drawH / 2 - 5, "↕ {$sheetHMm} mm");

                // ─── MINI TABELA DE PEÇAS NO RODAPÉ DA FOLHA ───
                $mtY = 466;
                $pdf->SetDrawColor(...$this->cSlateBorder);
                $pdf->SetFillColor(...$this->cSlateBg);
                $pdf->SetLineWidth(0.8);
                $pdf->Rect(36, $mtY, 770, 18, 'DF');

                $headersMt = [
                    ['ID', 42],
                    ['Peça na Folha', 65],
                    ['Posição X / Y', 260],
                    ['Dimensões Cortadas', 370],
                    ['Área Total', 500],
                    ['Rotação', 590],
                    ['Furação / Recorte CNC', 670]
                ];
                $pdf->SetFont('dejavusans', 'B', 6.8);
                $pdf->SetTextColor(...$this->cTextMuted);
                foreach ($headersMt as [$th, $tx]) {
                    $pdf->Text($tx, $mtY + 5, $th);
                }

                // Agrupamento de peças idênticas
                $sheetGroups = [];
                $groupedSeen = [];
                foreach ($sheet['placedPieces'] ?? [] as $p) {
                    $gKey = "{$p['label']}__{$p['w']}x{$p['h']}";
                    if (isset($groupedSeen[$gKey])) {
                        $sheetGroups[$groupedSeen[$gKey]]['qty']++;
                    } else {
                        $item = $p;
                        $item['qty'] = 1;
                        $groupedSeen[$gKey] = count($sheetGroups);
                        $sheetGroups[] = $item;
                    }
                }

                $rY = $mtY + 20;
                foreach (array_slice($sheetGroups, 0, 7) as $idx => $p) {
                    $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
                    $pdf->SetDrawColor(...$this->cSlateBorder);
                    $pdf->SetFillColor(...$bg);
                    $pdf->SetLineWidth(0.4);
                    $pdf->Rect(36, $rY, 770, 14, 'DF');

                    $qtyStr = $p['qty'] > 1 ? "{$p['qty']} un" : sprintf('#%d', $idx + 1);
                    $pdf->SetFont('dejavusans', 'B', 6.5);
                    $pdf->SetTextColor(...($p['qty'] > 1 ? $this->cAmber : $this->cTextMuted));
                    $pdf->Text(42, $rY + 3.5, $qtyStr);

                    $lbl = $p['label'] ?? '';
                    if (str_contains($lbl, '•')) {
                        $parts = explode('•', $lbl);
                        $lbl = trim(end($parts));
                    }
                    if (mb_strlen($lbl) > 42) {
                        $lbl = mb_substr($lbl, 0, 40) . '..';
                    }
                    $pdf->SetTextColor(...$this->cTextMain);
                    $pdf->Text(65, $rY + 3.5, $lbl);

                    $posStr = $p['qty'] === 1 ? "X={$p['x']} mm, Y={$p['y']} mm" : "Diversas ({$p['qty']} posições)";
                    $pdf->SetFont('dejavusans', '', 6.5);
                    $pdf->SetTextColor(...$this->cTextMuted);
                    $pdf->Text(260, $rY + 3.5, $posStr);

                    $dimStr = "{$p['w']} × {$p['h']} mm";
                    $pdf->SetFont('dejavusans', 'B', 6.5);
                    $pdf->SetTextColor(...$this->cPrimaryDark);
                    $pdf->Text(370, $rY + 3.5, $dimStr);

                    $calcArea = number_format(($p['w'] * $p['h'] * $p['qty']) / 1_000_000, 3, ',', '.');
                    $pdf->SetFont('dejavusans', '', 6.5);
                    $pdf->SetTextColor(...$this->cTextMain);
                    $pdf->Text(500, $rY + 3.5, "{$calcArea} m²");

                    $rotStr = !empty($p['rotated']) ? "90° (Rotacionada)" : "0° (Padrão)";
                    $pdf->SetTextColor(...(!empty($p['rotated']) ? $this->cAmber : $this->cTextMuted));
                    $pdf->Text(590, $rY + 3.5, $rotStr);

                    $cncTxt = !empty($p['isPerforated']) ? 'Furos CNC Ø40' : (!empty($p['hasCabinetCutout']) ? 'Recorte Especial' : 'Corte Reto');
                    $pdf->SetTextColor(...(!empty($p['isPerforated']) ? $this->cEmerald : $this->cTextMuted));
                    $pdf->Text(670, $rY + 3.5, $cncTxt);

                    $rY += 14;
                }

                $sheetGlobalIdx++;
                $pageNum++;
            }
        }
    }

    // =========================================================================
    // PÁGINA: ESTOFARIA & TAPEÇARIA (ESPUMA D33)
    // =========================================================================

    private function renderUpholsteryPage(TCPDF $pdf, array $data, int $pageNum, int $totalPages): void
    {
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'ESTOFARIA & TAPEÇARIA — PLANO DE CORTE DO COLCHÃO', 'Bloco Comercial de Espuma D33 (1.900 × 1.400 × 60/80 mm)');

        $uph = $data['upholstery'] ?? [];
        $uY = 56;
        $cw = (770 - 30) / 4;

        $this->drawCard($pdf, 36, $uY, $cw, 56, 'TOTAL DE ALMOFADAS', ($uph['totalPieces'] ?? 2) . ' Peças', 'Colchão Tripartido Dobrável', $this->cPrimary, [240, 249, 255]);
        $this->drawCard($pdf, 36 + $cw + 10, $uY, $cw, 56, 'ÁREA & VOLUME TOTAL', number_format($uph['totalAreaM2'] ?? 0, 2, ',', '.') . ' m²', round($uph['totalVolumeLiters'] ?? 0) . ' L Espuma D33', $this->cEmerald, $this->cEmeraldLight);
        $this->drawCard($pdf, 36 + 2 * $cw + 20, $uY, $cw, 56, 'BLOCOS DE ESPUMA', ($uph['estimatedSheets1900'] ?? 1) . ' Bloco Padrão', '1900 × 1400 mm (D33 Selada)', $this->cAmber, $this->cAmberLight);
        $this->drawCard($pdf, 36 + 3 * $cw + 30, $uY, $cw, 56, 'REVESTIMENTO & CAPA', 'Tecido Impermeável', 'Zíper destacável reforçado', $this->cSlateBorder, $this->cSlateBg);

        // Desenho CAD do Bloco de Espuma D33
        $fCadY = 126;
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->SetLineWidth(1);
        $pdf->Rect(36, $fCadY, 770, 240, 'DF');

        // Bloco de espuma: 1900 x 1400 mm
        $foamScale = min(720 / 1900.0, 210 / 1400.0);
        $fbW = 1900 * $foamScale;
        $fbH = 1400 * $foamScale;
        $fbX = 36 + (770 - $fbW) / 2.0;
        $fbY = $fCadY + (240 - $fbH) / 2.0;

        $pdf->SetDrawColor(...$this->cPrimary);
        $pdf->SetFillColor(224, 242, 254);
        $pdf->SetLineWidth(1.5);
        $pdf->Rect($fbX, $fbY, $fbW, $fbH, 'DF');

        // Almofada 1 (Traseira) e Almofada 2 (Dianteira)
        $c1W = 1200 * $foamScale;
        $c1H = 600 * $foamScale;
        $pdf->SetDrawColor(...$this->cPrimaryDark);
        $pdf->SetFillColor(186, 230, 253);
        $pdf->SetLineWidth(1.2);
        $pdf->Rect($fbX + 10, $fbY + 10, $c1W, $c1H, 'DF');

        $c2W = 1200 * $foamScale;
        $c2H = 600 * $foamScale;
        $c2X = $fbX + 10;
        $c2Y = $fbY + 10 + $c1H + 8;
        $pdf->SetDrawColor(...$this->cAmber);
        $pdf->SetFillColor(254, 243, 199);
        $pdf->Rect($c2X, $c2Y, $c2W, $c2H, 'DF');

        // Destaque do Recorte do Armário Aéreo
        $cutoutW = 250 * $foamScale;
        $cutoutH = 450 * $foamScale;
        $pdf->SetDrawColor(239, 68, 68);
        $pdf->SetFillColor(254, 202, 202);
        $pdf->Rect($c2X, $c2Y, $cutoutW, $cutoutH, 'DF');

        // Textos dentro do desenho do bloco
        $pdf->SetFont('dejavusans', 'B', 8.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text($fbX + 20, $fbY + 22, 'Almofada #1 — Assento / Cama Traseira (1.200 × 600 × 60mm)');

        $pdf->SetFont('dejavusans', '', 7.5);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text($fbX + 20, $fbY + 36, 'Corte Reto 90° • Espuma D33 Pura • Sem recorte');

        $pdf->SetFont('dejavusans', 'B', 8.5);
        $pdf->SetTextColor(...$this->cAmber);
        $pdf->Text($c2X + $cutoutW + 16, $c2Y + 22, 'Almofada #2 — Encosto / Cama Dianteira');

        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(180, 83, 9);
        $pdf->Text($c2X + $cutoutW + 16, $c2Y + 36, '1.200 × 600 × 60mm • C/ RECORTE ESPECIAL P/ ARMÁRIO AÉREO');

        $pdf->SetFont('dejavusans', 'B', 6.5);
        $pdf->SetTextColor(185, 28, 28);
        $pdf->Text($c2X + 4, $c2Y + 12, 'RECORTE');
        $pdf->SetFont('dejavusans', '', 5.5);
        $pdf->Text($c2X + 4, $c2Y + 22, 'Armário');

        // Tabela de Almofadas no Rodapé
        $tuY = 384;
        $pdf->SetFillColor(...$this->cPrimaryDark);
        $pdf->Rect(36, $tuY, 770, 20, 'F');

        $headersTu = [
            ['#', 42],
            ['Identificação da Almofada', 65],
            ['Função no Campervan', 280],
            ['Compr. (mm)', 450],
            ['Larg. (mm)', 530],
            ['Esp. (mm)', 610],
            ['Densidade', 680],
            ['Recorte Especial', 740]
        ];
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(255, 255, 255);
        foreach ($headersTu as [$th, $tx]) {
            $pdf->Text($tx, $tuY + 5.5, $th);
        }

        $ruY = $tuY + 22;
        foreach ($uph['cushions'] ?? [] as $idx => $c) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $ruY, 770, 18, 'DF');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(42, $ruY + 5, sprintf('#%d', $idx + 1));

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(65, $ruY + 5, $c['label'] ?? '');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(280, $ruY + 5, $c['moduleName'] ?? 'Cama Retrátil');

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(450, $ruY + 5, ($c['lengthMm'] ?? 0) . ' mm');
            $pdf->Text(530, $ruY + 5, ($c['widthMm'] ?? 0) . ' mm');
            $pdf->Text(610, $ruY + 5, ($c['thicknessMm'] ?? 0) . ' mm');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(680, $ruY + 5, 'D33 Selada');

            $cutoutTxt = !empty($c['hasCabinetCutout']) ? 'Sim (Recorte Aéreo)' : 'Não (Corte Reto)';
            $col = !empty($c['hasCabinetCutout']) ? $this->cAmber : $this->cTextMuted;
            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$col);
            $pdf->Text(740, $ruY + 5, $cutoutTxt);

            $ruY += 18;
        }

        // Instrução de corte da espuma
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(36, 545, 'RECOMENDAÇÃO DE CORTE: Cortar com faca elétrica de estofador de duplo gume ou fio quente calibrado a 120°C.');
        $pdf->SetFont('dejavusans', '', 7);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(36, 557, 'Utilizar régua de alumínio presa com grampos para guiar a lâmina e obter faces de corte 100% perpendiculares.');
    }

    // =========================================================================
    // PÁGINAS: SERRALHERIA & PERFIS METÁLICOS (1D NESTING + JUNTAS SOLDADAS)
    // =========================================================================

    private function renderMetalPages(TCPDF $pdf, array $data, int &$pageNum, int $totalPages): void
    {
        $metal = $data['metal'] ?? [];
        $nestedMetal = $this->optimize1dBars($metal['cutGroups'] ?? [], 6000, 3);

        // Página 1: Desenho 1D de corte das barras de 6m
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'SERRALHERIA ESTRUTURAL — DESENHO DE CORTE LINEAR (1D NESTING)', 'Perfis T-Slot 40x40 e 30x30  •  Barras Comerciais de 6.000 mm');

        // Banner informativo
        $pdf->SetDrawColor(...$this->cEmerald);
        $pdf->SetFillColor(...$this->cEmeraldLight);
        $pdf->SetLineWidth(0.8);
        $pdf->Rect(36, 54, 770, 26, 'DF');

        $pdf->SetFont('dejavusans', 'B', 8);
        $pdf->SetTextColor(...$this->cEmerald);
        $pdf->Text(46, 60, 'DESENHO TÉCNICO DE CORTE DAS BARRAS DE 6 METROS (1D BEST-FIT DECREASING)');

        $pdf->SetFont('dejavusans', '', 7.2);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(46, 70, 'Cada régua representa uma barra comercial inteira de 6.000 mm. Cortes delimitados com indicação da perda de serra (kerf 3mm) e sobra final.');

        $targetSpecs = ['Perfil T-Slot 40x40', 'Perfil T-Slot 30x30'];
        $barCadY = 88;

        foreach ($targetSpecs as $specName) {
            $bars = $nestedMetal[$specName] ?? [];
            if (empty($bars)) {
                continue;
            }

            $countBars = count($bars);
            $pdf->SetFont('dejavusans', 'B', 8.5);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(36, $barCadY, "🔩 " . mb_strtoupper($specName) . " — {$countBars} BARRAS DE 6 METROS NECESSÁRIAS");
            $barCadY += 16;

            $ruleX0 = 42.0;
            $ruleW = 750.0;
            $ruleH = 16.0;
            $scale1d = $ruleW / 6000.0;

            foreach ($bars as $bIdx => $bar) {
                // Fundo da barra inteira (sobra)
                $pdf->SetDrawColor(...$this->cSlateBorder);
                $pdf->SetFillColor(...$this->cWaste);
                $pdf->SetLineWidth(0.8);
                $pdf->Rect($ruleX0, $barCadY, $ruleW, $ruleH, 'DF');

                $curX = $ruleX0;
                foreach ($bar['cuts'] as $cIdx => $cut) {
                    $segW = $cut['lengthMm'] * $scale1d;
                    $palette = $this->piecePalettes[$cIdx % count($this->piecePalettes)];

                    $pdf->SetDrawColor(...$palette['stroke']);
                    $pdf->SetFillColor(...$palette['fill']);
                    $pdf->SetLineWidth(0.9);
                    $pdf->Rect($curX, $barCadY, $segW, $ruleH, 'DF');

                    // Marca de serra kerf
                    $pdf->SetDrawColor(239, 68, 68);
                    $pdf->SetLineWidth(1.2);
                    $pdf->Line($curX + $segW, $barCadY, $curX + $segW, $barCadY + $ruleH);

                    if ($segW > 28) {
                        $lbl = $cut['label'] ?? '';
                        if (mb_strlen($lbl) > 16) {
                            $lbl = mb_substr($lbl, 0, 14) . '..';
                        }
                        $pdf->SetFont('dejavusans', '', 5.5);
                        $pdf->SetTextColor(...$this->cTextMain);
                        $pdf->Text($curX + 2, $barCadY + 2, $lbl);

                        $pdf->SetFont('dejavusans', 'B', 5.5);
                        $pdf->SetTextColor(...$palette['text']);
                        $pdf->Text($curX + 2, $barCadY + 9, "{$cut['lengthMm']}mm");
                    }

                    $curX += $segW + 3 * $scale1d;
                }

                $effPct = number_format($bar['efficiency_pct'], 1, ',', '.');
                $statsStr = sprintf("Barra #%d: %s%% útil (%d mm) | Sobra: %d mm", $bIdx + 1, $effPct, $bar['used_mm'], $bar['waste_mm']);
                $pdf->SetFont('dejavusans', 'B', 6.5);
                $pdf->SetTextColor(...$this->cTextMuted);
                $pdf->Text($ruleX0, $barCadY + $ruleH + 3, $statsStr);

                $barCadY += $ruleH + 15;
            }

            $barCadY += 8;
        }

        $pageNum++;

        // Página 2: Trilhos, Sapatas e Relatório de Solda
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'SERRALHERIA ESTRUTURAL — TRILHOS, SAPATAS & SOLDAGEM', 'Trilhos Heavy Duty, Sapatas de Ancoragem e Nós Estruturais Soldados');

        $m2Y = 56;
        $pdf->SetFillColor(...$this->cPrimaryDark);
        $pdf->Rect(36, $m2Y, 770, 20, 'F');

        $headersM2 = [
            ['#', 42],
            ['Especificação do Perfil / Ferragem', 65],
            ['Peças', 260],
            ['Metragem Total', 340],
            ['Barras 6m', 440],
            ['Barras 3m', 520],
            ['Aplicação Estrutural', 620]
        ];
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(255, 255, 255);
        foreach ($headersM2 as [$th, $tx]) {
            $pdf->Text($tx, $m2Y + 5.5, $th);
        }

        $rowMy = $m2Y + 22;
        foreach ($metal['profileSummaries'] ?? [] as $idx => $psum) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $rowMy, 770, 18, 'DF');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(42, $rowMy + 5, sprintf('#%d', $idx + 1));

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(65, $rowMy + 5, $psum['profileSpec'] ?? '');

            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(260, $rowMy + 5, ($psum['pieces'] ?? 0) . ' un');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(340, $rowMy + 5, number_format($psum['totalMeters'] ?? 0, 2, ',', '.') . ' m');

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(440, $rowMy + 5, ($psum['bars6m'] ?? 0) . ' barras');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(520, $rowMy + 5, ($psum['bars3m'] ?? 0) . ' barras');

            $appTxt = str_contains($psum['profileSpec'] ?? '', '40x40')
                ? 'Subchassi & Rack Base'
                : (str_contains($psum['profileSpec'] ?? '', '30x30') ? 'Bandejas Solares Retráteis' : 'Gavetões & Extensão');
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(620, $rowMy + 5, $appTxt);

            $rowMy += 18;
        }

        // Relatório de Juntas Soldadas
        $wjY = $rowMy + 16;
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(...$this->cSlateBg);
        $pdf->SetLineWidth(1);
        $pdf->Rect(36, $wjY, 770, 160, 'DF');

        $pdf->SetFillColor(241, 245, 249);
        $pdf->Rect(36, $wjY, 770, 26, 'DF');

        $pdf->SetFont('dejavusans', 'B', 8.5);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(46, $wjY + 7, 'RELATÓRIO DE JUNTAS ESTRUTURAIS & CORDÕES DE SOLDA');

        $wjData = $metal['weldedJoints'] ?? [];
        $totalJoints = $wjData['totalJoints'] ?? 58;
        $miter45 = $wjData['miterCorners45'] ?? 16;
        $tee = $wjData['teeJoints'] ?? 24;
        $brackets = $wjData['mountBracketsJoints'] ?? 18;
        $cons = $wjData['consumables'] ?? [];

        $pdf->SetFont('dejavusans', 'B', 8);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(46, $wjY + 36, "• Total de Nós Estruturais Soldados (Quinas): {$totalJoints} junções estruturais");

        $pdf->SetFont('dejavusans', '', 8);
        $pdf->SetTextColor(...$this->cTextMain);
        $pdf->Text(46, $wjY + 54, "• Quinas em Meia-Esquadria (45°): {$miter45}  |  Junções em 'T' (90°): {$tee}  |  Suportes: {$brackets}");

        $cDiscs = $cons['cuttingDiscs4Half'] ?? 4;
        $fDiscs = $cons['flapDiscsGrinding'] ?? 3;
        $migKg = number_format($cons['migWireKg'] ?? 1.5, 1, ',', '.');
        $pdf->Text(46, $wjY + 72, "• Consumíveis Estimados: {$cDiscs} Discos de Corte 4.5\"  •  {$fDiscs} Discos Flap Desbaste  •  {$migKg} kg Arame MIG");

        $pdf->SetFont('dejavusans', '', 7.5);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(46, $wjY + 92, "• Processo de Solda Recomendado: MIG/MAG com arame sólido 0.8mm ou TIG com vareta de alumínio 4043");
        $pdf->Text(46, $wjY + 108, "• Tratamento Anticorrosivo: Fosfatização e pintura eletrostática a pó epóxi preto fosco (espessura 80 µm)");
        $pdf->Text(46, $wjY + 124, "• Travamento Mecânico na Doblò: Parafusos sextavados M8 em Aço Inox 304 com porcas auto-travantes (Nyloc)");

        $pageNum++;
    }

    // =========================================================================
    // PÁGINA: HIDRÁULICA PVC (RESERVATÓRIO EM U)
    // =========================================================================

    private function renderPvcPage(TCPDF $pdf, array $data, int $pageNum, int $totalPages): void
    {
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, "INSTALAÇÃO HIDRÁULICA — RESERVATÓRIO EM 'U' NO TETO", 'Tubos e Conexões Soldáveis PVC Ø100mm (Capacidade: ~35 Litros)');

        $pvc = $data['pvc'] ?? [];
        $pvcY = 56;
        $cw = (770 - 30) / 4;

        $this->drawCard($pdf, 36, $pvcY, $cw, 56, 'CAPACIDADE DO RESERVATÓRIO', ($pvc['totalCapacityL'] ?? 35) . ' Litros', "Geometria em U sobre o teto", [14, 165, 233], [240, 249, 255]);
        $this->drawCard($pdf, 36 + $cw + 10, $pvcY, $cw, 56, 'TUBULAÇÃO PRINCIPAL', "PVC Ø " . ($pvc['diameterMm'] ?? 100) . " mm", ($pvc['totalPieces'] ?? 0) . " Tubos • " . number_format($pvc['totalLinearMeters'] ?? 0, 2, ',', '.') . "m", $this->cPrimary, [224, 242, 254]);
        $this->drawCard($pdf, 36 + 2 * $cw + 20, $pvcY, $cw, 56, 'BARRA RECOMENDADA', "1 Barra de " . ($pvc['recommendedBarOption'] ?? '6m'), "Aproveitamento ótimo > 90%", $this->cEmerald, $this->cEmeraldLight);
        $this->drawCard($pdf, 36 + 3 * $cw + 30, $pvcY, $cw, 56, 'CONEXÕES & VÁLVULAS', '2 Joelhos 90° + 2 CAPs', 'Dreno, respiro e torneira', $this->cAmber, $this->cAmberLight);

        // Desenho Linear de Corte dos Tubos de PVC
        $pvcCadY = 126;
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->SetLineWidth(1);
        $pdf->Rect(36, $pvcCadY, 770, 110, 'DF');

        $pdf->SetFont('dejavusans', 'B', 8.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(46, $pvcCadY + 12, 'DESENHO DE CORTE LINEAR DA BARRA DE PVC (6.000 mm)');

        $pvcRx = 46.0;
        $pvcRw = 740.0;
        $pvcRh = 22.0;
        $pvcScale = $pvcRw / 6000.0;

        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(...$this->cWaste);
        $pdf->SetLineWidth(0.8);
        $pdf->Rect($pvcRx, $pvcCadY + 28, $pvcRw, $pvcRh, 'DF');

        $curPx = $pvcRx;
        foreach ($pvc['cutItems'] ?? [] as $cIdx => $item) {
            for ($i = 0; $i < ($item['qty'] ?? 1); $i++) {
                $sw = $item['lengthMm'] * $pvcScale;
                $pal = $this->piecePalettes[$cIdx % count($this->piecePalettes)];

                $pdf->SetDrawColor(...$pal['stroke']);
                $pdf->SetFillColor(...$pal['fill']);
                $pdf->SetLineWidth(1);
                $pdf->Rect($curPx, $pvcCadY + 28, $sw, $pvcRh, 'DF');

                $pdf->SetDrawColor(239, 68, 68);
                $pdf->SetLineWidth(1.5);
                $pdf->Line($curPx + $sw, $pvcCadY + 28, $curPx + $sw, $pvcCadY + 28 + $pvcRh);

                $pdf->SetFont('dejavusans', 'B', 7);
                $pdf->SetTextColor(...$this->cTextMain);
                $pdf->Text($curPx + 4, $pvcCadY + 32, $item['label'] ?? '');

                $pdf->SetFont('dejavusans', '', 6.5);
                $pdf->SetTextColor(...$pal['text']);
                $pdf->Text($curPx + 4, $pvcCadY + 41, "{$item['lengthMm']} mm");

                $curPx += $sw + 3 * $pvcScale;
            }
        }

        $linMeters = number_format($pvc['totalLinearMeters'] ?? 0, 2, ',', '.');
        $wasteMeters = number_format(max(0, 6.0 - ($pvc['totalLinearMeters'] ?? 0)), 2, ',', '.');
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text($pvcRx, $pvcCadY + 68, "• Tubos Cortados: {$linMeters} m  |  Sobra da Barra: {$wasteMeters} m (Retalho aproveitável)");

        // Tabela de Tubos e Conexões
        $pTblY = 250;
        $pdf->SetFillColor(...$this->cPrimaryDark);
        $pdf->Rect(36, $pTblY, 770, 20, 'F');

        $headersPvc = [
            ['#', 42],
            ['Item / Conexão', 65],
            ['Especificação Técnica', 260],
            ['Comprimento / Bitola', 450],
            ['Quantidade', 590],
            ['Notas de Instalação', 670]
        ];
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(255, 255, 255);
        foreach ($headersPvc as [$th, $tx]) {
            $pdf->Text($tx, $pTblY + 5.5, $th);
        }

        $rPy = $pTblY + 22;
        foreach ($pvc['cutItems'] ?? [] as $idx => $item) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $rPy, 770, 18, 'DF');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(42, $rPy + 5, "T" . ($idx + 1));

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(65, $rPy + 5, $item['label'] ?? '');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(260, $rPy + 5, $item['spec'] ?? '');

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(450, $rPy + 5, ($item['lengthMm'] ?? 0) . ' mm');

            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(590, $rPy + 5, ($item['qty'] ?? 1) . ' un');

            $pdf->SetFont('dejavusans', '', 6.8);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(670, $rPy + 5, $item['notes'] ?? '');

            $rPy += 18;
        }

        foreach ($pvc['fittings'] ?? [] as $idx => $fitItem) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $rPy, 770, 18, 'DF');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(42, $rPy + 5, "C" . ($idx + 1));

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(65, $rPy + 5, $fitItem['label'] ?? '');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(260, $rPy + 5, $fitItem['spec'] ?? '');

            $pdf->SetFont('dejavusans', '', 7);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(450, $rPy + 5, "Ø " . ($pvc['diameterMm'] ?? 100) . " mm");

            $pdf->SetFont('dejavusans', 'B', 7);
            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(590, $rPy + 5, "{$fitItem['qty']} {$fitItem['unit']}");

            $pdf->SetFont('dejavusans', '', 6.8);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(670, $rPy + 5, $fitItem['notes'] ?? '');

            $rPy += 18;
        }

        // Recomendações Hidráulicas
        $pdf->SetFont('dejavusans', 'B', 7.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(36, 545, 'RECOMENDAÇÃO DE MONTAGEM: Lixar as pontas dos tubos e limpar com Solução Limpadora antes de aplicar o Adesivo Plástico PVC.');
        $pdf->SetFont('dejavusans', '', 7);
        $pdf->SetTextColor(...$this->cTextMuted);
        $pdf->Text(36, 557, 'Instalar respiro superior c/ tela anti-inseto e válvula de retenção na saída inferior para garantir vazão uniforme sem vácuo.');
    }

    // =========================================================================
    // PÁGINA: TOLDO RETRÁTIL OVERLAND
    // =========================================================================

    private function renderAwningPage(TCPDF $pdf, array $data, int $pageNum, int $totalPages): void
    {
        $awn = $data['awning'] ?? [];
        $pdf->AddPage('L', [842, 595]);
        $typeLabel = mb_strtoupper($awn['typeLabel'] ?? 'TOLDO RETRÁTIL');
        $sideLabel = $awn['sideLabel'] ?? 'Lado Passageiro';
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, "TOLDO RETRÁTIL OVERLAND — {$typeLabel}", "Ferragens e Plano de Corte Linear dos Perfis de Alumínio  •  {$sideLabel}");

        $awnY = 56;
        $cw = (770 - 30) / 4;

        $modTitle = str_contains($awn['typeLabel'] ?? '', '270') ? 'Asa de Morcego 270°' : 'Toldo Traseiro';
        $this->drawCard($pdf, 36, $awnY, $cw, 56, 'MODELO & FIXAÇÃO', $modTitle, $sideLabel, $this->cAmber, $this->cAmberLight);
        $this->drawCard($pdf, 36 + $cw + 10, $awnY, $cw, 56, 'PERFIS DE ALUMÍNIO', ($awn['totalProfilePieces'] ?? 0) . ' Cortes', number_format($awn['totalLinearMeters'] ?? 0, 2, ',', '.') . " m  •  {$awn['profilesWeightKg']} kg", $this->cPrimary, [224, 242, 254]);
        $this->drawCard($pdf, 36 + 2 * $cw + 20, $awnY, $cw, 56, 'BARRAS COMERCIAIS', count($awn['plan6m'] ?? []) . ' Barras de 6m', "Recomendado: Barras " . ($awn['recommendedBarOption'] ?? '6m'), $this->cEmerald, $this->cEmeraldLight);
        $this->drawCard($pdf, 36 + 3 * $cw + 30, $awnY, $cw, 56, 'PESO TOTAL CONJUNTO', ($awn['totalAwningWeightKg'] ?? 0) . ' kg Total', "Perfis: {$awn['profilesWeightKg']}kg | Ferragens: {$awn['fittingsWeightKg']}kg", [168, 85, 247], [250, 245, 255]);

        // Desenho Linear de Corte das Barras de Alumínio
        $awnCadY = 124;
        $pdf->SetDrawColor(...$this->cSlateBorder);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->SetLineWidth(1);
        $pdf->Rect(36, $awnCadY, 770, 114, 'DF');

        $pdf->SetFont('dejavusans', 'B', 8.5);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(46, $awnCadY + 10, 'DESENHO DE CORTE LINEAR DAS BARRAS DE ALUMÍNIO (BARRAS COMERCIAIS DE 6.000 mm)');

        $barYOffset = $awnCadY + 24;
        $scaleAwn = 740 / 6000.0;

        foreach ($awn['plan6m'] ?? [] as $bIdx => $bar) {
            $rx0 = 46.0;
            $rw = 740.0;
            $rh = 14.0;

            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$this->cWaste);
            $pdf->SetLineWidth(0.8);
            $pdf->Rect($rx0, $barYOffset, $rw, $rh, 'DF');

            $cx = $rx0;
            foreach ($bar['segments'] ?? [] as $cIdx => $seg) {
                if (!empty($seg['isWaste'])) {
                    continue;
                }
                $segW = $seg['lengthMm'] * $scaleAwn;
                $pal = $this->piecePalettes[$cIdx % count($this->piecePalettes)];

                $pdf->SetDrawColor(...$pal['stroke']);
                $pdf->SetFillColor(...$pal['fill']);
                $pdf->SetLineWidth(0.8);
                $pdf->Rect($cx, $barYOffset, $segW, $rh, 'DF');

                $pdf->SetDrawColor(239, 68, 68);
                $pdf->SetLineWidth(1.2);
                $pdf->Line($cx + $segW, $barYOffset, $cx + $segW, $barYOffset + $rh);

                if ($segW > 26) {
                    $lbl = $seg['label'] ?? '';
                    if (mb_strlen($lbl) > 16) {
                        $lbl = mb_substr($lbl, 0, 14) . '..';
                    }
                    $pdf->SetFont('dejavusans', '', 5.2);
                    $pdf->SetTextColor(...$this->cTextMain);
                    $pdf->Text($cx + 2, $barYOffset + 2, $lbl);

                    $pdf->SetFont('dejavusans', 'B', 5.2);
                    $pdf->SetTextColor(...$pal['text']);
                    $pdf->Text($cx + 2, $barYOffset + 7.5, "{$seg['lengthMm']}mm");
                }

                $cx += $segW + 3 * $scaleAwn;
            }

            $pdf->SetFont('dejavusans', 'B', 6.5);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text($rx0 + $rw - 60, $barYOffset + 3, sprintf("B#%d: %.0f%%", $bIdx + 1, $bar['efficiencyPct'] ?? 0));

            $barYOffset += 20;
        }

        // Tabelas: Perfis Cortados (à esquerda) e Ferragens (à direita)
        $tblY = $awnCadY + 122;

        // Header Perfis
        $pdf->SetFillColor(...$this->cPrimaryDark);
        $pdf->Rect(36, $tblY, 410, 20, 'F');
        $pdf->SetFont('dejavusans', 'B', 7.2);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Text(42, $tblY + 5.5, 'Peça / Perfil de Alumínio');
        $pdf->Text(230, $tblY + 5.5, 'Perfil Comercial');
        $pdf->Text(330, $tblY + 5.5, 'Compr.');
        $pdf->Text(380, $tblY + 5.5, 'Qtd');

        $ry1 = $tblY + 20;
        foreach ($awn['profileItems'] ?? [] as $idx => $pItem) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(36, $ry1, 410, 17, 'DF');

            $pdf->SetFont('dejavusans', 'B', 6.5);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(42, $ry1 + 4.5, mb_substr($pItem['label'] ?? '', 0, 26));

            $pdf->SetFont('dejavusans', '', 6.2);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(230, $ry1 + 4.5, mb_substr($pItem['spec'] ?? '', 0, 20));

            $pdf->SetFont('dejavusans', 'B', 6.5);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(330, $ry1 + 4.5, ($pItem['lengthMm'] ?? 0) . 'mm');

            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(385, $ry1 + 4.5, ($pItem['qty'] ?? 1) . ' un');

            $ry1 += 17;
        }

        // Header Ferragens
        $pdf->SetFillColor(109, 40, 217);
        $pdf->Rect(454, $tblY, 352, 20, 'F');
        $pdf->SetFont('dejavusans', 'B', 7.2);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Text(460, $tblY + 5.5, 'Ferragens, Mancais & Parafusos');
        $pdf->Text(660, $tblY + 5.5, 'Material');
        $pdf->Text(750, $tblY + 5.5, 'Qtd');

        $ry2 = $tblY + 20;
        foreach ($awn['fittings'] ?? [] as $idx => $fitItem) {
            $bg = ($idx % 2 === 0) ? $this->cBgPage : $this->cSlateBg;
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$bg);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(454, $ry2, 352, 17, 'DF');

            $pdf->SetFont('dejavusans', 'B', 6.5);
            $pdf->SetTextColor(...$this->cTextMain);
            $pdf->Text(460, $ry2 + 4.5, mb_substr($fitItem['label'] ?? '', 0, 30));

            $pdf->SetFont('dejavusans', '', 6.2);
            $pdf->SetTextColor(...$this->cTextMuted);
            $pdf->Text(660, $ry2 + 4.5, mb_substr($fitItem['material'] ?? '', 0, 16));

            $pdf->SetFont('dejavusans', 'B', 6.5);
            $pdf->SetTextColor(...$this->cAmber);
            $pdf->Text(755, $ry2 + 4.5, "{$fitItem['qty']} {$fitItem['unit']}");

            $ry2 += 17;
        }

        $pdf->SetFont('dejavusans', 'B', 7.2);
        $pdf->SetTextColor(...$this->cPrimaryDark);
        $pdf->Text(36, 550, 'RECOMENDAÇÃO OVERLAND: Lubrificante de Teflon (PTFE) nas buchas do pivô central 270°. Em ventos > 35 km/h, ancorar com estacas.');
    }

    // =========================================================================
    // PÁGINA: GUIA TÉCNICO DE OFICINA & ORDEM DOS CORTES
    // =========================================================================

    private function renderWorkshopGuidePage(TCPDF $pdf, array $data, int $pageNum, int $totalPages): void
    {
        $pdf->AddPage('L', [842, 595]);
        $this->drawHeaderFooter($pdf, $pageNum, $totalPages, 'GUIA DE OFICINA — SEQUÊNCIA DE CORTE, REFILO & MONTAGEM', 'Recomendações Práticas para Marceneiros, Serralheiros e Construtores');

        $steps = [
            [
                'PASSO 1: ESQUADREJAMENTO & REFILO DAS CHAPAS',
                "Antes de efetuar qualquer corte interno, execute o refilo de 10 mm em todo o perímetro da chapa de compensado naval de 2440 × 1220 mm. Isso elimina avarias de transporte, amassados e imperfeições de borda, garantindo que os ângulos de 90° estejam perfeitamente calibrados."
            ],
            [
                'PASSO 2: EXECUÇÃO DOS CORTES GUILHOTINA PRIMÁRIOS',
                "Seguindo o diagrama de corte de cada folha, execute primeiro os cortes longitudinais de ponta a ponta (cortes guilhotina primários). Eles dividem a chapa em faixas principais. Jamais tente cortar peças isoladas no meio da chapa sem respeitar a linha de passagem da serra."
            ],
            [
                'PASSO 3: CORTES SECUNDÁRIOS & SEPARAÇÃO INDIVIDUAL',
                "Com as faixas primárias cortadas, use o batente paralelo da esquadrejadeira regulado na cota exata da peça para fazer os cortes secundários. Sempre corte as peças maiores primeiro e guarde as sobras/retalhos devidamente identificados para peças menores posteriores."
            ],
            [
                'PASSO 4: FURAÇÕES PASSANTES CNC & ALÍVIO DE PESO',
                "Para os tampos do estrado da cama que possuem furação passante de alívio e ventilação: utilize uma Broca Forstner Ø 40 mm em furadeira de bancada ou centro de usinagem CNC com espaçamento de 85 mm. Isso previne o acúmulo de umidade sob o colchão de espuma D33."
            ],
            [
                'PASSO 5: RECORTE ESPECIAL DO ARMÁRIO AÉREO NA ESPUMA',
                "O corte em degrau do bloco de espuma D33 deve ser realizado após cortar o bloco nas medidas retangulares totais (1200 × 600 mm). Trace o encaixe com caneta marcadora e use a faca elétrica bem apoiada sobre guia de alumínio com ângulo rigorosamente vertical (90°)."
            ],
            [
                'PASSO 6: TRATAMENTO DAS BORDAS & IMPERMEABILIZAÇÃO',
                "Aplique fita de borda PVC 1,0 mm nas faces expostas dos módulos com cola PUR à prova d'água. Em seguida, aplique 1 demão de selador náutico e 2 demãos de verniz PU marítimo fosco/acetinado em todas as faces de compensado para imunização contra umidade e condensação veicular."
            ]
        ];

        $gy = 60;
        foreach ($steps as [$sTitle, $sDesc]) {
            $pdf->SetDrawColor(...$this->cSlateBorder);
            $pdf->SetFillColor(...$this->cSlateBg);
            $pdf->SetLineWidth(0.8);
            $pdf->Rect(36, $gy, 770, 70, 'DF');

            // Barra lateral colorida
            $pdf->SetFillColor(...$this->cPrimary);
            $pdf->Rect(36, $gy, 6, 70, 'F');

            $pdf->SetFont('dejavusans', 'B', 8.5);
            $pdf->SetTextColor(...$this->cPrimaryDark);
            $pdf->Text(50, $gy + 8, $sTitle);

            $pdf->SetFont('dejavusans', '', 7.3);
            $pdf->SetTextColor(...$this->cTextMain);
            // Quebra automática de texto usando MultiCell
            $pdf->SetXY(50, $gy + 22);
            $pdf->MultiCell(748, 12, $sDesc, 0, 'L', false);

            $gy += 76;
        }
    }

    // =========================================================================
    // ALGORITMO DE OTIMIZAÇÃO 1D (BEST-FIT DECREASING)
    // =========================================================================

    private function optimize1dBars(array $cutGroups, int $barLengthMm = 6000, int $kerfMm = 3): array
    {
        $byProfile = [];
        foreach ($cutGroups as $g) {
            $spec = $g['profileSpec'] ?? 'Perfil Alumínio';
            for ($i = 0; $i < ($g['qty'] ?? 1); $i++) {
                $byProfile[$spec][] = [
                    'label' => $g['label'] ?? 'Peça',
                    'lengthMm' => (int)($g['lengthMm'] ?? 0),
                    'profileSpec' => $spec
                ];
            }
        }

        $results = [];
        foreach ($byProfile as $spec => $items) {
            // Ordena decrescente
            usort($items, fn($a, $b) => $b['lengthMm'] <=> $a['lengthMm']);

            $bars = [];
            foreach ($items as $item) {
                $placed = false;
                foreach ($bars as &$bar) {
                    $addedKerf = !empty($bar['cuts']) ? $kerfMm : 0;
                    if ($bar['used_mm'] + $item['lengthMm'] + $addedKerf <= $barLengthMm) {
                        $bar['cuts'][] = $item;
                        $bar['used_mm'] += $item['lengthMm'] + $addedKerf;
                        $placed = true;
                        break;
                    }
                }
                unset($bar);

                if (!$placed) {
                    $bars[] = [
                        'cuts' => [$item],
                        'used_mm' => $item['lengthMm'],
                        'bar_length_mm' => $barLengthMm
                    ];
                }
            }

            foreach ($bars as &$bar) {
                $bar['waste_mm'] = $barLengthMm - $bar['used_mm'];
                $bar['efficiency_pct'] = ($bar['used_mm'] / (float)$barLengthMm) * 100.0;
            }
            unset($bar);

            $results[$spec] = $bars;
        }

        return $results;
    }
}
