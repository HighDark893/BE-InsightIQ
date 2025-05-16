import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyInDocumentTable1746549010154
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                ALTER TABLE document
                ADD CONSTRAINT fk_document_tenant_id FOREIGN KEY (tenant_id) REFERENCES TENANT(ID)
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
