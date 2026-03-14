/**
 * WhizSuite API Client
 * Centralized API communication layer
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { field: string; message: string }[];
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  workspaceId?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private workspaceId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  setWorkspaceId(id: string | null) {
    this.workspaceId = id;
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('workspaceId', id);
      } else {
        localStorage.removeItem('workspaceId');
      }
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  getWorkspaceId(): string | null {
    if (this.workspaceId) return this.workspaceId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('workspaceId');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, workspaceId } = options;

    const token = this.getAccessToken();
    const wsId = workspaceId || this.getWorkspaceId();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (wsId) {
      requestHeaders['X-Workspace-Id'] = wsId;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 - Token expired
        if (response.status === 401) {
          this.setAccessToken(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        throw new ApiError(data.error || 'Request failed', response.status, data.errors);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error. Please check your connection.', 0);
    }
  }

  // Generic methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload
  async uploadFile(endpoint: string, file: File, workspaceId?: string): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAccessToken();
    const wsId = workspaceId || this.getWorkspaceId();

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (wsId) headers['X-Workspace-Id'] = wsId;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return response.json();
  }

  async uploadFiles(endpoint: string, files: File[], workspaceId?: string): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const token = this.getAccessToken();
    const wsId = workspaceId || this.getWorkspaceId();

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (wsId) headers['X-Workspace-Id'] = wsId;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return response.json();
  }
}

export class ApiError extends Error {
  status: number;
  errors?: { field: string; message: string }[];

  constructor(message: string, status: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export const apiClient = api; // Alias for backwards compatibility

// Export types
export type { ApiResponse, PaginatedResponse, RequestOptions };


