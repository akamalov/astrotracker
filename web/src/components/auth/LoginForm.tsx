import React, { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import apiClient from "../../lib/apiClient";

// Get base URL from apiClient's defaults (or directly from env var)
const API_BASE_URL = apiClient.defaults.baseURL;

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // FastAPI Users login expects form data with 'username' (which is email)
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // Login request (sets the cookie automatically via withCredentials)
      await apiClient.post("/auth/jwt/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // After successful login, fetch user details
      const response = await apiClient.get("/users/me");
      const userData = response.data;

      // Update Zustand store
      login(userData);

      // Redirect to dashboard on successful login
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login Error:", err);
      const errorMsg =
        err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setLoading(true);
    try {
      // Directly navigate the browser to the backend authorize endpoint.
      // The backend will return a 302 redirect which the browser will follow.
      const backendAuthorizeUrl = `${API_BASE_URL}/auth/google/authorize`;
      console.log("Redirecting browser to backend authorize URL:", backendAuthorizeUrl);
      window.location.href = backendAuthorizeUrl;
      
      // No need to setLoading(false) here as the page will navigate away

    } catch (err: any) { 
      // This catch block likely won't be hit for navigation errors, 
      // but keep it for unexpected issues during URL construction.
      console.error("Google Login Setup Error:", err);
      setError("Failed to initiate Google login.");
      setLoading(false); // Set loading false if navigation fails immediately
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Login
        </h2>
        {error && (
          <p className="mb-4 text-center text-red-500 text-sm">{error}</p>
        )}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
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
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
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
          />
          {/* Optional: Add forgot password link here */}
        </div>
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading}
          >
            {/* Basic Google Icon Placeholder - replace with actual SVG if desired */}
            <span className="sr-only">Sign in with Google</span>
            <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.896 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"></path>
            </svg>
            {loading ? "Redirecting..." : "Sign in with Google"}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;{new Date().getFullYear()} AstroTracker. All rights reserved.
      </p>
    </div>
  );
}

export default LoginForm; 