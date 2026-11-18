<?php

namespace app\controllers\api;

use app\components\ApiController;
use Yii;
use yii\db\Query;

class ProjectController extends ApiController
{
    const MAX_DATA_BYTES = 8 * 1024 * 1024;

    private function uid(): int { return (int)Yii::$app->user->id; }

    private function meta(array $r): array
    {
        return [
            'id' => $r['id'],
            'name' => $r['name'],
            'description' => $r['description'] ?? '',
            'templateId' => $r['template_id'],
            'modulesCount' => (int)$r['modules_count'],
            'panelsCount' => (int)$r['panels_count'],
            'tags' => $r['tags'] ? json_decode($r['tags'], true) : [],
            'version' => (int)$r['version'],
            'createdAt' => self::dbToIso($r['created_at']),
            'updatedAt' => self::dbToIso($r['client_updated_at']),
            'serverUpdatedAt' => self::dbToIso($r['updated_at']),
            'deleted' => $r['deleted_at'] !== null,
        ];
    }

    /** GET /projects?since=ISO&includeDeleted=1 */
    public function actionIndex($since = null, $includeDeleted = null)
    {
        $q = (new Query())->from('project')->where(['user_id' => $this->uid()])->orderBy(['client_updated_at' => SORT_DESC]);
        if (!$includeDeleted) $q->andWhere(['deleted_at' => null]);
        if ($since && ($s = self::isoToDb($since))) $q->andWhere(['>', 'updated_at', substr($s, 0, 19)]);
        return ['projects' => array_map([$this, 'meta'], $q->all())];
    }

    public function actionView($id)
    {
        $r = (new Query())->from('project')->where(['user_id' => $this->uid(), 'id' => $id, 'deleted_at' => null])->one();
        if (!$r) return $this->fail(404, 'Projeto nÃ£o encontrado.');
        return ['project' => $this->meta($r) + ['data' => json_decode($r['data'])]];
    }

    public function actionSave($id)
    {
        $obj = $this->rawObject();
        $res = $this->upsert($id, $this->body(), $obj->data ?? null);
        if ($res['status'] === 'invalid') return $this->fail(422, $res['message']);
        if ($res['status'] === 'conflict') {
            Yii::$app->response->statusCode = 409;
            return ['error' => 'VersÃ£o do servidor Ã© mais recente.', 'conflict' => true, 'project' => $res['project']];
        }
        return ['project' => $res['project'], 'status' => $res['status']];
    }

    public function actionDelete($id, $clientUpdatedAt = null)
    {
        $when = self::isoToDb($clientUpdatedAt) ?: gmdate('Y-m-d H:i:s.v');
        $n = Yii::$app->db->createCommand()->update('project', [
            'deleted_at' => gmdate('Y-m-d H:i:s'),
            'client_updated_at' => $when,
            'updated_at' => gmdate('Y-m-d H:i:s'),
            'version' => new \yii\db\Expression('version + 1'),
        ], ['user_id' => $this->uid(), 'id' => $id, 'deleted_at' => null])->execute();
        if (!$n) return $this->fail(404, 'Projeto nÃ£o encontrado.');
        Yii::$app->response->statusCode = 204;
        return null;
    }

    /** POST /projects/import  {projects:[{id,name,...,data}]} */
    public function actionImport()
    {
        $list = $this->body()['projects'] ?? null;
        $objList = $this->rawObject()->projects ?? [];
        if (!is_array($list) || count($list) > 500) return $this->fail(422, 'Lista de projetos invÃ¡lida.');
        $out = [];
        foreach ($list as $n => $p) {
            $id = is_array($p) ? ($p['id'] ?? '') : '';
            $r = $this->upsert((string)$id, is_array($p) ? $p : [], $objList[$n]->data ?? null);
            $out[] = ['id' => $id, 'status' => $r['status'], 'version' => $r['project']['version'] ?? null];
        }
        return ['results' => $out];
    }

    private function upsert(string $id, array $b, $dataObj = null): array
    {
        if (!preg_match('/^[A-Za-z0-9_\-]{1,64}$/', $id)) return ['status' => 'invalid', 'message' => 'ID invÃ¡lido.'];
        $name = trim((string)($b['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 255) return ['status' => 'invalid', 'message' => 'Nome invÃ¡lido.'];
        if (!($dataObj instanceof \stdClass)) return ['status' => 'invalid', 'message' => 'Dados do projeto ausentes.'];
        $json = json_encode($dataObj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || strlen($json) > self::MAX_DATA_BYTES) return ['status' => 'invalid', 'message' => 'Dados do projeto grandes demais.'];

        $incoming = self::isoToDb($b['clientUpdatedAt'] ?? ($b['updatedAt'] ?? null)) ?: gmdate('Y-m-d H:i:s.v');
        $uid = $this->uid();
        $db = Yii::$app->db;
        $now = gmdate('Y-m-d H:i:s');
        $cfg = $b['data']['config'] ?? [];
        $panels = (int)($cfg['level1']['panels'] ?? 0) + (int)($cfg['level2']['panels'] ?? 0);
        $modules = is_array($b['data']['internalBoxes'] ?? null) ? count($b['data']['internalBoxes']) : 0;
        $tags = isset($b['tags']) && is_array($b['tags']) ? json_encode(array_values($b['tags'])) : null;

        return $db->transaction(function () use ($db, $uid, $id, $name, $b, $json, $incoming, $now, $panels, $modules, $tags) {
            $cur = $db->createCommand('SELECT * FROM project WHERE user_id=:u AND id=:i FOR UPDATE', [':u' => $uid, ':i' => $id])->queryOne();
            $fields = [
                'name' => $name,
                'description' => (string)($b['description'] ?? ''),
                'template_id' => isset($b['templateId']) ? substr((string)$b['templateId'], 0, 64) : null,
                'modules_count' => $modules,
                'panels_count' => $panels,
                'tags' => $tags,
                'data' => $json,
                'client_updated_at' => $incoming,
                'updated_at' => $now,
                'deleted_at' => null,
            ];
            if (!$cur) {
                $created = self::isoToDb($b['createdAt'] ?? null);
                $db->createCommand()->insert('project', $fields + [
                    'id' => $id, 'user_id' => $uid, 'version' => 1,
                    'created_at' => $created ? substr($created, 0, 19) : $now,
                ])->execute();
                $status = 'created';
            } else {
                // last-write-wins: mais novo no servidor => conflito, cliente adota o servidor
                if (strcmp(substr($cur['client_updated_at'], 0, 23), substr($incoming, 0, 23)) > 0) {
                    return ['status' => 'conflict', 'project' => $this->meta($cur) + ['data' => json_decode($cur['data'])]];
                }
                $db->createCommand()->update('project', $fields + ['version' => (int)$cur['version'] + 1],
                    ['user_id' => $uid, 'id' => $id])->execute();
                $status = 'updated';
            }
            $r = $db->createCommand('SELECT * FROM project WHERE user_id=:u AND id=:i', [':u' => $uid, ':i' => $id])->queryOne();
            return ['status' => $status, 'project' => $this->meta($r)];
        });
    }
}
