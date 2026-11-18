<?php

namespace app\controllers\api;

use app\components\ApiController;
use app\models\AccessToken;
use app\models\User;
use Yii;

class AuthController extends ApiController
{
    protected array $publicActions = [
        'register', 'verify-email', 'resend-verification', 'login',
        'refresh', 'forgot-password', 'reset-password',
    ];

    private function validateEmail($email): ?string
    {
        $email = mb_strtolower(trim((string)$email));
        return filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($email) <= 190 ? $email : null;
    }

    private function validatePasswordRule($pw): ?string
    {
        $min = Yii::$app->params['minPasswordLength'];
        if (!is_string($pw) || strlen($pw) < $min) {
            return "A senha deve ter pelo menos $min caracteres.";
        }
        if (strlen($pw) > 200) return 'Senha muito longa.';
        return null;
    }

    private function sendMail(string $to, string $subject, string $html): void
    {
        try {
            Yii::$app->mailer->compose()
                ->setFrom([Yii::$app->params['senderEmail'] => Yii::$app->params['senderName']])
                ->setTo($to)->setSubject($subject)->setHtmlBody($html)->send();
        } catch (\Throwable $e) {
            Yii::error('Falha ao enviar e-mail: ' . $e->getMessage());
        }
    }

    private function sendVerification(User $u, string $token): void
    {
        $url = Yii::$app->params['frontendUrl'] . '/?verify=' . urlencode($token);
        $this->sendMail($u->email, 'Confirme seu e-mail - DobloHome Studio',
            '<p>Bem-vindo ao DobloHome Studio!</p><p><a href="' . $url . '">Confirmar meu e-mail</a></p>'
            . '<p>Se o botão não funcionar, copie: ' . $url . '</p><p>O link expira em 48 horas.</p>');
    }

    public function actionRegister()
    {
        $b = $this->body();
        $email = $this->validateEmail($b['email'] ?? '');
        if (!$email) return $this->fail(422, 'Dados inválidos.', ['email' => 'E-mail inválido.']);
        if ($err = $this->validatePasswordRule($b['password'] ?? null)) {
            return $this->fail(422, 'Dados inválidos.', ['password' => $err]);
        }
        $existing = User::findOne(['email' => $email]);
        if ($existing) {
            // não revela existência: se não verificado, reenvia confirmação
            if (!$existing->isVerified()) {
                $t = $existing->issueVerificationToken();
                $existing->updated_at = User::now();
                $existing->save(false);
                $this->sendVerification($existing, $t);
            }
            Yii::$app->response->statusCode = 202;
            return ['message' => 'Se o e-mail puder ser cadastrado, enviamos um link de confirmação.'];
        }
        $u = new User();
        $u->email = $email;
        $u->setPassword($b['password']);
        $u->created_at = $u->updated_at = User::now();
        $t = $u->issueVerificationToken();
        $u->save(false);
        $this->sendVerification($u, $t);
        Yii::$app->response->statusCode = 202;
        return ['message' => 'Se o e-mail puder ser cadastrado, enviamos um link de confirmação.'];
    }

    public function actionVerifyEmail()
    {
        $token = (string)($this->body()['token'] ?? '');
        $u = $token ? User::find()->where(['verification_token_hash' => User::hashToken($token)])
            ->andWhere(['>', 'verification_expires_at', User::now()])->one() : null;
        if (!$u) return $this->fail(400, 'Link de confirmação inválido ou expirado.');
        $u->email_verified_at = User::now();
        $u->verification_token_hash = null;
        $u->verification_expires_at = null;
        $u->updated_at = User::now();
        $u->save(false);
        return ['message' => 'E-mail confirmado. Você já pode entrar.'];
    }

    public function actionResendVerification()
    {
        $email = $this->validateEmail($this->body()['email'] ?? '');
        $u = $email ? User::findOne(['email' => $email]) : null;
        if ($u && !$u->isVerified()) {
            $t = $u->issueVerificationToken();
            $u->save(false);
            $this->sendVerification($u, $t);
        }
        return ['message' => 'Se houver uma conta pendente, enviamos um novo link.'];
    }

    public function actionLogin()
    {
        $b = $this->body();
        $email = $this->validateEmail($b['email'] ?? '');
        $u = $email ? User::findOne(['email' => $email]) : null;
        $pw = (string)($b['password'] ?? '');
        if (!$u || !$u->validatePassword($pw)) {
            return $this->fail(401, 'E-mail ou senha incorretos.');
        }
        if (!$u->isVerified()) {
            return $this->fail(403, 'Confirme seu e-mail antes de entrar.', ['code' => 'email_not_verified']);
        }
        return AccessToken::issueFor($u);
    }

    public function actionRefresh()
    {
        $r = (string)($this->body()['refreshToken'] ?? '');
        $row = $r ? AccessToken::find()->where(['refresh_hash' => User::hashToken($r)])
            ->andWhere(['>', 'refresh_expires_at', User::now()])->one() : null;
        $u = $row ? User::findOne($row->user_id) : null;
        if (!$u) return $this->fail(401, 'Sessão expirada. Faça login novamente.');
        $row->delete(); // refresh com rotação
        return AccessToken::issueFor($u);
    }

    public function actionLogout()
    {
        $h = Yii::$app->request->getHeaders()->get('Authorization', '');
        if (preg_match('/^Bearer\s+(.+)$/i', $h, $m)) {
            AccessToken::deleteAll(['token_hash' => User::hashToken($m[1])]);
        }
        Yii::$app->response->statusCode = 204;
        return null;
    }

    public function actionMe()
    {
        return ['user' => Yii::$app->user->identity->toApi()];
    }

    public function actionForgotPassword()
    {
        $email = $this->validateEmail($this->body()['email'] ?? '');
        $u = $email ? User::findOne(['email' => $email]) : null;
        if ($u && $u->isVerified()) {
            $t = $u->issueResetToken();
            $u->save(false);
            $url = Yii::$app->params['frontendUrl'] . '/?reset=' . urlencode($t);
            $this->sendMail($u->email, 'Recuperação de senha - DobloHome Studio',
                '<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="' . $url . '">Criar nova senha</a></p>'
                . '<p>Se o botão não funcionar, copie: ' . $url . '</p>'
                . '<p>O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>');
        }
        return ['message' => 'Se o e-mail existir, enviamos instruções para redefinir a senha.'];
    }

    public function actionResetPassword()
    {
        $b = $this->body();
        if ($err = $this->validatePasswordRule($b['password'] ?? null)) {
            return $this->fail(422, 'Dados inválidos.', ['password' => $err]);
        }
        $token = (string)($b['token'] ?? '');
        $u = $token ? User::find()->where(['password_reset_token_hash' => User::hashToken($token)])
            ->andWhere(['>', 'password_reset_expires_at', User::now()])->one() : null;
        if (!$u) return $this->fail(400, 'Link inválido ou expirado.');
        $u->setPassword($b['password']);
        $u->password_reset_token_hash = null;
        $u->password_reset_expires_at = null;
        $u->updated_at = User::now();
        $u->save(false);
        AccessToken::deleteAll(['user_id' => $u->id]); // encerra todas as sessões
        return ['message' => 'Senha redefinida. Faça login com a nova senha.'];
    }
}
