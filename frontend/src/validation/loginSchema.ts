import * as yup from 'yup';

/**
 * Login form validation schema
 * 
 * Requirements:
 * - Email: Must be valid email format and required
 * - Password: Minimum 8 characters and required
 */
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required')
}).required();

export type LoginFormData = yup.InferType<typeof loginSchema>;
