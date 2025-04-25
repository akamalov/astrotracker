import { useAuthStore } from '../stores/authStore'; // Import the store

// TODO: Replace hardcoded API URL with environment variable once the .env file blocking issue is resolved.
// Use import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Add default headers if needed, e.g., Content-Type
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  // Add Authorization header if token exists in the store
  const token = useAuthStore.getState().token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      // Attempt to parse error response from backend
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error('API Error Response:', errorData);
      throw new Error(
        `HTTP error! status: ${response.status} - ${
          errorData?.detail || response.statusText
        }`
      );
    }

    // Handle cases with no content response
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API Request Failed:', error);
    // Re-throw the error so callers can handle it
    throw error;
  }
}

// Example helper functions
export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string>, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'GET', params }),

  post: <T>(endpoint: string, body?: any, options: RequestOptions = {}) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    }),

  put: <T>(endpoint: string, body?: any, options: RequestOptions = {}) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    }),

  delete: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // Add patch, etc. as needed
};

// Example usage:
// import { apiClient } from './apiClient';
// const users = await apiClient.get('/users');
// const newUser = await apiClient.post('/users', { name: 'John Doe' }); 