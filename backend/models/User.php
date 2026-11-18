<?php

namespace app\models;

use Yii;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

/**
 * @property int $id
 * @property string $email
 * @property string $password_hash
 * @property string|null $email_verified_at
 */
class User extends ActiveRecord implements IdentityInterface
{
    public static function tableName() { return 'user'; }

    public static function now(): string { return gmdate('Y-m-d H:i:s'); }

    public static function hashToken(string $t): string { return hash('sha256', $t); }

    public static function findIdentity($id) { return static::findOne($id); }

    public static function findIdentityByAccessToken($token, $type = null)
    {
        $row = AccessToken::find()
            ->where(['token_hash' => self::hashToken((string)$token)])
            ->andWhere(['>', 'expires_at', self::now()])->one();
        return $row ? static::findOne($row->user_id) : null;
    }

    public function getId() { return $this->id; }
    public function getAuthKey() { return null; }
    public function validateAuthKey($authKey) { return false; }

    public function validatePassword(string $p): bool
    {
        return Yii::$app->security->validatePassword($p, $this->password_hash);
    }

    public function setPassword(string $p): void
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($p);
    }

    public function isVerified(): bool { return $this->email_verified_at !== null; }

    /** Gera token de uso único, guarda o hash e devolve o valor em claro. */
    public function issueVerificationToken(): string
    {
        $t = Yii::$app->security->generateRandomString(48);
        $this->verification_token_hash = self::hashToken($t);
        $this->verification_expires_at = gmdate('Y-m-d H:i:s', time() + Yii::$app->params['verifyTokenTtl']);
        return $t;
    }

    public function issueResetToken(): string
    {
        $t = Yii::$app->security->generateRandomString(48);
        $this->password_reset_token_hash = self::hashToken($t);
        $this->password_reset_expires_at = gmdate('Y-m-d H:i:s', time() + Yii::$app->params['resetTokenTtl']);
        return $t;
    }

    public function toApi(): array
    {
        return ['id' => (int)$this->id, 'email' => $this->email, 'emailVerified' => $this->isVerified()];
    }
}
