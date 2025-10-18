import fp from 'fastify-plugin';
import fastifyMongo, {
  FastifyMongoNestedObject,
  FastifyMongoObject
} from '@fastify/mongodb';
import { MongoClientOptions } from 'mongodb';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    mongo: FastifyMongoObject & FastifyMongoNestedObject;
  }
}

const mongoPlugin = fp(async (fastify) => {
  const options: MongoClientOptions = {
    monitorCommands: env.NODE_ENV !== 'production',
    maxPoolSize: 10
  };

  await fastify.register(fastifyMongo, {
    url: env.MONGO_URI,
    database: env.MONGO_DB_NAME,
    forceClose: true,
    ...options
  });
});

export default mongoPlugin;
