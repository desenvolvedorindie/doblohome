<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property int $user_id
 * @property string $token_hash
 * @property string $refresh_hash
 * @property string $expires_at
 * @property string $refresh_expires_at
 */
class AccessToken extends ActiveRecord
{
    public static function tableName() { return 'access_token'; }

    /** Cria um par access/refresh para o usuário e devolve o payload da API. */
    public static function issueFor(User $user): array
    {
        $p = Yii::$app->params;
        $access = Yii::$app->security->generateRandomString(64);
        $refresh = Yii::$app->security->generateRandomString(64);
        $row = new self();
        $row->user_id = $user->id;
        $row->token_hash = User::hashToken($access);
        $row->refresh_hash = User::hashToken($refresh);
        $row->expires_at = gmdate('Y-m-d H:i:s', time() + $p['accessTokenTtl']);
        $row->refresh_expires_at = gmdate('Y-m-d H:i:s', time() + $p['refreshTokenTtl']);
        $row->created_at = User::now();
        $row->save(false);
        return [
            'accessToken' => $access,
            'refreshToken' => $refresh,
            'expiresAt' => gmdate('c', time() + $p['accessTokenTtl']),
            'user' => $user->toApi(),
        ];
    }
}
