import type { Graph, Node, Edge, ServerGraph } from '../core';

// API Types matching the server
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateGraphRequest {
  title: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  metadata?: Record<string, any>;
  is_public: boolean;
}

export interface UpdateGraphRequest {
  title?: string;
  description?: string;
  nodes?: Node[];
  edges?: Edge[];
  metadata?: Record<string, any>;
  is_public?: boolean;
  message: string; // commit message
}

export interface SearchRequest {
  query: string;
  user_id?: string;
  is_public?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  graphs: ServerGraph[];
  total: number;
  has_more: boolean;
}

export interface GraphsResponse {
  graphs: ServerGraph[];
  total: number;
  has_more: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: Record<string, any>;
}

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL?: string) {
    // Use environment variable for API URL in production, fallback to localhost
    this.baseURL = baseURL || 
      import.meta.env.VITE_API_URL || 
      (import.meta.env.PROD ? 'https://your-api-domain.railway.app' : 'http://localhost:8080');
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    this.token = localStorage.getItem('tribal_token');
  }

  private saveTokenToStorage(token: string) {
    this.token = token;
    localStorage.setItem('tribal_token', token);
  }

  private clearTokenFromStorage() {
    this.token = null;
    localStorage.removeItem('tribal_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'network_error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw new Error(`${errorData.error}: ${errorData.message || 'Unknown error'}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.saveTokenToStorage(response.token);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.saveTokenToStorage(response.token);
    return response;
  }

  async logout(): Promise<void> {
    this.clearTokenFromStorage();
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/v1/auth/me');
  }

  // Graph methods
  async createGraph(data: CreateGraphRequest): Promise<ServerGraph> {
    return this.request<ServerGraph>('/api/v1/graphs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGraphs(limit = 20, offset = 0): Promise<GraphsResponse> {
    return this.request<GraphsResponse>(
      `/api/v1/graphs?limit=${limit}&offset=${offset}`
    );
  }

  async getGraph(id: string): Promise<ServerGraph> {
    return this.request<ServerGraph>(`/api/v1/graphs/${id}`);
  }

  async updateGraph(id: string, data: UpdateGraphRequest): Promise<ServerGraph> {
    return this.request<ServerGraph>(`/api/v1/graphs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGraph(id: string): Promise<void> {
    return this.request<void>(`/api/v1/graphs/${id}`, {
      method: 'DELETE',
    });
  }

  // Search methods
  async searchGraphs(data: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/v1/search/graphs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Public methods (no auth required)
  async getPublicGraphs(limit = 20, offset = 0): Promise<GraphsResponse> {
    return this.request<GraphsResponse>(
      `/api/v1/public/graphs?limit=${limit}&offset=${offset}`
    );
  }

  async getPublicGraph(id: string): Promise<ServerGraph> {
    return this.request<ServerGraph>(`/api/v1/public/graphs/${id}`);
  }

  // Graph sharing methods
  async shareGraph(
    graphId: string,
    userId: string,
    permission: 'read' | 'write' | 'admin'
  ): Promise<void> {
    return this.request<void>(`/api/v1/graphs/${graphId}/share`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, permission }),
    });
  }

  async getGraphShares(graphId: string): Promise<{ shares: any[] }> {
    return this.request<{ shares: any[] }>(`/api/v1/graphs/${graphId}/shares`);
  }

  async unshareGraph(graphId: string, userId: string): Promise<void> {
    return this.request<void>(`/api/v1/graphs/${graphId}/shares/${userId}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export types for easy importing
export type {
  Graph,
  Node,
  Edge,
  ServerGraph,
};

export default apiClient;