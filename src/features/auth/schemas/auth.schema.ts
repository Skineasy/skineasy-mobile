import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ message: 'validation.invalidEmail' }),
  password: z.string().min(6, { message: 'validation.passwordMin' }),
});

export const registerSchema = z
  .object({
    firstname: z.string().min(2, { message: 'validation.firstnameMin' }),
    lastname: z.string().min(2, { message: 'validation.lastnameMin' }),
    id_gender: z.number().min(1).max(3), // 1=Mr, 2=Mrs, 3=Other
    birthday: z.string().optional(),
    email: z.email({ message: 'validation.invalidEmail' }),
    password: z.string().min(6, { message: 'validation.passwordMin' }),
    confirmPassword: z.string().min(6, { message: 'validation.passwordMin' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

// Schema for step-by-step validation
export const step1Schema = z.object({
  firstname: z.string().min(2, { message: 'validation.firstnameMin' }),
  lastname: z.string().min(2, { message: 'validation.lastnameMin' }),
});

export const step2Schema = z.object({
  id_gender: z.number().min(1).max(3),
  birthday: z.string().optional(),
});

export const step3Schema = z
  .object({
    email: z.email({ message: 'validation.invalidEmail' }),
    password: z.string().min(6, { message: 'validation.passwordMin' }),
    confirmPassword: z.string().min(6, { message: 'validation.passwordMin' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// API request type - excludes confirmPassword which is only for client validation
export type RegisterApiInput = Omit<RegisterInput, 'confirmPassword'>;
