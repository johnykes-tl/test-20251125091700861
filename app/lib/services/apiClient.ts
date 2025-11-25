interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = options.defaultHeaders || {
      'Content-Type': 'application/json'
    };
    this.timeout = options.timeout || 30000;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.baseUrl + endpoint;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      console.log(`🔗 API Request: ${config.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      console.log(`✅ API Success: ${config.method || 'GET'} ${endpoint}`);
      return data;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      console.error(`❌ API Error: ${config.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Real-time SSE connection
  connectRealTime(userId: string, userRole: string, onUpdate: (data: any) => void): () => void {
    const eventSource = new EventSource(
      `/api/real-time-updates?user_id=${userId}&user_role=${userRole}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Real-time update received:', data.type);
        onUpdate(data);
      } catch (error) {
        console.error('❌ Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE Connection error:', error);
    };

    // Return cleanup function
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => 
    apiClient.get<T>(endpoint, params),
  post: <T = any>(endpoint: string, data?: any) => 
    apiClient.post<T>(endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => 
    apiClient.put<T>(endpoint, data),
  delete: <T = any>(endpoint: string) => 
    apiClient.delete<T>(endpoint),
  connectRealTime: (userId: string, userRole: string, onUpdate: (data: any) => void) =>
    apiClient.connectRealTime(userId, userRole, onUpdate)
};

export default apiClient;