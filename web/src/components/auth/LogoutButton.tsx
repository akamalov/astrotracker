import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const LogoutButton: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    // Optional: Redirect after logout. This might be better handled
    // in the layout or page observing the auth state change.
    // window.location.href = '/login'; 
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      Logout
    </button>
  );
};

export default LogoutButton; 