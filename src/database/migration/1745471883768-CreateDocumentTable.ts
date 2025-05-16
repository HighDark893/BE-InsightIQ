import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTable1745471883768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                CREATE TABLE document (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    file_name TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    tenant_id BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY(id)
                )
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
