import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import app from './shared/interfaces/app';
import { env } from './shared/config/environment';
import { AppDataSource } from './shared/database/data-source';
import { processPendingOnce, syncDevicesFromCloud } from './devices/application/devices.service';
import { syncZonesFromCloud, syncMembersFromCloud, processPendingAccessLogsOnce } from './zones/application/zones.service';
import { logger } from './shared/utils/logger';
import { ensureToken, ensureAdminMemberWithZonesFromCachedToken } from './auth/application/auth.service';
import path from 'path';
import fs from 'fs';

const PORT = env.PORT || 3000;

async function start() {
    try {
        const dbFolder = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbFolder)) {
            fs.mkdirSync(dbFolder, { recursive: true });
        }
        logger.info('Data directory ensured', { path: dbFolder });
    } catch (error) {
        logger.warn('Failed to create data directory', { err: String(error) });
    }

    try {
        await AppDataSource.initialize();
        logger.info('Database initialized');
    } catch (err) {
        logger.error('Failed to initialize database', { err: String(err) });
        process.exit(1);
    }

    //  Attempt login immediately 
    try {
        await ensureToken();
        logger.info('Cloud login ok');

        // Sync order: zones -> members (creates relations) -> devices (match by zone)
        try {
            const zcount = await syncZonesFromCloud();
            logger.info('Initial zones sync completed', { count: zcount });
            // After zones are available, ensure admin (from cached token) has access to all zones
            try {
                await ensureAdminMemberWithZonesFromCachedToken();
                logger.info('Ensured admin member and zone relations from cached token');
            } catch (e) {
                logger.warn('Failed ensuring admin relations after zone sync', { err: String(e) });
            }
        } catch (e) {
            logger.warn('Initial zones sync failed', { err: String(e) });
        }

        try {
            const mcount = await syncMembersFromCloud();
            logger.info('Initial members sync completed', { count: mcount });
        } catch (e) {
            logger.warn('Initial members sync failed', { err: String(e) });
        }

        try {
            const dcount = await syncDevicesFromCloud();
            logger.info('Initial devices sync completed', { count: dcount });
        } catch (e) {
            logger.warn('Initial devices sync failed', { err: String(e) });
        }

    } catch (err) {
        logger.error('Cloud login failed', { err: String(err) });
    }

    const server = app.listen(PORT, () => {
        logger.info('Server started', { port: PORT });
    });

    // Retry loop: every 5 seconds process pending readings (one by one inside service)
    setInterval(async () => {
        try {
            await processPendingOnce();
            await processPendingAccessLogsOnce();
        } catch (e) {
            logger.warn('Error in retry loop', { err: String(e) });
        }
    }, 5000);

    return server;
}

start().catch((e) => {
    logger.error('Start failed', { err: String(e) });
});
