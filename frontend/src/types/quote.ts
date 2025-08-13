export interface Quote {
  id: number;
  projectId: number;
  validUntil: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  terms?: string;
  notes?: string;
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
  items: QuoteItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  id: number;
  quoteId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: string;
}

export interface CreateQuoteData {
  projectId: number;
  validUntil: string;
  items: Omit<QuoteItem, 'id' | 'quoteId' | 'totalPrice'>[];
  terms?: string;
  notes?: string;
}

export interface QuotesResponse {
  data: Quote[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
