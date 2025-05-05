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