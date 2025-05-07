import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from "axios";

// Get the API base URL from environment variables
// IMPORTANT: Vite exposes client-side env vars prefixed with VITE_
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Create an Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending/receiving cookies (like auth tokens)
});

// Optional: Add interceptors for request/response handling (e.g., adding auth tokens)
apiClient.interceptors.request.use(
  (config) => {
    // Example: Add Authorization header if a token exists (we'll manage token later)
    // const token = localStorage.getItem("authToken"); 
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Export the apiClient instance
export default apiClient;

// --- Separate API Functions ---

// Add a type for the chart creation payload
interface CreateChartPayload {
    name: string;
    birth_datetime: string; // ISO-like string (YYYY-MM-DDTHH:MM:SS)
    city: string;
    location_name: string | null;
}

// Function to create a chart
export const createChart = async (data: CreateChartPayload) => {
    try {
        // Use the configured apiClient instance for the request
        const response = await apiClient.post('/charts/', data); // Use trailing slash
        return response.data;
    } catch (error: any) {
        console.error('API Error creating chart:', error.response || error.message);
        // Re-throw the error specific part if available
        const detail = error.response?.data?.detail || 'Unknown error creating chart.';
        throw new Error(detail); // Throw a standard Error
    }
};

// --- Interceptors ---

// Interceptors for handling common errors or adding headers
apiClient.interceptors.response.use(
    (response) => response, // Simply return successful responses
    (error) => {
        // Log detailed error information
        console.error(
            'API Error:', 
            error.response?.status, 
            error.response?.data?.detail || error.message
        );
        // TODO: Handle specific status codes globally if needed (e.g., 401 for logout)
        // if (error.response?.status === 401) {
        //   console.log('Unauthorized, logging out...');
        //   // Call logout function from authStore
        // }
        return Promise.reject(error); // Propagate the error
    }
);

// The following fetch-based implementation will be removed.
/*
const API_BASE_URL_FETCH = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface RequestOptionsFetch extends RequestInit {
  // We can add custom options here later if needed
}

async function apiClientFetch<T>(
  endpoint: string,
  options: RequestOptionsFetch = {}
): Promise<T> {
  const url = `${API_BASE_URL_FETCH}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // TODO: Add token to headers if available (from authStore)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Attempt to parse error from backend if JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Not a JSON error, or error parsing JSON
      }
      console.error('API Error:', response.status, response.statusText, errorData);
      throw new Error(errorData?.detail || response.statusText || 'API request failed');
    }

    // Handle cases where the response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T; // Or handle as appropriate for your app
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error('Network or other error in apiClient:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Example GET, POST, etc. functions (can be expanded)
export function get<T>(endpoint: string, options: RequestOptionsFetch = {}): Promise<T> {
  return apiClientFetch<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T, U>(endpoint: string, body: U, options: RequestOptionsFetch = {}): Promise<T> {
  return apiClientFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
}

export function put<T, U>(endpoint: string, body: U, options: RequestOptionsFetch = {}): Promise<T> {
  return apiClientFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
}

export function del<T>(endpoint: string, options: RequestOptionsFetch = {}): Promise<T> {
  return apiClientFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

// You might want to add PATCH as well:
// export function patch<T, U>(endpoint: string, body: U, options: RequestOptionsFetch = {}): Promise<T> {
//   return apiClientFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
// }
*/ 