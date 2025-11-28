import instance, { postToCloud } from '../../shared/config/axiosClient';
import { AppDataSource } from '../../shared/database/data-source';
import { logger } from '../../shared/utils/logger';
import { Zone } from '../domain/Zone';
import { Member } from '../domain/Member';
import { ZoneMember } from '../domain/ZoneMember';
import { AccessLog } from '../domain/AccessLog';
import { IsNull } from 'typeorm';

export async function getLocalMembers(): Promise<Member[]> {
    const repo = AppDataSource.getRepository(Member);
    return repo.find();
}

export async function syncMembersFromCloud() {
    try {
        const res = await instance.get('/profiles/all');
        const profiles = Array.isArray(res.data) ? res.data : [];
        const repo = AppDataSource.getRepository(Member);
        for (const p of profiles) {
            try {
                const idNum = Number(p.id);
                const fullName = `${p.firstName ?? ''}`.trim() + (p.lastName ? ` ${p.lastName}` : '');
                const toSave = repo.create({
                    id: idNum,
                    fullName: fullName,
                } as Partial<Member>);
                await repo.save(toSave);
            } catch (e) {
                logger.warn('Failed saving member', { id: p?.id, err: String(e) });
            }
        }
        logger.info('Members synced from cloud', { count: profiles.length });
        // After members are saved, create relationships by fetching zones from cloud
        try {
            const rz = await instance.get('/zones');
            const zones = Array.isArray(rz.data) ? rz.data : [];
            const relRepo = AppDataSource.getRepository(ZoneMember);
            for (const z of zones) {
                const zid = Number(z.id);
                const memberIds = Array.isArray(z.members) ? z.members.map((m: any) => Number(m.id)) : [];
                for (const mid of memberIds) {
                    try {
                        const exists = await relRepo.findOneBy({ zoneId: zid, memberId: mid });
                        if (exists) continue;
                        const rel = relRepo.create({ zoneId: zid, memberId: mid } as Partial<ZoneMember>);
                        await relRepo.save(rel);
                    } catch (e) {
                        logger.warn('Failed saving zone-member relation', { zoneId: zid, memberId: mid, err: String(e) });
                    }
                }
            }
        } catch (e) {
            logger.warn('Failed to create zone-member relations from cloud', { err: String(e) });
        }

        return profiles.length;
    } catch (err: any) {
        logger.warn('Failed to fetch members from cloud', { err: String(err) });
        return 0;
    }
}

export async function getMembersForZone(zoneId: number) {
    const relRepo = AppDataSource.getRepository(ZoneMember);
    const rels = await relRepo.find({ where: { zoneId } });
    const memberRepo = AppDataSource.getRepository(Member);
    const zoneRepo = AppDataSource.getRepository(Zone);

    const zone = await zoneRepo.findOneBy({ id: zoneId });
    const out: Array<{ zoneId: number; zoneName: string; memberId: number; memberFullName: string }> = [];
    for (const r of rels) {
        const member = await memberRepo.findOneBy({ id: r.memberId });
        out.push({ zoneId: zoneId, zoneName: zone?.name ?? '', memberId: r.memberId, memberFullName: member?.fullName ?? '' });
    }
    return out;
}

export async function getAllZoneMemberRelations() {
    const relRepo = AppDataSource.getRepository(ZoneMember);
    const rels = await relRepo.find();
    const memberRepo = AppDataSource.getRepository(Member);
    const zoneRepo = AppDataSource.getRepository(Zone);

    const out: Array<{ zoneId: number; zoneName: string; memberId: number; memberFullName: string }> = [];
    for (const r of rels) {
        const member = await memberRepo.findOneBy({ id: r.memberId });
        const zone = await zoneRepo.findOneBy({ id: r.zoneId });
        out.push({ zoneId: r.zoneId, zoneName: zone?.name ?? '', memberId: r.memberId, memberFullName: member?.fullName ?? '' });
    }
    return out;
}

export async function logAccessAttempt(zoneId: number, memberId: number) {
    const relRepo = AppDataSource.getRepository(ZoneMember);
    const exists = await relRepo.findOneBy({ zoneId, memberId });
    const granted = !!exists;

    const repo = AppDataSource.getRepository(AccessLog);
    const entry = repo.create({
        zoneId,
        memberId,
        timestamp: new Date().toISOString(),
        accessGranted: granted,
    } as Partial<AccessLog>);
    await repo.save(entry);

    // expand with names
    const memberRepo = AppDataSource.getRepository(Member);
    const zoneRepo = AppDataSource.getRepository(Zone);
    const member = await memberRepo.findOneBy({ id: memberId });
    const zone = await zoneRepo.findOneBy({ id: zoneId });

    return {
        dto: {
            zoneId: entry.zoneId,
            zoneName: zone?.name ?? '',
            memberId: entry.memberId,
            memberFullName: member?.fullName ?? '',
            timestamp: entry.timestamp,
            accessGranted: entry.accessGranted,
        }, entity: entry
    };
}

