import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
  company: z.string().max(100).optional(),
  role: z.enum(['owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician', 'customer']).default('customer'),
});

export const updateUserSchema = createUserSchema.partial();

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  projectType: z.enum(['residential', 'commercial', 'industrial']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedBudget: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  targetCompletionDate: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  requirements: z.record(z.any()).default({}),
  materials: z.array(z.record(z.any())).default([]),
  notes: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']).optional(),
  actualCost: z.number().positive().optional(),
  actualCompletionDate: z.string().datetime().optional(),
});

// Quote schemas
export const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const createQuoteSchema = z.object({
  projectId: z.number().positive(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  validUntil: z.string().datetime(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).default(0.0825), // Default Texas sales tax
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
});

// Order schemas
export const createOrderSchema = z.object({
  userId: z.number().positive(),
  projectId: z.number().positive(),
  quoteId: z.number().positive().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('US'),
  }).optional(),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('US'),
  }).optional(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  taxRate: z.number().min(0).max(1).default(0.0825),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  status: z.enum(['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled']).optional(),
  amountPaid: z.number().min(0).optional(),
  actualDelivery: z.string().datetime().optional(),
});

// Material schemas
export const createMaterialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').max(100),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(50),
  currentStock: z.number().min(0, 'Current stock cannot be negative').default(0),
  minimumStock: z.number().min(0, 'Minimum stock cannot be negative').default(0),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative').default(0),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  markupPercentage: z.number().min(0, 'Markup percentage cannot be negative').max(999.99).default(0),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  supplierName: z.string().max(200).optional(),
  supplierContact: z.string().max(100).optional(),
  supplierEmail: z.string().email('Invalid supplier email format').optional(),
  leadTimeDays: z.number().int().min(0, 'Lead time cannot be negative').default(7),
  location: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  notes: z.string().optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const projectQuerySchema = paginationSchema.extend({
  status: z.enum(['inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']).optional(),
  projectType: z.enum(['residential', 'commercial', 'industrial']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  userId: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
  search: z.string().optional(),
});

export const quoteQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
  projectId: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
  userId: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
});

export const orderQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  projectId: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
  userId: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
  search: z.string().optional(),
});

export const materialQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  stockStatus: z.enum(['normal', 'low', 'critical']).optional(),
  supplierName: z.string().optional(),
  search: z.string().optional(),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'ID must be a positive integer'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;

export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type QuoteQueryInput = z.infer<typeof quoteQuerySchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialQueryInput = z.infer<typeof materialQuerySchema>;

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
