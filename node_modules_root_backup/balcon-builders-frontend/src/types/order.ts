export interface Order {
  id: number;
  quoteId?: number;
  projectId: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  shippingAddress?: string;
  specialInstructions?: string;
  userId: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
  project?: {
    id: number;
    title: string;
    projectType: string;
  };
  quote?: {
    id: number;
    totalAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  projectId: number;
  quoteId?: number;
  deliveryDate?: string;
  totalAmount: number;
  shippingAddress?: string;
  specialInstructions?: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
