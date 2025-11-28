import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../database/data-source';
import { logger } from '../utils/logger';

async function run() {
  try {
    await AppDataSource.initialize();
    logger.info('DB initialized (sync).');
    await AppDataSource.destroy();
  } catch (err) {
    logger.error('Failed to init DB', { err: String(err) });
    process.exit(1);
  }
}

run();
