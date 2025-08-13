export interface Project {
  id: number;
  title: string;
  description?: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  status: 'inquiry' | 'in_progress' | 'design' | 'review' | 'approved' | 'in_production' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  buildingSize?: number;
  estimatedValue?: number;
  startDate?: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  userId: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  buildingSize?: number;
  estimatedValue?: number;
  startDate?: string;
  targetCompletionDate?: string;
}

export interface ProjectsResponse {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
