import React, { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../lib/apiClient'; // Assuming apiClient is default export or has post method

// Define a type for the login response if you expect specific data back
// interface LoginResponse {
//   access_token: string;
//   token_type: string;
//   user: { /* user details */ };
// }

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  // Get base URL for constructing Google OAuth URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // NOTE: FastAPI Users /login endpoint expects form data (username, password), not JSON.
      // We need to send data as FormData.
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI Users uses 'username' for email by default
      formData.append('password', password);

      // We need a way for apiClient to send form-urlencoded data
      // For now, let's assume apiClient.post can handle FormData or we adapt it.
      // This might require a custom config for this specific call.
      const response = await apiClient.post<any, URLSearchParams>( // TODO: Define LoginResponse type
        '/auth/jwt/login', // Default FastAPI Users login URL
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      // Assuming the response contains the access token and user details
      // Adjust based on your actual backend response structure
      // const { access_token, user } = response; // If response is the data directly
      const token = response.data.access_token; // Adjusted to access response.data.access_token
      
      // Fetch user details separately if not included in login response
      // const userDetailsResponse = await apiClient.get<User>('/users/me');
      // login(userDetailsResponse, token);
      
      // For now, assuming login is successful and we might not get full user data back
      // We'll call the store's login, which expects user object and token.
      // This part needs to align with your actual /login response and how you get user data.
      // Placeholder user data until /users/me is called or login returns it.
      const placeholderUser = { 
        id: 'temp-user-id', // This will be overwritten by actual data from /users/me
        email: email, 
        is_active: true, 
        is_superuser: false, 
        is_verified: true, // Assuming JWT login implies verified for this flow
        // Add other fields as per your UserRead schema in authStore, e.g., roles: []
      };
      login(placeholderUser, token); // The login action in authStore expects a User object and token

      // Optionally redirect or clear form
      // window.location.href = '/dashboard'; // Example redirect
      setEmail('');
      setPassword('');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to login. Please check your credentials.');
      console.error("Login error:", err.response || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading(true); // Show loading state while redirecting
    try {
      // Construct the backend URL for Google OAuth initiation
      // This assumes your FastAPI Users backend has Google OAuth router at /auth/google
      // and the authorization endpoint is named 'authorize'
      // Adjust if your backend routes are different.
      const googleAuthorizeUrl = `${API_BASE_URL.replace('/api/v1','')}/auth/google/authorize`;
      console.log("Redirecting to Google OAuth: ", googleAuthorizeUrl);
      window.location.href = googleAuthorizeUrl;
      // No need to setIsLoading(false) here as the page will navigate away.
    } catch (err: any) {
      console.error("Google Login initiation error:", err);
      setError("Could not initiate Google login. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        {/* TODO: Add "Forgot password?" link */}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-6">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading} // Disable while other operations are in progress
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
          >
            {/* Basic Google Icon SVG - consider a proper icon library or image */}
            <svg className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 118.3 512 0 398.5 0 256S118.3 0 244 0c69.3 0 125.3 23.4 172.9 65.6l-69.5 69.5c-22.3-20.8-53.2-33.6-89.3-33.6-68.3 0-124.2 55.2-124.2 123.1s55.9 123.1 124.2 123.1c76.3 0 104.8-49.6 109.7-75.7H244V261.8h244z"></path>
            </svg>
            {isLoading ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
       <p className="mt-4 text-center text-sm text-gray-600">
        Not a member?{' '}
        <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Register here
        </a>
      </p>
    </div>
  );
};

export default LoginForm; 