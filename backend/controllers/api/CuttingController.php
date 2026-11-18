<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\components\ApiController;
use app\components\CuttingPlanPdfService;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;

/**
 * Controller REST para geração e exportação de Plano de Corte em PDF via API.
 */
class CuttingController extends ApiController
{
    /** Endpoint público para visualização e download do PDF de corte */
    protected array $publicActions = ['*'];

    protected function verbs()
    {
        return [
            'pdf' => ['GET', 'POST', 'OPTIONS'],
        ];
    }

    /**
     * Gera e transmite o PDF do plano de corte diretamente como application/pdf.
     */
    public function actionPdf()
    {
        $rootPath = dirname(__DIR__, 3);
        $request = Yii::$app->request;

        $data = null;
        if ($request->isPost) {
            $rawBody = $request->getRawBody();
            if (!empty($rawBody)) {
                $decoded = json_decode($rawBody, true);
                if (is_array($decoded) && isset($decoded['wood'])) {
                    $data = $decoded;
                }
            }
        }

        // Se não veio no corpo do POST ou é GET, lê do cache do projeto em backend/runtime ou tmp/scripts
        if ($data === null) {
            $candidates = [
                Yii::getAlias('@runtime/cutting_data.json'),
                $rootPath . '/tmp/scripts/cutting_data.json',
                $rootPath . '/backend/runtime/cutting_data.json',
                dirname(__DIR__, 2) . '/runtime/cutting_data.json',
            ];
            foreach ($candidates as $candidate) {
                if ($candidate && file_exists($candidate)) {
                    $data = json_decode(file_get_contents($candidate), true);
                    if ($data && is_array($data) && isset($data['wood'])) {
                        break;
                    }
                }
            }
        }

        if (!$data || !is_array($data) || empty($data['wood'])) {
            throw new BadRequestHttpException('Dados do plano de corte indisponíveis. Forneça o JSON no corpo da requisição ou execute o exportador.');
        }

        $service = new CuttingPlanPdfService();
        $pdfContent = $service->generate($data);

        $response = Yii::$app->response;
        $response->format = Response::FORMAT_RAW;
        $response->headers->set('Content-Type', 'application/pdf');
        $response->headers->set('Content-Disposition', 'inline; filename="plano_de_corte_doblo_solar.pdf"');
        $response->headers->set('Content-Length', (string)strlen($pdfContent));
        $response->data = $pdfContent;

        return $response;
    }
}
