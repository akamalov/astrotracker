import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TODO: Define a proper type for the user object based on the API response
interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  // Add other relevant user fields
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void; // Might be needed for OAuth callback
  setUser: (user: User) => void;
}

// Persist the store to localStorage to keep user logged in across sessions
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (user, token) =>
        set({ isAuthenticated: true, user, token }),
      logout: () => set({ isAuthenticated: false, user: null, token: null }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user, isAuthenticated: !!user }), // Set isAuthenticated based on user presence
    }),
    {
      name: 'auth-storage', // Name of the item in storage (must be unique)
      // Optional: Choose storage type (localStorage is default)
      // storage: createJSONStorage(() => sessionStorage), 
    }
  )
); 