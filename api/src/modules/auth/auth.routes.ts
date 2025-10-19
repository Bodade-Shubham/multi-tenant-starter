import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';
import { Filter } from 'mongodb';
import { JwtPayload } from '../../plugins/jwt';
import { userCollection, UserDocument } from '../user/user.model';

type LoginBody = {
  email: string;
  password: string;
};

type LoginReply = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    status: UserDocument['status'];
    orgId: string | null;
    roleId: string | null;
    designationId: string | null;
    mobileNumber: string | null;
    lastLoginAt: string;
  };
};

const loginBodySchema = {
  $id: 'AuthLoginRequest',
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
} as const;

const loginReplySchema = {
  $id: 'AuthLoginResponse',
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        status: { type: 'string' },
        orgId: { type: ['string', 'null'] },
        roleId: { type: ['string', 'null'] },
        designationId: { type: ['string', 'null'] },
        mobileNumber: { type: ['string', 'null'] },
        lastLoginAt: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'email', 'status', 'orgId', 'roleId', 'designationId', 'mobileNumber', 'lastLoginAt']
    }
  },
  required: ['accessToken', 'refreshToken', 'user']
} as const;

const escapeForRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const authRoutes: FastifyPluginAsync = async (app) => {
  if (!app.getSchema(loginBodySchema.$id)) {
    app.addSchema(loginBodySchema);
  }

  if (!app.getSchema(loginReplySchema.$id)) {
    app.addSchema(loginReplySchema);
  }

  app.post<{ Body: LoginBody; Reply: LoginReply }>(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with email and password',
        description: 'Authenticate a user with email and password credentials.',
        body: {
          $ref: `${loginBodySchema.$id}#`
        },
        response: {
          200: {
            $ref: `${loginReplySchema.$id}#`
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { email, password } = request.body;

      if (!app.mongo.db) {
        request.log.error('MongoDB client not initialised');
        throw app.httpErrors.internalServerError(
          'Database connection not initialised'
        );
      }

      const usersCollectionRef = app.mongo.db.collection<UserDocument>(userCollection);

      const trimmedEmail = email.trim();
      const emailFilter: Filter<UserDocument> = { email: trimmedEmail };

      let user = await usersCollectionRef.findOne(emailFilter);

      if (!user && trimmedEmail !== '') {
        const caseInsensitiveFilter: Filter<UserDocument> = {
          email: new RegExp(`^${escapeForRegex(trimmedEmail)}$`, 'i')
        };

        user = await usersCollectionRef.findOne(caseInsensitiveFilter);
      }

      if (!user) {
        return reply.unauthorized('Invalid email or password');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return reply.unauthorized('Invalid email or password');
      }

      if (user.status !== 'active') {
        return reply.forbidden(`User is ${user.status}`);
      }

      const loginTime = new Date();
      const sessionId = randomUUID();

      const basePayload: Omit<JwtPayload, 'tokenType'> = {
        sub: user._id.toHexString(),
        email: user.email,
        orgId: user.orgId ? user.orgId.toHexString() : null,
        roleId: user.roleId ? user.roleId.toHexString() : null,
        designationId: user.designationId
          ? user.designationId.toHexString()
          : null,
        sessionId
      };

      const accessToken = app.jwt.sign({
        ...basePayload,
        tokenType: 'access'
      });

      const refreshToken = app.jwt.sign({
        ...basePayload,
        tokenType: 'refresh'
      }, {
        expiresIn: app.config.JWT_REFRESH_TTL,
        key: app.config.JWT_REFRESH_SECRET
      });

      await usersCollectionRef.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: loginTime, updatedAt: loginTime } }
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toHexString(),
          email: user.email,
          status: user.status,
          orgId: user.orgId ? user.orgId.toHexString() : null,
          roleId: user.roleId ? user.roleId.toHexString() : null,
          designationId: user.designationId
            ? user.designationId.toHexString()
            : null,
          mobileNumber: user.mobileNumber ?? null,
          lastLoginAt: loginTime.toISOString()
        }
      };
    }
  );
};

export default authRoutes;
