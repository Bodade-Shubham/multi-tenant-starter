import { FastifyPluginAsync } from 'fastify';
import '@fastify/jwt';
import {
  createOrganisationSchema,
  organisationStatuses,
  OrganisationStatus,
  updateOrganisationSchema
} from './organisation.model';
import { OrganisationRepository } from './organisation.repository';
import {
  InvalidOrganisationIdError,
  OrganisationNotFoundError,
  OrganisationResponse,
  OrganisationService,
  OrganisationSlugTakenError
} from './organisation.service';

const organisationResponseSchema = {
  $id: 'Organisation',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    status: { type: 'string', enum: organisationStatuses },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'name', 'slug', 'status', 'createdAt', 'updatedAt']
} as const;

const organisationListResponseSchema = {
  $id: 'OrganisationListResponse',
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        $ref: `${organisationResponseSchema.$id}#`
      }
    },
    count: { type: 'number' }
  },
  required: ['data', 'count']
} as const;

const createOrganisationBodySchema = {
  $id: 'OrganisationCreateRequest',
  type: 'object',
  required: ['name', 'slug'],
  properties: {
    name: { type: 'string', minLength: 1 },
    slug: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    },
    status: {
      type: 'string',
      enum: organisationStatuses
    }
  },
  additionalProperties: false
} as const;

const updateOrganisationBodySchema = {
  $id: 'OrganisationUpdateRequest',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    slug: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    },
    status: {
      type: 'string',
      enum: organisationStatuses
    }
  },
  additionalProperties: false
} as const;

const organisationRoutes: FastifyPluginAsync = async (app) => {
  if (!app.mongo.db) {
    throw app.httpErrors.internalServerError(
      'Database connection not initialised'
    );
  }

  const repository = new OrganisationRepository(app.mongo.db);
  const service = new OrganisationService(repository);

  const schemas = [
    organisationResponseSchema,
    organisationListResponseSchema,
    createOrganisationBodySchema,
    updateOrganisationBodySchema
  ];

  schemas.forEach((schema) => {
    if (!app.getSchema(schema.$id)) {
      app.addSchema(schema);
    }
  });

  const mapServiceError = (error: unknown): never => {
    if (error instanceof InvalidOrganisationIdError) {
      throw app.httpErrors.badRequest(error.message);
    }

    if (error instanceof OrganisationNotFoundError) {
      throw app.httpErrors.notFound(error.message);
    }

    if (error instanceof OrganisationSlugTakenError) {
      throw app.httpErrors.conflict(error.message);
    }

    throw error;
  };

  app.get<{
    Querystring: { status?: OrganisationStatus };
    Reply: { data: OrganisationResponse[]; count: number };
  }>(
    '/',
    {
      schema: {
        tags: ['organisations'],
        summary: 'List organisations',
        description: 'List organisations optionally filtered by status.',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: organisationStatuses }
          }
        },
        response: {
          200: {
            $ref: `${organisationListResponseSchema.$id}#`
          }
        },
        security: [{ bearerAuth: [] }]
      },
      onRequest: app.authenticate
    },
    async (request) => {
      try {
        const organisations = await service.list(request.query.status);
        return { data: organisations, count: organisations.length };
      } catch (error) {
        return mapServiceError(error);
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['organisations'],
        summary: 'Get organisation details',
        description: 'Retrieve organisation by id.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: {
            $ref: `${organisationResponseSchema.$id}#`
          }
        },
        security: [{ bearerAuth: [] }]
      },
      onRequest: app.authenticate
    },
    async (request) => {
      try {
        return await service.getById(request.params.id);
      } catch (error) {
        return mapServiceError(error);
      }
    }
  );

  app.post<{ Body: unknown }>(
    '/',
    {
      schema: {
        tags: ['organisations'],
        summary: 'Create organisation',
        description: 'Create a new organisation.',
        body: {
          $ref: `${createOrganisationBodySchema.$id}#`
        },
        response: {
          201: {
            $ref: `${organisationResponseSchema.$id}#`
          }
        },
        security: [{ bearerAuth: [] }]
      },
      onRequest: app.authenticate
    },
    async (request, reply) => {
      try {
        const body = createOrganisationSchema.parse(request.body);
        const organisation = await service.create(body);
        reply.code(201);
        return organisation;
      } catch (error) {
        return mapServiceError(error);
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    '/:id',
    {
      schema: {
        tags: ['organisations'],
        summary: 'Update organisation',
        description: 'Update an existing organisation.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          $ref: `${updateOrganisationBodySchema.$id}#`
        },
        response: {
          200: {
            $ref: `${organisationResponseSchema.$id}#`
          }
        },
        security: [{ bearerAuth: [] }]
      },
      onRequest: app.authenticate
    },
    async (request) => {
      try {
        const body = updateOrganisationSchema.parse(request.body);
        return await service.update(request.params.id, body);
      } catch (error) {
        return mapServiceError(error);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['organisations'],
        summary: 'Delete organisation',
        description: 'Delete organisation by id.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          204: { type: 'null' }
        },
        security: [{ bearerAuth: [] }]
      },
      onRequest: app.authenticate
    },
    async (request, reply) => {
      try {
        await service.delete(request.params.id);
        reply.code(204);
      } catch (error) {
        return mapServiceError(error);
      }
    }
  );
};

export default organisationRoutes;
