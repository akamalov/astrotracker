import React, { useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/authStore';

// Assuming the API returns User object similar to the store's definition on /users/me
// And { access_token: string, token_type: 'bearer' } on /auth/jwt/login
interface LoginResponse {
  access_token: string;
  token_type: string; 
}

// Define a proper type for the user object based on the API response for /users/me
interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  // Add other relevant user fields from your UserRead schema in FastAPI
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // FastAPI Users JWT login expects form data
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', email);
      loginFormData.append('password', password);

      const loginResponse = await apiClient.post<LoginResponse>(
        '/auth/jwt/login',
        loginFormData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const token = loginResponse.access_token;

      // After getting token, set it in the store *before* fetching user details
      // This way the apiClient will automatically use it for the next request
      useAuthStore.setState({ token });

      // Fetch user details using the new token
      const userData = await apiClient.get<User>('/users/me');

      // Now login with user details and token
      login(userData, token);

      // Redirect handled by the parent page/layout after successful login
      // Example: window.location.href = '/dashboard';

    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      // Ensure token/user is cleared if login fails midway
      useAuthStore.getState().logout();
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for Google OAuth URL - adjust based on your backend setup
  const googleLoginUrl = `${apiClient.getBaseUrl()}/auth/google/authorize`; // Assumes apiClient exposes base URL or use hardcoded one
  // Correction: apiClient doesn't expose baseUrl, need to construct it or import from a config if we had one.
  // For now, reconstruct using the hardcoded base URL from apiClient.ts
  const API_BASE_URL = 'http://localhost:8000/api/v1'; // Re-declare or import if refactored
  const googleLoginRedirectUrl = `${API_BASE_URL}/auth/google/authorize`;


  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </div>
      </form>
       <div className="mt-4 border-t pt-4">
          <a 
            href={googleLoginRedirectUrl} 
            className="block w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-center disabled:opacity-50"
            // Optional: Add loading state if needed, though it's a redirect
            // disabled={loading} 
          >
            Login with Google
          </a>
      </div>
      <p className="text-center text-gray-500 text-xs mt-4">
        Don't have an account? <a href="/register" className="text-blue-500 hover:text-blue-800">Register here</a>
      </p>
    </div>
  );
};

export default LoginForm; 