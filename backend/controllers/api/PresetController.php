<?php

namespace app\controllers\api;

use app\components\ApiController;
use Yii;
use yii\db\Query;

/** Presets por tipo, cada um em tabela dedicada (config/preset_types.php). */
class PresetController extends ApiController
{
    const MAX_ITEMS = 500;
    const MAX_ITEM_BYTES = 512 * 1024;

    private function uid(): int { return (int)Yii::$app->user->id; }

    private function table(string $type): string
    {
        return (require Yii::getAlias('@app/config/preset_types.php'))[$type];
    }

    private function load(string $type): array
    {
        $uid = $this->uid();
        $rows = (new Query())->select(['data'])->from($this->table($type))
            ->where(['user_id' => $uid])->orderBy(['position' => SORT_ASC])->all();
        $state = (new Query())->from('preset_state')->where(['user_id' => $uid, 'type' => $type])->one();
        return [
            'type' => $type,
            'exists' => (bool)$state,
            'items' => array_map(fn($r) => json_decode($r['data']), $rows),
            'activeId' => $state['active_id'] ?? null,
            'updatedAt' => $state ? self::dbToIso($state['client_updated_at']) : null,
        ];
    }

    public function actionAll()
    {
        $out = [];
        foreach (array_keys(require Yii::getAlias('@app/config/preset_types.php')) as $t) {
            $out[$t] = $this->load($t);
        }
        return ['presets' => $out];
    }

    public function actionView($type)
    {
        return $this->load($type);
    }

    public function actionSave($type)
    {
        $b = $this->body();
        $items = $b['items'] ?? null;
        if (!is_array($items) || !array_is_list($items) || count($items) > self::MAX_ITEMS) {
            return $this->fail(422, 'Lista de itens invÃ¡lida.');
        }
        $objItems = $this->rawObject()->items ?? [];
        $rows = [];
        foreach ($items as $i => $it) {
            if (!is_array($it) || !isset($it['id']) || !is_string($it['id']) || $it['id'] === '' || strlen($it['id']) > 128) {
                return $this->fail(422, "Item $i sem id vÃ¡lido.");
            }
            if (isset($rows[$it['id']])) return $this->fail(422, "ID duplicado: {$it['id']}.");
            $json = json_encode($objItems[$i], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json === false || strlen($json) > self::MAX_ITEM_BYTES) return $this->fail(422, "Item {$it['id']} invÃ¡lido ou grande demais.");
            $rows[$it['id']] = [$i, isset($it['name']) && is_string($it['name']) ? mb_substr($it['name'], 0, 255) : null, $json];
        }
        $activeId = isset($b['activeId']) && is_string($b['activeId']) ? substr($b['activeId'], 0, 128) : null;
        $incoming = self::isoToDb($b['clientUpdatedAt'] ?? null) ?: gmdate('Y-m-d H:i:s.v');
        $uid = $this->uid();
        $table = $this->table($type);
        $db = Yii::$app->db;
        $now = gmdate('Y-m-d H:i:s');

        $conflict = $db->transaction(function () use ($db, $uid, $type, $table, $rows, $activeId, $incoming, $now) {
            $state = $db->createCommand('SELECT * FROM preset_state WHERE user_id=:u AND type=:t FOR UPDATE', [':u' => $uid, ':t' => $type])->queryOne();
            if ($state && strcmp(substr($state['client_updated_at'], 0, 23), substr($incoming, 0, 23)) > 0) {
                return true;
            }
            $ids = array_keys($rows);
            $del = ['and', ['user_id' => $uid]];
            if ($ids) $del[] = ['not in', 'id', $ids];
            $db->createCommand()->delete($table, $del)->execute();
            foreach ($rows as $id => [$pos, $name, $json]) {
                $db->createCommand(
                    "INSERT INTO `$table` (user_id,id,name,position,data,updated_at) VALUES (:u,:i,:n,:p,:d,:t)
                     ON DUPLICATE KEY UPDATE name=VALUES(name), position=VALUES(position), data=VALUES(data), updated_at=VALUES(updated_at)",
                    [':u' => $uid, ':i' => $id, ':n' => $name, ':p' => $pos, ':d' => $json, ':t' => $now]
                )->execute();
            }
            $db->createCommand(
                'INSERT INTO preset_state (user_id,type,active_id,client_updated_at,updated_at) VALUES (:u,:t,:a,:c,:n)
                 ON DUPLICATE KEY UPDATE active_id=VALUES(active_id), client_updated_at=VALUES(client_updated_at), updated_at=VALUES(updated_at)',
                [':u' => $uid, ':t' => $type, ':a' => $activeId, ':c' => $incoming, ':n' => $now]
            )->execute();
            return false;
        });

        if ($conflict) {
            Yii::$app->response->statusCode = 409;
            return ['error' => 'VersÃ£o do servidor Ã© mais recente.', 'conflict' => true] + $this->load($type);
        }
        return $this->load($type);
    }
}
