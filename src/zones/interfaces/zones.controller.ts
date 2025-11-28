import express from 'express';
import { getLocalZones, getLocalMembers, getAllZoneMemberRelations, logAccessAttempt, getAllAccessLogs, getAccessLogsForZone, sendAccessLogAndUpdate } from '../application/zones.service';
import { Zone } from '../domain/Zone';
import { Member } from '../domain/Member';
import { AppDataSource } from '../../shared/database/data-source';
import { ZoneResponse } from './responses/ZoneResponse';
import { MemberResponse } from './responses/MemberResponse';
import { logger } from '../../shared/utils/logger';

const router = express.Router();

router.get('', async (req, res) => {
    try {
        const zones = await getLocalZones();
        const zoneDtos = zones.map((z) => ZoneResponse.fromEntity(z as Zone));
        return res.json(zoneDtos);
    } catch (err) {
        logger.error('Error in GET /edge/zones', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});

// GET /edge/zones/members -> list local members only
router.get('/members', async (req, res) => {
    try {
        const members = await getLocalMembers();
        const memberDtos = members.map((m) => MemberResponse.fromEntity(m));
        return res.json(memberDtos);
    } catch (err) {
        logger.error('Error in GET /edge/zones/members', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});

// GET /edge/zones/members/relations -> list all zone-member relations
router.get('/members/relations', async (_req, res) => {
    try {
        const rels = await getAllZoneMemberRelations();
        return res.json(rels);
    } catch (err) {
        logger.error('Error in GET /edge/zones/members/relations', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});

// GET /edge/zones/access-logs -> list all access logs (with zone+member names)
router.get('/access-logs', async (_req, res) => {
    try {
        const logs = await getAllAccessLogs();
        return res.json(logs);
    } catch (err) {
        logger.error('Error in GET /edge/zones/access-logs', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});

// GET /edge/zones/:id/access-logs -> list access logs for a specific zone (no zoneId/zoneName)
router.get('/:id/access-logs', async (req, res) => {
    try {
        const zid = parseInt(String(req.params.id), 10);
        if (Number.isNaN(zid)) return res.status(400).json({ error: 'invalid zone id' });
        const logs = await getAccessLogsForZone(zid);
        return res.json(logs);
    } catch (err) {
        logger.error('Error in GET /edge/zones/:id/access-logs', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});

// POST /edge/zones/access-logs/try -> attempt access: body { zoneId, memberId }
router.post('/access-logs/try', async (req, res) => {
    try {
        const { zoneId, memberId } = req.body;
        if (typeof zoneId !== 'number' || typeof memberId !== 'number') return res.status(400).json({ error: 'zoneId and memberId are required and must be numbers' });
        // validate zone and member exist locally
        const zoneRepo = AppDataSource.getRepository(Zone);
        const memberRepo = AppDataSource.getRepository(Member);
        const zone = await zoneRepo.findOneBy({ id: zoneId });
        if (!zone) return res.status(400).json({ error: 'zone_not_found' });
        const member = await memberRepo.findOneBy({ id: memberId });
        if (!member) return res.status(400).json({ error: 'member_not_found' });

        const { dto, entity } = await logAccessAttempt(zoneId, memberId);
        try {
            await sendAccessLogAndUpdate(entity);
        } catch (e) {
            logger.warn('Immediate send failed', { id: entity.id });
        }

        return res.status(201).json(dto);
    } catch (err) {
        logger.error('Error in POST /edge/zones/access-logs/try', { err: String(err) });
        return res.status(500).json({ error: 'internal' });
    }
});



export default router;
