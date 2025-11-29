import { AppDataSource } from '../../shared/database/data-source';
import { IsNull } from 'typeorm';
import { Reading } from '../domain/Reading';
import { postToCloud } from '../../shared/config/axiosClient';
import axiosInstance from '../../shared/config/axiosClient';
import { Device } from '../domain/Device';
import { Zone } from '../../zones/domain/Zone';
import { logger } from '../../shared/utils/logger';

const repo = () => AppDataSource.getRepository(Reading);

const repoDevice = () => AppDataSource.getRepository(Device);

export async function saveReading(payload: { deviceId: number; value: number; ts?: string; deviceType?: string; zone?: Zone }) {
  const now = new Date().toISOString();
  const reading = repo().create({
    deviceId: payload.deviceId,
    value: payload.value,
    createdAt: now,
    sentAt: null,
    retryCount: 0,
    alert: false,
  });

  // determine alert based on device type and zone ranges
  try {
    const deviceType = (payload.deviceType ?? '').toUpperCase();
    const zone = payload.zone;
    let isHumidity = false;
    const isGas = deviceType.includes('GAS');
    if (deviceType) {
      isHumidity = deviceType.includes('HUM');
    }
    // No generar alertas para dispositivos GAS
    if (zone && !isGas) {
      if (isHumidity) {
        const min = zone.minHumidity;
        const max = zone.maxHumidity;
        if ((typeof min === 'number' && payload.value < min) || (typeof max === 'number' && payload.value > max)) {
          reading.alert = true;
        }
      } else {
        const min = zone.minTemperature;
        const max = zone.maxTemperature;
        if ((typeof min === 'number' && payload.value < min) || (typeof max === 'number' && payload.value > max)) {
          reading.alert = true;
        }
      }
    }
  } catch (e) {
    logger.warn('Failed to compute alert for reading', { err: String(e) });
  }

  await repo().save(reading);
  return reading;
}

export async function sendToCloudAndUpdate(reading: Reading) {
  try {
    const res = await postToCloud('/devices/readings', {
      deviceId: reading.deviceId,
      value: reading.value,
    });
    if (res.status >= 200 && res.status < 300) {
      reading.sentAt = new Date().toISOString();
      await repo().save(reading);
      logger.info('Reading sent to cloud', { id: reading.id, status: res.status });
      return true;
    }
  } catch (err: any) {
    reading.retryCount = (reading.retryCount || 0) + 1;
    await repo().save(reading);
    logger.warn('Failed to send reading, incremented retryCount', { id: reading.id, retryCount: reading.retryCount });
  }
  return false;
}

export async function processPendingOnce() {
  const pending = await repo().find({ where: { sentAt: IsNull() }, order: { id: 'ASC' } });
  for (const p of pending) {
    // send one by one (no batch)
    await sendToCloudAndUpdate(p);
  }
}

export async function countPending() {
  return repo().count({ where: { sentAt: IsNull() } });
}

export async function syncDevicesFromCloud() {
  try {
    const res = await axiosInstance.get('/devices');
    const devices = Array.isArray(res.data) ? res.data : [];
    // load zones once to match by name
    const zoneRepo = AppDataSource.getRepository(Zone);
    const zones = await zoneRepo.find();

    for (const d of devices) {
      try {
        const location = d.location ?? '';
        const matched = zones.find((z) => (z.name ?? '').toLowerCase() === String(location).toLowerCase());
        const toSave = repoDevice().create({
          id: d.id,
          name: d.name ?? '',
          type: d.type ?? '',
          zoneId: matched ? matched.id : null,
          zoneName: matched ? matched.name : null,
        });
        await repoDevice().save(toSave);
      } catch (e) {
        logger.warn('Failed saving device', { id: d?.id, err: String(e) });
      }
    }
    logger.info('Devices synced from cloud', { count: devices.length });
    return devices.length;
  } catch (err: any) {
    logger.warn('Failed to fetch devices from cloud', { err: String(err) });
    return 0;
  }
}
