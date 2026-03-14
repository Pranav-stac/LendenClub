import { z } from 'zod';

// Base schema without transform
const baseBrandSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Brand name is required').max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  colorPrimary: z.string().optional(), // Postman compatibility alias
  colorSecondary: z.string().optional(), // Postman compatibility alias
  website: z.string().url().optional(),
  guidelines: z.string().optional(),
});

export const createBrandSchema = baseBrandSchema.transform((data) => {
  // Transform colorPrimary/colorSecondary to primaryColor/secondaryColor if provided
  return {
    ...data,
    primaryColor: data.primaryColor || data.colorPrimary,
    secondaryColor: data.secondaryColor || data.colorSecondary,
  };
});

export const updateBrandSchema = baseBrandSchema.omit({ clientId: true }).partial().transform((data) => {
  // Transform colorPrimary/colorSecondary to primaryColor/secondaryColor if provided
  if (data.colorPrimary || data.colorSecondary) {
    return {
      ...data,
      primaryColor: data.primaryColor || data.colorPrimary,
      secondaryColor: data.secondaryColor || data.colorSecondary,
    };
  }
  return data;
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

