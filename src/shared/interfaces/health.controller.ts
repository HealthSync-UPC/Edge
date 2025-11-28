import express from 'express';
import { AppDataSource } from '../database/data-source';
import { cloudStatus, headCloudRoot } from '../config/axiosClient';
import { tokenExists, tokenExpiresAt } from '../../auth/application/auth.service';
import { countPending } from '../../devices/application/devices.service';
import { logger } from '../utils/logger';
import { HealthResponse } from './responses/HealthResponse';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const uptime = Math.floor(process.uptime());

    let sqliteOk = false;
    try {
      await AppDataSource.query('SELECT 1');
      sqliteOk = true;
    } catch (e) {
      sqliteOk = false;
    }

    const pendingCount = await countPending();

    // Attempt HEAD to cloud (non-blocking if fails)
    try {
      await headCloudRoot();
    } catch (e) {
      logger.warn('Cloud HEAD failed', { err: String(e) });
    }

    const resp = HealthResponse.create(
      uptime,
      sqliteOk,
      pendingCount,
      { reachable: cloudStatus.reachable, lastStatus: cloudStatus.lastStatus, lastAttemptAt: cloudStatus.lastAttemptAt },
      { tokenExists: tokenExists(), tokenExpiresAt: tokenExpiresAt() },
    );
    return res.json(resp);
  } catch (err) {
    logger.error('Error in health check', { err: String(err) });
    return res.status(500).json({ error: 'internal' });
  }
});

export default router;
