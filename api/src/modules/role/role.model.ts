import { z } from 'zod';
import { BaseDocument } from '../common/types';

export const roleCollection = 'roles';

export const roleScopeSchema = z.enum(['system', 'tenant']);

export type RoleScope = z.infer<typeof roleScopeSchema>;

export interface RoleDocument extends BaseDocument {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  scope: RoleScope;
}

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Role name should be kebab-case'),
  displayName: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string().min(1)).default([]),
  scope: roleScopeSchema.default('tenant')
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
