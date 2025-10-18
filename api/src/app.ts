import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
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

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
};
