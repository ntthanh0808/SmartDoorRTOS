import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = jwtDecode(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          id: payload.sub,
          role: payload.role,
          fullName: localStorage.getItem('fullName') || '',
        });
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token, role, fullName) => {
    localStorage.setItem('token', token);
    localStorage.setItem('fullName', fullName);
    const payload = jwtDecode(token);
    setUser({ id: payload.sub, role, fullName });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
