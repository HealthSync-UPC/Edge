export class HealthResponse {
    uptime: number;
    sqlite: { ok: boolean; pendingCount: number };
    cloud: { reachable: boolean; lastStatus: number | null; lastAttemptAt: string | null };
    auth: { tokenExists: boolean; tokenExpiresAt: string | null };
    retries: { pending: number };

    constructor(
        uptime: number,
        sqliteOk: boolean,
        pendingCount: number,
        cloud: { reachable: boolean; lastStatus: number | null; lastAttemptAt: string | null },
        auth: { tokenExists: boolean; tokenExpiresAt: string | null },
    ) {
        this.uptime = uptime;
        this.sqlite = { ok: sqliteOk, pendingCount };
        this.cloud = cloud;
        this.auth = auth;
        this.retries = { pending: pendingCount };
    }

    static create(uptime: number, sqliteOk: boolean, pendingCount: number, cloud: any, auth: any) {
        return new HealthResponse(uptime, sqliteOk, pendingCount, {
            reachable: !!cloud?.reachable,
            lastStatus: cloud?.lastStatus ?? null,
            lastAttemptAt: cloud?.lastAttemptAt ?? null,
        }, {
            tokenExists: !!auth?.tokenExists,
            tokenExpiresAt: auth?.tokenExpiresAt ?? null,
        });
    }
}

export const HealthResponseSchema = {
    type: 'object',
    properties: {
        uptime: { type: 'number' },
        sqlite: {
            type: 'object',
            properties: { ok: { type: 'boolean' }, pendingCount: { type: 'number' } },
        },
        cloud: {
            type: 'object',
            properties: { reachable: { type: 'boolean' }, lastStatus: { type: ['number', 'null'] }, lastAttemptAt: { type: ['string', 'null'] } },
        },
        auth: {
            type: 'object',
            properties: { tokenExists: { type: 'boolean' }, tokenExpiresAt: { type: ['string', 'null'] } },
        },
        retries: { type: 'object', properties: { pending: { type: 'number' } } },
    },
};
