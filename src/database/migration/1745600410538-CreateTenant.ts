import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenant1745600410538 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE TENANT (
                 ID BIGINT NOT NULL AUTO_INCREMENT,
                 COMPANY_NAME VARCHAR(255) UNIQUE,
                 FULL_NAME VARCHAR(255) UNIQUE,
                 TAX_ID VARCHAR(255) UNIQUE,
                 STATUS ENUM('APPROVED', 'PENDING', 'DISABLED'),
                 PRIMARY KEY (ID),
                 USER_ID BIGINT NOT NULL UNIQUE,
                 FOREIGN KEY (USER_ID) REFERENCES USER(ID)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
