import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  CLOUD_BASE_URL: process.env.CLOUD_BASE_URL || '',
  CLOUD_EMAIL: process.env.CLOUD_EMAIL || '',
  CLOUD_PASSWORD: process.env.CLOUD_PASSWORD || '',
  PORT: Number(process.env.PORT || 3000),
  SQLITE_PATH: process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'edge.db'),
};
