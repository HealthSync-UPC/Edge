import axios from 'axios';
import { env } from '../../shared/config/environment';
import { getTokenCache, setToken } from '../infrastructure/token.cache';
import { AppDataSource } from '../../shared/database/data-source';
import { Member } from '../../zones/domain/Member';
import { ZoneMember } from '../../zones/domain/ZoneMember';
import { Zone } from '../../zones/domain/Zone';
import { logger } from '../../shared/utils/logger';

function decodeJwt(token: string): any {
  const [, payload] = token.split('.');
  const json = Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(json);
}

export async function requestCloudToken() {
  const url = `${env.CLOUD_BASE_URL}/auth/sign-in`;

  const res = await axios.post(
    url,
    {
      email: env.CLOUD_EMAIL,
      password: env.CLOUD_PASSWORD,
    },
    {
      headers: {
        'x-Platform': 'edge',
      },
    }
  );

  const token = res.data?.token;
  if (!token) throw new Error('Cloud did not return token');

  const payload = decodeJwt(token);
  const expiresAt = payload?.exp
    ? new Date(payload.exp * 1000).toISOString()
    : new Date(Date.now() + 60 * 60 * 1000).toISOString();

  setToken(token, expiresAt);
  // If the token belongs to an ADMIN, ensure a Member exists and grant access to all zones
  try {
    const role = payload?.role;
    const uid = payload?.id ? Number(payload.id) : null;
    if (role === 'ADMIN' && uid) {
      const memberRepo = AppDataSource.getRepository(Member);
      const relRepo = AppDataSource.getRepository(ZoneMember);
      const zoneRepo = AppDataSource.getRepository(Zone);

      const existing = await memberRepo.findOneBy({ id: uid });
      if (!existing) {
        const m = memberRepo.create({ id: uid, fullName: 'ADMIN' } as Partial<Member>);
        await memberRepo.save(m);
      } else if (!existing.fullName) {
        existing.fullName = 'ADMIN';
        await memberRepo.save(existing);
      }

      // grant access to all zones
      const zones = await zoneRepo.find();
      for (const z of zones) {
        try {
          const existsRel = await relRepo.findOneBy({ zoneId: z.id, memberId: uid });
          if (!existsRel) {
            const rel = relRepo.create({ zoneId: z.id, memberId: uid } as Partial<ZoneMember>);
            await relRepo.save(rel);
          }
        } catch (e) {
          logger.warn('Failed saving admin zone-member relation', { zoneId: z.id, memberId: uid, err: String(e) });
        }
      }
    }
  } catch (e) {
    logger.warn('Failed creating admin member/relations after login', { err: String(e) });
  }
  return token;
}

export async function ensureToken() {
  const cached = getTokenCache();
  if (
    cached.token &&
    cached.expiresAt &&
    new Date(cached.expiresAt) > new Date()
  ) {
    return cached.token;
  }
  return requestCloudToken();
}

export async function ensureAdminMemberWithZonesFromCachedToken() {
  try {
    const cached = getTokenCache();
    if (!cached.token) return;
    const payload = decodeJwt(cached.token);
    const role = payload?.role;
    const uid = payload?.id ? Number(payload.id) : null;
    if (role !== 'ADMIN' || !uid) return;

    const memberRepo = AppDataSource.getRepository(Member);
    const relRepo = AppDataSource.getRepository(ZoneMember);
    const zoneRepo = AppDataSource.getRepository(Zone);

    const existing = await memberRepo.findOneBy({ id: uid });
    if (!existing) {
      const m = memberRepo.create({ id: uid, fullName: 'ADMIN' } as Partial<Member>);
      await memberRepo.save(m);
    } else if (!existing.fullName) {
      existing.fullName = 'ADMIN';
      await memberRepo.save(existing);
    }

    const zones = await zoneRepo.find();
    for (const z of zones) {
      try {
        const existsRel = await relRepo.findOneBy({ zoneId: z.id, memberId: uid });
        if (!existsRel) {
          const rel = relRepo.create({ zoneId: z.id, memberId: uid } as Partial<ZoneMember>);
          await relRepo.save(rel);
        }
      } catch (e) {
        logger.warn('Failed saving admin zone-member relation (ensure step)', { zoneId: z.id, memberId: uid, err: String(e) });
      }
    }
  } catch (e) {
    logger.warn('Failed ensuring admin member/relations from cached token', { err: String(e) });
  }
}

export function tokenExists() {
  const cached = getTokenCache();
  return !!(
    cached.token &&
    cached.expiresAt &&
    new Date(cached.expiresAt) > new Date()
  );
}

export function tokenExpiresAt(): string | null {
  const cached = getTokenCache();
  return cached.expiresAt;
}
