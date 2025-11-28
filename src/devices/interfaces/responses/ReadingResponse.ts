import { Reading as ReadingEntity } from '../../domain/Reading';

export class ReadingResponse {
    id: number;
    deviceId: number;
    value: number;
    createdAt: string;
    sentAt: string | null;
    retryCount: number;
    alert: boolean;

    constructor(entity: ReadingEntity) {
        this.id = entity.id;
        this.deviceId = entity.deviceId;
        this.value = entity.value;
        this.createdAt = entity.createdAt;
        this.sentAt = entity.sentAt ?? null;
        this.retryCount = entity.retryCount ?? 0;
        this.alert = entity.alert ?? false;
    }

    static fromEntity(e: ReadingEntity) {
        return new ReadingResponse(e);
    }
}

export const Reading = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        deviceId: { type: 'number' },
        value: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        sentAt: { type: 'string', format: 'date-time' },
        retryCount: { type: 'number' },
        alert: { type: 'boolean' },
    },
};
