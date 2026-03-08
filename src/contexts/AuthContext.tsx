import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { googleSheetsService } from '../services/googleSheets';

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fleet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    setError(null);
    try {
      const data = await googleSheetsService.login(credentials);
      setUser(data);
      localStorage.setItem('fleet_user', JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    }
  };

  const register = async (data: any) => {
    setError(null);
    try {
      await googleSheetsService.register(data);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Erro de conexão com o servidor';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fleet_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
