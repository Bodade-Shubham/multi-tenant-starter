import { z } from 'zod';
import { BaseDocument } from '../common/types';

export const organisationCollection = 'tenants';

export const organisationStatuses = ['active', 'inactive', 'archived'] as const;

export const organisationStatusSchema = z.enum(organisationStatuses);

export type OrganisationStatus = z.infer<typeof organisationStatusSchema>;

export interface OrganisationDocument extends BaseDocument {
  name: string;
  code: string;
  status: OrganisationStatus;
}

export const createOrganisationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required'),
  code: z
    .string()
    .min(1, 'Organisation code is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Code may contain lowercase letters, numbers, and hyphens'
    ),
  status: organisationStatusSchema.default('active')
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;

export const updateOrganisationSchema = createOrganisationSchema.partial();

export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
