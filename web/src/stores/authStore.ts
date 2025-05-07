import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the shape of the User object (adjust based on your UserRead schema)
interface User {
  id: string; // Assuming UUID from UserRead schema
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  // Add other fields from your UserRead schema if needed
}

// Define the state structure
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null; // Store token if needed, though cookie might be primary mechanism
  setAuthState: (isAuthenticated: boolean, user: User | null, token?: string | null) => void;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setToken: (token: string | null) => void; // Might be useful for OAuth flows
}

// Create the store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      setAuthState: (isAuthenticated, user, token = null) =>
        set({ isAuthenticated, user, token }),
      login: (userData, token) => set({ isAuthenticated: true, user: userData, token }),
      logout: () => {
        // TODO: Call API endpoint to invalidate session/token on backend if necessary
        set({ isAuthenticated: false, user: null, token: null });
        // Optionally clear other related storage or redirect
        // localStorage.removeItem('some-other-key'); // Example
        // window.location.href = '/login'; // Example redirect
      },
      setToken: (token) => set({ token }), // Could also update isAuthenticated based on token presence
    }),
    {
      name: "auth-storage", // Name of the item in storage (localStorage by default)
      storage: createJSONStorage(() => localStorage), // Use localStorage
      // Optionally, specify which parts of the state to persist
      // partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);

// Optional: Selector for convenience
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUser = (state: AuthState) => state.user;

// Optional: Export actions separately if preferred for component usage
// export const { login, logout, setToken } = useAuthStore.getState(); 