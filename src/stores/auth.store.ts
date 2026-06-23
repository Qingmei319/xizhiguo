import { create } from 'zustand';
import { getCurrentUser, loginApi, type LoginPayload } from '@/services/auth.service';
import { defaultUser, mockToken } from '@/services/mock/auth.mock';
import type { UserInfo } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  restoreUser: () => Promise<void>;
  logout: () => void;
}

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const useAuthStore = create<AuthState>((set) => ({
  token: useMockAuth ? mockToken : localStorage.getItem('rag_token'),
  user: useMockAuth ? defaultUser : (JSON.parse(localStorage.getItem('rag_user') || 'null') as UserInfo | null),
  loading: false,

  login: async (payload) => {
    set({ loading: true });
    try {
      const { token, user } = await loginApi(payload);
      localStorage.setItem('rag_token', token);
      localStorage.setItem('rag_user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  restoreUser: async () => {
    if (useMockAuth) {
      localStorage.setItem('rag_token', mockToken);
      localStorage.setItem('rag_user', JSON.stringify(defaultUser));
      set({ token: mockToken, user: defaultUser, loading: false });
      return;
    }

    const token = localStorage.getItem('rag_token');
    if (!token) return;

    set({ loading: true });
    try {
      const user = await getCurrentUser();
      localStorage.setItem('rag_user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch {
      localStorage.removeItem('rag_token');
      localStorage.removeItem('rag_user');
      set({ token: null, user: null, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('rag_token');
    localStorage.removeItem('rag_user');
    set({ token: null, user: null });
  },
}));
