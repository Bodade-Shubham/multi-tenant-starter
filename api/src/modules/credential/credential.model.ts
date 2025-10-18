import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { BaseDocument } from '../common/types';

export const credentialCollection = 'credentials';

export const credentialTypeSchema = z.enum(['password', 'api-key', 'refresh-token']);

export type CredentialType = z.infer<typeof credentialTypeSchema>;

export interface CredentialDocument extends BaseDocument {
  userId: ObjectId;
  type: CredentialType;
  secretHash: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export const createCredentialSchema = z.object({
  userId: z.instanceof(ObjectId),
  type: credentialTypeSchema,
  secretHash: z.string().min(1),
  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
  expiresAt: z.date().optional()
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;

export const updateCredentialSchema = z.object({
  secretHash: z.string().min(1).optional(),
  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
  expiresAt: z.date().optional()
});

export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
