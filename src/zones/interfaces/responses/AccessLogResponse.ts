export class AccessLogResponse {
    zoneId!: number;
    zoneName!: string;
    memberId!: number;
    memberFullName!: string;
    timestamp!: string;
    accessGranted!: boolean;

    static fromFields(fields: {
        zoneId: number;
        zoneName: string;
        memberId: number;
        memberFullName: string;
        timestamp: string;
        accessGranted: boolean;
    }) {
        const r = new AccessLogResponse();
        r.zoneId = fields.zoneId;
        r.zoneName = fields.zoneName;
        r.memberId = fields.memberId;
        r.memberFullName = fields.memberFullName;
        r.timestamp = fields.timestamp;
        r.accessGranted = fields.accessGranted;
        return r;
    }
}

export const AccessLogResponseSchema = {
    type: 'object',
    properties: {
        zoneId: { type: 'number' },
        zoneName: { type: 'string' },
        memberId: { type: 'number' },
        memberFullName: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        accessGranted: { type: 'boolean' },
    },
};

export const AccessLogForZoneSchema = {
    type: 'object',
    properties: {
        memberId: { type: 'number' },
        memberFullName: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        accessGranted: { type: 'boolean' },
    },
};
