<?php

declare(strict_types=1);

namespace app\commands;

use Yii;
use yii\console\Controller;
use yii\console\ExitCode;
use app\components\CuttingPlanPdfService;

/**
 * Comando de console para geração do Plano de Corte e Desenhos Técnicos em PDF.
 */
class CuttingController extends Controller
{
    /**
     * Gera o PDF completo do plano de corte a partir do arquivo JSON exportado.
     *
     * @param string|null $jsonPath Caminho do JSON com dados do corte (padrão: tmp/scripts/cutting_data.json)
     * @param string|null $outputPath Caminho de saída do PDF (padrão: plano_de_corte_doblo_solar.pdf)
     * @return int ExitCode
     */
    public function actionGeneratePdf(?string $jsonPath = null, ?string $outputPath = null): int
    {
        $rootPath = dirname(__DIR__, 2);
        
        $jsonFile = $jsonPath ? (is_file($jsonPath) ? $jsonPath : $rootPath . '/' . ltrim($jsonPath, '/\\')) : $rootPath . '/tmp/scripts/cutting_data.json';
        $outputFile = $outputPath ? (pathinfo($outputPath, PATHINFO_EXTENSION) ? $outputPath : $rootPath . '/' . ltrim($outputPath, '/\\')) : $rootPath . '/plano_de_corte_doblo_solar.pdf';

        if (!file_exists($jsonFile)) {
            $this->stdout("Arquivo JSON não encontrado: {$jsonFile}\n", \yii\helpers\Console::FG_RED);
            $this->stdout("Exportando dados do modelo 3D (vite-node tmp/scripts/export_cutting_data.ts)...\n");
            passthru('npx vite-node tmp/scripts/export_cutting_data.ts', $exitCode);
            if ($exitCode !== 0 || !file_exists($jsonFile)) {
                $this->stderr("Falha ao exportar cutting_data.json.\n");
                return ExitCode::UNSPECIFIED_ERROR;
            }
        }

        $this->stdout("Lendo dados de corte de: {$jsonFile}...\n");
        $jsonRaw = file_get_contents($jsonFile);
        $data = json_decode($jsonRaw, true);

        if (!$data || !is_array($data)) {
            $this->stderr("Erro ao decodificar JSON de corte.\n");
            return ExitCode::DATAERR;
        }

        $this->stdout("Gerando PDF com TCPDF em PHP...\n");
        $service = new CuttingPlanPdfService();
        $service->generate($data, $outputFile);

        if (file_exists($outputFile)) {
            $kb = number_format(filesize($outputFile) / 1024, 1, ',', '.');
            $this->stdout("PDF gerado com sucesso em: {$outputFile} ({$kb} KB)\n", \yii\helpers\Console::FG_GREEN);

            // Copia para public/ se existir
            $publicDir = $rootPath . '/public';
            if (is_dir($publicDir)) {
                $publicPdf = $publicDir . '/plano_de_corte_doblo_solar.pdf';
                copy($outputFile, $publicPdf);
                $this->stdout("Copiado para public: {$publicPdf}\n", \yii\helpers\Console::FG_CYAN);
            }

            // Copia para dist/ se existir
            $distDir = $rootPath . '/dist';
            if (is_dir($distDir)) {
                $distPdf = $distDir . '/plano_de_corte_doblo_solar.pdf';
                copy($outputFile, $distPdf);
                $this->stdout("Copiado para dist: {$distPdf}\n", \yii\helpers\Console::FG_CYAN);
            }

            return ExitCode::OK;
        }

        $this->stderr("Falha ao criar o arquivo PDF.\n");
        return ExitCode::UNSPECIFIED_ERROR;
    }
}
