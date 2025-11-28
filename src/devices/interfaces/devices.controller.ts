import express, { Request } from 'express';
import { saveReading, sendToCloudAndUpdate } from '../application/devices.service';
import { logger } from '../../shared/utils/logger';
import { AppDataSource } from '../../shared/database/data-source';
import { Device } from '../domain/Device';
import { Reading } from '../domain/Reading';
import { Zone } from '../../zones/domain/Zone';
import { CreateDeviceReadingRequest } from './requests/CreateDeviceReadingRequest';
import { DeviceResponse } from './responses/DeviceResponse';
import { ReadingResponse } from './responses/ReadingResponse';

const router = express.Router();

// GET /edge/devices -> list all devices stored locally
router.get('/', async (req, res) => {
  try {
    const deviceRepo = AppDataSource.getRepository(Device);
    const devices = await deviceRepo.find();
    const dtos = devices.map((d) => DeviceResponse.fromEntity(d));
    return res.json(dtos);
  } catch (err) {
    logger.error('Error in GET /edge/devices', { err: String(err) });
    return res.status(500).json({ error: 'internal' });
  }
});

// GET /edge/devices/readings -> list recent readings from local DB
router.get('/readings', async (req, res) => {
  try {
    const readingRepo = AppDataSource.getRepository(Reading);
    // support optional query params: ?limit=100
    const limit = parseInt(String(req.query.limit || '100'), 10) || 100;
    const readings = await readingRepo.find({ order: { id: 'DESC' }, take: limit });
    const dtos = readings.map((r) => ReadingResponse.fromEntity(r));
    return res.json(dtos);
  } catch (err) {
    logger.error('Error in GET /edge/devices/readings', { err: String(err) });
    return res.status(500).json({ error: 'internal' });
  }
});

// existing POST /readings (create reading)
router.post('/readings', async (req: Request<{}, {}, CreateDeviceReadingRequest>, res) => {
  try {
    const { deviceId, value, zoneId } = req.body as any;
    if (typeof deviceId !== 'number' || typeof value !== 'number' || typeof zoneId !== 'number') {
      return res.status(400).json({ error: 'deviceId, value and zoneId are required and must be numbers' });
    }
    // validate device exists locally
    const deviceRepo = AppDataSource.getRepository(Device);
    const device = await deviceRepo.findOneBy({ id: deviceId });
    if (!device) {
      return res.status(400).json({ error: 'device not found in local database' });
    }
    // don't allow readings for ACCESS_NFC devices
    if ((device.type ?? '').toUpperCase() === 'ACCESS_NFC') {
      return res.status(400).json({ error: 'readings not allowed for devices of type ACCESS_NFC' });
    }
    // validate zone exists locally
    const zoneRepo = AppDataSource.getRepository(Zone);
    const zone = await zoneRepo.findOneBy({ id: zoneId });
    if (!zone) {
      return res.status(400).json({ error: 'zone not found in local database' });
    }
    // validate device belongs to this zone
    if (device.zoneId === null || Number(device.zoneId) !== Number(zoneId)) {
      return res.status(400).json({ error: 'device does not belong to the provided zoneId' });
    }
    const reading = await saveReading({ deviceId, value, deviceType: device.type, zone });
    // try immediate send
    try {
      await sendToCloudAndUpdate(reading);
    } catch (e) {
      logger.warn('Immediate send failed', { id: reading.id });
    }
    const dto = ReadingResponse.fromEntity(reading);
    return res.status(201).json(dto);
  } catch (err) {
    logger.error('Error in POST /edge/devices/readings', { err: String(err) });
    return res.status(500).json({ error: 'internal' });
  }
});

export default router;
