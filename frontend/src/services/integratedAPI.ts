import { webSocketService } from './websocketService';
import { API_BASE_URL } from '../config/api';
// NOTE: Deprecated internal base URL logic removed. All code now sources API base via config/api.ts

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class IntegratedAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Initialize WebSocket connection
    this.initializeWebSocket();
  }

  // Authentication methods
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // JWT sent via httpOnly cookie automatically
    // No Authorization header needed

    return headers;
  }

  // Generic API call method
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // ✅ Enable cookies
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // WebSocket initialization
  private initializeWebSocket() {
    if (this.authToken) {
      webSocketService.connect(this.authToken);
    }
  }

  // Authentication API calls
  async login(email: string, password: string): Promise<APIResponse<{user: any, token: string}>> {
    const response = await this.apiCall<{user: any, token: string}>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
      this.initializeWebSocket();
    }

    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }): Promise<APIResponse<{user: any, token: string}>> {
    const response = await this.apiCall<{user: any, token: string}>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
      this.initializeWebSocket();
    }

    return response;
  }

  async logout(): Promise<APIResponse> {
    const response = await this.apiCall('/api/auth/logout', {
      method: 'POST',
    });

    this.clearAuthToken();
    webSocketService.disconnect();

    return response;
  }

  async getCurrentUser(): Promise<APIResponse<any>> {
    return this.apiCall('/api/auth/me');
  }

  async refreshToken(): Promise<APIResponse<{token: string}>> {
    const response = await this.apiCall<{token: string}>('/api/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  // Project Management API calls
  async getProjects(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{projects: any[], total: number}>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/projects${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async getProject(id: string): Promise<APIResponse<any>> {
    return this.apiCall(`/api/projects/${id}`);
  }

  async createProject(projectData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });

    // Emit real-time event for project creation
    if (response.success && response.data) {
      webSocketService.emit('project_update', {
        projectId: (response.data as any).id,
        update: response.data,
        activityType: 'project_created'
      });
    }

    return response;
  }

  async updateProject(id: string, projectData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });

    // Emit real-time event for project update
    if (response.success && response.data) {
      webSocketService.emit('project_update', {
        projectId: id,
        update: response.data,
        activityType: 'project_updated'
      });
    }

    return response;
  }

  async deleteProject(id: string): Promise<APIResponse> {
    const response = await this.apiCall(`/api/projects/${id}`, {
      method: 'DELETE',
    });

    // Emit real-time event for project deletion
    if (response.success) {
      webSocketService.emit('project_update', {
        projectId: id,
        update: { deleted: true },
        activityType: 'project_deleted'
      });
    }

    return response;
  }

  // Quote Management API calls
  async getQuotes(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{quotes: any[], total: number}>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/quotes${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async getQuote(id: string): Promise<APIResponse<any>> {
    return this.apiCall(`/api/quotes/${id}`);
  }

  async createQuote(quoteData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });

    // Note: Quote real-time events not implemented in backend yet
    // if (response.success) {
    //   webSocketService.emit('quote_update', {
    //     quoteId: response.data?.id,
    //     update: response.data,
    //     activityType: 'quote_created'
    //   });
    // }

    return response;
  }

  async updateQuote(id: string, quoteData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quoteData),
    });

    // Note: Quote real-time events not implemented in backend yet
    // if (response.success && response.data) {
    //   webSocketService.emit('quote_update', {
    //     quoteId: id,
    //     update: response.data,
    //     activityType: 'quote_updated'
    //   });
    // }

    return response;
  }

  // Material Management API calls
  async getMaterials(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string;
    status?: string;
    stockStatus?: string;
    supplierName?: string;
    search?: string;
  }): Promise<APIResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/materials${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async getMaterial(id: string): Promise<APIResponse<any>> {
    return this.apiCall(`/api/materials/${id}`);
  }

  async createMaterial(materialData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall('/api/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });

    // Note: Material real-time events not implemented in backend yet
    // if (response.success) {
    //   // Could emit notification for material creation
    // }

    return response;
  }

  async updateMaterial(id: string, materialData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });

    // Note: Material real-time events not implemented in backend yet
    // if (response.success && response.data) {
    //   // Could emit notification for material update
    // }

    return response;
  }

  async deleteMaterial(id: string): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/materials/${id}`, {
      method: 'DELETE',
    });

    // Note: Material real-time events not implemented in backend yet
    // if (response.success) {
    //   // Could emit notification for material deletion
    // }

    return response;
  }

  async getMaterialCategories(): Promise<APIResponse<string[]>> {
    return this.apiCall('/api/materials/categories');
  }

  async getLowStockMaterials(): Promise<APIResponse<any>> {
    return this.apiCall('/api/materials/low-stock');
  }

  async updateMaterialStock(id: string, stockData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/materials/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });

    // Note: Material real-time events not implemented in backend yet
    // if (response.success && response.data) {
    //   // Could emit notification for stock update
    // }

    return response;
  }

  // User Management API calls
  async getUsers(params?: {
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{users: any[], total: number}>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/users${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async getUser(id: string): Promise<APIResponse<any>> {
    return this.apiCall(`/api/users/${id}`);
  }

  async updateUser(id: string, userData: any): Promise<APIResponse<any>> {
    return this.apiCall(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async updateUserProfile(userData: any): Promise<APIResponse<any>> {
    return this.apiCall('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // File Management API calls
  async uploadFile(file: File, path?: string): Promise<APIResponse<{url: string, filename: string}>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (path) {
      formData.append('path', path);
    }

    try {
      const response = await fetch(`${this.baseURL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async getFiles(projectId?: string): Promise<APIResponse<any[]>> {
    const endpoint = projectId ? `/api/files?project=${projectId}` : '/api/files';
    return this.apiCall(endpoint);
  }

  async deleteFile(fileId: string): Promise<APIResponse> {
    return this.apiCall(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Analytics API calls
  async getAnalytics(timeRange?: string): Promise<APIResponse<any>> {
    const endpoint = timeRange ? `/api/analytics?range=${timeRange}` : '/api/analytics';
    return this.apiCall(endpoint);
  }

  async getDashboardMetrics(): Promise<APIResponse<any>> {
    return this.apiCall('/api/analytics/dashboard');
  }

  async getProjectAnalytics(projectId: string): Promise<APIResponse<any>> {
    return this.apiCall(`/api/analytics/projects/${projectId}`);
  }

  // Notification API calls
  async getNotifications(params?: {
    unread?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{notifications: any[], total: number}>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/notifications${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async markNotificationAsRead(id: string): Promise<APIResponse> {
    return this.apiCall(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<APIResponse> {
    return this.apiCall('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Real-time event subscriptions (adapted for current WebSocket implementation)
  subscribeToProjectUpdates(projectId: string, callback: (data: any) => void) {
    // Use the WebSocket context for project updates instead
    // webSocketService.on(`project:${projectId}:updated`, callback);
    // webSocketService.emit('join_project', projectId);
  }

  subscribeToNotifications(callback: (notification: any) => void) {
    // Notifications are handled through WebSocket context
    // webSocketService.on('notification', callback);
  }

  subscribeToAnalytics(callback: (data: any) => void) {
    // Analytics updates not implemented yet
    // webSocketService.on('analytics:updated', callback);
  }

  // Health check
  async healthCheck(): Promise<APIResponse<{status: string, timestamp: string}>> {
    return this.apiCall('/api/health');
  }

  // Error handling helper
  handleAPIError(error: any, defaultMessage: string = 'An error occurred') {
    if (error?.error === 'Unauthorized' || error?.error?.includes('401')) {
      this.clearAuthToken();
      webSocketService.disconnect();
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }

    console.error('API Error:', error);
    return error?.error || error?.message || defaultMessage;
  }
}

// Create singleton instance
export const integratedAPI = new IntegratedAPIService();
export default integratedAPI;
