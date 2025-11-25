interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiClientOptions {
  timeout?: number;
  retries?: number;
  baseURL?: string;
}

class ApiClient {
  private timeout: number;
  private retries: number;
  private baseURL: string;

  constructor(options: ApiClientOptions = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retries = options.retries || 2;
    this.baseURL = options.baseURL || '';
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseURL + url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      // Retry logic for network errors
      if (attempt < this.retries && 
          (error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout'))) {
        
        console.warn(`🔄 API Request failed (attempt ${attempt}/${this.retries}), retrying...`, {
          url,
          error: error.message
        });
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return this.makeRequest<T>(url, options, attempt + 1);
      }

      return {
        success: false,
        error: error.message || 'Request failed'
      };
    }
  }

  async get<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  async post<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'DELETE'
    });
  }

  // Utility method for handling common response patterns
  extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    
    if (response.data === undefined) {
      throw new Error('API response missing data');
    }
    
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient({
  timeout: 30000,
  retries: 2,
  baseURL: '' // Uses relative URLs by default
});

// Export types for consumers
export type { ApiResponse };