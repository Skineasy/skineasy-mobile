import { z } from 'zod';

export const editProfileSchema = z.object({
  firstname: z.string().min(2, 'First name must be at least 2 characters'),
  lastname: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Invalid email address'), // For display only, not sent to API
  birthday: z.string().optional(), // YYYY-MM-DD format
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;

// Type for API request (email is not editable)
export type UpdateProfileDto = Omit<EditProfileInput, 'email'>;
