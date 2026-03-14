import { z } from 'zod';

// Base schema without transform (for use in update schema)
const basePostSchema = z.object({
  brandId: z.string().min(1, 'Brand ID is required'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  postType: z.enum(['post', 'carousel', 'reel', 'trial_reel', 'story']).optional().default('post'),
  mediaIds: z.array(z.string()).optional().default([]),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  platformIds: z.array(z.string()).min(1, 'At least one platform is required'),
  socialAccountIds: z.array(z.string()).optional(), // Alias for platformIds (Postman compatibility)
  scheduledAt: z.string().datetime().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  mentions: z.array(z.string()).optional().default([]),
  coverUrl: z.string().url().optional().nullable(),
  altText: z.string().max(1000).optional(),
  shareToFeed: z.boolean().optional().default(true),
  trialGraduationStrategy: z.enum(['MANUAL', 'SS_PERFORMANCE']).optional().nullable(),
  // Reel-specific fields
  audioName: z.string().max(200).optional(),
  userTags: z.array(z.object({
    username: z.string(),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })).max(20).optional().default([]),
  locationId: z.string().optional(),
  collaborators: z.array(z.string()).max(3).optional().default([]),
  thumbOffset: z.number().int().min(0).optional(),
  platformVariations: z.record(z.string(), z.object({
    content: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
  })).optional(),
  platformOverrides: z.array(z.object({
    socialAccountId: z.string(),
    content: z.string().optional(),
  })).optional(),
});

// Create schema with transform
export const createPostSchema = basePostSchema.transform((data) => {
  // Transform socialAccountIds to platformIds if provided
  if (data.socialAccountIds && data.socialAccountIds.length > 0) {
    data.platformIds = data.platformIds || data.socialAccountIds;
  }
  // Transform platformOverrides to platformVariations
  if (data.platformOverrides && data.platformOverrides.length > 0) {
    const variations: Record<string, { content?: string }> = {};
    data.platformOverrides.forEach((override) => {
      variations[override.socialAccountId] = {
        content: override.content,
      };
    });
    data.platformVariations = { ...data.platformVariations, ...variations };
  }
  return data;
});

// Update schema - use base schema and apply transform separately if needed
export const updatePostSchema = basePostSchema.partial().omit({ brandId: true }).transform((data) => {
  // Apply same transformations for update
  if (data.socialAccountIds && data.socialAccountIds.length > 0) {
    data.platformIds = data.platformIds || data.socialAccountIds;
  }
  if (data.platformOverrides && data.platformOverrides.length > 0) {
    const variations: Record<string, { content?: string }> = {};
    data.platformOverrides.forEach((override) => {
      variations[override.socialAccountId] = {
        content: override.content,
      };
    });
    data.platformVariations = { ...data.platformVariations, ...variations };
  }
  return data;
});

export const bulkScheduleSchema = z.object({
  postIds: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type BulkScheduleInput = z.infer<typeof bulkScheduleSchema>;

