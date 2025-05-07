import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const LogoutButton: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLogout = () => {
    logout();
    // Optional: Redirect to home or login page after logout
    // window.location.href = '/'; 
  };

  if (!isAuthenticated) {
    return null; // Don't render if not authenticated
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Logout
    </button>
  );
};

export default LogoutButton; 