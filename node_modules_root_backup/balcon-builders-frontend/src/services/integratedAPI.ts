import { webSocketService } from './websocketService';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class IntegratedAPIService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = localStorage.getItem('authToken');
    
    // Initialize WebSocket connection
    this.initializeWebSocket();
  }

  // Authentication methods
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  private clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
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
    if (response.success) {
      webSocketService.send('project:created', response.data);
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
      webSocketService.send('project:updated', { id, ...response.data });
    }

    return response;
  }

  async deleteProject(id: string): Promise<APIResponse> {
    const response = await this.apiCall(`/api/projects/${id}`, {
      method: 'DELETE',
    });

    // Emit real-time event for project deletion
    if (response.success) {
      webSocketService.send('project:deleted', { id });
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

    if (response.success) {
      webSocketService.send('quote:created', response.data);
    }

    return response;
  }

  async updateQuote(id: string, quoteData: any): Promise<APIResponse<any>> {
    const response = await this.apiCall(`/api/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quoteData),
    });

    if (response.success && response.data) {
      webSocketService.send('quote:updated', { id, ...response.data });
    }

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

  // Real-time event subscriptions
  subscribeToProjectUpdates(projectId: string, callback: (data: any) => void) {
    webSocketService.on(`project:${projectId}:updated`, callback);
    webSocketService.send('subscribe:project', { projectId });
  }

  subscribeToNotifications(callback: (notification: any) => void) {
    webSocketService.on('notification:new', callback);
    webSocketService.send('subscribe:notifications');
  }

  subscribeToAnalytics(callback: (data: any) => void) {
    webSocketService.on('analytics:updated', callback);
    webSocketService.send('subscribe:analytics');
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
