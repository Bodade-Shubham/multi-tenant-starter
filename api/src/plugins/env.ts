import fp from 'fastify-plugin';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    config: typeof env;
  }
}

const envPlugin = fp(async (fastify) => {
  fastify.decorate('config', env);
});

export default envPlugin;
