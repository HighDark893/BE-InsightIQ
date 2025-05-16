import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToMessageIdInFeedbackTable1745402342858
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                ALTER TABLE feedback
                ADD CONSTRAINT unique_message_id UNIQUE (message_id);
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
