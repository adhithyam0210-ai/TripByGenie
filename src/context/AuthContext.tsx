import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import { User, Agency, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  agency: Agency | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  demoLogin: (role: UserRole, agency_slug?: string) => Promise<UserRole>;
  register: (data: any) => Promise<void>;
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
    case 'staff':
      return '/staff/dashboard';
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
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        removeAuthToken();
        setUser(null);
        setAgency(null);
        setToken(null);
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
      return data.user.role;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setAgency(res.agency);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    setAgency(null);
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
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
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
