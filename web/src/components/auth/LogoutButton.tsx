import React from "react";
import { useAuthStore } from "../../stores/authStore";
import apiClient from "../../lib/apiClient";

function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint (optional but good practice)
      // This endpoint might invalidate the cookie/session on the server side
      await apiClient.post("/auth/jwt/logout");
    } catch (error) {
      console.error("Error during backend logout:", error);
      // Proceed with client-side logout even if backend call fails
    } finally {
      // Clear client-side state
      logout();
      // Redirect to home page
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      Logout
    </button>
  );
}

export default LogoutButton; 