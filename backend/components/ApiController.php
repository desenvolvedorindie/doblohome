<?php

namespace app\components;

use Yii;
use yii\filters\Cors;
use yii\filters\auth\HttpBearerAuth;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;

/** Base da API: JSON, CORS por whitelist e (opcionalmente) Bearer obrigatório. */
class ApiController extends Controller
{
    /** Ações públicas (sem token). Use ['*'] para todas. */
    protected array $publicActions = [];

    public function behaviors()
    {
        $b = parent::behaviors();
        unset($b['authenticator']);
        $b['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => Yii::$app->params['corsOrigins'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['Authorization', 'Content-Type'],
                'Access-Control-Max-Age' => 86400,
            ],
        ];
        $b['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'except' => $this->publicActions === ['*'] ? ['*'] : $this->publicActions,
            'optional' => [],
        ];
        // CORS deve rodar antes da autenticação
        return ['corsFilter' => $b['corsFilter'], 'authenticator' => $b['authenticator']] + $b;
    }

    protected function verbs()
    {
        return [];
    }

    protected function body(): array
    {
        $b = Yii::$app->request->getBodyParams();
        if (!is_array($b)) {
            throw new BadRequestHttpException('Corpo JSON inválido.');
        }
        return $b;
    }

    /** Corpo decodificado como objetos (preserva {} vs [] ao regravar JSON). */
    protected function rawObject(): ?\stdClass
    {
        $o = json_decode(Yii::$app->request->getRawBody(), false);
        return $o instanceof \stdClass ? $o : null;
    }

    protected function fail(int $status, string $message, array $errors = []): array
    {
        Yii::$app->response->statusCode = $status;
        return ['error' => $message, 'errors' => (object)$errors];
    }

    public static function isoToDb(?string $iso): ?string
    {
        if (!$iso) return null;
        try {
            $d = new \DateTimeImmutable($iso);
        } catch (\Throwable $e) {
            return null;
        }
        return $d->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
    }

    public static function dbToIso(?string $db): ?string
    {
        if (!$db) return null;
        $d = new \DateTimeImmutable($db, new \DateTimeZone('UTC'));
        return $d->format('Y-m-d\TH:i:s.v\Z');
    }
}
