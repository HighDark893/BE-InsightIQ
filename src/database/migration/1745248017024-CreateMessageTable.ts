import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageTable1745248017024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE message (
                id BIGINT NOT NULL AUTO_INCREMENT,
                sender ENUM('Chatbot', 'User') NOT NULL,
                content TEXT NOT NULL,
                chat_session_id BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(id),
                CONSTRAINT fk_chat_session_id FOREIGN KEY (chat_session_id) REFERENCES chat_session(id)
            )    
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
