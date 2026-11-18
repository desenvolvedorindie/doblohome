<?php

use yii\db\Migration;

class m260101_000000_init extends Migration
{
    public function safeUp()
    {
        $opt = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

        $this->createTable('user', [
            'id' => $this->primaryKey(),
            'email' => $this->string(190)->notNull()->unique(),
            'password_hash' => $this->string(255)->notNull(),
            'email_verified_at' => $this->dateTime()->null(),
            'verification_token_hash' => $this->string(64)->null(),
            'verification_expires_at' => $this->dateTime()->null(),
            'password_reset_token_hash' => $this->string(64)->null(),
            'password_reset_expires_at' => $this->dateTime()->null(),
            'created_at' => $this->dateTime()->notNull(),
            'updated_at' => $this->dateTime()->notNull(),
        ], $opt);
        $this->createIndex('idx_user_verif', 'user', 'verification_token_hash');
        $this->createIndex('idx_user_reset', 'user', 'password_reset_token_hash');

        $this->createTable('access_token', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'token_hash' => $this->string(64)->notNull()->unique(),
            'refresh_hash' => $this->string(64)->notNull()->unique(),
            'expires_at' => $this->dateTime()->notNull(),
            'refresh_expires_at' => $this->dateTime()->notNull(),
            'created_at' => $this->dateTime()->notNull(),
        ], $opt);
        $this->addForeignKey('fk_token_user', 'access_token', 'user_id', 'user', 'id', 'CASCADE');

        $this->createTable('project', [
            'id' => $this->string(64)->notNull(),
            'user_id' => $this->integer()->notNull(),
            'name' => $this->string(255)->notNull(),
            'description' => $this->text()->null(),
            'template_id' => $this->string(64)->null(),
            'modules_count' => $this->integer()->notNull()->defaultValue(0),
            'panels_count' => $this->integer()->notNull()->defaultValue(0),
            'tags' => $this->json()->null(),
            'data' => 'LONGTEXT NOT NULL',
            'version' => $this->integer()->notNull()->defaultValue(1),
            'client_updated_at' => $this->dateTime(3)->notNull(),
            'created_at' => $this->dateTime()->notNull(),
            'updated_at' => $this->dateTime()->notNull(),
            'deleted_at' => $this->dateTime()->null(),
            'PRIMARY KEY (user_id, id)',
        ], $opt);
        $this->addForeignKey('fk_project_user', 'project', 'user_id', 'user', 'id', 'CASCADE');

        // controle por tipo: updated em ms do cliente e id ativo
        $this->createTable('preset_state', [
            'user_id' => $this->integer()->notNull(),
            'type' => $this->string(32)->notNull(),
            'active_id' => $this->string(128)->null(),
            'client_updated_at' => $this->dateTime(3)->notNull(),
            'updated_at' => $this->dateTime()->notNull(),
            'PRIMARY KEY (user_id, type)',
        ], $opt);
        $this->addForeignKey('fk_pstate_user', 'preset_state', 'user_id', 'user', 'id', 'CASCADE');

        $types = require dirname(__DIR__) . '/config/preset_types.php';
        foreach ($types as $table) {
            $this->createTable($table, [
                'user_id' => $this->integer()->notNull(),
                'id' => $this->string(128)->notNull(),
                'name' => $this->string(255)->null(),
                'position' => $this->integer()->notNull()->defaultValue(0),
                'data' => 'LONGTEXT NOT NULL',
                'updated_at' => $this->dateTime()->notNull(),
                'PRIMARY KEY (user_id, id)',
            ], $opt);
            $this->addForeignKey("fk_{$table}_user", $table, 'user_id', 'user', 'id', 'CASCADE');
        }
    }

    public function safeDown()
    {
        $types = require dirname(__DIR__) . '/config/preset_types.php';
        foreach ($types as $table) {
            $this->dropTable($table);
        }
        $this->dropTable('preset_state');
        $this->dropTable('project');
        $this->dropTable('access_token');
        $this->dropTable('user');
    }
}
