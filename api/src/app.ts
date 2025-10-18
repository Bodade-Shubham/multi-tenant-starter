import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { FastifyInstance } from 'fastify';
import envPlugin from './plugins/env';

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  app.register(envPlugin);

  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(sensible);

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Multi-tenant Starter API',
        description: 'API documentation for the multi-tenant SaaS starter backend.',
        version: '0.1.0'
      },
      tags: [
        { name: 'health', description: 'Service health endpoints' },
        { name: 'auth', description: 'Authentication and session management' },
        { name: 'tenants', description: 'Tenant management endpoints' },
        { name: 'users', description: 'User management within a tenant' }
      ]
    }
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true
  });

  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' }
            }
          }
        }
      }
    },
    async () => ({ status: 'ok' })
  );

  return app;
};
