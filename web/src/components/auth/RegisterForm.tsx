import React, { useState, type FormEvent } from 'react';
// import { useAuthStore } from '../../stores/authStore'; // Not typically used directly on registration
import apiClient from '../../lib/apiClient'; // Assuming apiClient is default export

// Define a type for the user returned by FastAPI Users on successful registration
interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  // Add other fields your UserRead schema might have
}

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const login = useAuthStore((state) => state.login); // Auto-login after register?

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);

    try {
      const payload = { email, password };
      // FastAPI Users /register endpoint expects JSON
      const responseUser = await apiClient.post<UserRead, typeof payload>(
        '/auth/register', 
        payload
        // Headers are default JSON for axios post if not overridden
      );

      setSuccessMessage(`Registration successful for ${responseUser.email}! Please check your email to verify your account if verification is enabled, then login.`);
      // Optionally, you could automatically log the user in here if desired
      // by fetching a token and calling the login action from authStore.
      // For now, just show success and let them log in separately.
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to register. Please try again.');
      console.error("Registration error:", err.response || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Register</h2>
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center mb-4">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="emailReg" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="emailReg"
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
          <label htmlFor="passwordReg" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="passwordReg"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirmPasswordReg" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPasswordReg"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
       <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Login here
        </a>
      </p>
    </div>
  );
};

export default RegisterForm; 