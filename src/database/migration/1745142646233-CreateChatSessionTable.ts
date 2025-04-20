import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatSessionTable1745142646233 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE chat_session (
            id BIGINT NOT NULL AUTO_INCREMENT,
            user_chatbot_id BIGINT NOT NULL,
            tenant_id BIGINT NOT NULL,
            session_token TEXT,
            PRIMARY KEY (id)
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
