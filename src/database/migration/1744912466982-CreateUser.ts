import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1744912466982 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE USER (
                                                 ID BIGINT NOT NULL AUTO_INCREMENT,
                                                 EMAIL VARCHAR(255) UNIQUE,
                                                 PHONE_NUMBER VARCHAR(255) UNIQUE,
                                                 PASSWORD_HASH VARCHAR(255) UNIQUE,
                                                 PRIMARY KEY (ID)
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
