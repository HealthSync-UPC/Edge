import { Device } from '../../domain/Device';

export class DeviceResponse {
    id: number;
    name: string;
    type: string;
    zoneId: number | null;
    zoneName: string | null;

    constructor(id: number, name: string, type: string, zoneId: number | null = null, zoneName: string | null = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.zoneId = zoneId;
        this.zoneName = zoneName;
    }

    static fromEntity(e: Device) {
        return new DeviceResponse(e.id, e.name, e.type, (e as any).zoneId ?? null, (e as any).zoneName ?? null);
    }
}

export const DeviceResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Temperature Sensor' },
        type: { type: 'string', example: 'TEMPERATURE' },
        zoneId: { type: 'number', nullable: true },
        zoneName: { type: 'string', nullable: true },
    },
    required: ['id', 'name', 'type'],
};
