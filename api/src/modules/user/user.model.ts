import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { BaseDocument } from '../common/types';

export const userCollection = 'users';

export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended']);

export type UserStatus = z.infer<typeof userStatusSchema>;

export interface UserDocument extends BaseDocument {
  orgId?: ObjectId;
  roleId?: ObjectId;
  designationId?: ObjectId;
  email: string;
  passwordHash: string;
  status: UserStatus;
  mobileNumber?: string;
  lastLoginAt?: Date;
}

const objectIdOptional = () => z.instanceof(ObjectId).optional();

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  status: userStatusSchema.default('active'),
  orgId: objectIdOptional(),
  roleId: objectIdOptional(),
  designationId: objectIdOptional(),
  mobileNumber: z
    .string()
    .regex(/^[0-9+\-() ]{7,20}$/, 'Mobile number format is invalid')
    .optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  status: userStatusSchema.optional(),
  mobileNumber: z
    .string()
    .regex(/^[0-9+\-() ]{7,20}$/, 'Mobile number format is invalid')
    .optional(),
  orgId: objectIdOptional(),
  roleId: objectIdOptional(),
  designationId: objectIdOptional()
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
