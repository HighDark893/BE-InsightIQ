import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserChatbot1746262374304 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE USER_CHATBOT (
                ID BIGINT NOT NULL AUTO_INCREMENT,
                USER_ID BIGINT NOT NULL UNIQUE,
                TENANT_ID BIGINT NOT NULL,
                NAME VARCHAR(255) NOT NULL,
                PRIMARY KEY (ID),
                FOREIGN KEY (USER_ID) REFERENCES USER(ID),
                FOREIGN KEY (TENANT_ID) REFERENCES TENANT(ID)
            );
        `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
