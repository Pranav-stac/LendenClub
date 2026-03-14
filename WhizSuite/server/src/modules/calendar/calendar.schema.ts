import { z } from 'zod';

// Base schema without transform
const baseEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['POST', 'MEETING', 'DEADLINE', 'MILESTONE', 'REMINDER', 'OTHER']).optional(),
  startDate: z.string().datetime().optional(),
  startAt: z.string().datetime().optional(), // Alias for startDate (Postman compatibility)
  endDate: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(), // Alias for endDate (Postman compatibility)
  allDay: z.boolean().optional().default(false),
  brandId: z.string().optional(),
  clientId: z.string().optional(),
  postId: z.string().optional(),
  color: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const createEventSchema = baseEventSchema.refine((data) => data.startDate || data.startAt, {
  message: 'Either startDate or startAt is required',
}).transform((data) => {
  // Transform startAt/endAt to startDate/endDate if provided
  return {
    ...data,
    startDate: data.startDate || data.startAt,
    endDate: data.endDate || data.endAt,
  };
});

export const updateEventSchema = baseEventSchema.partial().transform((data) => {
  // Transform startAt/endAt to startDate/endDate if provided
  if (data.startAt || data.endAt) {
    return {
      ...data,
      startDate: data.startDate || data.startAt,
      endDate: data.endDate || data.endAt,
    };
  }
  return data;
});

export const getEventsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  brandId: z.string().optional(),
  clientId: z.string().optional(),
  type: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type GetEventsInput = z.infer<typeof getEventsSchema>;

