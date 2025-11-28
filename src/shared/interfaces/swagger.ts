import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { CreateDeviceReadingRequestSchema } from '../../devices/interfaces/requests/CreateDeviceReadingRequest';
import { DeviceResponseSchema } from '../../devices/interfaces/responses/DeviceResponse';
import { Reading as ReadingSchema } from '../../devices/interfaces/responses/ReadingResponse';
import { HealthResponseSchema } from './responses/HealthResponse';
import { ZoneResponseSchema } from '../../zones/interfaces/responses/ZoneResponse';
import { MemberResponseSchema } from '../../zones/interfaces/responses/MemberResponse';
import { AccessLogResponseSchema, AccessLogForZoneSchema } from '../../zones/interfaces/responses/AccessLogResponse';

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'MediTrack Edge API',
        description: 'API documentation for the MediTrack Edge service',
    },
    components: {
        schemas: {
            ReadingRequest: CreateDeviceReadingRequestSchema,
            Device: DeviceResponseSchema,
            Reading: ReadingSchema,
            Zone: ZoneResponseSchema,
            Member: MemberResponseSchema,
            AccessLog: AccessLogResponseSchema,
            AccessLogForZone: AccessLogForZoneSchema,
            CreatedResponse: ReadingSchema,
            HealthResponse: HealthResponseSchema,
            ZonesLocalResponse: {
                type: 'object',
                properties: {
                    zones: { type: 'array', items: { $ref: '#/components/schemas/Zone' } },
                    members: { type: 'array', items: { $ref: '#/components/schemas/Member' } },
                },
            },
        },
    },
    paths: {
        '/edge/zones': {
            get: {
                tags: ['Zones'],
                summary: 'List local zones',
                responses: {
                    '200': {
                        description: 'List of zones',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Zone' } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/zones/members/relations': {
            get: {
                tags: ['Zones'],
                summary: 'List all zone-member relations',
                responses: {
                    '200': {
                        description: 'List of relations',
                        content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { zoneId: { type: 'number' }, zoneName: { type: 'string' }, memberId: { type: 'number' }, memberFullName: { type: 'string' } } } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/zones/access-logs': {
            get: {
                tags: ['Zones'],
                summary: 'List all access logs',
                responses: {
                    '200': {
                        description: 'List of access logs',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AccessLog' } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/zones/{id}/access-logs': {
            get: {
                tags: ['Zones'],
                summary: 'List access logs for a zone',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                responses: {
                    '200': { description: 'List of access logs for zone', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AccessLogForZone' } } } } },
                    '400': { description: 'Bad request' },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/zones/access-logs/try': {
            post: {
                tags: ['Zones'],
                summary: 'Attempt access for a member to a zone',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { zoneId: { type: 'number' }, memberId: { type: 'number' } }, required: ['zoneId', 'memberId'] } } } },
                responses: {
                    '201': { description: 'Access attempt logged', content: { 'application/json': { schema: { $ref: '#/components/schemas/AccessLog' } } } },
                    '400': { description: 'Bad request' },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/devices/readings': {
            post: {
                tags: ['Devices'],
                summary: 'Save a device reading',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ReadingRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Created',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatedResponse' } } },
                    },
                    '400': { description: 'Bad request' },
                    '500': { description: 'Internal server error' },
                },
            },
            get: {
                tags: ['Devices'],
                summary: 'List readings stored locally',
                responses: {
                    '200': {
                        description: 'List of readings',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reading' } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/zones/members': {
            get: {
                tags: ['Zones'],
                summary: 'List members stored locally',
                responses: {
                    '200': {
                        description: 'List of members',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Member' } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/devices': {
            get: {
                tags: ['Devices'],
                summary: 'List devices stored locally',
                responses: {
                    '200': {
                        description: 'List of devices',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Device' } } } },
                    },
                    '500': { description: 'Internal server error' },
                },
            },
        },
        '/edge/health': {
            get: {
                tags: ['Health'],
                summary: 'Application status',
                responses: {
                    '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
                    '500': { description: 'Internal server error' },
                },
            },
        },
    },

};

export function setupSwagger(app: Express) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerDocument));
}
