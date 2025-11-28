export class CreateDeviceReadingRequest {
    deviceId: number;
    value: number;
    zoneId!: number;

    constructor(deviceId: number, value: number) {
        this.deviceId = deviceId;
        this.value = value;
    }

    toPayload() {
        return { deviceId: this.deviceId, value: this.value, zoneId: this.zoneId };
    }

    static fromBody(body: any) {
        const req = new CreateDeviceReadingRequest(Number(body.deviceId), Number(body.value));
        req.zoneId = Number(body.zoneId);
        return req;
    }
}

export const CreateDeviceReadingRequestSchema = {
    type: 'object',
    properties: {
        deviceId: { type: 'number', example: 1 },
        value: { type: 'number', example: 23.5 },
        zoneId: { type: 'number', example: 1 },
    },
    required: ['deviceId', 'value', 'zoneId'],
};
