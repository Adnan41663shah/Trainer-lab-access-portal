import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    
    // Listen for 401 unauthorized events from api client
    const handleUnauthorized = () => {
      setUser(null);
      setError(null);
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      
      if (response.user) {
        setUser(response.user);
        setError(null);
      } else if (response.code === 'TOKEN_EXPIRED') {
        // Token expired but we got a 200 response (silent check)
        // Try to refresh
        try {
          await authAPI.refresh();
          const retryResponse = await authAPI.getMe();
          if (retryResponse.user) {
            setUser(retryResponse.user);
            setError(null);
          } else {
            setUser(null);
          }
        } catch (refreshErr) {
          setUser(null);
        }
      } else {
        // Not authenticated
        setUser(null);
        setError(null);
      }
    } catch (err) {
      console.log('Auth check failed:', err);
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      setUser(response.user);
      setError(null);
      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      const fieldErrors = err.response?.data?.fieldErrors || {};
      setError(errorMessage);
      return { success: false, message: errorMessage, fieldErrors };
    }
  };

  const login = async (data) => {
    try {
      const response = await authAPI.login(data);
      setUser(response.user);
      setError(null);
      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      const fieldErrors = err.response?.data?.fieldErrors || {};
      setError(errorMessage);
      return { success: false, message: errorMessage, fieldErrors };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
