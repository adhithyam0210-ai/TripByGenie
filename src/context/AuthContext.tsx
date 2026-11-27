import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import { User, Agency, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  agency: Agency | null;
  token: string | null;
  role: UserRole | null;
  isAdminSession: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  currentAgency: Agency | null;
  login: (email: string, password: string) => Promise<UserRole>;
  demoLogin: (role: UserRole, agency_slug?: string) => Promise<UserRole>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  switchAgency: (agency_id: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  getRoleDashboardPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRoleDashboardPath = (role?: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'sales':
    case 'staff':
      return '/staff/dashboard';
    case 'operations':
      return '/operations/dashboard';
    case 'agent':
      return '/agent/dashboard';
    case 'customer':
      return '/customer/dashboard';
    default:
      return '/';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tg_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
        setAgency(data.agency);
        setToken(storedToken);
        if (data.user?.role === 'admin') {
          setIsAdminSession(true);
          try {
            localStorage.setItem('tg_admin_session', 'true');
          } catch {}
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        removeAuthToken();
        setUser(null);
        setAgency(null);
        setToken(null);
        setIsAdminSession(false);
        try {
          localStorage.removeItem('tg_admin_session');
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setAgency(data.agency);
      const isAdm = data.user.role === 'admin';
      setIsAdminSession(isAdm);
      try {
        if (isAdm) {
          localStorage.setItem('tg_admin_session', 'true');
        } else {
          localStorage.removeItem('tg_admin_session');
        }
      } catch {}
      return data.user.role;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole, agency_slug?: string): Promise<UserRole> => {
    setIsLoading(true);
    try {
      const data = await api.demoLogin(role, agency_slug);
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setAgency(data.agency);
      // Keep admin session active during role switching for testing
      return data.user.role;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<any> => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.token) {
        setAuthToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setAgency(res.agency);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    setAgency(null);
    setIsAdminSession(false);
    try {
      localStorage.removeItem('tg_admin_session');
    } catch {}
    navigate('/login');
  };

  const switchAgency = async (agency_id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await api.switchAgency(agency_id);
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setAgency(data.agency);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agency,
        currentAgency: agency,
        token,
        role: user ? user.role : null,
        isAdminSession,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading,
        login,
        demoLogin,
        register,
        logout,
        switchAgency,
        updateUser,
        getRoleDashboardPath
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
