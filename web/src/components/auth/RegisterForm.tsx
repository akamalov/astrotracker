import React, { useState } from 'react';
import { apiClient } from '../../lib/apiClient';

// Define a proper type for the user object returned by the register endpoint
// Based on FastAPI Users UserRead schema
interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  // Add other relevant user fields if your schema differs
}

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // FastAPI Users register endpoint expects JSON body
      const registrationData = {
        email: email,
        password: password,
      };

      const registeredUser = await apiClient.post<UserRead>(
        '/auth/register',
        registrationData
      );

      console.log('Registration successful:', registeredUser);
      setSuccess(
        'Registration successful! Please check your email for verification (if enabled), or proceed to login.'
      );
      // Optionally clear form fields on success
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Note: Typically, you don't log the user in automatically after registration.
      // They might need to verify their email first, or just log in separately.

    } catch (err: any) {
      console.error('Registration failed:', err);
      // Handle specific FastAPI Users error details if available
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to register. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
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
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${password !== confirmPassword && confirmPassword.length > 0 ? 'border-red-500' : ''}`}
            id="confirmPassword"
            type="password"
            placeholder="******************"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          {password !== confirmPassword && confirmPassword.length > 0 && (
             <p className="text-red-500 text-xs italic">Passwords do not match.</p>
          )}
        </div>
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            type="submit"
            disabled={loading || (password !== confirmPassword && confirmPassword.length > 0)}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
       {/* Optional: Add Google login here too if desired, though usually on login page */}
       {/* <div className="mt-4 border-t pt-4">...</div> */}
      <p className="text-center text-gray-500 text-xs mt-4">
        Already have an account? <a href="/login" className="text-blue-500 hover:text-blue-800">Login here</a>
      </p>
    </div>
  );
};

export default RegisterForm; 