import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionPlanTable1745502355086
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                CREATE TABLE subscription_plan (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    price DECIMAL(10, 2) NOT NULL,
                    billing_cycle INT NOT NULL,
                    max_messages INT NOT NULL,
                    extra_cost DECIMAL(10, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY(id)
                )
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
