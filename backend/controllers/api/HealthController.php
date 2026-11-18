<?php

namespace app\controllers\api;

use app\components\ApiController;

class HealthController extends ApiController
{
    protected array $publicActions = ['*'];

    public function actionIndex()
    {
        \Yii::$app->db->createCommand('SELECT 1')->execute();
        return ['status' => 'ok', 'time' => gmdate('c')];
    }

    public function actionOptions()
    {
        \Yii::$app->response->statusCode = 204;
        return null;
    }
}
