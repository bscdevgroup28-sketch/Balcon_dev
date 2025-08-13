export type UserRole = 
  | 'owner' 
  | 'office_manager' 
  | 'shop_manager' 
  | 'project_manager' 
  | 'team_leader' 
  | 'technician'
  | 'admin'
  | 'user';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: UserRole;
  department?: string;
  permissions: string[];
  isDemo?: boolean;
  demoExpiresAt?: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
}
