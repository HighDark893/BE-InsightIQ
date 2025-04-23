import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTable1745345121816 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE feedback (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    rating ENUM('Negative', 'Positive') NOT NULL,
                    comment TEXT,
                    message_id BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY(id),
                    CONSTRAINT fk_message_id FOREIGN KEY (message_id) REFERENCES message(id)
                )
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
