import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'edge.db'),
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, '..', '..', '*', 'domain', '*.ts')],
  migrations: [],
});
