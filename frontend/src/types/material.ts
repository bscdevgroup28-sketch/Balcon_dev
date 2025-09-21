export interface Material {
  id: number;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  unitCost: number;
  markupPercentage: number;
  sellingPrice: number;
  supplierName?: string;
  supplierContact?: string;
  supplierEmail?: string;
  leadTimeDays: number;
  location?: string;
  status: 'active' | 'inactive' | 'discontinued';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialData {
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  currentStock?: number;
  minimumStock?: number;
  reorderPoint?: number;
  unitCost: number;
  markupPercentage?: number;
  sellingPrice?: number;
  supplierName?: string;
  supplierContact?: string;
  supplierEmail?: string;
  leadTimeDays?: number;
  location?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  notes?: string;
}

export interface UpdateMaterialData extends Partial<CreateMaterialData> {
  id: number;
}

export interface MaterialsResponse {
  data: Material[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MaterialQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  stockStatus?: 'normal' | 'low' | 'critical';
  supplierName?: string;
  search?: string;
}

export interface StockAdjustmentData {
  currentStock?: number;
  adjustment?: number;
  notes?: string;
}

export interface MaterialCategory {
  category: string;
  count: number;
}

export interface MaterialStats {
  totalMaterials: number;
  activeMaterials: number;
  lowStockMaterials: number;
  totalValue: number;
}