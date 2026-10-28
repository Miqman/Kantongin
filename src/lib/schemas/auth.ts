import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginSchema = typeof loginSchema;
export type RegisterSchema = typeof registerSchema;
export type ForgotPasswordSchema = typeof forgotPasswordSchema;
export type UpdatePasswordSchema = typeof updatePasswordSchema;

