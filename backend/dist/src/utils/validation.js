"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.materialQuerySchema = exports.orderQuerySchema = exports.quoteQuerySchema = exports.projectQuerySchema = exports.paginationSchema = exports.updateMaterialSchema = exports.createMaterialSchema = exports.updateOrderSchema = exports.createOrderSchema = exports.updateQuoteSchema = exports.createQuoteSchema = exports.quoteItemSchema = exports.updateProjectSchema = exports.createProjectSchema = exports.userLoginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').max(50),
    phone: zod_1.z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    company: zod_1.z.string().max(100).optional(),
    role: zod_1.z.enum(['owner', 'office_manager', 'shop_manager', 'project_manager', 'team_leader', 'technician', 'customer']).default('customer'),
});
exports.updateUserSchema = exports.createUserSchema.partial();
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
// Project schemas
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(5000),
    projectType: zod_1.z.enum(['residential', 'commercial', 'industrial']),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    estimatedBudget: zod_1.z.number().positive().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    targetCompletionDate: zod_1.z.string().datetime().optional(),
    location: zod_1.z.string().max(500).optional(),
    requirements: zod_1.z.record(zod_1.z.any()).default({}),
    materials: zod_1.z.array(zod_1.z.record(zod_1.z.any())).default([]),
    notes: zod_1.z.string().optional(),
});
exports.updateProjectSchema = exports.createProjectSchema.partial().extend({
    status: zod_1.z.enum(['inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']).optional(),
    actualCost: zod_1.z.number().positive().optional(),
    actualCompletionDate: zod_1.z.string().datetime().optional(),
});
// Quote schemas
exports.quoteItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Description is required'),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    unitPrice: zod_1.z.number().positive('Unit price must be positive'),
    unit: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.createQuoteSchema = zod_1.z.object({
    projectId: zod_1.z.number().positive(),
    items: zod_1.z.array(exports.quoteItemSchema).min(1, 'At least one item is required'),
    validUntil: zod_1.z.string().datetime(),
    terms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(1).default(0.0825), // Default Texas sales tax
});
exports.updateQuoteSchema = exports.createQuoteSchema.partial().extend({
    status: zod_1.z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
});
// Order schemas
exports.createOrderSchema = zod_1.z.object({
    userId: zod_1.z.number().positive(),
    projectId: zod_1.z.number().positive(),
    quoteId: zod_1.z.number().positive().optional(),
    items: zod_1.z.array(exports.quoteItemSchema).min(1, 'At least one item is required'),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    shippingAddress: zod_1.z.object({
        street: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(2).max(2),
        zipCode: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/),
        country: zod_1.z.string().default('US'),
    }).optional(),
    billingAddress: zod_1.z.object({
        street: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(2).max(2),
        zipCode: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/),
        country: zod_1.z.string().default('US'),
    }).optional(),
    paymentTerms: zod_1.z.string().max(200).optional(),
    notes: zod_1.z.string().optional(),
    estimatedDelivery: zod_1.z.string().datetime().optional(),
    taxRate: zod_1.z.number().min(0).max(1).default(0.0825),
});
exports.updateOrderSchema = exports.createOrderSchema.partial().extend({
    status: zod_1.z.enum(['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled']).optional(),
    amountPaid: zod_1.z.number().min(0).optional(),
    actualDelivery: zod_1.z.string().datetime().optional(),
});
// Material schemas
exports.createMaterialSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(200),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters').max(100),
    unitOfMeasure: zod_1.z.string().min(1, 'Unit of measure is required').max(50),
    currentStock: zod_1.z.number().min(0, 'Current stock cannot be negative').default(0),
    minimumStock: zod_1.z.number().min(0, 'Minimum stock cannot be negative').default(0),
    reorderPoint: zod_1.z.number().min(0, 'Reorder point cannot be negative').default(0),
    unitCost: zod_1.z.number().min(0, 'Unit cost cannot be negative'),
    markupPercentage: zod_1.z.number().min(0, 'Markup percentage cannot be negative').max(999.99).default(0),
    sellingPrice: zod_1.z.number().min(0, 'Selling price cannot be negative'),
    supplierName: zod_1.z.string().max(200).optional(),
    supplierContact: zod_1.z.string().max(100).optional(),
    supplierEmail: zod_1.z.string().email('Invalid supplier email format').optional(),
    leadTimeDays: zod_1.z.number().int().min(0, 'Lead time cannot be negative').default(7),
    location: zod_1.z.string().max(100).optional(),
    status: zod_1.z.enum(['active', 'inactive', 'discontinued']).default('active'),
    notes: zod_1.z.string().optional(),
});
exports.updateMaterialSchema = exports.createMaterialSchema.partial();
// Query schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').default('1'),
    limit: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').default('10'),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.projectQuerySchema = exports.paginationSchema.extend({
    status: zod_1.z.enum(['inquiry', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']).optional(),
    projectType: zod_1.z.enum(['residential', 'commercial', 'industrial']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    userId: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
    search: zod_1.z.string().optional(),
});
exports.quoteQuerySchema = exports.paginationSchema.extend({
    status: zod_1.z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
    projectId: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
    userId: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
});
exports.orderQuerySchema = exports.paginationSchema.extend({
    status: zod_1.z.enum(['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'completed', 'cancelled']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    projectId: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
    userId: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0).optional(),
    search: zod_1.z.string().optional(),
});
exports.materialQuerySchema = exports.paginationSchema.extend({
    category: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'discontinued']).optional(),
    stockStatus: zod_1.z.enum(['normal', 'low', 'critical']).optional(),
    supplierName: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
// ID parameter schema
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'ID must be a positive integer'),
});
