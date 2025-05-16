import { DataSource } from "typeorm"
import path from 'node:path';

const pathDir = path.join(__dirname);

export const dataSource = new DataSource({
  type: "mariadb",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "my-secret-pw",
  database: "mydatabase",
  entities: [`${pathDir}/../entity/*.entity{.ts,.js}`],
  migrations: [`${pathDir}/../database/migration/*{.ts,.js}`],
  logging: false,
  synchronize: false,
  migrationsRun: true,
})

