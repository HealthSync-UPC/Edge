import { Zone } from '../../../zones/domain/Zone';

export class ZoneResponse {
    id!: number;
    name!: string;
    minTemperature!: number | null;
    maxTemperature!: number | null;
    minHumidity!: number | null;
    maxHumidity!: number | null;
    totalDevices!: number | null;
    totalMembers!: number | null;

    static fromEntity(z: Zone): ZoneResponse {
        const r = new ZoneResponse();
        r.id = z.id;
        r.name = z.name ?? '';
        r.minTemperature = z.minTemperature ?? null;
        r.maxTemperature = z.maxTemperature ?? null;
        r.minHumidity = z.minHumidity ?? null;
        r.maxHumidity = z.maxHumidity ?? null;
        r.totalDevices = z.totalDevices ?? null;
        r.totalMembers = z.totalMembers ?? null;
        return r;
    }
}

export const ZoneResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Main Lab' },
        minTemperature: { type: 'number', nullable: true },
        maxTemperature: { type: 'number', nullable: true },
        minHumidity: { type: 'number', nullable: true },
        maxHumidity: { type: 'number', nullable: true },
        totalDevices: { type: 'number', nullable: true },
        totalMembers: { type: 'number', nullable: true },
    },
};