export async function getAllAccessLogs() {
    const repo = AppDataSource.getRepository(AccessLog);
    const entries = await repo.find({ order: { id: 'DESC' } });
    const out: Array<{ zoneId: number; zoneName: string; memberId: number; memberFullName: string; timestamp: string; accessGranted: boolean }> = [];
    const memberRepo = AppDataSource.getRepository(Member);
    const zoneRepo = AppDataSource.getRepository(Zone);
    for (const e of entries) {
        const member = await memberRepo.findOneBy({ id: e.memberId });
        const zone = await zoneRepo.findOneBy({ id: e.zoneId });
        out.push({ zoneId: e.zoneId, zoneName: zone?.name ?? '', memberId: e.memberId, memberFullName: member?.fullName ?? '', timestamp: e.timestamp, accessGranted: e.accessGranted });
    }
    return out;
}

export async function processPendingAccessLogsOnce() {
    const repo = AppDataSource.getRepository(AccessLog);
    const pending = await repo.find({ where: { sentAt: IsNull() }, order: { id: 'ASC' } });
    if (!pending || pending.length === 0) return 0;

    for (const p of pending) {
        // send one by one using helper
        await sendAccessLogAndUpdate(p);
    }

    return pending.length;
}

export async function sendAccessLogAndUpdate(entry: AccessLog) {
    const repo = AppDataSource.getRepository(AccessLog);
    try {
        const res = await postToCloud(`/zones/${entry.zoneId}/access`,
            { userId: entry.memberId },
            {
                validateStatus: (status) => status >= 200 && status < 600
            });
        if (res.status >= 200 && res.status < 500) {
            entry.sentAt = new Date().toISOString();
            await repo.save(entry);
            logger.info('Access log sent to cloud', { id: entry.id, status: res.status });
            return true;
        }
    } catch (err: any) {
        entry.retryCount = (entry.retryCount || 0) + 1;
        await repo.save(entry);
        logger.warn('Failed to send reading, incremented retryCount', { id: entry.id, retryCount: entry.retryCount });
    }
    return false;
}


export async function getAccessLogsForZone(zoneId: number) {
    const repo = AppDataSource.getRepository(AccessLog);
    const entries = await repo.find({ where: { zoneId }, order: { id: 'DESC' } });
    const out: Array<{ memberId: number; memberFullName: string; timestamp: string; accessGranted: boolean }> = [];
    const memberRepo = AppDataSource.getRepository(Member);
    for (const e of entries) {
        const member = await memberRepo.findOneBy({ id: e.memberId });
        out.push({ memberId: e.memberId, memberFullName: member?.fullName ?? '', timestamp: e.timestamp, accessGranted: e.accessGranted });
    }
    return out;
}

export async function getLocalZones(): Promise<Zone[]> {
    const repo = AppDataSource.getRepository(Zone);
    return repo.find();
}

export async function syncZonesFromCloud() {
    try {
        const res = await instance.get('/zones');
        const zones = Array.isArray(res.data) ? res.data : [];
        const repo = AppDataSource.getRepository(Zone);
        for (const z of zones) {
            try {
                const toSave = repo.create({
                    id: z.id,
                    name: z.name ?? '',
                    minTemperature: z.minTemperature ?? null,
                    maxTemperature: z.maxTemperature ?? null,
                    minHumidity: z.minHumidity ?? null,
                    maxHumidity: z.maxHumidity ?? null,
                    totalDevices: Array.isArray(z.devices) ? z.devices.length : 0,
                    totalMembers: Array.isArray(z.members) ? z.members.length : 0,
                } as Partial<Zone>);
                await repo.save(toSave);
            } catch (e) {
                logger.warn('Failed saving zone', { id: z?.id, err: String(e) });
            }
        }
        logger.info('Zones synced from cloud', { count: zones.length });
        return zones.length;
    } catch (err: any) {
        logger.warn('Failed to fetch zones from cloud', { err: String(err) });
        return 0;
    }
}
