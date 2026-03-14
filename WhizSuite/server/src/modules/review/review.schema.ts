import { z } from 'zod';

export const createReviewLinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  postId: z.string().optional(), // Postman compatibility (singular)
  postIds: z.array(z.string()).optional(), // Our format (plural array)
  clientId: z.string().optional(),
  brandId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  allowComments: z.boolean().optional().default(true),
  allowApproval: z.boolean().optional().default(true),
  password: z.string().optional(),
}).transform((data) => {
  // Transform postId (singular) to postIds (array) if provided
  if (data.postId && !data.postIds) {
    data.postIds = [data.postId];
  }
  return data;
}).refine((data) => data.postIds && data.postIds.length > 0, {
  message: 'At least one post is required (postId or postIds)',
});

export const submitFeedbackSchema = z.object({
  postId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_CHANGES']),
  comment: z.string().optional(),
  reviewerName: z.string().optional(),
  reviewerEmail: z.string().email().optional(),
});

export type CreateReviewLinkInput = z.infer<typeof createReviewLinkSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

