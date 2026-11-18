<?php

use yii\db\Migration;

/** Cadastro de cargas/consumo (equipamentos) por conta, compartilhado entre projetos. */
class m260102_000000_preset_loads extends Migration
{
    public function safeUp()
    {
        $this->createTable('preset_loads', [
            'user_id' => $this->integer()->notNull(),
            'id' => $this->string(128)->notNull(),
            'name' => $this->string(255)->null(),
            'position' => $this->integer()->notNull()->defaultValue(0),
            'data' => 'LONGTEXT NOT NULL',
            'updated_at' => $this->dateTime()->notNull(),
            'PRIMARY KEY (user_id, id)',
        ], 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $this->addForeignKey('fk_preset_loads_user', 'preset_loads', 'user_id', 'user', 'id', 'CASCADE');
    }

    public function safeDown()
    {
        $this->dropTable('preset_loads');
    }
}
