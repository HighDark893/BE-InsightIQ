import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserChatbot1746262374304 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE USER_CHATBOT (
                ID BIGINT NOT NULL AUTO_INCREMENT,
                TENANT_ID BIGINT NOT NULL,
                NAME VARCHAR(255) NOT NULL,
                PHONE_NUMBER VARCHAR(255) NOT NULL,
                PRIMARY KEY (ID),
                FOREIGN KEY (TENANT_ID) REFERENCES TENANT(ID)
            );
        `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
