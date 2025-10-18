import { z } from 'zod';
import { BaseDocument } from '../common/types';

export const designationCollection = 'designations';

export interface DesignationDocument extends BaseDocument {
  name: string;
  description?: string;
}

export const createDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required'),
  description: z.string().optional()
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

export const updateDesignationSchema = createDesignationSchema.partial();

export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
