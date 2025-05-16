import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSuperAdmin1745598361086 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE SUPERADMIN (
                 ID BIGINT NOT NULL AUTO_INCREMENT,
                 USERNAME VARCHAR(255) UNIQUE,
                 PRIMARY KEY (ID),
                 USER_ID BIGINT NOT NULL UNIQUE,
                 FOREIGN KEY (USER_ID) REFERENCES USER(ID) 
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
