import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { FastifyInstance } from 'fastify';
import envPlugin from './plugins/env';
import mongoPlugin from './plugins/mongodb';
import jwtPlugin from './plugins/jwt';
import authRoutes from './modules/auth/auth.routes';
import organisationRoutes from './modules/organisation/organisation.routes';

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  app.register(envPlugin);
  app.register(mongoPlugin);
  app.register(jwtPlugin);

  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(sensible);

  app.register(authRoutes, { prefix: '/auth' });
  app.register(organisationRoutes, { prefix: '/organisations' });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Multi-tenant Starter API',
        description:
          'API documentation for the multi-tenant SaaS starter backend.',
        version: '0.1.0'
      },
      tags: [
        { name: 'health', description: 'Service health endpoints' },
        { name: 'auth', description: 'Authentication and session management' },
        {
          name: 'organisations',
          description: 'Organisation management endpoints'
        },
        { name: 'users', description: 'User management within a tenant' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          AuthLoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 1 }
            },
            additionalProperties: false
          },
          AuthLoginUser: {
            type: 'object',
            required: [
              'id',
              'email',
              'status',
              'orgId',
              'roleId',
              'designationId',
              'mobileNumber',
              'lastLoginAt'
            ],
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'invited', 'suspended']
              },
              orgId: { type: ['string', 'null'] },
              roleId: { type: ['string', 'null'] },
              designationId: { type: ['string', 'null'] },
              mobileNumber: { type: ['string', 'null'] },
              lastLoginAt: { type: 'string', format: 'date-time' }
            }
          },
          AuthLoginResponse: {
            type: 'object',
            required: ['accessToken', 'refreshToken', 'user'],
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                $ref: '#/components/schemas/AuthLoginUser'
              }
            }
          },
          Organisation: {
            type: 'object',
            required: ['id', 'name', 'slug', 'status', 'createdAt', 'updatedAt'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: {
                type: 'string',
                pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'archived']
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          OrganisationListResponse: {
            type: 'object',
            required: ['data', 'count'],
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Organisation'
                }
              },
              count: { type: 'number' }
            }
          },
          OrganisationCreateRequest: {
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
                enum: ['active', 'inactive', 'archived']
              }
            },
            additionalProperties: false
          },
          OrganisationUpdateRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1 },
              slug: {
                type: 'string',
                pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'archived']
              }
            },
            additionalProperties: false
          },
          ErrorResponse: {
            type: 'object',
            required: ['statusCode', 'error', 'message'],
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      paths: {
        '/auth/login': {
          post: {
            summary: 'Login with email and password',
            tags: ['auth'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthLoginRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Login successful',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/AuthLoginResponse'
                    }
                  }
                }
              },
              '401': {
                description: 'Invalid credentials',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              },
              '403': {
                description: 'Account forbidden',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        },
        '/organisations': {
          get: {
            summary: 'List organisations',
            tags: ['organisations'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'status',
                in: 'query',
                schema: {
                  type: 'string',
                  enum: ['active', 'inactive', 'archived']
                },
                required: false,
                description: 'Filter organisations by status'
              }
            ],
            responses: {
              '200': {
                description: 'Organisations fetched successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/OrganisationListResponse'
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create organisation',
            tags: ['organisations'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/OrganisationCreateRequest'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Organisation created',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Organisation'
                    }
                  }
                }
              },
              '409': {
                description: 'Organisation slug already exists',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        },
        '/organisations/{id}': {
          get: {
            summary: 'Get organisation details',
            tags: ['organisations'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'Organisation retrieved',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Organisation'
                    }
                  }
                }
              },
              '404': {
                description: 'Organisation not found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          },
          patch: {
            summary: 'Update organisation',
            tags: ['organisations'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/OrganisationUpdateRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Organisation updated',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Organisation'
                    }
                  }
                }
              },
              '404': {
                description: 'Organisation not found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              },
              '409': {
                description: 'Organisation slug already exists',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          },
          delete: {
            summary: 'Delete organisation',
            tags: ['organisations'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: {
              '204': {
                description: 'Organisation deleted'
              },
              '404': {
                description: 'Organisation not found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
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

  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true
  });

  return app;
};
