import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from '../utils/jwt';
import { setAuthToken, clearAuthToken, setOnUnauthorized } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register 401 handler — clears all auth state without navigating explicitly;
    // the conditional navigator in AppNavigator will swap to LoginScreen automatically.
    setOnUnauthorized(() => {
      clearAuthToken();
      setUser(null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const payload = jwtDecode(token);
          if (payload && payload.exp * 1000 > Date.now()) {
            setAuthToken(token);
            const fullName = (await SecureStore.getItemAsync('fullName')) || '';
            setUser({ id: payload.sub, role: payload.role, fullName });
          } else {
            await SecureStore.deleteItemAsync('token');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token, role, fullName) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('fullName', fullName);
    setAuthToken(token);
    const payload = jwtDecode(token);
    setUser({ id: payload.sub, role, fullName });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('fullName');
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
