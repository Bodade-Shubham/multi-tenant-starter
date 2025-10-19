import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export type JwtPayload = {
  sub: string;
  email: string;
  orgId?: string | null;
  roleId?: string | null;
  designationId?: string | null;
  sessionId: string;
  tokenType: 'access' | 'refresh';
};

const jwtPlugin = fp(async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: fastify.config.JWT_ACCESS_TTL
    }
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify<JwtPayload>();
      } catch (error) {
        return reply.unauthorized();
      }
    }
  );
});

export default jwtPlugin;
