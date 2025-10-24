import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'HealthCheck',
    path: '/health',
    method: 'GET',
    emits: [],
    flows: ['system'],
    responseSchema: {
        200: z.object({
            status: z.string(),
            timestamp: z.string(),
            service: z.string(),
        }),
    },
};

export const handler: Handlers['HealthCheck'] = async () => {
    return {
        status: 200,
        body: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'motia',
        },
    };
};